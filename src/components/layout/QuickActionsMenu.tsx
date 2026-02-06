import { useState } from "react";
import { Plus, UserPlus, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface QuickActionsMenuProps {
  onNewLead: () => void;
  onNewProposal: () => void;
}

export function QuickActionsMenu({ onNewLead, onNewProposal }: QuickActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
        className="w-48 bg-background/95 backdrop-blur-xl border-white/10"
      >
        <DropdownMenuItem 
          onClick={() => {
            onNewLead();
            setOpen(false);
          }}
          className="gap-3 py-2.5 cursor-pointer"
        >
          <UserPlus className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Novo Lead</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => {
            onNewProposal();
            setOpen(false);
          }}
          className="gap-3 py-2.5 cursor-pointer"
        >
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider">Nova Proposta</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
