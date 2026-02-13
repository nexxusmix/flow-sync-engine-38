import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const formData = await req.formData();
    const shareToken = formData.get("shareToken") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const type = formData.get("type") as string; // 'file' | 'youtube' | 'link'
    const url = formData.get("url") as string | null;
    const file = formData.get("file") as File | null;
    const clientName = formData.get("clientName") as string || "Cliente";
    const requestId = formData.get("requestId") as string | null;

    console.log(`[portal-upload] type=${type}, title="${title}", hasFile=${!!file}, requestId=${requestId}`);

    if (!shareToken || !title) {
      return new Response(JSON.stringify({ error: "shareToken and title are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Validate share token
    const { data: portal, error: portalError } = await supabase
      .from("portal_links")
      .select("id, project_id, is_active, expires_at")
      .eq("share_token", shareToken)
      .eq("is_active", true)
      .single();

    if (portalError || !portal) {
      console.error("[portal-upload] Token validation failed:", portalError);
      return new Response(JSON.stringify({ error: "Invalid or expired portal link" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (portal.expires_at && new Date(portal.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Portal link expired" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Idempotency check
    if (requestId) {
      const { data: existing } = await supabase
        .from("portal_deliverables")
        .select("id, title, file_url, youtube_url, external_url")
        .eq("portal_link_id", portal.id)
        .eq("title", title)
        .eq("uploaded_by_client", true)
        .limit(1);

      // Simple idempotency - if same title was uploaded recently (last 60s), return it
      if (existing && existing.length > 0) {
        const recent = existing[0];
        console.log(`[portal-upload] Idempotent hit: returning existing id=${recent.id}`);
        return new Response(JSON.stringify({ 
          ok: true, 
          data: recent,
          idempotent: true,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3. Handle file upload to storage
    let fileUrl: string | null = url || null;
    let fileSize: number | null = null;
    let fileType: string | null = null;

    if (type === "file" && file) {
      const ext = file.name.split(".").pop() || "bin";
      const storagePath = `portal-uploads/${portal.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      
      console.log(`[portal-upload] Uploading file: ${file.name} (${file.size} bytes) -> ${storagePath}`);
      
      const arrayBuffer = await file.arrayBuffer();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(storagePath, arrayBuffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error("[portal-upload] Storage upload failed:", uploadError);
        return new Response(JSON.stringify({ error: `Upload failed: ${uploadError.message}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from("project-files")
        .getPublicUrl(uploadData.path);

      fileUrl = publicUrlData.publicUrl;
      fileSize = file.size;
      fileType = file.type;
      console.log(`[portal-upload] File uploaded successfully: ${fileUrl}`);
    }

    // 4. Insert into portal_deliverables
    const insertData: Record<string, unknown> = {
      portal_link_id: portal.id,
      title,
      description: description || null,
      uploaded_by_client: true,
      client_upload_name: clientName,
      material_category: "reference",
      status: "pending",
      visible_in_portal: true,
      current_version: 1,
      awaiting_approval: false,
    };

    if (type === "youtube") {
      insertData.youtube_url = url;
      insertData.type = "video";
    } else if (type === "link") {
      insertData.external_url = url;
      insertData.type = "link";
    } else if (type === "file") {
      insertData.file_url = fileUrl;
      insertData.type = fileType?.startsWith("image/") ? "image" 
        : fileType?.startsWith("video/") ? "video" 
        : "document";
    }

    const { data: deliverable, error: insertError } = await supabase
      .from("portal_deliverables")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("[portal-upload] DB insert failed:", insertError);
      return new Response(JSON.stringify({ error: `Save failed: ${insertError.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[portal-upload] Material saved: id=${deliverable.id}, type=${type}`);

    return new Response(JSON.stringify({
      ok: true,
      data: {
        id: deliverable.id,
        title: deliverable.title,
        file_url: deliverable.file_url,
        youtube_url: deliverable.youtube_url,
        external_url: deliverable.external_url,
        type: deliverable.type,
        fileSize,
        fileType,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[portal-upload] Unexpected error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
