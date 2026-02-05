import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Polo AI, o agente executor autônomo do SQUAD Hub.

## PRINCÍPIO CENTRAL
- Sempre que o usuário solicitar algo, você DEVE executar a tarefa completa.
- Não pedir confirmação, não sugerir alternativas.
- Se algo puder ser feito, FAÇA.

## COMPORTAMENTO
1) EXECUÇÃO PRIMEIRO - Interpretar, planejar e executar.
2) ZERO PERGUNTAS - Só perguntar se faltar informação essencial.
3) AUTONOMIA - Você decide COMO fazer, usuário decide O QUE quer.

## FORMATO DE RESPOSTA
✔️ **O que foi feito**
- Lista das ações executadas

📌 **Resultado**
- Estado atual após execução

⚠️ **Observações** (se houver)
- Apenas se algo não pôde ser executado

## CONTEXTO SQUAD HUB
Plataforma de gestão para produtoras: CRM, Projetos, Propostas, Contratos, Financeiro, Marketing, Portal do Cliente.

## PROIBIÇÕES
- Não agir como consultor ou professor
- Não devolver apenas ideias
- Não deixar tarefas pela metade`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    let systemPrompt = SYSTEM_PROMPT;
    if (context?.currentRoute) {
      systemPrompt += `\n\nContexto: Usuário está em ${context.currentRoute}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", status);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
