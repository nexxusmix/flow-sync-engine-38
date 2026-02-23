import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chatCompletion } from "../_shared/ai-client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCTION_TYPES = ["motion", "motion_3d", "vfx", "video_real", "fotografia_still", "mixed_media"];

const SONY_FX3_PREFIX = `Cinematic frame shot on Sony FX3 camera with Sony GM 28-70mm f/2.8 lens. Shallow depth of field, natural film-like bokeh, rich color science, S-Cinetone color profile. Professional cinematography, 16:9 widescreen frame. Ultra high resolution.`;

async function generateSceneImage(aiPrompt: string, sceneIndex: number): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return null;

  const fullPrompt = `${SONY_FX3_PREFIX} ${aiPrompt}. No text in image, no watermarks.`;

  try {
    console.log(`[storyboard] Generating image for scene ${sceneIndex + 1}...`);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[storyboard] Image gen failed for scene ${sceneIndex + 1}: ${response.status} ${errText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) {
      console.warn(`[storyboard] No image returned for scene ${sceneIndex + 1}`);
      return null;
    }

    // Upload to Supabase storage
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return imageData;

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const fileName = `storyboard/${Date.now()}-scene-${sceneIndex + 1}.png`;

      const { error: uploadError } = await supabase.storage
        .from('marketing-assets')
        .upload(fileName, binaryData, { contentType: 'image/png', upsert: false });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('marketing-assets').getPublicUrl(fileName);
        console.log(`[storyboard] ✓ Image uploaded for scene ${sceneIndex + 1}`);
        return urlData.publicUrl;
      }
      console.error(`[storyboard] Upload error scene ${sceneIndex + 1}:`, uploadError);
      return imageData; // fallback to base64
    } catch (storageErr) {
      console.error(`[storyboard] Storage error:`, storageErr);
      return imageData;
    }
  } catch (err) {
    console.error(`[storyboard] Image generation error scene ${sceneIndex + 1}:`, err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      sourceText,
      projectName,
      clientName,
      colorGrading,
      objective,
      projectContext,
    } = await req.json();

    if (!sourceText?.trim() && !projectContext?.hasContext) {
      return new Response(JSON.stringify({ error: "Texto fonte ou contexto do projeto é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build rich context block
    let contextBlock = "";

    if (projectContext) {
      contextBlock += "\n\n=== CONTEXTO COMPLETO DO PROJETO ===\n";

      if (projectContext.project) {
        const p = projectContext.project;
        contextBlock += `\n[Projeto]\nNome: ${p.name}\nCliente: ${p.client_name}\nDescrição: ${p.description || 'N/A'}\nTemplate: ${p.template || 'N/A'}\nEstágio atual: ${p.stage_current || 'N/A'}\nData início: ${p.start_date || 'N/A'}\nData entrega: ${p.due_date || 'N/A'}\n`;
      }

      if (projectContext.deliverable) {
        contextBlock += `\n[Entrega / Subprojeto]\nNome: ${projectContext.deliverable.name}\nDescrição: ${projectContext.deliverable.description || 'N/A'}\nStatus: ${projectContext.deliverable.status}\n`;
      }

      if (projectContext.contract) {
        const c = projectContext.contract;
        contextBlock += `\n[Escopo do Contrato]\nNotas/Termos: ${c.notes || 'N/A'}\nCondições de pagamento: ${c.payment_terms || 'N/A'}\nResumo público: ${typeof c.public_summary === 'string' ? c.public_summary : JSON.stringify(c.public_summary) || 'N/A'}\n`;
      }

      if (projectContext.scripts?.length) {
        contextBlock += `\n[Roteiros Existentes]\n`;
        for (const s of projectContext.scripts) {
          contextBlock += `- ${s.title || 'Sem título'}: ${(s.script || s.content || '').substring(0, 2000)}\n`;
        }
      }

      if (projectContext.knowledgeArticles?.length) {
        contextBlock += `\n[Base de Conhecimento]\n`;
        for (const a of projectContext.knowledgeArticles) {
          contextBlock += `- ${a.title}: ${(a.content_md || '').substring(0, 1500)}\n`;
        }
      }

      if (projectContext.contentItems?.length) {
        contextBlock += `\n[Conteúdos Existentes]\n`;
        for (const c of projectContext.contentItems) {
          contextBlock += `- ${c.title} (${c.format || 'N/A'}): ${c.caption_short || c.hook || 'N/A'}\n`;
        }
      }

      if (projectContext.fileSummaries?.length) {
        contextBlock += `\n[Arquivos Analisados]\n`;
        for (const f of projectContext.fileSummaries) {
          contextBlock += `- ${f.name}: ${f.summary || 'Conteúdo disponível'}\n`;
        }
      }
    }

    const systemPrompt = `Você é um diretor de fotografia e storyboard artist cinematográfico de nível internacional.
Sua tarefa é analisar o texto/roteiro fornecido E TODO O CONTEXTO DO PROJETO para gerar um storyboard detalhado com cenas que sejam estrategicamente alinhadas ao objetivo do projeto.

Contexto do projeto:
- Projeto: ${projectName || 'Não informado'}
- Cliente: ${clientName || 'Não informado'}
- Color Grading Global: ${colorGrading || 'Original neutro'}
- Objetivo: ${objective || 'Não informado'}
- Câmera: Sony FX3 com lente Sony GM 28-70mm f/2.8
${contextBlock}

INSTRUÇÕES IMPORTANTES:
1. Use TODO o contexto fornecido (escopo, contrato, roteiros, briefings, arquivos) para fundamentar cada cena
2. As cenas devem refletir o objetivo estratégico do projeto
3. Se houver roteiro existente, use como base principal
4. Se houver briefing ou escopo, alinhe a direção criativa
5. Referências visuais e de marca devem influenciar o estilo
6. TODAS as cenas devem ter estética de câmera Sony FX3 com lente GM 28-70mm f/2.8

Para cada cena, defina:
- title: Título curto da cena
- description: Descrição cinematográfica detalhada (visual, ação, composição)
- direction: Direção de arte (cenário, figurino, props)
- lens: Lente sugerida (ex: "28mm f/2.8", "50mm f/2.8", "70mm f/2.8" - sempre dentro do range GM 28-70mm)
- fps: FPS recomendado (ex: "24fps", "60fps slow-motion", "120fps")
- camera_movement: Movimento de câmera (ex: "Dolly in lento", "Steadicam circular", "Estático tripé")
- lighting: Iluminação detalhada (tipo, direção, temperatura)
- mood: Clima/atmosfera da cena
- color_grading: Color grading específico da cena (use "${colorGrading || 'Original neutro'}" como padrão)
- production_type: Um de: ${PRODUCTION_TYPES.join(', ')}
- ai_prompt: Prompt detalhado em inglês para gerar a imagem. DEVE incluir "Shot on Sony FX3 with Sony GM 28-70mm f/2.8 lens, S-Cinetone color profile, shallow depth of field, cinematic bokeh". Inclua --ar 16:9 --style raw --v 6
- negative_prompt: O que evitar na geração (em inglês)

IMPORTANTE: Retorne APENAS o JSON, sem markdown.`;

    const userPrompt = `Analise o seguinte material e gere um storyboard completo:

---
${sourceText || '(Sem texto manual — use o contexto do projeto acima como base)'}
---

Retorne um JSON com a estrutura:
{
  "scenes": [
    {
      "scene_number": 1,
      "title": "...",
      "description": "...",
      "direction": "...",
      "lens": "...",
      "fps": "...",
      "camera_movement": "...",
      "lighting": "...",
      "mood": "...",
      "color_grading": "...",
      "production_type": "...",
      "ai_prompt": "...",
      "negative_prompt": "..."
    }
  ]
}`;

    const aiResult = await chatCompletion({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    const content = aiResult.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate images in parallel for all scenes
    const scenes = parsed.scenes || [];
    console.log(`[storyboard] Generating images for ${scenes.length} scenes in parallel...`);
    
    const imagePromises = scenes.map((scene: any, index: number) =>
      generateSceneImage(scene.ai_prompt || scene.description, index)
    );
    
    const imageResults = await Promise.allSettled(imagePromises);
    
    // Attach image_url to each scene
    for (let i = 0; i < scenes.length; i++) {
      const result = imageResults[i];
      if (result && result.status === 'fulfilled' && result.value) {
        scenes[i].image_url = result.value;
      }
    }

    const successCount = imageResults.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`[storyboard] ✓ Generated ${successCount}/${scenes.length} images`);

    return new Response(JSON.stringify({ scenes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-storyboard-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
