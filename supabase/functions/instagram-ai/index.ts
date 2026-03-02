import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chatCompletion } from "../_shared/ai-client.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper: get Supabase client with user auth
function getSupabase(authHeader?: string) {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey, {
    global: { headers: authHeader ? { Authorization: authHeader } : {} },
  });
}

// Helper: fetch recent AI memory for context enrichment
async function fetchMemoryContext(supabase: any, opts: { category?: string; format?: string; limit?: number }) {
  const limit = opts.limit || 20;
  let query = supabase
    .from("instagram_ai_memory")
    .select("memory_type, category, format, topic, output_data, original_text, edited_text, field_name, was_accepted, style_tags, tone, engagement_score, trend_data")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.category) query = query.eq("category", opts.category);
  if (opts.format) query = query.eq("format", opts.format);

  const { data } = await query;
  return data || [];
}

// Helper: build memory context string for prompts
function buildMemoryBlock(memories: any[]): string {
  if (!memories.length) return "";

  const feedbackEntries = memories.filter((m: any) => m.memory_type === "feedback" && m.edited_text);
  const styleEntries = memories.filter((m: any) => m.memory_type === "style_pref");
  const trendEntries = memories.filter((m: any) => m.memory_type === "trend");
  const perfEntries = memories.filter((m: any) => m.memory_type === "performance" && m.engagement_score);
  const genEntries = memories.filter((m: any) => m.memory_type === "generation");

  let block = "\n\n===== MEMÓRIA PERSISTENTE (use para personalizar e melhorar) =====\n";

  if (feedbackEntries.length) {
    block += "\n📝 FEEDBACK DO USUÁRIO (textos que o usuário editou após geração IA):\n";
    feedbackEntries.slice(0, 5).forEach((f: any) => {
      block += `- Campo "${f.field_name}": IA gerou "${(f.original_text || "").substring(0, 80)}..." → Usuário mudou para "${(f.edited_text || "").substring(0, 80)}..."\n`;
    });
    block += "→ APLIQUE essas correções de estilo nas novas gerações.\n";
  }

  if (styleEntries.length) {
    block += "\n🎨 PREFERÊNCIAS DE ESTILO:\n";
    styleEntries.slice(0, 3).forEach((s: any) => {
      block += `- Tags: ${(s.style_tags || []).join(", ")} | Tom: ${s.tone || "N/A"}\n`;
    });
  }

  if (trendEntries.length) {
    block += "\n📊 TENDÊNCIAS ANALISADAS:\n";
    trendEntries.slice(0, 3).forEach((t: any) => {
      const td = t.trend_data || {};
      block += `- ${t.topic || "Análise"}: ${JSON.stringify(td).substring(0, 200)}\n`;
    });
  }

  if (perfEntries.length) {
    block += "\n⭐ PERFORMANCE (posts com maior engajamento):\n";
    perfEntries.sort((a: any, b: any) => (b.engagement_score || 0) - (a.engagement_score || 0));
    perfEntries.slice(0, 5).forEach((p: any) => {
      const out = p.output_data || {};
      block += `- "${out.hook || out.title || p.topic}" (${p.format}) → Score: ${p.engagement_score} | Pilar: ${p.category}\n`;
    });
    block += "→ Priorize formatos e estilos semelhantes aos de maior performance.\n";
  }

  if (genEntries.length) {
    block += `\n📚 Já foram gerados ${genEntries.length} conteúdos anteriormente. Evite repetir hooks e títulos.\n`;
    const recentHooks = genEntries.slice(0, 5).map((g: any) => g.output_data?.hook).filter(Boolean);
    if (recentHooks.length) {
      block += `Hooks recentes (NÃO repita): ${recentHooks.map((h: string) => `"${h.substring(0, 50)}"`).join(", ")}\n`;
    }
  }

  block += "===== FIM DA MEMÓRIA =====\n";
  return block;
}

