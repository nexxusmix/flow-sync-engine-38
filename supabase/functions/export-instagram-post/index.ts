import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generatePDFHtml(post: any) {
  const hashtags = (post.hashtags || []).map((h: string) => `#${h}`).join(' ');
  const scheduledAt = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })
    : '—';

  const checklistHtml = (post.checklist || [])
    .map((item: any) => `<li>${item.task || item}</li>`)
    .join('');

  const carouselHtml = (post.carousel_slides || [])
    .map((slide: any, i: number) => `
      <div style="background:#111;padding:12px;border-radius:8px;margin-bottom:8px;">
        <p style="color:#009CCA;font-size:11px;margin:0 0 4px;">Slide ${i + 1}</p>
        <p style="color:#fff;font-size:13px;font-weight:600;margin:0 0 4px;">${slide.title || ''}</p>
        <p style="color:#aaa;font-size:12px;margin:0;">${slide.body || ''}</p>
      </div>
    `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#000; color:#fff; font-family:'Space Grotesk',sans-serif; padding:40px; }
  .header { border-bottom:2px solid #009CCA; padding-bottom:16px; margin-bottom:24px; }
  .title { font-size:22px; font-weight:700; color:#fff; }
  .subtitle { font-size:12px; color:#009CCA; margin-top:4px; }
  .badge { display:inline-block; background:#009CCA22; color:#009CCA; padding:2px 10px; border-radius:20px; font-size:11px; margin-right:6px; }
  .section { margin-bottom:20px; }
  .section-title { font-size:13px; font-weight:600; color:#009CCA; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px; }
  .section-content { font-size:13px; color:#ddd; line-height:1.6; white-space:pre-wrap; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .meta { font-size:11px; color:#888; }
  .image-container { text-align:center; margin-bottom:20px; }
  .image-container img { max-width:100%; max-height:400px; border-radius:12px; }
  .footer { border-top:1px solid #222; padding-top:12px; margin-top:32px; font-size:10px; color:#555; text-align:center; }
  ul { padding-left:18px; color:#ddd; font-size:12px; }
  li { margin-bottom:4px; }
</style>
</head>
<body>
  <div class="header">
    <div class="title">${post.title || 'Post Instagram'}</div>
    <div class="subtitle">SQUAD Film — Instagram Engine Export</div>
    <div style="margin-top:8px;">
      <span class="badge">${post.format || '—'}</span>
      <span class="badge">${post.pillar || '—'}</span>
      <span class="badge">${post.status || '—'}</span>
    </div>
  </div>

  ${post.thumbnail_url ? `<div class="image-container"><img src="${post.thumbnail_url}" alt="Post visual" /></div>` : ''}

  <div class="section">
    <div class="section-title">📅 Agendamento</div>
    <div class="section-content">${scheduledAt}</div>
  </div>

  <div class="grid">
    <div class="section">
      <div class="section-title">🎯 Hook</div>
      <div class="section-content">${post.hook || '—'}</div>
    </div>
    <div class="section">
      <div class="section-title">📢 CTA</div>
      <div class="section-content">${post.cta || '—'}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🎬 Roteiro</div>
    <div class="section-content">${post.script || '—'}</div>
  </div>

  <div class="section">
    <div class="section-title">📝 Legenda Curta</div>
    <div class="section-content">${post.caption_short || '—'}</div>
  </div>

  <div class="section">
    <div class="section-title">📝 Legenda Média</div>
    <div class="section-content">${post.caption_medium || '—'}</div>
  </div>

  <div class="section">
    <div class="section-title">📝 Legenda Completa</div>
    <div class="section-content">${post.caption_long || '—'}</div>
  </div>

  <div class="section">
    <div class="section-title">📌 Comentário Fixado</div>
    <div class="section-content">${post.pinned_comment || '—'}</div>
  </div>

  <div class="section">
    <div class="section-title"># Hashtags</div>
    <div class="section-content" style="color:#009CCA;">${hashtags || '—'}</div>
  </div>

  ${carouselHtml ? `<div class="section"><div class="section-title">📑 Slides do Carrossel</div>${carouselHtml}</div>` : ''}

  ${checklistHtml ? `<div class="section"><div class="section-title">✅ Checklist de Produção</div><ul>${checklistHtml}</ul></div>` : ''}

  <div class="section">
    <div class="section-title">🖼️ Sugestão de Capa</div>
    <div class="section-content">${post.cover_suggestion || '—'}</div>
  </div>

  <div class="footer">
    Gerado por SQUAD Film • Instagram Engine • ${new Date().toLocaleDateString('pt-BR')}
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sbAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { post_id } = await req.json();
    if (!post_id) {
      return new Response(JSON.stringify({ error: "post_id é obrigatório" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch post
    const { data: post, error: postErr } = await sbAuth
      .from('instagram_posts')
      .select('*')
      .eq('id', post_id)
      .single();

    if (postErr || !post) {
      return new Response(JSON.stringify({ error: "Post não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate PDF HTML
    const pdfHtml = generatePDFHtml(post);

    // Use Gemini to convert HTML to a proper styled PDF-like HTML (we'll store the HTML as a file)
    const pdfFileName = `instagram-posts/${post_id}/post-${Date.now()}.html`;
    const pdfBlob = new TextEncoder().encode(pdfHtml);

    await supabaseAdmin.storage
      .from('exports')
      .upload(pdfFileName, pdfBlob, {
        contentType: 'text/html',
        upsert: true,
      });

    // Build ZIP
    const zip = new JSZip();

    // Add PDF HTML
    zip.file(`${post.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'post'}.html`, pdfHtml);

    // Add text export
    const textContent = [
      `# ${post.title}`,
      `Formato: ${post.format}`,
      `Pilar: ${post.pillar || '—'}`,
      post.scheduled_at ? `Agendado: ${new Date(post.scheduled_at).toLocaleString('pt-BR')}` : '',
      '',
      '## Hook', post.hook || '—',
      '', '## Roteiro', post.script || '—',
      '', '## Legenda Curta', post.caption_short || '—',
      '', '## Legenda Média', post.caption_medium || '—',
      '', '## Legenda Longa', post.caption_long || '—',
      '', '## CTA', post.cta || '—',
      '', '## Comentário Fixado', post.pinned_comment || '—',
      '', '## Hashtags', (post.hashtags || []).map((h: string) => `#${h}`).join(' ') || '—',
      '', '## Sugestão de Capa', post.cover_suggestion || '—',
    ].filter(l => l !== undefined).join('\n');
    zip.file('conteudo.txt', textContent);

    // Download and add thumbnail PNG if exists
    let pngUrl: string | null = null;
    if (post.thumbnail_url && !post.thumbnail_url.startsWith('data:')) {
      try {
        const imgResp = await fetch(post.thumbnail_url);
        if (imgResp.ok) {
          const imgBlob = await imgResp.arrayBuffer();
          zip.file('post-visual.png', new Uint8Array(imgBlob));

          // Also upload standalone PNG for direct download
          const pngFileName = `instagram-posts/${post_id}/visual-${Date.now()}.png`;
          await supabaseAdmin.storage
            .from('exports')
            .upload(pngFileName, new Uint8Array(imgBlob), {
              contentType: 'image/png',
              upsert: true,
            });
          const { data: pngSignedUrl } = await supabaseAdmin.storage
            .from('exports')
            .createSignedUrl(pngFileName, 3600);
          pngUrl = pngSignedUrl?.signedUrl || null;
        }
      } catch (e) {
        console.warn('Failed to fetch thumbnail for ZIP:', e);
      }
    }

    // Generate ZIP
    const zipContent = await zip.generateAsync({ type: 'uint8array' });
    const zipFileName = `instagram-posts/${post_id}/export-${Date.now()}.zip`;

    await supabaseAdmin.storage
      .from('exports')
      .upload(zipFileName, zipContent, {
        contentType: 'application/zip',
        upsert: true,
      });

    // Generate signed URLs
    const { data: zipSignedUrl } = await supabaseAdmin.storage
      .from('exports')
      .createSignedUrl(zipFileName, 3600);

    const { data: pdfSignedUrl } = await supabaseAdmin.storage
      .from('exports')
      .createSignedUrl(pdfFileName, 3600);

    return new Response(JSON.stringify({
      success: true,
      zip_url: zipSignedUrl?.signedUrl,
      pdf_url: pdfSignedUrl?.signedUrl,
      png_url: pngUrl || post.thumbnail_url,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Export error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
