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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { asset_id, primary_color } = await req.json();
    if (!asset_id) {
      return new Response(JSON.stringify({ error: "asset_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the asset record
    const { data: asset, error: assetErr } = await supabase
      .from("project_assets")
      .select("*")
      .eq("id", asset_id)
      .single();
    if (assetErr || !asset) {
      return new Response(JSON.stringify({ error: "Asset not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get a signed URL for the original asset
    let imageUrl: string | null = null;
    if (asset.storage_path) {
      const { data: signed } = await supabase.storage
        .from(asset.storage_bucket || "project-files")
        .createSignedUrl(asset.storage_path, 300);
      imageUrl = signed?.signedUrl || null;
    }

    // Fallback to public thumb
    if (!imageUrl) {
      imageUrl = asset.preview_url || asset.thumb_url || null;
    }

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image URL available for this asset" }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine the primary color from the asset or the caller
    const color =
      primary_color ||
      (asset.ai_entities as any)?.color_palette?.[0] ||
      "#6366f1";

    // Helper: call Gemini image model with an instruction
    const generateVariation = async (
      instruction: string,
      srcUrl: string
    ): Promise<string | null> => {
      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: instruction },
                  {
                    type: "image_url",
                    image_url: { url: srcUrl },
                  },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        }
      );

      if (!response.ok) {
        const body = await response.text();
        console.error(`Gemini error ${response.status}: ${body}`);
        return null;
      }

      const json = await response.json();
      const b64 =
        json.choices?.[0]?.message?.images?.[0]?.image_url?.url ?? null;
      return b64; // data:image/png;base64,...
    };

    // Helper: upload base64 data URL to asset-thumbs bucket, return public URL
    const uploadVariation = async (
      dataUrl: string,
      suffix: string
    ): Promise<string | null> => {
      if (!dataUrl?.startsWith("data:image/")) return null;
      const [meta, b64] = dataUrl.split(",");
      const mimeMatch = meta.match(/data:([^;]+)/);
      const mime = mimeMatch?.[1] || "image/png";
      const ext = mime.split("/")[1] || "png";

      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const ts = Date.now();
      const path = `${asset.project_id}/color-variations/${asset_id}_${suffix}_${ts}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("asset-thumbs")
        .upload(path, bytes, { contentType: mime, upsert: true });

      if (uploadErr) {
        console.error(`Upload error for ${suffix}:`, uploadErr);
        return null;
      }

      const { data: pub } = supabase.storage
        .from("asset-thumbs")
        .getPublicUrl(path);
      return pub?.publicUrl || null;
    };

    // Generate all three variations in parallel
    const [whiteB64, blackB64, colorB64] = await Promise.all([
      generateVariation(
        "Edit this logo image: convert the entire logo to pure white monochrome. Keep the exact same shape, silhouette and proportions. Make all colored parts pure white (#FFFFFF). Make the background fully transparent or keep it transparent if it already is. Output only the image.",
        imageUrl
      ),
      generateVariation(
        "Edit this logo image: convert the entire logo to pure black monochrome. Keep the exact same shape, silhouette and proportions. Make all colored parts pure black (#000000). Make the background fully transparent or keep it transparent if it already is. Output only the image.",
        imageUrl
      ),
      generateVariation(
        `Edit this logo image: convert the entire logo to a solid monochromatic version using only the color ${color}. Keep the exact same shape, silhouette and proportions. Replace all colored parts with ${color}. Keep the background transparent. Output only the image.`,
        imageUrl
      ),
    ]);

    // Upload generated images
    const [whiteUrl, blackUrl, colorUrl] = await Promise.all([
      whiteB64 ? uploadVariation(whiteB64, "white") : Promise.resolve(null),
      blackB64 ? uploadVariation(blackB64, "black") : Promise.resolve(null),
      colorB64 ? uploadVariation(colorB64, "primary") : Promise.resolve(null),
    ]);

    // Build the color_variations map
    const colorVariations: Record<string, string> = {};
    if (whiteUrl) colorVariations.white = whiteUrl;
    if (blackUrl) colorVariations.black = blackUrl;
    if (colorUrl) colorVariations.primary = colorUrl;
    if (color) colorVariations.primary_color_hex = color;

    if (Object.keys(colorVariations).length === 0) {
      return new Response(
        JSON.stringify({
          error: "All variation generations failed. Check logs.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Merge into existing ai_entities
    const existingEntities = (asset.ai_entities as any) || {};
    const updatedEntities = {
      ...existingEntities,
      color_variations: colorVariations,
    };

    const { error: updateErr } = await supabase
      .from("project_assets")
      .update({ ai_entities: updatedEntities })
      .eq("id", asset_id);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new Response(
        JSON.stringify({ error: "Failed to save variations" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, color_variations: colorVariations }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("generate-logo-variations error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
