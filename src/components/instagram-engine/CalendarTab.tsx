import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInstagramPosts, useCreatePost, useUpdatePost, useInstagramCampaigns, usePublishToInstagram, PILLARS, FORMATS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { useInstagramConnection } from '@/hooks/useInstagramAPI';
import { InstagramEmbed } from './InstagramEmbed';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Loader2, Megaphone, Send, Filter, X, Link2 } from 'lucide-react';

type ActiveFilters = {
  statuses: string[];
  formats: string[];
  pillars: string[];
  campaigns: string[];
};

const emptyFilters: ActiveFilters = { statuses: [], formats: [], pillars: [], campaigns: [] };

export function CalendarTab() {
  const { data: posts, isLoading } = useInstagramPosts();
  const { data: campaigns } = useInstagramCampaigns();
  const { data: connection } = useInstagramConnection();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const publishMutation = usePublishToInstagram();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPublish, setShowPublish] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>(emptyFilters);
  const [publishData, setPublishData] = useState({ image_url: '', caption: '', media_type: 'IMAGE' as 'IMAGE' | 'CAROUSEL' | 'REELS', video_url: '', image_urls: '' });
  const [newPost, setNewPost] = useState({ title: '', format: 'reel', pillar: 'autoridade', status: 'planned', campaign_id: '', post_url: '' });
  const [editingPostUrl, setEditingPostUrl] = useState<string | null>(null);
  const [tempPostUrl, setTempPostUrl] = useState('');

  const hasActiveFilters = filters.statuses.length > 0 || filters.formats.length > 0 || filters.pillars.length > 0 || filters.campaigns.length > 0;
  const activeFilterCount = filters.statuses.length + filters.formats.length + filters.pillars.length + filters.campaigns.length;

  // Filter posts
  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return posts.filter(p => {
      if (filters.statuses.length > 0 && !filters.statuses.includes(p.status)) return false;
      if (filters.formats.length > 0 && !filters.formats.includes(p.format)) return false;
      if (filters.pillars.length > 0 && (!p.pillar || !filters.pillars.includes(p.pillar))) return false;
      if (filters.campaigns.length > 0 && (!p.campaign_id || !filters.campaigns.includes(p.campaign_id))) return false;
      return true;
    });
  }, [posts, filters]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const dayPosts = useMemo(() => {
    const map: Record<string, typeof filteredPosts> = {};
    filteredPosts.forEach(p => {
      const date = p.scheduled_at || p.published_at;
      if (date) {
        const key = format(new Date(date), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key]!.push(p);
      }
    });
    return map;
  }, [filteredPosts]);

  const selectedDayPosts = selectedDay ? (dayPosts[format(selectedDay, 'yyyy-MM-dd')] || []) : [];

  const toggleFilter = (category: keyof ActiveFilters, value: string) => {
    setFilters(prev => {
      const arr = prev[category];
      return {
        ...prev,
        [category]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  };

  const handleCreate = async () => {
    if (!newPost.title.trim() || !selectedDay) return;
    await createPost.mutateAsync({
      title: newPost.title,
      format: newPost.format,
      pillar: newPost.pillar,
      status: newPost.status,
      scheduled_at: selectedDay.toISOString(),
      campaign_id: newPost.campaign_id && newPost.campaign_id !== 'none' ? newPost.campaign_id : null,
      post_url: newPost.post_url.trim() || null,
    } as any);
    setShowCreate(false);
    setNewPost({ title: '', format: 'reel', pillar: 'autoridade', status: 'planned', campaign_id: '', post_url: '' });
  };

  const handlePublish = async () => {
    if (!showPublish) return;
    const post = (posts || []).find(p => p.id === showPublish);
    if (!post) return;

    const payload: any = {
      post_id: post.id,
      caption: publishData.caption || post.caption_long || post.caption_short || post.caption_medium || '',
      media_type: publishData.media_type,
    };

    if (publishData.media_type === 'IMAGE') {
      if (!publishData.image_url.trim()) return;
      payload.image_url = publishData.image_url;
    } else if (publishData.media_type === 'REELS') {
      if (!publishData.video_url.trim()) return;
      payload.video_url = publishData.video_url;
    } else if (publishData.media_type === 'CAROUSEL') {
      const urls = publishData.image_urls.split('\n').map(u => u.trim()).filter(Boolean);
      if (urls.length < 2) return;
      payload.image_urls = urls;
    }

    await publishMutation.mutateAsync(payload);
    setShowPublish(null);
    setPublishData({ image_url: '', caption: '', media_type: 'IMAGE', video_url: '', image_urls: '' });
  };

  const openPublishDialog = (postId: string) => {
    const post = (posts || []).find(p => p.id === postId);
    if (!post) return;
    const mediaType = post.format === 'reel' ? 'REELS' : post.format === 'carousel' ? 'CAROUSEL' : 'IMAGE';
    setPublishData({
      image_url: '',
      caption: post.caption_long || post.caption_short || post.caption_medium || '',
      media_type: mediaType as any,
      video_url: '',
      image_urls: '',
    });
    setShowPublish(postId);
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
      {/* Month Nav + Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-4 h-4" /></Button>
        <h3 className="text-sm font-medium text-foreground capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant={showFilters ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setShowFilters(v => !v)}
            className="relative"
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Filtros
            </h4>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="text-[10px] h-6 text-muted-foreground" onClick={() => setFilters(emptyFilters)}>
                <X className="w-3 h-3 mr-1" /> Limpar
              </Button>
            )}
          </div>

          {/* Status filters */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {POST_STATUSES.map(s => (
                <button
                  key={s.key}
                  onClick={() => toggleFilter('statuses', s.key)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${
                    filters.statuses.includes(s.key)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground border-border/50 hover:border-border'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format filters */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">Formato</p>
            <div className="flex flex-wrap gap-1.5">
              {FORMATS.map(f => (
                <button
                  key={f.key}
                  onClick={() => toggleFilter('formats', f.key)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border flex items-center gap-1 ${
                    filters.formats.includes(f.key)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground border-border/50 hover:border-border'
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pillar filters */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">Pilar</p>
            <div className="flex flex-wrap gap-1.5">
              {PILLARS.map(p => (
                <button
                  key={p.key}
                  onClick={() => toggleFilter('pillars', p.key)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${
                    filters.pillars.includes(p.key)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground border-border/50 hover:border-border'
                  }`}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: p.color }} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign filters */}
          {(campaigns || []).length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wide">Campanha</p>
              <div className="flex flex-wrap gap-1.5">
                {(campaigns || []).map(c => (
                  <button
                    key={c.id}
                    onClick={() => toggleFilter('campaigns', c.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border flex items-center gap-1 ${
                      filters.campaigns.includes(c.id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/30 text-muted-foreground border-border/50 hover:border-border'
                    }`}
                  >
                    <Megaphone className="w-2.5 h-2.5" />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active filter summary */}
          {hasActiveFilters && (
            <p className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
              Mostrando {filteredPosts.length} de {(posts || []).length} posts
            </p>
          )}
        </Card>
      )}

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
                const isPublishable = !!connection && ['ready', 'scheduled'].includes(p.status);
                const isEditingUrl = editingPostUrl === p.id;
                return (
                  <div key={p.id} className="rounded-lg bg-muted/30 overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
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
                      <div className="flex items-center gap-1 shrink-0">
                        {!p.post_url && !isEditingUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-muted-foreground h-7 px-2"
                            onClick={() => { setEditingPostUrl(p.id); setTempPostUrl(''); }}
                          >
                            <Link2 className="w-3 h-3 mr-1" /> URL
                          </Button>
                        )}
                        {isPublishable && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                            onClick={() => openPublishDialog(p.id)}
                          >
                            <Send className="w-3 h-3" />
                            Publicar
                          </Button>
                        )}
                        {p.status === 'published' && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">
                            ✓ Publicado
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* URL editing inline */}
                    {isEditingUrl && (
                      <div className="px-3 pb-3 flex gap-2">
                        <Input
                          placeholder="https://www.instagram.com/p/..."
                          value={tempPostUrl}
                          onChange={e => setTempPostUrl(e.target.value)}
                          className="text-xs flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="default"
                          className="text-xs"
                          disabled={!tempPostUrl.trim()}
                          onClick={async () => {
                            await updatePost.mutateAsync({ id: p.id, post_url: tempPostUrl.trim() } as any);
                            setEditingPostUrl(null);
                            setTempPostUrl('');
                          }}
                        >
                          Salvar
                        </Button>
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => setEditingPostUrl(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {/* oEmbed preview */}
                    {p.post_url && (
                      <div className="px-3 pb-3">
                        <InstagramEmbed postUrl={p.post_url} compact />
                      </div>
                    )}
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
            <Input
              placeholder="URL do post no Instagram (opcional)"
              value={newPost.post_url}
              onChange={e => setNewPost(p => ({ ...p, post_url: e.target.value }))}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createPost.isPending}>
              {createPost.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <Dialog open={!!showPublish} onOpenChange={(open) => { if (!open) setShowPublish(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-500" />
              Publicar no Instagram
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400">
                ⚠️ A publicação será feita imediatamente na conta @{connection?.ig_username || '...'} conectada.
              </p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tipo de Mídia</label>
              <Select value={publishData.media_type} onValueChange={v => setPublishData(p => ({ ...p, media_type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMAGE">Foto (Imagem única)</SelectItem>
                  <SelectItem value="CAROUSEL">Carrossel</SelectItem>
                  <SelectItem value="REELS">Reels (Vídeo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {publishData.media_type === 'IMAGE' && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">URL da Imagem (pública)</label>
                <Input
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={publishData.image_url}
                  onChange={e => setPublishData(p => ({ ...p, image_url: e.target.value }))}
                />
                <p className="text-[10px] text-muted-foreground mt-1">A imagem deve estar hospedada em uma URL pública acessível.</p>
              </div>
            )}

            {publishData.media_type === 'REELS' && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">URL do Vídeo (pública)</label>
                <Input
                  placeholder="https://exemplo.com/video.mp4"
                  value={publishData.video_url}
                  onChange={e => setPublishData(p => ({ ...p, video_url: e.target.value }))}
                />
                <p className="text-[10px] text-muted-foreground mt-1">Vídeo MP4 hospedado em URL pública. Máx. 15 min.</p>
              </div>
            )}

            {publishData.media_type === 'CAROUSEL' && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">URLs das Imagens (uma por linha)</label>
                <Textarea
                  placeholder={"https://exemplo.com/slide1.jpg\nhttps://exemplo.com/slide2.jpg"}
                  value={publishData.image_urls}
                  onChange={e => setPublishData(p => ({ ...p, image_urls: e.target.value }))}
                  rows={4}
                />
                <p className="text-[10px] text-muted-foreground mt-1">Mínimo 2, máximo 10 imagens.</p>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Legenda</label>
              <Textarea
                placeholder="Escreva a legenda do post..."
                value={publishData.caption}
                onChange={e => setPublishData(p => ({ ...p, caption: e.target.value }))}
                rows={4}
              />
              <p className="text-[10px] text-muted-foreground mt-1">{publishData.caption.length}/2200 caracteres</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowPublish(null)}>Cancelar</Button>
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending}
              className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90 gap-2"
            >
              {publishMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Publicando...</>
              ) : (
                <><Send className="w-4 h-4" /> Publicar Agora</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
