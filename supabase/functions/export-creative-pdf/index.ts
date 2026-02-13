/**
 * export-creative-pdf — Premium PDF for Creative Studio exports
 * Uses pdf-lib with dark premium design matching HUB v2.4
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BG      = rgb(0.043, 0.059, 0.078);
const SURFACE = rgb(0.067, 0.078, 0.098);
const BORDER  = rgb(0.118, 0.133, 0.157);
const WHITE   = rgb(1, 1, 1);
const OFF_WHITE = rgb(0.88, 0.89, 0.91);
const MUTED   = rgb(0.45, 0.47, 0.50);
const DIM     = rgb(0.30, 0.32, 0.35);
const ACCENT  = rgb(0.024, 0.714, 0.831); // Cyan for produtora
const SUCCESS = rgb(0.133, 0.773, 0.369);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

function sanitize(str: string | null | undefined): string {
  if (!str) return "";
  return String(str).replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u2026/g, "...").replace(/[\u2013\u2014]/g, "-").replace(/\u2022/g, "*").replace(/[^\x00-\xFF]/g, "");
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { type, id } = await req.json();
    if (!type || !id) throw new Error('Missing required fields: type and id');

    console.log(`[export-creative-pdf] Exporting ${type}: ${id}`);

    let title = '';
    let briefData: Record<string, unknown> = {};
    let outputs: Record<string, unknown> = {};

    if (type === 'studio_run') {
      const { data: brief, error } = await supabase.from('creative_briefs').select('*, brand_kits(*)').eq('id', id).single();
      if (error || !brief) throw new Error(`Brief not found: ${error?.message}`);
      title = brief.title || 'Pacote Criativo';
      briefData = { title: brief.title, objective: brief.objective, delivery_type: brief.delivery_type, package_type: brief.package_type, input_text: brief.input_text, brand_kit: brief.brand_kits?.name, created_at: brief.created_at };
      const [{ data: outputsData }, { data: scenesData }] = await Promise.all([
        supabase.from('creative_outputs').select('*').eq('brief_id', id),
        supabase.from('storyboard_scenes').select('*').eq('brief_id', id).order('scene_number'),
      ]);
      outputs = {
        concept: outputsData?.find((o: any) => o.type === 'concept')?.content,
        script: outputsData?.find((o: any) => o.type === 'script')?.content,
        moodboard: outputsData?.find((o: any) => o.type === 'moodboard')?.content,
        shotlist: outputsData?.find((o: any) => o.type === 'shotlist')?.content,
        storyboard: scenesData,
      };
    } else if (type === 'creative_package') {
      const { data: pkg, error } = await supabase.from('campaign_creative_packages').select('*, campaigns(*)').eq('id', id).single();
      if (error || !pkg) throw new Error(`Package not found: ${error?.message}`);
      title = pkg.title || 'Pacote Criativo';
      briefData = { title: pkg.title, campaign: pkg.campaigns?.name, created_at: pkg.created_at };
      outputs = (pkg.package_json || {}) as Record<string, unknown>;
    }

    console.log(`[export-creative-pdf] Generating PDF for: ${title}`);

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const refCode = generateRefCode();

    let page: ReturnType<typeof pdfDoc.addPage>;
    let y = PAGE_H - MARGIN;

    function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
      const words = text.split(" "); const lines: string[] = []; let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(test, fontSize) > maxWidth && current) { lines.push(current); current = word; }
        else { current = test; }
      }
      if (current) lines.push(current);
      return lines;
    }

    function newPage() {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
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
      for (const line of wrapText(clean, size, maxWidth)) {
        ensureSpace(size * 1.5);
        page.drawText(line, { x, y, size, font: f, color });
        y -= size * 1.5;
      }
    }

    let sectionCounter = 0;
    function sectionHeader(title: string) {
      sectionCounter++;
      const num = String(sectionCounter).padStart(2, "0");
      ensureSpace(40); y -= 16;
      page.drawRectangle({ x: MARGIN, y: y - 1, width: 3, height: 16, color: ACCENT });
      page.drawText(sanitize(`${num} — ${title.toUpperCase()}`), { x: MARGIN + 12, y, size: 10, font: fontBold, color: ACCENT });
      y -= 8;
      page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 0.5, color: BORDER });
      y -= 16;
    }

    // ── Cover ────────────────────────────────────────────
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });
    page.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: ACCENT });
    page.drawRectangle({ x: 0, y: PAGE_H - 200, width: PAGE_W, height: 200, color: rgb(0.024 * 0.08, 0.714 * 0.08, 0.831 * 0.08) });

    page.drawText("HUB PRODUTORA", { x: MARGIN, y: PAGE_H - 60, size: 10, font: fontBold, color: ACCENT });

    const titleLines = wrapText(sanitize(title), 28, CONTENT_W);
    let ty = PAGE_H - 120;
    for (const line of titleLines) {
      page.drawText(line, { x: MARGIN, y: ty, size: 28, font: fontBold, color: WHITE });
      ty -= 36;
    }
    ty -= 8;
    if (briefData.campaign) page.drawText(sanitize(`Campanha: ${briefData.campaign}`), { x: MARGIN, y: ty, size: 12, font, color: MUTED });
    else page.drawText("Pacote Criativo Completo", { x: MARGIN, y: ty, size: 12, font, color: MUTED });
    ty -= 30;
    page.drawRectangle({ x: MARGIN, y: ty, width: 60, height: 2, color: ACCENT });
    ty -= 40;

    const coverMeta = [
      { label: "DATA DE EMISSAO", value: formatDateShort() },
      { label: "CODIGO", value: refCode },
      { label: "TIPO", value: (type === "studio_run" ? "STUDIO RUN" : "PACOTE CRIATIVO") },
      { label: "PLATAFORMA", value: "HUB PRODUTORA" },
    ];
    if (briefData.objective) coverMeta.unshift({ label: "OBJETIVO", value: sanitize(String(briefData.objective)).substring(0, 60) });
    for (const m of coverMeta) {
      page.drawText(sanitize(m.label), { x: MARGIN, y: ty, size: 7, font: fontBold, color: DIM });
      page.drawText(sanitize(m.value), { x: MARGIN + 130, y: ty, size: 9, font, color: OFF_WHITE });
      ty -= 18;
    }
    page.drawRectangle({ x: MARGIN, y: 50, width: CONTENT_W, height: 0.5, color: BORDER });
    page.drawText("HUB v2.4", { x: MARGIN, y: 32, size: 8, font: fontBold, color: MUTED });

    // ── Content ──────────────────────────────────────────
    // Briefing
    if (briefData.input_text) {
      newPage();
      sectionHeader("Briefing");
      drawText(String(briefData.input_text), { color: MUTED });
    }

    // Concept
    const concept = outputs.concept as Record<string, unknown> | undefined;
    if (concept) {
      newPage();
      sectionHeader("Conceito Narrativo");
      if (concept.headline) { drawText("HEADLINE:", { size: 8, bold: true, color: ACCENT }); drawText(String(concept.headline), { size: 12, bold: true }); y -= 10; }
      if (concept.subheadline) { drawText("SUBHEADLINE:", { size: 8, bold: true, color: ACCENT }); drawText(String(concept.subheadline), { size: 11 }); y -= 10; }
      if (concept.big_idea) { drawText("BIG IDEA:", { size: 8, bold: true, color: ACCENT }); drawText(String(concept.big_idea)); y -= 10; }
      if (concept.narrativa) { drawText("NARRATIVA:", { size: 8, bold: true, color: ACCENT }); drawText(String(concept.narrativa)); y -= 10; }
      if (concept.tom) { drawText("TOM DE VOZ:", { size: 8, bold: true, color: ACCENT }); drawText(String(concept.tom)); }
    }

    // Script
    const script = outputs.script as Record<string, unknown> | undefined;
    if (script) {
      newPage();
      sectionHeader("Roteiro");
      if (script.hook) { drawText("HOOK:", { size: 8, bold: true, color: ACCENT }); drawText(String(script.hook), { size: 11 }); y -= 10; }
      if (script.desenvolvimento) { drawText("DESENVOLVIMENTO:", { size: 8, bold: true, color: ACCENT }); drawText(String(script.desenvolvimento)); y -= 10; }
      if (script.cta) { drawText("CTA:", { size: 8, bold: true, color: ACCENT }); drawText(String(script.cta)); }
    }

    // Storyboard
    const storyboard = outputs.storyboard as Array<Record<string, unknown>> | undefined;
    if (storyboard && storyboard.length > 0) {
      newPage();
      sectionHeader("Storyboard");
      for (const scene of storyboard) {
        ensureSpace(60);
        drawText(`CENA ${scene.scene_number || "?"}`, { size: 11, bold: true });
        if (scene.title) drawText(String(scene.title), { bold: true, size: 10 });
        if (scene.description) drawText(String(scene.description), { color: MUTED });
        const details = [];
        if (scene.camera) details.push(`Camera: ${scene.camera}`);
        if (scene.duration_sec) details.push(`Duracao: ${scene.duration_sec}s`);
        if (scene.emotion) details.push(`Emocao: ${scene.emotion}`);
        if (details.length > 0) drawText(details.join("  |  "), { size: 8, color: DIM });
        y -= 12;
      }
    }

    // Shotlist
    const shotlist = outputs.shotlist as Array<Record<string, unknown>> | undefined;
    if (shotlist && shotlist.length > 0) {
      newPage();
      sectionHeader("Shotlist");
      for (let i = 0; i < shotlist.length; i++) {
        const shot = shotlist[i];
        ensureSpace(40);
        drawText(`#${i + 1} ${shot.plano || ""}`, { bold: true, color: ACCENT });
        if (shot.descricao) drawText(String(shot.descricao), { x: MARGIN + 15, size: 9, color: MUTED });
        const details = [];
        if (shot.lente_sugerida) details.push(`Lente: ${shot.lente_sugerida}`);
        if (shot.ambiente) details.push(`Ambiente: ${shot.ambiente}`);
        if (shot.luz) details.push(`Luz: ${shot.luz}`);
        if (details.length > 0) drawText(details.join("  "), { x: MARGIN + 15, size: 8, color: DIM });
        y -= 8;
      }
    }

    // Moodboard
    const moodboard = outputs.moodboard as Record<string, unknown> | undefined;
    if (moodboard) {
      newPage();
      sectionHeader("Moodboard");
      if (moodboard.direcao_de_arte) { drawText("DIRECAO DE ARTE:", { size: 8, bold: true, color: ACCENT }); drawText(String(moodboard.direcao_de_arte)); y -= 10; }
      const paleta = moodboard.paleta as string[] | undefined;
      if (paleta && paleta.length > 0) { drawText("PALETA DE CORES:", { size: 8, bold: true, color: ACCENT }); drawText(paleta.join(" / ")); y -= 10; }
      const refs = moodboard.referencias as string[] | undefined;
      if (refs && refs.length > 0) { drawText("REFERENCIAS:", { size: 8, bold: true, color: ACCENT }); for (const r of refs) drawText(`* ${r}`, { size: 9 }); }
    }

    // Captions
    const captions = outputs.captionVariations as string[] | undefined;
    if (captions && captions.length > 0) {
      sectionHeader("Variacoes de Legenda");
      for (let i = 0; i < captions.length; i++) {
        ensureSpace(30);
        drawText(`Variacao ${i + 1}:`, { size: 9, bold: true, color: MUTED });
        drawText(captions[i]);
        y -= 8;
      }
    }

    // Hashtags
    const hashtags = outputs.hashtags as string[] | undefined;
    if (hashtags && hashtags.length > 0) {
      sectionHeader("Hashtags");
      drawText(hashtags.join(" "), { color: ACCENT });
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
    const fileName = `${sanitize(title).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 40)}-${timestamp}.pdf`;
    const storagePath = `${type === 'studio_run' ? 'studio' : 'packages'}/${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('exports').upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('exports').createSignedUrl(storagePath, 1800);
    const url = signedUrlError
      ? supabase.storage.from('exports').getPublicUrl(storagePath).data.publicUrl
      : signedUrlData.signedUrl;
    console.log(`[export-creative-pdf] PDF generated: ${storagePath}`);

    return new Response(
      JSON.stringify({ success: true, signed_url: url, public_url: url, storage_path: storagePath, file_name: fileName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[export-creative-pdf] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
