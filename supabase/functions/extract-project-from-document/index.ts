import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
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

// Hyper-detailed extraction prompt
const HYPER_DETAILED_PROMPT = `Você é um assistente ESPECIALISTA em extrair informações de documentos comerciais de produtoras audiovisuais.

Sua tarefa é extrair ABSOLUTAMENTE TODO o conteúdo deste documento de forma EXTREMAMENTE DETALHADA.

ESTRUTURE A EXTRAÇÃO ASSIM:

## RESUMO EXECUTIVO
[Resuma o projeto em 2-3 parágrafos - objetivo principal, tipo de serviço, contexto]

## ESCOPO COMPLETO
[Transcreva TODO o escopo PALAVRA POR PALAVRA, incluindo:
- Objetivos do projeto
- Necessidades identificadas
- Abordagem proposta
- Metodologia
- Conceito criativo
- Especificações técnicas
- Requisitos do cliente
- Qualquer detalhe mencionado sobre a execução]

## ENTREGAS PREVISTAS
[Liste CADA entrega individualmente com:
- Nome/título do entregável
- Formato (vídeo, imagem, PDF, etc.)
- Especificações técnicas (resolução, duração, dimensões)
- Quantidade se aplicável]

## CRONOGRAMA DETALHADO
[Cada etapa com:
- Nome da etapa
- Data de início prevista
- Data de fim prevista
- Duração em dias
- Responsabilidades]

## CONDIÇÕES FINANCEIRAS
[Extraia TODOS os detalhes:
- Valor total do contrato
- Cada parcela/milestone com:
  - Percentual
  - Valor em R$
  - Data de vencimento
  - Gatilho/condição (na assinatura, na aprovação, na entrega, etc.)
- Forma de pagamento
- Condições especiais]

## CLÁUSULAS E OBSERVAÇÕES
[Inclua:
- Limite de revisões incluídas
- Penalidades por atraso
- Restrições de uso
- Direitos autorais
- Cláusulas de rescisão
- Qualquer observação especial]

## DADOS DO CLIENTE
[Extraia TODOS os dados disponíveis:
- Nome do contato
- Cargo/função
- Nome da empresa
- CNPJ/CPF
- Email
- Telefone
- Endereço se disponível]

## DADOS DO FORNECEDOR
[Se disponível:
- Nome da produtora
- CNPJ
- Contatos]

IMPORTANTE: 
- NÃO RESUMA. TRANSCREVA TUDO.
- Se alguma informação não estiver clara, indique com [NÃO INFORMADO]
- Preserve números, datas e valores EXATAMENTE como aparecem
- Inclua aspas em textos literais importantes`;

