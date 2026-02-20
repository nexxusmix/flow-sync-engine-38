import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MilestoneInput {
  description: string;
  amount: number;
  due_date: string;
}

function parsePaymentTerms(
  paymentTerms: string | null,
  totalValue: number,
  startDate: string
): MilestoneInput[] {
  if (!paymentTerms || !totalValue) {
    return defaultMilestones(totalValue, startDate);
  }

  const terms = paymentTerms.toLowerCase().trim();

  // Pattern: "entrada + N parcelas"
  const entradaMatch = terms.match(/entrada\s*\+\s*(\d+)\s*parcela/);
  if (entradaMatch) {
    const numInstallments = parseInt(entradaMatch[1]);
    const total = numInstallments + 1;
    const perInstallment = Math.round((totalValue / total) * 100) / 100;
    const firstAmount = totalValue - perInstallment * numInstallments;

    const milestones: MilestoneInput[] = [
      { description: `Entrada (1/${total})`, amount: firstAmount, due_date: startDate },
    ];

    for (let i = 1; i <= numInstallments; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      milestones.push({
        description: `Parcela ${i + 1}/${total}`,
        amount: perInstallment,
        due_date: date.toISOString().split("T")[0],
      });
    }
    return milestones;
  }

  // Pattern: "Nx" or "N parcelas" or "N vezes"
  const nxMatch = terms.match(/(\d+)\s*(?:x|parcela|vezes)/);
  if (nxMatch) {
    const num = parseInt(nxMatch[1]);
    if (num > 0 && num <= 36) {
      const perInstallment = Math.round((totalValue / num) * 100) / 100;
      const milestones: MilestoneInput[] = [];
      for (let i = 0; i < num; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        const amount = i === 0 ? totalValue - perInstallment * (num - 1) : perInstallment;
        milestones.push({
          description: `Parcela ${i + 1}/${num}`,
          amount,
          due_date: date.toISOString().split("T")[0],
        });
      }
      return milestones;
    }
  }

  // Pattern: percentages like "50% + 50%" or "40% + 40% + 20%"
  const percentMatches = terms.match(/(\d+)\s*%/g);
  if (percentMatches && percentMatches.length >= 2) {
    const percents = percentMatches.map((p) => parseInt(p.replace("%", "")));
    const sum = percents.reduce((a, b) => a + b, 0);
    if (sum >= 95 && sum <= 105) {
      const milestones: MilestoneInput[] = [];
      for (let i = 0; i < percents.length; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        milestones.push({
          description: `Parcela ${i + 1}/${percents.length} (${percents[i]}%)`,
          amount: Math.round((totalValue * percents[i]) / 100 * 100) / 100,
          due_date: date.toISOString().split("T")[0],
        });
      }
      return milestones;
    }
  }

  return defaultMilestones(totalValue, startDate);
}

