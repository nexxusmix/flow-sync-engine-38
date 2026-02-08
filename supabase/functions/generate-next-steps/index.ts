import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  action_key: string;
  entity_type: string;
  entity_id?: string;
  context?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action_key, entity_type, entity_id, context }: GenerateRequest = await req.json();

    console.log(`[generate-next-steps] Action: ${action_key}, Entity: ${entity_type}/${entity_id}`);

    let entityData: Record<string, unknown> | null = null;

    // Fetch entity data if needed
    if (entity_id && entity_type === 'content_item') {
      const { data } = await supabase
        .from('content_items')
        .select('*')
        .eq('id', entity_id)
        .single();
      entityData = data;
    }

    // Build prompt based on action
    let systemPrompt = '';
    let userPrompt = '';

    switch (action_key) {
      case 'generate_checklist':
        systemPrompt = `Você é um assistente de produção de conteúdo. Gere uma checklist prática de próximos passos para avançar um conteúdo parado. Seja objetivo e acionável. Responda em JSON com formato: { "checklist": [{ "title": "...", "priority": "high|medium|low" }], "tip": "..." }`;
        userPrompt = `Conteúdo: "${entityData?.title || 'Sem título'}"
Status atual: ${entityData?.status || context?.current_status || 'desconhecido'}
Dias parado: ${context?.days_stalled || 'alguns'}
Formato: ${entityData?.format || 'não definido'}

Gere 3-5 próximos passos práticos para destravar este conteúdo.`;
        break;

      case 'generate_followup':
        systemPrompt = `Você é um assistente de comunicação profissional. Gere uma mensagem educada de follow-up para solicitar aprovação de um conteúdo. Seja cordial mas objetivo. Responda em JSON com formato: { "message": "...", "subject": "...", "alternative": "..." }`;
        userPrompt = `Conteúdo: "${entityData?.title || 'Sem título'}"
Aguardando aprovação há: ${context?.days_stuck || 'alguns'} dias

Gere uma mensagem de follow-up profissional e educada.`;
        break;

      case 'generate_ideas':
        systemPrompt = `Você é um estrategista de conteúdo criativo. Gere ideias de conteúdo para preencher uma lacuna no calendário. Responda em JSON com formato: { "ideas": [{ "title": "...", "hook": "...", "format": "..." }] }`;
        userPrompt = `Canal: ${context?.channel || 'Instagram'}
Semana: ${context?.week_start ? new Date(context.week_start as string).toLocaleDateString('pt-BR') : 'próxima semana'}
Posts faltando: ${context?.gap || 'alguns'}

Gere ${Math.min((context?.gap as number) || 3, 5)} ideias de conteúdo relevantes para este canal.`;
        break;

      case 'generate_variations':
        systemPrompt = `Você é um especialista em repurposing de conteúdo. Sugira formas de reaproveitar um conteúdo existente em novos formatos. Responda em JSON com formato: { "variations": [{ "format": "...", "title": "...", "description": "...", "hook": "..." }] }`;
        userPrompt = `Conteúdo original: "${entityData?.title || 'Sem título'}"
Formato original: ${entityData?.format || context?.original_format || 'vídeo'}
Formatos sugeridos: ${(context?.suggested_formats as string[])?.join(', ') || 'carousel, reels'}

Gere variações criativas deste conteúdo nos formatos sugeridos.`;
        break;

      default:
        throw new Error(`Unknown action_key: ${action_key}`);
    }

    // Call Lovable AI
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
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = { raw: content };
    }

    console.log(`[generate-next-steps] Generated output for ${action_key}`);

    return new Response(
      JSON.stringify({ success: true, output: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-next-steps] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
