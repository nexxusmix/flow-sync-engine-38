/**
 * export-campaign-pdf — Campaign PDF with SQUAD Swiss design
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SquadPdfBuilder, SQUAD, sanitize, formatCurrency, formatDateShort } from "../_shared/pdf-design.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error('Missing required field: campaign_id');

    const { data: campaign, error: campaignError } = await supabase.from('campaigns').select('*').eq('id', campaign_id).single();
    if (campaignError || !campaign) throw new Error(`Campaign not found: ${campaignError?.message}`);

    const [{ data: packages }, { data: brandKit }] = await Promise.all([
      supabase.from('campaign_creative_packages').select('*').eq('campaign_id', campaign_id).order('created_at', { ascending: false }),
      campaign.brand_kit_id
        ? supabase.from('brand_kits').select('*').eq('id', campaign.brand_kit_id).single().then(r => r)
        : Promise.resolve({ data: null }),
    ]);

    const b = new SquadPdfBuilder();
    await b.init();

    // Cover
    b.coverPage({
      subtitle: `Campanha | ${(campaign.status || "rascunho").toUpperCase()}`,
      titleLine1: sanitize(campaign.name || "Campanha"),
      titleLine2: "Relatorio",
      description: campaign.objective ? sanitize(campaign.objective).substring(0, 80) : "Relatorio de Campanha",
      date: formatDateShort(),
    });

    // KPIs
    b.newPage();
    b.heroSection("Visao Geral", "da Campanha.", "Metricas e Status");
    b.kpiRow([
      { label: "Status", value: (campaign.status || "draft").toUpperCase() },
      { label: "Budget", value: campaign.budget ? formatCurrency(campaign.budget) : "--" },
      { label: "Pacotes Criativos", value: String(packages?.length || 0), color: SQUAD.accent },
    ]);

    // Objective / Offer / Audience
    if (campaign.objective) { b.text("OBJETIVO:", { size: 8, bold: true, color: SQUAD.accent }); b.text(campaign.objective); b.y -= 8; }
    if (campaign.offer) { b.text("OFERTA:", { size: 8, bold: true, color: SQUAD.accent }); b.text(campaign.offer); b.y -= 8; }
    if (campaign.audience) { b.text("PUBLICO-ALVO:", { size: 8, bold: true, color: SQUAD.accent }); b.text(campaign.audience); b.y -= 8; }

    // Brand Kit
    if (brandKit) {
      b.sectionTitle("Brand Kit");
      b.text(`Nome: ${brandKit.name}`, { bold: true });
      if (brandKit.tone_of_voice) { b.text("Tom de Voz:", { size: 8, bold: true, color: SQUAD.accent }); b.text(brandKit.tone_of_voice); b.y -= 6; }
      if (brandKit.colors && Array.isArray(brandKit.colors) && brandKit.colors.length > 0) {
        b.text("Cores:", { size: 8, bold: true, color: SQUAD.accent }); b.text(brandKit.colors.join(" / "));
      }
    }

    // Creative Packages
    if (packages && packages.length > 0) {
      for (const pkg of packages) {
        b.newPage();
        b.heroSection(sanitize(pkg.title || "Pacote"), undefined, "Pacote Criativo");

        const pkgData = (pkg.package_json || {}) as Record<string, unknown>;
        const concept = pkgData.concept as Record<string, unknown> | undefined;

        if (concept) {
          if (concept.headline) { b.text("HEADLINE:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(concept.headline), { size: 12, bold: true }); b.y -= 10; }
          if (concept.subheadline) { b.text("SUBHEADLINE:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(concept.subheadline), { size: 11 }); b.y -= 10; }
          if (concept.big_idea) { b.text("BIG IDEA:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(concept.big_idea)); b.y -= 10; }
          if (concept.tom) { b.text("TOM DE VOZ:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(concept.tom)); b.y -= 10; }
        }

        // Ideas
        if (pkgData.ideas && Array.isArray(pkgData.ideas)) {
          b.sectionTitle("Ideias / Posts Sugeridos");
          for (let i = 0; i < pkgData.ideas.length; i++) {
            const idea = pkgData.ideas[i] as Record<string, unknown>;
            b.ensureSpace(40);
            b.text(`${i + 1}. ${idea.title || idea.hook || `Ideia ${i + 1}`}`, { bold: true });
            if (idea.description || idea.caption) b.text(String(idea.description || idea.caption), { size: 9, color: SQUAD.muted });
            b.y -= 8;
          }
        }

        // Scripts
        if (pkgData.scripts && Array.isArray(pkgData.scripts)) {
          b.sectionTitle("Roteiros");
          for (let i = 0; i < pkgData.scripts.length; i++) {
            const script = pkgData.scripts[i] as Record<string, unknown>;
            b.ensureSpace(60);
            b.text(`Roteiro ${i + 1}`, { size: 10, bold: true, color: SQUAD.muted });
            if (script.hook) { b.text("Hook:", { size: 8, bold: true, color: SQUAD.dim }); b.text(String(script.hook)); }
            if (script.body || script.desenvolvimento) b.text(String(script.body || script.desenvolvimento), { size: 9, color: SQUAD.muted });
            if (script.cta) { b.text("CTA:", { size: 8, bold: true, color: SQUAD.dim }); b.text(String(script.cta)); }
            b.y -= 10;
          }
        }

        // Captions
        if (pkgData.captions && Array.isArray(pkgData.captions)) {
          b.sectionTitle("Legendas / Copys");
          for (let i = 0; i < Math.min(pkgData.captions.length, 5); i++) {
            b.ensureSpace(30);
            b.text(`Variacao ${i + 1}:`, { size: 9, bold: true, color: SQUAD.muted });
            b.text(String(pkgData.captions[i]));
            b.y -= 8;
          }
        }
      }
    }

    const pdfBytes = await b.save();
    const timestamp = Date.now();
    const filePath = `exports/campaign/${campaign_id}/${timestamp}.pdf`;

    const { error: uploadError } = await supabase.storage.from('exports').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('exports').createSignedUrl(filePath, 1800);
    const url = signedUrlError ? supabase.storage.from('exports').getPublicUrl(filePath).data.publicUrl : signedUrlData.signedUrl;

    return new Response(JSON.stringify({ success: true, signed_url: url, public_url: url, storage_path: filePath, file_name: `campaign_${campaign_id}_${timestamp}.pdf` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[export-campaign-pdf] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to export PDF' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
