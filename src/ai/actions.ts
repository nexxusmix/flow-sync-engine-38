import { z } from 'zod';
import { AiActionDefinition } from './types';

// ============================================
// AI Actions Registry
// Centralized catalog of all AI actions
// ============================================

// --- Marketing: Generate Copy ---
export const generateCopyInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  channel: z.string().optional(),
  format: z.string().optional(),
  pillar: z.string().optional(),
  hook: z.string().optional(),
  notes: z.string().optional(),
});

export const generateCopyOutputSchema = z.object({
  hook: z.string(),
  caption_short: z.string(),
  caption_long: z.string(),
  cta: z.string(),
  hashtags: z.string(),
  script: z.string().optional(),
});

export type GenerateCopyInput = z.infer<typeof generateCopyInputSchema>;
export type GenerateCopyOutput = z.infer<typeof generateCopyOutputSchema>;

export const marketingGenerateCopy: AiActionDefinition<GenerateCopyInput, GenerateCopyOutput> = {
  key: 'marketing.generateCopy',
  title: 'Gerar Copy',
  description: 'Gera hook, captions, CTA, hashtags e roteiro para o conteúdo',
  entityType: 'content_item',
  inputSchema: generateCopyInputSchema,
  outputSchema: generateCopyOutputSchema,
  buildContext: (entity: unknown) => {
    const item = entity as Record<string, unknown>;
    return {
      id: String(item.id || ''),
      title: String(item.title || ''),
      channel: item.channel as string | undefined,
      format: item.format as string | undefined,
      pillar: item.pillar as string | undefined,
      hook: item.hook as string | undefined,
      notes: item.notes as string | undefined,
    };
  },
  applyResult: (result, setter) => {
    setter({
      hook: result.hook,
      caption_short: result.caption_short,
      caption_long: result.caption_long,
      cta: result.cta,
      hashtags: result.hashtags,
      script: result.script,
    });
  },
  fieldLabels: {
    hook: 'Hook / Gancho',
    caption_short: 'Caption Curta',
    caption_long: 'Caption Longa',
    cta: 'Call to Action',
    hashtags: 'Hashtags',
    script: 'Roteiro',
  },
};

// --- Marketing: Generate Ideas ---
export const generateIdeasInputSchema = z.object({
  pillar: z.string().optional(),
  channel: z.string().optional(),
  format: z.string().optional(),
  niche: z.string().optional(),
  objective: z.string().optional(),
  tone: z.string().optional(),
});

export const generateIdeasOutputSchema = z.object({
  ideas: z.array(z.object({
    title: z.string(),
    hook: z.string(),
    pillar: z.string(),
    channel: z.string(),
    format: z.string(),
    target: z.string().optional(),
    score: z.number(),
  })),
});

export type GenerateIdeasInput = z.infer<typeof generateIdeasInputSchema>;
export type GenerateIdeasOutput = z.infer<typeof generateIdeasOutputSchema>;

export const marketingGenerateIdeas: AiActionDefinition<GenerateIdeasInput, GenerateIdeasOutput> = {
  key: 'marketing.generateIdeas',
  title: 'Gerar Ideias',
  description: 'Gera 10 ideias de conteúdo baseadas nos filtros',
  entityType: 'content_ideas',
  inputSchema: generateIdeasInputSchema,
  outputSchema: generateIdeasOutputSchema,
  buildContext: (entity: unknown) => entity as GenerateIdeasInput,
  applyResult: (result, setter) => {
    setter({ ideas: result.ideas });
  },
  fieldLabels: {
    ideas: 'Ideias Geradas',
  },
};

// --- Projects: Generate Brief ---
export const generateBriefInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  client_name: z.string().optional(),
  service_type: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

export const generateBriefOutputSchema = z.object({
  description: z.string(),
  scope: z.string(),
  objectives: z.array(z.string()),
  deliverables: z.array(z.string()),
  timeline_suggestion: z.string().optional(),
});

export type GenerateBriefInput = z.infer<typeof generateBriefInputSchema>;
export type GenerateBriefOutput = z.infer<typeof generateBriefOutputSchema>;

