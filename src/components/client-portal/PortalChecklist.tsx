import { Project } from "@/types/projects";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Upload, Clock } from "lucide-react";

interface PortalChecklistProps {
  project: Project;
}

export function PortalChecklist({ project }: PortalChecklistProps) {
  const checklist = project.clientChecklist;

  if (checklist.length === 0) {
    return null;
  }

  const pendingCount = checklist.filter(i => i.status === 'pendente').length;
  const submittedCount = checklist.filter(i => i.status === 'enviado').length;
  const approvedCount = checklist.filter(i => i.status === 'aprovado').length;

  return (
    <section className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Checklist do Cliente</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Itens que você precisa enviar ou validar
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {pendingCount > 0 && (
            <span className="text-muted-foreground">{pendingCount} pendente(s)</span>
          )}
          {submittedCount > 0 && (
            <span className="text-primary/70">{submittedCount} enviado(s)</span>
          )}
          {approvedCount > 0 && (
            <span className="text-primary">{approvedCount} aprovado(s)</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {checklist.map((item) => (
          <div 
            key={item.id}
            className={`
              flex items-start gap-4 p-4 rounded-xl transition-colors
              ${item.status === 'aprovado' ? 'bg-primary/5 border border-primary/20' : ''}
              ${item.status === 'enviado' ? 'bg-primary/5 border border-primary/10' : ''}
              ${item.status === 'pendente' ? 'bg-muted/30' : ''}
            `}
          >
            {/* Status Icon */}
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${item.status === 'aprovado' ? 'bg-primary/20' : ''}
              ${item.status === 'enviado' ? 'bg-primary/10' : ''}
              ${item.status === 'pendente' ? 'bg-muted' : ''}
            `}>
              {item.status === 'aprovado' && <CheckCircle className="w-4 h-4 text-primary" />}
              {item.status === 'enviado' && <Clock className="w-4 h-4 text-primary/70" />}
              {item.status === 'pendente' && <Upload className="w-4 h-4 text-muted-foreground" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium ${
                item.status === 'aprovado' ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}>
                {item.title}
              </h4>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              )}
            </div>

            {/* Action */}
            {item.status === 'pendente' && (
              <Button size="sm" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            )}
            {item.status === 'enviado' && (
              <span className="text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded">
                Aguardando aprovação
              </span>
            )}
            {item.status === 'aprovado' && (
              <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">
                Aprovado
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
