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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { task_id } = await req.json();
    if (!task_id) {
      return new Response(JSON.stringify({ error: "task_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the completed task
    const { data: task, error: fetchErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", task_id)
      .single();

    if (fetchErr || !task) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!task.recurrence_rule) {
      return new Response(JSON.stringify({ skipped: true, reason: "No recurrence rule" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate next due date
    const baseDue = task.due_date ? new Date(task.due_date) : new Date();
    let nextDue: Date;

    switch (task.recurrence_rule) {
      case "daily":
        nextDue = new Date(baseDue);
        nextDue.setDate(nextDue.getDate() + 1);
        break;
      case "weekly":
        nextDue = new Date(baseDue);
        nextDue.setDate(nextDue.getDate() + 7);
        break;
      case "monthly":
        nextDue = new Date(baseDue);
        nextDue.setMonth(nextDue.getMonth() + 1);
        break;
      default:
        return new Response(JSON.stringify({ skipped: true, reason: "Unknown rule" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Create next occurrence
    const { data: newTask, error: insertErr } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title: task.title,
        description: task.description,
        status: "today",
        category: task.category,
        tags: task.tags || [],
        due_date: nextDue.toISOString().split("T")[0],
        priority: task.priority || "normal",
        position: 0,
        recurrence_rule: task.recurrence_rule,
        recurrence_parent_id: task.id,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, newTask }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
