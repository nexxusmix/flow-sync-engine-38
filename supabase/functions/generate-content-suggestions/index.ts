/**
 * generate-content-suggestions — Analyzes content_items to produce
 * smart automation_suggestions (calendar gaps, stale drafts, repost candidates, etc.)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_WORKSPACE = "00000000-0000-0000-0000-000000000000";

interface SuggestionInsert {
  rule_key: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  message: string | null;
  suggestion_json: Record<string, unknown>;
  workspace_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // 1. Fetch all content items
    const { data: items } = await sb
      .from("content_items")
      .select("id, title, channel, status, published_at, scheduled_at, created_at, updated_at, pillar, format")
      .eq("workspace_id", DEFAULT_WORKSPACE)
      .order("created_at", { ascending: false });

    const allItems = items || [];

    // 2. Fetch existing pending suggestions to avoid duplicates
    const { data: existingSuggestions } = await sb
      .from("automation_suggestions")
      .select("rule_key, entity_id")
      .eq("workspace_id", DEFAULT_WORKSPACE)
      .eq("status", "pending");

    const existingKeys = new Set(
      (existingSuggestions || []).map(s => `${s.rule_key}:${s.entity_id || 'global'}`)
    );

    // 3. Fetch content metrics for repost analysis
    const { data: metrics } = await sb
      .from("content_metrics")
      .select("content_item_id, views, likes, reach, shares")
      .eq("workspace_id", DEFAULT_WORKSPACE);

    const metricsMap = new Map<string, { views: number; likes: number; reach: number; shares: number }>();
    for (const m of (metrics || [])) {
      const existing = metricsMap.get(m.content_item_id);
      if (!existing || (m.views || 0) > existing.views) {
        metricsMap.set(m.content_item_id, {
          views: m.views || 0,
          likes: m.likes || 0,
          reach: m.reach || 0,
          shares: m.shares || 0,
        });
      }
    }

    const suggestions: SuggestionInsert[] = [];
    const now = new Date();

    // ── Rule 1: Stale Drafts (drafts older than 7 days) ──
    const staleDrafts = allItems.filter(i => {
      if (i.status !== 'draft' && i.status !== 'rascunho' && i.status !== 'idea') return false;
      const created = new Date(i.created_at);
      const daysDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff > 7;
    });

    for (const draft of staleDrafts.slice(0, 5)) {
      const key = `stale_draft:${draft.id}`;
      if (existingKeys.has(key)) continue;
      const days = Math.floor((now.getTime() - new Date(draft.created_at).getTime()) / (1000 * 60 * 60 * 24));
      suggestions.push({
        rule_key: "stale_draft",
        entity_type: "content_item",
        entity_id: draft.id,
        title: `Rascunho parado há ${days} dias`,
        message: `"${draft.title}" está sem atualização há ${days} dias. Considere finalizar ou arquivar.`,
        suggestion_json: { action: "finalize_or_archive", content_id: draft.id, days_stale: days },
        workspace_id: DEFAULT_WORKSPACE,
      });
    }

    // ── Rule 2: Calendar Gap (no scheduled content in the next 7 days) ──
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const scheduledNext7 = allItems.filter(i => {
      if (!i.scheduled_at) return false;
      const scheduled = new Date(i.scheduled_at);
      return scheduled >= now && scheduled <= nextWeek;
    });

    if (scheduledNext7.length === 0 && allItems.length > 0) {
      const key = "calendar_gap:global";
      if (!existingKeys.has(key)) {
        suggestions.push({
          rule_key: "calendar_gap",
          entity_type: "calendar",
          entity_id: null,
          title: "Calendário vazio nos próximos 7 dias",
          message: "Não há conteúdo agendado para a próxima semana. Planeje novos posts para manter a consistência.",
          suggestion_json: { action: "schedule_content", gap_days: 7 },
          workspace_id: DEFAULT_WORKSPACE,
        });
      }
    }

    // ── Rule 3: High-performer repost (top content by engagement) ──
    const publishedItems = allItems.filter(i => i.status === 'published' || i.status === 'publicado');
    const withMetrics = publishedItems
      .filter(i => metricsMap.has(i.id))
      .map(i => ({ ...i, metrics: metricsMap.get(i.id)! }))
      .sort((a, b) => (b.metrics.likes + b.metrics.shares) - (a.metrics.likes + a.metrics.shares));

    for (const top of withMetrics.slice(0, 3)) {
      const key = `repost_opportunity:${top.id}`;
      if (existingKeys.has(key)) continue;
      const daysSincePublish = top.published_at
        ? Math.floor((now.getTime() - new Date(top.published_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      if (daysSincePublish < 14) continue; // Only suggest repost after 2 weeks
      suggestions.push({
        rule_key: "repost_opportunity",
        entity_type: "content_item",
        entity_id: top.id,
        title: `Repostar conteúdo de alto desempenho`,
        message: `"${top.title}" teve ${top.metrics.likes} curtidas e ${top.metrics.reach} alcance. Considere repostar ou adaptar para outro canal.`,
        suggestion_json: { action: "repost", content_id: top.id, original_likes: top.metrics.likes, original_reach: top.metrics.reach },
        workspace_id: DEFAULT_WORKSPACE,
      });
    }

    // ── Rule 4: Channel diversification ──
    if (allItems.length >= 5) {
      const channelCounts = new Map<string, number>();
      for (const item of allItems) {
        const ch = item.channel || 'outro';
        channelCounts.set(ch, (channelCounts.get(ch) || 0) + 1);
      }
      if (channelCounts.size === 1) {
        const key = "channel_diversify:global";
        if (!existingKeys.has(key)) {
          const singleChannel = Array.from(channelCounts.keys())[0];
          suggestions.push({
            rule_key: "channel_diversify",
            entity_type: "strategy",
            entity_id: null,
            title: "Diversifique seus canais",
            message: `Todo seu conteúdo está em "${singleChannel}". Considere adaptar posts para outros canais como Instagram, YouTube ou LinkedIn.`,
            suggestion_json: { action: "diversify_channels", current_channel: singleChannel },
            workspace_id: DEFAULT_WORKSPACE,
          });
        }
      }
    }

    // ── Rule 5: Missing pillar coverage ──
    const pillars = new Set(allItems.map(i => i.pillar).filter(Boolean));
    if (allItems.length >= 5 && pillars.size <= 1) {
      const key = "missing_pillars:global";
      if (!existingKeys.has(key)) {
        suggestions.push({
          rule_key: "missing_pillars",
          entity_type: "strategy",
          entity_id: null,
          title: "Defina pilares de conteúdo",
          message: "Seus conteúdos não têm pilares editoriais definidos. Categorize-os para manter variedade temática.",
          suggestion_json: { action: "define_pillars" },
          workspace_id: DEFAULT_WORKSPACE,
        });
      }
    }

    // ── Rule 6: No content yet — onboarding suggestion ──
    if (allItems.length === 0) {
      const key = "onboarding:global";
      if (!existingKeys.has(key)) {
        suggestions.push({
          rule_key: "onboarding",
          entity_type: "strategy",
          entity_id: null,
          title: "Comece criando seu primeiro conteúdo",
          message: "Nenhum conteúdo encontrado. Vá ao Pipeline para criar seu primeiro post e começar a acompanhar métricas.",
          suggestion_json: { action: "create_first_content" },
          workspace_id: DEFAULT_WORKSPACE,
        });
      }
    }

    // 4. Insert new suggestions
    let inserted = 0;
    if (suggestions.length > 0) {
      const { error } = await sb.from("automation_suggestions").insert(suggestions);
      if (error) throw error;
      inserted = suggestions.length;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        analyzed: allItems.length,
        new_suggestions: inserted,
        total_rules_checked: 6,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
