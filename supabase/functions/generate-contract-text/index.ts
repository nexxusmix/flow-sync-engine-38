import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "_________";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function buildContractPrompt(data: {
  project_name: string;
  client_name: string;
  client_document: string;
  client_email: string;
  total_value: number;
  payment_terms: string;
  start_date: string;
  end_date: string;
  notes: string;
  contractor_name: string;
}): string {
  return `Você é um advogado especialista em contratos para produtoras audiovisuais brasileiras.

Gere o texto completo de um CONTRATO DE PRESTAÇÃO DE SERVIÇOS AUDIOVISUAIS com base nas informações abaixo. 
O contrato deve ser formal, juridicamente válido sob o Direito Brasileiro (Código Civil Lei 10.406/2002) e seguir as melhores práticas do setor audiovisual.

DADOS DO CONTRATO:
- Projeto: ${data.project_name}
- Contratante (cliente): ${data.client_name}
- CPF/CNPJ do contratante: ${data.client_document || "não informado"}
- Email do contratante: ${data.client_email || "não informado"}
- Contratada (produtora): ${data.contractor_name}
- Valor total: ${formatCurrency(data.total_value)}
- Condições de pagamento: ${data.payment_terms}
- Início: ${formatDate(data.start_date)}
- Entrega prevista: ${formatDate(data.end_date)}
- Escopo do serviço: ${data.notes || "Produção audiovisual conforme briefing acordado entre as partes."}

ESTRUTURA OBRIGATÓRIA DO CONTRATO (use exatamente estes títulos de cláusulas):

CONTRATO DE PRESTAÇÃO DE SERVIÇOS AUDIOVISUAIS

[Preâmbulo com identificação completa das partes]

CLÁUSULA 1ª – DO OBJETO
[Descrição clara do serviço contratado, produto final esperado, formato e especificações técnicas básicas]

CLÁUSULA 2ª – DO PRAZO
[Prazo de execução, data de início, data de entrega, condições de prorrogação]

CLÁUSULA 3ª – DO VALOR E DAS CONDIÇÕES DE PAGAMENTO
[Valor total, forma de pagamento detalhada com datas de vencimento de cada parcela, multa por atraso de 2% ao mês, juros de mora de 1% ao mês]

CLÁUSULA 4ª – DAS OBRIGAÇÕES DA CONTRATADA
[Mínimo 4 obrigações específicas para produtora audiovisual: qualidade técnica, cumprimento de prazo, comunicação, direitos autorais, etc.]

CLÁUSULA 5ª – DAS OBRIGAÇÕES DO CONTRATANTE
[Mínimo 4 obrigações: fornecimento de briefing, aprovação em prazo de 3 dias úteis, pagamento em dia, fornecimento de materiais necessários, etc.]

CLÁUSULA 6ª – DAS REVISÕES E ALTERAÇÕES
[Número de rodadas de revisão incluídas (padrão 2), prazo para solicitação, valor de revisões adicionais, escopo de alterações permitidas sem custo adicional]

CLÁUSULA 7ª – DOS DIREITOS AUTORAIS E PROPRIEDADE INTELECTUAL
[Transferência de direitos patrimoniais após quitação, direito moral da contratada, uso do projeto como portfólio, licença de uso dos materiais fornecidos]

CLÁUSULA 8ª – DA CONFIDENCIALIDADE
[Sigilo de informações, dados e estratégias do contratante, prazo de 2 anos após término do contrato]

CLÁUSULA 9ª – DA RESCISÃO CONTRATUAL
[Condições de rescisão por ambas as partes, multa rescisória de 20% sobre o valor total, aviso prévio de 15 dias, pagamento proporcional ao trabalho realizado]

CLÁUSULA 10ª – DAS DISPOSIÇÕES GERAIS
[Foro competente (cidade do contratado), integralidade do contrato, eleição de domicílio eletrônico para notificações, validade de comunicações por email]

[Local e data: _________________________, ___ de _________ de 2025]

CONTRATANTE:
Nome: ${data.client_name}
CPF/CNPJ: ${data.client_document || "_________________________"}
Assinatura: _________________________

CONTRATADA:
Nome: ${data.contractor_name}
Assinatura: _________________________

TESTEMUNHAS:
1. Nome: _________________________ CPF: _________________________
2. Nome: _________________________ CPF: _________________________

INSTRUÇÕES:
- Escreva o contrato completo com todas as cláusulas acima, substituindo os colchetes pelo texto jurídico real
- Use linguagem formal e técnica adequada ao Direito Brasileiro
- Seja específico com os dados fornecidos (valores em R$, datas formatadas, nome das partes)
- O contrato deve ter entre 800 e 1500 palavras
- NÃO use markdown, asteriscos ou formatação especial — apenas texto puro com quebras de linha
- Separe cada cláusula com uma linha em branco
- Use CLÁUSULA Xª – TÍTULO em letras maiúsculas para os títulos`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: authError } = await supabaseUser.auth.getClaims(token);
    if (authError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { contract_id } = await req.json();
    if (!contract_id) {
      return new Response(
        JSON.stringify({ error: "contract_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch contract data
    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      return new Response(
        JSON.stringify({ error: "Contrato não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch workspace/contractor info from profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, workspace_id")
      .eq("user_id", claimsData.claims.sub)
      .single();

    // Try to get workspace name from settings or use profile name
    let contractorName = profile?.full_name || "Produtora";
    const { data: wsSettings } = await supabaseAdmin
      .from("branding_settings")
      .select("footer_text")
      .eq("workspace_id", profile?.workspace_id)
      .maybeSingle();
    
    if (wsSettings?.footer_text) {
      contractorName = wsSettings.footer_text;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração de IA não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = buildContractPrompt({
      project_name: contract.project_name || "Projeto Audiovisual",
      client_name: contract.client_name || "Contratante",
      client_document: contract.client_document || "",
      client_email: (contract as Record<string, unknown>).client_email as string || "",
      total_value: Number(contract.total_value) || 0,
      payment_terms: contract.payment_terms || "50% na assinatura + 50% na entrega",
      start_date: contract.start_date || new Date().toISOString().split("T")[0],
      end_date: contract.end_date || "",
      notes: contract.notes || "",
      contractor_name: contractorName,
    });

    console.log("Generating contract text for contract:", contract_id);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao gerar texto do contrato" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const bodyText = aiData.choices?.[0]?.message?.content?.trim();

    if (!bodyText) {
      return new Response(
        JSON.stringify({ error: "IA não retornou conteúdo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine next version number
    const { data: existingVersions } = await supabaseAdmin
      .from("contract_versions")
      .select("version")
      .eq("contract_id", contract_id)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = (existingVersions?.[0]?.version || 0) + 1;

    // Save to contract_versions
    const { data: newVersion, error: versionError } = await supabaseAdmin
      .from("contract_versions")
      .insert({
        contract_id,
        version: nextVersion,
        body_rendered: bodyText,
        variables_filled: {
          project_name: contract.project_name,
          client_name: contract.client_name,
          client_document: contract.client_document,
          total_value: contract.total_value,
          payment_terms: contract.payment_terms,
          start_date: contract.start_date,
          end_date: contract.end_date,
          generated_by: "ai",
          model: "gemini-2.5-flash",
        },
      })
      .select()
      .single();

    if (versionError) {
      console.error("Version insert error:", versionError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar versão do contrato", details: versionError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update contract's current_version
    await supabaseAdmin
      .from("contracts")
      .update({ current_version: nextVersion })
      .eq("id", contract_id);

    console.log("Contract version created:", newVersion?.id, "version:", nextVersion);

    return new Response(
      JSON.stringify({
        version_id: newVersion?.id,
        version: nextVersion,
        body_preview: bodyText.substring(0, 200) + "...",
        message: `Texto jurídico gerado com IA • Versão ${nextVersion} salva`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
