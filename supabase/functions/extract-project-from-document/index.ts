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

// Process PDF using Gemini's native PDF support (inline_data)
async function extractPdfWithGemini(documentBase64: string, apiKey: string, documentType: string): Promise<string> {
  console.log("Processing PDF with Gemini vision...");
  
  // Gemini 2.5 Flash supports PDFs directly via inline_data
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
              text: `Analise este documento PDF (${documentType === 'contract' ? 'contrato' : documentType === 'proposal' ? 'proposta comercial' : 'documento'}) e extraia TODAS as informações relevantes para criar um projeto audiovisual.

Extraia com atenção especial:
1. DADOS DO PROJETO: nome, tipo de serviço, escopo detalhado
2. DADOS DO CLIENTE: nome, empresa, email, telefone, CNPJ/CPF
3. VALORES E PAGAMENTO: valor total, condições de pagamento, parcelas (quantas, valores, datas de vencimento, gatilhos como "na assinatura", "na entrega", etc.)
4. PRAZOS: data de início, prazo de cada etapa (se mencionado), data de entrega final
5. ENTREGAS: lista de arquivos/formatos a entregar
6. LIMITE DE REVISÕES: número de revisões incluídas
7. OBSERVAÇÕES: cláusulas especiais, restrições, requisitos técnicos

Transcreva TODO o conteúdo relevante de forma organizada e completa. Seja EXTREMAMENTE detalhado.`
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini PDF processing failed:", response.status, errorText);
    
    // If PDF format fails, try as images approach
    if (response.status === 400 && errorText.includes("Invalid")) {
      console.log("PDF format not supported, will need image conversion");
      return "";
    }
    
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "";
  console.log(`Gemini extracted ${content.length} characters from PDF`);
  return content;
}

