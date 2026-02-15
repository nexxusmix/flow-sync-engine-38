import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessRequest {
  text?: string;
  audioBase64?: string;
  imageBase64List?: string[];
  projectTitle?: string;
  clientName?: string;
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

    const { text, audioBase64, imageBase64List, projectTitle, clientName } = await req.json() as ProcessRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let transcribedText = "";
    let imageDescriptions: string[] = [];
    
    // Process audio if provided - use Gemini for transcription
    if (audioBase64) {
      console.log("Processing audio for transcription...");
      
      const audioResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcreva o áudio a seguir em português. Retorne apenas a transcrição, sem comentários adicionais."
                },
                {
                  type: "input_audio",
                  input_audio: {
                    data: audioBase64,
                    format: "mp3"
                  }
                }
              ]
            }
          ]
        }),
      });

      if (audioResponse.ok) {
        const audioResult = await audioResponse.json();
        transcribedText = audioResult.choices?.[0]?.message?.content || "";
        console.log("Audio transcribed successfully");
      } else {
        console.error("Audio transcription failed:", await audioResponse.text());
      }
    }

    // Process images if provided - extract text and context
    if (imageBase64List && imageBase64List.length > 0) {
      console.log(`Processing ${imageBase64List.length} images...`);
      
      for (let i = 0; i < imageBase64List.length; i++) {
        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Analise esta imagem de uma conversa/print. Extraia todas as informações relevantes, pedidos do cliente, feedbacks e solicitações. Seja detalhado e objetivo."
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${imageBase64List[i]}`
                    }
                  }
                ]
              }
            ]
          }),
        });

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json();
          const description = imageResult.choices?.[0]?.message?.content || "";
          if (description) {
            imageDescriptions.push(description);
          }
        }
      }
      console.log(`Processed ${imageDescriptions.length} images successfully`);
    }

    // Combine all content
    const allContent = [
      text ? `TEXTO INFORMADO:\n${text}` : "",
      transcribedText ? `TRANSCRIÇÃO DE ÁUDIO:\n${transcribedText}` : "",
      imageDescriptions.length > 0 ? `ANÁLISE DE IMAGENS:\n${imageDescriptions.join("\n\n")}` : ""
    ].filter(Boolean).join("\n\n---\n\n");

    if (!allContent) {
      return new Response(JSON.stringify({ 
        error: "Nenhum conteúdo para processar" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate summary and extract client requests
    const summaryPrompt = `Você é um assistente de gestão de projetos de produção audiovisual.

CONTEXTO:
- Projeto: ${projectTitle || "Projeto atual"}
- Cliente: ${clientName || "Cliente"}

CONTEÚDO PARA ANÁLISE:
${allContent}

TAREFA:
Analise todo o conteúdo acima e gere um resumo estruturado seguindo EXATAMENTE este formato JSON:

{
  "resumo": "Resumo executivo de 2-3 parágrafos explicando o contexto e principais pontos",
  "pedidos_cliente": ["Lista de cada pedido específico do cliente"],
  "alteracoes_solicitadas": ["Lista de alterações ou modificações solicitadas"],
  "informacoes_importantes": ["Informações relevantes para o projeto"],
  "proximos_passos": ["Ações sugeridas baseadas no conteúdo"]
}

Responda APENAS com o JSON, sem texto adicional.`;

    const summaryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um assistente especializado em gestão de projetos audiovisuais. Sempre responda em JSON válido." },
          { role: "user", content: summaryPrompt }
        ]
      }),
    });

    if (!summaryResponse.ok) {
      const errorText = await summaryResponse.text();
      console.error("Summary generation failed:", errorText);
      
      if (summaryResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("Failed to generate summary");
    }

    const summaryResult = await summaryResponse.json();
    const summaryContent = summaryResult.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response
    let parsedSummary;
    try {
      // Remove markdown code blocks if present
      const cleanJson = summaryContent.replace(/```json\n?|\n?```/g, '').trim();
      parsedSummary = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse summary JSON:", e);
      parsedSummary = {
        resumo: summaryContent,
        pedidos_cliente: [],
        alteracoes_solicitadas: [],
        informacoes_importantes: [],
        proximos_passos: []
      };
    }

    return new Response(JSON.stringify({
      success: true,
      originalContent: allContent,
      transcription: transcribedText,
      imageAnalysis: imageDescriptions,
      summary: parsedSummary.resumo,
      clientRequests: [
        ...(parsedSummary.pedidos_cliente || []),
        ...(parsedSummary.alteracoes_solicitadas || [])
      ],
      importantInfo: parsedSummary.informacoes_importantes || [],
      nextSteps: parsedSummary.proximos_passos || []
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing update:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro ao processar atualização" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
