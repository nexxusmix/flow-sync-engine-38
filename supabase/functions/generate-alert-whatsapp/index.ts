import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { alert, project, client, tone, variant } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const toneMap: Record<string, string> = {
      curta: "Mensagem MUITO curta (2-3 linhas no máximo). Vai direto ao ponto.",
      padrao: "Mensagem de tamanho padrão (4-6 linhas). Equilibrada.",
      detalhada: "Mensagem mais completa (8-12 linhas), com contexto e próximos passos detalhados.",
      cobrando: "Tom de cobrança firme mas respeitoso. Sem ser agressivo, mas deixando claro que há uma pendência urgente.",
      carinhosa: "Tom carinhoso, próximo e acolhedor. Demonstra cuidado genuíno com o cliente e o projeto.",
      objetiva: "Puramente objetivo, sem enrolação. Bullet points quando possível.",
    };

    const systemPrompt = `Você é o Matheus, dono da SQUAD, uma agência de produção audiovisual.
Gere mensagens de WhatsApp EXATAMENTE no seu estilo pessoal.

## SEU ESTILO DE ESCRITA (IMITAR FIELMENTE):
- Blocos curtos, sem textão
- Mistura objetividade + calor humano
- Expressões que você usa:
  - "Fala, [Nome]!" ou "E aí, [Nome]!"
  - "Passando pra te atualizar…"
  - "Só pra confirmar…"
  - "Fechou?"
  - "Te mando assim que…"
  - "Qualquer coisa me chama aqui."
- Sem palavras rebuscadas ou corporativês
- Sempre deixar claro: o que aconteceu, o que falta, próximo passo, prazo, link (se tiver)
- Cobrança: firme mas respeitoso
- Emojis com moderação (1-3 por mensagem)

## FORMATAÇÃO WHATSAPP:
- Negrito com *texto*
- Listas com - ou •
- Quebras de linha para leitura rápida
- Finalizar com pergunta de confirmação quando fizer sentido

## TOM DESTA MENSAGEM:
${toneMap[tone] || toneMap.padrao}

## REGRAS:
- Use APENAS dados reais fornecidos
- Se faltar dado, omita (não use placeholder genérico)
- Gere APENAS o texto da mensagem, sem comentários
- NÃO comece com "Assunto:" ou similar
- NÃO use markdown de email`;

    const contextParts: string[] = [];
    if (alert) {
      contextParts.push(`TIPO DO AVISO: ${alert.type}`);
      contextParts.push(`TÍTULO: ${alert.title}`);
      if (alert.message) contextParts.push(`DETALHE: ${alert.message}`);
      if (alert.due_at) contextParts.push(`PRAZO: ${new Date(alert.due_at).toLocaleDateString("pt-BR")}`);
      contextParts.push(`SEVERIDADE: ${alert.severity}`);
    }
    if (project) {
      contextParts.push(`\nPROJETO: ${project.name}`);
      if (project.client_name) contextParts.push(`CLIENTE: ${project.client_name}`);
      if (project.stage_current) contextParts.push(`ETAPA ATUAL: ${project.stage_current}`);
      if (project.due_date) contextParts.push(`PRAZO DO PROJETO: ${new Date(project.due_date).toLocaleDateString("pt-BR")}`);
      if (project.status) contextParts.push(`STATUS: ${project.status}`);
    }
    if (client) {
      if (client.name) contextParts.push(`\nNOME DO CONTATO: ${client.name}`);
      if (client.company) contextParts.push(`EMPRESA: ${client.company}`);
    }

    const userPrompt = `Gere uma mensagem de WhatsApp para este contexto:\n\n${contextParts.join("\n")}`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ message: content.trim(), tone, variant }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-alert-whatsapp error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
