import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInstagramPosts, useCreatePost, useUpdatePost, useInstagramCampaigns, PILLARS, FORMATS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Loader2, Megaphone } from 'lucide-react';

export function CalendarTab() {
  const { data: posts, isLoading } = useInstagramPosts();
  const { data: campaigns } = useInstagramCampaigns();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', format: 'reel', pillar: 'autoridade', status: 'planned', campaign_id: '' });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const dayPosts = useMemo(() => {
    const map: Record<string, typeof posts> = {};
    (posts || []).forEach(p => {
      const date = p.scheduled_at || p.published_at;
      if (date) {
        const key = format(new Date(date), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key]!.push(p);
      }
    });
    return map;
  }, [posts]);

  const selectedDayPosts = selectedDay ? (dayPosts[format(selectedDay, 'yyyy-MM-dd')] || []) : [];

  const handleCreate = async () => {
    if (!newPost.title.trim() || !selectedDay) return;
    await createPost.mutateAsync({
      title: newPost.title,
      format: newPost.format,
      pillar: newPost.pillar,
      status: newPost.status,
      scheduled_at: selectedDay.toISOString(),
      campaign_id: newPost.campaign_id && newPost.campaign_id !== 'none' ? newPost.campaign_id : null,
    } as any);
    setShowCreate(false);
    setNewPost({ title: '', format: 'reel', pillar: 'autoridade', status: 'planned', campaign_id: '' });
  };

  const campaignMap = useMemo(() => {
    const map: Record<string, string> = {};
    (campaigns || []).forEach(c => { map[c.id] = c.name; });
    return map;
  }, [campaigns]);

  const statusColorMap: Record<string, string> = {
    published: 'bg-emerald-500', scheduled: 'bg-cyan-500', ready: 'bg-primary',
    in_production: 'bg-amber-500', planned: 'bg-blue-500', idea: 'bg-muted-foreground/40',
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Month Nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
        <h3 className="text-sm font-medium text-foreground capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {/* Calendar Grid */}
      <Card className="glass-card p-3">
        <div className="grid grid-cols-7 gap-px">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-[10px] text-muted-foreground text-center py-1 font-medium">{d}</div>
          ))}
          {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const dp = dayPosts[key] || [];
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={`relative min-h-[60px] md:min-h-[80px] p-1 rounded-lg text-left transition-colors hover:bg-muted/50 ${isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : ''} ${isToday ? 'ring-1 ring-primary/50' : ''}`}
              >
                <span className={`text-[11px] ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{format(day, 'd')}</span>
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {dp.slice(0, 3).map((p, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${statusColorMap[p.status] || 'bg-muted'}`} title={p.title} />
                  ))}
                </div>
                {dp.length > 0 && (
                  <p className="text-[9px] text-foreground/70 truncate mt-0.5 hidden md:block">{dp[0].title}</p>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Panel */}
      {selectedDay && (
        <Card className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-foreground">
              {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </h4>
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowCreate(true)}>
              <Plus className="w-3 h-3" /> Novo Post
            </Button>
          </div>
          {selectedDayPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhum post neste dia</p>
          ) : (
            <div className="space-y-2">
              {selectedDayPosts.map(p => {
                const status = POST_STATUSES.find(s => s.key === p.status);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="material-symbols-outlined text-primary text-lg">
                      {FORMATS.find(f => f.key === p.format)?.icon || 'image'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{p.title}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {status && <Badge className={`${status.color} text-[9px]`}>{status.label}</Badge>}
                        {p.pillar && <Badge variant="secondary" className="text-[9px]">{PILLARS.find(pl => pl.key === p.pillar)?.label}</Badge>}
                        {p.campaign_id && campaignMap[p.campaign_id] && (
                          <Badge className="bg-accent/15 text-accent-foreground border-accent/20 text-[9px] gap-0.5">
                            <Megaphone className="w-2.5 h-2.5" />
                            {campaignMap[p.campaign_id]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Post — {selectedDay && format(selectedDay, 'dd/MM/yyyy')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Título do post" value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={newPost.format} onValueChange={v => setNewPost(p => ({ ...p, format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FORMATS.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={newPost.pillar} onValueChange={v => setNewPost(p => ({ ...p, pillar: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PILLARS.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Select value={newPost.status} onValueChange={v => setNewPost(p => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{POST_STATUSES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={newPost.campaign_id} onValueChange={v => setNewPost(p => ({ ...p, campaign_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Campanha (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem campanha</SelectItem>
                {(campaigns || []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createPost.isPending}>
              {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
