import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Zap, ChevronRight, ChevronLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useActionItems, generateActionItems, ActionItem } from "@/hooks/useActionItems";
import { ActionCard } from "./ActionCard";
import { MessageDraftModal } from "./MessageDraftModal";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  projectId?: string;
  title?: string;
}

export function ActionHubRail({ projectId, title = "Central de Ações" }: Props) {
  const { items, isLoading, completeAction, snoozeAction } = useActionItems(projectId);
  const [messageItem, setMessageItem] = useState<ActionItem | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [generated, setGenerated] = useState(false);

  // Auto-generate on mount
  useEffect(() => {
    if (!generated) {
      generateActionItems().then(() => setGenerated(true));
    }
  }, [generated]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  };

  const p0Count = items.filter(i => i.priority === "P0").length;
  const openCount = items.filter(i => i.status === "open").length;

  return (
    <motion.div
      className="glass-card rounded-[2rem] p-6"
      initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay: 0.2, type: "spring", stiffness: 70, damping: 18 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-normal text-foreground uppercase tracking-wider">{title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-muted-foreground font-mono">{openCount} abertas</span>
              {p0Count > 0 && (
                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 font-mono">{p0Count} críticas</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => scroll("left")} className="w-7 h-7 rounded-lg bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </button>
          <button onClick={() => scroll("right")} className="w-7 h-7 rounded-lg bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </button>
          <Link to="/central-acoes" className="flex items-center gap-1 text-[10px] text-primary font-mono uppercase hover:text-primary/80 transition-colors ml-2">
            Ver tudo <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      {/* Scrollable Rail */}
      {items.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {items.map(item => (
            <div key={item.id} className="snap-start">
              <ActionCard
                item={item}
                compact
                onComplete={(id) => completeAction.mutate(id)}
                onSnooze={(id, until) => snoozeAction.mutate({ id, until })}
                onGenerateMessage={setMessageItem}
                onDelegate={async (id, userId, userName) => {
                  await supabase.from("action_items" as any)
                    .update({ metadata: { ...item.metadata, assignee_id: userId, assignee_name: userName } } as any)
                    .eq("id", id);
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="flex items-center justify-center py-8 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-light">Nenhuma ação crítica agora</p>
            <p className="text-[10px] text-muted-foreground/60">Tudo sob controle ✓</p>
          </div>
        </motion.div>
      )}

      <MessageDraftModal
        item={messageItem}
        open={!!messageItem}
        onClose={() => setMessageItem(null)}
      />
    </motion.div>
  );
}
