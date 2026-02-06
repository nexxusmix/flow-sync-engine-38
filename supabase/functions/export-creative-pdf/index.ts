import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  type: 'studio_run' | 'creative_package';
  id: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, id }: ExportRequest = await req.json();

    if (!type || !id) {
      throw new Error('Missing required fields: type and id');
    }

    console.log(`[export-creative-pdf] Exporting ${type}: ${id}`);

    let title = '';
    let briefData: Record<string, unknown> = {};
    let outputs: Record<string, unknown> = {};

    if (type === 'studio_run') {
      // Fetch studio run (brief) data
      const { data: brief, error: briefError } = await supabase
        .from('creative_briefs')
        .select('*, brand_kits(*)')
        .eq('id', id)
        .single();

      if (briefError || !brief) {
        throw new Error(`Brief not found: ${briefError?.message || 'Unknown error'}`);
      }

      title = brief.title || 'Pacote Criativo';
      briefData = {
        title: brief.title,
        objective: brief.objective,
        delivery_type: brief.delivery_type,
        package_type: brief.package_type,
        input_text: brief.input_text,
        brand_kit: brief.brand_kits?.name,
        created_at: brief.created_at,
      };

      // Fetch outputs
      const { data: outputsData } = await supabase
        .from('creative_outputs')
        .select('*')
        .eq('brief_id', id);

      // Fetch storyboard scenes
      const { data: scenesData } = await supabase
        .from('storyboard_scenes')
        .select('*')
        .eq('brief_id', id)
        .order('scene_number');

      outputs = {
        concept: outputsData?.find(o => o.type === 'concept')?.content,
        script: outputsData?.find(o => o.type === 'script')?.content,
        moodboard: outputsData?.find(o => o.type === 'moodboard')?.content,
        shotlist: outputsData?.find(o => o.type === 'shotlist')?.content,
        storyboard: scenesData,
      };

    } else if (type === 'creative_package') {
      // Fetch creative package
      const { data: pkg, error: pkgError } = await supabase
        .from('campaign_creative_packages')
        .select('*, campaigns(*)')
        .eq('id', id)
        .single();

      if (pkgError || !pkg) {
        throw new Error(`Package not found: ${pkgError?.message || 'Unknown error'}`);
      }

      title = pkg.title || 'Pacote Criativo';
      briefData = {
        title: pkg.title,
        campaign: pkg.campaigns?.name,
        created_at: pkg.created_at,
      };
      outputs = pkg.package_json as Record<string, unknown> || {};
    }

    console.log(`[export-creative-pdf] Generating PDF for: ${title}`);

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

    // Helper to add a new page
    const addNewPage = () => {
      return pdfDoc.addPage([pageWidth, pageHeight]);
    };

    // Cover page
    let page = addNewPage();
    let y = pageHeight - 100;

    // Title
    page.drawText(title.toUpperCase(), {
      x: margin,
      y,
      size: 28,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 40;

    // Subtitle
    if (briefData.campaign) {
      page.drawText(`Campanha: ${briefData.campaign}`, {
        x: margin,
        y,
        size: 14,
        font: helvetica,
        color: secondaryColor,
      });
      y -= 25;
    }

    if (briefData.objective) {
      page.drawText(`Objetivo: ${String(briefData.objective)}`, {
        x: margin,
        y,
        size: 12,
        font: helvetica,
        color: secondaryColor,
      });
      y -= 25;
    }

    if (briefData.package_type) {
      page.drawText(`Tipo: ${String(briefData.package_type)}`, {
        x: margin,
        y,
        size: 12,
        font: helvetica,
        color: secondaryColor,
      });
      y -= 25;
    }

    // Date
    const dateStr = new Date(briefData.created_at as string).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    page.drawText(dateStr, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: secondaryColor,
    });
    y -= 60;

    // Separator line
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });
    y -= 40;

    // Brief/Input
    if (briefData.input_text) {
      page.drawText('BRIEFING', {
        x: margin,
        y,
        size: 12,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 20;
      y = addText(page, String(briefData.input_text), margin, y, { size: 10, color: secondaryColor });
      y -= 30;
    }

    // Concept section
    const concept = outputs.concept as Record<string, unknown> | undefined;
    if (concept) {
      page = addNewPage();
      y = pageHeight - 80;

      page.drawText('CONCEITO NARRATIVO', {
        x: margin,
        y,
        size: 16,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 30;

      if (concept.headline) {
        page.drawText('Headline', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, String(concept.headline), margin, y, { size: 12 });
        y -= 20;
      }

      if (concept.subheadline) {
        page.drawText('Subheadline', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, String(concept.subheadline), margin, y, { size: 11 });
        y -= 20;
      }

      if (concept.big_idea) {
        page.drawText('Big Idea', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, String(concept.big_idea), margin, y);
        y -= 20;
      }

      if (concept.narrativa) {
        page.drawText('Narrativa', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, String(concept.narrativa), margin, y);
        y -= 20;
      }

      if (concept.tom) {
        page.drawText('Tom de Voz', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, String(concept.tom), margin, y);
      }
    }

    // Script section
    const script = outputs.script as Record<string, unknown> | undefined;
    if (script) {
      page = addNewPage();
      y = pageHeight - 80;

      page.drawText('ROTEIRO', {
        x: margin,
        y,
        size: 16,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 30;

      if (script.hook) {
        page.drawText('Hook', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, String(script.hook), margin, y, { size: 11 });
        y -= 20;
      }

      if (script.desenvolvimento) {
        page.drawText('Desenvolvimento', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, String(script.desenvolvimento), margin, y);
        y -= 20;
      }

      if (script.cta) {
        page.drawText('CTA', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, String(script.cta), margin, y);
      }
    }

    // Storyboard section
    const storyboard = outputs.storyboard as Array<Record<string, unknown>> | undefined;
    if (storyboard && storyboard.length > 0) {
      page = addNewPage();
      y = pageHeight - 80;

      page.drawText('STORYBOARD', {
        x: margin,
        y,
        size: 16,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 30;

      for (const scene of storyboard) {
        if (y < 150) {
          page = addNewPage();
          y = pageHeight - 80;
        }

        const sceneNum = scene.scene_number || 1;
        page.drawText(`CENA ${sceneNum}`, {
          x: margin,
          y,
          size: 11,
          font: helveticaBold,
          color: primaryColor,
        });
        y -= 15;

        if (scene.title) {
          y = addText(page, String(scene.title), margin, y, { font: helveticaBold, size: 10 });
        }

        if (scene.description) {
          y = addText(page, String(scene.description), margin, y, { color: secondaryColor });
        }

        const details = [];
        if (scene.camera) details.push(`📷 ${scene.camera}`);
        if (scene.duration_sec) details.push(`⏱ ${scene.duration_sec}s`);
        if (scene.emotion) details.push(`💭 ${scene.emotion}`);
        
        if (details.length > 0) {
          y -= 5;
          y = addText(page, details.join('  |  '), margin, y, { size: 9, color: secondaryColor });
        }

        y -= 20;
      }
    }

    // Shotlist section
    const shotlist = outputs.shotlist as Array<Record<string, unknown>> | undefined;
    if (shotlist && shotlist.length > 0) {
      page = addNewPage();
      y = pageHeight - 80;

      page.drawText('SHOTLIST', {
        x: margin,
        y,
        size: 16,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 30;

      for (let i = 0; i < shotlist.length; i++) {
        const shot = shotlist[i];
        if (y < 100) {
          page = addNewPage();
          y = pageHeight - 80;
        }

        page.drawText(`#${i + 1}`, {
          x: margin,
          y,
          size: 10,
          font: helveticaBold,
          color: accentColor,
        });

        if (shot.plano) {
          page.drawText(String(shot.plano), {
            x: margin + 30,
            y,
            size: 10,
            font: helveticaBold,
            color: primaryColor,
          });
        }
        y -= 15;

        if (shot.descricao) {
          y = addText(page, String(shot.descricao), margin + 30, y, { size: 9, color: secondaryColor });
        }

        const details = [];
        if (shot.lente_sugerida) details.push(`🔍 ${shot.lente_sugerida}`);
        if (shot.ambiente) details.push(`📍 ${shot.ambiente}`);
        if (shot.luz) details.push(`💡 ${shot.luz}`);
        
        if (details.length > 0) {
          y = addText(page, details.join('  '), margin + 30, y, { size: 8, color: secondaryColor });
        }

        y -= 15;
      }
    }

    // Moodboard section
    const moodboard = outputs.moodboard as Record<string, unknown> | undefined;
    if (moodboard) {
      page = addNewPage();
      y = pageHeight - 80;

      page.drawText('MOODBOARD', {
        x: margin,
        y,
        size: 16,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 30;

      if (moodboard.direcao_de_arte) {
        page.drawText('Direção de Arte', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, String(moodboard.direcao_de_arte), margin, y);
        y -= 20;
      }

      const paleta = moodboard.paleta as string[] | undefined;
      if (paleta && paleta.length > 0) {
        page.drawText('Paleta de Cores', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, paleta.join(' • '), margin, y);
        y -= 20;
      }

      const referencias = moodboard.referencias as string[] | undefined;
      if (referencias && referencias.length > 0) {
        page.drawText('Referências', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        for (const ref of referencias) {
          y = addText(page, `• ${ref}`, margin, y, { size: 9 });
        }
      }
    }

    // Captions section
    const captions = outputs.captionVariations as string[] | undefined;
    if (captions && captions.length > 0) {
      if (y < 200) {
        page = addNewPage();
        y = pageHeight - 80;
      } else {
        y -= 30;
      }

      page.drawText('VARIAÇÕES DE LEGENDA', {
        x: margin,
        y,
        size: 14,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 25;

      for (let i = 0; i < captions.length; i++) {
        if (y < 100) {
          page = addNewPage();
          y = pageHeight - 80;
        }

        page.drawText(`Variação ${i + 1}`, { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, captions[i], margin, y, { size: 10 });
        y -= 15;
      }
    }

    // Hashtags section
    const hashtags = outputs.hashtags as string[] | undefined;
    if (hashtags && hashtags.length > 0) {
      if (y < 100) {
        page = addNewPage();
        y = pageHeight - 80;
      } else {
        y -= 20;
      }

      page.drawText('HASHTAGS', {
        x: margin,
        y,
        size: 14,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 20;

      y = addText(page, hashtags.join(' '), margin, y, { size: 10, color: accentColor });
    }

    // Footer on all pages
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      p.drawText(`${i + 1} / ${pages.length}`, {
        x: pageWidth - margin - 30,
        y: 30,
        size: 9,
        font: helvetica,
        color: secondaryColor,
      });
      p.drawText('Gerado por Studio Criativo', {
        x: margin,
        y: 30,
        size: 8,
        font: helvetica,
        color: rgb(0.7, 0.7, 0.7),
      });
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const timestamp = Date.now();
    const fileName = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.pdf`;
    const storagePath = `${type === 'studio_run' ? 'studio' : 'packages'}/${id}/${fileName}`;

    console.log(`[export-creative-pdf] Uploading to: ${storagePath}`);

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('exports')
      .getPublicUrl(storagePath);

    console.log(`[export-creative-pdf] PDF generated successfully: ${publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        file_path: storagePath,
        public_url: publicUrl,
        file_name: fileName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('[export-creative-pdf] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
