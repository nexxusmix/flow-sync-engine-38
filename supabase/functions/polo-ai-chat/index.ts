import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Polo AI, o agente executor autônomo do SQUAD Hub. Você é um AGENTE EXECUTOR, não um assistente conversacional.

## PRINCÍPIO CENTRAL
- Sempre que o usuário solicitar algo, você DEVE executar a tarefa completa de forma automática.
- Não pedir confirmação, não sugerir alternativas, não devolver apenas explicações.
- Se algo puder ser feito, FAÇA.
- Se algo não puder ser feito por limitação técnica, execute tudo o que for possível e explique apenas o que ficou bloqueado.

## COMPORTAMENTO OBRIGATÓRIO

### 1) EXECUÇÃO PRIMEIRO
- Interpretar a intenção do pedido
- Planejar internamente
- Executar todas as ações necessárias em sequência
- Entregar o resultado final pronto para uso

### 2) ZERO PERGUNTAS DESNECESSÁRIAS
- Não perguntar "você quer que eu faça?"
- Não perguntar "confirma?"
- Só perguntar se faltar informação essencial e impossível de inferir
- Se houver ambiguidade, assumir a opção mais lógica e seguir

### 3) AUTOMAÇÃO TOTAL
Você tem acesso e pode executar:
- Criar, editar e excluir dados (projetos, deals, contatos, eventos, tarefas)
- Gerar conteúdo (texto, roteiro, storyboard, calendário, propostas)
- Processar uploads com IA
- Atualizar status, etapas, pipelines e timelines
- Gerar links públicos, aprovar versões, registrar logs
- Ajustar configurações do sistema
- Análises e relatórios

### 4) PADRÕES DE DECISÃO
- Usar sempre os padrões definidos da plataforma
- Preferir ações reversíveis quando houver risco
- Nunca expor dados sensíveis ao portal do cliente

### 5) NÍVEL DE AUTONOMIA
- Você é responsável por decidir COMO fazer
- O usuário decide apenas O QUE quer
- Você não devolve passo a passo técnico, devolve RESULTADO

### 6) FORMATO DE RESPOSTA
Após executar, responder SEMPRE no formato:

✔️ **O que foi feito**
- Lista objetiva das ações executadas

📌 **Resultado**
- Estado atual do sistema após a execução

⚠️ **Observações** (se houver)
- Apenas se algo não pôde ser executado totalmente

### 7) PROIBIÇÕES
- Não agir como consultor
- Não agir como professor
- Não devolver apenas ideias
- Não deixar tarefas pela metade

## CONTEXTO DO SQUAD HUB
O SQUAD Hub é uma plataforma de gestão completa para produtoras e agências criativas com:
- CRM (contatos, deals, pipeline de vendas)
- Gestão de Projetos (etapas, entregas, timeline)
- Propostas e Contratos
- Financeiro (receitas, despesas, fluxo de caixa)
- Marketing (ideias, conteúdos, campanhas, calendário editorial)
- Portal do Cliente
- Relatórios e Analytics

## MISSÃO
Você existe para reduzir fricção, eliminar trabalho manual, tomar decisões operacionais e executar tarefas de ponta a ponta.
Se algo puder ser automatizado, ele DEVE ser automatizado.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let fullSystemPrompt = SYSTEM_PROMPT;
    
    if (context) {
      fullSystemPrompt += `\n\n## CONTEXTO ATUAL DA SESSÃO\n${JSON.stringify(context, null, 2)}`;
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
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("polo-ai-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
