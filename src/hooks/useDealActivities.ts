import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface DealActivity {
  id: string;
  deal_id: string;
  user_id: string | null;
  type: string;
  title: string;
  description: string | null;
  metadata: any;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useDealActivities(dealId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const activitiesQuery = useQuery({
    queryKey: ["deal-activities", dealId],
    queryFn: async (): Promise<DealActivity[]> => {
      if (!dealId) return [];
      const { data, error } = await supabase
        .from("deal_activities")
        .select("*, profile:user_id(full_name, avatar_url)")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!dealId && !!user?.id,
  });

  const addActivity = useMutation({
    mutationFn: async (input: {
      deal_id: string;
      type: string;
      title: string;
      description?: string;
      metadata?: any;
    }) => {
      const { error } = await supabase
        .from("deal_activities")
        .insert({
          deal_id: input.deal_id,
          user_id: user?.id,
          type: input.type,
          title: input.title,
          description: input.description || null,
          metadata: input.metadata || {},
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-activities", dealId] });
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
    },
    onError: (err: any) => {
      toast.error("Erro ao adicionar atividade: " + err.message);
    },
  });

  const scoreLead = useMutation({
    mutationFn: async (deal: any) => {
      const { data, error } = await supabase.functions.invoke("score-lead", {
        body: { deal },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Update deal with score
      await supabase
        .from("crm_deals")
        .update({
          lead_score: data.score,
          lead_score_reasons: data.reasons,
        })
        .eq("id", deal.id);

      // Log activity
      await supabase.from("deal_activities").insert({
        deal_id: deal.id,
        user_id: user?.id,
        type: "score_update",
        title: `Lead Score: ${data.score}/100`,
        description: data.suggestion,
        metadata: { score: data.score, reasons: data.reasons },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["crm-deals"] });
      queryClient.invalidateQueries({ queryKey: ["deal-activities", dealId] });
      toast.success(`Lead Score atualizado: ${data.score}/100`);
    },
    onError: (err: any) => {
      toast.error("Erro no scoring: " + err.message);
    },
  });

  return {
    activities: activitiesQuery.data ?? [],
    isLoading: activitiesQuery.isLoading,
    addActivity,
    scoreLead,
  };
}
