/**
 * export-focus-pdf — Focus Mode execution plan PDF via Gemini HTML
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chatCompletion } from "../_shared/ai-client.ts";
import { formatDateShort } from "../_shared/pdf-design.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SQUAD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
@media print { @page { size: A4 landscape; margin: 15mm 20mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
body { font-family: 'Space Grotesk', sans-serif; background: #000; color: #D9DEE3; }
.header { display: flex; align-items: center; justify-content: space-between; padding: 20px 40px; border-bottom: 1px solid #1A1A1A; }
.logo { width: 40px; height: 40px; border: 1px solid #009CCA; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #009CCA; }
.header-right { font-size: 11px; color: #4A4A4A; letter-spacing: 2px; text-transform: uppercase; }
.hero { padding: 40px 40px 24px; }
.hero-subtitle { font-size: 11px; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
.hero-title { font-size: 36px; font-weight: 700; color: #FFF; line-height: 1.1; margin-bottom: 16px; }
.hero-title .accent { color: #009CCA; }
.accent-bar { width: 60px; height: 2px; background: #009CCA; margin-bottom: 12px; }
.hero-desc { font-size: 13px; color: #8C8C8C; }
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 0 40px 24px; }
.kpi-card { background: #0A0A0A; border: 1px solid #1A1A1A; border-radius: 10px; padding: 16px; text-align: center; }
.kpi-value { font-size: 24px; font-weight: 700; color: #FFF; }
.kpi-value.accent { color: #009CCA; }
.kpi-value.success { color: #22C55E; }
.kpi-label { font-size: 10px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
.section { padding: 0 40px 20px; }
.section-title { font-size: 12px; font-weight: 600; color: #009CCA; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; border-bottom: 1px solid #1A1A1A; padding-bottom: 6px; }
table { width: 100%; border-collapse: collapse; }
thead th { font-size: 10px; color: #8C8C8C; text-transform: uppercase; letter-spacing: 1px; padding: 10px 14px; text-align: left; background: #0A0A0A; border-bottom: 1px solid #1A1A1A; }
tbody td { font-size: 11px; padding: 10px 14px; border-bottom: 1px solid #0A0A0A; color: #D9DEE3; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
.badge-accent { background: rgba(0,156,202,0.15); color: #009CCA; }
.badge-warning { background: rgba(234,179,8,0.15); color: #EAB308; }
.badge-muted { background: rgba(140,140,140,0.15); color: #8C8C8C; }
.bold { font-weight: 600; color: #FFF; }
.muted { color: #8C8C8C; }
.tips { padding: 0 40px 20px; }
.tip { font-size: 11px; color: #D9DEE3; margin-bottom: 6px; }
.footer { padding: 20px 40px; text-align: center; border-top: 1px solid #1A1A1A; }
.footer p { font-size: 11px; color: #4A4A4A; letter-spacing: 3px; text-transform: uppercase; }
`.trim();

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { blocks, total_estimated_minutes, tips } = await req.json();
    if (!blocks || !Array.isArray(blocks)) throw new Error('Missing blocks data');

    const totalBlocks = blocks.length;
    const totalTasks = blocks.reduce((s: number, b: any) => s + (b.tasks?.length || 0), 0);
    const totalMinutes = total_estimated_minutes || blocks.reduce((s: number, b: any) => s + (b.duration_minutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

    const dataPayload = JSON.stringify({
      date: formatDateShort(),
      kpis: { blocks: totalBlocks, tasks: totalTasks, time: timeStr, status: "ATIVO" },
      blocks: blocks.map((b: any, i: number) => ({
        title: b.title || `Bloco ${i + 1}`,
        type: b.type,
        technique: b.technique || '',
        duration: `${b.duration_minutes || 0}min`,
        progress: i === 0 ? 'Active' : i < 3 ? 'Queued' : 'Scheduled',
        tasks: (b.tasks || []).map((t: any) => ({
          title: t.title,
          estimated_minutes: t.estimated_minutes || 0,
          cognitive_type: t.cognitive_type || '',
        })),
      })),
      tips: (tips || []).slice(0, 3),
    });

    const systemPrompt = `You are a pixel-perfect HTML report generator for SQUAD FILM.
Return ONLY a complete HTML document. No markdown code blocks.

Use this EXACT CSS in <style>:
${SQUAD_CSS}
.subtasks { margin: 4px 0 0 24px; }
.subtask { font-size: 10px; color: #8C8C8C; padding: 3px 0; display: flex; align-items: center; gap: 6px; }
.subtask .dot { width: 4px; height: 4px; border-radius: 50%; background: #009CCA; flex-shrink: 0; }
.subtask .time { color: #4A4A4A; font-size: 9px; margin-left: auto; }

Add in <head>:
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

STRUCTURE:
1. div.header with div.logo "SQ" + span.header-right "SQUAD FILM | 2026"
2. div.hero: subtitle "Modo Foco - Blocos Otimizados com IA", title "Plano de<br><span class='accent'>Execucao.</span>", accent-bar, desc with blocks/tasks/time summary
3. div.kpi-row: Blocos, Tarefas, Tempo Estimado (accent), Status "ATIVO" (success)
4. div.section "Execucao Estrategica": For EACH block render:
   - A row with block title (bold), method badge, duration, progress
   - BELOW each block row, render ALL its subtasks as a div.subtasks containing div.subtask items with: dot, task title, and estimated time on the right
   - Use a simple list layout, NOT a nested table
   - type=break: method "PAUSA" badge-warning, type=deep_work: "DEEP WORK" badge-accent, else "SHALLOW WORK" badge-muted
   - First block Active (bold white), rest muted
5. If tips exist: div.tips with section-title "Dicas de Produtividade" and tip items
6. div.footer "SQUAD FILM | 2026"

IMPORTANT: Every block MUST show its subtasks. This is critical.`;

    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the HTML report:\n${dataPayload}` },
      ],
      temperature: 0.1,
    });

    let html = aiResult.choices?.[0]?.message?.content || "";
    html = html.replace(/^```html?\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    if (!html.includes('<html') && !html.includes('<!DOCTYPE')) throw new Error("IA nao gerou HTML valido");

    return new Response(JSON.stringify({ success: true, html, slug: `plano-foco-${formatDateShort()}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[export-focus-pdf] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
