import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useInstagramConnection, useConnectInstagramManual, useDisconnectInstagram } from '@/hooks/useInstagramAPI';
import { Loader2, Link2, Unlink, Instagram } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function InstagramMetaConnect() {
  const { data: connection, isLoading: loadingConn } = useInstagramConnection();
  const connectMutation = useConnectInstagramManual();
  const disconnectMutation = useDisconnectInstagram();
  const [username, setUsername] = useState('');

  if (loadingConn) {
    return (
      <Card className="glass-card p-5">
        <Skeleton className="h-20 w-full" />
      </Card>
    );
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
            <p className="text-xs text-muted-foreground">Insira seu @ para vincular o perfil e acompanhar métricas</p>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
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

        <p className="text-[10px] text-muted-foreground">
          📊 As métricas serão inseridas manualmente via snapshots. Nenhuma API externa necessária.
        </p>
      </Card>
    );
  }

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
              Vinculado {connection.connected_at ? formatDistanceToNow(new Date(connection.connected_at), { addSuffix: true, locale: ptBR }) : ''}
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
          {disconnectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3 mr-1" />}
          Desconectar
        </Button>
      </div>
    </Card>
  );
}
