/**
 * useProspectAI — Hook for AI-powered prospecting
 * Commands: generate_message, plan_campaign, lead_summary, respond_objection, followup
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MessageVariants {
  variant_curta: string;
  variant_media: string;
  variant_firme: string;
  audio_script: string;
  subject_hint: string;
}

export interface CampaignPlan {
  objective: string;
  cadence_steps: Array<{
    day_offset: number;
    channel: string;
    action: string;
    template_hint?: string;
  }>;
  approaches: Array<{
    label: string;
    angle: string;
    first_message: string;
  }>;
  spam_risk: 'low' | 'medium' | 'high';
  best_channel: string;
  best_time: string;
  notes?: string;
}

export interface LeadSummary {
  who: string;
  why_good_fit: string;
  last_interaction?: string;
  next_action: string;
  close_probability: number;
  approach_tips: string;
  avoid?: string;
}

export function useProspectAI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const generate = async (params: {
    command: string;
    prospect_id?: string;
    opportunity_id?: string;
    context?: Record<string, any>;
    custom_prompt?: string;
  }) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('prospect-ai-generate', {
        body: params,
      });

      if (error) {
        toast.error('Erro ao gerar com IA');
        console.error('AI error:', error);
        return null;
      }

      if (data?.error) {
        toast.error(data.error);
        return null;
      }

      setLastResult(data.result);
      return data.result;
    } catch (err) {
      console.error('prospect-ai error:', err);
      toast.error('Falha na comunicação com IA');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMessages = async (prospectId?: string, opportunityId?: string, context?: Record<string, any>) => {
    return generate({ command: 'generate_message', prospect_id: prospectId, opportunity_id: opportunityId, context }) as Promise<MessageVariants | null>;
  };

  const planCampaign = async (prospectId?: string, context?: Record<string, any>) => {
    return generate({ command: 'plan_campaign', prospect_id: prospectId, context }) as Promise<CampaignPlan | null>;
  };

  const getLeadSummary = async (prospectId: string, opportunityId?: string) => {
    return generate({ command: 'lead_summary', prospect_id: prospectId, opportunity_id: opportunityId }) as Promise<LeadSummary | null>;
  };

  const respondToObjection = async (prospectId: string, objection: string, opportunityId?: string) => {
    return generate({
      command: 'respond_objection',
      prospect_id: prospectId,
      opportunity_id: opportunityId,
      context: { objection },
    });
  };

  const generateFollowup = async (prospectId: string, opportunityId?: string, followupType?: string, daysSince?: number) => {
    return generate({
      command: 'followup',
      prospect_id: prospectId,
      opportunity_id: opportunityId,
      context: { followup_type: followupType, days_since_contact: daysSince },
    });
  };

  const generateAudio = async (text: string, voiceId?: string): Promise<string | null> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/prospect-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voice_id: voiceId }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.error || 'Erro ao gerar áudio');
        return null;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;
    } catch (err) {
      console.error('TTS error:', err);
      toast.error('Falha ao gerar áudio');
      return null;
    }
  };

  return {
    isGenerating,
    lastResult,
    generateMessages,
    planCampaign,
    getLeadSummary,
    respondToObjection,
    generateFollowup,
    generateAudio,
  };
}
