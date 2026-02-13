
# Fix PDF Export: Generate Real PDFs Instead of HTML/SVG Files

## Problem

The platform has **3 different "PDF export" edge functions**, and none of them produce actual PDF files:

- **`export-pdf`** (main, 1355 lines): Generates styled **HTML**, uploads as `.html` with `contentType: text/html`, then opens the HTML URL in a new tab. On desktop browsers, the embedded script calls `window.print()` so users can "Save as PDF" manually. On Safari iOS, this shows **raw HTML source code**.
- **`export-finance-pdf`** (450 lines): Generates an **SVG** image, uploads as `.svg` with `contentType: image/svg+xml`. Not a PDF at all.
- **`export-creative-pdf`** (611 lines): Actually uses **`pdf-lib`** to generate a real PDF with `contentType: application/pdf`. This one works correctly.

## Solution

Use **`pdf-lib`** (already proven in `export-creative-pdf`) to generate real PDF binary files in all edge functions. No Puppeteer/Playwright needed -- `pdf-lib` runs natively in Deno edge functions and creates proper PDF bytes.

## Architecture

```text
Frontend (click "Export PDF")
    |
    v
Edge Function (export-pdf / export-finance-pdf)
    |
    1. Fetch data from DB
    2. Build PDF using pdf-lib (pages, text, shapes, colors)
    3. Save as .pdf with contentType: application/pdf
    4. Return signed URL
    |
    v
Frontend receives signed URL
    |
    v
window.open(url) --> Safari/Chrome opens native PDF viewer
```

## Changes

### 1. Rewrite `export-pdf` edge function (~1355 lines)

**Current**: Builds an HTML string with CSS, uploads as `.html`
**New**: Use `pdf-lib` to draw text, rectangles, lines programmatically (like `export-creative-pdf` already does)

Key changes:
- Import `pdf-lib`: `import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1"`
- Replace `generatePDFHtml()` with `generatePdfDocument()` that creates pages using `pdf-lib` API
- Each report type (project, report_360, tasks, portal, project_overview) gets a builder function that draws content onto PDF pages
- Upload with `contentType: 'application/pdf'` and `.pdf` extension
- Remove the HTML template, print-bar script, and CSS entirely

The layout will use the same design system colors (dark background, cyan accents) rendered as PDF drawing commands:
- `page.drawRectangle()` for cards/backgrounds
- `page.drawText()` for labels/values
- `page.drawLine()` for separators
- KPI cards, tables, badges all rendered with the same visual hierarchy

### 2. Rewrite `export-finance-pdf` edge function (~450 lines)

**Current**: Builds SVG with `<text>` and `<rect>` elements
**New**: Convert SVG drawing logic to equivalent `pdf-lib` calls

This is actually the easiest conversion since the SVG approach already uses absolute positioning (x, y coordinates) which maps directly to pdf-lib's API.

### 3. Update `pdfExportService.ts` (frontend)

Minor changes:
- Update the `ExportResult` type comments to reflect actual PDF
- Change the `content_type` references from `text/html` to `application/pdf`
- The `window.open(url, '_blank')` approach stays the same -- it will now open a real PDF that Safari handles natively

### 4. No changes needed to `export-creative-pdf`

Already generates real PDFs correctly using `pdf-lib`.

### 5. No changes needed to `export-campaign-pdf` and `export-content-pdf`

These call dedicated edge functions that need individual review, but they follow the same pattern. They will be addressed in the same rewrite if they also produce HTML.

## Technical Details

### pdf-lib patterns (proven in this codebase)

```typescript
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const pdfDoc = await PDFDocument.create();
const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

const page = pdfDoc.addPage([595.28, 841.89]); // A4

// Draw dark background
page.drawRectangle({
  x: 0, y: 0,
  width: 595.28, height: 841.89,
  color: rgb(0.02, 0.02, 0.02),
});

// Draw text
page.drawText("RELATÓRIO", {
  x: 40, y: 780,
  font: fontBold, size: 28,
  color: rgb(1, 1, 1),
});

// Save
const pdfBytes = await pdfDoc.save();
```

### Upload pattern

```typescript
const fileName = `${slug}-${timestamp}.pdf`;
await supabase.storage.from('exports').upload(storagePath, pdfBytes, {
  contentType: 'application/pdf',
  upsert: true,
});
```

### Color conversion

The current hex colors will be converted to `rgb()` calls:
- `#050505` becomes `rgb(0.02, 0.02, 0.02)`
- `#06b6d4` (primary cyan) becomes `rgb(0.024, 0.714, 0.831)`
- `#22c55e` (success green) becomes `rgb(0.133, 0.773, 0.369)`

### Page overflow handling

Each builder function will track the current Y position and automatically add new pages when content exceeds the page height, similar to how `export-creative-pdf` handles multi-page documents.

### Font limitation

`pdf-lib` with `StandardFonts` only supports basic Latin characters. For Portuguese characters (accents like a, e, o), StandardFonts.Helvetica handles these correctly since they're within the Latin-1 range.

## Scope

- Rewrite `export-pdf/index.ts` to use pdf-lib
- Rewrite `export-finance-pdf/index.ts` to use pdf-lib  
- Update `pdfExportService.ts` content_type references
- Verify `export-campaign-pdf` and `export-content-pdf` (fix if also HTML-based)
- All 6 export types (project, report_360, tasks, finance, portal, project_overview) will produce real `.pdf` files
- Safari iOS will open native PDF viewer instead of showing source code
