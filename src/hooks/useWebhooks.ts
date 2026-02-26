import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  payload: any;
  response_status: number | null;
  response_body: string | null;
  delivered_at: string;
  success: boolean;
}

const AVAILABLE_EVENTS = [
  "project.created",
  "project.updated",
  "project.status_changed",
  "task.created",
  "task.completed",
  "task.assigned",
  "client.created",
  "deal.won",
  "deal.lost",
  "revenue.received",
  "invoice.overdue",
] as const;

export { AVAILABLE_EVENTS };

export function useWebhooks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const webhooksQuery = useQuery({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhooks" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) as Webhook[];
    },
    enabled: !!user?.id,
  });

  const createWebhook = useMutation({
    mutationFn: async (webhook: { name: string; url: string; events: string[] }) => {
      const { error } = await supabase
        .from("webhooks" as any)
        .insert({ ...webhook, created_by: user?.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook criado");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const updateWebhook = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Webhook> & { id: string }) => {
      const { error } = await supabase
        .from("webhooks" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook atualizado");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("webhooks" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook removido");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  return {
    webhooks: webhooksQuery.data ?? [],
    isLoading: webhooksQuery.isLoading,
    createWebhook,
    updateWebhook,
    deleteWebhook,
  };
}

export function useWebhookDeliveries(webhookId: string) {
  return useQuery({
    queryKey: ["webhook-deliveries", webhookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_deliveries" as any)
        .select("*")
        .eq("webhook_id", webhookId)
        .order("delivered_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as any[]) as WebhookDelivery[];
    },
    enabled: !!webhookId,
  });
}
