import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstagramCampaign, useInstagramAI } from '@/hooks/useInstagramEngine';
import { CalendarHeart, Sparkles, Loader2, AlertCircle, ChevronRight, Star } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaigns: InstagramCampaign[];
}

interface SeasonalDate {
  date: string; // MM-DD
  name: string;
  emoji: string;
  category: 'comercial' | 'social' | 'nicho' | 'viral';
  relevance: 'alta' | 'media' | 'baixa';
}

const SEASONAL_DATES: SeasonalDate[] = [
  { date: '01-01', name: 'Ano Novo', emoji: '🎆', category: 'social', relevance: 'alta' },
  { date: '02-14', name: 'Dia dos Namorados (EUA)', emoji: '💕', category: 'comercial', relevance: 'media' },
  { date: '03-08', name: 'Dia da Mulher', emoji: '👩', category: 'social', relevance: 'alta' },
  { date: '03-15', name: 'Dia do Consumidor', emoji: '🛒', category: 'comercial', relevance: 'alta' },
  { date: '04-07', name: 'Dia Mundial da Saúde', emoji: '🏥', category: 'nicho', relevance: 'media' },
  { date: '04-22', name: 'Dia da Terra', emoji: '🌍', category: 'social', relevance: 'media' },
  { date: '05-01', name: 'Dia do Trabalho', emoji: '💼', category: 'social', relevance: 'media' },
  { date: '05-11', name: 'Dia das Mães', emoji: '👩‍👧', category: 'comercial', relevance: 'alta' },
  { date: '06-12', name: 'Dia dos Namorados', emoji: '❤️', category: 'comercial', relevance: 'alta' },
  { date: '06-28', name: 'Dia do Orgulho', emoji: '🏳️‍🌈', category: 'social', relevance: 'alta' },
  { date: '07-20', name: 'Dia do Amigo', emoji: '🤝', category: 'social', relevance: 'media' },
  { date: '08-11', name: 'Dia dos Pais', emoji: '👨‍👧', category: 'comercial', relevance: 'alta' },
  { date: '08-15', name: 'Dia da Informática', emoji: '💻', category: 'nicho', relevance: 'baixa' },
  { date: '09-07', name: 'Independência do Brasil', emoji: '🇧🇷', category: 'social', relevance: 'media' },
  { date: '09-15', name: 'Dia do Cliente', emoji: '🎯', category: 'comercial', relevance: 'alta' },
  { date: '10-12', name: 'Dia das Crianças', emoji: '👶', category: 'comercial', relevance: 'alta' },
  { date: '10-31', name: 'Halloween', emoji: '🎃', category: 'viral', relevance: 'media' },
  { date: '11-20', name: 'Consciência Negra', emoji: '✊🏿', category: 'social', relevance: 'alta' },
  { date: '11-25', name: 'Black Friday', emoji: '🏷️', category: 'comercial', relevance: 'alta' },
  { date: '11-28', name: 'Cyber Monday', emoji: '🖥️', category: 'comercial', relevance: 'alta' },
  { date: '12-25', name: 'Natal', emoji: '🎄', category: 'comercial', relevance: 'alta' },
  { date: '12-31', name: 'Réveillon', emoji: '🥂', category: 'social', relevance: 'alta' },
];

const CATEGORY_COLORS: Record<string, string> = {
  comercial: 'bg-muted text-muted-foreground',
  social: 'bg-primary/10 text-primary',
  nicho: 'bg-primary/10 text-primary/70',
  viral: 'bg-primary/10 text-primary/50',
};