export const projectsGenerateBrief: AiActionDefinition<GenerateBriefInput, GenerateBriefOutput> = {
  key: 'projects.generateBrief',
  title: 'Gerar Briefing',
  description: 'Gera descrição, escopo, objetivos e entregas sugeridas para o projeto',
  entityType: 'project',
  inputSchema: generateBriefInputSchema,
  outputSchema: generateBriefOutputSchema,
  buildContext: (entity: unknown) => {
    const project = entity as Record<string, unknown>;
    return {
      id: String(project.id || ''),
      name: String(project.name || ''),
      client_name: project.client_name as string | undefined,
      service_type: project.service_type as string | undefined,
      description: project.description as string | undefined,
      notes: project.notes as string | undefined,
    };
  },
  applyResult: (result, setter) => {
    const fullDescription = [
      result.description,
      '',
      '## Escopo',
      result.scope,
      '',
      '## Objetivos',
      ...result.objectives.map(o => `- ${o}`),
      '',
      '## Entregas Sugeridas',
      ...result.deliverables.map(d => `- ${d}`),
      result.timeline_suggestion ? `\n## Cronograma Sugerido\n${result.timeline_suggestion}` : '',
    ].join('\n');

    setter({ description: fullDescription } as Partial<GenerateBriefOutput>);
  },
  fieldLabels: {
    description: 'Descrição',
    scope: 'Escopo',
    objectives: 'Objetivos',
    deliverables: 'Entregas',
    timeline_suggestion: 'Cronograma Sugerido',
  },
};

// ============================================
// Lightweight Action Definitions
// For actions that use dedicated edge functions
// (not routed through ai-run)
// ============================================

const passthrough = z.object({}).passthrough();

function lightAction(
  key: string,
  title: string,
  description: string,
  entityType: string,
): AiActionDefinition<Record<string, unknown>, Record<string, unknown>> {
  return {
    key,
    title,
    description,
    entityType,
    inputSchema: passthrough,
    outputSchema: passthrough,
    buildContext: (e: unknown) => (e || {}) as Record<string, unknown>,
    applyResult: (result, setter) => setter(result),
  };
}

// --- Instagram Engine ---
export const instagramGenerateCampaign = lightAction(
  'instagram.generateCampaign',
  'Gerar Campanha Instagram',
  'Gera estratégia completa de campanha com posts, cronograma e KPIs',
  'campaign',
);

export const instagramGeneratePost = lightAction(
  'instagram.generatePost',
  'Gerar Conteúdo de Post',
  'Gera conteúdo otimizado para post no Instagram',
  'content_item',
);

export const instagramAbTest = lightAction(
  'instagram.abTest',
  'Teste A/B de Copy',
  'Gera variações A/B de copy para testar engajamento',
  'content_item',
);

export const instagramFetchInsights = lightAction(
  'instagram.fetchInsights',
  'Buscar Insights Instagram',
  'Coleta métricas e insights de posts publicados',
  'instagram_post',
);

export const instagramScrapeProfile = lightAction(
  'instagram.scrapeProfile',
  'Analisar Perfil Instagram',
  'Extrai dados e métricas de um perfil do Instagram',
  'instagram_profile',
);

export const instagramExportPost = lightAction(
  'instagram.exportPost',
  'Exportar Post Instagram',
  'Gera arquivo exportável do post com copy e mídia',
  'instagram_post',
);

export const instagramPublish = lightAction(
  'instagram.publish',
  'Publicar no Instagram',
  'Publica conteúdo diretamente no Instagram via Graph API',
  'instagram_post',
);

// --- Tasks ---
export const tasksDailySummary = lightAction(
  'tasks.dailySummary',
  'Resumo Diário',
  'Gera resumo executivo do estado das tarefas do dia',
  'tasks',
);

export const tasksSuggestPlan = lightAction(
  'tasks.suggestPlan',
  'Plano do Dia IA',
  'Sugere priorização e plano de execução para o dia',
  'tasks',
);