// Process PDF using Gemini's native PDF support
async function extractPdfWithGemini(documentBase64: string, apiKey: string, documentType: string): Promise<string> {
  console.log("Processing PDF with Gemini vision (hyper-detailed)...");
  
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
              text: HYPER_DETAILED_PROMPT
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

// Fallback with Pro model
async function extractPdfWithPro(documentBase64: string, apiKey: string): Promise<string> {
  console.log("Trying with Gemini Pro for better extraction...");
  
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
          content: [
            {
              type: "text",
              text: HYPER_DETAILED_PROMPT
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
    console.error("Pro extraction failed:", await response.text());
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sbAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { text, documentBase64, imageBase64List, documentType = 'general' } = await req.json() as ExtractRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let extractedContent = "";
    
    // Process PDF/document if provided
    if (documentBase64) {
      console.log("Processing PDF document...");
      console.log(`Document base64 length: ${documentBase64.length} chars`);
      
      // Try Gemini Flash first
      try {
        extractedContent = await extractPdfWithGemini(documentBase64, LOVABLE_API_KEY, documentType);
      } catch (e) {
        console.error("Primary PDF extraction error:", e);
      }
      
      // If extraction insufficient, try Pro model
      if (!extractedContent || extractedContent.length < 500) {
        console.log("Primary extraction insufficient, trying Pro model...");
        try {
          const proContent = await extractPdfWithPro(documentBase64, LOVABLE_API_KEY);
          if (proContent && proContent.length > extractedContent.length) {
            extractedContent = proContent;
          }
        } catch (e) {
          console.error("Pro extraction error:", e);
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
                    text: `${HYPER_DETAILED_PROMPT}

Esta é a página ${i + 1} de ${imageBase64List.length} do documento.`
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
            extractedContent += "\n\n--- PÁGINA " + (i + 1) + " ---\n" + content;
            console.log(`Image ${i + 1} extracted ${content.length} chars`);
          }
        } else {
          const errText = await imageResponse.text();
          console.error(`Image ${i + 1} processing failed:`, errText);
        }
      }
    }

    // Add text content
    if (text) {
      extractedContent += "\n\n## TEXTO ADICIONAL DO USUÁRIO:\n" + text;
    }

    if (!extractedContent || extractedContent.trim().length < 50) {
      console.error("Insufficient content extracted:", extractedContent?.length || 0, "chars");
      
      let errorMsg = "Não foi possível extrair conteúdo suficiente do documento.";
      if (documentBase64) {
        errorMsg = "O PDF pode estar protegido, corrompido ou ser apenas imagens escaneadas de baixa qualidade. Tente fazer upload de imagens (fotos/screenshots) claras das páginas do documento.";
      } else if (!imageBase64List || imageBase64List.length === 0) {
        errorMsg = "Nenhum arquivo foi enviado. Por favor, faça upload de um PDF ou imagens do documento.";
      }
      
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Total extracted content: ${extractedContent.length} characters`);

    // Structure the extracted data
    const structuredPrompt = `Baseado nas informações DETALHADAS extraídas abaixo, estruture os dados COMPLETOS do projeto.

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

ETAPAS DO PROJETO (use para stageSchedule):
- briefing, roteiro, pre_producao, captacao, edicao, revisao, aprovacao, entrega, pos_venda

INSTRUÇÕES IMPORTANTES:
1. O campo "executiveSummary" deve conter um RESUMO EXECUTIVO de 2-3 parágrafos
2. O campo "fullScope" deve conter O ESCOPO COMPLETO, palavra por palavra, TUDO que foi extraído sobre o que será feito
3. O campo "deliverables" deve listar CADA ENTREGA individualmente
4. O campo "paymentMilestones" deve listar CADA PARCELA com valor, percentual, data e gatilho
5. O campo "stageSchedule" deve incluir as etapas com datas se mencionadas
6. O campo "additionalNotes" deve incluir cláusulas, restrições e observações
7. O campo "rawExtractedContent" deve conter TODO o texto extraído original

Data de hoje: ${new Date().toISOString().split('T')[0]}`;

    const structuredResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um assistente especializado em gestão de projetos audiovisuais. Extraia dados estruturados COMPLETOS e DETALHADOS de documentos. Nunca resuma - preserve todo o conteúdo." },
          { role: "user", content: structuredPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_project",
              description: "Cria um projeto COMPLETO com TODOS os dados extraídos do documento",
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
                  revisionLimit: { type: "number", description: "Limite de revisões" },
                  
                  // CAMPOS DETALHADOS
                  executiveSummary: { type: "string", description: "Resumo executivo do projeto em 2-3 parágrafos" },
                  fullScope: { type: "string", description: "Escopo COMPLETO do projeto, palavra por palavra, TODO o conteúdo extraído sobre o que será feito" },
                  
                  deliverables: { 
                    type: "array",
                    description: "Lista de TODAS as entregas previstas",
                    items: { 
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Nome da entrega" },
                        type: { type: "string", enum: ["video", "imagem", "pdf", "zip", "audio", "outro"], description: "Tipo do arquivo" },
                        specifications: { type: "string", description: "Especificações técnicas (resolução, duração, etc.)" },
                        quantity: { type: "number", description: "Quantidade se aplicável" }
                      },
                      required: ["title", "type"]
                    }
                  },
                  
                  paymentMilestones: { 
                    type: "array",
                    description: "Lista de TODAS as parcelas/milestones de pagamento",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Descrição do milestone" },
                        percentage: { type: "number", description: "Percentual do valor total" },
                        amount: { type: "number", description: "Valor em R$" },
                        dueDate: { type: "string", description: "Data de vencimento YYYY-MM-DD" },
                        trigger: { type: "string", description: "Gatilho (na assinatura, na aprovação, na entrega, etc.)" }
                      },
                      required: ["title"]
                    }
                  },
                  
                  stageSchedule: {
                    type: "array",
                    description: "Cronograma detalhado por etapa",
                    items: {
                      type: "object",
                      properties: {
                        stage: { type: "string", enum: ["briefing", "roteiro", "pre_producao", "captacao", "edicao", "revisao", "aprovacao", "entrega", "pos_venda"], description: "Identificador da etapa" },
                        plannedStart: { type: "string", description: "Data início YYYY-MM-DD" },
                        plannedEnd: { type: "string", description: "Data fim YYYY-MM-DD" },
                        durationDays: { type: "number", description: "Duração em dias" }
                      },
                      required: ["stage"]
                    }
                  },
                  
                  paymentTerms: { type: "string", description: "Condições de pagamento em texto livre" },
                  additionalNotes: { type: "string", description: "Cláusulas especiais, restrições, observações importantes" },
                  rawExtractedContent: { type: "string", description: "TODO o conteúdo extraído do documento, sem modificações" }
                },
                required: ["title", "template", "executiveSummary", "fullScope"],
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
    console.log("Scope length:", projectData.fullScope?.length || 0);
    console.log("Deliverables count:", projectData.deliverables?.length || 0);
    console.log("Milestones count:", projectData.paymentMilestones?.length || 0);

    // Calculate milestone amounts if only percentages provided
    const processedMilestones = (projectData.paymentMilestones || []).map((m: any) => ({
      ...m,
      amount: m.amount || (m.percentage && projectData.contractValue ? Math.round((m.percentage / 100) * projectData.contractValue * 100) / 100 : 0)
    }));

    return new Response(JSON.stringify({
      success: true,
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
        revisionLimit: projectData.revisionLimit || 2,
        
        // CAMPOS DETALHADOS
        executiveSummary: projectData.executiveSummary || "",
        fullScope: projectData.fullScope || "",
        deliverables: projectData.deliverables || [],
        paymentMilestones: processedMilestones,
        stageSchedule: projectData.stageSchedule || [],
        paymentTerms: projectData.paymentTerms || "",
        additionalNotes: projectData.additionalNotes || "",
        rawExtractedContent: projectData.rawExtractedContent || extractedContent
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
