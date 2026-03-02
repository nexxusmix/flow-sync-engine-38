/**
 * export-instagram-campaign-pdf — Comprehensive Instagram Campaign PDF
 * Includes: strategy, audience, budget, calendar, all posts, scripts, captions, ads structure, segmentation
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";
import { formatDateShort, formatCurrency, formatDate } from "../_shared/pdf-design.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SQUAD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
@media print {
  @page { size: A4; margin: 18mm 14mm; }
  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .page-break { page-break-before: always; }
}
body { font-family: 'Space Grotesk', sans-serif; background: #000; color: #D9DEE3; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 24px 40px; border-bottom: 1px solid #1A1A1A; }
.logo { width: 40px; height: 40px; border: 1px solid #009CCA; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #009CCA; }
.header-right { font-size: 11px; color: #4A4A4A; letter-spacing: 2px; text-transform: uppercase; }
.hero { padding: 60px 40px 40px; }
.hero-subtitle { font-size: 11px; color: #009CCA; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 16px; }
.hero-title { font-size: 32px; font-weight: 700; color: #FFF; line-height: 1.1; margin-bottom: 24px; }
.hero-title .accent { color: #009CCA; }
.accent-bar { width: 60px; height: 2px; background: #009CCA; margin-bottom: 16px; }
.hero-desc { font-size: 13px; color: #8C8C8C; max-width: 500px; line-height: 1.6; }
.kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; padding: 0 40px 32px; }
.kpi-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-radius: 12px; padding: 18px; text-align: center; }
.kpi-value { font-size: 22px; font-weight: 700; color: #FFF; margin-bottom: 4px; }
.kpi-value.accent { color: #009CCA; }
.kpi-label { font-size: 10px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; }
.section { padding: 0 40px 24px; }
.section-title { font-size: 12px; font-weight: 600; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; border-bottom: 1px solid #1A1A1A; padding-bottom: 8px; }
.field-label { font-size: 9px; font-weight: 700; color: #009CCA; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.field-value { font-size: 12px; color: #D9DEE3; margin-bottom: 14px; line-height: 1.6; }
.post-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
.post-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.post-title { font-size: 13px; font-weight: 600; color: #FFF; }
.post-badge { font-size: 9px; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-reel { background: #009CCA20; color: #009CCA; }
.badge-carousel { background: #8B5CF620; color: #A78BFA; }
.badge-single { background: #22C55E20; color: #22C55E; }
.badge-story { background: #F59E0B20; color: #F59E0B; }
.post-meta { display: flex; gap: 12px; font-size: 10px; color: #8C8C8C; margin-bottom: 8px; }
.post-section-label { font-size: 9px; font-weight: 600; color: #009CCA; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px; margin-bottom: 4px; }
.post-text { font-size: 11px; color: #D9DEE3; line-height: 1.6; margin-bottom: 8px; }
.post-text.muted { color: #8C8C8C; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-bottom: 16px; }
.calendar-day { background: #0A0A0A; border: 1px solid #1A1A1A; border-radius: 6px; padding: 6px; min-height: 60px; }
.calendar-day.has-post { border-color: #009CCA40; }
.calendar-day-num { font-size: 10px; color: #4A4A4A; margin-bottom: 4px; }
.calendar-post-dot { font-size: 8px; color: #009CCA; line-height: 1.3; }
.calendar-weekday { font-size: 9px; color: #4A4A4A; text-align: center; padding: 4px; text-transform: uppercase; letter-spacing: 1px; }
.tag { display: inline-block; font-size: 9px; padding: 2px 7px; border-radius: 4px; margin-right: 4px; margin-bottom: 4px; background: #1A1A1A; color: #8C8C8C; }
.bold { font-weight: 600; color: #FFF; }
.muted { color: #8C8C8C; }
.footer { padding: 40px; text-align: center; border-top: 1px solid #1A1A1A; margin-top: 40px; }
.footer p { font-size: 11px; color: #4A4A4A; letter-spacing: 3px; text-transform: uppercase; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
.ads-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-radius: 10px; padding: 16px; }
.ads-card h4 { font-size: 12px; font-weight: 600; color: #FFF; margin-bottom: 8px; }
.checklist-item { font-size: 10px; color: #D9DEE3; padding: 3px 0; border-bottom: 1px solid #0F0F0F; }
.checklist-item::before { content: "✓ "; color: #009CCA; font-weight: 700; }
`.trim();

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error('Missing campaign_id');

    // Fetch campaign
    const { data: campaign, error: cErr } = await supabase
      .from('instagram_campaigns').select('*').eq('id', campaign_id).single();
    if (cErr || !campaign) throw new Error(`Campaign not found: ${cErr?.message}`);

    // Fetch all posts for this campaign
    const { data: posts } = await supabase
      .from('instagram_posts').select('*').eq('campaign_id', campaign_id)
      .order('position', { ascending: true });

    // Stats
    const allPosts = posts || [];
    const formatCounts: Record<string, number> = {};
    const pillarCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    let scheduledCount = 0;
    let publishedCount = 0;

    for (const p of allPosts) {
      formatCounts[p.format || 'reel'] = (formatCounts[p.format || 'reel'] || 0) + 1;
      if (p.pillar) pillarCounts[p.pillar] = (pillarCounts[p.pillar] || 0) + 1;
      statusCounts[p.status || 'planned'] = (statusCounts[p.status || 'planned'] || 0) + 1;
      if (p.scheduled_at) scheduledCount++;
      if (p.status === 'published') publishedCount++;
    }

    // Build the data payload for the AI
    const dataPayload = JSON.stringify({
      campaign: {
        name: campaign.name || "Campanha Instagram",
        status: (campaign.status || "planning").toUpperCase(),
        objective: campaign.objective,
        target_audience: campaign.target_audience,
        budget: campaign.budget ? formatCurrency(campaign.budget) : null,
        start_date: campaign.start_date ? formatDate(campaign.start_date) : null,
        end_date: campaign.end_date ? formatDate(campaign.end_date) : null,
        key_messages: campaign.key_messages || [],
        kpis: campaign.kpis || {},
        content_plan_summary: campaign.content_plan ? (campaign.content_plan as any[]).length + " itens no plano" : null,
      },
      stats: {
        total_posts: allPosts.length,
        scheduled: scheduledCount,
        published: publishedCount,
        by_format: formatCounts,
        by_pillar: pillarCounts,
        by_status: statusCounts,
      },
      posts: allPosts.map((p: any, idx: number) => ({
        number: idx + 1,
        title: p.title,
        format: p.format,
        pillar: p.pillar,
        objective: p.objective,
        status: p.status,
        scheduled_at: p.scheduled_at ? formatDate(p.scheduled_at) : null,
        hook: p.hook,
        script: p.script,
        caption_short: p.caption_short,
        caption_medium: p.caption_medium,
        caption_long: p.caption_long,
        cta: p.cta,
        pinned_comment: p.pinned_comment,
        hashtags: p.hashtags || [],
        cover_suggestion: p.cover_suggestion,
        carousel_slides: p.carousel_slides,
        story_sequence: p.story_sequence,
        checklist: p.checklist,
      })),
      date: formatDateShort(),
    });

    const systemPrompt = `You are a pixel-perfect HTML report generator for SQUAD FILM producing a COMPREHENSIVE campaign document.
Return ONLY complete HTML. No markdown fences. Must be valid HTML with <html>, <head>, <body>.

Use this CSS (include it in a <style> tag):
${SQUAD_CSS}

<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

IMPORTANT RULES:
- Generate EVERY section. This must be EXHAUSTIVE. Include ALL posts with FULL content.
- Use page-break classes between major sections for print.
- All text in Portuguese (pt-BR).

DOCUMENT STRUCTURE (generate ALL sections):

1. **HEADER** — logo "SQ" left + "SQUAD FILM | 2026" right

2. **COVER/HERO** — subtitle "CAMPANHA INSTAGRAM | STATUS", title with campaign name + accent "Documento Completo.", description with objective

3. **KPI ROW** (5-6 cards): Total Posts, Publicados, Agendados, Orçamento (accent), Período, Status

4. **ESTRATÉGIA & OBJETIVO** section:
   - Objetivo principal
   - Público-alvo / Segmentação detalhada
   - Mensagens-chave (list all key_messages)
   - Tom e estilo (from kpis.wizard_context if available)
   
5. **SEGMENTAÇÃO & PÚBLICO** section:
   - Target audience breakdown
   - Demographics analysis (infer from audience description)
   - Behavioral targeting suggestions
   - Lookalike audience recommendations

6. **ALOCAÇÃO DE VERBA** section (if budget exists):
   - Budget total
   - Suggested split by format (e.g. 40% Reels ads, 30% Carousel, 20% Stories, 10% boost)
   - Suggested daily budget
   - Cost per result estimates
   - Budget timeline distribution

7. **ESTRUTURA DE ADS** section:
   - Campaign structure (Awareness → Consideration → Conversion)
   - Ad sets recommendation based on content
   - Placement suggestions (Feed, Stories, Reels, Explore)
   - Bidding strategy suggestions

8. **CALENDÁRIO EDITORIAL COMPLETO** section:
   - Render a visual calendar grid (7 columns: Dom Seg Ter Qua Qui Sex Sáb) showing ALL days of the campaign period
   - Place post titles on their scheduled dates
   - Show unscheduled posts in a separate list below

9. **DISTRIBUIÇÃO POR FORMATO** section:
   - Breakdown chart/bars of formats (Reels, Carrossel, Foto, Stories)
   - Breakdown by pillar
   - Breakdown by status

10. **CONTEÚDO COMPLETO — TODOS OS POSTS** (this is the biggest section):
    For EACH post render a post-card with:
    - Post number, title, format badge, pillar, status, scheduled date
    - HOOK (if exists)
    - ROTEIRO/SCRIPT completo (if exists)  
    - LEGENDA CURTA (if exists)
    - LEGENDA MÉDIA (if exists)
    - LEGENDA LONGA (if exists)
    - CTA (if exists)
    - COMENTÁRIO FIXADO (if exists)
    - HASHTAGS (if exists)
    - SUGESTÃO DE CAPA (if exists)
    - SLIDES DO CARROSSEL (if carousel_slides exists, list each slide)
    - SEQUÊNCIA DE STORIES (if story_sequence exists, list each story)
    - CHECKLIST (if exists)
    Add page-break every 3-4 posts.

11. **CRIATIVOS & DIREÇÃO VISUAL** section:
    - Visual direction recommendations based on style
    - Color palette suggestions
    - Typography recommendations
    - Photography/video direction
    - Reference mood descriptions

12. **MÉTRICAS & KPIs ESPERADOS** section:
    - Expected reach
    - Expected engagement rate
    - Follower growth projection
    - Conversion goals

13. **PRÓXIMOS PASSOS** section:
    - Action items checklist
    - Production timeline
    - Review milestones

14. **FOOTER** — "SQUAD FILM | 2026"

Skip null/empty fields but ALWAYS include the section headers.
EVERY post must be rendered completely — do NOT abbreviate or skip posts.`;

    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the complete campaign document:\n${dataPayload}` },
      ],
      temperature: 0.15,
      max_tokens: 65000,
    });

    let html = aiResult.choices?.[0]?.message?.content || "";
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
      throw new Error("IA não gerou HTML válido");
    }

    return new Response(JSON.stringify({
      success: true,
      html,
      slug: `campanha-completa-${campaign_id}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[export-instagram-campaign-pdf] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
