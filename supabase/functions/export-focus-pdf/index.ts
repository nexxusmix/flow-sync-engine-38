/**
 * export-focus-pdf — Premium PDF for Focus Mode execution plans
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
const ACCENT  = rgb(0.09, 0.61, 0.79); // #179bc7 SQUAD blue
const PURPLE  = rgb(0.58, 0.35, 0.98);  // Deep work
const BLUE    = rgb(0.24, 0.52, 0.98);  // Shallow work
const GREEN   = rgb(0.13, 0.77, 0.37);  // Break
const SUCCESS = rgb(0.13, 0.77, 0.37);

const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 48;

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
    const { blocks, total_estimated_minutes, tips, orientation = 'portrait' } = await req.json();

    if (!blocks || !Array.isArray(blocks)) throw new Error('Missing blocks data');

    const isLandscape = orientation === 'landscape';
    const PAGE_W = isLandscape ? A4_H : A4_W;
    const PAGE_H = isLandscape ? A4_W : A4_H;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const refCode = generateRefCode();

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

    function drawBg(p: any) {
      p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });
      p.drawRectangle({ x: 0, y: PAGE_H - 2, width: PAGE_W, height: 2, color: ACCENT });
    }

    function newPage() {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      drawBg(page);
      y = PAGE_H - MARGIN;
    }

    function ensureSpace(needed: number) { if (y < MARGIN + 40 + needed) newPage(); }

    function drawFooter(p: any) {
      p.drawLine({ start: { x: MARGIN, y: MARGIN - 8 }, end: { x: PAGE_W - MARGIN, y: MARGIN - 8 }, thickness: 0.5, color: BORDER });
      p.drawText(`HUB · ${refCode} · ${formatDateShort()}`, { x: MARGIN, y: MARGIN - 22, size: 7, font, color: DIM });
      p.drawText('PLANO DE EXECUCAO', { x: PAGE_W - MARGIN - font.widthOfTextAtSize('PLANO DE EXECUCAO', 7), y: MARGIN - 22, size: 7, font, color: DIM });
    }

    // ─── Cover ──────────────────────────────────────────
    drawBg(page);

    // Accent stripe
    page.drawRectangle({ x: MARGIN, y: PAGE_H - MARGIN - 4, width: 60, height: 4, color: ACCENT });

    y = PAGE_H - MARGIN - 40;
    page.drawText('PLANO DE EXECUCAO', { x: MARGIN, y, size: 28, font: fontBold, color: WHITE });
    y -= 32;
    page.drawText('MODO FOCO · BLOCOS OTIMIZADOS COM IA', { x: MARGIN, y, size: 10, font, color: MUTED });
    y -= 40;

    // Stats bar
    const totalBlocks = blocks.length;
    const totalTasksCount = blocks.reduce((s: number, b: any) => s + (b.tasks?.length || 0), 0);
    const totalMinutes = total_estimated_minutes || blocks.reduce((s: number, b: any) => s + (b.duration_minutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

    page.drawRectangle({ x: MARGIN, y: y - 36, width: CONTENT_W, height: 36, color: SURFACE, borderColor: BORDER, borderWidth: 0.5 });
    const stats = [
      { label: 'BLOCOS', value: `${totalBlocks}` },
      { label: 'TAREFAS', value: `${totalTasksCount}` },
      { label: 'TEMPO ESTIMADO', value: timeStr },
      { label: 'ORIENTACAO', value: isLandscape ? 'PAISAGEM' : 'RETRATO' },
    ];
    const statW = CONTENT_W / stats.length;
    stats.forEach((s, i) => {
      const sx = MARGIN + statW * i + 12;
      page.drawText(s.label, { x: sx, y: y - 14, size: 6, font, color: MUTED });
      page.drawText(s.value, { x: sx, y: y - 28, size: 11, font: fontBold, color: WHITE });
    });
    y -= 56;

    // Tips
    if (tips && tips.length > 0) {
      page.drawText('DICAS DE PRODUTIVIDADE', { x: MARGIN, y, size: 8, font: fontBold, color: ACCENT });
      y -= 16;
      for (const tip of tips) {
        const tipText = sanitize(tip);
        const lines = wrapText(`> ${tipText}`, 9, CONTENT_W - 16);
        for (const line of lines) {
          page.drawText(line, { x: MARGIN + 8, y, size: 9, font, color: OFF_WHITE });
          y -= 14;
        }
      }
      y -= 8;
    }

    drawFooter(page);

    // ─── Blocks ─────────────────────────────────────────
    newPage();

    for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
      const block = blocks[bIdx];
      const blockTasks = block.tasks || [];
      const blockHeight = 52 + blockTasks.length * 20;
      ensureSpace(blockHeight);

      const blockColor = block.type === 'deep_work' ? PURPLE : block.type === 'break' ? GREEN : BLUE;
      const typeLabel = block.type === 'deep_work' ? 'DEEP WORK' : block.type === 'break' ? 'PAUSA' : 'SHALLOW WORK';

      // Block card background
      page.drawRectangle({ x: MARGIN, y: y - blockHeight, width: CONTENT_W, height: blockHeight, color: SURFACE, borderColor: BORDER, borderWidth: 0.5 });
      // Left accent bar
      page.drawRectangle({ x: MARGIN, y: y - blockHeight, width: 3, height: blockHeight, color: blockColor });

      // Block header
      const headerY = y - 16;
      page.drawText(sanitize(block.title || `Bloco ${bIdx + 1}`), { x: MARGIN + 14, y: headerY, size: 11, font: fontBold, color: WHITE });
      
      // Type badge
      const badgeText = typeLabel;
      const badgeW = font.widthOfTextAtSize(badgeText, 7) + 12;
      const badgeX = PAGE_W - MARGIN - badgeW - 8;
      page.drawRectangle({ x: badgeX, y: headerY - 3, width: badgeW, height: 14, color: blockColor, opacity: 0.2 });
      page.drawText(badgeText, { x: badgeX + 6, y: headerY, size: 7, font: fontBold, color: blockColor });

      // Technique + duration
      page.drawText(`${sanitize(block.technique)} · ${block.duration_minutes || 0}min`, { x: MARGIN + 14, y: headerY - 16, size: 8, font, color: MUTED });

      // Tasks
      let taskY = headerY - 36;
      for (const task of blockTasks) {
        page.drawText('○', { x: MARGIN + 16, y: taskY, size: 8, font, color: DIM });
        const taskTitle = sanitize(task.title);
        const truncated = font.widthOfTextAtSize(taskTitle, 9) > CONTENT_W - 100 
          ? taskTitle.substring(0, 60) + '...' 
          : taskTitle;
        page.drawText(truncated, { x: MARGIN + 28, y: taskY, size: 9, font, color: OFF_WHITE });
        const estText = `${task.estimated_minutes || 0}min`;
        page.drawText(estText, { x: PAGE_W - MARGIN - font.widthOfTextAtSize(estText, 8) - 10, y: taskY, size: 8, font, color: MUTED });
        taskY -= 20;
      }

      y -= blockHeight + 12;
    }

    drawFooter(page);

    // ─── Save & Return ──────────────────────────────────
    const pdfBytes = await pdfDoc.save();
    const fileName = `PLANO_FOCO_${formatDateShort()}_${refCode}.pdf`;
    const filePath = `focus-plans/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('exports').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('exports').createSignedUrl(filePath, 1800);
    if (signedUrlError) throw signedUrlError;

    console.log(`[export-focus-pdf] PDF generated: ${filePath}`);

    return new Response(JSON.stringify({
      success: true,
      signed_url: signedUrlData.signedUrl,
      storage_path: filePath,
      file_name: fileName,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[export-focus-pdf] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to export PDF' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
