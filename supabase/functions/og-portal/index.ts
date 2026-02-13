import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SQUAD_LOGO = "https://gfyeuhfapscxvjnrssn.supabase.co/storage/v1/object/public/marketing-assets/squad-logo-og.png";
const FALLBACK_TITLE = "SQUAD HUB | Portal do Cliente";
const FALLBACK_DESC = "Acompanhe seu projeto em tempo real — entregas, prazos, pagamentos e aprovações.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shareToken = url.searchParams.get("token");

    if (!shareToken) {
      return new Response("Missing token", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch portal link data
    const { data: link } = await supabase
      .from("portal_links")
      .select("project_name, client_name, project_id")
      .eq("share_token", shareToken)
      .eq("is_active", true)
      .single();

    const projectName = link?.project_name || "Projeto";
    const clientName = link?.client_name || "";

    // Try to get project logo/banner for OG image
    let ogImage = SQUAD_LOGO;
    if (link?.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("logo_url")
        .eq("id", link.project_id)
        .single();
      // Keep SQUAD logo as OG — brand consistency
    }

    const title = clientName
      ? `${projectName} — ${clientName} | SQUAD HUB`
      : `${projectName} | SQUAD HUB`;
    const description = `Acompanhe o projeto ${projectName} em tempo real — entregas, prazos, pagamentos e aprovações.`;

    // Determine the portal URL for redirect
    const siteUrl = url.searchParams.get("site") || "https://squadhub.studio";
    const portalPath = `/client/${shareToken}`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="${siteUrl}${portalPath}">
  <meta property="og:site_name" content="SQUAD HUB">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="https://storage.googleapis.com/gpt-engineer-file-uploads/pyvqkbxT21YFZtUnEuDVkXBFTm33/uploads/1770316777324-SQUAD_2026_5.png">
  
  <!-- Redirect to SPA -->
  <meta http-equiv="refresh" content="0;url=${siteUrl}${portalPath}">
  <script>window.location.href="${siteUrl}${portalPath}";</script>
</head>
<body>
  <p>Redirecionando para o portal do projeto...</p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("og-portal error:", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
