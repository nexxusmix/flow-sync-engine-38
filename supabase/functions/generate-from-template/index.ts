import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { template, variables, outputs } = await req.json();
    // outputs: ["script","captions","shotlist","design_prompt"]

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build prompt from template
    let basePrompt = template.prompt_template || "";
    for (const [key, value] of Object.entries(variables || {})) {
      basePrompt = basePrompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
    }

    const sections = template.sections || [];
    const sectionInstructions = sections
      .map((s: any) => `- **${s.label}**: ${s.ai_instruction}`)
      .join("\n");

    const outputInstructions: string[] = [];
    if (outputs.includes("script")) {
      outputInstructions.push(`"script": Objeto com campos {hook, body, cta, hashtags} baseado nas seções do template.`);
    }
    if (outputs.includes("captions")) {
      outputInstructions.push(`"captions": Array com 3 objetos [{tone: "profissional", text: "..."}, {tone: "casual", text: "..."}, {tone: "provocativo", text: "..."}] — legendas completas.`);
    }
    if (outputs.includes("shotlist")) {
      outputInstructions.push(`"shotlist": Array de cenas [{scene: 1, description: "...", camera: "close-up/wide/etc", duration: "3s", visual_note: "..."}]`);
    }
    if (outputs.includes("design_prompt")) {
      outputInstructions.push(`"design_prompt": String com prompt detalhado para gerar o design visual no Canva/Figma/Midjourney, incluindo cores, layout, tipografia e elementos visuais.`);
    }

    const systemPrompt = `Você é um especialista em marketing digital e criação de conteúdo para redes sociais.
Gere conteúdo criativo, engajador e pronto para usar.

Formato do conteúdo: ${template.format}
Categoria: ${template.category || "geral"}

Seções do template:
${sectionInstructions}

IMPORTANTE: Responda APENAS com JSON válido contendo os campos solicitados. Sem markdown, sem explicações extras.`;

    const userPrompt = `${basePrompt}

Gere os seguintes outputs em JSON:
${outputInstructions.map(o => `- ${o}`).join("\n")}

Variáveis fornecidas: ${JSON.stringify(variables)}`;

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
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";

    // Clean markdown fences if present
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { script: { hook: content, body: "", cta: "", hashtags: "" } };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-from-template error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
