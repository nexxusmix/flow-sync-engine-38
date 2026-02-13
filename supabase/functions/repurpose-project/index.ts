import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { error: authErr } = await sbAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { project, deliverables } = await req.json();
    
    if (!project) {
      throw new Error("project is required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um estrategista de conteúdo especializado em transformar projetos audiovisuais concluídos em conteúdo de marketing.

OBJETIVO:
Transformar cases de sucesso em conteúdo que:
1. Demonstre expertise e autoridade
2. Mostre o processo criativo (bastidores)
3. Gere prova social
4. Eduque o público sobre produção audiovisual

FORMATOS SUGERIDOS:
- Reels de bastidores (15-30s)
- Carrosséis de antes/depois
- Posts de case study
- Stories de processo
- Vídeos longos de making of

REGRAS:
1. Gere 5 ideias de conteúdo únicas baseadas no projeto
2. Gere 2 roteiros curtos prontos para gravar (reels)
3. Foque em conteúdo que possa ser produzido com material existente
4. Retorne APENAS JSON válido`;

    const userPrompt = `Transforme este projeto em conteúdo de marketing:

PROJETO:
- Nome: ${project.name || project.title}
- Cliente: ${project.client_name || 'N/A'}
- Descrição: ${project.description || 'Projeto audiovisual'}
- Tipo: ${project.type || 'Vídeo institucional'}
${project.budget ? `- Orçamento: R$ ${project.budget}` : ''}

${deliverables ? `ENTREGAS APROVADAS:
${deliverables.map((d: any) => `- ${d.name}: ${d.description || ''}`).join('\n')}` : ''}

Retorne um JSON com a estrutura:
{
  "ideas": [
    {
      "title": "Título da ideia",
      "hook": "Hook matador",
      "pillar": "autoridade|bastidores|cases|prova_social|educacional",
      "format": "reel|carousel|post|story",
      "channel": "instagram|tiktok|youtube|linkedin",
      "description": "Breve descrição de como executar",
      "assets_needed": ["B-roll do set", "Depoimento do cliente", etc]
    }
  ],
  "scripts": [
    {
      "title": "Título do reel",
      "duration": "30s",
      "format": "reel",
      "script": "[00:00] Hook\\n[00:03] Desenvolvimento\\n[00:20] CTA",
      "caption": "Caption sugerida",
      "hashtags": "#hashtags #relevantes"
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
        tools: [
          {
            type: "function",
            function: {
              name: "repurpose_project_content",
              description: "Generate content ideas and scripts from a completed project",
              parameters: {
                type: "object",
                properties: {
                  ideas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        hook: { type: "string" },
                        pillar: { type: "string", enum: ["autoridade", "bastidores", "cases", "prova_social", "educacional"] },
                        format: { type: "string", enum: ["reel", "carousel", "post", "story", "youtube"] },
                        channel: { type: "string", enum: ["instagram", "tiktok", "youtube", "linkedin"] },
                        description: { type: "string" },
                        assets_needed: { type: "array", items: { type: "string" } }
                      },
                      required: ["title", "hook", "pillar", "format", "description"]
                    }
                  },
                  scripts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        duration: { type: "string" },
                        format: { type: "string" },
                        script: { type: "string" },
                        caption: { type: "string" },
                        hashtags: { type: "string" }
                      },
                      required: ["title", "script", "caption"]
                    }
                  }
                },
                required: ["ideas", "scripts"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "repurpose_project_content" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI Response:", JSON.stringify(data, null, 2));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try to parse content directly
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return new Response(jsonMatch[0], {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    throw new Error("Could not parse AI response");

  } catch (error) {
    console.error("repurpose-project error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
