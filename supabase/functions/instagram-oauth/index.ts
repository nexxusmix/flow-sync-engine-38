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
    const FB_APP_ID = Deno.env.get("FACEBOOK_APP_ID");
    const FB_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET");

    if (!FB_APP_ID || !FB_APP_SECRET) {
      return new Response(JSON.stringify({ error: "Facebook App não configurado. Configure FACEBOOK_APP_ID e FACEBOOK_APP_SECRET." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { action, redirect_uri, code, workspace_id } = body;

    if (action === "get_auth_url") {
      // Generate Facebook Login URL for Instagram Business
      const scopes = [
        "instagram_basic",
        "instagram_content_publish",
        "instagram_manage_insights",
        "pages_show_list",
        "pages_read_engagement",
        "business_management",
      ].join(",");

      const state = JSON.stringify({ user_id: user.id, workspace_id: workspace_id || "00000000-0000-0000-0000-000000000000" });
      const encodedState = encodeURIComponent(btoa(state));

      const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${scopes}&response_type=code&state=${encodedState}`;

      return new Response(JSON.stringify({ auth_url: authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "callback") {
      if (!code) throw new Error("Authorization code é obrigatório");

      // Step 1: Exchange code for short-lived token
      const tokenRes = await fetch(`${GRAPH_API}/oauth/access_token?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${FB_APP_SECRET}&code=${code}`);
      const tokenData = await tokenRes.json();
      if (tokenData.error) throw new Error(`Erro ao trocar código: ${tokenData.error.message}`);

      const shortToken = tokenData.access_token;

      // Step 2: Exchange for long-lived token
      const longTokenRes = await fetch(`${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${shortToken}`);
      const longTokenData = await longTokenRes.json();
      if (longTokenData.error) throw new Error(`Erro ao obter token longo: ${longTokenData.error.message}`);

      const longLivedToken = longTokenData.access_token;
      const expiresIn = longTokenData.expires_in || 5184000; // ~60 days

      // Step 3: Get Facebook Pages
      const pagesRes = await fetch(`${GRAPH_API}/me/accounts?access_token=${longLivedToken}`);
      const pagesData = await pagesRes.json();
      if (!pagesData.data?.length) throw new Error("Nenhuma Página do Facebook encontrada. Conecte uma página com perfil Instagram Business.");

      // Step 4: Get Instagram Business Account from page
      let igUserId: string | null = null;
      let igUsername: string | null = null;
      let pageAccessToken: string | null = null;
      let pageName: string | null = null;

      for (const page of pagesData.data) {
        const igRes = await fetch(`${GRAPH_API}/${page.id}?fields=instagram_business_account{id,username,profile_picture_url}&access_token=${page.access_token}`);
        const igData = await igRes.json();
        if (igData.instagram_business_account) {
          igUserId = igData.instagram_business_account.id;
          igUsername = igData.instagram_business_account.username;
          pageAccessToken = page.access_token;
          pageName = page.name;
          break;
        }
      }

      if (!igUserId || !pageAccessToken) {
        throw new Error("Nenhuma conta Instagram Business encontrada nas páginas do Facebook. Certifique-se de ter um perfil Business ou Creator vinculado.");
      }

      // Step 5: Get profile picture
      const profileRes = await fetch(`${GRAPH_API}/${igUserId}?fields=profile_picture_url,followers_count,media_count&access_token=${pageAccessToken}`);
      const profileData = await profileRes.json();

      const wsId = workspace_id || "00000000-0000-0000-0000-000000000000";

      // Step 6: Upsert connection
      const { error: upsertErr } = await supabase
        .from("instagram_connections")
        .upsert({
          workspace_id: wsId,
          ig_user_id: igUserId,
          username: igUsername,
          access_token: pageAccessToken,
          token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          profile_picture_url: profileData.profile_picture_url || null,
          followers_count: profileData.followers_count || 0,
          media_count: profileData.media_count || 0,
          is_active: true,
          connected_at: new Date().toISOString(),
          page_name: pageName,
        } as any, { onConflict: "workspace_id" });

      if (upsertErr) throw new Error(`Erro ao salvar conexão: ${upsertErr.message}`);

      return new Response(JSON.stringify({
        success: true,
        username: igUsername,
        ig_user_id: igUserId,
        profile_picture_url: profileData.profile_picture_url,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      const wsId = workspace_id || "00000000-0000-0000-0000-000000000000";
      await supabase
        .from("instagram_connections")
        .update({ is_active: false, access_token: null } as any)
        .eq("workspace_id", wsId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Action desconhecida: ${action}`);
  } catch (error) {
    console.error("Instagram OAuth error:", error);
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
