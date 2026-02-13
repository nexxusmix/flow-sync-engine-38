// Edge Function: Generate Tasks from Text using AI
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskInput {
  rawText: string;
  defaultCategory?: string;
  defaultColumn?: string;
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sbAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { error: authErr } = await sbAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { rawText, defaultCategory = 'operacao', defaultColumn = 'backlog' } = await req.json() as TaskInput;

    if (!rawText || rawText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'rawText is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating tasks from text:', rawText.substring(0, 100) + '...');

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

IMPORTANTE:
- Retorne APENAS um array JSON válido
- Não inclua markdown ou explicações
- Cada tarefa deve ter pelo menos um título`;

    const userPrompt = `Transforme o seguinte texto em tarefas estruturadas.
Categoria padrão: ${defaultCategory}
Status/Coluna padrão: ${defaultColumn}

TEXTO:
${rawText}

Retorne um array JSON com as tarefas no formato:
[
  {
    "title": "título da tarefa",
    "description": "descrição opcional",
    "category": "pessoal|operacao|projeto",
    "tags": ["tag1", "tag2"],
    "due_date": "YYYY-MM-DD ou null",
    "status": "${defaultColumn}"
  }
]`;

    // Use Lovable AI Gateway endpoint
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from AI');
    }

    console.log('AI response:', content.substring(0, 200) + '...');

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const tasks: GeneratedTask[] = JSON.parse(jsonStr);

    // Validate and sanitize tasks
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
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate tasks' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
