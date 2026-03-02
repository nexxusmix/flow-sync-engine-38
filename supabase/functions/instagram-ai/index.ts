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

      // Campaign wizard: generate contextual suggestions per step
      case "campaign_wizard_suggestions": {
        const { step: wizardStep, wizard_data, profile_niche, profile_audience, profile_pillars, profile_voice, profile_snapshot } = data;

        const contextParts: string[] = [];
        if (profile_niche) contextParts.push(`Nicho: ${profile_niche}`);
        if (profile_audience) contextParts.push(`Público: ${profile_audience}`);
        if (profile_pillars) contextParts.push(`Pilares: ${JSON.stringify(profile_pillars)}`);
        if (profile_voice) contextParts.push(`Voz: ${profile_voice}`);
        if (profile_snapshot) {
          contextParts.push(`\nMÉTRICAS ATUAIS DO PERFIL:`);
          if (profile_snapshot.followers) contextParts.push(`Seguidores: ${profile_snapshot.followers}`);
          if (profile_snapshot.avg_engagement) contextParts.push(`Engajamento médio: ${profile_snapshot.avg_engagement}%`);
          if (profile_snapshot.avg_reach) contextParts.push(`Alcance médio: ${profile_snapshot.avg_reach}`);
          if (profile_snapshot.posts_count) contextParts.push(`Posts publicados: ${profile_snapshot.posts_count}`);
        }
        if (wizard_data?.objective) contextParts.push(`Objetivo escolhido: ${wizard_data.objective}`);
        if (wizard_data?.theme) contextParts.push(`Tema: ${wizard_data.theme}`);
        if (wizard_data?.target_audience) contextParts.push(`Público definido: ${wizard_data.target_audience}`);
        if (wizard_data?.tones?.length) contextParts.push(`Tons: ${wizard_data.tones.join(', ')}`);
        if (wizard_data?.formats?.length) contextParts.push(`Formatos: ${wizard_data.formats.join(', ')}`);

        const profileBlock = contextParts.length > 0 ? `\n\nCONTEXTO DO PERFIL E WIZARD:\n${contextParts.join('\n')}` : '';

        const stepPrompts: Record<number, string> = {
          0: `Baseado no perfil, sugira:
- 3-4 temas de campanha criativos e específicos para o nicho (array "themes")
Retorne JSON: {"themes": ["tema1", "tema2", "tema3"]}`,
          1: `Baseado no objetivo "${wizard_data?.objective || ''}" e tema "${wizard_data?.theme || ''}", sugira:
- 2-3 descrições de público-alvo específicas (array "audiences")
- 4-5 mensagens-chave estratégicas (array "messages")
Retorne JSON: {"audiences": ["pub1", "pub2"], "messages": ["msg1", "msg2"]}`,
          2: `Baseado no objetivo "${wizard_data?.objective || ''}" e público "${wizard_data?.target_audience || ''}", sugira:
- Quais formatos usar e por quê (array "formats" com objects {key, label, reason})
- 2-3 estilos visuais diferenciados (array "styles")
Retorne JSON: {"formats": [{"key": "reel", "label": "Reels", "reason": "razão"}], "styles": ["estilo1"]}`,
          3: `Baseado em toda a configuração, sugira ajustes finais. Retorne JSON: {}`,
        };

        systemPrompt = `Você é um consultor de marketing digital sênior especialista em Instagram. Gere sugestões inteligentes e PERSONALIZADAS para a etapa ${wizardStep} de criação de campanha.

DIRETRIZES:
- Analise as MÉTRICAS ATUAIS do perfil para identificar pontos fortes e fracos
- Use a MEMÓRIA PERSISTENTE para entender o que funcionou e o que não funcionou no passado
- Considere tendências 2026 e melhores práticas do nicho específico
- Sugestões devem ser acionáveis, específicas e adaptadas ao momento atual do perfil
- Se o perfil tem baixo engajamento, priorize estratégias de recuperação
- Se tem bom alcance, sugira estratégias de conversão

RETORNE APENAS JSON VÁLIDO.${profileBlock}${memoryBlock}`;
        userPrompt = stepPrompts[wizardStep as number] || 'Retorne JSON: {}';

        // Use a fast model for suggestions
        const sugResult = await chatCompletion({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: "google/gemini-2.5-flash-lite",
        });

        const sugContent = sugResult.choices?.[0]?.message?.content || "{}";
        let sugParsed: any = {};
        try {
          const cleaned = sugContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          sugParsed = JSON.parse(cleaned);
        } catch {
          try {
            const m = sugContent.match(/\{[\s\S]*\}/);
            if (m) sugParsed = JSON.parse(m[0]);
          } catch { /* ignore */ }
        }

        return new Response(JSON.stringify({ result: sugParsed }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate campaign with AI based on research, analysis and data
      case "generate_campaign": {
        const { theme, duration_weeks, budget, wizard_context } = data;

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

        // Generate all real scheduled dates
        const scheduledDates: string[] = [];
        for (let d = 0; d < durationWeeks * 7; d++) {
          const dt = new Date(today.getTime() + d * 86400000);
          scheduledDates.push(dt.toISOString().split('T')[0]);
        }

        systemPrompt = `Você é um estrategista de marketing digital e social media sênior. Sua função é criar campanhas COMPLETÍSSIMAS de Instagram: estratégia + todos os posts prontos para publicação com roteiro, legendas, hashtags, calendário editorial com datas reais, ads sugeridos e checklists de produção.

Você deve agir como se tivesse feito uma pesquisa profunda de mercado e tendências antes de gerar a campanha. Considere:
- Tendências atuais do nicho e do Instagram 2026
- Melhores práticas de engajamento e crescimento
- Formatos que estão performando melhor (Reels, Carrosséis, Stories)
- Horários e frequência ideais de postagem
- Estratégias de hashtags e distribuição
- Ads orgânicos vs pagos
- Calendário editorial com datas reais

${profileContext}${referencesContext}${postsContext}${memoryBlock}

RETORNE APENAS JSON VÁLIDO (sem markdown, sem \`\`\`). O JSON deve seguir EXATAMENTE esta estrutura:
{
  "name": "Nome criativo da campanha",
  "objective": "Objetivo estratégico detalhado",
  "target_audience": "Público-alvo específico e detalhado",
  "start_date": "${startDate}",
  "end_date": "${endDate}",
  "budget": ${budget || 0},
  "key_messages": ["mensagem 1", "mensagem 2", "mensagem 3", "mensagem 4"],
  "kpis": {
    "target_reach": number,
    "target_engagement_rate": number,
    "target_followers_growth": number,
    "target_saves": number,
    "target_shares": number,
    "target_leads": number
  },
  "strategy_notes": "Resumo completo da estratégia, racional, pesquisa de mercado e tendências identificadas (5-10 linhas)",
  "content_plan": [
    {
      "title": "Título editorial do post",
      "format": "reel|carousel|single|story_sequence",
      "pillar": "autoridade|portfolio|bastidores|social_proof|educacao|venda",
      "objective": "awareness|authority|engagement|leads|conversion",
      "scheduled_date": "YYYY-MM-DD (data real dentro do período ${startDate} a ${endDate})",
      "suggested_time": "HH:MM",
      "is_ad": false,
      "hook": "Frase de abertura impactante dos primeiros 3 segundos",
      "script": "Roteiro completo com marcações de tempo, indicações de câmera, trilha e transições",
      "caption_short": "Legenda curta até 3 linhas — tom direto e impactante",
      "caption_medium": "Legenda média com storytelling 1 parágrafo completo",
      "caption_long": "Legenda longa com narrativa completa, contexto e CTA forte",
      "cta": "Chamada para ação clara e específica",
      "pinned_comment": "Comentário fixado sugerido para engajamento",
      "hashtags": ["hashtag1", "hashtag2", "até 15 hashtags estratégicas"],
      "cover_suggestion": "Descrição detalhada da capa/thumbnail ideal",
      "carousel_slides": [{"title": "título slide", "body": "corpo do slide com texto completo"}],
      "story_sequence": [{"text": "texto do story", "media_type": "foto|video|boomerang", "interactive": "enquete|pergunta|quiz|null", "sticker_text": "texto do sticker interativo"}],
      "checklist": [
        {"task": "Gravar vídeo principal", "category": "captação"},
        {"task": "Editar e color grading", "category": "edição"},
        {"task": "Criar capa/thumbnail", "category": "design"},
        {"task": "Escrever legenda final", "category": "copy"},
        {"task": "Agendar publicação", "category": "publicação"}
      ]
    }
  ]
}

REGRAS IMPORTANTES:
- Gere entre ${Math.max(durationWeeks * 3, 6)} e ${durationWeeks * 5} posts completos
- Use datas reais entre ${startDate} e ${endDate}, distribuídas uniformemente
- Alterne formatos: reel (40%), carousel (30%), single (15%), story_sequence (15%)
- Distribua entre os pilares de conteúdo disponíveis
- Melhores horários: 10:00, 12:00, 18:00, 20:00
- Inclua pelo menos 1-2 posts marcados como is_ad: true (sugestão de anúncio)
- Para carrosséis: gere 5-8 slides com título e corpo completo
- Para story_sequence: gere 3-5 stories com interativos
- Checklist de produção deve ter 4-6 itens relevantes ao formato
- TODOS os campos de texto devem ser preenchidos — NENHUM campo vazio`;

        // Build wizard context block if available
        let wizardBlock = "";
        if (wizard_context) {
          wizardBlock = `\n\n===== BRIEFING DO WIZARD (preferências do usuário) =====\n`;
          if (wizard_context.objective) wizardBlock += `Objetivo: ${wizard_context.objective}\n`;
          if (wizard_context.target_audience) wizardBlock += `Público-alvo: ${wizard_context.target_audience}\n`;
          if (wizard_context.key_messages?.length) wizardBlock += `Mensagens-chave: ${wizard_context.key_messages.join(' | ')}\n`;
          if (wizard_context.tone) wizardBlock += `Tom de voz: ${wizard_context.tone}\n`;
          if (wizard_context.formats?.length) wizardBlock += `Formatos preferidos: ${wizard_context.formats.join(', ')}\n`;
          if (wizard_context.pillars?.length) wizardBlock += `Pilares preferidos: ${wizard_context.pillars.join(', ')}\n`;
          if (wizard_context.style) wizardBlock += `Estilo visual: ${wizard_context.style}\n`;
          if (wizard_context.posts_per_week) wizardBlock += `Posts por semana: ${wizard_context.posts_per_week}\n`;
          if (wizard_context.start_date) wizardBlock += `Data início desejada: ${wizard_context.start_date}\n`;
          wizardBlock += `===== FIM BRIEFING =====\n`;
        }

        const totalPosts = wizard_context?.posts_per_week
          ? wizard_context.posts_per_week * durationWeeks
          : Math.max(durationWeeks * 3, 6);

        userPrompt = `Crie uma campanha COMPLETÍSSIMA de Instagram com TODOS os posts prontos para publicação:

${theme ? `Tema/Foco: ${theme}` : 'Tema: livre (baseie-se no perfil e referências)'}
Duração: ${durationWeeks} semanas (${startDate} a ${endDate})
${budget ? `Orçamento: R$ ${budget}` : 'Sem orçamento definido'}
Datas disponíveis: ${scheduledDates.join(', ')}
${wizardBlock}

IMPORTANTE: Siga RIGOROSAMENTE as preferências do briefing do wizard acima (formatos, pilares, tom, estilo, público).

Gere:
1. Nome criativo e objetivo estratégico detalhado
2. Público-alvo super específico e detalhado
3. 3-5 mensagens-chave da campanha
4. KPIs projetados realistas
5. Notas de estratégia com pesquisa de mercado e tendências
6. Plano de conteúdo com ${totalPosts} posts COMPLETOS — cada um com:
   - Título, hook, roteiro/script completo
   - 3 variações de legenda (curta, média, longa)
   - CTA, hashtags, comentário fixado
   - Sugestão de capa/thumbnail
   - Slides de carrossel OU sequência de stories (conforme formato)
   - Checklist de produção
   - Data real agendada e horário sugerido
   - Marcação de ad para posts patrocinados

Baseie-se nos dados do perfil, referências salvas, histórico de posts e memória de performance para personalizar ao máximo.`;
        break;
      }

      case "campaign_ai_tool": {
        const { tool, campaign, competitors, objective, field, post_title, post_hook, post_caption, post_cta, post_format, post_pillar } = data;
        const campaignCtx = `Campanha: ${campaign?.name || 'N/A'}
Objetivo: ${campaign?.objective || 'N/A'}
Público: ${campaign?.target_audience || 'N/A'}
Orçamento: R$ ${campaign?.budget || 0}
Período: ${campaign?.start_date || '?'} a ${campaign?.end_date || '?'}
Posts: ${campaign?.total_posts || 0} (publicados: ${campaign?.published_posts || 0})
Formatos: ${(campaign?.formats || []).join(', ')}
Pilares: ${(campaign?.pillars || []).join(', ')}
Títulos: ${(campaign?.post_titles || []).join(' | ')}`;

        systemPrompt = `Você é o estrategista digital sênior da SQUAD Film, produtora audiovisual premium de Brasília/DF.
Especialista em Instagram marketing, Meta Ads e estratégia de conteúdo para nichos de luxo.
Responda SEMPRE em português do Brasil. Seja direto, prático e acionável.
Retorne SEMPRE um JSON válido com seções claras e organizadas.${memoryBlock}`;

        switch (tool) {
          case 'competitors':
            userPrompt = `Analise os concorrentes e gere um relatório estratégico comparativo.

${campaignCtx}

Concorrentes/Nicho informado: ${competitors || 'N/A'}

Retorne um JSON com:
{
  "resumo_executivo": "Análise geral do cenário competitivo",
  "concorrentes_analisados": ["lista de perfis/referências analisados"],
  "pontos_fortes_concorrentes": ["o que eles fazem bem"],
  "lacunas_e_oportunidades": ["gaps que podemos explorar"],
  "diferenciais_recomendados": ["como se destacar"],
  "estrategia_de_conteudo": ["tipos de conteúdo que funcionam no nicho"],
  "frequencia_ideal": "recomendação de frequência",
  "melhores_horarios": ["horários sugeridos"],
  "hashtags_estrategicas": ["hashtags do nicho"],
  "acoes_imediatas": ["3-5 ações práticas para implementar agora"]
}`;
            break;

          case 'forecast':
            userPrompt = `Projete os resultados esperados desta campanha com base no conteúdo planejado e benchmarks do nicho.

${campaignCtx}

Retorne um JSON com:
{
  "projecao_alcance": { "total_estimado": number, "por_post_medio": number, "melhor_formato": "formato" },
  "projecao_engajamento": { "taxa_media_esperada": "X%", "likes_estimados": number, "comentarios_estimados": number, "compartilhamentos": number },
  "projecao_crescimento": { "novos_seguidores_estimados": number, "taxa_crescimento": "X%", "timeline": "projeção semana a semana" },
  "projecao_conversao": { "cliques_link_bio": number, "leads_estimados": number, "roi_estimado": "X%" },
  "riscos": ["fatores que podem impactar negativamente"],
  "otimizacoes_sugeridas": ["ajustes para maximizar resultados"],
  "benchmark_nicho": { "taxa_engajamento_media": "X%", "alcance_medio": number, "frequencia_ideal": "X posts/semana" },
  "cenarios": { "otimista": "descrição", "realista": "descrição", "conservador": "descrição" }
}`;
            break;

          case 'budget_optimizer':
            userPrompt = `Otimize a distribuição do orçamento desta campanha entre formatos, dias e objetivos.

${campaignCtx}

Retorne um JSON com:
{
  "resumo_estrategia": "Estratégia geral de alocação",
  "distribuicao_por_formato": [{ "formato": "reel", "percentual": 40, "valor": 400, "justificativa": "..." }],
  "distribuicao_por_objetivo": [{ "objetivo": "awareness", "percentual": 30, "valor": 300 }, { "objetivo": "consideration", "percentual": 40, "valor": 400 }, { "objetivo": "conversion", "percentual": 30, "valor": 300 }],
  "distribuicao_temporal": [{ "semana": 1, "valor": number, "foco": "..." }],
  "recomendacoes_bid": { "cpc_medio_esperado": "R$ X", "cpm_medio_esperado": "R$ X" },
  "testes_ab_sugeridos": ["teste 1", "teste 2"],
  "alertas": ["pontos de atenção sobre o budget"],
  "roi_projetado": "X%"
}`;
            break;

          case 'ad_copies':
            userPrompt = `Gere copies otimizadas para Meta Ads (Instagram/Facebook) para a etapa "${objective || 'awareness'}" do funil.

${campaignCtx}
Hooks dos posts: ${(campaign?.post_hooks || []).join(' | ')}

Retorne um JSON com:
{
  "etapa_funil": "${objective || 'awareness'}",
  "anuncios": [
    {
      "titulo": "Headline principal (até 40 chars)",
      "descricao": "Descrição do anúncio (até 125 chars)",
      "texto_principal": "Texto do corpo do anúncio (2-3 linhas)",
      "cta_button": "Botão CTA (Saiba Mais, Comprar, etc)",
      "headline_alternativa_1": "Variação 1",
      "headline_alternativa_2": "Variação 2",
      "segmentacao_sugerida": "Público ideal para este anúncio",
      "formato_recomendado": "Formato (feed, stories, reels)",
      "bid_sugerido": "Estratégia de lance"
    }
  ],
  "dicas_criativas": ["dica 1", "dica 2"],
  "segmentacao_geral": { "interesses": ["..."], "comportamentos": ["..."], "demografico": "..." },
  "metricas_alvo": { "ctr_esperado": "X%", "cpc_esperado": "R$ X" }
}

Gere pelo menos 3 anúncios variados.`;
            break;

          case 'ab_testing':
            userPrompt = `Gere 3 variações criativas para A/B testing do campo "${field || 'hook'}" deste post.

${campaignCtx}

Post original:
- Título: ${post_title || 'N/A'}
- Hook atual: ${post_hook || 'N/A'}
- Legenda atual: ${post_caption || 'N/A'}
- CTA atual: ${post_cta || 'N/A'}
- Formato: ${post_format || 'reel'}
- Pilar: ${post_pillar || 'N/A'}

Retorne um JSON com:
{
  "campo_testado": "${field || 'hook'}",
  "original": "texto original do campo",
  "variacoes": [
    { "versao": "A", "texto": "variação A com abordagem diferente", "estrategia": "por que essa variação pode funcionar", "tom": "emocional/racional/urgente/etc" },
    { "versao": "B", "texto": "variação B com outra abordagem", "estrategia": "justificativa", "tom": "..." },
    { "versao": "C", "texto": "variação C ousada/disruptiva", "estrategia": "justificativa", "tom": "..." }
  ],
  "recomendacao_teste": "Como rodar o teste (duração, métricas, amostra)",
  "metrica_decisao": "Qual métrica usar para decidir o vencedor"
}`;
            break;

          default:
            return new Response(JSON.stringify({ error: `Unknown campaign tool: ${tool}` }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
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

    // Try to parse as JSON - robust extraction
    let parsed: any = null;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to find JSON object in content
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          const arrMatch = content.match(/\[[\s\S]*\]/);
          if (arrMatch) {
            parsed = JSON.parse(arrMatch[0]);
          } else {
            parsed = { raw: content };
          }
        }
      } catch {
        parsed = { raw: content };
      }
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
