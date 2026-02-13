import { useEffect, useState } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkStatusBadge } from "@/components/marketing-hub/mk-ui";
import { useMarketingStore } from "@/stores/marketingStore";
import { CONTENT_CHANNELS } from "@/types/marketing";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MkCalendarPage() {
  const { contentItems, fetchContentItems } = useMarketingStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => { fetchContentItems(); }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const getItemsForDay = (day: Date) =>
    contentItems.filter(i => {
      const d = i.scheduled_at ? new Date(i.scheduled_at) : i.due_at ? new Date(i.due_at) : null;
      return d && isSameDay(d, day);
    });

  return (
    <MkAppShell title="Calendário Editorial">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Calendário Editorial</h1>
          <p className="text-sm text-white/30 mt-1">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 rounded-lg hover:bg-white/[0.04] text-white/40 hover:text-white/70 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:bg-white/[0.04] transition-colors">Hoje</button>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 rounded-lg hover:bg-white/[0.04] text-white/40 hover:text-white/70 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
          <div key={d} className="text-center text-[10px] uppercase tracking-widest text-white/20 py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const items = getItemsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <motion.div
              key={day.toISOString()}
              className={`min-h-[90px] rounded-xl p-2 border transition-colors ${isToday ? "border-[hsl(210,100%,55%)]/30 bg-[hsl(210,100%,55%)]/[0.04]" : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"}`}
            >
              <span className={`text-xs font-medium ${isToday ? "text-[hsl(210,100%,65%)]" : "text-white/30"}`}>{format(day, "d")}</span>
              <div className="mt-1 space-y-0.5">
                {items.slice(0, 3).map(item => {
                  const ch = CONTENT_CHANNELS.find(c => c.type === item.channel);
                  return (
                    <div key={item.id} className="text-[10px] text-white/50 truncate px-1 py-0.5 rounded bg-[hsl(210,100%,55%)]/10">
                      {item.title}
                    </div>
                  );
                })}
                {items.length > 3 && <span className="text-[9px] text-white/20">+{items.length - 3}</span>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </MkAppShell>
  );
}