export const tasksRefine = lightAction(
  'tasks.refine',
  'Refinar Tarefa',
  'Melhora título, descrição e subtarefas de uma tarefa com IA',
  'task',
);

export const tasksDetectDuplicates = lightAction(
  'tasks.detectDuplicates',
  'Detectar Duplicatas',
  'Identifica tarefas duplicadas ou similares na lista',
  'tasks',
);

export const tasksGenerateAutomations = lightAction(
  'tasks.generateAutomations',
  'Gerar Automações de Tarefa',
  'Cria regras de automação baseadas no padrão de uso',
  'task',
);

export const tasksGenerateTemplates = lightAction(
  'tasks.generateTemplates',
  'Gerar Templates de Tarefa',
  'Cria templates reutilizáveis baseados em tarefas existentes',
  'tasks',
);

export const tasksFromText = lightAction(
  'tasks.fromText',
  'Tarefas de Texto Livre',
  'Extrai e cria tarefas a partir de texto não estruturado',
  'tasks',
);

export const tasksSuggestDeadline = lightAction(
  'tasks.suggestDeadline',
  'Sugerir Prazo',
  'Sugere deadline ideal baseado em complexidade e histórico',
  'task',
);

export const tasksSuggestPriorities = lightAction(
  'tasks.suggestPriorities',
  'Sugerir Prioridades',
  'Reavalia e sugere prioridades para lista de tarefas',
  'tasks',
);

export const tasksAnalyze = lightAction(
  'tasks.analyze',
  'Analisar Tarefas',
  'Análise inteligente de carga, gargalos e distribuição',
  'tasks',
);

export const tasksSearch = lightAction(
  'tasks.search',
  'Busca Inteligente de Tarefas',
  'Busca semântica com IA em todas as tarefas',
  'tasks',
);

// --- Projects ---
export const projectsExtractDocument = lightAction(
  'projects.extractDocument',
  'Extrair de Documento',
  'Extrai dados de projeto a partir de um documento enviado',
  'project',
);

export const projectsGenerateInsights = lightAction(
  'projects.generateInsights',
  'Insights do Projeto',
  'Gera análise de saúde, riscos e recomendações para o projeto',
  'project',
);

export const projectsGenerateArt = lightAction(
  'projects.generateArt',
  'Gerar Arte do Projeto',
  'Cria arte visual / thumbnail para o projeto',
  'project',
);

export const projectsRepurpose = lightAction(
  'projects.repurpose',
  'Reprocessar Projeto',
  'Gera derivações e aproveitamentos de um projeto existente',
  'project',
);

export const projectsAutoUpdate = lightAction(
  'projects.autoUpdate',
  'Atualização Automática',
  'Preenche campos do projeto automaticamente com IA',
  'project',
);

export const projectsExecutionPlan = lightAction(
  'projects.executionPlan',
  'Plano de Execução',
  'Gera plano de execução com blocos e cronograma',
  'project',
);

export const projectsExecutionBlocks = lightAction(
  'projects.executionBlocks',
  'Blocos de Execução',
  'Gera blocos de trabalho detalhados para o projeto',
  'project',
);

export const projectsNextSteps = lightAction(
  'projects.nextSteps',
  'Próximos Passos',
  'Sugere próximos passos baseado no estado atual do projeto',
  'project',
);

// --- Contracts ---
export const contractsGenerateText = lightAction(
  'contracts.generateText',
  'Gerar Texto de Contrato',
  'Gera cláusulas e texto jurídico para contrato',
  'contract',
);

export const contractsExtractFromFile = lightAction(
  'contracts.extractFromFile',
  'Extrair Contrato de Arquivo',
  'Extrai dados estruturados de um contrato PDF/imagem',
  'contract',
);

export const contractsGenerateMilestones = lightAction(
  'contracts.generateMilestones',
  'Gerar Milestones de Contrato',
  'Cria marcos e entregas baseados no escopo do contrato',
  'contract',
);

export const contractsScanSignatures = lightAction(
  'contracts.scanSignatures',
  'Verificar Assinaturas',
  'Escaneia documento em busca de assinaturas válidas',
  'contract',
);

