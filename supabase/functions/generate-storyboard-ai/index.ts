import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COLOR_GRADINGS = [
  "Agfa Vista 800", "Contax T2/T3", "Film Look 16mm", "Film Look 8mm",
  "Preto e Branco cinematográfico", "Color coringa filme", "Interestelar",
  "Tenet", "Ferrari (Enzo Ferrari)", "Oppenheimer", "CRT Soft VHS",
  "iPhone clean", "Original neutro",
];

const PRODUCTION_TYPES = ["motion", "motion_3d", "vfx", "video_real", "fotografia_still", "mixed_media"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sourceText, projectName, clientName, colorGrading, objective } = await req.json();

    if (!sourceText?.trim()) {
      return new Response(JSON.stringify({ error: "Texto fonte é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Você é um diretor de fotografia e storyboard artist cinematográfico de nível internacional.
Sua tarefa é analisar o texto/roteiro fornecido e gerar um storyboard detalhado com cenas.

Contexto do projeto:
- Projeto: ${projectName || 'Não informado'}
- Cliente: ${clientName || 'Não informado'}
- Color Grading Global: ${colorGrading || 'Original neutro'}
- Objetivo: ${objective || 'Não informado'}

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

    const userPrompt = `Analise o seguinte texto/roteiro e gere um storyboard completo com todas as cenas necessárias:

---
${sourceText}
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

    // Parse JSON from response (handle markdown code blocks)
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
