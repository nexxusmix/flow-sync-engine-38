import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, fileType, mimeType, existingCategories } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const categoriesList = (existingCategories || [
      "brutos", "projeto", "referencias", "entregas", "contratos", "outros"
    ]).join(", ");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um classificador de arquivos para uma produtora audiovisual. Categorias existentes: ${categoriesList}.

Regras:
- Analise o nome do arquivo e tipo MIME para determinar a melhor categoria
- Vídeos brutos/RAW → brutos
- Arquivos de projeto (PSD, AI, PRPROJ, AEP, etc) → projeto  
- Imagens de referência, moodboards, inspirações → referencias
- Arquivos finalizados, renders finais, versões aprovadas → entregas
- PDFs de contrato, propostas, termos → contratos
- Se não encaixar em nenhuma, use "outros"
- Se achar que uma nova categoria seria melhor, sugira com isNewCategory=true

Responda APENAS com JSON válido, sem markdown.`,
          },
          {
            role: "user",
            content: `Classifique: "${fileName}" (tipo: ${fileType || "desconhecido"}, MIME: ${mimeType || "desconhecido"})`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_file",
              description: "Classifica um arquivo em uma categoria",
              parameters: {
                type: "object",
                properties: {
                  suggestedFolder: {
                    type: "string",
                    description: "Slug da categoria sugerida",
                  },
                  suggestedName: {
                    type: "string",
                    description: "Nome legível da categoria sugerida",
                  },
                  confidence: {
                    type: "number",
                    description: "Confiança de 0 a 1",
                  },
                  isNewCategory: {
                    type: "boolean",
                    description: "Se sugere criar nova categoria",
                  },
                  newCategoryName: {
                    type: "string",
                    description: "Nome da nova categoria (se isNewCategory=true)",
                  },
                },
                required: ["suggestedFolder", "suggestedName", "confidence", "isNewCategory"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_file" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("classify-file error:", e);
    return new Response(
      JSON.stringify({
        suggestedFolder: "outros",
        suggestedName: "Outros",
        confidence: 0,
        isNewCategory: false,
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
