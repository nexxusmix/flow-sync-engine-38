import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OG_BUCKET = "marketing-assets";
const OG_FOLDER = "og";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");
    const projectName = url.searchParams.get("project_name") || "Projeto";
    const clientLogoUrl = url.searchParams.get("client_logo_url") || "";

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if cached image already exists
    const ogPath = `${OG_FOLDER}/${projectId}.png`;
    const { data: existingFile } = await supabase.storage
      .from(OG_BUCKET)
      .list(OG_FOLDER, { search: `${projectId}.png` });

    if (existingFile && existingFile.length > 0) {
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${OG_BUCKET}/${ogPath}`;
      return new Response(JSON.stringify({ url: publicUrl, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-og-image] Generating for project ${projectId}: "${projectName}"`);

    const logoContext = clientLogoUrl
      ? `The left logo should be based on the client brand found at: ${clientLogoUrl} — render it in dark/black tones.`
      : `The left side should show a generic client placeholder icon in dark/black.`;

    const prompt = `Create a professional 1200x630 Open Graph preview image with:
- Solid blue background color #00A3D3
- Two logos/icons side by side, centered vertically in the upper portion with generous margins and breathing room
- Left: ${logoContext}
- A white "+" symbol between the two logos, bold and visible
- Right: The text "SQUAD" in a bold, clean font rendered in dark/black
- Below the logos area, centered white text reading: "${projectName.substring(0, 40)}"
- Use a clean sans-serif font for all text
- Minimalist, professional design with lots of breathing room
- NO borders, NO extra decorations, NO watermarks
- The entire composition should feel balanced and premium`;

    // Use Lovable AI Gateway directly for image generation
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[generate-og-image] AI gateway error ${response.status}: ${errText.substring(0, 300)}`);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const choice = result.choices?.[0];
    let imageBase64: string | null = null;

    // Try multiple response formats
    if (choice?.message?.content && Array.isArray(choice.message.content)) {
      for (const part of choice.message.content) {
        if (part.type === "image" && part.image?.base64) {
          imageBase64 = part.image.base64;
          break;
        }
        if (part.inline_data?.data) {
          imageBase64 = part.inline_data.data;
          break;
        }
      }
    }

    // Check images array (Lovable gateway format: images[].image_url.url as data URI)
    if (!imageBase64 && choice?.message?.images) {
      const img = choice.message.images[0];
      if (img?.image_url?.url) {
        // Extract base64 from data URI: "data:image/png;base64,..."
        const dataUri = img.image_url.url;
        const base64Match = dataUri.match(/^data:image\/[^;]+;base64,(.+)$/);
        if (base64Match) {
          imageBase64 = base64Match[1];
        }
      }
      if (!imageBase64 && img?.b64_json) imageBase64 = img.b64_json;
      if (!imageBase64 && img?.base64) imageBase64 = img.base64;
    }

    if (!imageBase64) {
      console.error("[generate-og-image] No image in response:", JSON.stringify(result).substring(0, 500));
      return new Response(JSON.stringify({ error: "AI did not return an image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode and upload
    const binaryStr = atob(imageBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { error: uploadError } = await supabase.storage
      .from(OG_BUCKET)
      .upload(ogPath, bytes.buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("[generate-og-image] Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${OG_BUCKET}/${ogPath}`;
    console.log(`[generate-og-image] ✓ Generated and cached: ${publicUrl}`);

    return new Response(JSON.stringify({ url: publicUrl, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generate-og-image] Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
