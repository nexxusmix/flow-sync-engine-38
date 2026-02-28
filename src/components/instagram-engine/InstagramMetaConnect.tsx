import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useInstagramConnection, useConnectInstagramManual, useDisconnectInstagram } from '@/hooks/useInstagramAPI';
import { useProfileSnapshots } from '@/hooks/useInstagramEngine';
import { Loader2, Link2, Unlink, Instagram, Save } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function InstagramMetaConnect() {
  const { data: connection, isLoading: loadingConn } = useInstagramConnection();
  const connectMutation = useConnectInstagramManual();
  const disconnectMutation = useDisconnectInstagram();
  const { data: snapshots } = useProfileSnapshots();
  const [username, setUsername] = useState('');
  const [followers, setFollowers] = useState('');
  const [following, setFollowing] = useState('');
  const [postsCount, setPostsCount] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const latestSnapshot = snapshots?.[0];

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
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Conectar Instagram</h3>
            <p className="text-xs text-muted-foreground">Insira seu @ para registrar métricas manualmente</p>
          </div>
        </div>
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
            className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90"
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
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]">Conectado</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {connection.connected_at && formatDistanceToNow(new Date(connection.connected_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>
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

      <div className="mt-3 border-t border-border/40 pt-3">
        <p className="text-[10px] text-muted-foreground mb-2">Atualizar métricas manualmente</p>
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
    </Card>
  );
}
