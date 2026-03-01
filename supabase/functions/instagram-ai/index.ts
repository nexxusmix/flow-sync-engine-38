import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate_content": {
        const { topic, format, pillar, tone, duration } = data;
        systemPrompt = `Você é o diretor de conteúdo da SQUAD Film, uma produtora audiovisual premium de Brasília/DF especializada em imóveis de luxo, cavalos e veículos premium.

Estilo da marca: cinematográfico, aspiracional, técnico mas acessível. Tipografia bold, paleta escura com acentos em azul ciano (#009CCA).

Equipamento principal: Sony FX3. Pós-produção com color grading cinematográfico.

Gere SEMPRE em português do Brasil. Seja direto e impactante.`;

        userPrompt = `Gere um pacote completo de conteúdo Instagram para a SQUAD Film:

Tema: ${topic}
Formato: ${format || 'reel'}
Pilar: ${pillar || 'autoridade'}
Tom: ${tone || 'cinematográfico'}
${duration ? `Duração: ${duration}s` : ''}

Retorne um JSON com a estrutura exata (sem markdown, só JSON puro):
{
  "hook": "frase de hook dos primeiros 3 segundos",
  "script": "roteiro completo com marcações de tempo",
  "caption_short": "legenda curta até 3 linhas",
  "caption_medium": "legenda média com storytelling 1 parágrafo",
  "caption_long": "legenda longa com narrativa completa e CTA",
  "cta": "chamada para ação",
  "pinned_comment": "comentário fixado sugerido",
  "hashtags": ["hashtag1", "hashtag2", "...até 15 hashtags estratégicas do nicho"],
  "cover_suggestion": "descrição da capa/thumbnail ideal",
  "carousel_slides": [{"title": "título slide", "body": "corpo slide"}],
  "story_sequence": [{"text": "texto", "media_type": "foto/video/boomerang", "interactive": "enquete/pergunta/null"}]
}`;
        break;
      }

      case "generate_hooks": {
        const { category, count } = data;
        systemPrompt = `Você é um copywriter especialista em hooks virais para Instagram no nicho audiovisual premium e imobiliário de luxo. Gere hooks em português do Brasil.`;
        userPrompt = `Gere ${count || 5} hooks de alto impacto para Reels da SQUAD Film.
Categoria: ${category || 'autoridade'}

Para cada hook, avalie de 0 a 100 baseado em: clareza (25pts), especificidade (25pts), tensão emocional (25pts), promessa implícita (25pts).

Retorne JSON puro (sem markdown):
[{"hook_text": "...", "hook_score": 85, "score_breakdown": {"clarity": 22, "specificity": 20, "emotion": 23, "promise": 20}, "category": "${category || 'autoridade'}", "format": "reel"}]`;
        break;
      }

      case "analyze_profile": {
        const { handle, bio, followers, posts_count, avg_engagement } = data;
        systemPrompt = `Você é um consultor de posicionamento digital premium. Analise perfis de Instagram de produtoras audiovisuais de luxo.`;
        userPrompt = `Analise o perfil Instagram da SQUAD Film:
Handle: @${handle || 'squadfilme'}
Bio atual: ${bio || 'Ei! Somos a SQUAD Film. Uma produtora de fotos e vídeos com sede no DF/GO'}
Seguidores: ${followers || 70}
Posts: ${posts_count || 8}
Engajamento médio: ${avg_engagement || 3.2}%

Retorne JSON puro (sem markdown):
{
  "score": 0-100,
  "breakdown": {
    "visual_consistency": {"score": 0-100, "note": "..."},
    "frequency": {"score": 0-100, "note": "..."},
    "engagement": {"score": 0-100, "note": "..."},
    "positioning": {"score": 0-100, "note": "..."},
    "conversion": {"score": 0-100, "note": "..."}
  },
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "bio_suggestions": [
    {"focus": "autoridade técnica", "text": "..."},
    {"focus": "resultado para cliente", "text": "..."},
    {"focus": "identidade de marca", "text": "..."}
  ],
  "recommendations": ["..."]
}`;
        break;
      }

      case "generate_calendar": {
        const { pillars, posts_per_week, projects, weeks } = data;
        systemPrompt = `Você é um estrategista de conteúdo Instagram para produtoras audiovisuais premium. Crie calendários editoriais estratégicos.`;
        userPrompt = `Gere um calendário editorial de ${weeks || 4} semanas para a SQUAD Film.

Posts por semana: ${posts_per_week || 3}
Pilares de conteúdo: ${JSON.stringify(pillars || ['autoridade', 'portfolio', 'bastidores', 'social_proof'])}
Projetos ativos: ${JSON.stringify(projects || [])}

Retorne JSON puro (sem markdown):
[{
  "week": 1,
  "posts": [{
    "day_of_week": "segunda",
    "title": "...",
    "format": "reel/carousel/story",
    "pillar": "...",
    "objective": "awareness/leads/authority/engagement",
    "hook": "...",
    "brief": "descrição curta do conteúdo",
    "project_reference": "nome do projeto ou null"
  }]
}]`;
        break;
      }

      case "generate_projections": {
        const { current_frequency, avg_engagement: eng, followers: foll, ticket_medio } = data;
        systemPrompt = `Você é um analista de growth marketing para Instagram. Faça projeções realistas baseadas em benchmarks do nicho audiovisual premium.`;
        userPrompt = `Faça projeções de crescimento para a SQUAD Film no Instagram:

Frequência atual: ${current_frequency || 1} posts/semana
Engajamento médio: ${eng || 3.2}%
Seguidores: ${foll || 70}
Ticket médio dos projetos: R$ ${ticket_medio || 15000}

Retorne JSON puro (sem markdown):
{
  "current_pace": {
    "leads_per_month": 0,
    "growth_rate": 0,
    "projected_followers_30d": 0,
    "projected_followers_90d": 0
  },
  "optimized_pace": {
    "recommended_frequency": 0,
    "leads_per_month": 0,
    "growth_rate": 0,
    "projected_followers_30d": 0,
    "projected_followers_90d": 0,
    "projected_revenue_90d": 0
  },
  "insights": ["..."],
  "quick_wins": ["..."]
}`;
        break;
      }

      case "generate_from_context": {
        const { topic, format: fmt, pillar, command, reference_url, file_content, field } = data;
        systemPrompt = `Você é o diretor de conteúdo da SQUAD Film, uma produtora audiovisual premium de Brasília/DF especializada em imóveis de luxo, cavalos e veículos premium.

Estilo da marca: cinematográfico, aspiracional, técnico mas acessível. Tipografia bold, paleta escura com acentos em azul ciano (#009CCA).

Equipamento principal: Sony FX3. Pós-produção com color grading cinematográfico.

Gere SEMPRE em português do Brasil. Seja direto e impactante.`;

        let contextBlock = "";
        if (command) contextBlock += `\nINSTRUÇÃO DO USUÁRIO: ${command}`;
        if (reference_url) contextBlock += `\nLINK DE REFERÊNCIA (use como contexto/inspiração): ${reference_url}`;
        if (file_content) contextBlock += `\nCONTEÚDO DE ARQUIVO ENVIADO:\n${file_content.substring(0, 4000)}`;

        if (field) {
          // Single field regeneration
          const fieldMap: Record<string, string> = {
            hook: "hook (frase impactante dos primeiros 3 segundos)",
            script: "roteiro completo com marcações de tempo",
            caption_short: "legenda curta até 3 linhas",
            caption_medium: "legenda média com storytelling 1 parágrafo",
            caption_long: "legenda longa com narrativa completa e CTA",
            cta: "chamada para ação",
            pinned_comment: "comentário fixado sugerido",
            hashtags: "array de até 15 hashtags estratégicas",
            cover_suggestion: "descrição da capa/thumbnail ideal",
          };
          userPrompt = `Gere APENAS o campo "${field}" para um post Instagram da SQUAD Film:

Tema: ${topic || 'conteúdo audiovisual premium'}
Formato: ${fmt || 'reel'}
Pilar: ${pillar || 'autoridade'}
${contextBlock}

Retorne JSON puro (sem markdown) com APENAS a chave solicitada:
{"${field}": ${field === 'hashtags' ? '["hashtag1", "hashtag2"]' : '"valor gerado"'}}`;
        } else {
          userPrompt = `Gere um pacote completo de conteúdo Instagram para a SQUAD Film:

Tema: ${topic || 'conteúdo audiovisual premium'}
Formato: ${fmt || 'reel'}
Pilar: ${pillar || 'autoridade'}
${contextBlock}

Retorne um JSON com a estrutura exata (sem markdown, só JSON puro):
{
  "hook": "frase de hook dos primeiros 3 segundos",
  "script": "roteiro completo com marcações de tempo",
  "caption_short": "legenda curta até 3 linhas",
  "caption_medium": "legenda média com storytelling 1 parágrafo",
  "caption_long": "legenda longa com narrativa completa e CTA",
  "cta": "chamada para ação",
  "pinned_comment": "comentário fixado sugerido",
  "hashtags": ["hashtag1", "hashtag2", "...até 15 hashtags estratégicas do nicho"],
  "cover_suggestion": "descrição da capa/thumbnail ideal",
  "carousel_slides": [{"title": "título slide", "body": "corpo slide"}],
  "story_sequence": [{"text": "texto", "media_type": "foto/video/boomerang", "interactive": "enquete/pergunta/null"}]
}`;
        }
        break;
      }

      case "setup_profile": {
        const { handle, niche, sub_niche, target_audience, brand_voice, command, reference_url, file_content } = data;
        systemPrompt = `Você é um consultor estratégico de Instagram para produtoras audiovisuais premium. Gere configurações completas de perfil com base no nicho e posicionamento fornecido. Sempre em português do Brasil.`;

        let contextBlock = "";
        if (command) contextBlock += `\nINSTRUÇÃO DO USUÁRIO: ${command}`;
        if (reference_url) contextBlock += `\nLINK DE REFERÊNCIA (use como contexto/inspiração): ${reference_url}`;
        if (file_content) contextBlock += `\nCONTEÚDO DE ARQUIVO ENVIADO:\n${String(file_content).substring(0, 4000)}`;

        userPrompt = `Configure o perfil Instagram de uma produtora audiovisual premium com base nos dados:

Handle: @${handle || 'squadfilme'}
Nicho: ${niche || 'produção audiovisual premium'}
Sub-nicho: ${sub_niche || 'imóveis de luxo, cavalos, veículos premium'}
Público-alvo: ${target_audience || 'incorporadoras, haras, concessionárias de luxo em Brasília/DF e GO'}
Tom de voz: ${brand_voice || 'cinematográfico, aspiracional, técnico mas acessível'}
${contextBlock}

Retorne JSON puro (sem markdown):
{
  "profile_name": "nome de exibição do perfil",
  "niche": "nicho principal",
  "sub_niche": "sub-nicho específico",
  "target_audience": "descrição detalhada do público-alvo",
  "brand_voice": "tom de voz detalhado da marca",
  "bio_current": "bio otimizada para o perfil (máx 150 chars)",
  "bio_suggestions": [
    {"focus": "autoridade técnica", "text": "bio alternativa 1"},
    {"focus": "resultado para cliente", "text": "bio alternativa 2"},
    {"focus": "identidade de marca", "text": "bio alternativa 3"}
  ],
  "content_pillars": [
    {"key": "autoridade", "label": "Autoridade", "description": "o que postar nesse pilar"},
    {"key": "portfolio", "label": "Portfólio", "description": "o que postar nesse pilar"},
    {"key": "bastidores", "label": "Bastidores", "description": "o que postar nesse pilar"},
    {"key": "social_proof", "label": "Prova Social", "description": "o que postar nesse pilar"}
  ],
  "posting_frequency": {"posts_per_week": 4, "best_days": ["segunda", "quarta", "sexta"], "best_times": ["10:00", "18:00"]},
  "competitors": [{"handle": "@concorrente1", "note": "o que fazem bem"}, {"handle": "@concorrente2", "note": "o que fazem bem"}],
  "strategic_briefing": {
    "positioning": "frase de posicionamento",
    "differentials": ["diferencial 1", "diferencial 2"],
    "content_strategy": "resumo da estratégia de conteúdo",
    "growth_levers": ["alavanca 1", "alavanca 2"]
  }
}`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Try to parse as JSON
    let parsed: any = null;
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("instagram-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