// Helper: save memory entry
async function saveMemory(supabase: any, userId: string, entry: any) {
  try {
    await supabase.from("instagram_ai_memory").insert({
      user_id: userId,
      ...entry,
    });
  } catch (e) {
    console.error("[instagram-ai] Failed to save memory:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, data } = await req.json();
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = getSupabase(authHeader);

    // Get user ID
    let userId = "anonymous";
    try {
      const token = authHeader.replace("Bearer ", "");
      if (token && token !== Deno.env.get("SUPABASE_ANON_KEY")) {
        const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const { data: userData } = await serviceClient.auth.getUser(token);
        if (userData?.user) userId = userData.user.id;
      }
    } catch {}

    // Fetch memory context for AI enrichment
    const memoryOpts: any = {};
    if (data?.pillar) memoryOpts.category = data.pillar;
    if (data?.format) memoryOpts.format = data.format;
    const memories = await fetchMemoryContext(supabase, memoryOpts);
    const memoryBlock = buildMemoryBlock(memories);

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "generate_content": {
        const { topic, format, pillar, tone, duration } = data;
        systemPrompt = `Você é o diretor de conteúdo da SQUAD Film, uma produtora audiovisual premium de Brasília/DF especializada em imóveis de luxo, cavalos e veículos premium.

Estilo da marca: cinematográfico, aspiracional, técnico mas acessível. Tipografia bold, paleta escura com acentos em azul ciano (#009CCA).

Equipamento principal: Sony FX3. Pós-produção com color grading cinematográfico.

Gere SEMPRE em português do Brasil. Seja direto e impactante.${memoryBlock}`;

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
        systemPrompt = `Você é um copywriter especialista em hooks virais para Instagram no nicho audiovisual premium e imobiliário de luxo. Gere hooks em português do Brasil.${memoryBlock}`;
        userPrompt = `Gere ${count || 5} hooks de alto impacto para Reels da SQUAD Film.
Categoria: ${category || 'autoridade'}

Para cada hook, avalie de 0 a 100 baseado em: clareza (25pts), especificidade (25pts), tensão emocional (25pts), promessa implícita (25pts).

Retorne JSON puro (sem markdown):
[{"hook_text": "...", "hook_score": 85, "score_breakdown": {"clarity": 22, "specificity": 20, "emotion": 23, "promise": 20}, "category": "${category || 'autoridade'}", "format": "reel"}]`;
        break;
      }

      case "analyze_profile": {
        const { handle, bio, followers, posts_count, avg_engagement } = data;
        systemPrompt = `Você é um consultor de posicionamento digital premium. Analise perfis de Instagram de produtoras audiovisuais de luxo.${memoryBlock}`;
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
        systemPrompt = `Você é um estrategista de conteúdo Instagram para produtoras audiovisuais premium. Crie calendários editoriais estratégicos.${memoryBlock}`;
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
        systemPrompt = `Você é um analista de growth marketing para Instagram. Faça projeções realistas baseadas em benchmarks do nicho audiovisual premium.${memoryBlock}`;
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

Gere SEMPRE em português do Brasil. Seja direto e impactante.${memoryBlock}`;

        let contextBlock = "";
        if (command) contextBlock += `\nINSTRUÇÃO DO USUÁRIO: ${command}`;
        if (reference_url) contextBlock += `\nLINK DE REFERÊNCIA (use como contexto/inspiração): ${reference_url}`;
        if (file_content) contextBlock += `\nCONTEÚDO DE ARQUIVO ENVIADO:\n${file_content.substring(0, 4000)}`;

        if (field) {
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
        systemPrompt = `Você é um consultor estratégico de Instagram para produtoras audiovisuais premium. Gere configurações completas de perfil com base no nicho e posicionamento fornecido. Sempre em português do Brasil.${memoryBlock}`;

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
        systemPrompt = `Você é um analista de dados e estrategista de Instagram de alto nível. Analise dados de Insights do Instagram fornecidos (textos, dados numéricos, prints, relatórios) e gere um relatório estratégico completo. Sempre em português do Brasil. Seja extremamente detalhado e acionável.${memoryBlock}`;

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

      case "generate_post_trending": {
        const { topic, format: gpFmt, pillar: gpPillar, trend_style, reference_style, custom_instruction } = data;
        systemPrompt = `Você é o diretor de conteúdo da SQUAD Film, uma produtora audiovisual premium de Brasília/DF especializada em imóveis de luxo, cavalos e veículos premium.

Estilo da marca: cinematográfico, aspiracional, técnico mas acessível. Tipografia bold, paleta escura com acentos em azul ciano (#009CCA). Equipamento: Sony FX3 com color grading cinematográfico.

TENDÊNCIAS INSTAGRAM 2026 que você DEVE incorporar:
- Vídeos curtos ultra-cinematográficos (3-15s com cortes rápidos e transições de câmera)
- Tipografia cinética com texto integrado ao movimento
- Estética "raw luxury" — imperfeição intencional com acabamento premium
- Narrativas em primeira pessoa com tom documental
- Sound design como elemento principal (não apenas trilha de fundo)
- Formatos híbridos: reel com capas de carrossel, story-series com arco narrativo
- "Behind the process" — mostrar o craft, não só o resultado
- Paletas dessaturadas com pontos de cor (accent color strategy)
- Slow motion alternado com speed ramps
- Conteúdo "episódico" com continuidade entre posts (Series 01, 02...)
- Collage/mixed media — combinar foto, vídeo, texturas e tipografia
- Autenticidade produzida — parecer espontâneo mas com direção de arte impecável

Gere SEMPRE em português do Brasil. Seja direto e impactante.${memoryBlock}`;

        let trendContext = "";
        if (trend_style === 'cinematic_reel') trendContext = "Estilo: Reel ultra-cinematográfico com cortes rápidos, slow motion e color grading marcante. Referência visual: film look com aspect ratio 2.39:1.";
        else if (trend_style === 'documentary') trendContext = "Estilo: Mini-documentário conceitual. Depoimento + imagens de cobertura. Tom íntimo e autêntico.";
        else if (trend_style === 'collage_art') trendContext = "Estilo: Collage/mixed media art. Combinar foto original com texturas de papel rasgado, sobreposições, tipografia experimental.";
        else if (trend_style === 'series_episode') trendContext = "Estilo: Episódio de série (SERIES 01, FILM PROJECT). Post que faz parte de uma narrativa maior.";
        else if (trend_style === 'brand_manifesto') trendContext = "Estilo: Manifesto de marca. Texto bold provocativo + imagem cinematográfica.";
        else if (trend_style === 'mood_grid') trendContext = "Estilo: Grid de mood/atmosfera. Composição de várias imagens em mosaico com textos poéticos curtos.";
        else trendContext = "Escolha o estilo mais adequado ao tema entre: cinematográfico, documental, collage, séries, manifesto ou mood grid.";

        userPrompt = `Gere um post Instagram COMPLETO seguindo as tendências 2026 para a SQUAD Film:

Tema: ${topic || 'conteúdo audiovisual premium'}
Formato: ${gpFmt || 'reel'}
Pilar: ${gpPillar || 'autoridade'}
${trendContext}
${reference_style ? `Referência visual: ${reference_style}` : ''}
${custom_instruction ? `Instrução adicional: ${custom_instruction}` : ''}

Retorne JSON puro (sem markdown):
{
  "title": "título editorial do post (estilo SQUAD Film)",
  "format": "reel/carousel/single",
  "pillar": "${gpPillar || 'autoridade'}",
  "objective": "awareness/authority/engagement/leads",
  "trend_style": "estilo visual escolhido",
  "hook": "hook dos primeiros 3 segundos — impactante e cinematográfico",
  "script": "roteiro completo com marcações de tempo, indicações de câmera, trilha e transições",
  "caption_short": "legenda curta até 3 linhas — tom poético/provocativo",
  "caption_medium": "legenda média com storytelling 1 parágrafo",
  "caption_long": "legenda longa com narrativa completa e CTA",
  "cta": "chamada para ação",
  "pinned_comment": "comentário fixado sugerido",
  "hashtags": ["hashtag1", "hashtag2", "...até 15 hashtags estratégicas"],
  "cover_suggestion": "descrição detalhada da capa/thumbnail",
  "carousel_slides": [{"title": "título slide", "body": "corpo slide"}],
  "story_sequence": [{"text": "texto", "media_type": "foto/video/boomerang", "interactive": "enquete/pergunta/quiz/null"}],
  "checklist": [
    {"task": "tarefa de produção", "category": "captação/edição/design/copy/publicação"}
  ],
  "visual_direction": {
    "camera": "indicações de câmera e lente",
    "lighting": "esquema de iluminação",
    "color_grade": "direção de cor",
    "typography": "estilo tipográfico para capa/textos",
    "sound_design": "indicações de áudio e trilha",
    "editing_pace": "ritmo de edição"
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
Gere SEMPRE em português do Brasil. Seja direto e impactante.${memoryBlock}`;

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
- Checklist de produção

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

      // Save feedback (user edited AI content)
      case "save_feedback": {
        const { post_id, field_name, original_text, edited_text, category, format } = data;
        await saveMemory(supabase, userId, {
          memory_type: "feedback",
          category,
          format,
          field_name,
          original_text,
          edited_text,
          was_accepted: original_text !== edited_text,
          post_id,
        });
        return new Response(JSON.stringify({ result: { saved: true } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save performance data
      case "save_performance": {
        const { post_id, engagement_score, category: perfCat, format: perfFmt, topic: perfTopic, output_data } = data;
        await saveMemory(supabase, userId, {
          memory_type: "performance",
          category: perfCat,
          format: perfFmt,
          topic: perfTopic,
          engagement_score,
          post_id,
          output_data,
        });
        return new Response(JSON.stringify({ result: { saved: true } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save style preference
      case "save_style_pref": {
        const { style_tags, tone, category: styleCat } = data;
        await saveMemory(supabase, userId, {
          memory_type: "style_pref",
          category: styleCat,
          style_tags,
          tone,
        });
        return new Response(JSON.stringify({ result: { saved: true } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save trend analysis
      case "save_trend": {
        const { topic: trendTopic, trend_data } = data;
        await saveMemory(supabase, userId, {
          memory_type: "trend",
          topic: trendTopic,
          trend_data,
        });
        return new Response(JSON.stringify({ result: { saved: true } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate campaign with AI based on research, analysis and data
      case "generate_campaign": {
        const { theme, duration_weeks, budget } = data;

        // Fetch profile config for context
        let profileContext = "";
        try {
          const { data: profileData } = await supabase
            .from("instagram_profile_config")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();
          if (profileData) {
            profileContext = `\n\n===== PERFIL DO INSTAGRAM =====\n`;
            if (profileData.username) profileContext += `Username: @${profileData.username}\n`;
            if (profileData.niche) profileContext += `Nicho: ${profileData.niche}\n`;
            if (profileData.brand_voice) profileContext += `Voz da marca: ${profileData.brand_voice}\n`;
            if (profileData.target_audience) profileContext += `Público-alvo: ${profileData.target_audience}\n`;
            if (profileData.content_pillars) profileContext += `Pilares: ${JSON.stringify(profileData.content_pillars)}\n`;
            if (profileData.bio) profileContext += `Bio: ${profileData.bio}\n`;
            profileContext += `===== FIM PERFIL =====\n`;
          }
        } catch (e) { console.error("[instagram-ai] profile fetch error:", e); }

        // Fetch saved references for inspiration
        let referencesContext = "";
        try {
          const { data: refs } = await supabase
            .from("instagram_references")
            .select("title, source_url, notes, category, tags")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(15);
          if (refs && refs.length > 0) {
            referencesContext = `\n\n===== REFERÊNCIAS SALVAS (${refs.length}) =====\n`;
            refs.forEach((r: any) => {
              referencesContext += `- "${r.title}" [${r.category || 'geral'}]${r.notes ? ` — ${r.notes}` : ''}${r.tags?.length ? ` (tags: ${r.tags.join(', ')})` : ''}\n`;
            });
            referencesContext += `===== FIM REFERÊNCIAS =====\n`;
          }
        } catch (e) { console.error("[instagram-ai] refs fetch error:", e); }

        // Fetch recent posts for context
        let postsContext = "";
        try {
          const { data: recentPosts } = await supabase
            .from("instagram_posts")
            .select("title, format, pillar, status, hook")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(20);
          if (recentPosts && recentPosts.length > 0) {
            postsContext = `\n\n===== POSTS RECENTES (${recentPosts.length}) =====\n`;
            recentPosts.forEach((p: any) => {
              postsContext += `- "${p.title}" [${p.format}, ${p.pillar || '-'}, ${p.status}]${p.hook ? ` hook: "${p.hook.substring(0, 60)}"` : ''}\n`;
            });
            postsContext += `===== FIM POSTS =====\n`;
          }
        } catch (e) { console.error("[instagram-ai] posts fetch error:", e); }

        const durationWeeks = duration_weeks || 2;
        const today = new Date();
        const startDate = today.toISOString().split('T')[0];
        const endDate = new Date(today.getTime() + durationWeeks * 7 * 86400000).toISOString().split('T')[0];

        systemPrompt = `Você é um estrategista de marketing digital e social media sênior. Sua função é criar campanhas completas de Instagram baseadas em pesquisa de mercado, análise de tendências do nicho e dados do perfil do cliente.

Você deve agir como se tivesse feito uma pesquisa profunda de mercado e tendências antes de gerar a campanha. Considere:
- Tendências atuais do nicho e do Instagram
- Melhores práticas de engajamento e crescimento
- Formatos que estão performando melhor (Reels, Carrosséis, Stories)
- Horários e frequência ideais de postagem
- Estratégias de hashtags e distribuição

${profileContext}${referencesContext}${postsContext}${memoryBlock}

RETORNE APENAS JSON VÁLIDO (sem markdown, sem \`\`\`). O JSON deve seguir EXATAMENTE esta estrutura:
{
  "name": "Nome criativo da campanha",
  "objective": "Objetivo estratégico detalhado",
  "target_audience": "Público-alvo específico",
  "start_date": "${startDate}",
  "end_date": "${endDate}",
  "budget": ${budget || 0},
  "key_messages": ["mensagem 1", "mensagem 2", "mensagem 3"],
  "kpis": {
    "target_reach": number,
    "target_engagement_rate": number,
    "target_followers_growth": number,
    "target_saves": number,
    "target_shares": number
  },
  "content_plan": [
    {
      "title": "Título do post",
      "format": "reel|carousel|static|story",
      "pillar": "autoridade|educativo|bastidores|social_proof|entretenimento",
      "hook": "Frase de abertura impactante",
      "suggested_day": "dia da semana",
      "notes": "Breve descrição/angle"
    }
  ],
  "strategy_notes": "Resumo da estratégia e racional por trás das escolhas"
}`;

        userPrompt = `Crie uma campanha completa de Instagram com as seguintes diretrizes:

${theme ? `Tema/Foco: ${theme}` : 'Tema: livre (baseie-se no perfil e referências)'}
Duração: ${durationWeeks} semanas (${startDate} a ${endDate})
${budget ? `Orçamento: R$ ${budget}` : 'Sem orçamento definido'}

Gere:
1. Nome criativo e objetivo estratégico
2. Público-alvo detalhado
3. 3-5 mensagens-chave da campanha
4. KPIs projetados realistas
5. Plano de conteúdo com ${durationWeeks * 4}-${durationWeeks * 5} posts sugeridos (distribuídos pela duração)
6. Notas de estratégia explicando o racional

Baseie-se nos dados do perfil, referências salvas, histórico de posts e memória de performance para personalizar ao máximo.`;
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

    // Auto-save generation to memory
    await saveMemory(supabase, userId, {
      memory_type: "generation",
      category: data?.pillar || data?.category || null,
      format: data?.format || null,
      topic: data?.topic || null,
      input_data: { action, ...data },
      output_data: parsed,
    });

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
