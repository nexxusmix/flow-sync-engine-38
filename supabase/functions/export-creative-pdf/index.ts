/**
 * export-creative-pdf — Creative Studio PDF with SQUAD Swiss design
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SquadPdfBuilder, SQUAD, sanitize, formatDateShort } from "../_shared/pdf-design.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { type, id } = await req.json();
    if (!type || !id) throw new Error('Missing required fields: type and id');

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

    const b = new SquadPdfBuilder();
    await b.init();

    // Cover
    b.coverPage({
      subtitle: type === "studio_run" ? "Studio Run" : "Pacote Criativo",
      titleLine1: sanitize(title),
      titleLine2: "Criativo",
      description: briefData.campaign ? `Campanha: ${sanitize(String(briefData.campaign))}` : "Pacote Criativo Completo",
      date: formatDateShort(),
    });

    // Briefing
    if (briefData.input_text) {
      b.newPage();
      b.heroSection("Briefing", undefined, "Instrucoes do Cliente");
      b.text(String(briefData.input_text), { color: SQUAD.muted });
    }

    // Concept
    const concept = outputs.concept as Record<string, unknown> | undefined;
    if (concept) {
      b.newPage();
      b.heroSection("Conceito", "Narrativo.", "Direcao Criativa");
      if (concept.headline) { b.text("HEADLINE:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(concept.headline), { size: 12, bold: true }); b.y -= 10; }
      if (concept.subheadline) { b.text("SUBHEADLINE:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(concept.subheadline), { size: 11 }); b.y -= 10; }
      if (concept.big_idea) { b.text("BIG IDEA:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(concept.big_idea)); b.y -= 10; }
      if (concept.narrativa) { b.text("NARRATIVA:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(concept.narrativa)); b.y -= 10; }
      if (concept.tom) { b.text("TOM DE VOZ:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(concept.tom)); }
    }

    // Script
    const script = outputs.script as Record<string, unknown> | undefined;
    if (script) {
      b.newPage();
      b.heroSection("Roteiro", undefined, "Script de Producao");
      if (script.hook) { b.text("HOOK:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(script.hook), { size: 11 }); b.y -= 10; }
      if (script.desenvolvimento) { b.text("DESENVOLVIMENTO:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(script.desenvolvimento)); b.y -= 10; }
      if (script.cta) { b.text("CTA:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(script.cta)); }
    }

    // Storyboard
    const storyboard = outputs.storyboard as Array<Record<string, unknown>> | undefined;
    if (storyboard && storyboard.length > 0) {
      b.newPage();
      b.heroSection("Storyboard", undefined, "Cenas Visuais");
      for (const scene of storyboard) {
        b.ensureSpace(60);
        b.text(`CENA ${scene.scene_number || "?"}`, { size: 11, bold: true, color: SQUAD.accent });
        if (scene.title) b.text(String(scene.title), { bold: true, size: 10 });
        if (scene.description) b.text(String(scene.description), { color: SQUAD.muted });
        const details = [];
        if (scene.camera) details.push(`Camera: ${scene.camera}`);
        if (scene.duration_sec) details.push(`Duracao: ${scene.duration_sec}s`);
        if (scene.emotion) details.push(`Emocao: ${scene.emotion}`);
        if (details.length > 0) b.text(details.join("  |  "), { size: 8, color: SQUAD.dim });
        b.y -= 12;
      }
    }

    // Shotlist
    const shotlist = outputs.shotlist as Array<Record<string, unknown>> | undefined;
    if (shotlist && shotlist.length > 0) {
      b.newPage();
      b.heroSection("Shotlist", undefined, "Lista de Planos");
      for (let i = 0; i < shotlist.length; i++) {
        const shot = shotlist[i];
        b.ensureSpace(40);
        b.text(`#${i + 1} ${shot.plano || ""}`, { bold: true, color: SQUAD.accent });
        if (shot.descricao) b.text(String(shot.descricao), { size: 9, color: SQUAD.muted });
        const details = [];
        if (shot.lente_sugerida) details.push(`Lente: ${shot.lente_sugerida}`);
        if (shot.ambiente) details.push(`Ambiente: ${shot.ambiente}`);
        if (shot.luz) details.push(`Luz: ${shot.luz}`);
        if (details.length > 0) b.text(details.join("  "), { size: 8, color: SQUAD.dim });
        b.y -= 8;
      }
    }

    // Moodboard
    const moodboard = outputs.moodboard as Record<string, unknown> | undefined;
    if (moodboard) {
      b.sectionTitle("Moodboard");
      if (moodboard.direcao_de_arte) { b.text("DIRECAO DE ARTE:", { size: 8, bold: true, color: SQUAD.accent }); b.text(String(moodboard.direcao_de_arte)); b.y -= 10; }
      const paleta = moodboard.paleta as string[] | undefined;
      if (paleta && paleta.length > 0) { b.text("PALETA DE CORES:", { size: 8, bold: true, color: SQUAD.accent }); b.text(paleta.join(" / ")); b.y -= 10; }
      const refs = moodboard.referencias as string[] | undefined;
      if (refs && refs.length > 0) { b.text("REFERENCIAS:", { size: 8, bold: true, color: SQUAD.accent }); for (const r of refs) b.text(`- ${r}`, { size: 9 }); }
    }

    const pdfBytes = await b.save();
    const timestamp = Date.now();
    const fileName = `${sanitize(title).toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 40)}-${timestamp}.pdf`;
    const storagePath = `${type === 'studio_run' ? 'studio' : 'packages'}/${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('exports').upload(storagePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('exports').createSignedUrl(storagePath, 1800);
    const url = signedUrlError ? supabase.storage.from('exports').getPublicUrl(storagePath).data.publicUrl : signedUrlData.signedUrl;

    return new Response(JSON.stringify({ success: true, signed_url: url, public_url: url, storage_path: storagePath, file_name: fileName }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[export-creative-pdf] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