// --- CRM ---
export const crmScoreLead = lightAction(
  'crm.scoreLead',
  'Scoring de Lead',
  'Calcula score de qualificação do lead com IA',
  'lead',
);

export const crmGenerateMessage = lightAction(
  'crm.generateMessage',
  'Gerar Mensagem para Cliente',
  'Gera mensagem personalizada para envio ao cliente',
  'client',
);

export const crmInteractionSummary = lightAction(
  'crm.interactionSummary',
  'Resumo de Interações',
  'Resume histórico de interações com o cliente',
  'client',
);

export const crmClientFromProject = lightAction(
  'crm.clientFromProject',
  'Cliente a partir de Projeto',
  'Cria registro de cliente com dados extraídos do projeto',
  'project',
);

export const crmScrapeUrl = lightAction(
  'crm.scrapeUrl',
  'Analisar Site do Cliente',
  'Extrai dados de negócio do site/URL do cliente',
  'client',
);

// --- Creative ---
export const creativeStudio = lightAction(
  'creative.studio',
  'Pacote Criativo',
  'Gera pacote completo de criativos para campanha',
  'campaign',
);

export const creativeStoryboard = lightAction(
  'creative.storyboard',
  'Gerar Storyboard',
  'Gera storyboard visual com cenas e direção de arte',
  'content_item',
);

export const creativeScript = lightAction(
  'creative.script',
  'Gerar Roteiro',
  'Gera roteiro completo com shotlist e variações de legenda',
  'content_item',
);

export const creativeCaptions = lightAction(
  'creative.captions',
  'Gerar Legendas',
  'Gera variações de legenda otimizadas para engajamento',
  'content_item',
);

export const creativeStudioBlock = lightAction(
  'creative.studioBlock',
  'Gerar Bloco Criativo',
  'Gera bloco individual do pacote criativo (brief, copy, roteiro)',
  'creative_block',
);

export const creativeLogoVariations = lightAction(
  'creative.logoVariations',
  'Variações de Logo',
  'Gera variações e adaptações do logo para diferentes formatos',
  'brand',
);

export const creativeExtractVisualAssets = lightAction(
  'creative.extractVisualAssets',
  'Extrair Assets Visuais',
  'Extrai e cataloga assets visuais de arquivos enviados',
  'project',
);

export const creativeGenerateImage = lightAction(
  'creative.generateImage',
  'Gerar Imagem IA',
  'Gera imagem a partir de prompt textual',
  'content_item',
);

export const creativeTranscribeMedia = lightAction(
  'creative.transcribeMedia',
  'Transcrever Mídia',
  'Transcreve áudio/vídeo para texto editável',
  'media',
);

// --- Marketing ---
export const marketingGenerate30DayPlan = lightAction(
  'marketing.generate30DayPlan',
  'Plano 30 Dias',
  'Gera planejamento de conteúdo para 30 dias',
  'content_plan',
);

export const marketingGenerateFromTemplate = lightAction(
  'marketing.generateFromTemplate',
  'Gerar de Template',
  'Gera conteúdo a partir de template existente',
  'content_item',
);

export const marketingContentSuggestions = lightAction(
  'marketing.contentSuggestions',
  'Sugestões de Conteúdo',
  'Gera sugestões de conteúdo baseadas em tendências e histórico',
  'content_plan',
);

export const marketingContentAi = lightAction(
  'marketing.contentAi',
  'Conteúdo com IA',
  'Geração inteligente de conteúdo completo para publicação',
  'content_item',
);

export const marketingExportCampaignPdf = lightAction(
  'marketing.exportCampaignPdf',
  'Exportar Campanha PDF',
  'Gera PDF completo do planejamento de campanha',
  'campaign',
);

export const marketingGenerateProposal = lightAction(
  'marketing.generateProposal',
  'Gerar Proposta',
  'Gera proposta comercial completa com escopo e valores',
  'proposal',
);

