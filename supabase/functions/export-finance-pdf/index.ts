/**
 * export-finance-pdf — Standalone finance PDF via Gemini HTML
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";
import { formatCurrency, formatDate, formatDateShort, getPeriodDates } from "../_shared/pdf-design.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SQUAD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
@media print { @page { size: A4; margin: 20mm 15mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
body { font-family: 'Space Grotesk', sans-serif; background: #000; color: #D9DEE3; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 24px 40px; border-bottom: 1px solid #1A1A1A; }
.logo { width: 40px; height: 40px; border: 1px solid #009CCA; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #009CCA; }
.header-right { font-size: 11px; color: #4A4A4A; letter-spacing: 2px; text-transform: uppercase; }
.hero { padding: 60px 40px 40px; }
.hero-subtitle { font-size: 11px; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }
.hero-title { font-size: 42px; font-weight: 700; color: #FFF; line-height: 1.1; margin-bottom: 24px; }
.hero-title .accent { color: #009CCA; }
.accent-bar { width: 60px; height: 2px; background: #009CCA; margin-bottom: 16px; }
.hero-desc { font-size: 14px; color: #8C8C8C; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 0 40px 40px; }
.kpi-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-radius: 12px; padding: 20px; text-align: center; }
.kpi-value { font-size: 28px; font-weight: 700; color: #FFF; margin-bottom: 4px; }
.kpi-value.success { color: #22C55E; }
.kpi-value.accent { color: #009CCA; }
.kpi-value.warning { color: #EAB308; }
.kpi-value.error { color: #EF4444; }
.kpi-label { font-size: 11px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; }
.section { padding: 0 40px 32px; }
.section-title { font-size: 13px; font-weight: 600; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #1A1A1A; }
table { width: 100%; border-collapse: collapse; }
thead th { font-size: 10px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; padding: 12px 16px; text-align: left; background: #0A0A0A; border-bottom: 1px solid #1A1A1A; }
tbody td { font-size: 12px; padding: 12px 16px; border-bottom: 1px solid #0A0A0A; color: #D9DEE3; }
.pricing-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-left: 3px solid #009CCA; border-radius: 8px; padding: 24px; margin: 0 40px 24px; }
.pricing-subtitle { font-size: 10px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.pricing-title { font-size: 16px; font-weight: 700; color: #FFF; margin-bottom: 12px; }
.pricing-value { font-size: 28px; font-weight: 700; color: #009CCA; }
.progress-row { padding: 4px 40px 12px; }
.progress-label { font-size: 12px; color: #D9DEE3; display: flex; justify-content: space-between; margin-bottom: 4px; }
.progress-track { background: #1A1A1A; height: 6px; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 3px; }
.alert-banner { background: #0A0A0A; border-left: 3px solid #EF4444; padding: 16px 20px; margin: 0 40px 24px; }
.alert-title { font-size: 12px; font-weight: 700; color: #EF4444; margin-bottom: 4px; }
.alert-msg { font-size: 11px; color: #8C8C8C; }
.bold { font-weight: 600; color: #FFF; }
.muted { color: #8C8C8C; }
.footer { padding: 40px; text-align: center; border-top: 1px solid #1A1A1A; margin-top: 40px; }
.footer p { font-size: 11px; color: #4A4A4A; letter-spacing: 3px; text-transform: uppercase; }
`.trim();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { period = "6m" } = await req.json();
    const { label } = getPeriodDates(period);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [{ data: revenues }, { data: expenses }] = await Promise.all([
      supabase.from("revenues").select("*").order("due_date"),
      supabase.from("expenses").select("*").order("due_date"),
    ]);

    const revs = revenues || [];
    const exps = expenses || [];
    const today = new Date().toISOString().split("T")[0];

    const received = revs.filter(r => r.status === "received").reduce((s, r) => s + Number(r.amount), 0);
    const paidExp = exps.filter(e => e.status === "paid").reduce((s, e) => s + Number(e.amount), 0);
    const balance = received - paidExp;
    const pending = revs.filter(r => r.status !== "received").reduce((s, r) => s + Number(r.amount), 0);
    const overdueRevs = revs.filter(r => r.status !== "received" && r.due_date < today);
    const overdueAmt = overdueRevs.reduce((s, r) => s + Number(r.amount), 0);
    const marginPct = received > 0 ? Math.round(((received - paidExp) / received) * 100) : 0;

    const days30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const proj30 = balance
      + revs.filter(r => r.status === "pending" && r.due_date <= days30).reduce((s, r) => s + Number(r.amount), 0)
      - exps.filter(e => e.status === "pending" && e.due_date <= days30).reduce((s, e) => s + Number(e.amount), 0);

    const recent = revs.filter(r => r.status === "received" && r.received_date)
      .sort((a, b) => new Date(b.received_date!).getTime() - new Date(a.received_date!).getTime())
      .slice(0, 5)
      .map(p => ({ description: (p.description || "").substring(0, 40), date: formatDate(p.received_date), amount: formatCurrency(Number(p.amount)) }));

    const dataPayload = JSON.stringify({
      period_label: label, date: formatDateShort(),
      kpis: { balance: formatCurrency(balance), pending: formatCurrency(pending), expenses: formatCurrency(paidExp), margin: `${marginPct}%` },
      projection: { value: formatCurrency(proj30), positive: proj30 >= balance },
      recent_payments: recent,
      overdue: { count: overdueRevs.length, amount: formatCurrency(overdueAmt) },
    });

    const systemPrompt = `You are a pixel-perfect HTML report generator for SQUAD FILM.
Return ONLY complete HTML. No markdown.

Use this CSS:
${SQUAD_CSS}

<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

STRUCTURE:
1. Header: logo "SQ" + "SQUAD FILM | 2026"
2. Hero: subtitle=period_label, title "Relatorio<br><span class='accent'>Financeiro.</span>", desc "Panorama financeiro executivo | Gerado em DATE"
3. KPI row: Saldo em Caixa (success), Receita Pendente (accent), Despesas Pagas (error), Margem Liquida (warning)
4. Pricing card "Projecao 30 Dias": subtitle "Saldo Estimado em 30 dias", title based on positive flag, pricing-value
5. Section "Pagamentos Recentes": table (Descricao, Data, Valor). Green bold amounts with "+". Muted dates. If empty show "Nenhum pagamento recente"
6. If overdue.count > 0: alert-banner "ALERTA DE INADIMPLENCIA" with count + amount
7. Footer "SQUAD FILM | 2026"`;

    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Generate:\n${dataPayload}` }],
      temperature: 0.1,
    });

    let html = aiResult.choices?.[0]?.message?.content || "";
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) throw new Error("IA nao gerou HTML valido");

    return new Response(JSON.stringify({ success: true, html, slug: `financeiro-${period}` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("export-finance-pdf error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
