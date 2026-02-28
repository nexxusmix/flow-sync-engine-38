import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!META_APP_ID) throw new Error("META_APP_ID not configured");
    if (!META_APP_SECRET) throw new Error("META_APP_SECRET not configured");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { code, redirect_uri } = await req.json();
    if (!code || !redirect_uri) throw new Error("Missing code or redirect_uri");

    // 1. Exchange code for short-lived token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error);
      throw new Error(`Meta token error: ${tokenData.error.message}`);
    }

    const shortToken = tokenData.access_token;

    // 2. Exchange for long-lived token (60 days)
    const longUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`;
    const longRes = await fetch(longUrl);
    const longData = await longRes.json();

    if (longData.error) {
      console.error("Long-lived token error:", longData.error);
      throw new Error(`Long-lived token error: ${longData.error.message}`);
    }

    const longToken = longData.access_token;
    const expiresIn = longData.expires_in || 5184000; // default 60 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 3. Get pages
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${longToken}`);
    const pagesData = await pagesRes.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("Nenhuma página do Facebook encontrada. Verifique as permissões.");
    }

    // 4. Get Instagram Business Account for each page
    let igAccount = null;
    let pageInfo = null;

    for (const page of pagesData.data) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username,profile_picture_url,followers_count,media_count}&access_token=${page.access_token}`
      );
      const igData = await igRes.json();

      if (igData.instagram_business_account) {
        igAccount = igData.instagram_business_account;
        pageInfo = { id: page.id, name: page.name, access_token: page.access_token };
        break;
      }
    }

    if (!igAccount) {
      throw new Error("Nenhuma conta Instagram Business/Creator encontrada vinculada às suas páginas.");
    }

    // 5. Upsert connection
    const { data: conn, error: connErr } = await supabase
      .from("instagram_connections")
      .upsert({
        workspace_id: "00000000-0000-0000-0000-000000000000",
        ig_username: igAccount.username,
        ig_user_id: igAccount.id,
        access_token: pageInfo.access_token, // Page token (doesn't expire if long-lived)
        token_expires_at: expiresAt,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "workspace_id,ig_username",
      })
      .select()
      .single();

    if (connErr) {
      console.error("Upsert error:", connErr);
      throw new Error(`Erro ao salvar conexão: ${connErr.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      connection: {
        id: conn.id,
        username: igAccount.username,
        ig_user_id: igAccount.id,
        profile_picture: igAccount.profile_picture_url,
        followers: igAccount.followers_count,
        media_count: igAccount.media_count,
        page_name: pageInfo.name,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Meta OAuth error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
