/**
 * export-content-pdf — Content item PDF with SQUAD Swiss design
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SquadPdfBuilder, SQUAD, sanitize, formatDateShort } from "../_shared/pdf-design.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return "--";
  try { return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }); } catch { return "--"; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { content_item_id } = await req.json();
    if (!content_item_id) throw new Error('Missing required field: content_item_id');

    const [{ data: content, error: contentError }, { data: checklist }, { data: comments }] = await Promise.all([
      supabase.from('content_items').select('*').eq('id', content_item_id).single(),
      supabase.from('content_checklist').select('*').eq('content_item_id', content_item_id).order('created_at'),
      supabase.from('content_comments').select('*').eq('content_item_id', content_item_id).order('created_at', { ascending: false }).limit(20),
    ]);

    if (contentError || !content) throw new Error(`Content not found: ${contentError?.message}`);

    const b = new SquadPdfBuilder();
    await b.init();

    const statusLabels: Record<string, string> = { idea: "Ideia", scripting: "Roteiro", recording: "Gravacao", editing: "Edicao", review: "Revisao", scheduled: "Agendado", published: "Publicado" };

    // Cover
    b.coverPage({
      subtitle: `${(content.channel || "--").toUpperCase()} | ${(statusLabels[content.status] || content.status || "Rascunho").toUpperCase()}`,
      titleLine1: sanitize(content.title || "Conteudo"),
      titleLine2: "Ficha",
      description: `Formato: ${content.format || "--"} | Canal: ${content.channel || "--"}`,
      date: formatDateShort(),
    });

    // Copy & Script
    b.newPage();
    b.heroSection("Copy e", "Roteiro.", "Textos de Producao");

    if (content.hook) { b.text("HOOK / GANCHO:", { size: 8, bold: true, color: SQUAD.accent }); b.text(content.hook, { size: 11 }); b.y -= 10; }
    if (content.caption_short) { b.text("CAPTION CURTA:", { size: 8, bold: true, color: SQUAD.accent }); b.text(content.caption_short); b.y -= 10; }
    if (content.caption_long) { b.text("CAPTION LONGA:", { size: 8, bold: true, color: SQUAD.accent }); b.text(content.caption_long); b.y -= 10; }
    if (content.cta) { b.text("CTA:", { size: 8, bold: true, color: SQUAD.accent }); b.text(content.cta); b.y -= 10; }
    if (content.hashtags) { b.text("HASHTAGS:", { size: 8, bold: true, color: SQUAD.accent }); b.text(content.hashtags, { size: 9, color: SQUAD.accent }); b.y -= 10; }
    if (content.script) { b.text("ROTEIRO:", { size: 8, bold: true, color: SQUAD.accent }); b.text(content.script); b.y -= 10; }

    // Briefing
    if (content.notes) {
      b.sectionTitle("Briefing");
      b.text(content.notes, { color: SQUAD.muted });
    }

    // Dates
    const dates = [];
    if (content.due_at) dates.push(`Prazo: ${formatDateBR(content.due_at)}`);
    if (content.scheduled_at) dates.push(`Agendado: ${formatDateBR(content.scheduled_at)}`);
    if (content.published_at) dates.push(`Publicado: ${formatDateBR(content.published_at)}`);
    if (dates.length > 0) { b.y -= 10; b.text(dates.join("  |  "), { size: 9, color: SQUAD.muted }); }

    // Checklist
    if (checklist && checklist.length > 0) {
      b.sectionTitle("Checklist");
      for (const item of checklist) {
        b.ensureSpace(20);
        const isDone = item.status === "done";
        const mark = isDone ? "[x]" : "[ ]";
        const color = isDone ? SQUAD.success : SQUAD.muted;
        b.text(`${mark} ${item.title}`, { color, bold: !isDone });
      }
    }

    // Comments
    if (comments && comments.length > 0) {
      b.sectionTitle("Comentarios de Revisao");
      for (const c of comments) {
        b.ensureSpace(40);
        b.text(`${c.author_name || "Usuario"} - ${formatDateBR(c.created_at)}`, { size: 9, bold: true, color: SQUAD.dim });
        b.text(c.text, { color: SQUAD.offWhite });
        b.y -= 8;
      }
    }

    // Publication
    if (content.post_url) {
      b.sectionTitle("Publicacao");
      b.text("Link do Post:", { size: 8, bold: true, color: SQUAD.accent });
      b.text(content.post_url, { size: 9, color: SQUAD.accent });
    }

    const pdfBytes = await b.save();
    const timestamp = Date.now();
    const filePath = `exports/content/${content_item_id}/${timestamp}.pdf`;

    const { error: uploadError } = await supabase.storage.from('exports').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('exports').createSignedUrl(filePath, 1800);
    const url = signedUrlError ? supabase.storage.from('exports').getPublicUrl(filePath).data.publicUrl : signedUrlData.signedUrl;

    return new Response(JSON.stringify({ success: true, signed_url: url, public_url: url, storage_path: filePath, file_name: `content_${content_item_id}_${timestamp}.pdf` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[export-content-pdf] Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to export PDF' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
