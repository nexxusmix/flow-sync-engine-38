/**
 * export-content-pdf — Content item PDF via Gemini HTML
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
.checklist-item { font-size: 12px; margin-bottom: 6px; }
.checklist-done { color: #22C55E; }
.checklist-pending { color: #8C8C8C; font-weight: 600; }
.comment { margin-bottom: 16px; }
.comment-author { font-size: 10px; font-weight: 700; color: #4A4A4A; margin-bottom: 4px; }
.comment-text { font-size: 12px; color: #D9DEE3; }
.bold { font-weight: 600; color: #FFF; }
.muted { color: #8C8C8C; }
.footer { padding: 40px; text-align: center; border-top: 1px solid #1A1A1A; margin-top: 40px; }
.footer p { font-size: 11px; color: #4A4A4A; letter-spacing: 3px; text-transform: uppercase; }
`.trim();

function fmtDateBR(d: string | null) {
  if (!d) return "--";
  try { return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return "--"; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { content_item_id } = await req.json();
    if (!content_item_id) throw new Error('Missing content_item_id');

    const [{ data: content, error: cErr }, { data: checklist }, { data: comments }] = await Promise.all([
      supabase.from('content_items').select('*').eq('id', content_item_id).single(),
      supabase.from('content_checklist').select('*').eq('content_item_id', content_item_id).order('created_at'),
      supabase.from('content_comments').select('*').eq('content_item_id', content_item_id).order('created_at', { ascending: false }).limit(20),
    ]);
    if (cErr || !content) throw new Error(`Content not found: ${cErr?.message}`);

    const statusLabels: Record<string, string> = { idea: "Ideia", scripting: "Roteiro", recording: "Gravacao", editing: "Edicao", review: "Revisao", scheduled: "Agendado", published: "Publicado" };

    const dataPayload = JSON.stringify({
      title: content.title || "Conteudo",
      channel: content.channel || "--",
      status: statusLabels[content.status] || content.status || "Rascunho",
      format: content.format || "--",
      date: formatDateShort(),
      fields: {
        hook: content.hook, caption_short: content.caption_short, caption_long: content.caption_long,
        cta: content.cta, hashtags: content.hashtags, script: content.script, notes: content.notes, post_url: content.post_url,
      },
      dates: { due: fmtDateBR(content.due_at), scheduled: fmtDateBR(content.scheduled_at), published: fmtDateBR(content.published_at) },
      checklist: (checklist || []).map((i: any) => ({ title: i.title, done: i.status === "done" })),
      comments: (comments || []).map((c: any) => ({ author: c.author_name || "Usuario", date: fmtDateBR(c.created_at), text: c.text })),
    });

    const systemPrompt = `You are a pixel-perfect HTML report generator for SQUAD FILM.
Return ONLY complete HTML. No markdown.

Use this CSS in <style>:
${SQUAD_CSS}

<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

STRUCTURE:
1. div.header: logo "SQ" + "SQUAD FILM | 2026"
2. div.hero: subtitle "CHANNEL | STATUS", title with content title + "<br><span class='accent'>Ficha.</span>", desc "Formato: X | Canal: Y"
3. Section "Copy e Roteiro": For each non-null field (hook, caption_short, caption_long, cta, hashtags, script), render field-label + field-value. Hashtags in accent color.
4. If notes: section "Briefing" with field-value
5. Dates row: show due/scheduled/published dates if not "--", separated by " | ", in muted
6. If checklist: section "Checklist" with items. Done=[x] in checklist-done, pending=[ ] in checklist-pending
7. If comments: section "Comentarios de Revisao" with comment blocks
8. If post_url: section "Publicacao" with link in accent
9. Footer "SQUAD FILM | 2026"
Skip empty sections.`;

    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Generate:\n${dataPayload}` }],
      temperature: 0.1,
    });

    let html = aiResult.choices?.[0]?.message?.content || "";
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) throw new Error("IA nao gerou HTML valido");

    return new Response(JSON.stringify({ success: true, html, slug: `conteudo-${content_item_id}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[export-content-pdf] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
