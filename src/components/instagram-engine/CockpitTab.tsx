import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useInstagramPosts, useProfileConfig, useProfileSnapshots, useSaveProfileConfig, useSaveSnapshot, PILLARS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { Loader2, AlertTriangle, CheckCircle2, Clock, TrendingUp, Zap, Save, Pencil } from 'lucide-react';
import { formatDistanceToNow, differenceInDays, addDays, format, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { InstagramMetaConnect } from './InstagramMetaConnect';
import { ProfileCard } from './ProfileCard';
import { PostsGrid } from './PostsGrid';
import { ScheduledTimeline } from './ScheduledTimeline';
import { toast } from 'sonner';

export function CockpitTab() {
  const { data: posts, isLoading: loadingPosts } = useInstagramPosts();
  const { data: config } = useProfileConfig();
  const { data: snapshots } = useProfileSnapshots();
  const saveConfig = useSaveProfileConfig();
  const saveSnapshotMut = useSaveSnapshot();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    handle: '', niche: '', sub_niche: '', target_audience: '', brand_voice: '',
    followers: 0, posts_count: 0, avg_engagement: 0, avg_reach: 0, best_posting_time: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    const latestSnapshot = snapshots?.[0];
    setEditData({
      handle: config?.profile_handle || '',
      niche: config?.niche || '',
      sub_niche: config?.sub_niche || '',
      target_audience: config?.target_audience || '',
      brand_voice: config?.brand_voice || '',
      followers: latestSnapshot?.followers || 0,
      posts_count: latestSnapshot?.posts_count || 0,
      avg_engagement: latestSnapshot?.avg_engagement || 0,
      avg_reach: latestSnapshot?.avg_reach || 0,
      best_posting_time: latestSnapshot?.best_posting_time || '',
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await saveConfig.mutateAsync({
        profile_handle: editData.handle,
        niche: editData.niche,
        sub_niche: editData.sub_niche,
        target_audience: editData.target_audience,
        brand_voice: editData.brand_voice,
      });
      await saveSnapshotMut.mutateAsync({
        followers: editData.followers,
        following: 0,
        posts_count: editData.posts_count,
        avg_engagement: editData.avg_engagement,
        avg_reach: editData.avg_reach,
        best_posting_time: editData.best_posting_time,
        snapshot_date: new Date().toISOString().split('T')[0],
      });
      setIsEditing(false);
      toast.success('Dados do perfil atualizados!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingPosts) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const allPosts = posts || [];
  const latestSnapshot = snapshots?.[0];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Health status
  const publishedPosts = allPosts.filter(p => p.status === 'published' && p.published_at);
  const lastPublished = publishedPosts.sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())[0];
  const daysSincePost = lastPublished ? differenceInDays(today, new Date(lastPublished.published_at!)) : 999;
  const healthStatus = daysSincePost <= 3 ? 'green' : daysSincePost <= 7 ? 'yellow' : 'red';
  const healthLabel = { green: 'Saudável', yellow: 'Atenção', red: 'Crítico' }[healthStatus];
  const healthColor = { green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', yellow: 'text-amber-400 bg-amber-500/10 border-amber-500/20', red: 'text-destructive bg-destructive/10 border-destructive/20' }[healthStatus];

  // Pipeline counts
  const statusCounts = POST_STATUSES.map(s => ({
    ...s,
    count: allPosts.filter(p => p.status === s.key).length,
  }));

  // Pillar distribution
  const pillarCounts = PILLARS.map(p => ({
    ...p,
    count: allPosts.filter(post => post.pillar === p.key).length,
  }));
  const totalPillar = Math.max(pillarCounts.reduce((s, p) => s + p.count, 0), 1);

  // Action queue
  const actionQueue = [
    ...allPosts.filter(p => p.status === 'in_production').map(p => ({ type: 'production', label: `Finalizar produção: ${p.title}`, post: p })),
    ...allPosts.filter(p => p.status === 'ready').map(p => ({ type: 'schedule', label: `Agendar: ${p.title}`, post: p })),
    ...allPosts.filter(p => p.status === 'idea').slice(0, 3).map(p => ({ type: 'plan', label: `Planejar: ${p.title}`, post: p })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Instagram Connection */}
      <InstagramMetaConnect />

      {/* ===== NEW: Instagram Profile Card ===== */}
      <ProfileCard
        config={config || null}
        snapshot={latestSnapshot || null}
        publishedCount={publishedPosts.length}
        daysSincePost={daysSincePost}
      />

      {/* Editable Real Profile Data */}
      <Card className="glass-card p-5 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">person</span>
            <h3 className="text-sm font-medium text-foreground">Dados Reais do Perfil</h3>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleStartEdit} className="gap-1.5 text-xs h-8">
              <Pencil className="w-3 h-3" /> Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-xs h-8">Cancelar</Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={isSaving} className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <EditField label="@ Handle" value={editData.handle} onChange={v => setEditData(d => ({ ...d, handle: v }))} />
            <EditField label="Nicho" value={editData.niche} onChange={v => setEditData(d => ({ ...d, niche: v }))} />
            <EditField label="Sub-nicho" value={editData.sub_niche} onChange={v => setEditData(d => ({ ...d, sub_niche: v }))} />
            <EditField label="Tom de Voz" value={editData.brand_voice} onChange={v => setEditData(d => ({ ...d, brand_voice: v }))} />
            <EditField label="Seguidores" value={String(editData.followers)} onChange={v => setEditData(d => ({ ...d, followers: Number(v) || 0 }))} type="number" />
            <EditField label="Posts" value={String(editData.posts_count)} onChange={v => setEditData(d => ({ ...d, posts_count: Number(v) || 0 }))} type="number" />
            <EditField label="Engajamento %" value={String(editData.avg_engagement)} onChange={v => setEditData(d => ({ ...d, avg_engagement: Number(v) || 0 }))} type="number" />
            <EditField label="Alcance Médio" value={String(editData.avg_reach)} onChange={v => setEditData(d => ({ ...d, avg_reach: Number(v) || 0 }))} type="number" />
            <div className="col-span-2 md:col-span-4">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Público-alvo</label>
              <Textarea value={editData.target_audience} onChange={e => setEditData(d => ({ ...d, target_audience: e.target.value }))} className="mt-1 min-h-[50px] text-xs" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DataField label="Handle" value={config?.profile_handle ? `@${config.profile_handle}` : '—'} />
            <DataField label="Nicho" value={config?.niche || '—'} />
            <DataField label="Sub-nicho" value={config?.sub_niche || '—'} />
            <DataField label="Tom de Voz" value={config?.brand_voice || '—'} truncate />
            <DataField label="Público-alvo" value={config?.target_audience || '—'} truncate />
          </div>
        )}
      </Card>

      {/* Profile Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Seguidores" value={latestSnapshot?.followers?.toLocaleString() || '—'} icon="group" />
        <StatCard label="Posts" value={latestSnapshot?.posts_count?.toString() || String(publishedPosts.length)} icon="grid_view" />
        <StatCard label="Engajamento" value={latestSnapshot ? `${latestSnapshot.avg_engagement}%` : '—'} icon="favorite" />
        <StatCard label="Alcance Médio" value={latestSnapshot?.avg_reach?.toLocaleString() || '—'} icon="visibility" />
        <StatCard label="Melhor Horário" value={latestSnapshot?.best_posting_time || '—'} icon="schedule" />
      </div>

      {/* Health Alert + Scheduled Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className={`glass-card p-5 border ${healthColor}`}>
          <div className="flex items-center gap-3 mb-3">
            {healthStatus === 'green' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
             healthStatus === 'yellow' ? <Clock className="w-5 h-5 text-amber-400" /> :
             <AlertTriangle className="w-5 h-5 text-destructive" />}
            <div>
              <p className="text-sm font-medium text-foreground">Saúde do Perfil: {healthLabel}</p>
              <p className="text-xs text-muted-foreground">
                {daysSincePost < 999 ? `Último post há ${daysSincePost} dia${daysSincePost !== 1 ? 's' : ''}` : 'Nenhum post publicado ainda'}
              </p>
            </div>
          </div>
          {healthStatus === 'red' && (
            <p className="text-xs text-destructive/80">⚠️ Mais de 7 dias sem postar. O algoritmo está penalizando seu alcance.</p>
          )}
          {healthStatus === 'yellow' && (
            <p className="text-xs text-amber-400/80">⚡ Considere postar nos próximos 2 dias para manter o ritmo.</p>
          )}
        </Card>

        <ScheduledTimeline posts={allPosts} />
      </div>

      {/* ===== NEW: Posts Grid (Instagram-style) ===== */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-lg">grid_view</span>
          <h3 className="text-sm font-medium text-foreground">Feed Preview</h3>
          <Badge variant="secondary" className="text-[9px] ml-auto">{allPosts.length} posts</Badge>
        </div>
        <PostsGrid posts={allPosts} />
      </div>

      {/* Pipeline Status */}
      <Card className="glass-card p-5">
        <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Pipeline de Conteúdo
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {statusCounts.map(s => (
            <div key={s.key} className="text-center">
              <div className={`text-2xl font-bold ${s.count > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>{s.count}</div>
              <Badge className={`${s.color} text-[9px] mt-1`}>{s.label}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Queue + Pillar Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">🎯 Próximas Ações</h3>
          {actionQueue.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma ação pendente. Crie conteúdo com IA!</p>
          ) : (
            <div className="space-y-2">
              {actionQueue.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <span className="material-symbols-outlined text-primary text-sm">
                    {a.type === 'production' ? 'movie_edit' : a.type === 'schedule' ? 'schedule_send' : 'lightbulb'}
                  </span>
                  <span className="text-xs text-foreground flex-1 truncate">{a.label}</span>
                  <Badge variant="secondary" className="text-[9px]">{a.post.format}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">📊 Distribuição de Pilares</h3>
          <div className="space-y-3">
            {pillarCounts.map(p => (
              <div key={p.key}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{p.label}</span>
                  <span className="text-foreground font-medium">{Math.round((p.count / totalPillar) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(p.count / totalPillar) * 100}%`, backgroundColor: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <Card className="glass-card p-4 text-center">
      <span className="material-symbols-outlined text-primary text-xl mb-1">{icon}</span>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </Card>
  );
}

function EditField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</label>
      <Input value={value} onChange={e => onChange(e.target.value)} type={type} className="mt-1 h-8 text-xs" />
    </div>
  );
}

function DataField({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-xs text-foreground mt-0.5 ${truncate ? 'line-clamp-2' : ''}`}>{value}</p>
    </div>
  );
}
