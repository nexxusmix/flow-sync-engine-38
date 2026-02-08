import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Design System Colors (SQUAD Film)
const COLORS = {
  background: "#050505",
  cardBg: "#0D0D0D",
  primary: "#00BAFF",
  text: "#FFFFFF",
  textMuted: "#737373",
  border: "#1a1a1a",
  success: "#22c55e",
  warning: "#eab308",
  error: "#ef4444",
};

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 40,
  contentWidth: 515.28,
};

interface FinanceExportInput {
  period?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPeriodDates(period: string): { start: Date; end: Date; label: string } {
  const end = new Date();
  const start = new Date();
  let label = "";
  
  switch (period) {
    case "30d": 
      start.setDate(start.getDate() - 30);
      label = "Últimos 30 dias";
      break;
    case "3m": 
      start.setMonth(start.getMonth() - 3);
      label = "Últimos 3 meses";
      break;
    case "6m": 
      start.setMonth(start.getMonth() - 6);
      label = "Últimos 6 meses";
      break;
    case "12m": 
      start.setFullYear(start.getFullYear() - 1);
      label = "Últimos 12 meses";
      break;
    default: 
      start.setMonth(start.getMonth() - 6);
      label = "Últimos 6 meses";
  }
  
  return { start, end, label };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = (await req.json()) as FinanceExportInput;
    const { period = "6m" } = input;
    const { start, end, label } = getPeriodDates(period);

    console.log(`Generating Finance PDF: period=${period}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch financial data
    const [revenuesRes, expensesRes, contractsRes] = await Promise.all([
      supabase.from("revenues").select("*").order("due_date", { ascending: true }),
      supabase.from("expenses").select("*").order("due_date", { ascending: true }),
      supabase.from("contracts").select("*, payment_milestones(*)"),
    ]);

    const revenues = revenuesRes.data || [];
    const expenses = expensesRes.data || [];
    const contracts = contractsRes.data || [];

    const today = new Date().toISOString().split("T")[0];

    // Calculate metrics
    const receivedRevenue = revenues
      .filter(r => r.status === "received")
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const paidExpenses = expenses
      .filter(e => e.status === "paid")
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const currentBalance = receivedRevenue - paidExpenses;

    const pendingRevenue = revenues
      .filter(r => r.status === "pending" || r.status === "overdue")
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const overdueRevenues = revenues.filter(r => 
      r.status === "overdue" || (r.status === "pending" && r.due_date < today)
    );
    const overdueAmount = overdueRevenues.reduce((sum, r) => sum + Number(r.amount), 0);

    const marginPercentage = receivedRevenue > 0 
      ? Math.round(((receivedRevenue - paidExpenses) / receivedRevenue) * 100)
      : 0;

    // Pending milestones
    const allMilestones = contracts.flatMap((c: any) => c.payment_milestones || []);
    const pendingMilestones = allMilestones.filter((m: any) => m.status !== "paid").length;

    // Projection 30 days
    const days30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const projected30 = currentBalance + 
      revenues.filter(r => r.status === "pending" && r.due_date <= days30).reduce((s, r) => s + Number(r.amount), 0) -
      expenses.filter(e => e.status === "pending" && e.due_date <= days30).reduce((s, e) => s + Number(e.amount), 0);

    // Build SVG
    let y = PAGE.margin;
    const svg: string[] = [];

    // Background
    svg.push(`<rect fill="${COLORS.background}" x="0" y="0" width="${PAGE.width}" height="${PAGE.height}"/>`);

    // Header
    svg.push(`
      <text fill="${COLORS.primary}" x="${PAGE.margin}" y="${y + 20}" 
        font-family="Helvetica, sans-serif" font-size="10" font-weight="bold" letter-spacing="2">
        ● RELATÓRIO EXECUTIVO FINANCEIRO
      </text>
    `);
    y += 40;

    svg.push(`
      <text fill="${COLORS.text}" x="${PAGE.margin}" y="${y + 25}" 
        font-family="Helvetica, sans-serif" font-size="28" font-weight="bold">
        Relatório
      </text>
      <text fill="${COLORS.textMuted}" x="${PAGE.margin + 130}" y="${y + 25}" 
        font-family="Helvetica, sans-serif" font-size="28" font-style="italic">
        Financeiro
      </text>
    `);
    y += 35;

    svg.push(`
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${y + 15}" 
        font-family="Helvetica, sans-serif" font-size="11">
        ${escapeXml(label)} • Gerado em ${formatDate(new Date())}
      </text>
    `);
    y += 40;

    // Divider
    svg.push(`<line x1="${PAGE.margin}" y1="${y}" x2="${PAGE.width - PAGE.margin}" y2="${y}" stroke="${COLORS.border}" stroke-width="1"/>`);
    y += 30;

    // KPI Cards
    const kpiWidth = (PAGE.contentWidth - 30) / 4;
    const kpis = [
      { label: "SALDO EM CAIXA", value: formatCurrency(currentBalance), color: COLORS.success, badge: marginPercentage >= 20 ? "ESTÁVEL" : "ATENÇÃO" },
      { label: "RECEITA PENDENTE", value: formatCurrency(pendingRevenue), color: COLORS.primary, badge: `${pendingMilestones} parcelas` },
      { label: "DESPESAS PAGAS", value: formatCurrency(paidExpenses), color: COLORS.error, badge: "" },
      { label: "MARGEM LÍQUIDA", value: `${marginPercentage}%`, color: COLORS.warning, badge: marginPercentage >= 28 ? "100% HEALTH" : "ATENÇÃO" },
    ];

    kpis.forEach((kpi, i) => {
      const x = PAGE.margin + (i * (kpiWidth + 10));
      svg.push(`
        <rect fill="${COLORS.cardBg}" x="${x}" y="${y}" width="${kpiWidth}" height="80" rx="8" stroke="${COLORS.border}" stroke-width="1"/>
        <text fill="${COLORS.textMuted}" x="${x + 12}" y="${y + 20}" font-family="Helvetica, sans-serif" font-size="8" letter-spacing="1">
          ${kpi.label}
        </text>
        <text fill="${kpi.color}" x="${x + 12}" y="${y + 45}" font-family="Helvetica, sans-serif" font-size="18" font-weight="bold">
          ${escapeXml(kpi.value)}
        </text>
        ${kpi.badge ? `<text fill="${COLORS.textMuted}" x="${x + 12}" y="${y + 65}" font-family="Helvetica, sans-serif" font-size="8">${escapeXml(kpi.badge)}</text>` : ''}
      `);
    });
    y += 100;

    // Section: Projeção
    svg.push(`
      <text fill="${COLORS.primary}" x="${PAGE.margin}" y="${y + 15}" 
        font-family="Helvetica, sans-serif" font-size="12" font-weight="bold" letter-spacing="1">
        PROJEÇÃO 30 DIAS
      </text>
    `);
    y += 30;

    svg.push(`
      <rect fill="${COLORS.cardBg}" x="${PAGE.margin}" y="${y}" width="${PAGE.contentWidth}" height="60" rx="8" stroke="${COLORS.border}" stroke-width="1"/>
      <text fill="${COLORS.textMuted}" x="${PAGE.margin + 20}" y="${y + 25}" font-family="Helvetica, sans-serif" font-size="10">
        Saldo Estimado em 30 dias
      </text>
      <text fill="${COLORS.primary}" x="${PAGE.margin + 20}" y="${y + 45}" font-family="Helvetica, sans-serif" font-size="22" font-weight="bold">
        ${escapeXml(formatCurrency(projected30))}
      </text>
      <text fill="${projected30 >= currentBalance ? COLORS.success : COLORS.error}" x="${PAGE.width - PAGE.margin - 100}" y="${y + 35}" font-family="Helvetica, sans-serif" font-size="12" font-weight="bold">
        ${projected30 >= currentBalance ? "↑ PREVISÃO POSITIVA" : "↓ ATENÇÃO"}
      </text>
    `);
    y += 80;

    // Section: Aging
    svg.push(`
      <text fill="${COLORS.primary}" x="${PAGE.margin}" y="${y + 15}" 
        font-family="Helvetica, sans-serif" font-size="12" font-weight="bold" letter-spacing="1">
        AGING DE RECEBÍVEIS
      </text>
    `);
    y += 30;

    // Calculate aging
    const agingData = [
      { 
        range: "A vencer", 
        items: revenues.filter(r => (r.status === "pending" || r.status === "overdue") && r.due_date >= today),
        color: COLORS.success
      },
      { 
        range: "1-7 dias vencido", 
        items: revenues.filter(r => {
          if (r.status !== "pending" && r.status !== "overdue") return false;
          const days = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / (1000 * 60 * 60 * 24));
          return days >= 1 && days <= 7;
        }),
        color: COLORS.warning
      },
      { 
        range: "8-30 dias vencido", 
        items: revenues.filter(r => {
          if (r.status !== "pending" && r.status !== "overdue") return false;
          const days = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / (1000 * 60 * 60 * 24));
          return days >= 8 && days <= 30;
        }),
        color: "#f97316"
      },
      { 
        range: "+30 dias vencido", 
        items: revenues.filter(r => {
          if (r.status !== "pending" && r.status !== "overdue") return false;
          const days = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / (1000 * 60 * 60 * 24));
          return days > 30;
        }),
        color: COLORS.error
      },
    ];

    agingData.forEach((aging, i) => {
      const value = aging.items.reduce((sum, r) => sum + Number(r.amount), 0);
      svg.push(`
        <rect fill="${aging.color}15" x="${PAGE.margin}" y="${y}" width="${PAGE.contentWidth}" height="28" rx="4"/>
        <text fill="${aging.color}" x="${PAGE.margin + 15}" y="${y + 18}" font-family="Helvetica, sans-serif" font-size="10" font-weight="bold">
          ${escapeXml(aging.range)}
        </text>
        <text fill="${COLORS.textMuted}" x="${PAGE.margin + 200}" y="${y + 18}" font-family="Helvetica, sans-serif" font-size="10">
          ${aging.items.length} ${aging.items.length === 1 ? 'item' : 'itens'}
        </text>
        <text fill="${COLORS.text}" x="${PAGE.width - PAGE.margin - 15}" y="${y + 18}" font-family="Helvetica, sans-serif" font-size="11" font-weight="bold" text-anchor="end">
          ${escapeXml(formatCurrency(value))}
        </text>
      `);
      y += 32;
    });

    y += 20;

    // Section: Recent Payments
    svg.push(`
      <text fill="${COLORS.primary}" x="${PAGE.margin}" y="${y + 15}" 
        font-family="Helvetica, sans-serif" font-size="12" font-weight="bold" letter-spacing="1">
        PAGAMENTOS RECENTES
      </text>
    `);
    y += 30;

    const recentPayments = revenues
      .filter(r => r.status === "received" && r.received_date)
      .sort((a, b) => new Date(b.received_date!).getTime() - new Date(a.received_date!).getTime())
      .slice(0, 5);

    if (recentPayments.length > 0) {
      // Table header
      svg.push(`
        <rect fill="${COLORS.border}" x="${PAGE.margin}" y="${y}" width="${PAGE.contentWidth}" height="24" rx="4"/>
        <text fill="${COLORS.primary}" x="${PAGE.margin + 15}" y="${y + 16}" font-family="Helvetica, sans-serif" font-size="9" font-weight="bold">
          DESCRIÇÃO
        </text>
        <text fill="${COLORS.primary}" x="${PAGE.margin + 300}" y="${y + 16}" font-family="Helvetica, sans-serif" font-size="9" font-weight="bold">
          DATA
        </text>
        <text fill="${COLORS.primary}" x="${PAGE.width - PAGE.margin - 15}" y="${y + 16}" font-family="Helvetica, sans-serif" font-size="9" font-weight="bold" text-anchor="end">
          VALOR
        </text>
      `);
      y += 28;

      recentPayments.forEach(payment => {
        svg.push(`
          <text fill="${COLORS.text}" x="${PAGE.margin + 15}" y="${y + 14}" font-family="Helvetica, sans-serif" font-size="10">
            ${escapeXml((payment.description || "").substring(0, 40))}
          </text>
          <text fill="${COLORS.textMuted}" x="${PAGE.margin + 300}" y="${y + 14}" font-family="Helvetica, sans-serif" font-size="10">
            ${payment.received_date ? formatDate(new Date(payment.received_date)) : "-"}
          </text>
          <text fill="${COLORS.success}" x="${PAGE.width - PAGE.margin - 15}" y="${y + 14}" font-family="Helvetica, sans-serif" font-size="10" font-weight="bold" text-anchor="end">
            +${escapeXml(formatCurrency(Number(payment.amount)))}
          </text>
        `);
        y += 22;
      });
    } else {
      svg.push(`
        <text fill="${COLORS.textMuted}" x="${PAGE.margin + 15}" y="${y + 14}" font-family="Helvetica, sans-serif" font-size="10">
          Nenhum pagamento recebido recentemente
        </text>
      `);
      y += 30;
    }

    // Alerts if overdue
    if (overdueRevenues.length > 0) {
      y += 20;
      svg.push(`
        <rect fill="${COLORS.error}15" x="${PAGE.margin}" y="${y}" width="${PAGE.contentWidth}" height="40" rx="6" stroke="${COLORS.error}" stroke-width="1"/>
        <text fill="${COLORS.error}" x="${PAGE.margin + 15}" y="${y + 18}" font-family="Helvetica, sans-serif" font-size="11" font-weight="bold">
          ⚠ ALERTA DE INADIMPLÊNCIA
        </text>
        <text fill="${COLORS.textMuted}" x="${PAGE.margin + 15}" y="${y + 32}" font-family="Helvetica, sans-serif" font-size="9">
          ${overdueRevenues.length} receita(s) vencida(s) totalizando ${escapeXml(formatCurrency(overdueAmount))}
        </text>
      `);
      y += 50;
    }

    // Footer
    svg.push(`
      <line x1="${PAGE.margin}" y1="${PAGE.height - 40}" x2="${PAGE.width - PAGE.margin}" y2="${PAGE.height - 40}" stroke="${COLORS.border}" stroke-width="0.5"/>
      <text fill="${COLORS.textMuted}" x="${PAGE.margin}" y="${PAGE.height - 25}" font-family="Helvetica, sans-serif" font-size="8">
        Gerado por SQUAD Hub • Relatório Certificado SquadEngine™
      </text>
      <text fill="${COLORS.primary}" x="${PAGE.width - PAGE.margin}" y="${PAGE.height - 25}" font-family="Helvetica, sans-serif" font-size="8" text-anchor="end">
        SQUAD INTELLIGENCE
      </text>
    `);

    // Complete SVG
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PAGE.width} ${PAGE.height}">
        ${svg.join("")}
      </svg>`;

    // Save to storage
    const fileName = `finance_report_${Date.now()}.svg`;
    const filePath = `exports/pdf/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("exports")
      .upload(filePath, svgContent, {
        contentType: "image/svg+xml",
        upsert: true,
      });

    if (uploadError) {
      // Try project-files bucket as fallback
      const { error: fallbackError } = await supabase.storage
        .from("project-files")
        .upload(filePath, svgContent, {
          contentType: "image/svg+xml",
          upsert: true,
        });

      if (fallbackError) {
        console.error("Upload error:", fallbackError);
        return new Response(
          JSON.stringify({ error: "Failed to save PDF", details: fallbackError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("project-files")
        .getPublicUrl(filePath);

      return new Response(
        JSON.stringify({
          success: true,
          public_url: publicUrlData.publicUrl,
          file_path: filePath,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("exports")
      .getPublicUrl(filePath);

    console.log("Finance PDF generated:", publicUrlData.publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        public_url: publicUrlData.publicUrl,
        file_path: filePath,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("export-finance-pdf error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