// Fallback: Process as image (for when PDF direct processing fails)
async function extractPdfAsImage(documentBase64: string, apiKey: string, documentType: string): Promise<string> {
  console.log("Trying PDF as generic base64 content...");
  
  // Try with Pro model which has better document understanding
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        {
          role: "user",
          content: `Você é um assistente especializado em extrair informações de documentos. 

Vou te enviar o conteúdo base64 de um documento PDF. Por favor, analise-o e extraia TODAS as informações relevantes.

Este é um ${documentType === 'contract' ? 'contrato' : documentType === 'proposal' ? 'proposta comercial' : 'documento'}.

Extraia:
1. Nome do projeto/serviço
2. Dados do cliente (nome, empresa, contato)
3. Valores e pagamentos
4. Prazos e datas
5. Escopo e entregas
6. Condições especiais

Se você não conseguir processar o documento, informe claramente.

Documento (base64, primeiros 1000 caracteres para referência): ${documentBase64.substring(0, 1000)}...

IMPORTANTE: Tente inferir e extrair o máximo de informações possível do contexto disponível.`
        }
      ]
    }),
  });

  if (!response.ok) {
    console.error("Fallback extraction failed:", await response.text());
    return "";
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || "";
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
      console.log("Processing PDF document...");
      console.log(`Document base64 length: ${documentBase64.length} chars`);
      
      // Try Gemini's native PDF processing first
      try {
        extractedContent = await extractPdfWithGemini(documentBase64, LOVABLE_API_KEY, documentType);
      } catch (e) {
        console.error("Primary PDF extraction error:", e);
      }
      
      // If that failed, try fallback
      if (!extractedContent || extractedContent.length < 100) {
        console.log("Primary extraction insufficient, trying fallback...");
        try {
          const fallbackContent = await extractPdfAsImage(documentBase64, LOVABLE_API_KEY, documentType);
          if (fallbackContent && fallbackContent.length > extractedContent.length) {
            extractedContent = fallbackContent;
          }
        } catch (e) {
          console.error("Fallback extraction error:", e);
        }
      }
      
      console.log(`PDF extraction result: ${extractedContent.length} characters`);
    }

    // Process images if provided
    if (imageBase64List && imageBase64List.length > 0) {
      console.log(`Processing ${imageBase64List.length} images...`);
      
      for (let i = 0; i < imageBase64List.length; i++) {
        const imageBase64 = imageBase64List[i];
        console.log(`Processing image ${i + 1}/${imageBase64List.length}, size: ${imageBase64.length} chars`);
        
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
                    text: `Analise esta imagem de um documento (${documentType === 'contract' ? 'contrato' : documentType === 'proposal' ? 'proposta comercial' : 'documento'}) e extraia TODAS as informações de texto visíveis.

Extraia com atenção especial:
1. DADOS DO PROJETO E CLIENTE (nomes, empresas, emails, telefones)
2. VALORES E CONDIÇÕES DE PAGAMENTO (parcelas, datas, gatilhos)
3. PRAZOS E CRONOGRAMA
4. ENTREGAS PREVISTAS
5. TODO texto relevante visível

Seja extremamente detalhado e transcreva todos os textos visíveis.`
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
            extractedContent += "\n\n--- PÁGINA/IMAGEM " + (i + 1) + " ---\n" + content;
            console.log(`Image ${i + 1} extracted ${content.length} chars`);
          }
        } else {
          const errText = await imageResponse.text();
          console.error(`Image ${i + 1} processing failed:`, errText);
        }
      }
      console.log("Images processed");
    }

    // Add text content
    if (text) {
      extractedContent += "\n\nTEXTO ADICIONAL:\n" + text;
    }

    if (!extractedContent || extractedContent.trim().length < 50) {
      console.error("Insufficient content extracted:", extractedContent?.length || 0, "chars");
      
      // Provide more helpful error message
      let errorMsg = "Não foi possível extrair conteúdo do documento.";
      if (documentBase64) {
        errorMsg = "O PDF pode estar protegido, corrompido ou ser uma imagem escaneada. Tente fazer upload de imagens (fotos/screenshots) das páginas do documento.";
      } else if (!imageBase64List || imageBase64List.length === 0) {
        errorMsg = "Nenhum arquivo foi enviado. Por favor, faça upload de um PDF ou imagens do documento.";
      }
      
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Total extracted content: ${extractedContent.length} characters`);

    // Now extract structured data using tool calling
    const structuredPrompt = `Baseado nas informações extraídas abaixo, estruture os dados COMPLETOS do projeto audiovisual.

CONTEÚDO EXTRAÍDO:
${extractedContent}

TEMPLATES DISPONÍVEIS (escolha o mais adequado):
- filme_institucional: Filme Institucional (SLA padrão: 30 dias)
- filme_produto: Vídeo Produto (SLA padrão: 21 dias)
- aftermovie: Aftermovie/Cobertura de Evento (SLA padrão: 14 dias)
- reels_pacote: Pacote de Reels (SLA padrão: 7 dias)
- foto_pacote: Pacote de Fotos (SLA padrão: 5 dias)
- tour_360: Tour Virtual 360 (SLA padrão: 10 dias)
- motion_vinheta: Motion Graphics/Vinheta (SLA padrão: 14 dias)

ETAPAS POSSÍVEIS (para cronograma):
- briefing, roteiro, pre_producao, captacao, edicao, revisao, aprovacao, entrega, pos_venda

IMPORTANTE:
1. Se houver informações de pagamento em parcelas, extraia CADA parcela
2. Se houver cronograma detalhado, extraia as datas de cada etapa
3. A data de hoje é: ${new Date().toISOString().split('T')[0]}

Extraia e retorne os dados estruturados COMPLETOS.`;

    const structuredResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um assistente especializado em gestão de projetos audiovisuais. Extraia dados estruturados COMPLETOS de documentos." },
          { role: "user", content: structuredPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_project",
              description: "Cria um projeto COMPLETO com todos os dados extraídos do documento",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Nome do projeto" },
                  clientName: { type: "string", description: "Nome do contato do cliente" },
                  clientCompany: { type: "string", description: "Nome da empresa cliente" },
                  clientEmail: { type: "string", description: "Email do cliente" },
                  clientPhone: { type: "string", description: "Telefone do cliente" },
                  clientDocument: { type: "string", description: "CNPJ ou CPF do cliente" },
                  template: { 
                    type: "string", 
                    enum: ["filme_institucional", "filme_produto", "aftermovie", "reels_pacote", "foto_pacote", "tour_360", "motion_vinheta"],
                    description: "Template do projeto" 
                  },
                  contractValue: { type: "number", description: "Valor total em reais" },
                  startDate: { type: "string", description: "Data de início YYYY-MM-DD" },
                  deliveryDate: { type: "string", description: "Data de entrega YYYY-MM-DD" },
                  scope: { type: "string", description: "Descrição do escopo" },
                  deliverables: { 
                    type: "array",
                    items: { 
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        type: { type: "string", enum: ["video", "imagem", "pdf", "zip", "audio", "outro"] }
                      }
                    }
                  },
                  paymentMilestones: { 
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        percentage: { type: "number" },
                        amount: { type: "number" },
                        dueDate: { type: "string" },
                        trigger: { type: "string" }
                      }
                    }
                  },
                  stageSchedule: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        stage: { type: "string", enum: ["briefing", "roteiro", "pre_producao", "captacao", "edicao", "revisao", "aprovacao", "entrega", "pos_venda"] },
                        plannedStart: { type: "string" },
                        plannedEnd: { type: "string" },
                        durationDays: { type: "number" }
                      }
                    }
                  },
                  revisionLimit: { type: "number" },
                  paymentTerms: { type: "string" },
                  additionalNotes: { type: "string" }
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
      console.error("Structured extraction failed:", structuredResponse.status, errorText);
      
      if (structuredResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (structuredResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos para continuar." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("Failed to structure extracted data");
    }

    const structuredResult = await structuredResponse.json();
    const toolCall = structuredResult.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== "create_project") {
      console.error("No tool call in response:", JSON.stringify(structuredResult));
      throw new Error("AI did not return structured project data");
    }

    const projectData = JSON.parse(toolCall.function.arguments);
    console.log("Project data extracted successfully:", projectData.title);

    // Calculate milestone amounts if only percentages provided
    const processedMilestones = (projectData.paymentMilestones || []).map((m: any) => ({
      ...m,
      amount: m.amount || (m.percentage && projectData.contractValue ? (m.percentage / 100) * projectData.contractValue : 0)
    }));

    return new Response(JSON.stringify({
      success: true,
      extractedContent,
      projectData: {
        title: projectData.title || "",
        clientName: projectData.clientName || "",
        clientCompany: projectData.clientCompany || "",
        clientEmail: projectData.clientEmail || "",
        clientPhone: projectData.clientPhone || "",
        clientDocument: projectData.clientDocument || "",
        template: projectData.template || "filme_institucional",
        contractValue: projectData.contractValue || 0,
        startDate: projectData.startDate || new Date().toISOString().split('T')[0],
        deliveryDate: projectData.deliveryDate || "",
        scope: projectData.scope || "",
        deliverables: projectData.deliverables || [],
        paymentMilestones: processedMilestones,
        stageSchedule: projectData.stageSchedule || [],
        revisionLimit: projectData.revisionLimit || 2,
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
