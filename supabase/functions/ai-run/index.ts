import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ============================================
// Unified AI Action Handler
// Routes by action_key and calls Lovable AI
// ============================================

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
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
  // Handle CORS preflight
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
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims?.sub) {
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error('[ai-run] LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Configuração de IA não encontrada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = ACTION_PROMPTS[actionKey];
    const userPrompt = buildUserPrompt(actionKey, input || {});
    const tool = ACTION_TOOLS[actionKey];

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    // Add tool for structured output if available
    if (tool) {
      requestBody.tools = [tool];
      requestBody.tool_choice = { 
        type: "function", 
        function: { name: (tool as { function: { name: string } }).function.name } 
      };
    }

    console.log(`[ai-run] Calling Lovable AI...`);

    const response = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ai-run] Lovable AI error: ${response.status}`, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos.", status: 429 }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos para continuar.", status: 402 }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdo com IA" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`[ai-run] Response received`);

    // Extract result from tool call or message content
    let result: unknown;

    if (data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      // Tool call response - parse JSON from arguments
      try {
        result = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      } catch (parseErr) {
        console.error('[ai-run] Failed to parse tool arguments:', parseErr);
        result = { error: 'Falha ao processar resposta da IA' };
      }
    } else if (data.choices?.[0]?.message?.content) {
      // Regular text response - try to parse as JSON
      const content = data.choices[0].message.content;
      try {
        result = JSON.parse(content);
      } catch {
        // Not JSON, return as-is
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
