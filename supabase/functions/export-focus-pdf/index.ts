/**
 * export-focus-pdf — Premium PDF for Focus Mode execution plans
 * Layout: Single-page "Liquid Glass" style matching HUB v2.4 reference
 * Uses pdf-lib with dark premium design
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Design Tokens ────────────────────────────────────────
const BG      = rgb(0.02, 0.04, 0.06);   // near-black
const SURFACE = rgb(0.04, 0.07, 0.10);   // dark surface for table
const BORDER  = rgb(0.08, 0.12, 0.16);   // subtle border
const WHITE   = rgb(1, 1, 1);
const OFF_WHITE = rgb(0.85, 0.87, 0.89);
const MUTED   = rgb(0.40, 0.44, 0.48);
const DIM     = rgb(0.25, 0.28, 0.32);
const ACCENT  = rgb(0, 0.45, 0.60);      // #007399 SQUAD blue
const ACCENT_LIGHT = rgb(0.09, 0.61, 0.79);

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
    const PAGE_W = isLandscape ? 841.89 : 595.28;
    const PAGE_H = isLandscape ? 595.28 : 841.89;
    const MARGIN = 48;
    const CONTENT_W = PAGE_W - MARGIN * 2;

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const refCode = generateRefCode();
    const dateStr = formatDateShort();

    // ─── Calculations ─────────────────────────────────
    const totalBlocks = blocks.length;
    const totalTasks = blocks.reduce((s: number, b: any) => s + (b.tasks?.length || 0), 0);
    const totalMinutes = total_estimated_minutes || blocks.reduce((s: number, b: any) => s + (b.duration_minutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

    // ─── Helper: wrap text ────────────────────────────
    function wrapText(text: string, fontSize: number, maxWidth: number, f = font): string[] {
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (f.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
          lines.push(current);
          current = word;
        } else { current = test; }
      }
      if (current) lines.push(current);
      return lines;
    }

    // ─── Helper: truncate text to fit width ───────────
    function truncateText(text: string, fontSize: number, maxWidth: number, f = font): string {
      if (f.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
      let t = text;
      while (t.length > 0 && f.widthOfTextAtSize(t + '...', fontSize) > maxWidth) {
        t = t.substring(0, t.length - 1);
      }
      return t + '...';
    }

    // ─── Page management ──────────────────────────────
    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = PAGE_H - MARGIN;

    function drawBackground(p: any) {
      p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: BG });
      // Top accent line
      p.drawRectangle({ x: 0, y: PAGE_H - 2, width: PAGE_W, height: 2, color: ACCENT });
      // Bottom accent line
      p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 2, color: ACCENT });
    }

    function drawFooter(p: any) {
      const footerY = 18;
      p.drawLine({ start: { x: MARGIN, y: footerY + 10 }, end: { x: PAGE_W - MARGIN, y: footerY + 10 }, thickness: 0.5, color: BORDER });
      p.drawText(`HUB · ${refCode} · ${dateStr}`, { x: MARGIN, y: footerY, size: 6.5, font, color: DIM });
      const rightText = 'PLANO DE EXECUCAO';
      p.drawText(rightText, { x: PAGE_W - MARGIN - font.widthOfTextAtSize(rightText, 6.5), y: footerY, size: 6.5, font, color: DIM });
    }

    function newPage(): any {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      drawBackground(page);
      drawFooter(page);
      y = PAGE_H - MARGIN;
      return page;
    }

    function ensureSpace(needed: number) {
      if (y < MARGIN + 40 + needed) newPage();
    }

    // ─── Draw Page Background ─────────────────────────
    drawBackground(page);

    // ─── HEADER SECTION ───────────────────────────────
    // Subtitle line: "● MODO FOCO · BLOCOS OTIMIZADOS COM IA // HUB · CODE · DATE"
    const subtitleLeft = `MODO FOCO · BLOCOS OTIMIZADOS COM IA`;
    const subtitleRight = `// HUB · ${refCode} · ${dateStr}`;
    
    y = PAGE_H - MARGIN - 8;
    
    // Small accent dot
    page.drawCircle({ x: MARGIN + 4, y: y + 3, size: 3, color: ACCENT });
    
    page.drawText(subtitleLeft, { x: MARGIN + 14, y, size: 7, font, color: ACCENT_LIGHT });
    page.drawText(subtitleRight, { x: MARGIN + 14 + font.widthOfTextAtSize(subtitleLeft + '  ', 7), y, size: 7, font, color: MUTED });
    
    y -= 28;

    // Title: "PLANO DE EXECUCAO"
    page.drawText('PLANO DE EXECUCAO', { x: MARGIN, y, size: 26, font: fontBold, color: WHITE });

    // Stats box (right-aligned, same y as title)
    const statsBoxW = isLandscape ? 280 : 220;
    const statsBoxH = 44;
    const statsBoxX = PAGE_W - MARGIN - statsBoxW;
    const statsBoxY = y - 8;

    page.drawRectangle({
      x: statsBoxX, y: statsBoxY, width: statsBoxW, height: statsBoxH,
      color: SURFACE, borderColor: ACCENT, borderWidth: 0.5,
    });

    // Stats inside box
    const statItems = [
      { label: 'BLOCOS', value: `${totalBlocks}` },
      { label: 'TAREFAS', value: `${totalTasks}` },
      { label: 'TEMPO ESTIMADO', value: timeStr },
    ];
    const statColW = statsBoxW / statItems.length;
    statItems.forEach((s, i) => {
      const sx = statsBoxX + statColW * i + 10;
      page.drawText(s.label, { x: sx, y: statsBoxY + statsBoxH - 14, size: 5.5, font, color: MUTED });
      page.drawText(s.value, { x: sx, y: statsBoxY + 8, size: 14, font: fontBold, color: WHITE });
      // Divider between stats
      if (i < statItems.length - 1) {
        const divX = statsBoxX + statColW * (i + 1);
        page.drawLine({ start: { x: divX, y: statsBoxY + 6 }, end: { x: divX, y: statsBoxY + statsBoxH - 6 }, thickness: 0.5, color: BORDER });
      }
    });

    y -= 52;

    // ─── TABLE HEADER ─────────────────────────────────
    // Column layout
    const col1X = MARGIN;                           // Execução Estratégica
    const col2X = MARGIN + CONTENT_W * 0.50;        // Método
    const col3X = MARGIN + CONTENT_W * 0.67;        // Duração
    const col4X = PAGE_W - MARGIN;                  // Progresso (right-aligned)

    const colHeaders = [
      { text: 'EXECUCAO ESTRATEGICA', x: col1X + 16 },
      { text: 'METODO', x: col2X },
      { text: 'DURACAO', x: col3X },
    ];

    // Draw column header line
    page.drawLine({ start: { x: MARGIN, y: y }, end: { x: PAGE_W - MARGIN, y: y }, thickness: 0.5, color: BORDER });
    y -= 14;

    colHeaders.forEach(h => {
      page.drawText(h.text, { x: h.x, y, size: 6, font, color: MUTED });
    });
    // Right-aligned "PROGRESSO"
    const progText = 'PROGRESSO';
    page.drawText(progText, { x: col4X - font.widthOfTextAtSize(progText, 6), y, size: 6, font, color: MUTED });

    y -= 10;
    page.drawLine({ start: { x: MARGIN, y: y }, end: { x: PAGE_W - MARGIN, y: y }, thickness: 0.5, color: BORDER });
    y -= 6;

    // ─── BLOCK ROWS ───────────────────────────────────
    for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
      const block = blocks[bIdx];
      const blockTasks = block.tasks || [];
      const ROW_H = 38;

      ensureSpace(ROW_H + 4);

      // Determine progress status
      let progressLabel = 'Scheduled';
      if (bIdx === 0) progressLabel = 'Active';
      else if (bIdx === 1) progressLabel = 'Queued';
      else if (bIdx < 3) progressLabel = 'Queued';
      else if (block.type === 'shallow_work') progressLabel = 'Pending';

      // Determine type color
      const isDeep = block.type === 'deep_work';
      const isBreak = block.type === 'break';
      const dotColor = isBreak ? rgb(0.85, 0.65, 0.15) : isDeep ? ACCENT : MUTED;

      // Row background (subtle)
      page.drawRectangle({
        x: MARGIN, y: y - ROW_H, width: CONTENT_W, height: ROW_H,
        color: BG, // transparent-ish
      });

      // Status dot
      const dotY = y - ROW_H / 2 + 3;
      page.drawCircle({ x: MARGIN + 8, y: dotY, size: 3.5, color: dotColor });

      // Block title
      const titleMaxW = (col2X - col1X - 30);
      const blockTitle = sanitize(block.title || `Bloco ${bIdx + 1}`);
      const truncTitle = truncateText(blockTitle, 10, titleMaxW, fontBold);
      page.drawText(truncTitle, { x: col1X + 18, y: y - 15, size: 10, font: fontBold, color: OFF_WHITE });

      // Task names as subtitle
      const taskNames = blockTasks.map((t: any) => sanitize(t.title)).join(' / ');
      const truncSub = truncateText(taskNames.toUpperCase(), 6, titleMaxW, font);
      page.drawText(truncSub, { x: col1X + 18, y: y - 27, size: 6, font, color: DIM });

      // Method
      const methodLabel = isBreak ? 'PAUSA' : isDeep ? 'DEEP WORK' : 'SHALLOW WORK';
      page.drawText(methodLabel, { x: col2X, y: y - 18, size: 7.5, font, color: MUTED });

      // Duration
      const technique = sanitize(block.technique || '');
      const duration = `${block.duration_minutes || 0}min`;
      const durText = technique ? `${technique} ${duration}` : duration;
      page.drawText(durText, { x: col3X, y: y - 18, size: 7.5, font, color: MUTED });

      // Progress (right-aligned)
      const progColor = progressLabel === 'Active' ? WHITE : MUTED;
      page.drawText(progressLabel, { x: col4X - font.widthOfTextAtSize(progressLabel, 7.5), y: y - 18, size: 7.5, font, color: progColor });

      // Bottom border
      page.drawLine({
        start: { x: MARGIN, y: y - ROW_H },
        end: { x: PAGE_W - MARGIN, y: y - ROW_H },
        thickness: 0.3, color: rgb(1, 1, 1), opacity: 0.03,
      });

      y -= ROW_H + 2;
    }

    // ─── TIPS + FOOTER SECTION ────────────────────────
    ensureSpace(80);
    y -= 12;

    // Tips title
    page.drawText('DICAS DE PRODUTIVIDADE', { x: MARGIN, y, size: 7, font: fontBold, color: ACCENT_LIGHT });
    y -= 16;

    // Tips in columns (up to 3)
    const tipsList = (tips || []).slice(0, 3);
    const tipColW = CONTENT_W / Math.max(tipsList.length, 1);

    tipsList.forEach((tip: string, i: number) => {
      const tipX = MARGIN + tipColW * i;
      const tipText = sanitize(tip);
      const lines = wrapText(`> ${tipText}`, 7, tipColW - 16);
      let tipY = y;
      for (const line of lines) {
        // Color the ">" in accent
        if (line.startsWith('>')) {
          page.drawText('>', { x: tipX, y: tipY, size: 7, font, color: ACCENT_LIGHT });
          page.drawText(line.substring(2), { x: tipX + font.widthOfTextAtSize('> ', 7), y: tipY, size: 7, font, color: OFF_WHITE });
        } else {
          page.drawText(line, { x: tipX, y: tipY, size: 7, font, color: OFF_WHITE });
        }
        tipY -= 11;
      }
    });

    y -= 40;

    // Orientation badge (bottom right)
    const orientLabel = isLandscape ? 'ORIENTACAO: PAISAGEM' : 'ORIENTACAO: RETRATO';
    const orientW = font.widthOfTextAtSize(orientLabel, 6.5);
    page.drawText(orientLabel, { x: PAGE_W - MARGIN - orientW, y: MARGIN + 32, size: 6.5, font, color: MUTED });

    // Powered by
    const poweredText = 'POWERED BY SQUAD///FILM';
    const poweredW = font.widthOfTextAtSize(poweredText, 6.5);
    page.drawText(poweredText, { x: PAGE_W - MARGIN - poweredW, y: MARGIN + 20, size: 6.5, font: fontBold, color: MUTED });

    // Footer
    drawFooter(page);

    // ─── Save & Upload ────────────────────────────────
    const pdfBytes = await pdfDoc.save();
    const fileName = `PLANO_FOCO_${dateStr}_${refCode}.pdf`;
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
