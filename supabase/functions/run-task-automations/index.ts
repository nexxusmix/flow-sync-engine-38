/**
 * Edge function: run-task-automations
 * Called by DB trigger (via pg_net) when tasks are created or status changes.
 * Evaluates user's task_automation_rules and applies matching actions.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  trigger_type: string;
  condition_json: Record<string, any>;
  action_json: Record<string, any>;
  enabled: boolean;
}

interface TaskPayload {
  event: "INSERT" | "UPDATE";
  task_id: string;
  user_id: string;
  old_status?: string;
  new_status?: string;
  category?: string;
  priority?: string;
  tags?: string[];
  title?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const payload: TaskPayload = await req.json();
    const { event, task_id, user_id, old_status, new_status, category, priority, tags, title } = payload;

    if (!task_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing task_id or user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[run-task-automations] Event=${event} task=${task_id} status=${old_status}->${new_status}`);

    // Determine trigger type
    const triggerType = event === "INSERT" ? "on_create" : "on_status_change";

    // Fetch enabled rules for this user matching the trigger
    const { data: rules, error: rulesErr } = await supabase
      .from("task_automation_rules")
      .select("*")
      .eq("user_id", user_id)
      .eq("enabled", true)
      .eq("trigger_type", triggerType);

    if (rulesErr) {
      console.error("[run-task-automations] Error fetching rules:", rulesErr);
      throw rulesErr;
    }

    if (!rules || rules.length === 0) {
      return new Response(JSON.stringify({ applied: 0, message: "No matching rules" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let applied = 0;
    const appliedRules: string[] = [];

    for (const rule of rules as AutomationRule[]) {
      const cond = rule.condition_json || {};
      const action = rule.action_json || {};

      // Evaluate conditions
      if (!matchesCondition(cond, { event, old_status, new_status, category, priority, tags })) {
        continue;
      }

      // Execute action
      const actionType = action.type || action.action;
      const updates: Record<string, any> = {};

      switch (actionType) {
        case "move_to_status":
          if (action.target_status && action.target_status !== new_status) {
            updates.status = action.target_status;
          }
          break;
        case "set_priority":
          if (action.target_priority) {
            updates.priority = action.target_priority;
          }
          break;
        case "add_tag": {
          const tagToAdd = action.tag;
          if (tagToAdd) {
            // Fetch current tags to avoid duplicates
            const { data: taskData } = await supabase
              .from("tasks")
              .select("tags")
              .eq("id", task_id)
              .single();
            const currentTags: string[] = (taskData?.tags as string[]) || [];
            if (!currentTags.includes(tagToAdd)) {
              updates.tags = [...currentTags, tagToAdd];
            }
          }
          break;
        }
        default:
          console.log(`[run-task-automations] Unknown action type: ${actionType}`);
          continue;
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        const { error: updateErr } = await supabase
          .from("tasks")
          .update(updates)
          .eq("id", task_id);

        if (updateErr) {
          console.error(`[run-task-automations] Error applying rule ${rule.name}:`, updateErr);
          continue;
        }

        applied++;
        appliedRules.push(rule.name);
        console.log(`[run-task-automations] Applied rule "${rule.name}" → ${actionType}`);

        // Log to action_log
        await supabase.from("action_log").insert({
          user_id,
          entity_type: "task",
          entity_id: task_id,
          action_type: `automation:${actionType}`,
          after_snapshot: { rule_name: rule.name, rule_id: rule.id, updates, trigger: triggerType },
        }).catch(() => {}); // non-critical
      }
    }

    return new Response(
      JSON.stringify({ applied, rules: appliedRules }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[run-task-automations] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Checks if a task event matches the rule's conditions
 */
function matchesCondition(
  cond: Record<string, any>,
  ctx: {
    event: string;
    old_status?: string;
    new_status?: string;
    category?: string;
    priority?: string;
    tags?: string[];
  }
): boolean {
  // Check from_status condition (for on_status_change)
  if (cond.from_status && cond.from_status !== ctx.old_status) return false;
  if (cond.to_status && cond.to_status !== ctx.new_status) return false;

  // Check category filter
  if (cond.category && cond.category !== ctx.category) return false;

  // Check priority filter
  if (cond.priority && cond.priority !== ctx.priority) return false;

  // Check tag filter (any match)
  if (cond.has_tag && ctx.tags && !ctx.tags.includes(cond.has_tag)) return false;

  return true;
}
