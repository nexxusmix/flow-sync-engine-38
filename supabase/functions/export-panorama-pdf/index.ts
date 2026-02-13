/**
 * export-panorama-pdf - Generates a panorama PDF with SQUAD FILM branding
 * Same visual identity as export-finance-pdf (dark theme, glass, holographic)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const C = {
  bg: rgb(0, 0, 0),
  surface: rgb(0.04, 0.04, 0.04),
  border: rgb(0.08, 0.08, 0.08),
  primary: rgb(0, 0.612, 0.792), // #009CCA
  white: rgb(1, 1, 1),
  muted: rgb(0.55, 0.55, 0.55),
  success: rgb(0.133, 0.773, 0.369),
  warning: rgb(0.918, 0.702, 0.031),
  error: rgb(0.937, 0.267, 0.267),
  glowBg: rgb(0, 0.04, 0.06),
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 40;
const CW = PAGE_W - MARGIN * 2;

function fmt(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(v);
}

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function sanitize(s: string | null | undefined): string {
  if (!s) return "";
  return String(s).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u2026/g, "...").replace(/[\u2013\u2014]/g, "-").replace(/[^\x00-\xFF]/g, "");
}

function healthColor(score: number) {
  if (score >= 80) return C.success;
  if (score >= 50) return C.warning;
  return C.error;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId, userId } = await req.json();
    if (!projectId) throw new Error("projectId required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Fetch all data in parallel
    const [
      { data: project },
      { data: revenues },
      { data: portalLinks },
      { data: deliverables },
      { data: contracts },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("revenues").select("*").eq("project_id", projectId).order("due_date"),
      supabase.from("portal_links").select("id, share_token").eq("project_id", projectId).limit(1),
      supabase.from("project_deliverables").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("contracts").select("*").eq("project_id", projectId).limit(1),
    ]);

    if (!project) throw new Error("Project not found");

    const revs = revenues || [];
    const dels = deliverables || [];
    const contract = contracts?.[0];
    const portalLink = portalLinks?.[0];

    const totalPaid = revs.filter(r => r.status === "received").reduce((s, r) => s + Number(r.amount), 0);
    const totalPending = revs.filter(r => r.status !== "received").reduce((s, r) => s + Number(r.amount), 0);
    const contractValue = contract?.total_value || project.contract_value || 0;
    const healthScore = project.health_score || 0;

    const pendingDels = dels.filter(d => d.status !== "approved" && d.visible_in_portal !== false).length;
    const approvedDels = dels.filter(d => d.status === "approved").length;

    const nextRevenue = revs.find(r => r.status === "pending" || r.status === "overdue");

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: C.bg });

    let y = PAGE_H - MARGIN;

    // Header line
    page.drawText("SECTION_07 // CLIENT_PANORAMA", { x: MARGIN, y, size: 7, font, color: C.primary });
    y -= 30;

    // Title
    page.drawText("PANORAMA", { x: MARGIN, y, size: 28, font: fontBold, color: C.white });
    page.drawText("DO PROJETO", { x: MARGIN + 155, y, size: 28, font, color: C.muted });
    y -= 18;
    page.drawText(sanitize(project.name), { x: MARGIN, y, size: 11, font: fontBold, color: C.primary });
    y -= 14;
    page.drawText(sanitize(`${project.client_name || "—"} | ${fmtDate(new Date().toISOString())}`), { x: MARGIN, y, size: 9, font, color: C.muted });
    y -= 20;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: C.border });
    y -= 25;

    // KPI Cards row 1
    const kpiW = (CW - 20) / 3;
    const kpis1 = [
      { label: "VALOR CONTRATO", value: fmt(contractValue), color: C.primary },
      { label: "TOTAL PAGO", value: fmt(totalPaid), color: C.success },
      { label: "PENDENTE", value: fmt(totalPending), color: totalPending > 0 ? C.warning : C.muted },
    ];
    kpis1.forEach((kpi, i) => {
      const x = MARGIN + i * (kpiW + 10);
      page.drawRectangle({ x, y: y - 58, width: kpiW, height: 58, color: C.surface });
      page.drawRectangle({ x, y: y - 58, width: kpiW, height: 2, color: kpi.color });
      page.drawText(sanitize(kpi.label), { x: x + 10, y: y - 16, size: 7, font: fontBold, color: C.muted });
      page.drawText(sanitize(kpi.value), { x: x + 10, y: y - 38, size: 15, font: fontBold, color: kpi.color });
    });
    y -= 72;

    // KPI Cards row 2
    const kpis2 = [
      { label: "ETAPA ATUAL", value: sanitize(project.stage_current || "—"), color: C.primary },
      { label: "SAUDE DO PROJETO", value: `${healthScore}%`, color: healthColor(healthScore) },
      { label: "ENTREGAS PENDENTES", value: `${pendingDels}`, color: pendingDels > 3 ? C.warning : C.primary },
    ];
    kpis2.forEach((kpi, i) => {
      const x = MARGIN + i * (kpiW + 10);
      page.drawRectangle({ x, y: y - 58, width: kpiW, height: 58, color: C.surface });
      page.drawRectangle({ x, y: y - 58, width: kpiW, height: 2, color: kpi.color });
      page.drawText(sanitize(kpi.label), { x: x + 10, y: y - 16, size: 7, font: fontBold, color: C.muted });
      page.drawText(sanitize(kpi.value), { x: x + 10, y: y - 38, size: 15, font: fontBold, color: kpi.color });
    });
    y -= 72;

    // Next payment
    if (nextRevenue) {
      page.drawText("PROXIMO VENCIMENTO", { x: MARGIN, y, size: 9, font: fontBold, color: C.primary });
      y -= 18;
      page.drawRectangle({ x: MARGIN, y: y - 40, width: CW, height: 40, color: C.surface });
      page.drawText(sanitize(nextRevenue.description || "Parcela"), { x: MARGIN + 12, y: y - 16, size: 10, font, color: C.white });
      page.drawText(sanitize(`${fmtDate(nextRevenue.due_date)} — ${fmt(Number(nextRevenue.amount))}`), { x: MARGIN + 12, y: y - 32, size: 9, font: fontBold, color: C.primary });
      const statusLabel = nextRevenue.status === "overdue" ? "VENCIDO" : "PENDENTE";
      const statusColor = nextRevenue.status === "overdue" ? C.error : C.warning;
      page.drawText(statusLabel, { x: PAGE_W - MARGIN - 70, y: y - 24, size: 9, font: fontBold, color: statusColor });
      y -= 55;
    }

    // Deliverables summary
    page.drawText("ENTREGAS", { x: MARGIN, y, size: 9, font: fontBold, color: C.primary });
    y -= 18;

    // Header row
    page.drawRectangle({ x: MARGIN, y: y - 18, width: CW, height: 18, color: C.border });
    page.drawText("TITULO", { x: MARGIN + 10, y: y - 13, size: 7, font: fontBold, color: C.primary });
    page.drawText("TIPO", { x: MARGIN + 280, y: y - 13, size: 7, font: fontBold, color: C.primary });
    page.drawText("STATUS", { x: PAGE_W - MARGIN - 60, y: y - 13, size: 7, font: fontBold, color: C.primary });
    y -= 22;

    const visibleDels = dels.filter(d => d.visible_in_portal !== false).slice(0, 8);
    for (const d of visibleDels) {
      if (y < MARGIN + 60) break;
      page.drawText(sanitize((d.title || "").substring(0, 42)), { x: MARGIN + 10, y: y - 12, size: 9, font, color: C.white });
      page.drawText(sanitize((d.type || "").substring(0, 12)), { x: MARGIN + 280, y: y - 12, size: 8, font, color: C.muted });
      const sColor = d.status === "approved" ? C.success : d.status === "review" ? C.warning : C.muted;
      page.drawText(sanitize(d.status || "pending"), { x: PAGE_W - MARGIN - 60, y: y - 12, size: 8, font: fontBold, color: sColor });
      y -= 18;
    }

    if (visibleDels.length === 0) {
      page.drawText("Nenhuma entrega registrada", { x: MARGIN + 10, y: y - 12, size: 9, font, color: C.muted });
      y -= 20;
    }

    // Portal link info
    if (portalLink) {
      y -= 15;
      const portalUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/client/${portalLink.share_token}`;
      page.drawText("Portal do Cliente:", { x: MARGIN, y: y - 12, size: 8, font: fontBold, color: C.primary });
      page.drawText(sanitize(portalUrl.substring(0, 70)), { x: MARGIN + 90, y: y - 12, size: 8, font, color: C.muted });
    }

    // Footer
    page.drawLine({ start: { x: MARGIN, y: MARGIN - 4 }, end: { x: PAGE_W - MARGIN, y: MARGIN - 4 }, thickness: 0.5, color: C.border });
    page.drawText("SQUAD FILM", { x: MARGIN, y: MARGIN - 16, size: 7, font: fontBold, color: C.primary });
    page.drawText("HUB v2.4 // PANORAMA", { x: MARGIN + 60, y: MARGIN - 16, size: 7, font, color: C.muted });
    const pageStr = "PAG 01/01";
    page.drawText(pageStr, { x: PAGE_W - MARGIN - font.widthOfTextAtSize(pageStr, 7), y: MARGIN - 16, size: 7, font, color: C.muted });

    const pdfBytes = await pdfDoc.save();

    // Upload to storage
    const fileName = `panorama_${projectId}_v${Date.now()}.pdf`;
    const filePath = `exports/panorama/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("exports").upload(filePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: true,
    });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from("exports").createSignedUrl(filePath, 1800);
    const url = signedUrlError
      ? supabase.storage.from("exports").getPublicUrl(filePath).data.publicUrl
      : signedUrlData.signedUrl;

    // Save snapshot
    const snapshotVersion = await supabase.from("panorama_snapshots").select("version").eq("project_id", projectId).order("version", { ascending: false }).limit(1);
    const nextVersion = (snapshotVersion.data?.[0]?.version || 0) + 1;

    const { data: snapshot } = await supabase.from("panorama_snapshots").insert({
      project_id: projectId,
      generated_by: userId || null,
      pdf_url: url,
      pdf_file_path: filePath,
      version: nextVersion,
      metadata: {
        contract_value: contractValue,
        total_paid: totalPaid,
        pending: totalPending,
        health_score: healthScore,
        pending_deliverables: pendingDels,
        stage: project.stage_current,
      },
    }).select("id, share_token").single();

    return new Response(JSON.stringify({
      success: true,
      signed_url: url,
      public_url: url,
      storage_path: filePath,
      file_name: fileName,
      share_token: snapshot?.share_token,
      snapshot_id: snapshot?.id,
      version: nextVersion,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("export-panorama-pdf error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
