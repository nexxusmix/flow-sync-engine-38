/**
 * SquadPdfBuilder — Shared PDF Design System "SQUAD Swiss"
 * All PDF exports use this unified design matching the HTML reference.
 * 
 * Tokens, colors, layout, and reusable drawing methods.
 */
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

// ─── Design Tokens ────────────────────────────────────────
export const SQUAD = {
  bg:       rgb(0, 0, 0),              // #000000 preto absoluto
  surface:  rgb(0.04, 0.04, 0.04),     // #0A0A0A cards
  border:   rgb(0.10, 0.10, 0.10),     // #1A1A1A bordas
  accent:   rgb(0, 0.612, 0.792),      // #009CCA azul SQUAD
  white:    rgb(1, 1, 1),              // #FFFFFF
  offWhite: rgb(0.85, 0.87, 0.89),     // texto principal
  muted:    rgb(0.55, 0.55, 0.55),     // #8C8C8C labels
  dim:      rgb(0.29, 0.29, 0.29),     // #4A4A4A metadata
  success:  rgb(0.133, 0.773, 0.369),  // #22C55E
  warning:  rgb(0.918, 0.702, 0.031),  // #EAB308
  error:    rgb(0.937, 0.267, 0.267),  // #EF4444
};

export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const MARGIN = 48;
export const CONTENT_W = PAGE_W - MARGIN * 2;

// ─── Helpers ──────────────────────────────────────────────
export function sanitize(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/[^\x00-\xFF]/g, "");
}

export function formatCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 }).format(v);
}

export function formatDate(date: string | Date | null): string {
  if (!date) return "--";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return "--"; }
}

export function formatDateShort(): string {
  const n = new Date();
  return `${String(n.getDate()).padStart(2, "0")}-${String(n.getMonth() + 1).padStart(2, "0")}-${n.getFullYear()}`;
}

export function getPeriodDates(period: string) {
  const end = new Date(); const start = new Date(); let label = "";
  switch (period) {
    case "1m": case "30d": start.setMonth(start.getMonth() - 1); label = "Ultimos 30 dias"; break;
    case "3m": start.setMonth(start.getMonth() - 3); label = "Ultimos 3 meses"; break;
    case "6m": start.setMonth(start.getMonth() - 6); label = "Ultimos 6 meses"; break;
    case "1y": case "12m": start.setFullYear(start.getFullYear() - 1); label = "Ultimos 12 meses"; break;
    default: start.setMonth(start.getMonth() - 3); label = "Ultimos 3 meses";
  }
  return { start, end, label };
}

export function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 50);
}

// ─── SquadPdfBuilder ──────────────────────────────────────
export class SquadPdfBuilder {
  doc!: InstanceType<typeof PDFDocument>;
  font!: any;
  fontBold!: any;
  page!: any;
  y = PAGE_H - MARGIN;
  pageCount = 0;
  sectionCounter = 0;

  async init() {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.fontBold = await this.doc.embedFont(StandardFonts.HelveticaBold);
  }

  // ── Brand Header: [SQ] left + "SQUAD FILM | 2026" right ──
  brandHeader(p?: any) {
    const pg = p || this.page;
    // SQ badge: rectangle with accent border + "SQ" text
    const badgeW = 32;
    const badgeH = 18;
    const badgeX = MARGIN;
    const badgeY = PAGE_H - MARGIN + 2;
    pg.drawRectangle({ x: badgeX, y: badgeY, width: badgeW, height: badgeH, color: SQUAD.bg, borderColor: SQUAD.accent, borderWidth: 1 });
    pg.drawText("SQ", { x: badgeX + 7, y: badgeY + 4, size: 10, font: this.fontBold, color: SQUAD.accent });

    // Right side: "SQUAD FILM | 2026"
    const rightText = "SQUAD FILM | 2026";
    const rw = this.font.widthOfTextAtSize(rightText, 7);
    pg.drawText(rightText, { x: PAGE_W - MARGIN - rw, y: badgeY + 5, size: 7, font: this.font, color: SQUAD.dim });
  }

