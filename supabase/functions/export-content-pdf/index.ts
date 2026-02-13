/**
 * export-content-pdf — Premium PDF for Content Item exports
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
const ACCENT  = rgb(0.976, 0.651, 0.086);
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

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return "—";
  try { return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return "—"; }
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
    const { content_item_id } = await req.json();
    if (!content_item_id) throw new Error('Missing required field: content_item_id');

    console.log(`[export-content-pdf] Exporting content: ${content_item_id}`);

    const [{ data: content, error: contentError }, { data: checklist }, { data: comments }] = await Promise.all([
      supabase.from('content_items').select('*').eq('id', content_item_id).single(),
      supabase.from('content_checklist').select('*').eq('content_item_id', content_item_id).order('created_at'),
      supabase.from('content_comments').select('*').eq('content_item_id', content_item_id).order('created_at', { ascending: false }).limit(20),
    ]);

    if (contentError || !content) throw new Error(`Content not found: ${contentError?.message}`);

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

    // ── Cover Page ────────────────────────────────────────
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });
    page.drawRectangle({ x: 0, y: PAGE_H - 4, width: PAGE_W, height: 4, color: ACCENT });
    page.drawRectangle({ x: 0, y: PAGE_H - 200, width: PAGE_W, height: 200, color: rgb(0.976 * 0.08, 0.651 * 0.08, 0.086 * 0.08) });

    page.drawText("HUB SOCIAL", { x: MARGIN, y: PAGE_H - 60, size: 10, font: fontBold, color: ACCENT });

    const titleLines = wrapText(sanitize(content.title || "Conteudo"), 28, CONTENT_W);
    let ty = PAGE_H - 120;
    for (const line of titleLines) {
      page.drawText(line, { x: MARGIN, y: ty, size: 28, font: fontBold, color: WHITE });
      ty -= 36;
    }
    ty -= 8;
    page.drawText("Ficha de Conteudo", { x: MARGIN, y: ty, size: 12, font, color: MUTED });
    ty -= 30;
    page.drawRectangle({ x: MARGIN, y: ty, width: 60, height: 2, color: ACCENT });
    ty -= 40;

    const statusLabels: Record<string, string> = { idea: "Ideia", scripting: "Roteiro", recording: "Gravacao", editing: "Edicao", review: "Revisao", scheduled: "Agendado", published: "Publicado" };
    const meta = [
      { label: "STATUS", value: (statusLabels[content.status] || content.status || "Rascunho").toUpperCase() },
      { label: "CANAL", value: (content.channel || "—").toUpperCase() },
      { label: "FORMATO", value: (content.format || "—").toUpperCase() },
      { label: "DATA DE EMISSAO", value: formatDateShort() },
      { label: "CODIGO", value: refCode },
    ];
    for (const m of meta) {
      page.drawText(sanitize(m.label), { x: MARGIN, y: ty, size: 7, font: fontBold, color: DIM });
      page.drawText(sanitize(m.value), { x: MARGIN + 130, y: ty, size: 9, font, color: OFF_WHITE });
      ty -= 18;
    }
    page.drawRectangle({ x: MARGIN, y: 50, width: CONTENT_W, height: 0.5, color: BORDER });
    page.drawText("HUB v2.4", { x: MARGIN, y: 32, size: 8, font: fontBold, color: MUTED });

    // ── Copy & Roteiro ────────────────────────────────────
    newPage();
    sectionHeader("Copy e Roteiro");

    if (content.hook) { drawText("HOOK / GANCHO:", { size: 8, bold: true, color: ACCENT }); drawText(content.hook, { size: 11 }); y -= 10; }
    if (content.caption_short) { drawText("CAPTION CURTA:", { size: 8, bold: true, color: ACCENT }); drawText(content.caption_short); y -= 10; }
    if (content.caption_long) { drawText("CAPTION LONGA:", { size: 8, bold: true, color: ACCENT }); drawText(content.caption_long); y -= 10; }
    if (content.cta) { drawText("CTA:", { size: 8, bold: true, color: ACCENT }); drawText(content.cta); y -= 10; }
    if (content.hashtags) { drawText("HASHTAGS:", { size: 8, bold: true, color: ACCENT }); drawText(content.hashtags, { size: 9, color: ACCENT }); y -= 10; }
    if (content.script) { drawText("ROTEIRO:", { size: 8, bold: true, color: ACCENT }); drawText(content.script); y -= 10; }

    // Briefing
    if (content.notes) {
      sectionHeader("Briefing");
      drawText(content.notes, { color: MUTED });
    }

    // Dates
    const dates = [];
    if (content.due_at) dates.push(`Prazo: ${formatDateBR(content.due_at)}`);
    if (content.scheduled_at) dates.push(`Agendado: ${formatDateBR(content.scheduled_at)}`);
    if (content.published_at) dates.push(`Publicado: ${formatDateBR(content.published_at)}`);
    if (dates.length > 0) { y -= 10; drawText(dates.join("  |  "), { size: 9, color: MUTED }); }

    // Checklist
    if (checklist && checklist.length > 0) {
      sectionHeader("Checklist");
      for (const item of checklist) {
        ensureSpace(20);
        const isDone = item.status === "done";
        const mark = isDone ? "[x]" : "[ ]";
        const color = isDone ? SUCCESS : MUTED;
        drawText(`${mark} ${item.title}`, { color, bold: !isDone });
      }
    }

    // Comments
    if (comments && comments.length > 0) {
      sectionHeader("Comentarios de Revisao");
      for (const c of comments) {
        ensureSpace(40);
        const author = c.author_name || "Usuario";
        const date = formatDateBR(c.created_at);
        drawText(`${author} - ${date}`, { size: 9, bold: true, color: DIM });
        drawText(c.text, { color: OFF_WHITE });
        y -= 8;
      }
    }

    // Publication
    if (content.post_url) {
      sectionHeader("Publicacao");
      drawText("Link do Post:", { size: 8, bold: true, color: ACCENT });
      drawText(content.post_url, { size: 9, color: ACCENT });
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
    const filePath = `exports/content/${content_item_id}/${timestamp}.pdf`;

    const { error: uploadError } = await supabase.storage.from('exports').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('exports').createSignedUrl(filePath, 1800);
    const url = signedUrlError
      ? supabase.storage.from('exports').getPublicUrl(filePath).data.publicUrl
      : signedUrlData.signedUrl;
    console.log(`[export-content-pdf] PDF generated: ${filePath}`);

    return new Response(
      JSON.stringify({ success: true, signed_url: url, public_url: url, storage_path: filePath, file_name: `content_${content_item_id}_${timestamp}.pdf` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[export-content-pdf] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to export PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
