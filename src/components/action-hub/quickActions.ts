import {
  ExternalLink, Copy, UserPlus, Receipt, Briefcase,
  Calendar, Package, Users, ClipboardList, Video,
  FileText, Megaphone, Target,
} from "lucide-react";
import { ActionItem } from "@/hooks/useActionItems";

export interface QuickAction {
  label: string;
  icon: typeof ExternalLink;
  href?: string;
  onClick?: () => void;
}

export function resolveQuickActions(item: ActionItem): QuickAction[] {
  const pid = item.project_id;
  const actions: QuickAction[] = [];

  switch (item.type) {
    case "financial":
      actions.push({ label: "Ver Fatura →", icon: Receipt, href: "/financeiro/receitas" });
      break;
    case "deadline":
      actions.push({ label: "Abrir Projeto →", icon: Calendar, href: pid ? `/projetos/${pid}` : "/projetos" });
      break;
    case "delivery":
      actions.push({ label: "Ver Entrega →", icon: Package, href: pid ? `/projetos/${pid}` : "/projetos" });
      break;
    case "production_step":
      actions.push({ label: "Ir p/ Produção →", icon: Target, href: pid ? `/projetos/${pid}` : "/projetos" });
      break;
    case "follow_up":
      actions.push({ label: "Abrir CRM →", icon: Users, href: "/crm" });
      break;
    case "task_overdue":
      actions.push({ label: "Ver Tarefa →", icon: ClipboardList, href: "/tarefas" });
      break;
    case "meeting":
    case "call":
      actions.push({ label: "Ver Agenda →", icon: Video, href: "/agenda" });
      break;
    case "proposal":
      actions.push({ label: "Ver Proposta →", icon: FileText, href: "/propostas" });
      break;
    case "contract":
      actions.push({ label: "Ver Contrato →", icon: Briefcase, href: "/contratos" });
      break;
    case "campaign":
      actions.push({ label: "Ver Marketing →", icon: Megaphone, href: "/marketing" });
      break;
    default:
      if (pid) {
        actions.push({ label: "Abrir Projeto →", icon: ExternalLink, href: `/projetos/${pid}` });
      }
      break;
  }

  return actions;
}

export function buildCopySummary(item: ActionItem): string {
  const parts = [`📌 ${item.title}`];
  if (item.description) parts.push(item.description);
  if (item.due_at) {
    parts.push(`⏰ Prazo: ${new Date(item.due_at).toLocaleDateString("pt-BR")}`);
  }
  parts.push(`🔹 Prioridade: ${item.priority}`);
  return parts.join("\n");
}

export function getPrimaryHref(item: ActionItem): string | null {
  const actions = resolveQuickActions(item);
  return actions[0]?.href || null;
}
