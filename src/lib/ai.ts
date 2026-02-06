import { supabase } from "@/integrations/supabase/client";

// AI Client for Marketing module
// All Edge Function calls go through here

export interface GenerateIdeasParams {
  pillar?: string;
  channel?: string;
  format?: string;
  niche?: string;
  objective?: string;
  tone?: string;
}

export interface GenerateIdeasResult {
  ideas: Array<{
    title: string;
    hook: string;
    pillar: string;
    channel: string;
    format: string;
    target?: string;
    score: number;
  }>;
}

export interface GenerateCaptionsParams {
  contentItem: {
    id: string;
    title: string;
    channel?: string;
    format?: string;
    pillar?: string;
    hook?: string;
    notes?: string;
    caption_short?: string;
    caption_long?: string;
    cta?: string;
    hashtags?: string;
    script?: string;
  };
}

export interface GenerateCaptionsResult {
  hook: string;
  caption_short: string;
  caption_long: string;
  cta: string;
  hashtags: string;
  script?: string;
  variations?: Array<{
    hook: string;
    caption_short: string;
  }>;
}

export interface GenerateCampaignPackageParams {
  campaign: {
    id: string;
    name: string;
    objective?: string;
    offer?: string;
    audience?: string;
    start_date?: string;
    end_date?: string;
    budget?: number;
  };
}

export interface GenerateCampaignPackageResult {
  concept: {
    premissa: string;
    promessa: string;
    tom: string;
    tema: string;
    metafora_central: string;
    big_idea: string;
    headline: string;
    subheadline: string;
    argumento_comercial: string;
  };
  script: {
    hook: string;
    desenvolvimento: string;
    cta: string;
    duracao_estimada: string;
  };
  content_suggestions: Array<{
    title: string;
    format: string;
    channel: string;
    description: string;
  }>;
}

export type AIError = {
  error: string;
  status?: number;
};

export function isAIError(result: unknown): result is AIError {
  return typeof result === 'object' && result !== null && 'error' in result;
}

/**
 * Generate 10 content ideas using AI
 */
export async function generateIdeas(params: GenerateIdeasParams): Promise<GenerateIdeasResult | AIError> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-ideas', {
      body: {
        pillar: params.pillar !== 'all' ? params.pillar : undefined,
        channel: params.channel !== 'all' ? params.channel : undefined,
        format: params.format !== 'all' ? params.format : undefined,
        niche: params.niche,
        objective: params.objective,
        tone: params.tone,
      }
    });

    if (error) {
      console.error('generate-ideas error:', error);
      return { error: error.message || 'Erro ao gerar ideias', status: 500 };
    }

    if (data?.error) {
      return { error: data.error, status: data.status || 500 };
    }

    return data as GenerateIdeasResult;
  } catch (err) {
    console.error('generateIdeas exception:', err);
    return { error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}

/**
 * Generate captions and copy for a content item
 */
export async function generateCaptions(params: GenerateCaptionsParams): Promise<GenerateCaptionsResult | AIError> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-captions', {
      body: {
        contentItem: params.contentItem
      }
    });

    if (error) {
      console.error('generate-captions error:', error);
      return { error: error.message || 'Erro ao gerar copy', status: 500 };
    }

    if (data?.error) {
      return { error: data.error, status: data.status || 500 };
    }

    return data as GenerateCaptionsResult;
  } catch (err) {
    console.error('generateCaptions exception:', err);
    return { error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}

/**
 * Generate campaign creative package using AI
 */
export async function generateCampaignPackage(params: GenerateCampaignPackageParams): Promise<GenerateCampaignPackageResult | AIError> {
  try {
    const { campaign } = params;
    
    // Build briefing text from campaign data
    const briefingText = `
CAMPANHA: ${campaign.name}
${campaign.objective ? `OBJETIVO: ${campaign.objective}` : ''}
${campaign.offer ? `OFERTA: ${campaign.offer}` : ''}
${campaign.audience ? `PÚBLICO-ALVO: ${campaign.audience}` : ''}
${campaign.start_date && campaign.end_date ? `PERÍODO: ${campaign.start_date} a ${campaign.end_date}` : ''}
${campaign.budget ? `BUDGET: R$ ${campaign.budget.toLocaleString('pt-BR')}` : ''}

Gere um pacote criativo focado em conteúdo para redes sociais, incluindo conceito narrativo, roteiro base e sugestões de posts.
    `.trim();

    const { data, error } = await supabase.functions.invoke('creative-studio', {
      body: {
        briefId: campaign.id,
        inputText: briefingText,
        packageType: 'campaign',
      }
    });

    if (error) {
      console.error('creative-studio error:', error);
      return { error: error.message || 'Erro ao gerar pacote criativo', status: 500 };
    }

    if (data?.error) {
      return { error: data.error, status: data.status || 500 };
    }

    // Transform creative-studio output to campaign package format
    const result: GenerateCampaignPackageResult = {
      concept: data.concept || {},
      script: data.script || {},
      content_suggestions: (data.storyboard || []).slice(0, 5).map((scene: { title: string; description: string }) => ({
        title: scene.title,
        format: 'reel',
        channel: 'instagram',
        description: scene.description,
      })),
    };

    return result;
  } catch (err) {
    console.error('generateCampaignPackage exception:', err);
    return { error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}
