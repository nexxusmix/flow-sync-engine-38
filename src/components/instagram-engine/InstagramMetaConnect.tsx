import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useInstagramConnection, useConnectInstagramManual, useDisconnectInstagram, useScrapeInstagramProfile } from '@/hooks/useInstagramAPI';
import { useProfileSnapshots } from '@/hooks/useInstagramEngine';
import { Loader2, Link2, Unlink, Instagram, Save, RefreshCw, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DEFAULT_WORKSPACE_ID } from '@/constants/workspace';

export function InstagramMetaConnect() {
  const { data: connection, isLoading: loadingConn } = useInstagramConnection();
  const connectMutation = useConnectInstagramManual();
  const disconnectMutation = useDisconnectInstagram();
  const scrapeMutation = useScrapeInstagramProfile();
  const { data: snapshots } = useProfileSnapshots();
  const [username, setUsername] = useState('');
  const [followers, setFollowers] = useState('');
  const [following, setFollowing] = useState('');
  const [postsCount, setPostsCount] = useState('');
  const [saving, setSaving] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const qc = useQueryClient();

  const latestSnapshot = snapshots?.[0];
  const isOAuthConnected = connection?.access_token && connection.access_token !== 'manual';

  // Meta OAuth flow
  const handleMetaOAuth = async () => {
    setConnectingOAuth(true);
    try {
      const { data, error } = await supabase.functions.invoke('instagram-oauth', {
        body: {
          action: 'get_auth_url',
          redirect_uri: `${window.location.origin}/integrations/instagram/callback`,
          workspace_id: DEFAULT_WORKSPACE_ID,
        },
      });

      const authUrl = data?.url || data?.auth_url;
      if (error || !authUrl) {
        // OAuth not configured — fall back to manual
        toast.error('Integração Meta ainda não configurada. Use a conexão manual abaixo.');
        setConnectingOAuth(false);
        return;
      }

      // Open Meta OAuth in new window
      window.open(authUrl, '_blank', 'width=600,height=700');
      toast.info('Complete a autorização na janela do Facebook.');

      // Listen for success message from callback popup
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'instagram-oauth-success') {
          window.removeEventListener('message', handleMessage);
          qc.invalidateQueries({ queryKey: ['instagram-connection'] });
          toast.success('Instagram conectado com sucesso!');
        }
      };
      window.addEventListener('message', handleMessage);
    } catch {
      toast.error('Erro ao iniciar autorização Meta.');
    } finally {
      setConnectingOAuth(false);
    }
  };

  if (loadingConn) {
    return <Card className="glass-card p-5"><Skeleton className="h-20 w-full" /></Card>;
  }

  if (!connection) {
    const handleConnect = () => {
      const cleaned = username.trim().replace(/^@/, '');
      if (!cleaned) return;
      connectMutation.mutate(cleaned);
    };

    return (
      <Card className="glass-card p-5 border border-dashed border-primary/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Conectar Instagram</h3>
            <p className="text-xs text-muted-foreground">Conecte via Meta ou insira o @ manualmente</p>
          </div>
        </div>

        {/* Meta OAuth button */}
        <Button
          onClick={handleMetaOAuth}
          disabled={connectingOAuth}
          className="w-full mb-3 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90"
          size="sm"
        >
          {connectingOAuth ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <ExternalLink className="w-4 h-4 mr-2" />
          )}
          Conectar via Meta (Recomendado)
        </Button>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-[10px] text-muted-foreground uppercase">ou conecte manualmente</span>
          </div>
        </div>

        {/* Manual connect */}
        <div className="flex gap-2">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@seu_usuario"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          />
          <Button
            onClick={handleConnect}
            disabled={!username.trim() || connectMutation.isPending}
            variant="outline"
            size="sm"
          >
            {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4 mr-1" />}
            Conectar
          </Button>
        </div>
      </Card>
    );
  }

  const handleSaveSnapshot = async () => {
    const f = parseInt(followers) || 0;
    const fg = parseInt(following) || 0;
    const p = parseInt(postsCount) || 0;
    if (f === 0 && fg === 0 && p === 0) {
      toast.error('Preencha ao menos um campo');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('instagram_profile_snapshots')
      .insert({
        followers: f,
        following: fg,
        posts_count: p,
        avg_engagement: 0,
        avg_reach: 0,
        snapshot_date: new Date().toISOString().split('T')[0],
      } as any);

    if (error) {
      toast.error('Erro ao salvar snapshot');
    } else {
      toast.success('Snapshot salvo! 📊');
      qc.invalidateQueries({ queryKey: ['instagram-profile-snapshots'] });
      setFollowers('');
      setFollowing('');
      setPostsCount('');
    }
    setSaving(false);
  };

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
            <Instagram className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">@{connection.ig_username}</span>
              <Badge className={`text-[9px] ${isOAuthConnected ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                {isOAuthConnected ? 'Meta API' : 'Manual'}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              <a href={`https://instagram.com/${connection.ig_username}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                instagram.com/{connection.ig_username}
              </a>
              {' · '}
              {connection.connected_at && formatDistanceToNow(new Date(connection.connected_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isOAuthConnected && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMetaOAuth}
              disabled={connectingOAuth}
              className="text-xs text-primary hover:text-primary/80"
              title="Fazer upgrade para Meta API"
            >
              {connectingOAuth ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scrapeMutation.mutate(connection.ig_username)}
            disabled={scrapeMutation.isPending}
            className="text-xs text-muted-foreground hover:text-primary"
            title="Tentar coletar dados automaticamente"
          >
            {scrapeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => disconnectMutation.mutate(connection.id)}
            disabled={disconnectMutation.isPending}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            {disconnectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {latestSnapshot && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/30 rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">{latestSnapshot.followers?.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground">Seguidores</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">{latestSnapshot.following?.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground">Seguindo</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2">
            <p className="text-lg font-bold text-foreground">{latestSnapshot.posts_count?.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-muted-foreground">Posts</p>
          </div>
        </div>
      )}

      {/* Manual snapshot entry — only show if not OAuth connected or no snapshot */}
      {(!isOAuthConnected || !latestSnapshot) && (
        <div className="mt-3 border-t border-border/40 pt-3">
          <p className="text-[10px] text-muted-foreground mb-2">
            {!latestSnapshot 
              ? '⚠️ Nenhum snapshot salvo. Insira as métricas atuais do perfil:' 
              : 'Atualizar métricas manualmente'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              value={followers}
              onChange={(e) => setFollowers(e.target.value)}
              placeholder="Seguidores"
              className="text-xs h-8"
            />
            <Input
              type="number"
              value={following}
              onChange={(e) => setFollowing(e.target.value)}
              placeholder="Seguindo"
              className="text-xs h-8"
            />
            <Input
              type="number"
              value={postsCount}
              onChange={(e) => setPostsCount(e.target.value)}
              placeholder="Posts"
              className="text-xs h-8"
            />
          </div>
          <Button
            onClick={handleSaveSnapshot}
            disabled={saving}
            size="sm"
            className="w-full mt-2 text-xs"
            variant="outline"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
            Salvar Snapshot
          </Button>
        </div>
      )}
    </Card>
  );
}
