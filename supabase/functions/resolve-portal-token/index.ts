import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "Token is required", code: "MISSING_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Lookup portal_links by share_token
    const { data: portal, error: portalError } = await supabase
      .from("portal_links")
      .select("*")
      .eq("share_token", token)
      .single();

    if (portalError || !portal) {
      return new Response(
        JSON.stringify({ error: "Token not found", code: "NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!portal.is_active) {
      return new Response(
        JSON.stringify({ error: "Portal is inactive", code: "INACTIVE" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Portal has expired", code: "EXPIRED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. PARALLEL: Fetch all independent data at once
    const [
      projectResult,
      stagesResult,
      deliverablesResult,
      filesResult,
      tasksResult,
      timelineResult,
      changeRequestsResult,
    ] = await Promise.all([
      supabase
        .from("projects")
        .select("id, name, client_name, description, template, status, stage_current, health_score, contract_value, has_payment_block, due_date, owner_name, logo_url, banner_url")
        .eq("id", portal.project_id)
        .single(),
      supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", portal.project_id)
        .order("order_index", { ascending: true }),
      supabase
        .from("portal_deliverables")
        .select("*")
        .eq("portal_link_id", portal.id)
        .eq("visible_in_portal", true)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("project_files")
        .select("*")
        .eq("project_id", portal.project_id)
        .eq("visible_in_portal", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("id, title, status, due_date, assignee_name, priority, category")
        .eq("project_id", portal.project_id)
        .in("status", ["todo", "in_progress", "done"])
        .order("position", { ascending: true }),
      supabase
        .from("portal_timeline_events")
        .select("*")
        .eq("portal_link_id", portal.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("portal_change_requests")
        .select("*")
        .eq("portal_link_id", portal.id)
        .order("created_at", { ascending: false }),
    ]);

    const project = projectResult.data;
    const stages = stagesResult.data || [];
    const deliverables = deliverablesResult.data || [];
    const files = filesResult.data || [];
    const tasks = tasksResult.data || [];
    const timelineEvents = timelineResult.data || [];
    const changeRequests = changeRequestsResult.data || [];

    // 3. Collect IDs for dependent queries
    const deliverableIds = deliverables.map((d: any) => d.id);
    const fileIds = files.map((f: any) => f.id);

    // 4. PARALLEL: Fetch comments, approvals, versions (depend on IDs above)
    const dependentQueries: Promise<any>[] = [];

    // Comments
    if (deliverableIds.length > 0) {
      dependentQueries.push(
        supabase.from("portal_comments").select("*").in("deliverable_id", deliverableIds).order("created_at", { ascending: true })
      );
    } else {
      dependentQueries.push(Promise.resolve({ data: [] }));
    }

    if (fileIds.length > 0) {
      dependentQueries.push(
        supabase.from("portal_comments").select("*").in("project_file_id", fileIds).order("created_at", { ascending: true })
      );
    } else {
      dependentQueries.push(Promise.resolve({ data: [] }));
    }

    // Approvals
    if (deliverableIds.length > 0) {
      dependentQueries.push(
        supabase.from("portal_approvals").select("*").in("deliverable_id", deliverableIds)
      );
    } else {
      dependentQueries.push(Promise.resolve({ data: [] }));
    }

    if (fileIds.length > 0) {
      dependentQueries.push(
        supabase.from("portal_approvals").select("*").in("project_file_id", fileIds)
      );
    } else {
      dependentQueries.push(Promise.resolve({ data: [] }));
    }

    // Versions
    if (deliverableIds.length > 0) {
      dependentQueries.push(
        supabase.from("portal_deliverable_versions").select("*").in("deliverable_id", deliverableIds).order("version_number", { ascending: false })
      );
    } else {
      dependentQueries.push(Promise.resolve({ data: [] }));
    }

    const [delComments, fileComments, delApprovals, fileApprovals, versionsResult] = await Promise.all(dependentQueries);

    const comments = [...(delComments.data || []), ...(fileComments.data || [])];
    const approvals = [...(delApprovals.data || []), ...(fileApprovals.data || [])];
    const versions = versionsResult.data || [];

    // 5. Log visit (fire-and-forget)
    supabase.from("event_logs").insert({
      action: "portal_visited",
      entity_type: "portal_link",
      entity_id: portal.id,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        portal,
        project: project || null,
        stages,
        deliverables,
        files,
        comments,
        approvals,
        changeRequests,
        versions,
        tasks,
        timelineEvents,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[resolve-portal-token] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
