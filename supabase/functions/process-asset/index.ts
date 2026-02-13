import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { asset_id } = await req.json();
    if (!asset_id) throw new Error("asset_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Fetch asset
    const { data: asset, error: fetchErr } = await sb
      .from("project_assets")
      .select("*, projects!inner(name, client_name, template, stage_current)")
      .eq("id", asset_id)
      .single();

    if (fetchErr || !asset) throw new Error("Asset not found");

    const updates: Record<string, any> = {};

    // For links: detect provider thumb
    if (asset.source_type === "link" && asset.url) {
      const url = asset.url as string;
      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (ytMatch) {
        updates.provider = "youtube";
        updates.embed_url = `https://www.youtube.com/embed/${ytMatch[1]}`;
        updates.thumb_url = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
      const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) {
        updates.provider = "vimeo";
        updates.embed_url = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }
    }

    // For files: if image, thumb is the file itself
    if (asset.source_type === "file") {
      if (asset.asset_type === "image" && asset.storage_path) {
        const { data: urlData } = sb.storage.from("project-files").getPublicUrl(asset.storage_path);
        updates.thumb_url = urlData.publicUrl;
      }
      // For video/pdf, we can't generate thumbs server-side without ffmpeg/poppler,
      // so we set a placeholder or leave null for now
    }

    // AI enrichment using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      try {
        const project = (asset as any).projects;
        const context = `Projeto: ${project?.name || "N/A"}, Cliente: ${project?.client_name || "N/A"}, Template: ${project?.template || "N/A"}, Etapa: ${project?.stage_current || "N/A"}`;
        
        const prompt = `Analise este material de um projeto audiovisual/criativo.

Contexto do projeto: ${context}
Nome do arquivo/URL: ${asset.file_name || asset.url || "N/A"}
Tipo: ${asset.asset_type}
Categoria atual: ${asset.category}

Gere um JSON com:
- title: título curto e limpo (máx 60 chars)
- description: descrição em 1-2 linhas
- tags: array de 3-6 tags relevantes
- suggested_category: uma de [deliverable, reference, raw, contract, finance, other]

Retorne APENAS o JSON, sem markdown.`;

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "Você é um assistente que analisa materiais de projetos criativos. Responda sempre em JSON puro." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          // Try to parse JSON from response
          const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          try {
            const parsed = JSON.parse(jsonStr);
            updates.ai_title = parsed.title || null;
            updates.ai_summary = parsed.description || null;
            updates.ai_tags = parsed.tags || [];
            updates.ai_processed = true;
            updates.ai_confidence = 0.85;
            // If no title was set, use AI suggestion
            if (!asset.title || asset.title === asset.file_name?.replace(/\.[^.]+$/, "")) {
              updates.title = parsed.title || asset.title;
            }
          } catch {
            console.warn("Failed to parse AI response:", content);
          }
        }
      } catch (aiErr) {
        console.warn("AI enrichment failed:", aiErr);
      }
    }

    // Update asset
    updates.status = "ready";
    const { error: updateErr } = await sb
      .from("project_assets")
      .update(updates)
      .eq("id", asset_id);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, updates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-asset error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
