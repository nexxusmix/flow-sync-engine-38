import { useEffect, useState } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkStatusBadge, MkEmptyState, MkSectionHeader } from "@/components/marketing-hub/mk-ui";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Zap, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  title: string;
  message: string | null;
  rule_key: string;
  status: string;
  entity_type: string;
  created_at: string;
}

export default function MkAutomationsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("automation_suggestions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setSuggestions(data as Suggestion[]);
      setLoading(false);
    })();
  }, []);

  const applySuggestion = async (id: string) => {
    await supabase.from("automation_suggestions").update({ status: "applied", applied_at: new Date().toISOString() }).eq("id", id);
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: "applied" } : s));
    toast.success("Sugestão aplicada!");
  };

  const ignoreSuggestion = async (id: string) => {
    await supabase.from("automation_suggestions").update({ status: "ignored", ignored_at: new Date().toISOString() }).eq("id", id);
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: "ignored" } : s));
  };

  const pending = suggestions.filter(s => s.status === "pending");
  const applied = suggestions.filter(s => s.status === "applied");

  return (
    <MkAppShell title="Automações">
      <h1 className="text-2xl font-bold text-white/90 mb-2">Automações Inteligentes</h1>
      <p className="text-sm text-white/30 mb-8">Sugestões de IA para otimizar seu marketing</p>

      <MkSectionHeader title={`Pendentes (${pending.length})`} />
      {pending.length === 0 ? (
        <MkEmptyState icon="smart_toy" title="Sem sugestões" description="Novas sugestões de automação aparecerão aqui." />
      ) : (
        <div className="space-y-3 mb-10">
          {pending.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.04 }}>
              <MkCard className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[hsl(210,100%,55%)]/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-[hsl(210,100%,65%)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white/80">{s.title}</h4>
                  {s.message && <p className="text-xs text-white/30 truncate mt-0.5">{s.message}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => applySuggestion(s.id)} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"><Check className="w-4 h-4" /></button>
                  <button onClick={() => ignoreSuggestion(s.id)} className="p-2 rounded-lg bg-white/[0.04] text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
                </div>
              </MkCard>
            </motion.div>
          ))}
        </div>
      )}

      {applied.length > 0 && (
        <>
          <MkSectionHeader title={`Aplicadas (${applied.length})`} />
          <div className="space-y-2">
            {applied.slice(0, 10).map(s => (
              <MkCard key={s.id} className="flex items-center gap-3 py-3 opacity-60">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-white/50">{s.title}</span>
              </MkCard>
            ))}
          </div>
        </>
      )}
    </MkAppShell>
  );
}
