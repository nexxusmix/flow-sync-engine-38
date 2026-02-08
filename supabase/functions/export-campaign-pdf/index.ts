import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExportCampaignRequest {
  campaign_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { campaign_id }: ExportCampaignRequest = await req.json();

    if (!campaign_id) {
      throw new Error('Missing required field: campaign_id');
    }

    console.log(`[export-campaign-pdf] Exporting campaign: ${campaign_id}`);

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message || 'Unknown error'}`);
    }

    // Fetch creative packages
    const { data: packages } = await supabase
      .from('campaign_creative_packages')
      .select('*')
      .eq('campaign_id', campaign_id)
      .order('created_at', { ascending: false });

    // Fetch brand kit if linked
    let brandKit = null;
    if (campaign.brand_kit_id) {
      const { data: bk } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('id', campaign.brand_kit_id)
        .single();
      brandKit = bk;
    }

    console.log(`[export-campaign-pdf] Found ${packages?.length || 0} creative packages`);

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

    const addNewPage = () => pdfDoc.addPage([pageWidth, pageHeight]);

    // === PAGE 1: COVER ===
    let page = addNewPage();
    let y = pageHeight - 100;

    // Campaign name
    page.drawText((campaign.name || 'Campanha').toUpperCase(), {
      x: margin,
      y,
      size: 28,
      font: helveticaBold,
      color: primaryColor,
    });
    y -= 40;

    // Status
    const statusLabels: Record<string, string> = {
      draft: 'Rascunho',
      active: 'Ativa',
      paused: 'Pausada',
      ended: 'Encerrada',
    };
    const statusLabel = statusLabels[campaign.status] || campaign.status || 'Rascunho';
    page.drawText(`Status: ${statusLabel}`, {
      x: margin,
      y,
      size: 12,
      font: helvetica,
      color: accentColor,
    });
    y -= 30;

    // Dates
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return null;
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    if (campaign.start_date || campaign.end_date) {
      const dateRange = [
        campaign.start_date ? formatDate(campaign.start_date) : 'Não definido',
        campaign.end_date ? formatDate(campaign.end_date) : 'Em aberto',
      ].join(' — ');
      
      page.drawText(`Período: ${dateRange}`, {
        x: margin,
        y,
        size: 11,
        font: helvetica,
        color: secondaryColor,
      });
      y -= 25;
    }

    // Budget
    if (campaign.budget) {
      const budgetFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(campaign.budget);
      
      page.drawText(`Budget: ${budgetFormatted}`, {
        x: margin,
        y,
        size: 11,
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

    // Objective
    if (campaign.objective) {
      page.drawText('OBJETIVO', {
        x: margin,
        y,
        size: 12,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 20;
      y = addText(page, campaign.objective, margin, y, { size: 11 });
      y -= 25;
    }

    // Offer
    if (campaign.offer) {
      page.drawText('OFERTA', {
        x: margin,
        y,
        size: 12,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 20;
      y = addText(page, campaign.offer, margin, y, { size: 11 });
      y -= 25;
    }

    // Audience
    if (campaign.audience) {
      page.drawText('PÚBLICO-ALVO', {
        x: margin,
        y,
        size: 12,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 20;
      y = addText(page, campaign.audience, margin, y, { size: 11 });
      y -= 25;
    }

    // === BRAND KIT SECTION ===
    if (brandKit) {
      if (y < 200) {
        page = addNewPage();
        y = pageHeight - 80;
      }

      page.drawText('BRAND KIT', {
        x: margin,
        y,
        size: 14,
        font: helveticaBold,
        color: accentColor,
      });
      y -= 25;

      page.drawText(`Nome: ${brandKit.name}`, {
        x: margin,
        y,
        size: 10,
        font: helvetica,
        color: primaryColor,
      });
      y -= 18;

      if (brandKit.tone_of_voice) {
        page.drawText('Tom de Voz:', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, brandKit.tone_of_voice, margin, y, { size: 10 });
        y -= 15;
      }

      if (brandKit.colors && Array.isArray(brandKit.colors) && brandKit.colors.length > 0) {
        page.drawText('Cores:', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
        y -= 15;
        y = addText(page, brandKit.colors.join(' • '), margin, y, { size: 10 });
        y -= 15;
      }

      y -= 20;
    }

    // === CREATIVE PACKAGES SECTION ===
    if (packages && packages.length > 0) {
      for (const pkg of packages) {
        page = addNewPage();
        y = pageHeight - 80;

        page.drawText(`PACOTE CRIATIVO: ${pkg.title || 'Sem título'}`, {
          x: margin,
          y,
          size: 14,
          font: helveticaBold,
          color: accentColor,
        });
        y -= 30;

        const pkgData = pkg.package_json as Record<string, unknown> || {};

        // Concept
        if (pkgData.concept) {
          const concept = pkgData.concept as Record<string, unknown>;
          
          if (concept.headline) {
            page.drawText('Headline', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
            y -= 15;
            y = addText(page, String(concept.headline), margin, y, { size: 12, font: helveticaBold });
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

          if (concept.tom) {
            page.drawText('Tom de Voz', { x: margin, y, size: 10, font: helveticaBold, color: secondaryColor });
            y -= 15;
            y = addText(page, String(concept.tom), margin, y);
            y -= 20;
          }
        }

        // Ideas/Posts
        if (pkgData.ideas && Array.isArray(pkgData.ideas)) {
          if (y < 200) {
            page = addNewPage();
            y = pageHeight - 80;
          }

          page.drawText('IDEIAS / POSTS SUGERIDOS', {
            x: margin,
            y,
            size: 12,
            font: helveticaBold,
            color: accentColor,
          });
          y -= 25;

          for (let i = 0; i < pkgData.ideas.length; i++) {
            const idea = pkgData.ideas[i] as Record<string, unknown>;
            if (y < 100) {
              page = addNewPage();
              y = pageHeight - 80;
            }

            page.drawText(`${i + 1}. ${idea.title || idea.hook || 'Ideia ' + (i + 1)}`, {
              x: margin,
              y,
              size: 11,
              font: helveticaBold,
              color: primaryColor,
            });
            y -= 15;

            if (idea.description || idea.caption) {
              y = addText(page, String(idea.description || idea.caption), margin + 15, y, { size: 9, color: secondaryColor });
            }
            y -= 15;
          }
        }

        // Scripts
        if (pkgData.scripts && Array.isArray(pkgData.scripts)) {
          if (y < 200) {
            page = addNewPage();
            y = pageHeight - 80;
          }

          page.drawText('ROTEIROS', {
            x: margin,
            y,
            size: 12,
            font: helveticaBold,
            color: accentColor,
          });
          y -= 25;

          for (let i = 0; i < pkgData.scripts.length; i++) {
            const script = pkgData.scripts[i] as Record<string, unknown>;
            if (y < 150) {
              page = addNewPage();
              y = pageHeight - 80;
            }

            page.drawText(`Roteiro ${i + 1}`, {
              x: margin,
              y,
              size: 10,
              font: helveticaBold,
              color: secondaryColor,
            });
            y -= 15;

            if (script.hook) {
              page.drawText('Hook:', { x: margin, y, size: 9, font: helveticaBold, color: grayColor });
              y -= 12;
              y = addText(page, String(script.hook), margin + 10, y, { size: 10 });
              y -= 10;
            }

            if (script.body || script.desenvolvimento) {
              y = addText(page, String(script.body || script.desenvolvimento), margin + 10, y, { size: 9, color: secondaryColor });
              y -= 10;
            }

            if (script.cta) {
              page.drawText('CTA:', { x: margin, y, size: 9, font: helveticaBold, color: grayColor });
              y -= 12;
              y = addText(page, String(script.cta), margin + 10, y, { size: 10 });
            }
            y -= 20;
          }
        }

        // Captions
        if (pkgData.captions && Array.isArray(pkgData.captions)) {
          if (y < 150) {
            page = addNewPage();
            y = pageHeight - 80;
          }

          page.drawText('LEGENDAS / COPYS', {
            x: margin,
            y,
            size: 12,
            font: helveticaBold,
            color: accentColor,
          });
          y -= 25;

          for (let i = 0; i < Math.min(pkgData.captions.length, 5); i++) {
            if (y < 100) {
              page = addNewPage();
              y = pageHeight - 80;
            }

            page.drawText(`Variação ${i + 1}:`, {
              x: margin,
              y,
              size: 9,
              font: helveticaBold,
              color: secondaryColor,
            });
            y -= 15;
            y = addText(page, String(pkgData.captions[i]), margin, y, { size: 10 });
            y -= 20;
          }
        }
      }
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Save to storage
    const timestamp = Date.now();
    const filePath = `exports/campaign/${campaign_id}/${timestamp}.pdf`;
    
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

    console.log(`[export-campaign-pdf] PDF generated and saved: ${filePath}`);

    return new Response(
      JSON.stringify({
        success: true,
        file_path: filePath,
        public_url: urlData.publicUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[export-campaign-pdf] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to export PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

const grayColor = rgb(0.6, 0.6, 0.6);
