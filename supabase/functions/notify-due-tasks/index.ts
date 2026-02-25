import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    // Find tasks due today or tomorrow that are not done
    const { data: dueTasks, error: tasksErr } = await sb
      .from("tasks")
      .select("id, user_id, title, due_date, priority, status")
      .neq("status", "done")
      .lte("due_date", tomorrow.toISOString())
      .order("due_date", { ascending: true });

    if (tasksErr) throw tasksErr;

    // Find overdue tasks (due_date < today start)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const overdueTasks = (dueTasks || []).filter(
      (t: any) => new Date(t.due_date) < todayStart
    );
    const dueSoonTasks = (dueTasks || []).filter(
      (t: any) => new Date(t.due_date) >= todayStart
    );

    // Group by user
    const userTaskMap: Record<string, { overdue: any[]; dueSoon: any[] }> = {};

    for (const t of overdueTasks) {
      if (!userTaskMap[t.user_id]) userTaskMap[t.user_id] = { overdue: [], dueSoon: [] };
      userTaskMap[t.user_id].overdue.push(t);
    }
    for (const t of dueSoonTasks) {
      if (!userTaskMap[t.user_id]) userTaskMap[t.user_id] = { overdue: [], dueSoon: [] };
      userTaskMap[t.user_id].dueSoon.push(t);
    }

    let notificationsCreated = 0;

    for (const [userId, { overdue, dueSoon }] of Object.entries(userTaskMap)) {
      const parts: string[] = [];
      if (overdue.length > 0) {
        parts.push(`${overdue.length} tarefa(s) atrasada(s)`);
      }
      if (dueSoon.length > 0) {
        parts.push(`${dueSoon.length} tarefa(s) vencendo hoje/amanhã`);
      }

      if (parts.length === 0) continue;

      const taskNames = [...overdue, ...dueSoon]
        .slice(0, 5)
        .map((t: any) => `• ${t.title}`)
        .join("\n");

      // Check if we already sent a similar notification today
      const { data: existing } = await sb
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "task_due_reminder")
        .gte("created_at", todayStart.toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Create notification
      const { error: insertErr } = await sb.from("notifications").insert({
        user_id: userId,
        title: `⏰ ${parts.join(" e ")}`,
        message: taskNames,
        type: "task_due_reminder",
        entity_type: "task",
        read: false,
      });

      if (!insertErr) notificationsCreated++;

      // Also create action items for overdue tasks
      for (const t of overdue) {
        const { data: existingAction } = await sb
          .from("action_items")
          .select("id")
          .eq("type", "task_overdue")
          .eq("metadata->>task_id", t.id)
          .in("status", ["open", "snoozed"])
          .limit(1);

        if (!existingAction || existingAction.length === 0) {
          await sb.from("action_items").insert({
            scope: "global",
            type: "task_overdue",
            title: `Tarefa atrasada: ${t.title}`,
            description: `Venceu em ${new Date(t.due_date).toLocaleDateString("pt-BR")}`,
            due_at: t.due_date,
            priority: t.priority === "urgent" ? "P0" : "P1",
            source: "system",
            metadata: { task_id: t.id },
            created_by: userId,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        users_notified: Object.keys(userTaskMap).length,
        notifications_created: notificationsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-due-tasks error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
