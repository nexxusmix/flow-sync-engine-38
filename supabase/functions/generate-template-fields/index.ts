import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // LOVABLE_API_KEY handled in ai-client.ts

    const { templateId, templateName, category, fields, brandKit, existingValues } = await req.json();

    if (!templateId || !fields) {
      return new Response(
        JSON.stringify({ error: "templateId and fields are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fieldsList = fields.map((f: any) => `- ${f.key} (${f.label})`).join("\n");
    const existingContext = existingValues && Object.keys(existingValues).length > 0
      ? `\n\nValores existentes para referência:\n${Object.entries(existingValues).map(([k, v]) => `- ${k}: ${v}`).join("\n")}`
      : "";

    const brandContext = brandKit
      ? `\nBrand Kit: ${brandKit.brand_kit_name}
Cores: primária ${brandKit.primary_color}, secundária ${brandKit.secondary_color}, fundo ${brandKit.background_color}
Fontes: título ${brandKit.font_heading}, corpo ${brandKit.font_body}`
      : "";

    const systemPrompt = `Você é um copywriter profissional especializado em conteúdo para redes sociais e marketing digital.
Sua tarefa é preencher os campos de um template de post profissional com conteúdo criativo, persuasivo e alinhado à marca.

Regras:
- Escreva em português brasileiro
- Seja direto e impactante
- Use linguagem adequada ao tipo de template (${category})
- Não inclua emojis excessivos
- CTAs devem ser curtos e acionáveis
- Adapte o tom ao brand kit quando disponível
${brandContext}`;

    const userPrompt = `Template: "${templateName}" (categoria: ${category})

Preencha APENAS os seguintes campos com conteúdo profissional:
${fieldsList}
${existingContext}

Retorne APENAS um JSON com os campos preenchidos, sem markdown, sem explicação.
Exemplo: {"title": "...", "subtitle": "...", "body": "...", "cta": "..."}`;

    const aiResult = await chatCompletion({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "fill_template_fields",
            description: "Fill template fields with professional marketing copy",
            parameters: {
              type: "object",
              properties: Object.fromEntries(
                fields.map((f: any) => [f.key, { type: "string", description: f.label }])
              ),
              required: fields.map((f: any) => f.key),
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "fill_template_fields" } },
    });
    
    let generatedFields: Record<string, string> = {};
    
    // Extract from tool call
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      generatedFields = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try to parse from content
      const content = aiResult.choices?.[0]?.message?.content || '';
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          generatedFields = JSON.parse(jsonMatch[0]);
        }
      } catch {
        console.warn("Could not parse AI response as JSON");
      }
    }

    return new Response(
      JSON.stringify({ fields: generatedFields }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
