import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateRequest {
  workId: string;
  blockType: string;
  action: 'generate' | 'improve' | 'summarize' | 'expand' | 'adjust_tone' | 'adapt_brand' | 'custom';
  instruction?: string;
  currentContent?: Record<string, unknown>;
  context?: {
    title?: string;
    projectId?: string;
    clientId?: string;
    campaignId?: string;
    brandKit?: Record<string, unknown>;
  };
}

// System prompts for each block type
const BLOCK_PROMPTS: Record<string, string> = {
  brief: `Você é um estrategista criativo especializado em briefs de projetos audiovisuais e de conteúdo.
Sua tarefa é criar um brief completo e detalhado baseado nos dados reais do projeto.

ESTRUTURA DO BRIEF:
- objective: Objetivo principal do projeto (baseado no escopo e descrição do projeto)
- audience: Público-alvo (baseado nos dados do cliente e projeto)
- offer: Proposta de valor ou oferta central
- restrictions: Restrições ou limitações conhecidas
- tone: Tom e estilo sugerido
- deliverables: Lista de entregas esperadas (baseada nas entregas do projeto)
- deadline: Prazo (baseado nas datas do projeto)
- references: Lista de referências relevantes

REGRAS:
- Use TODOS os dados do projeto, cliente e campanha fornecidos para enriquecer o brief
- Seja específico e contextual, não genérico
- Mantenha linguagem profissional em português BR`,

  narrative_script: `Você é um roteirista profissional de vídeos e conteúdo audiovisual.
Sua tarefa é criar roteiros narrativos estruturados para produções de vídeo.

ESTRUTURA DO ROTEIRO:
- logline: Uma frase que captura a essência da história (máx 2 linhas)
- premise: O argumento central e a mensagem principal
- tone: O tom emocional do conteúdo (ex: inspirador, dramático, divertido)
- theme: O tema central abordado
- structure.act1: Apresentação - introdução do contexto e gancho
- structure.act2: Desenvolvimento - escalada, conflito, ponto de virada
- structure.act3: Resolução - clímax e conclusão
- full_script: Roteiro completo com indicações de cena, diálogos e ações

REGRAS:
- Seja cinematográfico e visual nas descrições
- Use linguagem clara e objetiva
- Inclua indicações de emoção e tom
- Mantenha coerência narrativa entre os atos
- Use os dados reais do projeto/cliente para contextualizar`,

  storyboard: `Você é um diretor de arte especializado em storyboards para vídeo.
Crie cenas visuais detalhadas que guiem a produção.

ESTRUTURA DE CADA CENA:
- number: Número sequencial
- title: Título curto da cena
- description: Descrição visual detalhada
- action: O que acontece na cena
- dialogue: Falas (se houver)
- camera: Indicação de enquadramento e movimento
- duration_sec: Duração estimada em segundos
- emotion: Tom emocional
- audio: Indicação de som/música
- image_prompt: Prompt para geração de imagem

REGRAS:
- Cenas devem ter entre 3-10 segundos
- Descrições visuais precisas
- Transições claras entre cenas`,
};

