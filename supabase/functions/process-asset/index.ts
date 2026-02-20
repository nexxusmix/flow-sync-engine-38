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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const sb = createClient(supabaseUrl, serviceKey);

    // Fetch asset
    const { data: asset, error: fetchErr } = await sb
      .from("project_assets")
      .select("*, projects!inner(name, client_name, template, stage_current)")
      .eq("id", asset_id)
      .single();

    if (fetchErr || !asset) throw new Error("Asset not found");

    const updates: Record<string, any> = {};

    // ─── For links: detect provider thumb ────────────────────────────────
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

    // ─── Fetch image as base64 for vision (files only) ────────────────────
    let imageBase64: string | null = null;
    let imageMime = asset.mime_type || "image/png";

    if (asset.source_type === "file" && asset.asset_type === "image" && asset.storage_path) {
      try {
        const { data: signedData } = await sb.storage
          .from("project-files")
          .createSignedUrl(asset.storage_path, 300);
        if (signedData?.signedUrl) {
          const imgResp = await fetch(signedData.signedUrl);
          if (imgResp.ok) {
            const buffer = await imgResp.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            // Convert to base64 in chunks to avoid call stack overflow
            let binary = "";
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
              binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
            }
            imageBase64 = btoa(binary);
          }
        }
      } catch (imgErr) {
        console.warn("Failed to fetch image for vision:", imgErr);
      }
    }

    // ─── STAGE 1: AI enrichment (multimodal vision for images) ───────────
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
- element: objeto com { type: "logo" | "assinatura" | "carimbo" | "foto" | "ilustracao" | "paleta" | "outro" }
- color_palette: array de até 8 cores HEX detectadas na imagem (ex: ["#FF0000", "#00FF00"])
- brand_name: nome da marca identificado ou null

Retorne APENAS o JSON, sem markdown.`;

        const userContent: any = imageBase64
          ? [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` } },
            ]
          : prompt;

        const model = imageBase64 ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash-lite";

        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "Você é um assistente que analisa materiais de projetos criativos. Responda sempre em JSON puro." },
              { role: "user", content: userContent },
            ],
          }),
        });

        if (aiResp.ok) {
          const aiData = await aiResp.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          try {
            const parsed = JSON.parse(jsonStr);
            updates.ai_title = parsed.title || null;
            updates.ai_summary = parsed.description || null;
            updates.ai_tags = parsed.tags || [];
            updates.ai_processed = true;
            updates.ai_confidence = 0.85;

            // Build ai_entities with enriched data
            const aiEntities: Record<string, any> = {};
            if (parsed.element) aiEntities.element = parsed.element;
            if (parsed.color_palette?.length) aiEntities.color_palette = parsed.color_palette;
            if (parsed.brand_name) aiEntities.brand_name = parsed.brand_name;
            updates.ai_entities = aiEntities;

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

      // ─── STAGE 2: Background removal (cutout PNG) ─────────────────────
      if (imageBase64 && asset.asset_type === "image") {
        try {
          const cutoutResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                    {
                      type: "text",
                      text: "Remove the background from this image completely. Return only the main element (logo, icon, or subject) with a fully transparent background. Output as PNG with transparency.",
                    },
                    {
                      type: "image_url",
                      image_url: { url: `data:${imageMime};base64,${imageBase64}` },
                    },
                  ],
                },
              ],
            }),
          });

          if (cutoutResp.ok) {
            const cutoutData = await cutoutResp.json();
            // Try multiple response formats
            const msgContent = cutoutData.choices?.[0]?.message?.content;
            let cutoutB64: string | null = null;

            if (Array.isArray(msgContent)) {
              for (const part of msgContent) {
                if (part.type === "image_url" && part.image_url?.url) {
                  cutoutB64 = part.image_url.url;
                  break;
                }
              }
            } else if (cutoutData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
              cutoutB64 = cutoutData.choices[0].message.images[0].image_url.url;
            }

            if (cutoutB64) {
              const base64Data = cutoutB64.replace(/^data:image\/\w+;base64,/, "");
              const binaryStr = atob(base64Data);
              const binaryArr = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) {
                binaryArr[i] = binaryStr.charCodeAt(i);
              }

              const { data: uploadData } = await sb.storage
                .from("asset-thumbs")
                .upload(`${asset_id}_cutout.png`, binaryArr.buffer, {
                  contentType: "image/png",
                  upsert: true,
                });

              if (uploadData) {
                const { data: pubUrl } = sb.storage.from("asset-thumbs").getPublicUrl(`${asset_id}_cutout.png`);
                updates.preview_url = pubUrl.publicUrl;
                console.log("Cutout uploaded:", pubUrl.publicUrl);
              }
            }
          }
        } catch (cutoutErr) {
          console.warn("Cutout generation failed:", cutoutErr);
        }

        // ─── STAGE 3: Brand pattern generation ──────────────────────────
        const elementType = updates.ai_entities?.element?.type || (asset.ai_entities as any)?.element?.type;
        const isBrandAsset = ["logo", "assinatura", "carimbo", "ilustracao"].includes(elementType)
          || ["brand", "identity", "logo", "deliverable"].includes(asset.category);

        if (isBrandAsset && updates.preview_url) {
          try {
            // Use the cutout base64 if we have preview_url, else use original
            const sourceB64 = imageBase64;
            const sourceMime = imageMime;

            const patternResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                      {
                        type: "text",
                        text: "Create a seamless tile brand pattern using this logo/element repeated multiple times in a grid layout over a dark background. Professional branding style, modern and elegant. The logo should be small and repeated uniformly across the entire image.",
                      },
                      {
                        type: "image_url",
                        image_url: { url: `data:${sourceMime};base64,${sourceB64}` },
                      },
                    ],
                  },
                ],
              }),
            });

            if (patternResp.ok) {
              const patternData = await patternResp.json();
              const msgContent = patternData.choices?.[0]?.message?.content;
              let patternB64: string | null = null;

              if (Array.isArray(msgContent)) {
                for (const part of msgContent) {
                  if (part.type === "image_url" && part.image_url?.url) {
                    patternB64 = part.image_url.url;
                    break;
                  }
                }
              } else if (patternData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
                patternB64 = patternData.choices[0].message.images[0].image_url.url;
              }

              if (patternB64) {
                const base64Data = patternB64.replace(/^data:image\/\w+;base64,/, "");
                const binaryStr = atob(base64Data);
                const binaryArr = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                  binaryArr[i] = binaryStr.charCodeAt(i);
                }

                const { data: patternUpload } = await sb.storage
                  .from("asset-thumbs")
                  .upload(`${asset_id}_pattern.png`, binaryArr.buffer, {
                    contentType: "image/png",
                    upsert: true,
                  });

                if (patternUpload) {
                  const { data: patternUrl } = sb.storage.from("asset-thumbs").getPublicUrl(`${asset_id}_pattern.png`);
                  updates.og_image_url = patternUrl.publicUrl;
                  console.log("Pattern uploaded:", patternUrl.publicUrl);
                }
              }
            }
          } catch (patternErr) {
            console.warn("Pattern generation failed:", patternErr);
          }
        }
      }

      // For images: ensure thumb_url is set from storage
      if (asset.source_type === "file" && asset.asset_type === "image" && asset.storage_path && !asset.thumb_url) {
        const { data: urlData } = sb.storage.from("project-files").getPublicUrl(asset.storage_path);
        updates.thumb_url = urlData.publicUrl;
      }
    }

    // ─── Final status update ───────────────────────────────────────────────
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
