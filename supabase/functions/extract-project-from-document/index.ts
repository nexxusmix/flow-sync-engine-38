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

interface PaymentMilestone {
  title: string;
  percentage: number;
  dueDate?: string;
  trigger?: string; // ex: "Na assinatura", "Na entrega", "30 dias após início"
}

interface StageSchedule {
  stage: string;
  plannedStart: string;
  plannedEnd: string;
  duration: number; // days
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
                  text: `Analise este documento (${documentType === 'contract' ? 'contrato' : documentType === 'proposal' ? 'proposta comercial' : 'documento'}) e extraia TODAS as informações relevantes para criar um projeto audiovisual.

Extraia com atenção especial:
1. DADOS DO PROJETO: nome, tipo de serviço, escopo detalhado
2. DADOS DO CLIENTE: nome, empresa, email, telefone, CNPJ/CPF
3. VALORES E PAGAMENTO: valor total, condições de pagamento, parcelas (quantas, valores, datas de vencimento, gatilhos como "na assinatura", "na entrega", etc.)
4. PRAZOS: data de início, prazo de cada etapa (se mencionado), data de entrega final
5. ENTREGAS: lista de arquivos/formatos a entregar
6. LIMITE DE REVISÕES: número de revisões incluídas
7. OBSERVAÇÕES: cláusulas especiais, restrições, requisitos técnicos

Seja EXTREMAMENTE detalhado na extração de informações de pagamento e prazos.`
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
                    text: `Analise esta imagem de um documento (${documentType === 'contract' ? 'contrato' : documentType === 'proposal' ? 'proposta comercial' : 'documento'}) e extraia TODAS as informações relevantes.

Extraia com atenção especial:
1. DADOS DO PROJETO E CLIENTE
2. VALORES E CONDIÇÕES DE PAGAMENTO (parcelas, datas, gatilhos)
3. PRAZOS E CRONOGRAMA
4. ENTREGAS PREVISTAS

Seja detalhado e extraia todos os textos visíveis relacionados a valores, datas e prazos.`
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

    // Now extract structured data using tool calling with expanded schema
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
- briefing: Briefing
- roteiro: Roteiro
- pre_producao: Pré-produção
- captacao: Captação
- edicao: Edição
- revisao: Revisão
- aprovacao: Aprovação
- entrega: Entrega
- pos_venda: Pós-venda

IMPORTANTE:
1. Se houver informações de pagamento em parcelas, extraia CADA parcela com porcentagem/valor e data ou gatilho
2. Se houver cronograma detalhado, extraia as datas de cada etapa
3. Calcule datas baseado no SLA padrão do template se não houver datas específicas
4. A data de hoje é: ${new Date().toISOString().split('T')[0]}

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
          { role: "system", content: "Você é um assistente especializado em gestão de projetos audiovisuais. Extraia dados estruturados COMPLETOS de documentos, incluindo cronograma e pagamentos." },
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
                  clientPhone: { 
                    type: "string", 
                    description: "Telefone do cliente (se disponível)" 
                  },
                  clientDocument: { 
                    type: "string", 
                    description: "CNPJ ou CPF do cliente (se disponível)" 
                  },
                  template: { 
                    type: "string", 
                    enum: ["filme_institucional", "filme_produto", "aftermovie", "reels_pacote", "foto_pacote", "tour_360", "motion_vinheta"],
                    description: "Tipo de template mais adequado ao projeto" 
                  },
                  contractValue: { 
                    type: "number", 
                    description: "Valor TOTAL do contrato em reais (apenas número, sem R$)" 
                  },
                  startDate: { 
                    type: "string", 
                    description: "Data de início no formato YYYY-MM-DD" 
                  },
                  deliveryDate: { 
                    type: "string", 
                    description: "Data de entrega FINAL estimada no formato YYYY-MM-DD" 
                  },
                  scope: { 
                    type: "string", 
                    description: "Descrição detalhada do escopo do projeto" 
                  },
                  deliverables: { 
                    type: "array",
                    items: { 
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Nome da entrega" },
                        type: { type: "string", enum: ["video", "imagem", "pdf", "zip", "audio", "outro"], description: "Tipo do arquivo" }
                      }
                    },
                    description: "Lista de entregas previstas com tipo" 
                  },
                  paymentMilestones: { 
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Nome do marco (ex: Entrada, Captação, Entrega Final)" },
                        percentage: { type: "number", description: "Percentual do valor total (0-100)" },
                        amount: { type: "number", description: "Valor em reais se especificado diretamente" },
                        dueDate: { type: "string", description: "Data de vencimento YYYY-MM-DD se especificada" },
                        trigger: { type: "string", description: "Gatilho (ex: Na assinatura, Após aprovação do roteiro, Na entrega)" }
                      }
                    },
                    description: "Marcos de pagamento/parcelas extraídos do documento" 
                  },
                  stageSchedule: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        stage: { type: "string", enum: ["briefing", "roteiro", "pre_producao", "captacao", "edicao", "revisao", "aprovacao", "entrega", "pos_venda"] },
                        plannedStart: { type: "string", description: "Data início YYYY-MM-DD" },
                        plannedEnd: { type: "string", description: "Data fim YYYY-MM-DD" },
                        durationDays: { type: "number", description: "Duração em dias" }
                      }
                    },
                    description: "Cronograma planejado por etapa (se mencionado no documento ou calcule baseado no SLA)"
                  },
                  revisionLimit: {
                    type: "number",
                    description: "Número máximo de revisões incluídas no contrato"
                  },
                  paymentTerms: { 
                    type: "string", 
                    description: "Descrição geral das condições de pagamento" 
                  },
                  additionalNotes: { 
                    type: "string", 
                    description: "Observações adicionais, cláusulas especiais, restrições" 
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

    console.log("Project data extracted:", JSON.stringify(projectData, null, 2));

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
