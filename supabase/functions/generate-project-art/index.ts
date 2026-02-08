import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateArtInput {
  project_id: string;
  art_type: "banner" | "favicon" | "cover";
  style?: string;
  custom_prompt?: string;
  include_logo?: boolean;
}

const STYLE_PROMPTS: Record<string, string> = {
  texture_pattern: 'Abstract geometric texture pattern with subtle film grain, repeating shapes, mathematical precision',
  solid_gradient: 'Smooth cinematic gradient background transitioning from deep black to dark cyan, soft color blend',
  '3d_abstract': '3D abstract floating shapes with metallic and glass materials, depth of field, volumetric lighting, octane render style',
  minimal_lines: 'Minimal elegant line art with geometric patterns on dark background, thin strokes, architectural precision',
  noise_grain: 'Film grain noise texture with analog photography aesthetic, subtle color cast, 35mm film grain',
  dark_cinematic: 'Dark cinematic atmosphere with fog, volumetric light rays, moody ambiance, anamorphic lens flare',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id, art_type, style, custom_prompt, include_logo = true } = (await req.json()) as GenerateArtInput;

    if (!project_id || !art_type) {
      return new Response(
        JSON.stringify({ error: "project_id and art_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project info
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, client_name, template, logo_url")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      console.error("Project not found:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build generation prompt
    const dimensions = {
      banner: { width: 1920, height: 240, desc: "banner horizontal ultra-wide stripe (8:1 aspect ratio)" },
      favicon: { width: 512, height: 512, desc: "favicon quadrado (1:1)" },
      cover: { width: 1200, height: 630, desc: "capa para redes sociais (OG image)" },
    };

    const dim = dimensions[art_type];
    
    // Get style-specific prompt
    const stylePrompt = style && STYLE_PROMPTS[style] 
      ? STYLE_PROMPTS[style] 
      : STYLE_PROMPTS['texture_pattern'];

    const basePrompt = `
Generate a professional ${dim.desc} for a film production project.
Project Name: ${project.name}
Client: ${project.client_name || "N/A"}
Type: ${project.template || "Institutional Film"}

Visual Style: ${stylePrompt}

Brand Reference: SQUAD Film logo (cyan #00A3D3 on black #000000)

Requirements:
- Pure black background (#000000)
- Cyan accent color (#00A3D3) as highlight
- NO TEXT, NO LETTERS, NO WORDS in the image
- Minimalist and elegant
- Ultra high resolution, professional quality
- Aspect ratio: ${dim.desc}
- Seamless edge blending for header use
${include_logo && project.logo_url ? `
IMPORTANT: This art will be used as a BACKGROUND behind a logo. Keep the center relatively empty or subtle to allow logo visibility.
Reference logo available at: ${project.logo_url}
` : ""}
${custom_prompt ? `Additional instructions: ${custom_prompt}` : ""}
    `.trim();

    console.log("Generating art with prompt:", basePrompt.substring(0, 200) + "...");

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Lovable AI for image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: basePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI generation failed:", aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI generation failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in AI response:", JSON.stringify(aiData).substring(0, 500));
      return new Response(
        JSON.stringify({ error: "No image generated", response: aiData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data from data URL
    const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) {
      console.error("Invalid image data format");
      return new Response(
        JSON.stringify({ error: "Invalid image format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const base64Data = base64Match[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to storage
    const filePath = `art/${project_id}/${art_type}_${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(filePath, binaryData, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload image", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // Update project with new art URL
    const updateColumn = art_type === "banner" ? "banner_url" : art_type === "cover" ? "cover_image_url" : null;
    
    if (updateColumn) {
      const { error: updateError } = await supabase
        .from("projects")
        .update({ [updateColumn]: publicUrl })
        .eq("id", project_id);

      if (updateError) {
        console.error("Failed to update project:", updateError);
      }
    }

    console.log("Art generated successfully:", publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        art_type,
        public_url: publicUrl,
        file_path: filePath,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-project-art error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
