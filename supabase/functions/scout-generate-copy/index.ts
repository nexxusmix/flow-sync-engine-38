import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { opportunity_id, tone } = await req.json();
    if (!opportunity_id) {
      return new Response(JSON.stringify({ error: "opportunity_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch opportunity
    const { data: opp, error: oppErr } = await supabase
      .from("scout_opportunities")
      .select("*")
      .eq("id", opportunity_id)
      .single();

    if (oppErr || !opp) {
      return new Response(JSON.stringify({ error: "Oportunidade não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current max version
    const { data: existingMsgs } = await supabase
      .from("scout_messages")
      .select("version")
      .eq("opportunity_id", opportunity_id)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = (existingMsgs?.[0]?.version || 0) + 1;

    // Generate copy with Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um copywriter especialista em prospecção B2B para produtoras audiovisuais premium.
Gere uma abordagem personalizada para WhatsApp baseada no contexto da oportunidade.

REGRAS:
- Tom: ${tone || 'profissional, consultivo, sem ser invasivo'}
- Máximo 3 parágrafos curtos
- Mencionar o nome do contato se disponível
- Referenciar o contexto específico da empresa
- Incluir um CTA suave (ex: "Posso te mostrar como fazemos isso?")
- Linguagem pt-BR natural, não robótica

Retorne APENAS um JSON com a estrutura:
{
  "text_message": "mensagem para WhatsApp",
  "audio_script": "versão adaptada para narração em áudio (mais conversacional)"
}`;

    const userPrompt = `Empresa: ${opp.company_name}
Contato: ${opp.contact_name || 'Não informado'}
Cargo: ${opp.contact_role || 'Não informado'}
Contexto: ${JSON.stringify(opp.context)}
Fonte: ${opp.source}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_copy",
            description: "Generate WhatsApp approach copy",
            parameters: {
              type: "object",
              properties: {
                text_message: { type: "string", description: "WhatsApp message text" },
                audio_script: { type: "string", description: "Audio narration script" },
              },
              required: ["text_message", "audio_script"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_copy" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: `Erro na IA: ${aiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let generated: { text_message: string; audio_script: string };

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      generated = JSON.parse(toolCall.function.arguments);
    } catch {
      // Fallback: try parsing content directly
      try {
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        generated = jsonMatch ? JSON.parse(jsonMatch[0]) : { text_message: content, audio_script: content };
      } catch {
        return new Response(JSON.stringify({ error: "Falha ao processar resposta da IA" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Deactivate old versions
    await supabase
      .from("scout_messages")
      .update({ is_active: false })
      .eq("opportunity_id", opportunity_id);

    // Insert new message version
    const { data: newMsg, error: msgErr } = await supabase
      .from("scout_messages")
      .insert({
        opportunity_id,
        workspace_id: opp.workspace_id,
        version: nextVersion,
        text_message: generated.text_message,
        audio_script: generated.audio_script,
        is_active: true,
        created_by: userId,
      })
      .select()
      .single();

    if (msgErr) {
      console.error("Insert message error:", msgErr);
      return new Response(JSON.stringify({ error: "Erro ao salvar mensagem" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update opportunity status
    await supabase
      .from("scout_opportunities")
      .update({ status: "COPY_READY" })
      .eq("id", opportunity_id);

    return new Response(JSON.stringify({ success: true, message: newMsg }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scout-generate-copy error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
