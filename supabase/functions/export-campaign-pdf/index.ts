/**
 * export-campaign-pdf — Campaign PDF via Gemini HTML
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";
import { formatDateShort, formatCurrency } from "../_shared/pdf-design.ts";

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
.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 0 40px 32px; }
.kpi-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-radius: 12px; padding: 20px; text-align: center; }
.kpi-value { font-size: 24px; font-weight: 700; color: #FFF; margin-bottom: 4px; }
.kpi-value.accent { color: #009CCA; }
.kpi-label { font-size: 11px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; }
.section { padding: 0 40px 24px; }
.section-title { font-size: 13px; font-weight: 600; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; border-bottom: 1px solid #1A1A1A; padding-bottom: 8px; }
.field-label { font-size: 10px; font-weight: 700; color: #009CCA; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.field-value { font-size: 13px; color: #D9DEE3; margin-bottom: 16px; line-height: 1.6; }
.pkg-title { font-size: 18px; font-weight: 700; color: #FFF; margin-bottom: 16px; padding-top: 16px; border-top: 1px solid #1A1A1A; }
.idea-item { margin-bottom: 12px; }
.idea-title { font-size: 13px; font-weight: 600; color: #FFF; }
.idea-desc { font-size: 11px; color: #8C8C8C; }
.bold { font-weight: 600; color: #FFF; }
.muted { color: #8C8C8C; }
.footer { padding: 40px; text-align: center; border-top: 1px solid #1A1A1A; margin-top: 40px; }
.footer p { font-size: 11px; color: #4A4A4A; letter-spacing: 3px; text-transform: uppercase; }
`.trim();

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error('Missing campaign_id');

    const { data: campaign, error: cErr } = await supabase.from('campaigns').select('*').eq('id', campaign_id).single();
    if (cErr || !campaign) throw new Error(`Campaign not found: ${cErr?.message}`);

    const { data: packages } = await supabase.from('campaign_creative_packages').select('*').eq('campaign_id', campaign_id).order('created_at', { ascending: false });

    const dataPayload = JSON.stringify({
      name: campaign.name || "Campanha", status: (campaign.status || "draft").toUpperCase(),
      budget: campaign.budget ? formatCurrency(campaign.budget) : "--",
      objective: campaign.objective, offer: campaign.offer, audience: campaign.audience,
      packages_count: packages?.length || 0, date: formatDateShort(),
      packages: (packages || []).map((pkg: any) => {
        const pj = (pkg.package_json || {}) as Record<string, any>;
        return {
          title: pkg.title || "Pacote",
          concept: pj.concept ? { headline: pj.concept.headline, subheadline: pj.concept.subheadline, big_idea: pj.concept.big_idea, tom: pj.concept.tom } : null,
          ideas: (pj.ideas || []).slice(0, 5).map((i: any) => ({ title: i.title || i.hook || "Ideia", description: i.description || i.caption || "" })),
          scripts: (pj.scripts || []).slice(0, 3).map((s: any) => ({ hook: s.hook, body: s.body || s.desenvolvimento, cta: s.cta })),
          captions: (pj.captions || []).slice(0, 5),
        };
      }),
    });

    const systemPrompt = `You are a pixel-perfect HTML report generator for SQUAD FILM.
Return ONLY complete HTML. No markdown.

Use this CSS:
${SQUAD_CSS}

<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

STRUCTURE:
1. Header: logo "SQ" + "SQUAD FILM | 2026"
2. Hero: subtitle "Campanha | STATUS", title with name + "<br><span class='accent'>Relatorio.</span>", desc with objective preview
3. KPI row (3 cols): Status, Budget, Pacotes Criativos (accent)
4. If objective/offer/audience: render as field-label + field-value pairs
5. For each package: pkg-title, then concept fields (HEADLINE, SUBHEADLINE, BIG IDEA, TOM), then ideas as numbered list, then scripts with Hook/Body/CTA, then captions as "Variacao N"
6. Footer "SQUAD FILM | 2026"
Skip null/empty fields.`;

    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Generate:\n${dataPayload}` }],
      temperature: 0.1,
    });

    let html = aiResult.choices?.[0]?.message?.content || "";
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) throw new Error("IA nao gerou HTML valido");

    return new Response(JSON.stringify({ success: true, html, slug: `campanha-${campaign_id}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[export-campaign-pdf] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
