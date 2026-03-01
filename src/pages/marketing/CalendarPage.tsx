import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMarketingStore } from "@/stores/marketingStore";
import { ContentItem, CONTENT_ITEM_STAGES, CONTENT_CHANNELS } from "@/types/marketing";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Plus, MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function DayCell({ 
  date, 
  items, 
  isCurrentMonth, 
  isToday,
  onClick,
}: { 
  date: Date;
  items: ContentItem[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: (item: ContentItem) => void;
}) {
  return (
    <motion.div
      className={cn(
        "min-h-[120px] p-2 border-b border-r border-border/30 relative",
        "transition-colors hover:bg-white/5",
        !isCurrentMonth && "opacity-40"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: isCurrentMonth ? 1 : 0.4 }}
    >
      {/* Date Number */}
      <div className={cn(
        "text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full",
        isToday ? "bg-primary text-primary-foreground" : "text-foreground"
      )}>
        {date.getDate()}
      </div>

      {/* Content Items */}
      <div className="space-y-1 max-h-[80px] overflow-y-auto custom-scrollbar">
        {items.slice(0, 3).map((item) => {
          const stage = CONTENT_ITEM_STAGES.find(s => s.type === item.status);
          const channel = CONTENT_CHANNELS.find(c => c.type === item.channel);
          
          return (
            <motion.button
              key={item.id}
              className={cn(
                "w-full text-left px-2 py-1 rounded text-[10px] truncate",
                "hover:ring-1 hover:ring-primary/50 transition-all",
                stage?.color.replace('bg-', 'bg-') + '/20',
                "text-foreground"
              )}
              onClick={() => onClick(item)}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-1">
                <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", stage?.color)} />
                <span className="truncate">{item.title}</span>
              </div>
            </motion.button>
          );
        })}
        {items.length > 3 && (
          <span className="text-[9px] text-muted-foreground pl-2">
            +{items.length - 3} mais
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const { 
    contentItems, 
    fetchContentItems,
    setSelectedItem,
  } = useMarketingStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  useEffect(() => {
    fetchContentItems();
  }, []);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

    const days: Date[] = [];
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday

    let current = new Date(startDate);
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentMonth, currentYear]);

  // Group items by date
  const itemsByDate = useMemo(() => {
    return contentItems.reduce((acc, item) => {
      const date = item.scheduled_at || item.due_at;
      if (date) {
        const dateKey = new Date(date).toDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
      }
      return acc;
    }, {} as Record<string, ContentItem[]>);
  }, [contentItems]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleItemClick = (item: ContentItem) => {
    setSelectedItem(item);
    navigate(`/marketing/content/${item.id}`);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth;
  };

  return (
    <DashboardLayout title="Calendário Editorial">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-[200px] text-center">
              <h1 className="text-2xl font-medium text-foreground">
                {MONTHS[currentMonth]} {currentYear}
              </h1>
            </div>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={handleToday}>
              Hoje
            </Button>
          </div>

          <div className="flex gap-3">
            <Select value={view} onValueChange={(v: any) => setView(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => navigate('/marketing/pipeline')}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Conteúdo
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border/50">
            {WEEKDAYS.map((day) => (
              <div key={day} className="p-3 text-center">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            <AnimatePresence mode="wait">
              {calendarDays.map((date) => (
                <DayCell
                  key={date.toISOString()}
                  date={date}
                  items={itemsByDate[date.toDateString()] || []}
                  isCurrentMonth={isCurrentMonth(date)}
                  isToday={isToday(date)}
                  onClick={handleItemClick}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
          {CONTENT_ITEM_STAGES.slice(0, 6).map((stage) => (
            <div key={stage.type} className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", stage.color)} />
              <span>{stage.name}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
