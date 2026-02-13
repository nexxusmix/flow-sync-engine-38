import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let prompt: string;

    if (body.refine) {
      // Refine existing content
      const actionMap: Record<string, string> = {
        rewrite: "Reescreva completamente mantendo o mesmo objetivo e tom.",
        shorter: "Encurte para no máximo 3 frases mantendo a essência.",
        formal: "Torne mais formal e profissional.",
        human: "Torne mais humano, empático e caloroso.",
        add_cta: "Adicione uma chamada para ação clara no final.",
      };
      prompt = `${actionMap[body.action] || "Melhore o texto."}\n\nTexto atual:\n${body.currentContent}\n\nFormato: ${body.format || 'whatsapp'}\nTom: ${body.tone || 'profissional'}\n\nRetorne APENAS o texto final, sem explicações.`;
    } else {
      // Generate new content
      const objectiveMap: Record<string, string> = {
        cobrar_material: "Cobrar entrega de materiais pendentes do cliente de forma educada mas firme",
        lembrar_revisao: "Lembrar o cliente que há uma entrega aguardando revisão/aprovação",
        confirmar_reuniao: "Confirmar reunião agendada e perguntar se está confirmado",
        cobrar_pagamento: "Cobrar pagamento pendente de forma educada mas firme",
        status_update: "Enviar atualização sobre o andamento do projeto",
        responder_cliente: "Responder uma mensagem ou demanda do cliente",
        followup: "Fazer follow-up geral para manter o relacionamento ativo",
      };

      const formatInstructions: Record<string, string> = {
        whatsapp: "Formato WhatsApp: curto (máx 4 linhas), direto, com emoji quando apropriado. Sem assunto.",
        email: "Formato Email: com cumprimento, corpo profissional, e assinatura. Pode ser mais detalhado.",
        portal: "Formato Portal: mensagem curta e orientada a ação, sem formalidades excessivas.",
      };

      const toneMap: Record<string, string> = {
        profissional: "Tom profissional, respeitoso, objetivo",
        amigavel: "Tom amigável, próximo, com leveza",
        direto: "Tom direto e curto, sem rodeios",
        vip: "Tom premium, sofisticado, como atendimento VIP exclusivo",
      };

      prompt = `Gere uma mensagem para o seguinte cenário:

OBJETIVO: ${objectiveMap[body.objective] || body.objective}
TOM: ${toneMap[body.tone] || body.tone}
${formatInstructions[body.format] || ""}

${body.alertTitle ? `ALERTA: ${body.alertTitle}` : ""}
${body.alertMessage ? `DETALHE: ${body.alertMessage}` : ""}
${body.projectContext ? `CONTEXTO DO PROJETO: ${body.projectContext}` : ""}
${body.meta ? `DADOS EXTRAS: ${JSON.stringify(body.meta)}` : ""}

REGRAS:
- NUNCA invente dados (nomes, valores, datas) que não foram fornecidos
- Use placeholders como [NOME_CLIENTE], [DATA], [VALOR] quando necessário
- Retorne APENAS o texto da mensagem, sem explicações ou markdown`;
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Você é um assistente de comunicação empresarial. Gera mensagens profissionais em PT-BR para empresas de produção audiovisual/marketing. Sempre responda apenas com o texto da mensagem, sem explicações." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit, tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content: content.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-compose-alert error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