function defaultMilestones(totalValue: number, startDate: string): MilestoneInput[] {
  const halfValue = Math.round((totalValue / 2) * 100) / 100;
  const secondHalf = totalValue - halfValue;
  const secondDate = new Date(startDate);
  secondDate.setDate(secondDate.getDate() + 30);

  return [
    { description: "Entrada na assinatura (50%)", amount: halfValue, due_date: startDate },
    { description: "Parcela final na entrega (50%)", amount: secondHalf, due_date: secondDate.toISOString().split("T")[0] },
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { fileBase64, mimeType, fileName, project_id, workspace_id } = await req.json();

    if (!fileBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ error: "fileBase64 e mimeType são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file size (base64 is ~1.37x larger than binary)
    const estimatedBytes = (fileBase64.length * 3) / 4;
    if (estimatedBytes > 20 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Arquivo muito grande. Máximo 20MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Configuração de IA não encontrada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build multimodal content for Gemini
    const userContent: unknown[] = [
      {
        type: "text",
        text: `Você é um especialista em análise de contratos e propostas comerciais brasileiras.

Analise o documento enviado e extraia todos os dados relevantes para criação de um contrato.

Procure por:
- Nome do cliente / contratante
- Email do cliente
- CPF ou CNPJ do cliente
- Valor total do contrato (em reais)
- Condições de pagamento (ex: "50% entrada + 50% entrega", "entrada + 2 parcelas", "3x mensais")
- Data de início
- Data de término/entrega
- Escopo/descrição do serviço (resumo em até 3 linhas)

Use a função extract_contract_data para retornar os dados estruturados.
Se um campo não for mencionado no documento, retorne null para ele.
Para total_value, retorne apenas o número (sem R$ ou pontos/vírgulas de separação de milhares).`,
      },
      {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${fileBase64}`,
        },
      },
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "extract_contract_data",
          description: "Extrai dados estruturados de um contrato ou proposta comercial",
          parameters: {
            type: "object",
            properties: {
              client_name: { type: "string", description: "Nome completo do cliente/contratante" },
              client_email: { type: "string", description: "Email do cliente" },
              client_document: { type: "string", description: "CPF ou CNPJ do cliente" },
              total_value: { type: "number", description: "Valor total em reais (apenas número)" },
              payment_terms: { type: "string", description: "Condições de pagamento resumidas" },
              start_date: { type: "string", description: "Data de início no formato YYYY-MM-DD" },
              end_date: { type: "string", description: "Data de término no formato YYYY-MM-DD" },
              project_name: { type: "string", description: "Nome do projeto ou serviço contratado" },
              notes: { type: "string", description: "Resumo do escopo do serviço (até 3 linhas)" },
            },
            required: ["client_name"],
            additionalProperties: false,
          },
        },
      },
    ];

    console.log("Calling Gemini to extract contract data from", fileName, mimeType);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userContent }],
        tools,
        tool_choice: { type: "function", function: { name: "extract_contract_data" } },
        max_tokens: 1000,
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
        JSON.stringify({ error: "Erro ao processar documento com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData).substring(0, 500));

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "Não foi possível extrair dados do documento. Verifique se o arquivo contém informações de contrato." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(toolCall.function.arguments);
    } catch {
      return new Response(
        JSON.stringify({ error: "Erro ao processar resposta da IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracted data:", extracted);

    // Determine start date
    const startDate = (extracted.start_date as string) || new Date().toISOString().split("T")[0];
    const totalValue = Number(extracted.total_value) || 0;

    // Fetch workspace_id from user profile if not provided
    let resolvedWorkspaceId = workspace_id;
    if (!resolvedWorkspaceId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("workspace_id")
        .eq("user_id", user.id)
        .single();
      resolvedWorkspaceId = profile?.workspace_id;
    }

    // Check if project already has a contract
    if (project_id) {
      const { data: existingContracts } = await supabaseAdmin
        .from("contracts")
        .select("id")
        .eq("project_id", project_id)
        .limit(1);

      if (existingContracts && existingContracts.length > 0) {
        // Return extracted data without saving - let frontend handle confirmation
        return new Response(
          JSON.stringify({
            extracted,
            existing_contract_id: existingContracts[0].id,
            message: "Projeto já possui contrato. Dados extraídos para revisão.",
            warning: "existing_contract",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Save contract
    const contractData: Record<string, unknown> = {
      project_name: (extracted.project_name as string) || fileName.replace(/\.[^.]+$/, ""),
      client_name: (extracted.client_name as string) || null,
      client_email: (extracted.client_email as string) || null,
      client_document: (extracted.client_document as string) || null,
      total_value: totalValue || null,
      payment_terms: (extracted.payment_terms as string) || null,
      start_date: startDate,
      end_date: (extracted.end_date as string) || null,
      notes: (extracted.notes as string) || null,
      status: "draft",
    };

    if (project_id) {
      contractData.project_id = project_id;
    } else {
      contractData.project_id = `ai-${Date.now()}`;
    }

    const { data: contract, error: contractError } = await supabaseAdmin
      .from("contracts")
      .insert(contractData)
      .select()
      .single();

    if (contractError) {
      console.error("Contract insert error:", contractError);
      return new Response(
        JSON.stringify({ error: "Erro ao salvar contrato", details: contractError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate revenue milestones if we have a value
    let createdRevenues = 0;
    if (totalValue > 0 && contract) {
      const milestones = parsePaymentTerms(
        (extracted.payment_terms as string) || null,
        totalValue,
        startDate
      );

      const revenueRows = milestones.map((m) => ({
        project_id: project_id || contract.project_id,
        contract_id: contract.id,
        description: `${contractData.project_name} — ${m.description}`,
        amount: m.amount,
        due_date: m.due_date,
        status: "pending",
        installment_group_id: contract.id,
        notes: `Gerado por IA a partir de: ${fileName}`,
        created_by: user.id,
      }));

      const { data: inserted, error: revenueError } = await supabaseAdmin
        .from("revenues")
        .insert(revenueRows)
        .select();

      if (revenueError) {
        console.error("Revenue insert error:", revenueError);
      } else {
        createdRevenues = inserted?.length || 0;
      }
    }

    const messageParts = ["Contrato criado com IA"];
    if (createdRevenues > 0) messageParts.push(`${createdRevenues} parcela(s) gerada(s)`);
    if (extracted.payment_terms) messageParts.push(`Condições: ${extracted.payment_terms}`);

    return new Response(
      JSON.stringify({
        extracted,
        contract_id: contract.id,
        created_revenues: createdRevenues,
        message: messageParts.join(" • "),
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
