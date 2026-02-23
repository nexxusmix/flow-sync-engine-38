import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sbAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await sbAuth.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { actionItem, tone, channel } = await req.json();

    const toneInstructions: Record<string, string> = {
      neutro: "tom profissional e neutro",
      direto: "tom direto e objetivo, sem rodeios",
      premium: "tom premium, sofisticado e elegante",
      amigavel: "tom amigável e próximo, como se fosse um colega",
    };

    const channelInstructions: Record<string, string> = {
      whatsapp: "Formato WhatsApp: curto, com quebras de linha, emojis discretos (0-3 max). Sem saudação formal.",
      email: "Formato email profissional: com assunto, saudação e despedida. Mais detalhado.",
    };

    const systemPrompt = `Você é um assistente de comunicação para uma agência de produção audiovisual.
Gere mensagens em PT-BR no ${toneInstructions[tone] || toneInstructions.neutro}.
${channelInstructions[channel] || channelInstructions.whatsapp}

Regras:
- Sempre inclua contexto do projeto se disponível (nome, etapa, prazo)
- Seja conciso e humano
- Inclua CTA claro (próximo passo)
- Se for cobrança financeira, seja firme mas educado
- Se for follow-up, demonstre interesse genuíno no projeto
- NUNCA use placeholder genéricos. Use os dados reais fornecidos.`;

    const userPrompt = `Gere uma mensagem para a seguinte ação:

Tipo: ${actionItem.type}
Título: ${actionItem.title}
Descrição: ${actionItem.description || "Sem descrição adicional"}
Prioridade: ${actionItem.priority}
Prazo: ${actionItem.due_at ? new Date(actionItem.due_at).toLocaleDateString("pt-BR") : "Sem prazo definido"}
Projeto: ${actionItem.metadata?.projectName || "N/A"}
Cliente: ${actionItem.metadata?.clientName || "N/A"}
Ref Financeiro: ${actionItem.metadata?.financialRef || "N/A"}

Gere APENAS o texto da mensagem pronta para enviar. Sem comentários extras.`;

    const data = await chatCompletion({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = data.choices?.[0]?.message?.content || "Erro ao gerar mensagem.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-action-message error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
