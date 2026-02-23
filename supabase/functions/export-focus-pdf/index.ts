/**
 * export-focus-pdf — Focus Mode execution plan PDF with SQUAD Swiss design
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SquadPdfBuilder, SQUAD, PAGE_W, PAGE_H, MARGIN, CONTENT_W, sanitize, formatDateShort } from "../_shared/pdf-design.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { blocks, total_estimated_minutes, tips } = await req.json();
    if (!blocks || !Array.isArray(blocks)) throw new Error('Missing blocks data');

    const totalBlocks = blocks.length;
    const totalTasks = blocks.reduce((s: number, b: any) => s + (b.tasks?.length || 0), 0);
    const totalMinutes = total_estimated_minutes || blocks.reduce((s: number, b: any) => s + (b.duration_minutes || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
    const dateStr = formatDateShort();

    const b = new SquadPdfBuilder();
    await b.init();

    // Cover
    b.coverPage({
      subtitle: "Modo Foco - Blocos Otimizados com IA",
      titleLine1: "Plano de",
      titleLine2: "Execucao",
      description: `${totalBlocks} blocos | ${totalTasks} tarefas | ${timeStr} estimado`,
      date: dateStr,
    });

    // Content page
    b.newPage();
    b.heroSection("Plano de", "Execucao.", "Blocos Estrategicos");

    b.kpiRow([
      { label: "Blocos", value: `${totalBlocks}` },
      { label: "Tarefas", value: `${totalTasks}` },
      { label: "Tempo Estimado", value: timeStr, color: SQUAD.accent },
      { label: "Status", value: "ATIVO", color: SQUAD.success },
    ]);

    // Blocks table
    b.sectionTitle("Execucao Estrategica");
    const colW = [200, 100, 100, 99];
    b.tableHeader([
      { text: "Bloco", width: colW[0] },
      { text: "Metodo", width: colW[1] },
      { text: "Duracao", width: colW[2] },
      { text: "Progresso", width: colW[3] },
    ]);

    for (let bIdx = 0; bIdx < blocks.length; bIdx++) {
      const block = blocks[bIdx];
      const isDeep = block.type === 'deep_work';
      const isBreak = block.type === 'break';
      const methodLabel = isBreak ? 'PAUSA' : isDeep ? 'DEEP WORK' : 'SHALLOW WORK';
      const technique = sanitize(block.technique || '');
      const duration = `${block.duration_minutes || 0}min`;
      const durText = technique ? `${technique} ${duration}` : duration;
      let progressLabel = 'Scheduled';
      if (bIdx === 0) progressLabel = 'Active';
      else if (bIdx < 3) progressLabel = 'Queued';

      const dotColor = isBreak ? SQUAD.warning : isDeep ? SQUAD.accent : SQUAD.muted;
      b.tableRow([
        { text: block.title || `Bloco ${bIdx + 1}`, width: colW[0], bold: true, color: dotColor },
        { text: methodLabel, width: colW[1], color: SQUAD.muted },
        { text: durText, width: colW[2], color: SQUAD.muted },
        { text: progressLabel, width: colW[3], color: bIdx === 0 ? SQUAD.white : SQUAD.muted },
      ]);
    }

    // Tips
    const tipsList = (tips || []).slice(0, 3);
    if (tipsList.length > 0) {
      b.sectionTitle("Dicas de Produtividade");
      for (const tip of tipsList) {
        b.text(`- ${tip}`, { size: 9, color: SQUAD.offWhite });
      }
    }

    const pdfBytes = await b.save();
    const fileName = `PLANO_FOCO_${dateStr}.pdf`;
    const filePath = `focus-plans/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('exports').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('exports').createSignedUrl(filePath, 1800);
    if (signedUrlError) throw signedUrlError;

    return new Response(JSON.stringify({
      success: true, signed_url: signedUrlData.signedUrl, storage_path: filePath, file_name: fileName,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[export-focus-pdf] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to export PDF' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
