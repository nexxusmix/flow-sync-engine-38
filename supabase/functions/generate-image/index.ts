import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateImageRequest {
  prompt: string;
  briefId?: string;
  sceneId?: string;
  purpose: 'storyboard_frame' | 'mood_tile' | 'key_visual';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  brandKit?: {
    colors?: { hex: string; name: string }[];
    tone_of_voice?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sbAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { prompt, briefId, sceneId, purpose, aspectRatio = '16:9', brandKit } = await req.json() as GenerateImageRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build enhanced prompt with brand kit context
    let enhancedPrompt = prompt;
    
    if (brandKit?.colors?.length) {
      const colorNames = brandKit.colors.map(c => c.name).join(', ');
      enhancedPrompt += `. Color palette: ${colorNames}`;
    }
    
    // Add aspect ratio to prompt
    enhancedPrompt += `. Aspect ratio: ${aspectRatio}`;
    
    // Add quality modifiers
    enhancedPrompt += ". Ultra high resolution, cinematic lighting, professional photography, no text in image.";

    console.log("Generating image with prompt:", enhancedPrompt);

    // Try Lovable gateway first, then fallback to direct Gemini API
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    let imageData: string | undefined;

    // Attempt 1: Lovable gateway
    try {
      console.log("[generate-image] Trying Lovable gateway...");
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: enhancedPrompt }],
          modalities: ["image", "text"]
        }),
      });

      if (response.ok) {
        const data = await response.json();
        imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (imageData) console.log("[generate-image] ✓ Success via Lovable gateway");
      } else {
        const errText = await response.text();
        console.warn(`[generate-image] Lovable gateway failed (${response.status}): ${errText.substring(0, 200)}`);
      }
    } catch (e) {
      console.warn("[generate-image] Lovable gateway error:", e);
    }

    // Attempt 2: Direct Gemini API fallback
    if (!imageData && GEMINI_API_KEY) {
      try {
        console.log("[generate-image] Trying direct Gemini API...");
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: enhancedPrompt }] }],
              generationConfig: {
                responseModalities: ["TEXT", "IMAGE"],
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const parts = geminiData.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
              imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              console.log("[generate-image] ✓ Success via direct Gemini API");
              break;
            }
          }
        } else {
          const errText = await geminiRes.text();
          console.warn(`[generate-image] Gemini API failed (${geminiRes.status}): ${errText.substring(0, 200)}`);
        }
      } catch (e) {
        console.warn("[generate-image] Gemini API error:", e);
      }
    }
    
    if (!imageData) {
      throw new Error("No image generated");
    }

    // Upload to Supabase Storage
    let publicUrl = imageData; // Default to base64 if storage fails
    let storagePath = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        // Convert base64 to blob
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const fileName = `generated/${Date.now()}-${purpose}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from('marketing-assets')
          .upload(fileName, binaryData, {
            contentType: 'image/png',
            upsert: false
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('marketing-assets')
            .getPublicUrl(fileName);
          
          publicUrl = urlData.publicUrl;
          storagePath = fileName;
        }

        // Save to generated_images table
        await supabase.from('generated_images').insert([{
          brief_id: briefId || null,
          scene_id: sceneId || null,
          purpose,
          prompt: enhancedPrompt,
          storage_path: storagePath,
          public_url: publicUrl,
        }]);

      } catch (storageError) {
        console.error("Storage error:", storageError);
        // Continue with base64 URL
      }
    }

    return new Response(JSON.stringify({
      success: true,
      imageUrl: publicUrl,
      storagePath,
      prompt: enhancedPrompt
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error generating image:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
