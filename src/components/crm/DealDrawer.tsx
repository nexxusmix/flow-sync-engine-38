import { useState } from "react";
import { useCRM, Deal } from "@/hooks/useCRM";
import { useDealActivities } from "@/hooks/useDealActivities";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles, Phone, Mail, Calendar, MessageSquare, ArrowRight,
  Clock, TrendingUp, Loader2, Send, Zap, AlertTriangle,
} from "lucide-react";

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  note: <MessageSquare className="w-3.5 h-3.5" />,
  call: <Phone className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  meeting: <Calendar className="w-3.5 h-3.5" />,
  stage_change: <ArrowRight className="w-3.5 h-3.5" />,
  follow_up: <Clock className="w-3.5 h-3.5" />,
  score_update: <Sparkles className="w-3.5 h-3.5" />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  note: "bg-muted text-muted-foreground",
  call: "bg-emerald-500/15 text-emerald-400",
  email: "bg-blue-500/15 text-blue-400",
  meeting: "bg-violet-500/15 text-violet-400",
  stage_change: "bg-amber-500/15 text-amber-400",
  follow_up: "bg-orange-500/15 text-orange-400",
  score_update: "bg-primary/15 text-primary",
};

interface DealDrawerProps {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
}

export function DealDrawer({ deal, open, onClose }: DealDrawerProps) {
  const { user } = useAuth();
  const { updateDeal, closeDeal } = useCRM();
  const { activities, isLoading: activitiesLoading, addActivity, scoreLead } = useDealActivities(deal?.id ?? null);

  const [activityType, setActivityType] = useState("note");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDesc, setActivityDesc] = useState("");
  const [tab, setTab] = useState("timeline");

  if (!deal) return null;

  const handleAddActivity = () => {
    if (!activityTitle.trim()) return;
    addActivity.mutate({
      deal_id: deal.id,
      type: activityType,
      title: activityTitle.trim(),
      description: activityDesc.trim() || undefined,
    }, {
      onSuccess: () => {
        setActivityTitle("");
        setActivityDesc("");
      },
    });
  };

  const handleScore = () => {
    scoreLead.mutate({
      id: deal.id,
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      temperature: deal.temperature,
      source: deal.source,
      company: deal.company,
      next_action: deal.nextAction,
      stale_days: 0,
    });
  };

  const scoreColor = (deal.score || 0) > 70
    ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/20"
    : (deal.score || 0) > 40
    ? "text-amber-400 bg-amber-500/15 border-amber-500/20"
    : "text-red-400 bg-red-500/15 border-red-500/20";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-medium truncate">{deal.title}</SheetTitle>
              <p className="text-xs text-muted-foreground mt-1">{deal.company || deal.contactName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`gap-1 ${scoreColor}`}>
                <Sparkles className="w-3 h-3" />
                {deal.score || 0}
              </Badge>
              <Button size="sm" variant="outline" onClick={handleScore} disabled={scoreLead.isPending}>
                {scoreLead.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-4 mt-3">
            <div>
              <p className="text-mono text-muted-foreground uppercase tracking-wider">Valor</p>
              <p className="text-sm font-semibold text-foreground">
                R$ {deal.value.toLocaleString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-mono text-muted-foreground uppercase tracking-wider">Estágio</p>
              <p className="text-sm font-semibold text-foreground capitalize">{deal.stage}</p>
            </div>
            <div>
              <p className="text-mono text-muted-foreground uppercase tracking-wider">Temperatura</p>
              <p className="text-sm font-semibold text-foreground capitalize">{deal.temperature || "—"}</p>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="score">Score IA</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="flex-1 flex flex-col min-h-0 mt-0">
            {/* Add activity form */}
            <div className="p-4 border-b border-border space-y-2">
              <div className="flex gap-2">
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Nota</SelectItem>
                    <SelectItem value="call">Ligação</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Título da atividade..."
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                  className="h-8 text-xs flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                />
                <Button size="sm" className="h-8 px-3" onClick={handleAddActivity} disabled={!activityTitle.trim() || addActivity.isPending}>
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Textarea
                placeholder="Descrição (opcional)..."
                value={activityDesc}
                onChange={(e) => setActivityDesc(e.target.value)}
                className="text-xs min-h-[50px] resize-none"
              />
            </div>

            {/* Activities list */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-1">
                {activitiesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : activities.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">
                    Nenhuma atividade registrada
                  </p>
                ) : (
                  <AnimatePresence>
                    {activities.map((activity, i) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.note}`}>
                          {ACTIVITY_ICONS[activity.type] || ACTIVITY_ICONS.note}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{activity.title}</p>
                          {activity.description && (
                            <p className="text-body-sm text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
                          )}
                          <p className="text-mono text-muted-foreground/60 mt-1">
                            {activity.profile?.full_name || "Sistema"} ·{" "}
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="flex-1 p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-mono text-muted-foreground uppercase tracking-wider">Contato</label>
                <p className="text-sm text-foreground">{deal.contactName}</p>
              </div>
              <div>
                <label className="text-mono text-muted-foreground uppercase tracking-wider">Empresa</label>
                <p className="text-sm text-foreground">{deal.company || "—"}</p>
              </div>
              <div>
                <label className="text-mono text-muted-foreground uppercase tracking-wider">Fonte</label>
                <p className="text-sm text-foreground capitalize">{deal.source || "—"}</p>
              </div>
              <div>
                <label className="text-mono text-muted-foreground uppercase tracking-wider">Próxima Ação</label>
                <p className="text-sm text-foreground">{deal.nextAction || "Nenhuma"}</p>
              </div>
              <div>
                <label className="text-mono text-muted-foreground uppercase tracking-wider">Criado em</label>
                <p className="text-sm text-foreground">
                  {new Date(deal.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <label className="text-mono text-muted-foreground uppercase tracking-wider">Projeto Vinculado</label>
                <p className="text-sm text-foreground">{deal.linkedProjectId || "Nenhum"}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => closeDeal({ dealId: deal.id, won: true })}
              >
                Fechar como Ganho
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-destructive"
                onClick={() => closeDeal({ dealId: deal.id, won: false, lostReason: "Manual" })}
              >
                Marcar como Perdido
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="score" className="flex-1 p-6 space-y-4">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="6"
                    strokeDasharray={`${((deal.score || 0) / 100) * 264} 264`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-foreground">{deal.score || 0}</span>
                  <span className="text-caption text-muted-foreground uppercase">Score</span>
                </div>
              </div>

              <Button onClick={handleScore} disabled={scoreLead.isPending} className="gap-2">
                {scoreLead.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Recalcular Score com IA
              </Button>
            </div>

            {/* Score reasons from latest score_update activity */}
            {activities.filter(a => a.type === "score_update").length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fatores</h4>
                {(() => {
                  const latest = activities.find(a => a.type === "score_update");
                  const reasons = latest?.metadata?.reasons || [];
                  return reasons.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                      <span className="text-xs text-foreground">{r.factor}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${r.impact >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {r.impact >= 0 ? "+" : ""}{r.impact}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
                {activities.find(a => a.type === "score_update")?.description && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 mt-2">
                    <p className="text-xs text-foreground flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                      {activities.find(a => a.type === "score_update")?.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
