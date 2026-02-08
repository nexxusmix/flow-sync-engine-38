import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HandleActionRequest {
  suggestion_id: string;
  action_key: string;
  params?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { suggestion_id, action_key, params }: HandleActionRequest = await req.json();

    if (!suggestion_id || !action_key) {
      throw new Error('Missing required fields: suggestion_id, action_key');
    }

    console.log(`[automation-handle-action] Processing action: ${action_key} for suggestion: ${suggestion_id}`);

    // Fetch suggestion
    const { data: suggestion, error: suggestionError } = await supabase
      .from('automation_suggestions')
      .select('*')
      .eq('id', suggestion_id)
      .single();

    if (suggestionError || !suggestion) {
      throw new Error(`Suggestion not found: ${suggestionError?.message}`);
    }

    let result: Record<string, unknown> = {};
    let markAsApplied = true;

    const suggestionJson = suggestion.suggestion_json as Record<string, unknown>;
    const context = (suggestionJson.context || {}) as Record<string, unknown>;

    switch (action_key) {
      case 'generate_checklist':
      case 'generate_followup':
      case 'generate_ideas':
      case 'generate_variations':
        // Call AI helper function
        const { data: aiResult, error: aiError } = await supabase.functions.invoke('generate-next-steps', {
          body: {
            action_key,
            entity_type: suggestion.entity_type,
            entity_id: suggestion.entity_id,
            context,
          }
        });

        if (aiError) throw aiError;
        result = { ai_output: aiResult };
        break;

      case 'move_to_review':
        if (suggestion.entity_type === 'content_item') {
          await supabase
            .from('content_items')
            .update({ status: 'review', updated_at: new Date().toISOString() })
            .eq('id', suggestion.entity_id);
          result = { new_status: 'review' };
        }
        break;

      case 'set_due_date':
        // Calculate suggested due date (7 days from now)
        const suggestedDueDate = new Date();
        suggestedDueDate.setDate(suggestedDueDate.getDate() + 7);
        
        if (suggestion.entity_type === 'content_item') {
          await supabase
            .from('content_items')
            .update({ 
              due_at: suggestedDueDate.toISOString(),
              updated_at: new Date().toISOString() 
            })
            .eq('id', suggestion.entity_id);
          result = { due_at: suggestedDueDate.toISOString() };
        }
        break;

      case 'create_content':
        // Create draft content items based on context
        if (context.gap && typeof context.gap === 'number') {
          const contentToCreate = [];
          for (let i = 0; i < Math.min(context.gap as number, 3); i++) {
            contentToCreate.push({
              title: `Novo conteúdo ${context.channel || 'Instagram'} #${i + 1}`,
              channel: context.channel || 'instagram',
              status: 'idea',
            });
          }
          
          const { data: created } = await supabase
            .from('content_items')
            .insert(contentToCreate)
            .select('id, title');
          
          result = { created_items: created };
        }
        break;

      case 'create_derived':
        // Create a derived content item from original
        if (suggestion.entity_type === 'content_item') {
          const { data: original } = await supabase
            .from('content_items')
            .select('*')
            .eq('id', suggestion.entity_id)
            .single();

          if (original) {
            const suggestedFormats = (context.suggested_formats as string[]) || ['carousel'];
            const { data: derived } = await supabase
              .from('content_items')
              .insert({
                title: `[Derivado] ${original.title}`,
                notes: `Baseado em: ${original.title}\nFormato sugerido: ${suggestedFormats[0]}`,
                format: suggestedFormats[0],
                channel: original.channel,
                status: 'idea',
              })
              .select('id, title')
              .single();

            result = { derived_item: derived };
          }
        }
        break;

      case 'copy_message':
      case 'add_comment':
        // These are UI-only actions, just mark as processed
        markAsApplied = false;
        result = { action: 'ui_only', message: 'Action handled by frontend' };
        break;

      default:
        markAsApplied = false;
        result = { warning: `Unknown action: ${action_key}` };
    }

    // Mark suggestion as applied if action was executed
    if (markAsApplied) {
      await supabase
        .from('automation_suggestions')
        .update({ 
          status: 'applied', 
          applied_at: new Date().toISOString() 
        })
        .eq('id', suggestion_id);
    }

    console.log(`[automation-handle-action] Completed action: ${action_key}`);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[automation-handle-action] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