// --- Knowledge ---
export const knowledgeAssistant = lightAction(
  'knowledge.assistant',
  'Assistente de Conhecimento',
  'Responde perguntas com base na base de conhecimento do workspace',
  'knowledge',
);

// --- Prospecting ---
export const prospectingGenerate = lightAction(
  'prospecting.generate',
  'Gerar Prospecção',
  'Gera lista de prospects e mensagens de abordagem com IA',
  'prospect',
);

export const prospectingTts = lightAction(
  'prospecting.tts',
  'Áudio de Prospecção',
  'Gera áudio personalizado para abordagem de prospect',
  'prospect',
);

export const prospectingScoutCopy = lightAction(
  'prospecting.scoutCopy',
  'Copy de Scout',
  'Gera texto de prospecção otimizado para conversão',
  'prospect',
);

// --- Alerts ---
export const alertsComposeAi = lightAction(
  'alerts.composeAi',
  'Compor Alerta IA',
  'Gera alerta inteligente baseado em eventos do sistema',
  'alert',
);

export const alertsGenerateWhatsapp = lightAction(
  'alerts.generateWhatsapp',
  'Gerar WhatsApp de Alerta',
  'Cria mensagem WhatsApp formatada a partir de alerta',
  'alert',
);

export const alertsGenerateActionMessage = lightAction(
  'alerts.generateActionMessage',
  'Mensagem de Ação',
  'Gera mensagem de ação baseada no contexto do alerta',
  'action_item',
);

// --- Finance ---
export const financeSyncProject = lightAction(
  'finance.syncProject',
  'Sincronizar Finanças',
  'Sincroniza dados financeiros do projeto automaticamente',
  'project',
);

export const financeExecInsights = lightAction(
  'finance.execInsights',
  'Insights Executivos',
  'Gera análise executiva de performance financeira',
  'workspace',
);

// --- Files ---
export const filesClassify = lightAction(
  'files.classify',
  'Classificar Arquivo',
  'Classifica tipo e conteúdo de arquivo enviado com IA',
  'file',
);

export const filesFillMaterials = lightAction(
  'files.fillMaterials',
  'Preencher Materiais',
  'Auto-preenche lista de materiais a partir de arquivos do projeto',
  'project',
);

export const filesTemplateFields = lightAction(
  'files.templateFields',
  'Detectar Campos de Template',
  'Identifica campos variáveis em templates de documento',
  'template',
);

// --- Agent / Copilot ---
export const agentChat = lightAction(
  'agent.chat',
  'Chat com Copilot',
  'Conversa livre com o assistente IA do workspace',
  'conversation',
);

export const agentExecute = lightAction(
  'agent.execute',
  'Executar Ação do Copilot',
  'Executa plano de ação gerado pelo copilot',
  'agent_run',
);

// ============================================
// Actions Registry Map
// ============================================