// Action modifiers
const ACTION_MODIFIERS: Record<string, string> = {
  generate: 'Crie um conteúdo novo e original baseado no contexto fornecido.',
  improve: 'Melhore o conteúdo existente, tornando-o mais impactante e profissional.',
  summarize: 'Resuma o conteúdo mantendo os pontos essenciais.',
  expand: 'Expanda o conteúdo com mais detalhes e profundidade.',
  adjust_tone: 'Ajuste o tom para ser mais adequado ao público e objetivo.',
  adapt_brand: 'Adapte o conteúdo para refletir a identidade da marca.',
  custom: 'Siga a instrução personalizada fornecida.',
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Auth check with user client
    const sbAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { error: authErr } = await sbAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Service client for fetching context data
    const sbService = createClient(supabaseUrl, supabaseServiceKey);

    const body: GenerateRequest = await req.json();
    const { workId, blockType, action, instruction, currentContent, context } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // ============ FETCH REAL CONTEXT DATA ============
    let projectContext = '';
    let clientContext = '';
    let campaignContext = '';
    let materialsContext = '';

    // Fetch project data
    if (context?.projectId) {
      const { data: project } = await sbService
        .from('projects')
        .select('name, description, status, stage_current, template, start_date, due_date, contract_value, client_name')
        .eq('id', context.projectId)
        .single();

      if (project) {
        projectContext = `
DADOS DO PROJETO:
- Nome: ${project.name}
- Cliente: ${project.client_name || 'N/A'}
- Descrição: ${project.description || 'N/A'}
- Status: ${project.status || 'N/A'}
- Etapa: ${project.stage_current || 'N/A'}
- Tipo: ${project.template || 'N/A'}
- Início: ${project.start_date || 'N/A'}
- Prazo: ${project.due_date || 'N/A'}
- Valor: ${project.contract_value ? `R$ ${project.contract_value}` : 'N/A'}`;
      }

      // Fetch project deliverables/milestones
      const { data: milestones } = await sbService
        .from('payment_milestones')
        .select('title, description, percentage, status')
        .eq('project_id', context.projectId)
        .order('display_order');

      if (milestones?.length) {
        projectContext += `\n- Entregas/Milestones: ${milestones.map(m => `${m.title}${m.description ? ` (${m.description})` : ''}`).join('; ')}`;
      }

      // Fetch project materials
      const { data: materials } = await sbService
        .from('portal_deliverables')
        .select('title, description, type, status')
        .eq('project_id', context.projectId)
        .limit(10);

      if (materials?.length) {
        materialsContext = `\nMATERIAIS DO PROJETO:
${materials.map(m => `- ${m.title} (${m.type || 'arquivo'}) — ${m.status || 'pendente'}${m.description ? `: ${m.description}` : ''}`).join('\n')}`;
      }
    }

    // Fetch client data
    if (context?.clientId) {
      const { data: client } = await sbService
        .from('crm_contacts')
        .select('name, company, role, industry, notes')
        .eq('id', context.clientId)
        .single();

      if (client) {
        clientContext = `
DADOS DO CLIENTE:
- Nome: ${client.name}
- Empresa: ${client.company || 'N/A'}
- Cargo: ${client.role || 'N/A'}
- Segmento: ${client.industry || 'N/A'}
- Notas: ${client.notes || 'N/A'}`;
      }
    }

    // Fetch campaign data
    if (context?.campaignId) {
      const { data: campaign } = await sbService
        .from('campaigns')
        .select('name, objective, offer, audience, start_date, end_date, budget')
        .eq('id', context.campaignId)
        .single();

      if (campaign) {
        campaignContext = `
DADOS DA CAMPANHA:
- Nome: ${campaign.name}
- Objetivo: ${campaign.objective || 'N/A'}
- Oferta: ${campaign.offer || 'N/A'}
- Público-alvo: ${campaign.audience || 'N/A'}
- Período: ${campaign.start_date || '?'} a ${campaign.end_date || '?'}
- Budget: ${campaign.budget ? `R$ ${campaign.budget}` : 'N/A'}`;
      }
    }

    // Fetch brand kit if linked
    let brandKitContext = '';
    if (context?.brandKit) {
      brandKitContext = `\nBRAND KIT: ${JSON.stringify(context.brandKit)}`;
    }

    // Build system prompt
    const blockPrompt = BLOCK_PROMPTS[blockType] || BLOCK_PROMPTS.narrative_script;
    const actionModifier = ACTION_MODIFIERS[action] || ACTION_MODIFIERS.generate;

    const systemPrompt = `${blockPrompt}

AÇÃO: ${actionModifier}
${instruction ? `INSTRUÇÃO ESPECÍFICA: ${instruction}` : ''}

Retorne APENAS o JSON válido com a estrutura apropriada para o tipo de bloco.
NÃO inclua explicações ou texto adicional fora do JSON.`;

    // Build user prompt with REAL context
    let userPrompt = `Contexto do trabalho criativo:
- Título: ${context?.title || 'Trabalho Criativo'}
${projectContext}
${clientContext}
${campaignContext}
${materialsContext}
${brandKitContext}
`;

    if (currentContent && Object.keys(currentContent).length > 0) {
      userPrompt += `\nConteúdo atual para ${action === 'improve' ? 'melhorar' : 'referência'}:
${JSON.stringify(currentContent, null, 2)}`;
    }

    userPrompt += `\n\nGere o conteúdo para o bloco "${blockType}" usando os dados reais fornecidos acima.`;

    // Define the function schema based on block type
    const functionSchema = getBlockFunctionSchema(blockType);

    console.log('Calling AI Gateway for block:', blockType, 'action:', action, 'with project context:', !!projectContext);

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
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: functionSchema
        }],
        tool_choice: { type: "function", function: { name: functionSchema.name } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again in a few seconds." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("No valid response from AI");
    }

    const generatedContent = JSON.parse(toolCall.function.arguments);

    console.log('Generated content for block:', blockType);

    return new Response(JSON.stringify({ 
      success: true,
      content: generatedContent,
      blockType,
      action,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in studio-generate-block:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Get function schema for block type
function getBlockFunctionSchema(blockType: string) {
  switch (blockType) {
    case 'brief':
      return {
        name: "generate_brief",
        description: "Generate a complete project brief based on real project data",
        parameters: {
          type: "object",
          properties: {
            objective: { type: "string", description: "Main objective of the project" },
            audience: { type: "string", description: "Target audience" },
            offer: { type: "string", description: "Core value proposition or offer" },
            restrictions: { type: "string", description: "Known restrictions or limitations" },
            tone: { type: "string", description: "Suggested tone and style" },
            deliverables: { type: "array", items: { type: "string" }, description: "List of expected deliverables" },
            deadline: { type: "string", description: "Deadline in YYYY-MM-DD format" },
            references: { type: "array", items: { type: "string" }, description: "Relevant references" }
          },
          required: ["objective", "audience", "tone", "deliverables"],
          additionalProperties: false
        }
      };

    case 'narrative_script':
      return {
        name: "generate_narrative_script",
        description: "Generate a structured narrative script for video content",
        parameters: {
          type: "object",
          properties: {
            logline: { type: "string", description: "One-line summary of the story" },
            premise: { type: "string", description: "The central argument and message" },
            tone: { type: "string", description: "Emotional tone (e.g., inspirational, dramatic)" },
            theme: { type: "string", description: "Central theme" },
            structure: {
              type: "object",
              properties: {
                act1: { type: "string", description: "Act 1 - Setup and introduction" },
                act2: { type: "string", description: "Act 2 - Confrontation and development" },
                act3: { type: "string", description: "Act 3 - Resolution and climax" }
              },
              required: ["act1", "act2", "act3"]
            },
            full_script: { type: "string", description: "Complete script with scene directions and dialogues" }
          },
          required: ["logline", "premise", "tone", "theme", "structure", "full_script"]
        }
      };

    case 'storyboard':
      return {
        name: "generate_storyboard",
        description: "Generate a visual storyboard with scenes",
        parameters: {
          type: "object",
          properties: {
            scenes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  number: { type: "number" },
                  title: { type: "string" },
                  description: { type: "string" },
                  action: { type: "string" },
                  dialogue: { type: "string" },
                  camera: { type: "string" },
                  duration_sec: { type: "number" },
                  emotion: { type: "string" },
                  audio: { type: "string" },
                  image_prompt: { type: "string" }
                },
                required: ["number", "title", "description", "camera", "duration_sec"]
              }
            }
          },
          required: ["scenes"]
        }
      };

    case 'copy_variations':
      return {
        name: "generate_copy_variations",
        description: "Generate copy variations and hashtags",
        parameters: {
          type: "object",
          properties: {
            variations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  tone: { type: "string" },
                  channel: { type: "string" },
                  length: { type: "string", enum: ["short", "medium", "long"] }
                },
                required: ["text", "tone", "channel", "length"]
              }
            },
            hashtags: { type: "array", items: { type: "string" } },
            cta: { type: "string" }
          },
          required: ["variations", "hashtags", "cta"]
        }
      };

    case 'shotlist':
      return {
        name: "generate_shotlist",
        description: "Generate a production shotlist",
        parameters: {
          type: "object",
          properties: {
            shots: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  number: { type: "number" },
                  description: { type: "string" },
                  shot_type: { type: "string" },
                  movement: { type: "string" },
                  lens: { type: "string" },
                  notes: { type: "string" }
                },
                required: ["number", "description", "shot_type"]
              }
            }
          },
          required: ["shots"]
        }
      };

    default:
      return {
        name: `generate_${blockType}`,
        description: `Generate content for ${blockType} block`,
        parameters: {
          type: "object",
          properties: {
            content: { type: "string", description: "Generated content" },
            metadata: { type: "object", description: "Additional metadata" }
          },
          required: ["content"]
        }
      };
  }
}
