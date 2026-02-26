import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID") || "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action, user_id, code, redirect_uri } = body;

    // ACTION: oauth-url — generate Google OAuth URL
    if (action === "oauth-url") {
      const { login_hint } = body;
      const scopes = "https://www.googleapis.com/auth/calendar";
      let url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
      if (login_hint) {
        url += `&login_hint=${encodeURIComponent(login_hint)}`;
      }
      return new Response(JSON.stringify({ url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ACTION: callback — exchange code for tokens
    if (action === "callback") {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri,
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenRes.json();
      if (tokens.error) throw new Error(tokens.error_description || tokens.error);

      // Get user email from Google
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileRes.json();

      // Upsert calendar_connections
      const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();
      await supabase.from("calendar_connections").upsert({
        user_id,
        provider: "google",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        email: profile.email,
        connected_at: new Date().toISOString(),
      }, { onConflict: "user_id,provider" });

      return new Response(JSON.stringify({ success: true, email: profile.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: sync — bidirectional sync
    if (action === "sync") {
      // Get connection
      const { data: conn } = await supabase
        .from("calendar_connections")
        .select("*")
        .eq("user_id", user_id)
        .eq("provider", "google")
        .single();

      if (!conn) {
        return new Response(JSON.stringify({ error: "Not connected" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Refresh token if expired
      let accessToken = conn.access_token;
      if (new Date(conn.token_expires_at) < new Date()) {
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            refresh_token: conn.refresh_token,
            grant_type: "refresh_token",
          }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.error) throw new Error(refreshData.error_description || "Token refresh failed");
        accessToken = refreshData.access_token;
        const expiresAt = new Date(Date.now() + (refreshData.expires_in || 3600) * 1000).toISOString();
        await supabase.from("calendar_connections").update({
          access_token: accessToken,
          token_expires_at: expiresAt,
        }).eq("user_id", user_id).eq("provider", "google");
      }

      // PULL: Get Google Calendar events
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
      
      const gcalRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=250&singleEvents=true&orderBy=startTime`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const gcalData = await gcalRes.json();
      
      let pulled = 0;
      if (gcalData.items) {
        for (const item of gcalData.items) {
          if (item.status === "cancelled") continue;
          const startAt = item.start?.dateTime || (item.start?.date ? `${item.start.date}T00:00:00` : null);
          const endAt = item.end?.dateTime || (item.end?.date ? `${item.end.date}T23:59:59` : null);
          if (!startAt || !endAt) continue;

          const existing = await supabase.from("calendar_events")
            .select("id").eq("google_event_id", item.id).single();

          if (existing.data) {
            await supabase.from("calendar_events").update({
              title: item.summary || "Sem título",
              description: item.description || null,
              start_at: startAt,
              end_at: endAt,
              all_day: !!item.start?.date,
              location: item.location || null,
              meet_url: item.hangoutLink || null,
              status: item.status,
            }).eq("id", existing.data.id);
          } else {
            await supabase.from("calendar_events").insert({
              title: item.summary || "Sem título",
              description: item.description || null,
              start_at: startAt,
              end_at: endAt,
              all_day: !!item.start?.date,
              event_type: "meeting",
              google_event_id: item.id,
              source: "google",
              color: "#4285f4",
              location: item.location || null,
              meet_url: item.hangoutLink || null,
              owner_user_id: user_id,
            });
            pulled++;
          }
        }
      }

      // PUSH: Send Squad Hub events to Google Calendar
      const { data: localEvents } = await supabase
        .from("calendar_events")
        .select("*")
        .is("google_event_id", null)
        .neq("source", "google")
        .gte("start_at", timeMin)
        .lte("start_at", timeMax);

      let pushed = 0;
      if (localEvents) {
        for (const event of localEvents) {
          const gcalEvent = {
            summary: event.title,
            description: event.description || "",
            start: event.all_day
              ? { date: event.start_at.split("T")[0] }
              : { dateTime: event.start_at, timeZone: "America/Sao_Paulo" },
            end: event.all_day
              ? { date: event.end_at.split("T")[0] }
              : { dateTime: event.end_at, timeZone: "America/Sao_Paulo" },
            location: event.location || undefined,
          };

          const createRes = await fetch(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(gcalEvent),
            }
          );
          const created = await createRes.json();
          if (created.id) {
            await supabase.from("calendar_events").update({
              google_event_id: created.id,
            }).eq("id", event.id);
            pushed++;
          }
        }
      }

      return new Response(JSON.stringify({ success: true, pulled, pushed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ACTION: disconnect
    if (action === "disconnect") {
      await supabase.from("calendar_connections")
        .delete()
        .eq("user_id", user_id)
        .eq("provider", "google");
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Google Calendar Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
