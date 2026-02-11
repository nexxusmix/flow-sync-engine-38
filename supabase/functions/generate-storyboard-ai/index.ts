import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCTION_TYPES = ["motion", "motion_3d", "vfx", "video_real", "fotografia_still", "mixed_media"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      sourceText,
      projectName,
      clientName,
      colorGrading,
      objective,
      // New context fields
      projectContext,
    } = await req.json();

    if (!sourceText?.trim() && !projectContext?.hasContext) {
      return new Response(JSON.stringify({ error: "Texto fonte ou contexto do projeto é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
${contextBlock}

INSTRUÇÕES IMPORTANTES:
1. Use TODO o contexto fornecido (escopo, contrato, roteiros, briefings, arquivos) para fundamentar cada cena
2. As cenas devem refletir o objetivo estratégico do projeto
3. Se houver roteiro existente, use como base principal
4. Se houver briefing ou escopo, alinhe a direção criativa
5. Referências visuais e de marca devem influenciar o estilo

Para cada cena, defina:
- title: Título curto da cena
- description: Descrição cinematográfica detalhada (visual, ação, composição)
- direction: Direção de arte (cenário, figurino, props)
- lens: Lente sugerida (ex: "35mm f/1.4", "85mm f/1.2", "24mm wide")
- fps: FPS recomendado (ex: "24fps", "60fps slow-motion", "120fps")
- camera_movement: Movimento de câmera (ex: "Dolly in lento", "Steadicam circular", "Estático tripé")
- lighting: Iluminação detalhada (tipo, direção, temperatura)
- mood: Clima/atmosfera da cena
- color_grading: Color grading específico da cena (use "${colorGrading || 'Original neutro'}" como padrão)
- production_type: Um de: ${PRODUCTION_TYPES.join(', ')}
- ai_prompt: Prompt detalhado em inglês para gerar a imagem em Midjourney/Runway/Pika (inclua estilo, color grading, parâmetros técnicos, --ar 16:9 --style raw --v 6)
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Aguarde." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Erro na API de IA");
    }

    const aiResult = await response.json();
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

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("generate-storyboard-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
