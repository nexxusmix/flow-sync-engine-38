/**
 * portal-create-revision - Edge Function para criar comentários/revisões no portal
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { shareToken, deliverableId, type, authorName, authorEmail, content, title, description, timecode, priority = 'normal', frameTimestampMs, screenshotUrl, notes } = body;

    if (!shareToken || !deliverableId || !type || !authorName) {
      return new Response(JSON.stringify({ error: "Missing required fields", code: "VALIDATION_ERROR" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });

    // Validate portal token
    const { data: portal, error: portalError } = await supabase.from("portal_links").select("id, project_id, is_active, expires_at").eq("share_token", shareToken).single();
    if (portalError || !portal) return new Response(JSON.stringify({ error: "Invalid token", code: "INVALID_TOKEN" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!portal.is_active) return new Response(JSON.stringify({ error: "Portal inactive", code: "INACTIVE" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (portal.expires_at && new Date(portal.expires_at) < new Date()) return new Response(JSON.stringify({ error: "Portal expired", code: "EXPIRED" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Validate deliverable belongs to portal
    const { data: deliverable, error: deliverableError } = await supabase.from("portal_deliverables").select("id, portal_link_id").eq("id", deliverableId).eq("portal_link_id", portal.id).single();
    if (deliverableError || !deliverable) return new Response(JSON.stringify({ error: "Deliverable not found", code: "NOT_FOUND" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let result = null;

    if (type === 'comment') {
      const { data, error } = await supabase.from("portal_comments").insert({ deliverable_id: deliverableId, author_name: authorName, author_email: authorEmail, author_role: 'client', content: content || '', timecode, priority, frame_timestamp_ms: frameTimestampMs, screenshot_url: screenshotUrl, status: 'open' }).select().single();
      if (error) throw error;
      result = data;
    } else if (type === 'revision_request') {
      const { data, error } = await supabase.from("portal_comments").insert({ deliverable_id: deliverableId, author_name: authorName, author_email: authorEmail, author_role: 'client', content: content || '', timecode, priority, frame_timestamp_ms: frameTimestampMs, screenshot_url: screenshotUrl, status: 'revision_requested' }).select().single();
      if (error) throw error;
      await supabase.from("portal_deliverables").update({ status: 'in_review', awaiting_approval: false }).eq("id", deliverableId);
      result = data;
    } else if (type === 'change_request') {
      if (!title) return new Response(JSON.stringify({ error: "Title required", code: "VALIDATION_ERROR" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data, error } = await supabase.from("portal_change_requests").insert({ portal_link_id: portal.id, deliverable_id: deliverableId, title, description: description || content, author_name: authorName, author_email: authorEmail, author_role: 'client', priority, evidence_url: screenshotUrl, status: 'open' }).select().single();
      if (error) throw error;
      await supabase.from("portal_deliverables").update({ status: 'changes_requested', awaiting_approval: false }).eq("id", deliverableId);
      result = data;
    } else if (type === 'approval') {
      const { data, error } = await supabase.from("portal_approvals").insert({ deliverable_id: deliverableId, approved_by_name: authorName, approved_by_email: authorEmail, notes }).select().single();
      if (error) throw error;
      await supabase.from("portal_deliverables").update({ status: 'approved', awaiting_approval: false }).eq("id", deliverableId);
      result = data;
    } else {
      return new Response(JSON.stringify({ error: "Invalid type", code: "VALIDATION_ERROR" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`[portal-create-revision] Successfully created ${type}`);
    return new Response(JSON.stringify({ ok: true, data: result }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("[portal-create-revision] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", code: "INTERNAL_ERROR" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
