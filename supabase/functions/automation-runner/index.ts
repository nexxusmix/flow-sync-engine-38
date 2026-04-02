import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://squad-hub-projeto.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-cron',
};

interface AutomationRule {
  id: string;
  key: string;
  name: string;
  is_enabled: boolean;
  config_json: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth: either valid JWT or cron secret header
    const cronSecret = Deno.env.get('CRON_SECRET');
    const cronHeader = req.headers.get('X-Supabase-Cron');
    const authHeader = req.headers.get('Authorization');

    let isAuthorized = false;

    // Check cron secret
    if (cronSecret && cronHeader === cronSecret) {
      isAuthorized = true;
    }

    // Check JWT if not authorized via cron
    if (!isAuthorized) {
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Não autorizado' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Token inválido' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      isAuthorized = true;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[automation-runner] Starting automation check...');

    // Fetch enabled rules
    const { data: rules, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('is_enabled', true);

    if (rulesError) throw rulesError;

    const suggestionsToCreate: Array<{
      rule_key: string;
      entity_type: string;
      entity_id: string;
      title: string;
      message: string;
      suggestion_json: Record<string, unknown>;
    }> = [];

    for (const rule of (rules || []) as AutomationRule[]) {
      console.log(`[automation-runner] Processing rule: ${rule.key}`);

      switch (rule.key) {
        case 'marketing.content.stalled':
          await processContentStalled(supabase, rule, suggestionsToCreate);
          break;
        case 'marketing.content.review_stuck':
          await processReviewStuck(supabase, rule, suggestionsToCreate);
          break;
        case 'marketing.calendar.gaps':
          await processCalendarGaps(supabase, rule, suggestionsToCreate);
          break;
        case 'marketing.content.repurpose':
          await processRepurpose(supabase, rule, suggestionsToCreate);
          break;
      }
    }

    // Insert new suggestions (avoiding duplicates)
    if (suggestionsToCreate.length > 0) {
      for (const suggestion of suggestionsToCreate) {
        // Check if similar suggestion already exists and is pending
        const { data: existing } = await supabase
          .from('automation_suggestions')
          .select('id')
          .eq('rule_key', suggestion.rule_key)
          .eq('entity_id', suggestion.entity_id)
          .eq('status', 'pending')
          .single();

        if (!existing) {
          await supabase.from('automation_suggestions').insert(suggestion);
          console.log(`[automation-runner] Created suggestion: ${suggestion.title}`);
        }
      }
    }

    console.log(`[automation-runner] Completed. Created ${suggestionsToCreate.length} suggestions.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestions_created: suggestionsToCreate.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[automation-runner] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Rule B: Content Stalled
async function processContentStalled(
  supabase: ReturnType<typeof createClient>,
  rule: AutomationRule,
  suggestions: Array<Record<string, unknown>>
) {
  const config = rule.config_json;
  const daysThreshold = (config.days_threshold as number) || 4;
  const checkStatuses = (config.check_statuses as string[]) || ['scripting', 'recording', 'editing'];

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  const { data: stalledItems } = await supabase
    .from('content_items')
    .select('id, title, status, updated_at')
    .in('status', checkStatuses)
    .lt('updated_at', thresholdDate.toISOString())
    .limit(20);

  for (const item of (stalledItems || [])) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(item.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    suggestions.push({
      rule_key: rule.key,
      entity_type: 'content_item',
      entity_id: item.id,
      title: `Conteúdo parado há ${daysSinceUpdate} dias`,
      message: `"${item.title}" está em ${item.status} sem atualizações há ${daysSinceUpdate} dias. Considere avançar ou definir próximos passos.`,
      suggestion_json: {
        actions: [
          { key: 'generate_checklist', label: 'Gerar próximos passos com IA' },
          { key: 'move_to_review', label: 'Mover para Revisão' },
          { key: 'set_due_date', label: 'Definir prazo' },
        ],
        context: { days_stalled: daysSinceUpdate, current_status: item.status }
      }
    });
  }
}

// Rule C: Review Stuck
async function processReviewStuck(
  supabase: ReturnType<typeof createClient>,
  rule: AutomationRule,
  suggestions: Array<Record<string, unknown>>
) {
  const config = rule.config_json;
  const daysThreshold = (config.days_threshold as number) || 3;
  const checkStatuses = (config.check_statuses as string[]) || ['review', 'approval'];

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  const { data: stuckItems } = await supabase
    .from('content_items')
    .select('id, title, status, updated_at')
    .in('status', checkStatuses)
    .lt('updated_at', thresholdDate.toISOString())
    .limit(20);

  for (const item of (stuckItems || [])) {
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(item.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    suggestions.push({
      rule_key: rule.key,
      entity_type: 'content_item',
      entity_id: item.id,
      title: `Revisão travada há ${daysSinceUpdate} dias`,
      message: `"${item.title}" aguarda aprovação há ${daysSinceUpdate} dias. Gere uma mensagem de follow-up.`,
      suggestion_json: {
        actions: [
          { key: 'generate_followup', label: 'Gerar mensagem de cobrança' },
          { key: 'copy_message', label: 'Copiar mensagem' },
          { key: 'add_comment', label: 'Salvar como comentário' },
        ],
        context: { days_stuck: daysSinceUpdate, current_status: item.status }
      }
    });
  }
}

// Rule D: Calendar Gaps
async function processCalendarGaps(
  supabase: ReturnType<typeof createClient>,
  rule: AutomationRule,
  suggestions: Array<Record<string, unknown>>
) {
  const config = rule.config_json;
  const minPostsPerWeek = (config.min_posts_per_week as number) || 3;
  const channels = (config.channels as string[]) || ['instagram'];

  // Check next 4 weeks
  for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() + (weekOffset * 7));
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    for (const channel of channels) {
      const { count } = await supabase
        .from('content_items')
        .select('*', { count: 'exact', head: true })
        .eq('channel', channel)
        .in('status', ['scheduled', 'published'])
        .gte('scheduled_at', weekStart.toISOString())
        .lt('scheduled_at', weekEnd.toISOString());

      const scheduledCount = count || 0;
      const gap = minPostsPerWeek - scheduledCount;

      if (gap > 0) {
        const weekLabel = weekStart.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'short' 
        });
        const weekEndLabel = weekEnd.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: 'short' 
        });

        suggestions.push({
          rule_key: rule.key,
          entity_type: 'calendar_week',
          entity_id: `${channel}-${weekStart.toISOString().split('T')[0]}`,
          title: `Faltam ${gap} posts de ${channel}`,
          message: `Semana ${weekLabel} – ${weekEndLabel}: apenas ${scheduledCount} posts agendados em ${channel}. Meta: ${minPostsPerWeek}.`,
          suggestion_json: {
            actions: [
              { key: 'generate_ideas', label: 'Gerar ideias para preencher' },
              { key: 'create_content', label: 'Criar conteúdos no pipeline' },
              { key: 'suggest_dates', label: 'Sugerir datas' },
            ],
            context: { 
              channel, 
              week_start: weekStart.toISOString(), 
              week_end: weekEnd.toISOString(),
              current_count: scheduledCount,
              target_count: minPostsPerWeek,
              gap
            }
          }
        });
      }
    }
  }
}

// Rule E: Repurpose Content
async function processRepurpose(
  supabase: ReturnType<typeof createClient>,
  rule: AutomationRule,
  suggestions: Array<Record<string, unknown>>
) {
  const config = rule.config_json;
  const minDaysPublished = (config.min_days_published as number) || 14;
  const formats = (config.formats as string[]) || ['carousel', 'reels'];

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - minDaysPublished);

  // Get published content that could be repurposed
  const { data: publishedItems } = await supabase
    .from('content_items')
    .select('id, title, format, channel, published_at')
    .eq('status', 'published')
    .lt('published_at', thresholdDate.toISOString())
    .not('format', 'is', null)
    .limit(10);

  for (const item of (publishedItems || [])) {
    // Suggest different formats for repurposing
    const repurposeFormats = formats.filter(f => f !== item.format).slice(0, 2);
    
    if (repurposeFormats.length === 0) continue;

    const daysSincePublish = Math.floor(
      (Date.now() - new Date(item.published_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    suggestions.push({
      rule_key: rule.key,
      entity_type: 'content_item',
      entity_id: item.id,
      title: `Reaproveitar "${item.title}"`,
      message: `Este conteúdo foi publicado há ${daysSincePublish} dias. Considere transformá-lo em ${repurposeFormats.join(' ou ')}.`,
      suggestion_json: {
        actions: [
          { key: 'generate_variations', label: 'Gerar variações com IA' },
          { key: 'create_derived', label: 'Criar conteúdo derivado' },
        ],
        context: { 
          original_format: item.format,
          suggested_formats: repurposeFormats,
          days_since_publish: daysSincePublish
        }
      }
    });
  }
}
