import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractRequest {
  text?: string;
  documentBase64?: string;
  imageBase64List?: string[];
  documentType?: 'contract' | 'proposal' | 'general';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, documentBase64, imageBase64List, documentType = 'general' } = await req.json() as ExtractRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let extractedContent = "";
    
    // Process PDF/document if provided (as base64)
    if (documentBase64) {
      console.log("Processing document...");
      
      const docResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  text: `Analise este documento (${documentType === 'contract' ? 'contrato' : documentType === 'proposal' ? 'proposta comercial' : 'documento'}) e extraia TODAS as informações relevantes para criar um projeto audiovisual. Extraia: nome do projeto, nome do cliente, empresa, valor do contrato, data de início, data de entrega, tipo de serviço (filme institucional, vídeo produto, aftermovie, pacote de reels, fotos, tour 360, motion/vinheta), escopo detalhado, entregas previstas. Seja detalhado.`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${documentBase64}`
                  }
                }
              ]
            }
          ]
        }),
      });

      if (docResponse.ok) {
        const docResult = await docResponse.json();
        extractedContent += docResult.choices?.[0]?.message?.content || "";
        console.log("Document processed successfully");
      } else {
        console.error("Document processing failed:", await docResponse.text());
      }
    }

    // Process images if provided
    if (imageBase64List && imageBase64List.length > 0) {
      console.log(`Processing ${imageBase64List.length} images...`);
      
      for (const imageBase64 of imageBase64List) {
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
                    text: `Analise esta imagem de um documento (${documentType === 'contract' ? 'contrato' : documentType === 'proposal' ? 'proposta comercial' : 'documento'}) e extraia TODAS as informações relevantes para criar um projeto audiovisual. Extraia: nome do projeto, nome do cliente, empresa, valor do contrato, data de início, data de entrega, tipo de serviço, escopo, entregas. Seja detalhado e extraia todos os textos visíveis.`
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${imageBase64}`
                    }
                  }
                ]
              }
            ]
          }),
        });

        if (imageResponse.ok) {
          const imageResult = await imageResponse.json();
          const content = imageResult.choices?.[0]?.message?.content || "";
          if (content) {
            extractedContent += "\n\n" + content;
          }
        }
      }
      console.log("Images processed successfully");
    }

    // Add text content
    if (text) {
      extractedContent += "\n\nTEXTO ADICIONAL:\n" + text;
    }

    if (!extractedContent) {
      return new Response(JSON.stringify({ 
        error: "Nenhum conteúdo para processar" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Now extract structured data using tool calling
    const structuredPrompt = `Baseado nas informações extraídas abaixo, estruture os dados do projeto audiovisual.

CONTEÚDO EXTRAÍDO:
${extractedContent}

TEMPLATES DISPONÍVEIS (escolha o mais adequado):
- filme_institucional: Filme Institucional
- filme_produto: Vídeo Produto  
- aftermovie: Aftermovie/Cobertura de Evento
- reels_pacote: Pacote de Reels
- foto_pacote: Pacote de Fotos
- tour_360: Tour Virtual 360
- motion_vinheta: Motion Graphics/Vinheta

Extraia e retorne os dados estruturados.`;

    const structuredResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um assistente especializado em gestão de projetos audiovisuais. Extraia dados estruturados de documentos." },
          { role: "user", content: structuredPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_project",
              description: "Cria um projeto com os dados extraídos do documento",
              parameters: {
                type: "object",
                properties: {
                  title: { 
                    type: "string", 
                    description: "Nome do projeto (ex: Campanha Institucional 2025)" 
                  },
                  clientName: { 
                    type: "string", 
                    description: "Nome do contato/responsável do cliente" 
                  },
                  clientCompany: { 
                    type: "string", 
                    description: "Nome da empresa cliente" 
                  },
                  clientEmail: { 
                    type: "string", 
                    description: "Email do cliente (se disponível)" 
                  },
                  template: { 
                    type: "string", 
                    enum: ["filme_institucional", "filme_produto", "aftermovie", "reels_pacote", "foto_pacote", "tour_360", "motion_vinheta"],
                    description: "Tipo de template mais adequado ao projeto" 
                  },
                  contractValue: { 
                    type: "number", 
                    description: "Valor do contrato em reais (apenas número, sem R$)" 
                  },
                  startDate: { 
                    type: "string", 
                    description: "Data de início no formato YYYY-MM-DD" 
                  },
                  deliveryDate: { 
                    type: "string", 
                    description: "Data de entrega estimada no formato YYYY-MM-DD" 
                  },
                  scope: { 
                    type: "string", 
                    description: "Descrição detalhada do escopo do projeto" 
                  },
                  deliverables: { 
                    type: "array",
                    items: { type: "string" },
                    description: "Lista de entregas previstas" 
                  },
                  paymentTerms: { 
                    type: "string", 
                    description: "Condições de pagamento (se disponível)" 
                  },
                  additionalNotes: { 
                    type: "string", 
                    description: "Observações adicionais relevantes" 
                  }
                },
                required: ["title", "template"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_project" } }
      }),
    });

    if (!structuredResponse.ok) {
      const errorText = await structuredResponse.text();
      console.error("Structured extraction failed:", errorText);
      
      if (structuredResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("Failed to extract structured data");
    }

    const structuredResult = await structuredResponse.json();
    const toolCall = structuredResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "create_project") {
      throw new Error("AI did not return structured project data");
    }

    const projectData = JSON.parse(toolCall.function.arguments);

    console.log("Project data extracted:", projectData);

    return new Response(JSON.stringify({
      success: true,
      extractedContent,
      projectData: {
        title: projectData.title || "",
        clientName: projectData.clientName || "",
        clientCompany: projectData.clientCompany || "",
        clientEmail: projectData.clientEmail || "",
        template: projectData.template || "filme_institucional",
        contractValue: projectData.contractValue || 0,
        startDate: projectData.startDate || new Date().toISOString().split('T')[0],
        deliveryDate: projectData.deliveryDate || "",
        scope: projectData.scope || "",
        deliverables: projectData.deliverables || [],
        paymentTerms: projectData.paymentTerms || "",
        additionalNotes: projectData.additionalNotes || ""
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error extracting project:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro ao processar documento" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
