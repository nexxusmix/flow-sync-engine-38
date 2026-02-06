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
// Actions Registry Map
// ============================================

export const AI_ACTIONS_REGISTRY: Record<string, AiActionDefinition<unknown, unknown>> = {
  'marketing.generateCopy': marketingGenerateCopy as AiActionDefinition<unknown, unknown>,
  'marketing.generateIdeas': marketingGenerateIdeas as AiActionDefinition<unknown, unknown>,
  'projects.generateBrief': projectsGenerateBrief as AiActionDefinition<unknown, unknown>,
};

export function getAiAction(key: string): AiActionDefinition<unknown, unknown> | undefined {
  return AI_ACTIONS_REGISTRY[key];
}

export function getAiActionKeys(): string[] {
  return Object.keys(AI_ACTIONS_REGISTRY);
}
