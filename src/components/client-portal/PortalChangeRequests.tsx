/**
 * PortalChangeRequests - Lista de Ajustes/Alterações solicitadas
 * 
 * Exibe e permite criar solicitações de ajustes com:
 * - Status: aberto, em_andamento, resolvido, rejeitado
 * - Prioridade: baixa, normal, alta, urgente
 * - Autor e responsável
 */

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ListChecks,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { sc } from "@/lib/colors";

export interface ChangeRequest {
  id: string;
  title: string;
  description?: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  author_name: string;
  author_role: 'client' | 'manager';
  assigned_to?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  created_at: string;
}

interface PortalChangeRequestsProps {
  requests: ChangeRequest[];
  onCreateRequest: (data: { 
    title: string; 
    description?: string; 
    authorName: string;
    authorEmail?: string;
    priority?: string;
  }) => void;
  isCreating: boolean;
  isClientView?: boolean;
}

const STATUS_ICONS: Record<ChangeRequest['status'], { label: string; icon: typeof CheckCircle2 }> = {
  open: { label: 'Aberto', icon: AlertCircle },
  in_progress: { label: 'Em Andamento', icon: Clock },
  resolved: { label: 'Resolvido', icon: CheckCircle2 },
  rejected: { label: 'Rejeitado', icon: XCircle },
};

const PRIORITY_LABELS: Record<ChangeRequest['priority'], string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

function RequestItem({ request }: { request: ChangeRequest }) {
  const [isOpen, setIsOpen] = useState(false);
  const statusMeta = STATUS_ICONS[request.status];
  const statusStyle = sc.status(request.status === 'open' ? 'pending' : request.status === 'resolved' ? 'completed' : request.status);
  const priorityStyle = sc.priority(request.priority);
  const StatusIcon = statusMeta.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "rounded-xl border p-3 transition-colors",
        request.status === 'resolved' ? "bg-muted/30 opacity-60" : "bg-background"
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-start gap-3">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0", statusConfig.color)}>
              <StatusIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={cn(
                  "font-medium text-sm truncate",
                  request.status === 'resolved' && "line-through text-muted-foreground"
                )}>
                  {request.title}
                </h4>
                {request.priority !== 'normal' && (
                  <Badge variant="outline" className={cn("text-[9px]", priorityConfig.color)}>
                    {priorityConfig.label}
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Por {request.author_name} • {format(new Date(request.created_at), "dd/MM", { locale: ptBR })}
                {request.assigned_to && ` • Responsável: ${request.assigned_to}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("text-[9px]", statusConfig.color)}>
                {statusConfig.label}
              </Badge>
              {request.description && (
                isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {request.description && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.description}</p>
              {request.resolved_at && request.resolved_by && (
                <p className="text-[10px] text-emerald-500 mt-2">
                  ✓ Resolvido por {request.resolved_by} em {format(new Date(request.resolved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function PortalChangeRequests({
  requests,
  onCreateRequest,
  isCreating,
  isClientView = true,
}: PortalChangeRequestsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    title: '',
    description: '',
  });

  const openRequests = requests.filter(r => r.status === 'open' || r.status === 'in_progress');
  const closedRequests = requests.filter(r => r.status === 'resolved' || r.status === 'rejected');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.title) return;

    onCreateRequest({
      title: form.title,
      description: form.description || undefined,
      authorName: form.name,
      authorEmail: form.email || undefined,
    });

    setForm({ name: form.name, email: form.email, title: '', description: '' });
    setIsFormOpen(false);
  };

  return (
    <section className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Lista de Ajustes</h3>
          {openRequests.length > 0 && (
            <Badge variant="secondary" className="text-xs">{openRequests.length} pendente{openRequests.length !== 1 && 's'}</Badge>
          )}
        </div>
        {isClientView && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="h-8 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Novo Ajuste
          </Button>
        )}
      </div>

      {/* New Request Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-border/50 space-y-3 bg-muted/20">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Seu nome *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-9 text-sm"
              required
            />
            <Input
              type="email"
              placeholder="E-mail (opcional)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <Input
            placeholder="Título do ajuste *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="h-9 text-sm"
            required
          />
          <Textarea
            placeholder="Descreva o ajuste necessário (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-[60px] text-sm resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => setIsFormOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              size="sm"
              disabled={!form.name || !form.title || isCreating}
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Enviar
            </Button>
          </div>
        </form>
      )}

      {/* Requests List */}
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {requests.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum ajuste solicitado</p>
            <p className="text-[10px] text-muted-foreground/60">
              Tudo certo com os materiais até agora
            </p>
          </div>
        ) : (
          <>
            {/* Open/In Progress */}
            {openRequests.length > 0 && (
              <div className="space-y-2">
                {openRequests.map((request) => (
                  <RequestItem key={request.id} request={request} />
                ))}
              </div>
            )}

            {/* Closed */}
            {closedRequests.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full py-2">
                  <ChevronDown className="w-3 h-3" />
                  {closedRequests.length} ajuste{closedRequests.length !== 1 && 's'} finalizado{closedRequests.length !== 1 && 's'}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {closedRequests.map((request) => (
                    <RequestItem key={request.id} request={request} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}
      </div>
    </section>
  );
}