  // ── New Page with bg + brand header ─────────────────────
  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pageCount++;
    this.page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: SQUAD.bg });
    this.brandHeader();
    this.y = PAGE_H - MARGIN - 28;
  }

  // ── Cover Page ──────────────────────────────────────────
  coverPage(opts: { subtitle: string; titleLine1: string; titleLine2?: string; description?: string; date?: string }) {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.pageCount++;
    const p = this.page;
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: SQUAD.bg });
    this.brandHeader(p);

    let y = PAGE_H - MARGIN - 60;

    // Subtitle (small accent text)
    p.drawText(sanitize(opts.subtitle.toUpperCase()), { x: MARGIN, y, size: 7, font: this.font, color: SQUAD.accent });
    y -= 36;

    // Title line 1 (big white bold)
    p.drawText(sanitize(opts.titleLine1.toUpperCase()), { x: MARGIN, y, size: 28, font: this.fontBold, color: SQUAD.white });
    y -= 36;

    // Title line 2 (big white regular or bold)
    if (opts.titleLine2) {
      p.drawText(sanitize(opts.titleLine2.toUpperCase() + "."), { x: MARGIN, y, size: 28, font: this.fontBold, color: SQUAD.white });
      y -= 28;
    }

    // Accent bar (60px x 2px)
    p.drawRectangle({ x: MARGIN, y: y - 4, width: 60, height: 2, color: SQUAD.accent });
    y -= 24;

    // Description
    if (opts.description) {
      const lines = this.wrapText(sanitize(opts.description), 10, CONTENT_W * 0.65);
      for (const line of lines) {
        p.drawText(line, { x: MARGIN, y, size: 10, font: this.font, color: SQUAD.muted });
        y -= 15;
      }
    }

    // Date
    if (opts.date) {
      y -= 10;
      p.drawText(sanitize(opts.date), { x: MARGIN, y, size: 8, font: this.font, color: SQUAD.dim });
    }
  }

  // ── Hero Section (for content pages) ────────────────────
  heroSection(titleLine1: string, titleLine2?: string, subtitle?: string) {
    if (subtitle) {
      this.page.drawText(sanitize(subtitle.toUpperCase()), { x: MARGIN, y: this.y, size: 7, font: this.font, color: SQUAD.accent });
      this.y -= 24;
    }
    this.page.drawText(sanitize(titleLine1.toUpperCase()), { x: MARGIN, y: this.y, size: 22, font: this.fontBold, color: SQUAD.white });
    this.y -= 28;
    if (titleLine2) {
      this.page.drawText(sanitize(titleLine2.toUpperCase() + "."), { x: MARGIN, y: this.y, size: 22, font: this.fontBold, color: SQUAD.white });
      this.y -= 24;
    }
    // Accent bar
    this.page.drawRectangle({ x: MARGIN, y: this.y - 2, width: 60, height: 2, color: SQUAD.accent });
    this.y -= 18;
  }

  // ── Section Title ───────────────────────────────────────
  sectionTitle(title: string) {
    this.ensureSpace(30);
    this.y -= 12;
    this.page.drawText(sanitize(title.toUpperCase()), { x: MARGIN, y: this.y, size: 10, font: this.fontBold, color: SQUAD.accent });
    this.y -= 6;
    this.page.drawRectangle({ x: MARGIN, y: this.y - 2, width: CONTENT_W, height: 0.5, color: SQUAD.border });
    this.y -= 14;
  }

  // ── KPI Row (up to 4 cards) ─────────────────────────────
  kpiRow(kpis: { label: string; value: string; color?: any }[]) {
    const count = kpis.length;
    const gap = 8;
    const cardW = (CONTENT_W - gap * (count - 1)) / count;
    const cardH = 64;
    this.ensureSpace(cardH + 16);

    kpis.forEach((kpi, i) => {
      const x = MARGIN + i * (cardW + gap);
      // Card bg
      this.page.drawRectangle({ x, y: this.y - cardH, width: cardW, height: cardH, color: SQUAD.surface });
      // Top accent line
      this.page.drawRectangle({ x, y: this.y, width: cardW, height: 1.5, color: kpi.color || SQUAD.accent });
      // Value (large)
      this.page.drawText(sanitize(kpi.value), { x: x + 12, y: this.y - 32, size: 20, font: this.fontBold, color: kpi.color || SQUAD.white });
      // Label (small)
      this.page.drawText(sanitize(kpi.label.toUpperCase()), { x: x + 12, y: this.y - 52, size: 7, font: this.font, color: SQUAD.muted });
    });
    this.y -= cardH + 16;
  }

  // ── Data Table ──────────────────────────────────────────
  tableHeader(cols: { text: string; width: number }[]) {
    const rowH = 22;
    this.ensureSpace(rowH + 4);
    this.page.drawRectangle({ x: MARGIN, y: this.y - rowH, width: CONTENT_W, height: rowH, color: SQUAD.surface });

    let xOff = MARGIN + 10;
    for (const col of cols) {
      this.page.drawText(sanitize(col.text.toUpperCase()), { x: xOff, y: this.y - 15, size: 7, font: this.fontBold, color: SQUAD.accent });
      xOff += col.width;
    }
    this.y -= rowH;
  }

  tableRow(cols: { text: string; width: number; color?: any; bold?: boolean }[]) {
    const rowH = 20;
    this.ensureSpace(rowH + 4);

    let xOff = MARGIN + 10;
    for (const col of cols) {
      const f = col.bold ? this.fontBold : this.font;
      const color = col.color || SQUAD.offWhite;
      this.page.drawText(sanitize(col.text).substring(0, 55), { x: xOff, y: this.y - 14, size: 9, font: f, color });
      xOff += col.width;
    }
    // Bottom border
    this.page.drawLine({
      start: { x: MARGIN, y: this.y - rowH },
      end: { x: MARGIN + CONTENT_W, y: this.y - rowH },
      thickness: 0.3, color: SQUAD.border,
    });
    this.y -= rowH;
  }

  // ── Stat Card (pricing/highlight card with accent border) ─
  pricingCard(opts: { title: string; subtitle?: string; value: string; features?: string[]; buttonLabel?: string }) {
    const features = opts.features || [];
    const cardH = 70 + features.length * 16 + (opts.buttonLabel ? 22 : 0);
    this.ensureSpace(cardH + 10);

    const x = MARGIN;
    const cardY = this.y - cardH;

    // Card with accent left border
    this.page.drawRectangle({ x, y: cardY, width: CONTENT_W, height: cardH, color: SQUAD.surface });
    this.page.drawRectangle({ x, y: cardY, width: 2, height: cardH, color: SQUAD.accent });
    // Top accent border
    this.page.drawRectangle({ x, y: cardY + cardH, width: CONTENT_W, height: 1, color: SQUAD.accent });

    let iy = this.y - 18;

    // Subtitle
    if (opts.subtitle) {
      this.page.drawText(sanitize(opts.subtitle.toUpperCase()), { x: x + 16, y: iy, size: 7, font: this.font, color: SQUAD.muted });
      iy -= 18;
    }

    // Title
    this.page.drawText(sanitize(opts.title), { x: x + 16, y: iy, size: 14, font: this.fontBold, color: SQUAD.white });
    iy -= 24;

    // Value
    this.page.drawText(sanitize(opts.value), { x: x + 16, y: iy, size: 22, font: this.fontBold, color: SQUAD.accent });
    iy -= 20;

    // Features
    for (const feat of features) {
      iy -= 4;
      this.page.drawText(sanitize(`- ${feat}`), { x: x + 16, y: iy, size: 9, font: this.font, color: SQUAD.offWhite });
      iy -= 12;
    }

    // Button
    if (opts.buttonLabel) {
      iy -= 8;
      this.page.drawRectangle({ x: x + 16, y: iy - 2, width: 120, height: 18, color: SQUAD.accent });
      this.page.drawText(sanitize(opts.buttonLabel), { x: x + 28, y: iy + 2, size: 8, font: this.fontBold, color: SQUAD.white });
    }

    this.y -= cardH + 12;
  }

  // ── Progress Bar ────────────────────────────────────────
  progressBar(label: string, value: string, percent: number, color?: any) {
    this.ensureSpace(32);
    const barColor = color || SQUAD.accent;
    const barW = CONTENT_W * 0.55;
    const barH = 6;
    const barX = MARGIN;

    this.page.drawText(sanitize(label), { x: barX, y: this.y - 4, size: 9, font: this.font, color: SQUAD.offWhite });
    this.page.drawText(sanitize(value), { x: barX + barW + 20, y: this.y - 4, size: 9, font: this.fontBold, color: barColor });
    this.y -= 14;

    // Track
    this.page.drawRectangle({ x: barX, y: this.y - barH, width: barW, height: barH, color: SQUAD.border });
    // Fill
    const fillW = Math.max(1, barW * Math.min(percent / 100, 1));
    this.page.drawRectangle({ x: barX, y: this.y - barH, width: fillW, height: barH, color: barColor });
    this.y -= barH + 12;
  }

  // ── Alert Banner ────────────────────────────────────────
  alertBanner(title: string, message: string, color: any = SQUAD.error) {
    this.ensureSpace(44);
    this.y -= 6;
    this.page.drawRectangle({ x: MARGIN, y: this.y - 40, width: CONTENT_W, height: 40, color: SQUAD.surface });
    this.page.drawRectangle({ x: MARGIN, y: this.y - 40, width: 3, height: 40, color });
    this.page.drawText(sanitize(title), { x: MARGIN + 14, y: this.y - 16, size: 10, font: this.fontBold, color });
    this.page.drawText(sanitize(message), { x: MARGIN + 14, y: this.y - 32, size: 8, font: this.font, color: SQUAD.muted });
    this.y -= 50;
  }

  // ── Text helpers ────────────────────────────────────────
  text(str: string, opts: { x?: number; size?: number; color?: any; bold?: boolean; maxWidth?: number } = {}) {
    const { x = MARGIN, size = 10, color = SQUAD.offWhite, bold = false, maxWidth = CONTENT_W } = opts;
    const font = bold ? this.fontBold : this.font;
    const clean = sanitize(str);
    if (!clean) return;
    const lines = this.wrapText(clean, size, maxWidth);
    const lineHeight = size * 1.5;
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.page.drawText(line, { x, y: this.y, size, font, color });
      this.y -= lineHeight;
    }
  }

  wrapText(text: string, fontSize: number, maxWidth: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (this.font.widthOfTextAtSize(test, fontSize) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else { current = test; }
    }
    if (current) lines.push(current);
    return lines;
  }

  truncateText(text: string, fontSize: number, maxWidth: number): string {
    if (this.font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
    let t = text;
    while (t.length > 0 && this.font.widthOfTextAtSize(t + "...", fontSize) > maxWidth) t = t.substring(0, t.length - 1);
    return t + "...";
  }

  ensureSpace(needed: number) {
    if (this.y < MARGIN + 40 + needed) this.newPage();
  }

  // ── Footer (applied to all pages at the end) ────────────
  addFooters() {
    const pages = this.doc.getPages();
    const total = pages.length;
    pages.forEach((p, idx) => {
      const footerY = 28;
      // Separator line
      p.drawLine({ start: { x: MARGIN, y: footerY + 14 }, end: { x: PAGE_W - MARGIN, y: footerY + 14 }, thickness: 0.5, color: SQUAD.border });

      // Centered "SQUAD FILM | 2026"
      const footerText = "SQUAD FILM | 2026";
      const fw = this.font.widthOfTextAtSize(footerText, 7);
      p.drawText(footerText, { x: PAGE_W / 2 - fw / 2, y: footerY, size: 7, font: this.font, color: SQUAD.dim });

      // Page number right
      if (total > 1) {
        const pageStr = `${String(idx + 1).padStart(2, "0")}/${String(total).padStart(2, "0")}`;
        const pw = this.font.widthOfTextAtSize(pageStr, 7);
        p.drawText(pageStr, { x: PAGE_W - MARGIN - pw, y: footerY, size: 7, font: this.font, color: SQUAD.dim });
      }
    });
  }

  async save(): Promise<Uint8Array> {
    this.addFooters();
    return await this.doc.save();
  }
}
