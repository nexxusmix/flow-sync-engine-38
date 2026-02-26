import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, FileText, DollarSign, Users, FolderKanban, CheckSquare, MessageSquare, Mail, Zap } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EventLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_name: string | null;
  payload: any;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: "criou",
  update: "atualizou",
  delete: "removeu",
  login: "entrou na plataforma",
  logout: "saiu da plataforma",
  portal_visited: "visitou o portal",
  comment_added: "comentou",
  approval_granted: "aprovou",
  revision_requested: "solicitou revisão",
  message_sent: "enviou mensagem",
  thread_closed: "fechou atendimento",
  "whatsapp.sent": "enviou WhatsApp",
  payment_block_activated: "bloqueio de pagamento",
  crm_contact_auto_created: "criou contato CRM",
  invite_sent: "convidou membro",
};

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  project: <FolderKanban className="w-3.5 h-3.5" />,
  task: <CheckSquare className="w-3.5 h-3.5" />,
  revenue: <DollarSign className="w-3.5 h-3.5" />,
  expense: <DollarSign className="w-3.5 h-3.5" />,
  proposal: <FileText className="w-3.5 h-3.5" />,
  contract: <FileText className="w-3.5 h-3.5" />,
  crm_contact: <Users className="w-3.5 h-3.5" />,
  portal_comment: <MessageSquare className="w-3.5 h-3.5" />,
  portal_approval: <CheckSquare className="w-3.5 h-3.5" />,
  inbox_message: <Mail className="w-3.5 h-3.5" />,
  inbox_thread: <Mail className="w-3.5 h-3.5" />,
  workspace_settings: <Zap className="w-3.5 h-3.5" />,
  prospect: <Users className="w-3.5 h-3.5" />,
};

interface ActivityFeedProps {
  limit?: number;
  compact?: boolean;
}

export function ActivityFeed({ limit = 20, compact = false }: ActivityFeedProps) {
  const { user } = useAuth();

  const { data: events, isLoading } = useQuery({
    queryKey: ["activity-feed", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_logs")
        .select("id, action, entity_type, entity_id, actor_name, payload, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as EventLog[];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!events?.length) {
    return (
      <div className="text-center py-8">
        <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
      </div>
    );
  }

  const content = (
    <div className="space-y-1">
      <AnimatePresence>
        {events.map((event, i) => {
          const actionLabel = ACTION_LABELS[event.action] || event.action;
          const icon = ENTITY_ICONS[event.entity_type] || <Activity className="w-3.5 h-3.5" />;
          const timeAgo = formatDistanceToNow(new Date(event.created_at), {
            addSuffix: true,
            locale: ptBR,
          });

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5 text-muted-foreground group-hover:text-foreground transition-colors">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="font-medium">{event.actor_name || "Sistema"}</span>{" "}
                  <span className="text-muted-foreground">{actionLabel}</span>{" "}
                  {event.entity_type && (
                    <span className="text-muted-foreground">{event.entity_type}</span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{timeAgo}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  if (compact) return content;

  return <ScrollArea className="h-[400px]">{content}</ScrollArea>;
}
