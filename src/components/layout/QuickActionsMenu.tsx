import { useNavigate } from "react-router-dom";
import { Plus, UserPlus, FileText, FolderPlus, Sparkles, CheckSquare, Clapperboard, Newspaper, Megaphone, TrendingUp, Receipt, FileSignature } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface QuickActionsMenuProps {
  onNewLead: () => void;
  onNewProposal: () => void;
  onNewProject: () => void;
  onNewAIProject: () => void;
}

export function QuickActionsMenu({ onNewLead, onNewProposal, onNewProject, onNewAIProject }: QuickActionsMenuProps) {
  const navigate = useNavigate();

  const navigateTo = (path: string) => navigate(path);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-foreground"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline text-xs uppercase tracking-wider font-light">Novo</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-background/95 backdrop-blur-xl border-white/10 z-50"
      >
        {/* COMERCIAL */}
        <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground/60 px-2 pt-2 pb-1">
          Comercial
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={onNewLead} className="gap-3 py-2.5 cursor-pointer">
          <UserPlus className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Novo Lead</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNewProposal} className="gap-3 py-2.5 cursor-pointer">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Nova Proposta</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigateTo('/contratos?new=true')} className="gap-3 py-2.5 cursor-pointer">
          <FileSignature className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Novo Contrato</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.06]" />

        {/* PRODUÇÃO */}
        <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground/60 px-2 pt-1 pb-1">
          Produção
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={onNewProject} className="gap-3 py-2.5 cursor-pointer">
          <FolderPlus className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Novo Projeto</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNewAIProject} className="gap-3 py-2.5 cursor-pointer">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Projeto com IA</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigateTo('/tarefas?new=true')} className="gap-3 py-2.5 cursor-pointer">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Nova Tarefa</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.06]" />

        {/* CONTEÚDO & CRIATIVO */}
        <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground/60 px-2 pt-1 pb-1">
          Conteúdo & Criativo
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigateTo('/marketing/studio')} className="gap-3 py-2.5 cursor-pointer">
          <Clapperboard className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Trabalho Criativo</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigateTo('/marketing/pipeline?new=true')} className="gap-3 py-2.5 cursor-pointer">
          <Newspaper className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Novo Conteúdo</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigateTo('/marketing/campanhas?new=true')} className="gap-3 py-2.5 cursor-pointer">
          <Megaphone className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Nova Campanha</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.06]" />

        {/* FINANCEIRO */}
        <DropdownMenuLabel className="text-[9px] uppercase tracking-widest text-muted-foreground/60 px-2 pt-1 pb-1">
          Financeiro
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigateTo('/financeiro/receitas?new=true')} className="gap-3 py-2.5 cursor-pointer">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Nova Receita</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigateTo('/financeiro/despesas?new=true')} className="gap-3 py-2.5 cursor-pointer">
          <Receipt className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Nova Despesa</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
