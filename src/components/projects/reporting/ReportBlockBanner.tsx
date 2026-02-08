/**
 * ReportBlockBanner - Payment block warning banner
 * Shows when project is blocked due to overdue payments
 */

import { Button } from "@/components/ui/button";
import { Lock, AlertTriangle } from "lucide-react";

interface ReportBlockBannerProps {
  isBlocked: boolean;
  onRegularize?: () => void;
}

export function ReportBlockBanner({ isBlocked, onRegularize }: ReportBlockBannerProps) {
  if (!isBlocked) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/30 p-6 flex items-start gap-4">
      <div className="w-10 h-10 rounded-none bg-destructive/20 flex items-center justify-center shrink-0">
        <Lock className="w-5 h-5 text-destructive" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h3 className="font-semibold text-destructive">
            Projeto Bloqueado por Inadimplência
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Existe uma fatura em atraso vinculada a este projeto. A entrega final e o acesso a novos arquivos 
          estão temporariamente suspensos até a regularização financeira.
        </p>
      </div>

      {onRegularize && (
        <Button 
          variant="destructive" 
          size="sm"
          onClick={onRegularize}
          className="shrink-0"
        >
          Regularizar Agora
        </Button>
      )}
    </div>
  );
}
