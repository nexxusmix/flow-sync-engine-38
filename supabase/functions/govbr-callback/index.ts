import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações gov.br
const GOVBR_CLIENT_ID = Deno.env.get('GOVBR_CLIENT_ID') || '';
const GOVBR_CLIENT_SECRET = Deno.env.get('GOVBR_CLIENT_SECRET') || '';
const GOVBR_TOKEN_URL = 'https://sso.acesso.gov.br/token';
const GOVBR_USERINFO_URL = 'https://sso.acesso.gov.br/userinfo';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const state = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    const simulated = url.searchParams.get('simulated') === 'true';
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Erro retornado pelo gov.br:', error);
      return new Response(
        generateErrorPage('Erro na autenticação: ' + error),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    if (!state) {
      return new Response(
        generateErrorPage('State token ausente'),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    console.log(`Processando callback gov.br - state: ${state}, simulated: ${simulated}`);

    // Buscar sessão pelo state token
    const { data: session, error: sessionError } = await supabase
      .from('govbr_signing_sessions')
      .select('*')
      .eq('state_token', state)
      .eq('status', 'pending')
      .single();

    if (sessionError || !session) {
      console.error('Sessão não encontrada ou já processada:', sessionError);
      return new Response(
        generateErrorPage('Sessão de assinatura inválida ou expirada'),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Verificar expiração
    if (new Date(session.expires_at) < new Date()) {
      await supabase
        .from('govbr_signing_sessions')
        .update({ status: 'expired' })
        .eq('id', session.id);

      return new Response(
        generateErrorPage('Sessão expirada. Por favor, tente novamente.'),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    let signerData: {
      cpf: string;
      name: string;
      email: string;
      rawPayload: Record<string, unknown>;
    };

    if (simulated) {
      // Modo simulado - dados fictícios para testes
      console.log('Usando modo simulado');
      signerData = {
        cpf: '000.000.000-00',
        name: 'Usuário Teste (Simulado)',
        email: 'teste@govbr.simulado.br',
        rawPayload: {
          simulated: true,
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      // Modo produção - trocar code por token e buscar userinfo
      if (!code) {
        return new Response(
          generateErrorPage('Código de autorização ausente'),
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }

      try {
        // Trocar code por access_token
        const tokenResponse = await fetch(GOVBR_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            client_id: GOVBR_CLIENT_ID,
            client_secret: GOVBR_CLIENT_SECRET,
            redirect_uri: Deno.env.get('GOVBR_REDIRECT_URI') || '',
          }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
          throw new Error('Falha ao obter token de acesso');
        }

        // Buscar dados do usuário
        const userInfoResponse = await fetch(GOVBR_USERINFO_URL, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        const userInfo = await userInfoResponse.json();

        signerData = {
          cpf: userInfo.sub || userInfo.cpf || '',
          name: userInfo.name || '',
          email: userInfo.email || '',
          rawPayload: userInfo,
        };
      } catch (apiError) {
        console.error('Erro na API gov.br:', apiError);
        return new Response(
          generateErrorPage('Erro ao processar autenticação gov.br'),
          { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        );
      }
    }

    // Criar assinatura no banco
    const { error: signatureError } = await supabase
      .from('contract_signatures')
      .insert({
        contract_id: session.contract_id,
        signer_name: signerData.name,
        signer_email: signerData.email,
        signer_cpf: signerData.cpf,
        signature_type: 'govbr',
        provider: 'govbr',
        document_hash: session.document_hash,
        raw_payload: signerData.rawPayload,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });

    if (signatureError) {
      console.error('Erro ao criar assinatura:', signatureError);
      return new Response(
        generateErrorPage('Erro ao registrar assinatura'),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Atualizar status do contrato
    await supabase
      .from('contracts')
      .update({ status: 'signed', updated_at: new Date().toISOString() })
      .eq('id', session.contract_id);

    // Marcar sessão como completa
    await supabase
      .from('govbr_signing_sessions')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      })
      .eq('id', session.id);

    // Registrar evento de auditoria
    await supabase
      .from('event_logs')
      .insert({
        entity_type: 'contract',
        entity_id: session.contract_id,
        action: 'signed_govbr',
        payload: {
          signer_cpf: signerData.cpf,
          signer_name: signerData.name,
          document_hash: session.document_hash,
          simulated: simulated,
        },
      });

    console.log(`Contrato ${session.contract_id} assinado com sucesso via gov.br`);

    // Redirecionar de volta para a página do contrato
    const returnUrl = session.return_url || `/contratos/${session.contract_id}/client`;
    
    return new Response(
      generateSuccessPage(signerData.name, returnUrl),
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      generateErrorPage('Erro interno do servidor'),
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
});

function generateSuccessPage(signerName: string, returnUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato Assinado - SQUAD Hub</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 40px;
      max-width: 500px;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: rgba(16, 185, 129, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg { width: 40px; height: 40px; color: #10b981; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #9ca3af; margin-bottom: 24px; }
    .signer { 
      background: rgba(255,255,255,0.1); 
      padding: 12px 20px; 
      border-radius: 8px; 
      margin-bottom: 24px;
    }
    .signer strong { color: #10b981; }
    .btn {
      display: inline-block;
      background: #8b5cf6;
      color: #fff;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn:hover { background: #7c3aed; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
    </div>
    <h1>Contrato Assinado com Sucesso!</h1>
    <p>Sua assinatura digital foi registrada via gov.br</p>
    <div class="signer">
      Assinado por: <strong>${signerName}</strong>
    </div>
    <a href="${returnUrl}" class="btn">Voltar ao Contrato</a>
  </div>
  <script>
    // Auto-redirect após 5 segundos
    setTimeout(() => { window.location.href = "${returnUrl}"; }, 5000);
  </script>
</body>
</html>
  `;
}

function generateErrorPage(message: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erro - SQUAD Hub</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 40px;
      max-width: 500px;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: rgba(239, 68, 68, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg { width: 40px; height: 40px; color: #ef4444; }
    h1 { font-size: 24px; margin-bottom: 12px; color: #ef4444; }
    p { color: #9ca3af; margin-bottom: 24px; }
    .btn {
      display: inline-block;
      background: #374151;
      color: #fff;
      padding: 12px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn:hover { background: #4b5563; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </div>
    <h1>Erro na Assinatura</h1>
    <p>${message}</p>
    <a href="javascript:history.back()" class="btn">Voltar</a>
  </div>
</body>
</html>
  `;
}
