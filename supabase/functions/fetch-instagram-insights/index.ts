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

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { connection_id } = await req.json();

    // Get connection
    const { data: conn, error: connErr } = await supabase
      .from("instagram_connections")
      .select("*")
      .eq("id", connection_id)
      .single();

    if (connErr || !conn) throw new Error("Conexão não encontrada");
    if (!conn.access_token) throw new Error("Token de acesso não disponível");

    const igUserId = conn.ig_user_id;
    const token = conn.access_token;
    const now = new Date().toISOString();
    const insights: Array<{
      workspace_id: string;
      connection_id: string;
      media_id: string | null;
      media_type: string;
      metric_name: string;
      metric_value: number;
      period: string;
      collected_at: string;
    }> = [];

    // ===== 1. ACCOUNT INSIGHTS =====
    const accountMetrics = [
      "follower_count",
      "impressions",
      "reach",
      "profile_views",
      "accounts_engaged",
    ];

    try {
      const accountRes = await fetch(
        `${GRAPH_API}/${igUserId}/insights?metric=${accountMetrics.join(",")}&period=day&since=${Math.floor(Date.now() / 1000) - 86400 * 7}&until=${Math.floor(Date.now() / 1000)}&access_token=${token}`
      );
      const accountData = await accountRes.json();

      if (accountData.data) {
        for (const metric of accountData.data) {
          // Get the most recent value
          const latestValue = metric.values?.[metric.values.length - 1];
          if (latestValue) {
            insights.push({
              workspace_id: "00000000-0000-0000-0000-000000000000",
              connection_id,
              media_id: null,
              media_type: "account",
              metric_name: metric.name,
              metric_value: typeof latestValue.value === "number" ? latestValue.value : 0,
              period: metric.period,
              collected_at: now,
            });
          }
        }
      }
    } catch (e) {
      console.error("Account insights error:", e);
    }

    // ===== 2. ACCOUNT DEMOGRAPHICS =====
    try {
      const demoRes = await fetch(
        `${GRAPH_API}/${igUserId}?fields=followers_count,follows_count,media_count,biography,name,username,profile_picture_url&access_token=${token}`
      );
      const demoData = await demoRes.json();

      if (demoData.followers_count !== undefined) {
        insights.push({
          workspace_id: "00000000-0000-0000-0000-000000000000",
          connection_id,
          media_id: null,
          media_type: "account",
          metric_name: "followers_count",
          metric_value: demoData.followers_count,
          period: "lifetime",
          collected_at: now,
        });
        insights.push({
          workspace_id: "00000000-0000-0000-0000-000000000000",
          connection_id,
          media_id: null,
          media_type: "account",
          metric_name: "follows_count",
          metric_value: demoData.follows_count || 0,
          period: "lifetime",
          collected_at: now,
        });
        insights.push({
          workspace_id: "00000000-0000-0000-0000-000000000000",
          connection_id,
          media_id: null,
          media_type: "account",
          metric_name: "media_count",
          metric_value: demoData.media_count || 0,
          period: "lifetime",
          collected_at: now,
        });
      }
    } catch (e) {
      console.error("Demographics error:", e);
    }

    // ===== 3. RECENT MEDIA INSIGHTS =====
    try {
      const mediaRes = await fetch(
        `${GRAPH_API}/${igUserId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,permalink&limit=25&access_token=${token}`
      );
      const mediaData = await mediaRes.json();

      if (mediaData.data) {
        for (const media of mediaData.data) {
          const mediaType = media.media_type?.toLowerCase() || "image";

          // Basic engagement from media fields
          insights.push({
            workspace_id: "00000000-0000-0000-0000-000000000000",
            connection_id,
            media_id: media.id,
            media_type: mediaType === "video" ? "reel" : mediaType === "carousel_album" ? "carousel" : "post",
            metric_name: "likes",
            metric_value: media.like_count || 0,
            period: "lifetime",
            collected_at: now,
          });
          insights.push({
            workspace_id: "00000000-0000-0000-0000-000000000000",
            connection_id,
            media_id: media.id,
            media_type: mediaType === "video" ? "reel" : mediaType === "carousel_album" ? "carousel" : "post",
            metric_name: "comments",
            metric_value: media.comments_count || 0,
            period: "lifetime",
            collected_at: now,
          });

          // Per-media insights (reach, impressions, saved, shares)
          try {
            const insightMetrics = mediaType === "VIDEO" || mediaType === "REELS"
              ? "reach,impressions,saved,shares,plays,total_interactions"
              : "reach,impressions,saved,shares,total_interactions";

            const insightRes = await fetch(
              `${GRAPH_API}/${media.id}/insights?metric=${insightMetrics}&access_token=${token}`
            );
            const insightData = await insightRes.json();

            if (insightData.data) {
              for (const m of insightData.data) {
                insights.push({
                  workspace_id: "00000000-0000-0000-0000-000000000000",
                  connection_id,
                  media_id: media.id,
                  media_type: mediaType === "video" ? "reel" : mediaType === "carousel_album" ? "carousel" : "post",
                  metric_name: m.name,
                  metric_value: typeof m.values?.[0]?.value === "number" ? m.values[0].value : 0,
                  period: "lifetime",
                  collected_at: now,
                });
              }
            }
          } catch (mediaInsightErr) {
            console.error(`Media insight error for ${media.id}:`, mediaInsightErr);
          }
        }
      }
    } catch (e) {
      console.error("Media insights error:", e);
    }

    // ===== 4. STORIES INSIGHTS =====
    try {
      const storiesRes = await fetch(
        `${GRAPH_API}/${igUserId}/stories?fields=id,media_type,timestamp&access_token=${token}`
      );
      const storiesData = await storiesRes.json();

      if (storiesData.data) {
        for (const story of storiesData.data) {
          try {
            const storyInsightRes = await fetch(
              `${GRAPH_API}/${story.id}/insights?metric=reach,impressions,replies,taps_forward,taps_back,exits&access_token=${token}`
            );
            const storyInsightData = await storyInsightRes.json();

            if (storyInsightData.data) {
              for (const m of storyInsightData.data) {
                insights.push({
                  workspace_id: "00000000-0000-0000-0000-000000000000",
                  connection_id,
                  media_id: story.id,
                  media_type: "story",
                  metric_name: m.name,
                  metric_value: typeof m.values?.[0]?.value === "number" ? m.values[0].value : 0,
                  period: "lifetime",
                  collected_at: now,
                });
              }
            }
          } catch (storyErr) {
            console.error(`Story insight error for ${story.id}:`, storyErr);
          }
        }
      }
    } catch (e) {
      console.error("Stories error:", e);
    }

    // ===== 5. SAVE TO DATABASE =====
    let savedCount = 0;
    if (insights.length > 0) {
      // Insert in batches of 50
      for (let i = 0; i < insights.length; i += 50) {
        const batch = insights.slice(i, i + 50);
        const { error: insertErr } = await supabase
          .from("instagram_insights")
          .insert(batch);

        if (insertErr) {
          console.error("Insert batch error:", insertErr);
        } else {
          savedCount += batch.length;
        }
      }

      // Update last_sync_at on connection
      await supabase
        .from("instagram_connections")
        .update({ updated_at: now })
        .eq("id", connection_id);
    }

    // ===== 6. AGGREGATE SUMMARY =====
    const summary = {
      account: {} as Record<string, number>,
      media_count: 0,
      stories_count: 0,
      total_metrics: savedCount,
    };

    for (const i of insights) {
      if (i.media_type === "account") {
        summary.account[i.metric_name] = i.metric_value;
      } else if (i.media_type === "story") {
        summary.stories_count++;
      } else {
        summary.media_count++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      saved: savedCount,
      summary,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fetch insights error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
