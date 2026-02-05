import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações gov.br (serão obtidas via secrets quando disponíveis)
const GOVBR_CLIENT_ID = Deno.env.get('GOVBR_CLIENT_ID') || '';
const GOVBR_REDIRECT_URI = Deno.env.get('GOVBR_REDIRECT_URI') || '';
const GOVBR_AUTH_URL = 'https://sso.acesso.gov.br/authorize';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { contractId, returnUrl } = await req.json();

    if (!contractId) {
      return new Response(
        JSON.stringify({ error: 'contractId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Iniciando assinatura gov.br para contrato: ${contractId}`);

    // Buscar contrato e última versão
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) {
      console.error('Contrato não encontrado:', contractError);
      return new Response(
        JSON.stringify({ error: 'Contrato não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar última versão do contrato
    const { data: version } = await supabase
      .from('contract_versions')
      .select('body_rendered')
      .eq('contract_id', contractId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    // Gerar hash do documento
    const documentContent = version?.body_rendered || `Contrato ${contract.project_name}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(documentContent);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const documentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Gerar state token único
    const stateToken = crypto.randomUUID().replace(/-/g, '');

    // Criar sessão de assinatura
    const { data: session, error: sessionError } = await supabase
      .from('govbr_signing_sessions')
      .insert({
        contract_id: contractId,
        state_token: stateToken,
        document_hash: documentHash,
        return_url: returnUrl || null,
        status: 'pending',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Erro ao criar sessão:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar sessão de assinatura' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sessão criada: ${session.id}, hash: ${documentHash.substring(0, 16)}...`);

    // Verificar se credenciais gov.br estão configuradas
    if (!GOVBR_CLIENT_ID || !GOVBR_REDIRECT_URI) {
      console.log('Credenciais gov.br não configuradas - retornando modo simulado');
      
      // Modo simulado: retorna URL para callback interno que simula gov.br
      const simulatedCallbackUrl = `${supabaseUrl}/functions/v1/govbr-callback?state=${stateToken}&simulated=true`;
      
      return new Response(
        JSON.stringify({
          success: true,
          mode: 'simulated',
          message: 'Credenciais gov.br não configuradas. Usando modo simulado.',
          redirectUrl: simulatedCallbackUrl,
          sessionId: session.id,
          documentHash: documentHash,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // URL de autorização gov.br real
    const govbrParams = new URLSearchParams({
      response_type: 'code',
      client_id: GOVBR_CLIENT_ID,
      scope: 'openid email profile govbr_confiabilidades',
      redirect_uri: GOVBR_REDIRECT_URI,
      state: stateToken,
      nonce: crypto.randomUUID(),
    });

    const redirectUrl = `${GOVBR_AUTH_URL}?${govbrParams.toString()}`;

    return new Response(
      JSON.stringify({
        success: true,
        mode: 'production',
        redirectUrl: redirectUrl,
        sessionId: session.id,
        documentHash: documentHash,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
