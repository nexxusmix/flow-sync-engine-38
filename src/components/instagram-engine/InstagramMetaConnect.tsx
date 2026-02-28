import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useInstagramConnection, useConnectInstagramManual, useDisconnectInstagram, useScrapeInstagramProfile } from '@/hooks/useInstagramAPI';
import { useProfileSnapshots } from '@/hooks/useInstagramEngine';
import { Loader2, Link2, Unlink, Instagram, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function InstagramMetaConnect() {
  const { data: connection, isLoading: loadingConn } = useInstagramConnection();
  const connectMutation = useConnectInstagramManual();
  const disconnectMutation = useDisconnectInstagram();
  const scrapeMutation = useScrapeInstagramProfile();
  const { data: snapshots } = useProfileSnapshots();
  const [username, setUsername] = useState('');

  const latestSnapshot = snapshots?.[0];

  if (loadingConn) {
    return <Card className="glass-card p-5"><Skeleton className="h-20 w-full" /></Card>;
  }

  if (!connection) {
    const handleConnect = () => {
      const cleaned = username.trim().replace(/^@/, '');
      if (!cleaned) return;
      connectMutation.mutate(cleaned, {
        onSuccess: () => {
          // Auto-fetch data after connecting
          scrapeMutation.mutate(cleaned);
        }
      });
    };

    return (
      <Card className="glass-card p-5 border border-dashed border-primary/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Conectar Instagram</h3>
            <p className="text-xs text-muted-foreground">Insira seu @ para buscar métricas automaticamente</p>
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
            disabled={!username.trim() || connectMutation.isPending || scrapeMutation.isPending}
            className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-90"
            size="sm"
          >
            {(connectMutation.isPending || scrapeMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4 mr-1" />}
            Conectar
          </Button>
        </div>
      </Card>
    );
  }

  const handleRefresh = () => {
    scrapeMutation.mutate(connection.ig_username);
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
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={scrapeMutation.isPending}
            className="text-xs"
          >
            {scrapeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
            Atualizar
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
    </Card>
  );
}
