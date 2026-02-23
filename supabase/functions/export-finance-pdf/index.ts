/**
 * export-finance-pdf — Standalone finance PDF with SQUAD Swiss design
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SquadPdfBuilder, SQUAD, sanitize, formatCurrency, formatDate, formatDateShort, getPeriodDates } from "../_shared/pdf-design.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const pending = revs.filter(r => r.status === "pending" || r.status === "overdue").reduce((s, r) => s + Number(r.amount), 0);
    const overdueRevs = revs.filter(r => r.status !== "received" && r.due_date < today);
    const overdueAmt = overdueRevs.reduce((s, r) => s + Number(r.amount), 0);
    const marginPct = received > 0 ? Math.round(((received - paidExp) / received) * 100) : 0;

    const days30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const proj30 = balance
      + revs.filter(r => r.status === "pending" && r.due_date <= days30).reduce((s, r) => s + Number(r.amount), 0)
      - exps.filter(e => e.status === "pending" && e.due_date <= days30).reduce((s, e) => s + Number(e.amount), 0);

    const b = new SquadPdfBuilder();
    await b.init();

    b.coverPage({
      subtitle: label,
      titleLine1: "Relatorio",
      titleLine2: "Financeiro",
      description: "Panorama financeiro executivo",
      date: formatDateShort(),
    });

    b.newPage();
    b.heroSection("Indicadores", "Financeiros.", "Resumo Executivo");
    b.kpiRow([
      { label: "Saldo em Caixa", value: formatCurrency(balance), color: SQUAD.success },
      { label: "Receita Pendente", value: formatCurrency(pending), color: SQUAD.accent },
      { label: "Despesas Pagas", value: formatCurrency(paidExp), color: SQUAD.error },
      { label: "Margem Liquida", value: `${marginPct}%`, color: SQUAD.warning },
    ]);

    // 30-day projection
    b.sectionTitle("Projecao 30 Dias");
    b.pricingCard({
      subtitle: "Saldo Estimado em 30 dias",
      title: proj30 >= balance ? "PREVISAO POSITIVA" : "ATENCAO",
      value: formatCurrency(proj30),
    });

    // Aging
    b.sectionTitle("Aging de Recebiveis");
    const aging = [
      { range: "A vencer", items: revs.filter(r => (r.status === "pending" || r.status === "overdue") && r.due_date >= today), color: SQUAD.success },
      { range: "1-7 dias vencido", items: revs.filter(r => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 1 && d <= 7; }), color: SQUAD.warning },
      { range: "8-30 dias vencido", items: revs.filter(r => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 8 && d <= 30; }), color: SQUAD.warning },
      { range: "+30 dias vencido", items: revs.filter(r => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d > 30; }), color: SQUAD.error },
    ];
    for (const ag of aging) {
      const val = ag.items.reduce((s, r) => s + Number(r.amount), 0);
      b.progressBar(sanitize(ag.range), `${ag.items.length} itens - ${formatCurrency(val)}`, val > 0 ? Math.min(100, (val / Math.max(received, 1)) * 100) : 0, ag.color);
    }

    // Recent payments
    b.sectionTitle("Pagamentos Recentes");
    const recent = revs.filter(r => r.status === "received" && r.received_date)
      .sort((a, bb) => new Date(bb.received_date!).getTime() - new Date(a.received_date!).getTime())
      .slice(0, 5);

    if (recent.length > 0) {
      const colW = [220, 120, 159];
      b.tableHeader([
        { text: "Descricao", width: colW[0] },
        { text: "Data", width: colW[1] },
        { text: "Valor", width: colW[2] },
      ]);
      for (const p of recent) {
        b.tableRow([
          { text: (p.description || "").substring(0, 40), width: colW[0] },
          { text: formatDate(p.received_date), width: colW[1], color: SQUAD.muted },
          { text: `+${formatCurrency(Number(p.amount))}`, width: colW[2], color: SQUAD.success, bold: true },
        ]);
      }
    } else {
      b.text("Nenhum pagamento recebido recentemente", { color: SQUAD.muted });
    }

    if (overdueRevs.length > 0) {
      b.alertBanner("ALERTA DE INADIMPLENCIA", `${overdueRevs.length} receita(s) vencida(s) totalizando ${formatCurrency(overdueAmt)}`);
    }

    const pdfBytes = await b.save();
    const fileName = `finance_report_${Date.now()}.pdf`;
    const filePath = `exports/pdf/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("exports").upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) {
      const { error: fb } = await supabase.storage.from("project-files").upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: true });
      if (fb) throw new Error(`Upload failed: ${fb.message}`);
      const { data: signedFb } = await supabase.storage.from("project-files").createSignedUrl(filePath, 1800);
      const fbUrl = signedFb?.signedUrl || supabase.storage.from("project-files").getPublicUrl(filePath).data.publicUrl;
      return new Response(JSON.stringify({ success: true, signed_url: fbUrl, public_url: fbUrl, storage_path: filePath, file_name: fileName }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from("exports").createSignedUrl(filePath, 1800);
    const url = signedUrlError ? supabase.storage.from("exports").getPublicUrl(filePath).data.publicUrl : signedUrlData.signedUrl;

    return new Response(JSON.stringify({ success: true, signed_url: url, public_url: url, storage_path: filePath, file_name: fileName }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("export-finance-pdf error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
