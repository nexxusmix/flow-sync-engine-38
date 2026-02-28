import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstagramConnection, useInstagramInsights, useSyncInstagramInsights, getMetaOAuthUrl } from '@/hooks/useInstagramAPI';
import { Loader2, RefreshCw, Link2, Unlink, TrendingUp, Eye, Heart, MessageCircle, Share2, Bookmark, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function InstagramMetaConnect() {
  const { data: connection, isLoading: loadingConn } = useInstagramConnection();
  const { data: insights, isLoading: loadingInsights } = useInstagramInsights(connection?.id);
  const syncMutation = useSyncInstagramInsights();
  const [showAppIdInput, setShowAppIdInput] = useState(false);
  const [appId, setAppId] = useState('');

  if (loadingConn) {
    return (
      <Card className="glass-card p-5">
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  // Not connected - show connect button
  if (!connection) {
    const redirectUri = `${window.location.origin}/meta-callback`;

    const handleConnect = () => {
      if (!appId) {
        setShowAppIdInput(true);
        return;
      }
      const url = getMetaOAuthUrl(redirectUri, appId);
      window.location.href = url;
    };

    return (
      <Card className="glass-card p-5 border border-dashed border-primary/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-lg">link</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Conectar Instagram Business</h3>
            <p className="text-xs text-muted-foreground">Vincule sua conta para métricas reais via Meta Graph API</p>
          </div>
        </div>

        {showAppIdInput && (
          <div className="mb-3">
            <label className="text-xs text-muted-foreground block mb-1">Meta App ID</label>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="Seu Meta App ID"
              className="w-full px-3 py-2 text-sm rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Encontre em developers.facebook.com → Seu App → Configurações → Básico
            </p>
          </div>
        )}

        <Button
          onClick={handleConnect}
          className="w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90"
          size="sm"
        >
          <Link2 className="w-4 h-4 mr-2" />
          {showAppIdInput ? 'Autorizar com Facebook' : 'Conectar conta Instagram'}
        </Button>

        <div className="mt-3 text-[10px] text-muted-foreground space-y-1">
          <p>✅ Requer conta Instagram Business ou Creator</p>
          <p>✅ Página do Facebook vinculada à conta Instagram</p>
          <p>✅ App Meta com permissões instagram_basic e instagram_manage_insights</p>
        </div>
      </Card>
    );
  }

  // Connected - show metrics
  const totals = insights?.totals;
  const lastSync = connection.updated_at;

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm">photo_camera</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">@{connection.ig_username}</span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">Conectado</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Última sync: {lastSync ? formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: ptBR }) : 'nunca'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate(connection.id)}
            disabled={syncMutation.isPending}
            className="text-xs"
          >
            {syncMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
            Sincronizar
          </Button>
        </div>
      </Card>

      {/* Real metrics */}
      {loadingInsights ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : totals ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={<Users className="w-4 h-4" />} label="Seguidores" value={totals.followers.toLocaleString()} />
          <MetricCard icon={<Eye className="w-4 h-4" />} label="Alcance Total" value={totals.reach.toLocaleString()} />
          <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Impressões" value={totals.impressions.toLocaleString()} />
          <MetricCard icon={<Heart className="w-4 h-4" />} label="Curtidas" value={totals.likes.toLocaleString()} />
          <MetricCard icon={<MessageCircle className="w-4 h-4" />} label="Comentários" value={totals.comments.toLocaleString()} />
          <MetricCard icon={<Share2 className="w-4 h-4" />} label="Compartilhamentos" value={totals.shares.toLocaleString()} />
          <MetricCard icon={<Bookmark className="w-4 h-4" />} label="Salvos" value={totals.saved.toLocaleString()} />
          <MetricCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Taxa Engajamento"
            value={`${totals.engagementRate}%`}
            highlight={totals.engagementRate > 3}
          />
        </div>
      ) : (
        <Card className="glass-card p-5 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma métrica sincronizada ainda.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate(connection.id)}
            disabled={syncMutation.isPending}
            className="mt-3 text-xs"
          >
            {syncMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
            Sincronizar agora
          </Button>
        </Card>
      )}

      {totals && totals.postsAnalyzed > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          📊 Baseado em {totals.postsAnalyzed} posts analisados • Dados da Meta Graph API v21.0
        </p>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <Card className="glass-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={highlight ? 'text-emerald-400' : 'text-primary'}>{icon}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-lg font-bold ${highlight ? 'text-emerald-400' : 'text-foreground'}`}>{value}</p>
    </Card>
  );
}
