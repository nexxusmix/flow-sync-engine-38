import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";

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

  const entradaMatch = terms.match(/entrada\s*\+\s*(\d+)\s*parcela/);
  if (entradaMatch) {
    const numInstallments = parseInt(entradaMatch[1]);
    const total = numInstallments + 1;
    const perInstallment = Math.round((totalValue / total) * 100) / 100;
    const firstAmount = totalValue - perInstallment * numInstallments;

    const milestones: MilestoneInput[] = [
      {
        description: `Entrada (1/${total})`,
        amount: firstAmount,
        due_date: startDate,
      },
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
    {
      description: "Entrada na assinatura (50%)",
      amount: halfValue,
      due_date: startDate,
    },
    {
      description: "Parcela final na entrega (50%)",
      amount: secondHalf,
      due_date: secondDate.toISOString().split("T")[0],
    },
  ];
}

async function generatePaymentTermsWithAI(
  template: string | null,
  totalValue: number,
  durationDays: number,
): Promise<string> {
  const prompt = `Você é um especialista em contratos para produtoras audiovisuais brasileiras.

Dado o contexto:
- Tipo de projeto: ${template || "produção audiovisual"}
- Valor total: R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Duração estimada: ${durationDays} dias

Retorne APENAS uma string curta com as condições de pagamento padrão de mercado, por exemplo:
- "50% na assinatura + 50% na entrega"
- "entrada + 2 parcelas"
- "3x mensais"

Retorne somente o texto das condições, sem explicações adicionais.`;

  try {
    const data = await chatCompletion({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });

    const result = data.choices?.[0]?.message?.content?.trim() || "";
    return result || "50% na assinatura + 50% na entrega";
  } catch (e) {
    console.error("AI call failed:", e);
    return "50% na assinatura + 50% na entrega";
  }
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
    const userId = user.id;

    const { project_id: rawProjectId, contract_id, force_regenerate = false } = await req.json();

    // Allow calling with either project_id or contract_id
    let project_id = rawProjectId;
    if (!project_id && contract_id) {
      const { data: contractLookup } = await supabaseAdmin
        .from("contracts")
        .select("project_id")
        .eq("id", contract_id)
        .single();
      project_id = contractLookup?.project_id;
    }

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id ou contract_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Projeto não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contractValue = Number(project.contract_value) || 0;
    if (contractValue <= 0) {
      return new Response(
        JSON.stringify({ error: "Projeto sem valor de contrato definido. Edite o projeto e adicione o valor." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingContracts } = await supabaseAdmin
      .from("contracts")
      .select("*")
      .eq("project_id", project_id)
      .order("created_at", { ascending: false })
      .limit(1);

    let contract = existingContracts?.[0] || null;
    let contractCreated = false;
    let contractUpdated = false;

    if (!contract) {
      const durationDays = project.start_date && project.due_date
        ? Math.ceil((new Date(project.due_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))
        : 30;

      const paymentTerms = await generatePaymentTermsWithAI(
        project.template,
        contractValue,
        durationDays,
      );

      const { data: newContract, error: createContractError } = await supabaseAdmin
        .from("contracts")
        .insert({
          project_id: project_id,
          project_name: project.name,
          client_name: project.client_name || null,
          total_value: contractValue,
          payment_terms: paymentTerms,
          status: "active",
          start_date: project.start_date || new Date().toISOString().split("T")[0],
          end_date: project.due_date || null,
        })
        .select()
        .single();

      if (createContractError) {
        console.error("Error creating contract:", createContractError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar contrato", details: createContractError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      contract = newContract;
      contractCreated = true;
    } else {
      const updates: Record<string, unknown> = {};
      if (Number(contract.total_value) !== contractValue) {
        updates.total_value = contractValue;
      }
      if (!contract.payment_terms) {
        const durationDays = project.start_date && project.due_date
          ? Math.ceil((new Date(project.due_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24))
          : 30;
        updates.payment_terms = await generatePaymentTermsWithAI(
          project.template,
          contractValue,
          durationDays,
        );
      }
      if (Object.keys(updates).length > 0) {
        await supabaseAdmin.from("contracts").update(updates).eq("id", contract.id);
        contract = { ...contract, ...updates };
        contractUpdated = true;
      }
    }

    const { data: existingRevenues } = await supabaseAdmin
      .from("revenues")
      .select("id")
      .eq("contract_id", contract.id);

    const hasRevenues = (existingRevenues?.length || 0) > 0;

    if (hasRevenues && !force_regenerate) {
      return new Response(
        JSON.stringify({
          message: contractCreated
            ? `Contrato criado. Parcelas já existiam (${existingRevenues?.length}).`
            : `Contrato atualizado. Parcelas já existem (${existingRevenues?.length}).`,
          contract_id: contract.id,
          created_revenues: 0,
          payment_terms: contract.payment_terms,
          contract_created: contractCreated,
          contract_updated: contractUpdated,
          existing_revenues: existingRevenues?.length || 0,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (hasRevenues && force_regenerate) {
      await supabaseAdmin.from("revenues").delete().eq("contract_id", contract.id);
    }

    const startDate = project.start_date || new Date().toISOString().split("T")[0];
    const milestones = parsePaymentTerms(contract.payment_terms, contractValue, startDate);

    const revenueRows = milestones.map((m) => ({
      project_id: project_id,
      contract_id: contract.id,
      description: `${project.name} — ${m.description}`,
      amount: m.amount,
      due_date: m.due_date,
      status: "pending",
      installment_group_id: contract.id,
      notes: `Gerado automaticamente com IA`,
      created_by: userId,
    }));

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("revenues")
      .insert(revenueRows)
      .select();

    if (insertError) {
      console.error("Revenue insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar parcelas", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      await supabaseAdmin.from("event_logs").insert({
        action: "sync_project_finances",
        entity_type: "project",
        entity_id: project_id,
        details: {
          contract_id: contract.id,
          contract_created: contractCreated,
          revenues_created: inserted?.length || 0,
          payment_terms: contract.payment_terms,
        },
      });
    } catch (_) { /* ignore logging errors */ }

    const message = [
      contractCreated ? "Contrato criado" : "Contrato atualizado",
      `${inserted?.length || 0} parcela(s) gerada(s)`,
      `Condições: ${contract.payment_terms}`,
    ].join(" • ");

    return new Response(
      JSON.stringify({
        message,
        contract_id: contract.id,
        created_revenues: inserted?.length || 0,
        payment_terms: contract.payment_terms,
        contract_created: contractCreated,
        contract_updated: contractUpdated,
        revenues: inserted,
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
