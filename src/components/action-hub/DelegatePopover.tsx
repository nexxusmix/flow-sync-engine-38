import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Check } from "lucide-react";
import { useWorkspaceMembers, WorkspaceMember } from "@/hooks/useWorkspaceMembers";
import { cn } from "@/lib/utils";

interface DelegatePopoverProps {
  onDelegate: (userId: string, userName: string) => void;
  currentAssignee?: string | null;
}

export function DelegatePopover({ onDelegate, currentAssignee }: DelegatePopoverProps) {
  const [open, setOpen] = useState(false);
  const { members, isLoading } = useWorkspaceMembers();

  return (
    <div className="relative">
      <motion.button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[10px] font-mono uppercase"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Delegar"
      >
        <UserPlus className="w-3 h-3" strokeWidth={1.5} /> Delegar
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 z-50 w-52 rounded-xl border border-border/50 bg-card shadow-lg p-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[9px] font-mono uppercase text-muted-foreground px-2 py-1">
              Atribuir a:
            </p>
            {isLoading ? (
              <p className="text-[10px] text-muted-foreground px-2 py-2">Carregando...</p>
            ) : members.length === 0 ? (
              <p className="text-[10px] text-muted-foreground px-2 py-2">Nenhum membro encontrado</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {members.map((m: WorkspaceMember) => {
                  const name = m.profile?.full_name || m.profile?.email || "Membro";
                  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                  const isSelected = m.user_id === currentAssignee;

                  return (
                    <button
                      key={m.id}
                      onClick={() => { onDelegate(m.user_id, name); setOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-[11px]",
                        isSelected
                          ? "bg-primary/15 text-primary"
                          : "hover:bg-muted/40 text-foreground"
                      )}
                    >
                      {m.profile?.avatar_url ? (
                        <img src={m.profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[7px] font-mono text-primary">
                          {initials}
                        </div>
                      )}
                      <span className="truncate flex-1">{name}</span>
                      {isSelected && <Check className="w-3 h-3 text-primary flex-shrink-0" strokeWidth={2} />}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
