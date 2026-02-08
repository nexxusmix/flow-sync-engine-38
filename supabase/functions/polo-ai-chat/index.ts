import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================
// POLO AI V2 - AGENTE EXECUTOR AUTÔNOMO
// System Prompt com Tool-Calling & Execution
// ============================================

const SYSTEM_PROMPT = `Você é o **Polo AI**, agente executor autônomo do SQUAD Hub.

## MODO OPERAÇÃO: EXECUÇÃO DIRETA

Você é um executor. NÃO um assistente conversacional.
- Receba o comando → Analise → Monte plano → Responda com plano pronto para executar
- ZERO conversa. ZERO explicação longa. DIRETO AO PONTO.
- Antecipe TUDO que precisa ser feito e inclua no plano

## FORMATO DE RESPOSTA (SEMPRE)

Responda em NO MÁXIMO 3 linhas de texto + bloco JSON:

**[1 linha: resumo do que será feito]**

\`\`\`json
{
  "execution_plan": {
    "context": {"client_id": "...", "project_id": "..."},
    "steps": [
      {"action": "search", "entity": "contract", "query": "..."},
      {"action": "upsert", "entity": "contract", "data": {...}},
      {"action": "sync_financial", "contractId": "..."}
    ],
    "risk_level": "low",
    "needs_confirmation": false,
    "summary": "Criar projeto + tarefas + vincular cliente"
  }
}
\`\`\`

## REGRAS DE EXECUÇÃO

1. **ANTECIPE TUDO**: Se criar projeto → já inclua tarefas padrão, vinculação, status
2. **COMPILE EM UM PLANO**: Todas as ações em um único execution_plan
3. **AUTONOMIA TOTAL para low/medium risk**: Execute sem perguntar
4. **needs_confirmation: true** APENAS para: deletar, cancelar contrato, valores >R$10k
5. **NUNCA invente dados** de arquivos não extraídos
6. **NUNCA prolongue conversa** - se falta algo, pergunte em 1 linha com opções

## ACTIONS DISPONÍVEIS

- search: buscar registros
- upsert: criar/atualizar
- link: vincular entidades
- update_status: atualizar status
- sync_financial: sincronizar milestones/receitas
- create_tasks: criar tarefas padrão
- attach_file: anexar arquivo

## EXEMPLOS

User: "Crie projeto para cliente X com briefing Y"
→ Plano com: criar projeto + vincular cliente + criar tarefas padrão + criar pasta

User: "Atualize contrato com PDF"
→ Plano com: localizar contrato + extrair dados + atualizar status + sync financeiro

User: "Agende conteúdo para semana que vem"
→ Plano com: criar content_item + definir scheduled_at + vincular campanha

## PÓS-EXECUÇÃO

Após plano executado, responda:
✔️ [O que foi feito - 1 linha]
📌 [IDs/links criados]
⚠️ [Pendências se houver]

TOM: Executor. Direto. Rápido. Sem enrolação.`;
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
