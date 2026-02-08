import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      console.log("[resolve-portal-token] Missing or invalid token");
      return new Response(
        JSON.stringify({ error: "Token is required", code: "MISSING_TOKEN" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[resolve-portal-token] Resolving token: ${token.substring(0, 8)}...`);

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Lookup portal_links by share_token
    const { data: portal, error: portalError } = await supabase
      .from("portal_links")
      .select("*")
      .eq("share_token", token)
      .single();

    if (portalError || !portal) {
      console.log(`[resolve-portal-token] Token not found: ${portalError?.message || 'no data'}`);
      return new Response(
        JSON.stringify({ error: "Token not found", code: "NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check if token is active
    if (!portal.is_active) {
      console.log(`[resolve-portal-token] Token inactive: ${portal.id}`);
      return new Response(
        JSON.stringify({ error: "Portal is inactive", code: "INACTIVE" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check expiration
    if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
      console.log(`[resolve-portal-token] Token expired: ${portal.id}`);
      return new Response(
        JSON.stringify({ error: "Portal has expired", code: "EXPIRED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        id, name, client_name, description, template, status, 
        stage_current, health_score, contract_value, has_payment_block, 
        due_date, owner_name, logo_url, banner_url
      `)
      .eq("id", portal.project_id)
      .single();

    if (projectError) {
      console.log(`[resolve-portal-token] Project fetch error: ${projectError.message}`);
    }

    // 5. Fetch project stages
    const { data: stages } = await supabase
      .from("project_stages")
      .select("*")
      .eq("project_id", portal.project_id)
      .order("order_index", { ascending: true });

    // 6. Fetch portal deliverables
    const { data: deliverables } = await supabase
      .from("portal_deliverables")
      .select("*")
      .eq("portal_link_id", portal.id)
      .eq("visible_in_portal", true)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    // 7. Fetch project files visible in portal
    const { data: files } = await supabase
      .from("project_files")
      .select("*")
      .eq("project_id", portal.project_id)
      .eq("visible_in_portal", true)
      .order("created_at", { ascending: false });

    // 8. Get IDs for comments/approvals queries
    const deliverableIds = (deliverables || []).map((d: any) => d.id);
    const fileIds = (files || []).map((f: any) => f.id);

    // 9. Fetch comments
    let comments: any[] = [];
    if (deliverableIds.length > 0) {
      const { data: delComments } = await supabase
        .from("portal_comments")
        .select("*")
        .in("deliverable_id", deliverableIds)
        .order("created_at", { ascending: true });
      if (delComments) comments = [...comments, ...delComments];
    }
    if (fileIds.length > 0) {
      const { data: fileComments } = await supabase
        .from("portal_comments")
        .select("*")
        .in("project_file_id", fileIds)
        .order("created_at", { ascending: true });
      if (fileComments) comments = [...comments, ...fileComments];
    }

    // 10. Fetch approvals
    let approvals: any[] = [];
    if (deliverableIds.length > 0) {
      const { data: delApprovals } = await supabase
        .from("portal_approvals")
        .select("*")
        .in("deliverable_id", deliverableIds);
      if (delApprovals) approvals = [...approvals, ...delApprovals];
    }
    if (fileIds.length > 0) {
      const { data: fileApprovals } = await supabase
        .from("portal_approvals")
        .select("*")
        .in("project_file_id", fileIds);
      if (fileApprovals) approvals = [...approvals, ...fileApprovals];
    }

    // 11. Fetch change requests
    const { data: changeRequests } = await supabase
      .from("portal_change_requests")
      .select("*")
      .eq("portal_link_id", portal.id)
      .order("created_at", { ascending: false });

    // 12. Fetch versions
    let versions: any[] = [];
    if (deliverableIds.length > 0) {
      const { data: versionData } = await supabase
        .from("portal_deliverable_versions")
        .select("*")
        .in("deliverable_id", deliverableIds)
        .order("version_number", { ascending: false });
      if (versionData) versions = versionData;
    }

    // 13. Log visit
    await supabase.from("event_logs").insert({
      action: "portal_visited",
      entity_type: "portal_link",
      entity_id: portal.id,
    });

    console.log(`[resolve-portal-token] Success for project: ${project?.name || portal.project_id}`);

    return new Response(
      JSON.stringify({
        ok: true,
        portal,
        project: project || null,
        stages: stages || [],
        deliverables: deliverables || [],
        files: files || [],
        comments,
        approvals,
        changeRequests: changeRequests || [],
        versions,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
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