export const AI_ACTIONS_REGISTRY: Record<string, AiActionDefinition<unknown, unknown>> = {
  // Full actions (routed through ai-run)
  'marketing.generateCopy': marketingGenerateCopy as AiActionDefinition<unknown, unknown>,
  'marketing.generateIdeas': marketingGenerateIdeas as AiActionDefinition<unknown, unknown>,
  'projects.generateBrief': projectsGenerateBrief as AiActionDefinition<unknown, unknown>,

  // --- Instagram ---
  'instagram.generateCampaign': instagramGenerateCampaign,
  'instagram.generatePost': instagramGeneratePost,
  'instagram.abTest': instagramAbTest,
  'instagram.fetchInsights': instagramFetchInsights,
  'instagram.scrapeProfile': instagramScrapeProfile,
  'instagram.exportPost': instagramExportPost,
  'instagram.publish': instagramPublish,

  // --- Tasks ---
  'tasks.dailySummary': tasksDailySummary,
  'tasks.suggestPlan': tasksSuggestPlan,
  'tasks.refine': tasksRefine,
  'tasks.detectDuplicates': tasksDetectDuplicates,
  'tasks.generateAutomations': tasksGenerateAutomations,
  'tasks.generateTemplates': tasksGenerateTemplates,
  'tasks.fromText': tasksFromText,
  'tasks.suggestDeadline': tasksSuggestDeadline,
  'tasks.suggestPriorities': tasksSuggestPriorities,
  'tasks.analyze': tasksAnalyze,
  'tasks.search': tasksSearch,

  // --- Projects ---
  'projects.extractDocument': projectsExtractDocument,
  'projects.generateInsights': projectsGenerateInsights,
  'projects.generateArt': projectsGenerateArt,
  'projects.repurpose': projectsRepurpose,
  'projects.autoUpdate': projectsAutoUpdate,
  'projects.executionPlan': projectsExecutionPlan,
  'projects.executionBlocks': projectsExecutionBlocks,
  'projects.nextSteps': projectsNextSteps,

  // --- Contracts ---
  'contracts.generateText': contractsGenerateText,
  'contracts.extractFromFile': contractsExtractFromFile,
  'contracts.generateMilestones': contractsGenerateMilestones,
  'contracts.scanSignatures': contractsScanSignatures,

  // --- CRM ---
  'crm.scoreLead': crmScoreLead,
  'crm.generateMessage': crmGenerateMessage,
  'crm.interactionSummary': crmInteractionSummary,
  'crm.clientFromProject': crmClientFromProject,
  'crm.scrapeUrl': crmScrapeUrl,

  // --- Creative ---
  'creative.studio': creativeStudio,
  'creative.storyboard': creativeStoryboard,
  'creative.script': creativeScript,
  'creative.captions': creativeCaptions,
  'creative.studioBlock': creativeStudioBlock,
  'creative.logoVariations': creativeLogoVariations,
  'creative.extractVisualAssets': creativeExtractVisualAssets,
  'creative.generateImage': creativeGenerateImage,
  'creative.transcribeMedia': creativeTranscribeMedia,

  // --- Marketing ---
  'marketing.generate30DayPlan': marketingGenerate30DayPlan,
  'marketing.generateFromTemplate': marketingGenerateFromTemplate,
  'marketing.contentSuggestions': marketingContentSuggestions,
  'marketing.contentAi': marketingContentAi,
  'marketing.exportCampaignPdf': marketingExportCampaignPdf,
  'marketing.generateProposal': marketingGenerateProposal,

  // --- Knowledge ---
  'knowledge.assistant': knowledgeAssistant,

  // --- Prospecting ---
  'prospecting.generate': prospectingGenerate,
  'prospecting.tts': prospectingTts,
  'prospecting.scoutCopy': prospectingScoutCopy,

  // --- Alerts ---
  'alerts.composeAi': alertsComposeAi,
  'alerts.generateWhatsapp': alertsGenerateWhatsapp,
  'alerts.generateActionMessage': alertsGenerateActionMessage,

  // --- Finance ---
  'finance.syncProject': financeSyncProject,
  'finance.execInsights': financeExecInsights,

  // --- Files ---
  'files.classify': filesClassify,
  'files.fillMaterials': filesFillMaterials,
  'files.templateFields': filesTemplateFields,

  // --- Agent / Copilot ---
  'agent.chat': agentChat,
  'agent.execute': agentExecute,
};

export function getAiAction(key: string): AiActionDefinition<unknown, unknown> | undefined {
  return AI_ACTIONS_REGISTRY[key];
}

export function getAiActionKeys(): string[] {
  return Object.keys(AI_ACTIONS_REGISTRY);
}

/**
 * Get human-readable label for an action key
 */
export function getAiActionLabel(key: string): string {
  return AI_ACTIONS_REGISTRY[key]?.title || key;
}

/**
 * Get all actions grouped by module
 */
export function getAiActionsByModule(): Record<string, AiActionDefinition<unknown, unknown>[]> {
  const grouped: Record<string, AiActionDefinition<unknown, unknown>[]> = {};
  for (const action of Object.values(AI_ACTIONS_REGISTRY)) {
    const module = action.key.split('.')[0];
    if (!grouped[module]) grouped[module] = [];
    grouped[module].push(action);
  }
  return grouped;
}
