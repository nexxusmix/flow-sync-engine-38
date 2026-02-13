/**
 * export-finance-pdf - Generates a real PDF using pdf-lib (not SVG)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const C = {
  bg: rgb(0.02, 0.02, 0.02),
  surface: rgb(0.05, 0.05, 0.05),
  border: rgb(0.1, 0.1, 0.1),
  primary: rgb(0, 0.731, 1),
  white: rgb(1, 1, 1),
  muted: rgb(0.45, 0.45, 0.45),
  success: rgb(0.133, 0.773, 0.369),
  warning: rgb(0.918, 0.702, 0.031),
  error: rgb(0.937, 0.267, 0.267),
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CW = PAGE_W - MARGIN * 2;

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(v);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function sanitize(s: string | null | undefined): string {
  if (!s) return "";
  return String(s).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u2026/g, "...").replace(/[\u2013\u2014]/g, "-").replace(/[^\x00-\xFF]/g, "");
}

function getPeriodDates(period: string) {
  const end = new Date(); const start = new Date(); let label = "";
  switch (period) {
    case "30d": start.setDate(start.getDate() - 30); label = "Ultimos 30 dias"; break;
    case "3m": start.setMonth(start.getMonth() - 3); label = "Ultimos 3 meses"; break;
    case "6m": start.setMonth(start.getMonth() - 6); label = "Ultimos 6 meses"; break;
    case "12m": start.setFullYear(start.getFullYear() - 1); label = "Ultimos 12 meses"; break;
    default: start.setMonth(start.getMonth() - 6); label = "Ultimos 6 meses";
  }
  return { start, end, label };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.bg });

    let y = PAGE_H - MARGIN;

    // Header
    page.drawText("RELATORIO EXECUTIVO FINANCEIRO", { x: MARGIN, y, size: 9, font: fontBold, color: C.primary });
    y -= 35;
    page.drawText("Relatorio", { x: MARGIN, y, size: 26, font: fontBold, color: C.white });
    page.drawText("Financeiro", { x: MARGIN + 135, y, size: 26, font, color: C.muted });
    y -= 20;
    page.drawText(sanitize(`${label} - Gerado em ${formatDate(new Date())}`), { x: MARGIN, y, size: 10, font, color: C.muted });
    y -= 25;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: C.border });
    y -= 25;

    // KPI Cards
    const kpiW = (CW - 30) / 4;
    const kpis = [
      { label: "SALDO EM CAIXA", value: formatCurrency(balance), color: C.success },
      { label: "RECEITA PENDENTE", value: formatCurrency(pending), color: C.primary },
      { label: "DESPESAS PAGAS", value: formatCurrency(paidExp), color: C.error },
      { label: "MARGEM LIQUIDA", value: `${marginPct}%`, color: C.warning },
    ];
    kpis.forEach((kpi, i) => {
      const x = MARGIN + i * (kpiW + 10);
      page.drawRectangle({ x, y: y - 65, width: kpiW, height: 65, color: C.surface });
      page.drawText(sanitize(kpi.label), { x: x + 10, y: y - 16, size: 7, font: fontBold, color: C.muted });
      page.drawText(sanitize(kpi.value), { x: x + 10, y: y - 40, size: 16, font: fontBold, color: kpi.color });
    });
    y -= 80;

    // 30-day projection
    page.drawText("PROJECAO 30 DIAS", { x: MARGIN, y, size: 10, font: fontBold, color: C.primary });
    y -= 20;
    page.drawRectangle({ x: MARGIN, y: y - 50, width: CW, height: 50, color: C.surface });
    page.drawText("Saldo Estimado em 30 dias", { x: MARGIN + 15, y: y - 18, size: 9, font, color: C.muted });
    page.drawText(sanitize(formatCurrency(proj30)), { x: MARGIN + 15, y: y - 40, size: 20, font: fontBold, color: C.primary });
    const projLabel = proj30 >= balance ? "PREVISAO POSITIVA" : "ATENCAO";
    page.drawText(sanitize(projLabel), { x: PAGE_W - MARGIN - 130, y: y - 30, size: 10, font: fontBold, color: proj30 >= balance ? C.success : C.error });
    y -= 65;

    // Aging
    page.drawText("AGING DE RECEBIVEIS", { x: MARGIN, y, size: 10, font: fontBold, color: C.primary });
    y -= 20;

    const aging = [
      { range: "A vencer", items: revs.filter(r => (r.status === "pending" || r.status === "overdue") && r.due_date >= today), color: C.success },
      { range: "1-7 dias vencido", items: revs.filter(r => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 1 && d <= 7; }), color: C.warning },
      { range: "8-30 dias vencido", items: revs.filter(r => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d >= 8 && d <= 30; }), color: rgb(0.976, 0.451, 0.086) },
      { range: "+30 dias vencido", items: revs.filter(r => { if (r.status === "received") return false; const d = Math.floor((new Date(today).getTime() - new Date(r.due_date).getTime()) / 86400000); return d > 30; }), color: C.error },
    ];

    for (const ag of aging) {
      const val = ag.items.reduce((s, r) => s + Number(r.amount), 0);
      page.drawRectangle({ x: MARGIN, y: y - 22, width: CW, height: 22, color: C.surface });
      page.drawText(sanitize(ag.range), { x: MARGIN + 10, y: y - 15, size: 9, font: fontBold, color: ag.color });
      page.drawText(`${ag.items.length} itens`, { x: MARGIN + 180, y: y - 15, size: 8, font, color: C.muted });
      const valT = sanitize(formatCurrency(val));
      page.drawText(valT, { x: PAGE_W - MARGIN - 10 - font.widthOfTextAtSize(valT, 9), y: y - 15, size: 9, font: fontBold, color: C.white });
      y -= 26;
    }
    y -= 10;

    // Recent payments
    page.drawText("PAGAMENTOS RECENTES", { x: MARGIN, y, size: 10, font: fontBold, color: C.primary });
    y -= 20;

    const recent = revs.filter(r => r.status === "received" && r.received_date)
      .sort((a, b) => new Date(b.received_date!).getTime() - new Date(a.received_date!).getTime())
      .slice(0, 5);

    if (recent.length > 0) {
      // Header row
      page.drawRectangle({ x: MARGIN, y: y - 18, width: CW, height: 18, color: C.border });
      page.drawText("DESCRICAO", { x: MARGIN + 10, y: y - 13, size: 7, font: fontBold, color: C.primary });
      page.drawText("DATA", { x: MARGIN + 280, y: y - 13, size: 7, font: fontBold, color: C.primary });
      page.drawText("VALOR", { x: PAGE_W - MARGIN - 60, y: y - 13, size: 7, font: fontBold, color: C.primary });
      y -= 22;

      for (const p of recent) {
        page.drawText(sanitize((p.description || "").substring(0, 40)), { x: MARGIN + 10, y: y - 12, size: 9, font, color: C.white });
        page.drawText(p.received_date ? formatDate(new Date(p.received_date)) : "-", { x: MARGIN + 280, y: y - 12, size: 9, font, color: C.muted });
        const amt = sanitize(`+${formatCurrency(Number(p.amount))}`);
        page.drawText(amt, { x: PAGE_W - MARGIN - 10 - font.widthOfTextAtSize(amt, 9), y: y - 12, size: 9, font: fontBold, color: C.success });
        y -= 18;
      }
    } else {
      page.drawText("Nenhum pagamento recebido recentemente", { x: MARGIN + 10, y: y - 12, size: 9, font, color: C.muted });
      y -= 20;
    }

    // Alert
    if (overdueRevs.length > 0) {
      y -= 15;
      page.drawRectangle({ x: MARGIN, y: y - 36, width: CW, height: 36, color: C.surface });
      page.drawText("ALERTA DE INADIMPLENCIA", { x: MARGIN + 12, y: y - 16, size: 10, font: fontBold, color: C.error });
      page.drawText(sanitize(`${overdueRevs.length} receita(s) vencida(s) totalizando ${formatCurrency(overdueAmt)}`), {
        x: MARGIN + 12, y: y - 30, size: 8, font, color: C.muted,
      });
    }

    // Footer
    page.drawLine({ start: { x: MARGIN, y: MARGIN - 8 }, end: { x: PAGE_W - MARGIN, y: MARGIN - 8 }, thickness: 0.5, color: C.border });
    page.drawText("SQUAD Hub", { x: MARGIN, y: MARGIN - 20, size: 7, font, color: C.muted });
    page.drawText("SQUAD INTELLIGENCE", { x: PAGE_W - MARGIN - font.widthOfTextAtSize("SQUAD INTELLIGENCE", 7), y: MARGIN - 20, size: 7, font, color: C.primary });

    const pdfBytes = await pdfDoc.save();

    // Upload
    const fileName = `finance_report_${Date.now()}.pdf`;
    const filePath = `exports/pdf/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("exports").upload(filePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (uploadError) {
      // Fallback to project-files
      const { error: fb } = await supabase.storage.from("project-files").upload(filePath, pdfBytes, { contentType: "application/pdf", upsert: true });
      if (fb) throw new Error(`Upload failed: ${fb.message}`);
      const { data: pubUrl } = supabase.storage.from("project-files").getPublicUrl(filePath);
      return new Response(JSON.stringify({ success: true, public_url: pubUrl.publicUrl, file_path: filePath }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: pubUrl } = supabase.storage.from("exports").getPublicUrl(filePath);
    console.log("Finance PDF generated:", pubUrl.publicUrl);

    return new Response(
      JSON.stringify({ success: true, public_url: pubUrl.publicUrl, file_path: filePath }),
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
