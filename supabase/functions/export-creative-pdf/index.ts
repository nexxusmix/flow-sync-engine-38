/**
 * export-creative-pdf — Creative Studio PDF via Gemini HTML
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";
import { formatDateShort } from "../_shared/pdf-design.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SQUAD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
@media print { @page { size: A4; margin: 20mm 15mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
body { font-family: 'Space Grotesk', sans-serif; background: #000; color: #D9DEE3; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 24px 40px; border-bottom: 1px solid #1A1A1A; }
.logo { width: 40px; height: 40px; border: 1px solid #009CCA; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #009CCA; }
.header-right { font-size: 11px; color: #4A4A4A; letter-spacing: 2px; text-transform: uppercase; }
.hero { padding: 60px 40px 40px; }
.hero-subtitle { font-size: 11px; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }
.hero-title { font-size: 36px; font-weight: 700; color: #FFF; line-height: 1.1; margin-bottom: 24px; }
.hero-title .accent { color: #009CCA; }
.accent-bar { width: 60px; height: 2px; background: #009CCA; margin-bottom: 16px; }
.hero-desc { font-size: 14px; color: #8C8C8C; }
.section { padding: 0 40px 24px; }
.section-title { font-size: 13px; font-weight: 600; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; border-bottom: 1px solid #1A1A1A; padding-bottom: 8px; }
.field-label { font-size: 10px; font-weight: 700; color: #009CCA; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.field-value { font-size: 13px; color: #D9DEE3; margin-bottom: 16px; line-height: 1.6; }
.scene { margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #0A0A0A; }
.scene-number { font-size: 13px; font-weight: 700; color: #009CCA; margin-bottom: 4px; }
.scene-title { font-size: 14px; font-weight: 600; color: #FFF; margin-bottom: 4px; }
.scene-desc { font-size: 12px; color: #8C8C8C; margin-bottom: 4px; }
.scene-meta { font-size: 10px; color: #4A4A4A; }
.shot { margin-bottom: 12px; }
.shot-label { font-size: 12px; font-weight: 700; color: #009CCA; }
.shot-desc { font-size: 11px; color: #8C8C8C; }
.shot-meta { font-size: 10px; color: #4A4A4A; }
.bold { font-weight: 600; color: #FFF; }
.muted { color: #8C8C8C; }
.footer { padding: 40px; text-align: center; border-top: 1px solid #1A1A1A; margin-top: 40px; }
.footer p { font-size: 11px; color: #4A4A4A; letter-spacing: 3px; text-transform: uppercase; }
`.trim();

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { type, id } = await req.json();
    if (!type || !id) throw new Error('Missing type and id');

    let title = '';
    let briefData: Record<string, any> = {};
    let outputs: Record<string, any> = {};

    if (type === 'studio_run') {
      const { data: brief, error } = await supabase.from('creative_briefs').select('*, brand_kits(*)').eq('id', id).single();
      if (error || !brief) throw new Error(`Brief not found: ${error?.message}`);
      title = brief.title || 'Pacote Criativo';
      briefData = { title: brief.title, objective: brief.objective, delivery_type: brief.delivery_type, package_type: brief.package_type, input_text: brief.input_text, brand_kit: brief.brand_kits?.name };
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
    } else {
      const { data: pkg, error } = await supabase.from('campaign_creative_packages').select('*, campaigns(*)').eq('id', id).single();
      if (error || !pkg) throw new Error(`Package not found: ${error?.message}`);
      title = pkg.title || 'Pacote Criativo';
      briefData = { title: pkg.title, campaign: pkg.campaigns?.name };
      outputs = (pkg.package_json || {}) as Record<string, any>;
    }

    const dataPayload = JSON.stringify({
      title, type_label: type === "studio_run" ? "Studio Run" : "Pacote Criativo",
      date: formatDateShort(), brief: briefData,
      concept: outputs.concept, script: outputs.script, moodboard: outputs.moodboard,
      shotlist: outputs.shotlist, storyboard: outputs.storyboard,
    });

    const systemPrompt = `You are a pixel-perfect HTML report generator for SQUAD FILM.
Return ONLY complete HTML. No markdown.

Use this CSS:
${SQUAD_CSS}

<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

STRUCTURE:
1. Header: logo "SQ" + "SQUAD FILM | 2026"
2. Hero: subtitle=type_label, title with creative title + "<br><span class='accent'>Criativo.</span>", desc with campaign name or "Pacote Criativo Completo"
3. If brief.input_text: section "Briefing" with field-value
4. If concept: section "Conceito Narrativo" with HEADLINE, SUBHEADLINE, BIG IDEA, NARRATIVA, TOM as field-label + field-value
5. If script: section "Roteiro" with HOOK, DESENVOLVIMENTO, CTA as field-label + field-value
6. If storyboard array: section "Storyboard" with scene blocks (scene-number "CENA N", scene-title, scene-desc, scene-meta with camera|duration|emotion)
7. If shotlist array: section "Shotlist" with shot blocks (shot-label "#N plano", shot-desc, shot-meta with lente|ambiente|luz)
8. If moodboard: section "Moodboard" with direcao_de_arte, paleta (joined by " / "), referencias as bullet list
9. Footer "SQUAD FILM | 2026"
Skip null/empty sections.`;

    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Generate:\n${dataPayload}` }],
      temperature: 0.1,
    });

    let html = aiResult.choices?.[0]?.message?.content || "";
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) throw new Error("IA nao gerou HTML valido");

    return new Response(JSON.stringify({ success: true, html, slug: `criativo-${id}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[export-creative-pdf] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
