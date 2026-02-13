/**
 * export-campaign-pdf — Premium PDF for Campaign exports
 * Uses pdf-lib with dark premium design matching HUB v2.4
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Design Tokens (Premium Dark) ────────────────────────
const BG      = rgb(0.043, 0.059, 0.078);
const SURFACE = rgb(0.067, 0.078, 0.098);
const BORDER  = rgb(0.118, 0.133, 0.157);
const WHITE   = rgb(1, 1, 1);
const OFF_WHITE = rgb(0.88, 0.89, 0.91);
const MUTED   = rgb(0.45, 0.47, 0.50);
const DIM     = rgb(0.30, 0.32, 0.35);
const ACCENT  = rgb(0.976, 0.651, 0.086); // Amber for marketing
const SUCCESS = rgb(0.133, 0.773, 0.369);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

function sanitize(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "*")
    .replace(/[^\x00-\xFF]/g, "");
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(v);
}

function formatDateShort(): string {
  const n = new Date();
  return `${String(n.getDate()).padStart(2, "0")}-${String(n.getMonth() + 1).padStart(2, "0")}-${n.getFullYear()}`;
}

function generateRefCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "HB";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { campaign_id } = await req.json();

    if (!campaign_id) throw new Error('Missing required field: campaign_id');

    console.log(`[export-campaign-pdf] Exporting campaign: ${campaign_id}`);

    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns').select('*').eq('id', campaign_id).single();
    if (campaignError || !campaign) throw new Error(`Campaign not found: ${campaignError?.message}`);

    const [{ data: packages }, { data: brandKit }] = await Promise.all([
      supabase.from('campaign_creative_packages').select('*').eq('campaign_id', campaign_id).order('created_at', { ascending: false }),
      campaign.brand_kit_id
        ? supabase.from('brand_kits').select('*').eq('id', campaign.brand_kit_id).single().then(r => r)
        : Promise.resolve({ data: null }),
    ]);

    console.log(`[export-campaign-pdf] Found ${packages?.length || 0} creative packages`);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const refCode = generateRefCode();

    // ── Helpers ────────────────────────────────────────────
    function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
          lines.push(current);
          current = word;
        } else { current = test; }
      }
      if (current) lines.push(current);
      return lines;
    }

    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN;
    let pageCount = 0;

    function newPage() {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      pageCount++;
      page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });
      page.drawRectangle({ x: 0, y: PAGE_H - 2, width: PAGE_W, height: 2, color: ACCENT });
      y = PAGE_H - MARGIN;
    }

    function ensureSpace(needed: number) { if (y < MARGIN + 40 + needed) newPage(); }

    function drawText(str: string, opts: { x?: number; size?: number; color?: any; bold?: boolean; maxWidth?: number } = {}) {
      const { x = MARGIN, size = 10, color = OFF_WHITE, bold = false, maxWidth = CONTENT_W } = opts;
      const f = bold ? fontBold : font;
      const clean = sanitize(str);
      if (!clean) return;
      const lines = wrapText(clean, size, maxWidth);
      for (const line of lines) {
        ensureSpace(size * 1.5);
        page.drawText(line, { x, y, size, font: f, color });
        y -= size * 1.5;
      }
    }

    let sectionCounter = 0;
    function sectionHeader(title: string) {
      sectionCounter++;
      const num = String(sectionCounter).padStart(2, "0");
      ensureSpace(40);
      y -= 16;
      page.drawRectangle({ x: MARGIN, y: y - 1, width: 3, height: 16, color: ACCENT });
      page.drawText(sanitize(`${num} — ${title.toUpperCase()}`), { x: MARGIN + 12, y, size: 10, font: fontBold, color: ACCENT });
      y -= 8;
      page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 0.5, color: BORDER });
      y -= 16;
    }

    // ── Cover Page ────────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });
    page.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: ACCENT });
    page.drawRectangle({ x: 0, y: PAGE_H - 200, width: PAGE_W, height: 200, color: rgb(0.976 * 0.08, 0.651 * 0.08, 0.086 * 0.08) });

    page.drawText("HUB SOCIAL", { x: MARGIN, y: PAGE_H - 60, size: 10, font: fontBold, color: ACCENT });

    const titleLines = wrapText(sanitize(campaign.name || "Campanha"), 28, CONTENT_W);
    let ty = PAGE_H - 120;
    for (const line of titleLines) {
      page.drawText(line, { x: MARGIN, y: ty, size: 28, font: fontBold, color: WHITE });
      ty -= 36;
    }
    ty -= 8;
    page.drawText("Relatorio de Campanha", { x: MARGIN, y: ty, size: 12, font, color: MUTED });
    ty -= 30;
    page.drawRectangle({ x: MARGIN, y: ty, width: 60, height: 2, color: ACCENT });
    ty -= 40;

    const metaItems = [
      { label: "DATA DE EMISSAO", value: formatDateShort() },
      { label: "CODIGO", value: refCode },
      { label: "PLATAFORMA", value: "HUB SOCIAL" },
    ];
    if (campaign.status) metaItems.unshift({ label: "STATUS", value: (campaign.status || "rascunho").toUpperCase() });

    for (const m of metaItems) {
      page.drawText(sanitize(m.label), { x: MARGIN, y: ty, size: 7, font: fontBold, color: DIM });
      page.drawText(sanitize(m.value), { x: MARGIN + 130, y: ty, size: 9, font, color: OFF_WHITE });
      ty -= 18;
    }

    page.drawRectangle({ x: MARGIN, y: 50, width: CONTENT_W, height: 0.5, color: BORDER });
    page.drawText("HUB v2.4", { x: MARGIN, y: 32, size: 8, font: fontBold, color: MUTED });

    // ── Content Pages ────────────────────────────────────
    newPage();

    // KPI row
    sectionHeader("Visao Geral da Campanha");
    const kpis = [
      { label: "STATUS", value: (campaign.status || "draft").toUpperCase() },
      { label: "BUDGET", value: campaign.budget ? formatCurrency(campaign.budget) : "—" },
      { label: "PACOTES CRIATIVOS", value: String(packages?.length || 0) },
    ];
    const kpiW = (CONTENT_W - 12) / kpis.length;
    ensureSpace(70);
    kpis.forEach((kpi, i) => {
      const x = MARGIN + i * (kpiW + 6);
      page.drawRectangle({ x, y: y - 64, width: kpiW, height: 64, color: SURFACE });
      page.drawRectangle({ x, y, width: kpiW, height: 1.5, color: ACCENT });
      page.drawText(sanitize(kpi.label), { x: x + 12, y: y - 18, size: 7, font: fontBold, color: DIM });
      page.drawText(sanitize(kpi.value), { x: x + 12, y: y - 44, size: 18, font: fontBold, color: WHITE });
    });
    y -= 80;

    // Objective / Offer / Audience
    if (campaign.objective) {
      drawText("OBJETIVO:", { size: 8, bold: true, color: ACCENT });
      drawText(campaign.objective, { color: OFF_WHITE });
      y -= 8;
    }
    if (campaign.offer) {
      drawText("OFERTA:", { size: 8, bold: true, color: ACCENT });
      drawText(campaign.offer, { color: OFF_WHITE });
      y -= 8;
    }
    if (campaign.audience) {
      drawText("PUBLICO-ALVO:", { size: 8, bold: true, color: ACCENT });
      drawText(campaign.audience, { color: OFF_WHITE });
      y -= 8;
    }

    // Brand Kit
    if (brandKit) {
      sectionHeader("Brand Kit");
      drawText(`Nome: ${brandKit.name}`, { bold: true });
      if (brandKit.tone_of_voice) { drawText("Tom de Voz:", { size: 8, bold: true, color: ACCENT }); drawText(brandKit.tone_of_voice); y -= 6; }
      if (brandKit.colors && Array.isArray(brandKit.colors) && brandKit.colors.length > 0) {
        drawText("Cores:", { size: 8, bold: true, color: ACCENT }); drawText(brandKit.colors.join(" / "));
      }
    }

    // Creative Packages
    if (packages && packages.length > 0) {
      for (const pkg of packages) {
        newPage();
        sectionHeader(`Pacote: ${pkg.title || "Sem titulo"}`);

        const pkgData = (pkg.package_json || {}) as Record<string, unknown>;
        const concept = pkgData.concept as Record<string, unknown> | undefined;

        if (concept) {
          if (concept.headline) { drawText("HEADLINE:", { size: 8, bold: true, color: ACCENT }); drawText(String(concept.headline), { size: 12, bold: true }); y -= 10; }
          if (concept.subheadline) { drawText("SUBHEADLINE:", { size: 8, bold: true, color: ACCENT }); drawText(String(concept.subheadline), { size: 11 }); y -= 10; }
          if (concept.big_idea) { drawText("BIG IDEA:", { size: 8, bold: true, color: ACCENT }); drawText(String(concept.big_idea)); y -= 10; }
          if (concept.tom) { drawText("TOM DE VOZ:", { size: 8, bold: true, color: ACCENT }); drawText(String(concept.tom)); y -= 10; }
        }

        // Ideas
        if (pkgData.ideas && Array.isArray(pkgData.ideas)) {
          y -= 10;
          drawText("IDEIAS / POSTS SUGERIDOS", { size: 10, bold: true, color: ACCENT });
          y -= 6;
          for (let i = 0; i < pkgData.ideas.length; i++) {
            const idea = pkgData.ideas[i] as Record<string, unknown>;
            ensureSpace(40);
            drawText(`${i + 1}. ${idea.title || idea.hook || `Ideia ${i + 1}`}`, { bold: true });
            if (idea.description || idea.caption) drawText(String(idea.description || idea.caption), { x: MARGIN + 15, size: 9, color: MUTED });
            y -= 8;
          }
        }

        // Scripts
        if (pkgData.scripts && Array.isArray(pkgData.scripts)) {
          y -= 10;
          drawText("ROTEIROS", { size: 10, bold: true, color: ACCENT });
          y -= 6;
          for (let i = 0; i < pkgData.scripts.length; i++) {
            const script = pkgData.scripts[i] as Record<string, unknown>;
            ensureSpace(60);
            drawText(`Roteiro ${i + 1}`, { size: 10, bold: true, color: MUTED });
            if (script.hook) { drawText("Hook:", { size: 8, bold: true, color: DIM }); drawText(String(script.hook)); }
            if (script.body || script.desenvolvimento) drawText(String(script.body || script.desenvolvimento), { size: 9, color: MUTED });
            if (script.cta) { drawText("CTA:", { size: 8, bold: true, color: DIM }); drawText(String(script.cta)); }
            y -= 10;
          }
        }

        // Captions
        if (pkgData.captions && Array.isArray(pkgData.captions)) {
          y -= 10;
          drawText("LEGENDAS / COPYS", { size: 10, bold: true, color: ACCENT });
          y -= 6;
          for (let i = 0; i < Math.min(pkgData.captions.length, 5); i++) {
            ensureSpace(30);
            drawText(`Variacao ${i + 1}:`, { size: 9, bold: true, color: MUTED });
            drawText(String(pkgData.captions[i]));
            y -= 8;
          }
        }
      }
    }

    // ── Footers ────────────────────────────────────────────
    const pages = pdfDoc.getPages();
    pages.forEach((p, idx) => {
      p.drawLine({ start: { x: MARGIN, y: 42 }, end: { x: PAGE_W - MARGIN, y: 42 }, thickness: 0.5, color: BORDER });
      p.drawText("HUB v2.4", { x: MARGIN, y: 28, size: 7, font: fontBold, color: MUTED });
      if (idx > 0) {
        const ps = `Pagina ${idx} de ${pages.length - 1}`;
        const pw = font.widthOfTextAtSize(ps, 7);
        p.drawText(ps, { x: PAGE_W / 2 - pw / 2, y: 28, size: 7, font, color: DIM });
      }
      const rw = font.widthOfTextAtSize(refCode, 7);
      p.drawText(refCode, { x: PAGE_W - MARGIN - rw, y: 28, size: 7, font: fontBold, color: ACCENT });
    });

    const pdfBytes = await pdfDoc.save();
    const timestamp = Date.now();
    const filePath = `exports/campaign/${campaign_id}/${timestamp}.pdf`;

    const { error: uploadError } = await supabase.storage.from('exports').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('exports').createSignedUrl(filePath, 1800);
    const url = signedUrlError
      ? supabase.storage.from('exports').getPublicUrl(filePath).data.publicUrl
      : signedUrlData.signedUrl;
    console.log(`[export-campaign-pdf] PDF generated: ${filePath}`);

    return new Response(
      JSON.stringify({ success: true, signed_url: url, public_url: url, storage_path: filePath, file_name: `campaign_${campaign_id}_${timestamp}.pdf` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[export-campaign-pdf] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to export PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
