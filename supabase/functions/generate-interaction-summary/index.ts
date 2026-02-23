/**
 * Edge function: generate-interaction-summary
 * Uses AI to extract summary, decisions, action items, and deadlines from meeting transcripts
 */

import { createClient } from "jsr:@supabase/supabase-js@2";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  interactionId: string;
  projectId: string;
  createTasks: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { interactionId, projectId, createTasks } = await req.json() as RequestBody;

    // Fetch the interaction
    const { data: interaction, error: fetchError } = await supabase
      .from("project_interactions")
      .select("*")
      .eq("id", interactionId)
      .single();

    if (fetchError || !interaction) {
      throw new Error("Interaction not found");
    }

    if (!interaction.transcript) {
      throw new Error("No transcript to summarize");
    }

    // Fetch project info for context
    const { data: project } = await supabase
      .from("projects")
      .select("name, client_name")
      .eq("id", projectId)
      .single();

    // Prepare prompt
    const systemPrompt = `Você é um assistente especializado em analisar transcrições de reuniões e mensagens de projetos audiovisuais.
Sua tarefa é extrair informações estruturadas em português brasileiro.

Retorne APENAS um JSON válido com esta estrutura (sem markdown, sem código, apenas o JSON puro):
{
  "summary_bullets": ["string"], // 3-5 pontos principais da conversa
  "decisions": ["string"], // decisões tomadas ou acordos feitos
  "action_items": [{"title": "string", "assignee": "string ou null", "due_date": "string ou null"}], // ações/tarefas a fazer
  "deadlines": [{"description": "string", "date": "string"}], // prazos mencionados
  "risks": ["string"] // riscos, pendências ou pontos de atenção
}

Se alguma categoria não tiver itens, retorne array vazio [].
Extraia datas no formato DD/MM/YYYY quando mencionadas.
Identifique responsáveis quando mencionados (ex: "João vai fazer X" -> assignee: "João").`;

    const userPrompt = `Projeto: ${project?.name || 'Projeto'}
Cliente: ${project?.client_name || 'Cliente'}
Tipo: ${interaction.type}
Título: ${interaction.title}
Data: ${interaction.occurred_at}

TRANSCRIÇÃO/CONTEÚDO:
${interaction.transcript}

Analise e extraia as informações estruturadas.`;

    // Call AI API
    const aiResult = await chatCompletion({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let summaryData;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summaryData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    // Save summary to database
    const { data: summary, error: summaryError } = await supabase
      .from("project_interaction_summaries")
      .upsert({
        interaction_id: interactionId,
        summary_bullets: summaryData.summary_bullets || [],
        decisions: summaryData.decisions || [],
        action_items: summaryData.action_items || [],
        deadlines: summaryData.deadlines || [],
        risks: summaryData.risks || [],
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'interaction_id',
      })
      .select()
      .single();

    if (summaryError) {
      throw new Error(`Failed to save summary: ${summaryError.message}`);
    }

    // Optionally create action items as tasks
    if (createTasks && summaryData.action_items?.length > 0) {
      const actionItemsToInsert = summaryData.action_items.map((item: any) => ({
        project_id: projectId,
        interaction_id: interactionId,
        title: item.title,
        assignee: item.assignee || null,
        due_date: item.due_date ? parseDate(item.due_date) : null,
        status: 'aberto',
      }));

      await supabase
        .from("project_action_items")
        .insert(actionItemsToInsert);
    }

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper to parse dates in various formats
function parseDate(dateStr: string): string | null {
  try {
    // Handle DD/MM/YYYY format
    const ddmmyyyy = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle YYYY-MM-DD format
    const yyyymmdd = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (yyyymmdd) {
      return dateStr;
    }

    return null;
  } catch {
    return null;
  }
}
