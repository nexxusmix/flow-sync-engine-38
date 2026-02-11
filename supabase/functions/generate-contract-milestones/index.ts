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
  signedDate: string
): MilestoneInput[] {
  if (!paymentTerms || !totalValue) {
    return defaultMilestones(totalValue, signedDate);
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
      {
        description: `Entrada (1/${total})`,
        amount: firstAmount,
        due_date: signedDate,
      },
    ];

    for (let i = 1; i <= numInstallments; i++) {
      const date = new Date(signedDate);
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
        const date = new Date(signedDate);
        date.setMonth(date.getMonth() + i);
        const amount =
          i === 0 ? totalValue - perInstallment * (num - 1) : perInstallment;
        milestones.push({
          description: `Parcela ${i + 1}/${num}`,
          amount,
          due_date: date.toISOString().split("T")[0],
        });
      }
      return milestones;
    }
  }

  // Pattern: percentages like "40% + 40% + 20%"
  const percentMatches = terms.match(/(\d+)\s*%/g);
  if (percentMatches && percentMatches.length >= 2) {
    const percents = percentMatches.map((p) => parseInt(p.replace("%", "")));
    const sum = percents.reduce((a, b) => a + b, 0);
    if (sum >= 95 && sum <= 105) {
      // Allow small rounding
      const milestones: MilestoneInput[] = [];
      for (let i = 0; i < percents.length; i++) {
        const date = new Date(signedDate);
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

  // Fallback: default 50/50
  return defaultMilestones(totalValue, signedDate);
}

function defaultMilestones(
  totalValue: number,
  signedDate: string
): MilestoneInput[] {
  const halfValue = Math.round((totalValue / 2) * 100) / 100;
  const secondHalf = totalValue - halfValue;
  const secondDate = new Date(signedDate);
  secondDate.setDate(secondDate.getDate() + 30);

  return [
    {
      description: "Entrada na assinatura (50%) — Modelo padrão, ajustar se necessário",
      amount: halfValue,
      due_date: signedDate,
    },
    {
      description: "Parcela final (50%) — Modelo padrão, ajustar se necessário",
      amount: secondHalf,
      due_date: secondDate.toISOString().split("T")[0],
    },
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { contractId } = await req.json();
    if (!contractId) {
      return new Response(
        JSON.stringify({ error: "contractId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return new Response(
        JSON.stringify({ error: "Contrato não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (contract.status !== "signed") {
      return new Response(
        JSON.stringify({ error: "Contrato precisa estar assinado (status: signed)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency: check existing revenues for this contract
    const { data: existingRevenues } = await supabase
      .from("revenues")
      .select("id")
      .eq("contract_id", contractId);

    if (existingRevenues && existingRevenues.length > 0) {
      return new Response(
        JSON.stringify({
          message: "Parcelas já existem para este contrato",
          created_count: 0,
          milestones: [],
          existing_count: existingRevenues.length,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate milestones
    const signedDate = new Date().toISOString().split("T")[0];
    const milestones = parsePaymentTerms(
      contract.payment_terms,
      contract.total_value,
      signedDate
    );

    // Insert revenues
    const revenueRows = milestones.map((m) => ({
      workspace_id: contract.workspace_id,
      project_id: contract.project_id,
      contract_id: contract.id,
      description: m.description,
      amount: m.amount,
      due_date: m.due_date,
      status: "pending",
      installment_group_id: contract.id, // group by contract
      notes: `Gerado automaticamente do contrato ${contract.project_name || contract.id}`,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("revenues")
      .insert(revenueRows)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao inserir parcelas", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Parcelas geradas com sucesso",
        created_count: inserted?.length || 0,
        milestones: inserted,
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
