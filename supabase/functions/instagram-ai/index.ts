import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chatCompletion } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, data } = await req.json();

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

      case "analyze_insights": {
        const { text_input, file_content: fc, command: cmd, profile_context } = data;
        systemPrompt = `Você é um analista de dados e estrategista de Instagram de alto nível. Analise dados de Insights do Instagram fornecidos (textos, dados numéricos, prints, relatórios) e gere um relatório estratégico completo. Sempre em português do Brasil. Seja extremamente detalhado e acionável.`;

        let insightsContext = "";
        if (cmd) insightsContext += `\nCOMANDO DO USUÁRIO: ${cmd}`;
        if (text_input) insightsContext += `\nDADOS DE INSIGHTS FORNECIDOS:\n${text_input.substring(0, 6000)}`;
        if (fc) insightsContext += `\nCONTEÚDO DE ARQUIVOS:\n${String(fc).substring(0, 6000)}`;
        if (profile_context) insightsContext += `\nCONTEXTO DO PERFIL:\nHandle: @${profile_context.handle}\nNicho: ${profile_context.niche}\nSeguidores: ${profile_context.followers}\nPosts: ${profile_context.posts_count}\nEngajamento: ${profile_context.avg_engagement}%`;

        userPrompt = `Analise os dados de Insights do Instagram abaixo e gere um relatório estratégico completo:
${insightsContext}

Retorne JSON puro (sem markdown) com a estrutura exata:
{
  "diagnosis": {
    "summary": "resumo executivo do estado atual do perfil em 3-5 linhas",
    "health_score": 0-100,
    "key_metrics": [{"label": "nome da métrica", "value": "valor", "trend": "up/down/stable", "note": "observação"}],
    "period_comparison": {"current": "descrição período atual", "previous": "descrição período anterior", "change_pct": 0}
  },
  "priority_actions": [
    {"priority": 1, "title": "ação concreta", "description": "como executar", "impact": "alto/médio/baixo", "effort": "alto/médio/baixo", "deadline": "prazo sugerido"}
  ],
  "suggested_calendar": [
    {"day": "segunda", "time": "10:00", "format": "reel/carousel/story", "topic": "tema", "pillar": "pilar", "hook": "hook sugerido", "objective": "objetivo"}
  ],
  "projections": {
    "followers_30d": 0,
    "followers_90d": 0,
    "engagement_trend": "descrição da tendência",
    "reach_trend": "descrição da tendência",
    "revenue_potential": "estimativa de potencial de conversão",
    "growth_scenarios": [{"scenario": "conservador/otimista/agressivo", "followers_90d": 0, "actions_needed": "o que fazer"}]
  },
  "content_guidance": {
    "best_formats": [{"format": "reel", "reason": "motivo", "engagement_avg": "X%"}],
    "best_times": ["10:00", "18:00"],
    "best_days": ["segunda", "quarta"],
    "content_mix": {"autoridade": 30, "portfolio": 25, "bastidores": 25, "social_proof": 20},
    "trending_topics": ["tema1", "tema2"],
    "avoid": ["o que evitar"]
  },
  "alerts": [
    {"type": "risk/opportunity", "severity": "high/medium/low", "title": "título", "description": "descrição detalhada", "action": "ação recomendada"}
  ],
  "consistency_score": {
    "score": 0-100,
    "posts_last_7d": 0,
    "posts_last_30d": 0,
    "ideal_frequency": 0,
    "streak_days": 0,
    "note": "observação sobre consistência"
  },
  "top_performing": {
    "patterns": ["padrão de sucesso identificado"],
    "best_hooks": ["melhores hooks identificados"],
    "best_formats": ["formatos com melhor performance"],
    "recommendations": ["recomendação baseada nos padrões"]
  }
}`;
        break;
      }

      case "autopilot_full": {
        const { pillars: ap, posts_count: apc, profile_context: apCtx } = data;
        const totalPosts = apc || 5;
        systemPrompt = `Você é o diretor de conteúdo da SQUAD Film, uma produtora audiovisual premium de Brasília/DF especializada em imóveis de luxo, cavalos e veículos premium.

Estilo da marca: cinematográfico, aspiracional, técnico mas acessível.

Crie um pacote autopilot MEGA COMPLETO: campanha + hooks + posts completos com roteiros + stories + checklists + agendamento + projeções.
Gere SEMPRE em português do Brasil. Seja direto e impactante.`;

        const pillarList = ap?.length ? ap : ['autoridade', 'portfolio', 'bastidores', 'social_proof', 'educacao'];
        const profileInfo = apCtx ? `\nContexto do perfil:\n- Handle: @${apCtx.handle || 'squadfilme'}\n- Nicho: ${apCtx.niche || 'produção audiovisual premium'}\n- Público: ${apCtx.target_audience || 'incorporadoras e marcas de luxo'}\n- Seguidores: ${apCtx.followers || 'N/A'}\n- Engajamento: ${apCtx.avg_engagement || 'N/A'}%` : '';

        userPrompt = `Gere um pacote AUTOPILOT MEGA COMPLETO com ${totalPosts} posts para a SQUAD Film.
${profileInfo}

Distribua entre os pilares: ${pillarList.join(', ')}
Alterne formatos: reel, carousel, single, story_sequence
Agende nos melhores horários (10h, 12h, 18h, 21h) distribuídos ao longo da semana.

Para CADA post, gere TUDO completo incluindo:
- Hook, roteiro, 3 variações de legenda, hashtags, CTA, comentário fixado
- Sequência de stories complementar (3-5 stories com interativos: enquete, pergunta, quiz)
- Checklist de produção (ex: gravar vídeo, editar, legendar, criar capa, agendar, publicar)

TAMBÉM gere:
- Uma campanha temática que agrupe todos os posts
- Projeções de crescimento baseadas nessa frequência

Retorne JSON puro (sem markdown):
{
  "campaign": {
    "name": "nome da campanha semanal",
    "objective": "objetivo estratégico",
    "target_audience": "público-alvo específico",
    "key_messages": ["mensagem-chave 1", "mensagem-chave 2"],
    "kpis": {"reach_target": 0, "engagement_target": 0, "leads_target": 0}
  },
  "hooks": [
    {"hook_text": "...", "hook_score": 85, "score_breakdown": {"clarity": 22, "specificity": 20, "emotion": 23, "promise": 20}, "category": "pilar", "format": "reel"}
  ],
  "posts": [
    {
      "title": "título do post",
      "format": "reel/carousel/single/story_sequence",
      "pillar": "pilar",
      "objective": "awareness/authority/engagement/leads",
      "scheduled_day_offset": 1,
      "scheduled_time": "10:00",
      "hook": "hook dos primeiros 3 segundos",
      "script": "roteiro completo com marcações de tempo",
      "caption_short": "legenda curta",
      "caption_medium": "legenda média",
      "caption_long": "legenda longa com CTA",
      "cta": "chamada para ação",
      "pinned_comment": "comentário fixado",
      "hashtags": ["hashtag1", "hashtag2"],
      "cover_suggestion": "descrição da capa",
      "carousel_slides": [{"title": "...", "body": "..."}],
      "story_sequence": [{"text": "...", "media_type": "foto/video/boomerang", "interactive": "enquete/pergunta/quiz/null", "sticker_text": "texto do sticker"}],
      "checklist": [
        {"task": "Gravar vídeo principal", "category": "captação"},
        {"task": "Editar e color grading", "category": "edição"},
        {"task": "Criar capa/thumbnail", "category": "design"},
        {"task": "Escrever legenda final", "category": "copy"},
        {"task": "Agendar publicação", "category": "publicação"},
        {"task": "Preparar stories complementares", "category": "stories"}
      ]
    }
  ],
  "projections": {
    "current_frequency": "${totalPosts} posts/semana",
    "projected_followers_30d": 0,
    "projected_followers_90d": 0,
    "engagement_trend": "descrição",
    "growth_rate_monthly": "X%",
    "estimated_reach_per_post": 0,
    "revenue_potential_90d": "R$ X",
    "recommendations": ["recomendação 1", "recomendação 2"]
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

    const aiResult = await chatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      model: "google/gemini-2.5-flash",
      includeLovableFallback: true,
    });

    const content = aiResult.choices?.[0]?.message?.content || "";
    console.log(`[instagram-ai] AI responded via ${aiResult.provider}`);

    // Try to parse as JSON
    let parsed: any = null;
    try {
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