export function CampaignHolidayCalendar({ campaigns }: Props) {
  const ai = useInstagramAI();
  const [generating, setGenerating] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Record<string, any>>({}); 

  const today = new Date();
  const currentYear = today.getFullYear();

  const upcomingDates = useMemo(() => {
    return SEASONAL_DATES.map(sd => {
      const [month, day] = sd.date.split('-').map(Number);
      let dateObj = new Date(currentYear, month - 1, day);
      if (dateObj < today) dateObj = new Date(currentYear + 1, month - 1, day);
      const daysUntil = differenceInDays(dateObj, today);
      return { ...sd, dateObj, daysUntil };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 12);
  }, [currentYear]);

  const handleGenerateSuggestion = async (sd: typeof upcomingDates[0]) => {
    setGenerating(sd.name);
    try {
      const result = await ai.mutateAsync({
        action: 'generate_from_context',
        data: {
          command: `Gere uma sugestão de campanha temática para a data "${sd.name}" (${sd.emoji}, ${format(sd.dateObj, "dd 'de' MMMM", { locale: ptBR })}).

Considere que é uma campanha para Instagram.

Retorne JSON com:
- campaign_name: nome criativo da campanha
- objective: objetivo principal
- duration_days: duração sugerida em dias (antes da data)
- post_ideas: array de 3-5 ideias de posts (cada uma com title, format, hook)
- hashtag_suggestions: array de 5 hashtags relevantes
- content_angle: ângulo de conteúdo principal
- urgency_tip: dica de timing`,
          format: 'campaign_suggestion',
        },
      });
      setSuggestions(prev => ({ ...prev, [sd.name]: result }));
      toast.success(`Sugestão gerada para ${sd.name}!`);
    } catch {
      // handled
    } finally {
      setGenerating(null);
    }
  };

  const existingCampaignDates = useMemo(() => {
    const dates = new Set<string>();
    campaigns?.forEach(c => {
      if (c.start_date) dates.add(c.start_date.slice(5, 10)); // MM-DD
    });
    return dates;
  }, [campaigns]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <CalendarHeart className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Calendário de Feriados & Datas Comemorativas</h3>
      </div>

      {/* Urgency alerts */}
      {upcomingDates.filter(d => d.daysUntil <= 14 && d.relevance === 'alta').length > 0 && (
        <Card className="p-3 bg-muted/10 border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">Datas Próximas — Ação Urgente</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {upcomingDates.filter(d => d.daysUntil <= 14 && d.relevance === 'alta').map(d => (
              <Badge key={d.name} className="bg-muted text-muted-foreground text-[10px]">
                {d.emoji} {d.name} — {d.daysUntil}d
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Calendar grid */}
      <div className="grid gap-2">
        {upcomingDates.map(sd => {
          const hasCampaign = existingCampaignDates.has(sd.date);
          const suggestion = suggestions[sd.name];

          return (
            <Card key={sd.name} className="p-3 bg-card/50 border-border/30">
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[50px]">
                  <div className="text-2xl">{sd.emoji}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {sd.daysUntil}d
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{sd.name}</span>
                    <Badge variant="outline" className={`text-[9px] ${CATEGORY_COLORS[sd.category]}`}>{sd.category}</Badge>
                    {sd.relevance === 'alta' && <Star className="w-3 h-3 text-primary" />}
                    {hasCampaign && <Badge className="bg-primary/10 text-primary text-[9px]">Campanha ativa</Badge>}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {format(sd.dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-[10px] h-7"
                  onClick={() => handleGenerateSuggestion(sd)}
                  disabled={generating === sd.name}
                >
                  {generating === sd.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  Sugerir
                </Button>
              </div>

              {/* AI suggestion */}
              {suggestion && (
                <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">{suggestion.campaign_name}</span>
                    {suggestion.duration_days && (
                      <Badge variant="outline" className="text-[9px]">{suggestion.duration_days} dias</Badge>
                    )}
                  </div>
                  {suggestion.objective && <p className="text-[10px] text-muted-foreground">{suggestion.objective}</p>}
                  {suggestion.content_angle && <p className="text-[10px] text-primary/70">🎯 {suggestion.content_angle}</p>}
                  {Array.isArray(suggestion.post_ideas) && (
                    <div className="space-y-1">
                      {suggestion.post_ideas.map((idea: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[10px]">
                          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-foreground">{idea.title}</span>
                          <Badge variant="outline" className="text-[8px]">{idea.format}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.isArray(suggestion.hashtag_suggestions) && (
                    <div className="flex flex-wrap gap-1">
                      {suggestion.hashtag_suggestions.map((h: string) => (
                        <span key={h} className="text-[9px] text-primary/60">#{h}</span>
                      ))}
                    </div>
                  )}
                  {suggestion.urgency_tip && (
                    <p className="text-[10px] text-muted-foreground">⏰ {suggestion.urgency_tip}</p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
