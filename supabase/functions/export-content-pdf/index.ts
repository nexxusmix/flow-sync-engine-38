import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExportContentRequest {
  content_item_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { content_item_id }: ExportContentRequest = await req.json();

    if (!content_item_id) {
      throw new Error('Missing required field: content_item_id');
    }

    console.log(`[export-content-pdf] Exporting content: ${content_item_id}`);

    // Fetch content item
    const { data: content, error: contentError } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', content_item_id)
      .single();

    if (contentError || !content) {
      throw new Error(`Content not found: ${contentError?.message || 'Unknown error'}`);
    }

    // Fetch checklist
    const { data: checklist } = await supabase
      .from('content_checklist')
      .select('*')
      .eq('content_item_id', content_item_id)
      .order('created_at');

    // Fetch comments
    const { data: comments } = await supabase
      .from('content_comments')
      .select('*')
      .eq('content_item_id', content_item_id)
      .order('created_at', { ascending: false })
      .limit(20);

    console.log(`[export-content-pdf] Found ${checklist?.length || 0} checklist items, ${comments?.length || 0} comments`);

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    // Colors
    const primaryColor = rgb(0.1, 0.1, 0.1);
    const secondaryColor = rgb(0.4, 0.4, 0.4);
    const accentColor = rgb(0.2, 0.4, 0.8);
    const greenColor = rgb(0.2, 0.6, 0.3);
    const grayColor = rgb(0.6, 0.6, 0.6);

    // Helper function to add text with word wrap
    const addText = (page: ReturnType<typeof pdfDoc.addPage>, text: string, x: number, y: number, options: {
      font?: typeof helvetica;
      size?: number;
      color?: ReturnType<typeof rgb>;
      maxWidth?: number;
    } = {}) => {
      const { font = helvetica, size = 10, color = primaryColor, maxWidth = contentWidth } = options;
      
      if (!text) return y;
      
      const words = text.split(' ');
      let line = '';
      let currentY = y;
      const lineHeight = size * 1.4;
      
      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = font.widthOfTextAtSize(testLine, size);
        
        if (testWidth > maxWidth && line) {
          page.drawText(line, { x, y: currentY, size, font, color });
          line = word;
          currentY -= lineHeight;
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        page.drawText(line, { x, y: currentY, size, font, color });
        currentY -= lineHeight;
      }
      
      return currentY;
    };

    const addNewPage = () => pdfDoc.addPage([pageWidth, pageHeight]);

    // === PAGE 1: COVER ===
    let page = addNewPage();
    let y = pageHeight - 100;

    // Title
    page.drawText((content.title || 'Conteúdo').toUpperCase(), {
      x: margin,
      y,
      size: 24,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 35;

    // Status badge
    const statusLabels: Record<string, string> = {
      idea: 'Ideia',
      scripting: 'Roteiro',
      recording: 'Gravação',
      editing: 'Edição',
      review: 'Revisão',
      scheduled: 'Agendado',
      published: 'Publicado',
    };
    const statusLabel = statusLabels[content.status] || content.status || 'Rascunho';
    page.drawText(`Status: ${statusLabel}`, {
      x: margin,
      y,
      size: 12,
      font: helvetica,
      color: accentColor,
    });
    y -= 25;

    // Channel / Format / Pillar
    const details = [];
    if (content.channel) details.push(`Canal: ${content.channel}`);
    if (content.format) details.push(`Formato: ${content.format}`);
    if (content.pillar) details.push(`Pilar: ${content.pillar}`);
    
    if (details.length > 0) {
      page.drawText(details.join('  •  '), {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: secondaryColor,
      });
      y -= 20;
    }

    // Dates
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return null;
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    const dates = [];
    if (content.due_at) dates.push(`Prazo: ${formatDate(content.due_at)}`);
    if (content.scheduled_at) dates.push(`Agendado: ${formatDate(content.scheduled_at)}`);
    if (content.published_at) dates.push(`Publicado: ${formatDate(content.published_at)}`);

    if (dates.length > 0) {
      page.drawText(dates.join('  •  '), {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: secondaryColor,
      });
      y -= 30;
    }

    // Separator
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });
    y -= 30;

    // === BRIEFING SECTION ===
    if (content.notes) {
      page.drawText('BRIEFING', {
        x: margin,
        y,
        size: 12,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 20;
      y = addText(page, content.notes, margin, y, { size: 10, color: secondaryColor });
      y -= 30;
    }

    // === PAGE 2: COPY & ROTEIRO ===
    page = addNewPage();
    y = pageHeight - 80;

    page.drawText('COPY & ROTEIRO', {
      x: margin,
      y,
      size: 16,
      font: helveticaBold,
      color: accentColor,
    });
    y -= 35;

    // Hook
    if (content.hook) {
      page.drawText('Hook / Gancho', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
      y -= 15;
      y = addText(page, content.hook, margin, y, { size: 11 });
      y -= 20;
    }

    // Caption Short
    if (content.caption_short) {
      page.drawText('Caption Curta', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
      y -= 15;
      y = addText(page, content.caption_short, margin, y);
      y -= 20;
    }

    // Caption Long
    if (content.caption_long) {
      page.drawText('Caption Longa', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
      y -= 15;
      y = addText(page, content.caption_long, margin, y);
      y -= 20;
    }

    // CTA
    if (content.cta) {
      page.drawText('CTA', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
      y -= 15;
      y = addText(page, content.cta, margin, y);
      y -= 20;
    }

    // Hashtags
    if (content.hashtags) {
      page.drawText('Hashtags', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
      y -= 15;
      y = addText(page, content.hashtags, margin, y, { size: 9, color: accentColor });
      y -= 20;
    }

    // Script
    if (content.script) {
      if (y < 200) {
        page = addNewPage();
        y = pageHeight - 80;
      }
      page.drawText('Roteiro', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
      y -= 15;
      y = addText(page, content.script, margin, y);
    }

    // === PAGE 3: CHECKLIST ===
    if (checklist && checklist.length > 0) {
      page = addNewPage();
      y = pageHeight - 80;

      page.drawText('CHECKLIST', {
        x: margin,
        y,
        size: 16,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 30;

      for (const item of checklist) {
        if (y < 80) {
          page = addNewPage();
          y = pageHeight - 80;
        }

        const isDone = item.status === 'done';
        const checkMark = isDone ? '✓' : '○';
        const itemColor = isDone ? greenColor : grayColor;

        page.drawText(checkMark, {
          x: margin,
          y,
          size: 12,
          font: helveticaBold,
          color: itemColor,
        });

        page.drawText(item.title, {
          x: margin + 20,
          y,
          size: 10,
          font: isDone ? helvetica : helveticaBold,
          color: isDone ? grayColor : primaryColor,
        });
        y -= 18;
      }
    }

    // === PAGE 4: COMMENTS ===
    if (comments && comments.length > 0) {
      page = addNewPage();
      y = pageHeight - 80;

      page.drawText('COMENTÁRIOS DE REVISÃO', {
        x: margin,
        y,
        size: 16,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 30;

      for (const comment of comments) {
        if (y < 120) {
          page = addNewPage();
          y = pageHeight - 80;
        }

        // Author and date
        const authorName = comment.author_name || 'Usuário';
        const commentDate = new Date(comment.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });

        page.drawText(`${authorName} • ${commentDate}`, {
          x: margin,
          y,
          size: 9,
          font: helveticaBold,
          color: secondaryColor,
        });
        y -= 15;

        y = addText(page, comment.text, margin, y, { size: 10 });
        y -= 20;
      }
    }

    // === PAGE 5: PUBLICATION ===
    if (content.post_url) {
      if (y < 150) {
        page = addNewPage();
        y = pageHeight - 80;
      } else {
        y -= 30;
      }

      page.drawText('PUBLICAÇÃO', {
        x: margin,
        y,
        size: 14,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 25;

      page.drawText('Link do Post:', {
        x: margin,
        y,
        size: 10,
        font: helveticaBold,
        color: secondaryColor,
      });
      y -= 15;

      y = addText(page, content.post_url, margin, y, { size: 9, color: accentColor });
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Save to storage
    const timestamp = Date.now();
    const filePath = `exports/content/${content_item_id}/${timestamp}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('exports')
      .getPublicUrl(filePath);

    console.log(`[export-content-pdf] PDF generated and saved: ${filePath}`);

    return new Response(
      JSON.stringify({
        success: true,
        file_path: filePath,
        public_url: urlData.publicUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[export-content-pdf] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to export PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
