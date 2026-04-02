/**
 * Vercel Serverless Function — Instagram Manual Connect
 * Scrapes public profile data and saves connection + config to Supabase.
 * Uses Supabase service role to bypass RLS.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://gfyeuhfapscxfvjnrssn.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function scrapeProfile(username: string): Promise<any> {
  // Use the existing edge function to scrape
  const res = await fetch(`${SUPABASE_URL}/functions/v1/scrape-instagram-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error(`Scrape failed: ${res.status}`);
  return res.json();
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const { username, workspace_id } = await req.json();
    if (!username) return new Response(JSON.stringify({ error: "username required" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });

    const wid = workspace_id || "00000000-0000-0000-0000-000000000001";
    const cleanUsername = username.replace(/^@/, "").trim();

    // 1. Scrape profile data
    let profileData: any = null;
    try {
      const scrapeResult = await scrapeProfile(cleanUsername);
      if (scrapeResult.success) profileData = scrapeResult.data;
    } catch (e) {
      console.warn("Scrape failed, continuing with manual data:", e);
    }

    // 2. Use service role key if available, otherwise use anon key
    const authKey = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY!,
      "Authorization": `Bearer ${authKey}`,
      "Prefer": "return=representation,resolution=merge-duplicates",
    };

    // 3. Upsert instagram_connections
    const connRes = await fetch(`${SUPABASE_URL}/rest/v1/instagram_connections`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ig_username: cleanUsername,
        ig_user_id: profileData?.ig_user_id || null,
        access_token: "manual",
        workspace_id: wid,
      }),
    });

    let connection = null;
    if (connRes.ok) {
      const arr = await connRes.json();
      connection = Array.isArray(arr) ? arr[0] : arr;
    } else {
      const errText = await connRes.text();
      console.warn("Connection upsert response:", connRes.status, errText);
    }

    // 4. Upsert instagram_profile_config
    const configRes = await fetch(`${SUPABASE_URL}/rest/v1/instagram_profile_config`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        workspace_id: wid,
        profile_handle: cleanUsername,
        profile_name: profileData?.full_name || cleanUsername,
        profile_bio: profileData?.bio || "",
        profile_picture_url: profileData?.profile_pic || null,
        followers_count: profileData?.followers || 0,
        following_count: profileData?.following || 0,
        posts_count: profileData?.posts_count || 0,
      }),
    });

    let config = null;
    if (configRes.ok) {
      const arr = await configRes.json();
      config = Array.isArray(arr) ? arr[0] : arr;
    }

    return new Response(JSON.stringify({
      success: true,
      connection,
      config,
      profile: profileData,
      message: `@${cleanUsername} conectado com sucesso!`,
    }), { headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}

export const config = { runtime: "edge" };
