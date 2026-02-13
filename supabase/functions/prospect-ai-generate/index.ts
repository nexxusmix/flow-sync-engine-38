import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TONE_PROFILE = `
PERFIL DE TOM: SQUAD / Matheus (WhatsApp)
- Mensagens curtas, humanas, sem formalidade excessiva
- Palavras OK: "oi", "tudo bem?", "massa", "perfeito", "vamos", "fechou", "top"
- Palavras PROIBIDAS: "Atenciosamente", "Prezado", "Venho por meio desta", "Neste sentido"
- Estrutura: 1) saudação + nome 2) contexto em 1 linha 3) pedido/ação 4) CTA simples
- Emojis: 0-2, pontuais (✅ 👇 ⏳)
- Follow-up: "passando rapidinho…" / "pra não deixar cair…" / "só confirmando…"
- Máximo: 5 linhas por variante curta, 8 linhas por variante média
`;

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

    const { command, prospect_id, opportunity_id, context, custom_prompt } = await req.json();

    if (!command) {
      return new Response(JSON.stringify({ error: "command obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch prospect/opportunity data for context
    let prospectData: any = null;
    let opportunityData: any = null;

    if (prospect_id) {
      const { data } = await supabase.from("prospects").select("*").eq("id", prospect_id).single();
      prospectData = data;
    }

    if (opportunity_id) {
      const { data } = await supabase
        .from("prospect_opportunities")
        .select("*, prospects(*)")
        .eq("id", opportunity_id)
        .single();
      opportunityData = data;
      if (!prospectData && data?.prospects) prospectData = data.prospects;
    }

    // Fetch recent activities for context
    let recentActivities: any[] = [];
    if (opportunity_id) {
      const { data } = await supabase
        .from("prospect_activities")
        .select("*")
        .eq("opportunity_id", opportunity_id)
        .order("created_at", { ascending: false })
        .limit(5);
      recentActivities = data || [];
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt based on command
    let systemPrompt = TONE_PROFILE + "\n\n";
    let toolSchema: any;

    switch (command) {
      case "generate_message":
        systemPrompt += `Você é um consultor de vendas da SQUAD (produtora audiovisual premium).
Gere 3 variantes de mensagem WhatsApp para prospecção:
1) "curta" — 1-3 linhas, direto ao ponto
2) "media" — 3-5 linhas, com contexto
3) "firme" — 3-5 linhas, tom mais assertivo com prazo

Cada variante deve incluir: saudação personalizada, contexto, CTA.
Também gere um "audio_script" — versão conversacional para narração.`;
        toolSchema = {
          name: "generate_messages",
          description: "Generate 3 WhatsApp message variants + audio script",
          parameters: {
            type: "object",
            properties: {
              variant_curta: { type: "string", description: "Short variant (1-3 lines)" },
              variant_media: { type: "string", description: "Medium variant (3-5 lines)" },
              variant_firme: { type: "string", description: "Assertive variant with deadline" },
              audio_script: { type: "string", description: "Conversational script for audio narration" },
              subject_hint: { type: "string", description: "Short subject/topic of the approach" },
            },
            required: ["variant_curta", "variant_media", "variant_firme", "audio_script", "subject_hint"],
            additionalProperties: false,
          },
        };
        break;

      case "plan_campaign":
        systemPrompt += `Você é um estrategista de prospecção B2B.
Crie um plano de campanha completo com:
- Objetivo (reunião/orçamento/diagnóstico)
- Cadência de contatos (dias/horários)
- 3 abordagens diferentes (A/B/C)
- Avaliação de risco de spam
- Melhor canal e horário sugerido`;
        toolSchema = {
          name: "plan_campaign",
          description: "Create a complete prospecting campaign plan",
          parameters: {
            type: "object",
            properties: {
              objective: { type: "string" },
              cadence_steps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day_offset: { type: "number" },
                    channel: { type: "string", enum: ["whatsapp", "email", "call", "instagram"] },
                    action: { type: "string" },
                    template_hint: { type: "string" },
                  },
                  required: ["day_offset", "channel", "action"],
                },
              },
              approaches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    angle: { type: "string" },
                    first_message: { type: "string" },
                  },
                  required: ["label", "angle", "first_message"],
                },
              },
              spam_risk: { type: "string", enum: ["low", "medium", "high"] },
              best_channel: { type: "string" },
              best_time: { type: "string" },
              notes: { type: "string" },
            },
            required: ["objective", "cadence_steps", "approaches", "spam_risk", "best_channel", "best_time"],
            additionalProperties: false,
          },
        };
        break;

      case "lead_summary":
        systemPrompt += `Analise o lead e retorne um resumo inteligente:
- Quem é, o que faz, por que é bom pra nós
- Última interação
- Próxima ação recomendada
- Probabilidade de fechamento (0-100)
- O que evitar / como abordar`;
        toolSchema = {
          name: "lead_summary",
          description: "Generate intelligent lead summary",
          parameters: {
            type: "object",
            properties: {
              who: { type: "string" },
              why_good_fit: { type: "string" },
              last_interaction: { type: "string" },
              next_action: { type: "string" },
              close_probability: { type: "number" },
              approach_tips: { type: "string" },
              avoid: { type: "string" },
            },
            required: ["who", "why_good_fit", "next_action", "close_probability", "approach_tips"],
            additionalProperties: false,
          },
        };
        break;

      case "respond_objection":
        systemPrompt += `O lead levantou uma objeção. Gere 3 respostas WhatsApp:
1) "empática" — entende e redireciona
2) "valor" — mostra o valor/ROI
3) "urgência" — cria senso de oportunidade

Contexto da objeção: ${context?.objection || "não especificada"}`;
        toolSchema = {
          name: "respond_objection",
          description: "Generate 3 objection response variants",
          parameters: {
            type: "object",
            properties: {
              response_empatica: { type: "string" },
              response_valor: { type: "string" },
              response_urgencia: { type: "string" },
            },
            required: ["response_empatica", "response_valor", "response_urgencia"],
            additionalProperties: false,
          },
        };
        break;

      case "followup":
        systemPrompt += `Gere uma mensagem de follow-up para WhatsApp.
Tipo: ${context?.followup_type || "silêncio"}
Dias desde último contato: ${context?.days_since_contact || "desconhecido"}
Mantenha curto e humano.`;
        toolSchema = {
          name: "generate_followup",
          description: "Generate follow-up message",
          parameters: {
            type: "object",
            properties: {
              message: { type: "string" },
              audio_script: { type: "string" },
            },
            required: ["message"],
            additionalProperties: false,
          },
        };
        break;

      default:
        // Custom/free-form
        systemPrompt += `Execute a instrução do usuário mantendo o tom SQUAD WhatsApp.\n${custom_prompt || ""}`;
        toolSchema = {
          name: "custom_output",
          description: "Custom AI output",
          parameters: {
            type: "object",
            properties: {
              output: { type: "string" },
              suggestions: { type: "array", items: { type: "string" } },
            },
            required: ["output"],
            additionalProperties: false,
          },
        };
    }

    // Build user context
    const userContext = {
      prospect: prospectData ? {
        company: prospectData.company_name,
        contact: prospectData.decision_maker_name,
        role: prospectData.decision_maker_role,
        niche: prospectData.niche,
        city: prospectData.city,
        phone: prospectData.phone,
        instagram: prospectData.instagram,
        notes: prospectData.notes,
      } : null,
      opportunity: opportunityData ? {
        title: opportunityData.title,
        stage: opportunityData.stage,
        estimated_value: opportunityData.estimated_value,
        conversation_summary: opportunityData.conversation_summary,
        objections: opportunityData.objections,
        fit_score: opportunityData.fit_score,
      } : null,
      recent_activities: recentActivities.map(a => ({
        type: a.type,
        title: a.title,
        date: a.created_at,
        outcome: a.outcome,
      })),
      extra: context || {},
    };

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
          { role: "user", content: JSON.stringify(userContext) },
        ],
        tools: [{
          type: "function",
          function: toolSchema,
        }],
        tool_choice: { type: "function", function: { name: toolSchema.name } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Erro na IA: ${aiResponse.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let result: any;

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      result = JSON.parse(toolCall.function.arguments);
    } catch {
      try {
        const content = aiData.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : { output: content };
      } catch {
        return new Response(JSON.stringify({ error: "Falha ao processar resposta da IA" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, command, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("prospect-ai-generate error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
