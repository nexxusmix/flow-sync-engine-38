import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GRAPH_API = "https://graph.facebook.com/v21.0";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { post_id, image_url, caption, media_type = "IMAGE" } = body;
    // media_type: "IMAGE" | "CAROUSEL" | "REELS"
    // For CAROUSEL: image_urls (string[]) instead of image_url
    // For REELS: video_url instead of image_url

    if (!post_id) throw new Error("post_id é obrigatório");

    const workspace_id = body.workspace_id || "00000000-0000-0000-0000-000000000000";

    // Get connection
    const { data: conn, error: connErr } = await supabase
      .from("instagram_connections")
      .select("*")
      .eq("workspace_id", workspace_id)
      .order("connected_at", { ascending: false })
      .limit(1)
      .single();

    if (connErr || !conn) throw new Error("Nenhuma conta Instagram conectada");
    if (!conn.access_token) throw new Error("Token de acesso expirado. Reconecte sua conta.");

    const igUserId = conn.ig_user_id;
    const accessToken = conn.access_token;

    let publishResult: any;

    if (media_type === "CAROUSEL") {
      // Step 1: Create child containers for each image
      const imageUrls: string[] = body.image_urls || [];
      if (imageUrls.length < 2) throw new Error("Carrossel precisa de pelo menos 2 imagens");
      if (imageUrls.length > 10) throw new Error("Carrossel suporta no máximo 10 imagens");

      const childIds: string[] = [];
      for (const url of imageUrls) {
        const childRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: url,
            is_carousel_item: true,
            access_token: accessToken,
          }),
        });
        const childData = await childRes.json();
        if (childData.error) throw new Error(`Erro ao criar item do carrossel: ${childData.error.message}`);
        childIds.push(childData.id);
      }

      // Step 2: Create carousel container
      const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "CAROUSEL",
          children: childIds.join(","),
          caption: caption || "",
          access_token: accessToken,
        }),
      });
      const containerData = await containerRes.json();
      if (containerData.error) throw new Error(`Erro ao criar carrossel: ${containerData.error.message}`);

      // Step 3: Publish
      publishResult = await publishContainer(igUserId, containerData.id, accessToken);

    } else if (media_type === "REELS") {
      const videoUrl = body.video_url;
      if (!videoUrl) throw new Error("video_url é obrigatório para Reels");

      // Step 1: Create video container
      const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: videoUrl,
          caption: caption || "",
          access_token: accessToken,
        }),
      });
      const containerData = await containerRes.json();
      if (containerData.error) throw new Error(`Erro ao criar Reel: ${containerData.error.message}`);

      // Wait for video processing (poll status)
      await waitForMediaReady(containerData.id, accessToken);

      // Step 2: Publish
      publishResult = await publishContainer(igUserId, containerData.id, accessToken);

    } else {
      // Single IMAGE post
      if (!image_url) throw new Error("image_url é obrigatório para post de imagem");

      // Step 1: Create media container
      const containerRes = await fetch(`${GRAPH_API}/${igUserId}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: image_url,
          caption: caption || "",
          access_token: accessToken,
        }),
      });
      const containerData = await containerRes.json();
      if (containerData.error) throw new Error(`Erro ao criar mídia: ${containerData.error.message}`);

      // Step 2: Publish
      publishResult = await publishContainer(igUserId, containerData.id, accessToken);
    }

    // Update post status to published
    const now = new Date().toISOString();
    await supabase
      .from("instagram_posts")
      .update({
        status: "published",
        published_at: now,
      } as any)
      .eq("id", post_id);

    return new Response(JSON.stringify({
      success: true,
      ig_media_id: publishResult.id,
      post_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Publish error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function publishContainer(igUserId: string, creationId: string, accessToken: string) {
  const publishRes = await fetch(`${GRAPH_API}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: accessToken,
    }),
  });
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(`Erro ao publicar: ${publishData.error.message}`);
  return publishData;
}

async function waitForMediaReady(containerId: string, accessToken: string, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    const statusRes = await fetch(
      `${GRAPH_API}/${containerId}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusRes.json();

    if (statusData.status_code === "FINISHED") return;
    if (statusData.status_code === "ERROR") {
      throw new Error("Erro no processamento do vídeo pelo Instagram");
    }

    // Wait 2 seconds before polling again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error("Timeout: vídeo ainda em processamento");
}
