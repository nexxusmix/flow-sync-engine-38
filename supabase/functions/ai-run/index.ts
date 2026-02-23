import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================
// Unified AI Action Handler
// Routes by action_key, uses shared ai-client
// ============================================

const DEFAULT_MODEL = "google/gemini-3-flash-preview";

// Action-specific system prompts
const ACTION_PROMPTS: Record<string, string> = {
  'marketing.generateCopy': `Você é um especialista em copywriting para redes sociais brasileiras.
Gere conteúdo criativo, engajante e persuasivo.
SEMPRE responda em português do Brasil.
Retorne APENAS o JSON no formato especificado, sem texto adicional.`,

  'marketing.generateIdeas': `Você é um estrategista de conteúdo digital para o mercado brasileiro.
Gere ideias criativas e relevantes para o público-alvo.
SEMPRE responda em português do Brasil.
Retorne APENAS o JSON no formato especificado, sem texto adicional.`,

  'projects.generateBrief': `Você é um gerente de projetos experiente especializado em produtoras audiovisuais e agências criativas.
Crie briefings detalhados, profissionais e organizados.
SEMPRE responda em português do Brasil.
Retorne APENAS o JSON no formato especificado, sem texto adicional.`,
};

// Action-specific tool definitions for structured output
const ACTION_TOOLS: Record<string, unknown> = {
  'marketing.generateCopy': {
    type: "function",
    function: {
      name: "generate_copy",
      description: "Generate social media copy including hook, captions, CTA, hashtags and script",
      parameters: {
        type: "object",
        properties: {
          hook: { type: "string", description: "Primeira frase impactante para captar atenção (máx 100 chars)" },
          caption_short: { type: "string", description: "Legenda curta para feed (máx 150 chars)" },
          caption_long: { type: "string", description: "Legenda completa com storytelling (300-500 chars)" },
          cta: { type: "string", description: "Call to action direto (máx 50 chars)" },
          hashtags: { type: "string", description: "10-15 hashtags relevantes separadas por espaço" },
          script: { type: "string", description: "Roteiro para vídeo se aplicável (opcional)" },
        },
        required: ["hook", "caption_short", "caption_long", "cta", "hashtags"],
        additionalProperties: false,
      },
    },
  },

  'marketing.generateIdeas': {
    type: "function",
    function: {
      name: "generate_ideas",
      description: "Generate content ideas for social media",
      parameters: {
        type: "object",
        properties: {
          ideas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Título da ideia" },
                hook: { type: "string", description: "Gancho principal" },
                pillar: { type: "string", description: "Pilar de conteúdo" },
                channel: { type: "string", description: "Canal sugerido" },
                format: { type: "string", description: "Formato (reel, carousel, etc)" },
                target: { type: "string", description: "Público-alvo" },
                score: { type: "number", description: "Score de relevância 1-100" },
              },
              required: ["title", "hook", "pillar", "channel", "format", "score"],
            },
          },
        },
        required: ["ideas"],
        additionalProperties: false,
      },
    },
  },

  'projects.generateBrief': {
    type: "function",
    function: {
      name: "generate_brief",
      description: "Generate project brief with description, scope, objectives and deliverables",
      parameters: {
        type: "object",
        properties: {
          description: { type: "string", description: "Descrição geral do projeto (2-3 parágrafos)" },
          scope: { type: "string", description: "Escopo detalhado do trabalho" },
          objectives: {
            type: "array",
            items: { type: "string" },
            description: "Lista de 3-5 objetivos principais",
          },
          deliverables: {
            type: "array",
            items: { type: "string" },
            description: "Lista de entregas esperadas",
          },
          timeline_suggestion: { type: "string", description: "Sugestão de cronograma" },
        },
        required: ["description", "scope", "objectives", "deliverables"],
        additionalProperties: false,
      },
    },
  },
};

// Build user prompt based on action and input
function buildUserPrompt(actionKey: string, input: Record<string, unknown>): string {
  switch (actionKey) {
    case 'marketing.generateCopy':
      return `
Crie copy para o seguinte conteúdo:
- Título: ${input.title || 'Não especificado'}
- Canal: ${input.channel || 'Instagram'}
- Formato: ${input.format || 'Reel'}
- Pilar: ${input.pillar || 'Não especificado'}
- Hook atual: ${input.hook || 'Nenhum'}
- Notas/Briefing: ${input.notes || 'Nenhuma'}

Gere copy criativa e engajante.
`;

    case 'marketing.generateIdeas':
      return `
Gere 10 ideias de conteúdo com os seguintes filtros:
- Pilar: ${input.pillar || 'Qualquer'}
- Canal: ${input.channel || 'Qualquer'}
- Formato: ${input.format || 'Qualquer'}
- Nicho: ${input.niche || 'Produtora audiovisual / marketing digital'}
- Objetivo: ${input.objective || 'Engajamento e autoridade'}
- Tom: ${input.tone || 'Profissional mas acessível'}
`;

    case 'projects.generateBrief':
      return `
Crie um briefing completo para o projeto:
- Nome do Projeto: ${input.name || 'Não especificado'}
- Cliente: ${input.client_name || 'Não especificado'}
- Tipo de Serviço: ${input.service_type || 'Não especificado'}
- Descrição inicial: ${input.description || 'Nenhuma'}
- Notas adicionais: ${input.notes || 'Nenhuma'}

Elabore um briefing profissional e detalhado.
`;

    default:
      return JSON.stringify(input);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth validation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { actionKey, input, entityType, entityId } = await req.json();

    console.log(`[ai-run] Action: ${actionKey}, EntityType: ${entityType}, EntityId: ${entityId}`);

    // Validate action
    if (!actionKey || !ACTION_PROMPTS[actionKey]) {
      return new Response(
        JSON.stringify({ error: `Ação desconhecida: ${actionKey}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = ACTION_PROMPTS[actionKey];
    const userPrompt = buildUserPrompt(actionKey, input || {});
    const tool = ACTION_TOOLS[actionKey];

    // Build request options
    const requestOpts: Record<string, unknown> = {
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    // Add tool for structured output if available
    if (tool) {
      requestOpts.tools = [tool];
      requestOpts.tool_choice = { 
        type: "function", 
        function: { name: (tool as { function: { name: string } }).function.name } 
      };
    }

    console.log(`[ai-run] Calling AI via shared client...`);

    const data = await chatCompletion(requestOpts as any);

    console.log(`[ai-run] Response received via ${data.provider}`);

    // Extract result from tool call or message content
    let result: unknown;

    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      try {
        result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      } catch (parseErr) {
        console.error('[ai-run] Failed to parse tool arguments:', parseErr);
        result = { error: 'Falha ao processar resposta da IA' };
      }
    } else if (data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      try {
        result = JSON.parse(content);
      } catch {
        result = { content };
      }
    } else {
      result = { error: 'Resposta inesperada da IA' };
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[ai-run] Exception:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
