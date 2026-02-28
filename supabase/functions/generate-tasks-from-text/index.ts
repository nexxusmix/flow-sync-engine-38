// Edge Function: Generate Tasks from Text using AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskInput {
  rawText: string;
  extractedTexts?: string[];
  defaultCategory?: string;
  defaultColumn?: string;
  guidancePrompt?: string;
  imageBase64?: string[];
}

interface GeneratedTask {
  title: string;
  description?: string;
  category: string;
  tags: string[];
  due_date?: string;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sbAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { rawText, extractedTexts, defaultCategory = 'operacao', defaultColumn = 'backlog', guidancePrompt, imageBase64 } = await req.json() as TaskInput;

    const allTexts = [rawText, ...(extractedTexts || [])].filter(t => t && t.trim().length > 0);
    const combinedText = allTexts.join('\n\n---\n\n');

    if (!combinedText || combinedText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'rawText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating tasks from text:', combinedText.substring(0, 100) + '...');

    const systemPrompt = `Você é um assistente especializado em organização de tarefas. 
Sua função é transformar texto livre em tarefas estruturadas.

REGRAS:
1. Cada linha ou item do texto deve virar uma tarefa
2. Extraia o título principal da tarefa
3. Se houver detalhes, coloque em description
4. Identifique categorias: "pessoal" (coisas de casa, família, saúde), "operacao" (trabalho, negócios), "projeto" (projetos específicos)
5. Extraia tags relevantes (palavras-chave, contexto)
6. Se houver data mencionada, extraia no formato YYYY-MM-DD
7. Status padrão é o informado pelo usuário
${guidancePrompt ? `\nINSTRUÇÃO ADICIONAL DO USUÁRIO:\n${guidancePrompt}` : ''}

Retorne as tarefas usando a função extract_tasks.`;

    const userPrompt = `Transforme o seguinte texto em tarefas estruturadas.
Categoria padrão: ${defaultCategory}
Status/Coluna padrão: ${defaultColumn}

TEXTO:
${combinedText}`;

    // Define tool for structured extraction
    const tools = [
      {
        type: 'function',
        function: {
          name: 'extract_tasks',
          description: 'Extrair tarefas estruturadas do texto fornecido',
          parameters: {
            type: 'object',
            properties: {
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'Título da tarefa' },
                    description: { type: 'string', description: 'Descrição opcional' },
                    category: { type: 'string', enum: ['pessoal', 'operacao', 'projeto'] },
                    tags: { type: 'array', items: { type: 'string' } },
                    due_date: { type: 'string', description: 'Data YYYY-MM-DD ou null' },
                    status: { type: 'string', enum: ['backlog', 'week', 'today', 'done'] },
                  },
                  required: ['title', 'category', 'tags', 'status'],
                },
              },
            },
            required: ['tasks'],
          },
        },
      },
    ];

    // Build messages
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (imageBase64 && imageBase64.length > 0) {
      const contentParts: any[] = [{ type: 'text', text: userPrompt }];
      for (const img of imageBase64) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}` },
        });
      }
      messages.push({ role: 'user', content: contentParts });
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    const aiResponse = await chatCompletion({
      model: 'google/gemini-2.5-flash',
      messages,
      temperature: 0.3,
      max_tokens: 4096,
      tools,
      tool_choice: { type: 'function', function: { name: 'extract_tasks' } },
    });

    // Extract tasks from tool call response
    let tasks: GeneratedTask[] = [];
    const toolCalls = aiResponse.choices?.[0]?.message?.tool_calls;
    const content = aiResponse.choices?.[0]?.message?.content;

    if (toolCalls && toolCalls.length > 0) {
      // Native tool calling worked
      const args = JSON.parse(toolCalls[0].function.arguments);
      tasks = args.tasks || [];
      console.log('[generate-tasks] Extracted via tool calling');
    } else if (content) {
      // Fallback: parse from content (some providers may not support tool calling)
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/```\s*$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/```\s*$/, '');
      }
      try {
        const parsed = JSON.parse(jsonStr);
        tasks = Array.isArray(parsed) ? parsed : (parsed.tasks || []);
      } catch {
        console.error('[generate-tasks] Failed to parse content as JSON:', jsonStr.substring(0, 200));
        throw new Error('Resposta da IA em formato inválido');
      }
    } else {
      throw new Error('Empty response from AI');
    }

    // Validate and sanitize
    const validatedTasks = tasks.map((task, index) => ({
      title: task.title || `Tarefa ${index + 1}`,
      description: task.description || null,
      category: ['pessoal', 'operacao', 'projeto'].includes(task.category) ? task.category : defaultCategory,
      tags: Array.isArray(task.tags) ? task.tags.filter(t => typeof t === 'string') : [],
      due_date: task.due_date && /^\d{4}-\d{2}-\d{2}$/.test(task.due_date) ? task.due_date : null,
      status: ['backlog', 'week', 'today', 'done'].includes(task.status) ? task.status : defaultColumn,
    }));

    console.log(`Generated ${validatedTasks.length} tasks`);

    return new Response(
      JSON.stringify({ tasks: validatedTasks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating tasks:', error);
    
    // Detect rate limit / payment errors
    const msg = error.message || '';
    const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate');
    const isPayment = msg.includes('402') || msg.toLowerCase().includes('quota');
    const statusCode = isRateLimit ? 429 : isPayment ? 402 : 500;
    const userMessage = isRateLimit
      ? 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.'
      : isPayment
        ? 'Cota de IA esgotada. Entre em contato com o administrador.'
        : (error.message || 'Erro ao gerar tarefas');

    return new Response(
      JSON.stringify({ error: userMessage }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
