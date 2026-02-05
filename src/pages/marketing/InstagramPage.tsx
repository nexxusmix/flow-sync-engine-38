import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InstagramConnection, InstagramSnapshot, InstagramPost } from "@/types/marketing";
import { supabase } from "@/integrations/supabase/client";
import { 
  Instagram, RefreshCw, ExternalLink, Users, Image, Heart,
  MessageCircle, Link2, AlertTriangle, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function InstagramPage() {
  const [connection, setConnection] = useState<InstagramConnection | null>(null);
  const [snapshot, setSnapshot] = useState<InstagramSnapshot | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [connectUsername, setConnectUsername] = useState('');
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);

  useEffect(() => {
    fetchConnection();
  }, []);

  const fetchConnection = async () => {
    const { data: conn } = await supabase
      .from('instagram_connections')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (conn) {
      setConnection(conn as InstagramConnection);
      fetchSnapshot(conn.id);
    }
  };

  const fetchSnapshot = async (connectionId: string) => {
    const { data } = await supabase
      .from('instagram_snapshots')
      .select('*')
      .eq('connection_id', connectionId)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setSnapshot(data as unknown as InstagramSnapshot);
    }
  };

  const handleConnect = async () => {
    if (!connectUsername) {
      toast.error('Username é obrigatório');
      return;
    }

    setIsConnecting(true);
    try {
      // For MVP: Save connection without OAuth (manual entry)
      // In production, this would redirect to Instagram OAuth
      const { data, error } = await supabase
        .from('instagram_connections')
        .insert([{
          ig_username: connectUsername,
        }])
        .select()
        .single();

      if (error) throw error;

      setConnection(data as InstagramConnection);
      setIsConnectDialogOpen(false);
      setConnectUsername('');
      toast.success('Conta conectada! Configure o token de acesso para buscar dados.');

      // Create initial empty snapshot
      await supabase.from('instagram_snapshots').insert([{
        connection_id: data.id,
        profile_data: { username: connectUsername },
        latest_posts: [],
      }]);

    } catch (error: any) {
      toast.error(error.message || 'Erro ao conectar');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefresh = async () => {
    if (!connection) return;

    setIsRefreshing(true);
    try {
      // In production, this would call Instagram Graph API
      // For now, we show a message about API configuration
      toast.info('Configure o access_token para buscar dados do Instagram Graph API');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsRefreshing(false);
    }
  };

  const profile = snapshot?.profile_data as any;
  const posts = (snapshot?.latest_posts as InstagramPost[]) || [];

  return (
    <DashboardLayout title="Instagram">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-light text-foreground tracking-tight">Instagram Preview</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize e planeje seu conteúdo
            </p>
          </div>
          {connection ? (
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Atualizar
            </Button>
          ) : (
            <Button onClick={() => setIsConnectDialogOpen(true)}>
              <Instagram className="w-4 h-4 mr-2" />
              Conectar Instagram
            </Button>
          )}
        </div>

        {connection ? (
          <>
            {/* Profile Card */}
            <Card className="glass-card p-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  {profile?.profile_picture_url ? (
                    <img 
                      src={profile.profile_picture_url} 
                      alt={profile.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Instagram className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-medium text-foreground">@{connection.ig_username}</h2>
                    <Badge variant="outline" className="text-[9px]">Conectado</Badge>
                  </div>
                  {profile?.biography && (
                    <p className="text-sm text-muted-foreground mt-1 max-w-md">{profile.biography}</p>
                  )}
                  <div className="flex gap-6 mt-3">
                    <Stat icon={Image} value={profile?.media_count || 0} label="posts" />
                    <Stat icon={Users} value={profile?.followers_count || 0} label="seguidores" />
                    <Stat icon={Heart} value={profile?.follows_count || 0} label="seguindo" />
                  </div>
                </div>
                {snapshot && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Atualizado: {new Date(snapshot.fetched_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Posts Grid */}
            <div>
              <h3 className="font-medium text-foreground mb-4">
                Posts Recentes {posts.length > 0 && `(${posts.length})`}
              </h3>
              
              {posts.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {posts.map((post, i) => (
                    <PostThumbnail 
                      key={post.id || i} 
                      post={post} 
                      onClick={() => setSelectedPost(post)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="glass-card p-12 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-2">Nenhum post carregado</p>
                  <p className="text-sm text-muted-foreground">
                    Configure o access_token do Instagram Graph API para buscar posts.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar novamente
                  </Button>
                </Card>
              )}
            </div>

            {/* API Configuration Info */}
            <Card className="glass-card p-6 border-amber-500/30">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">Configuração da API</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Para buscar dados reais do Instagram, configure o access_token via Meta Graph API.
                    No MVP, a conexão é manual. Para produção, implemente o fluxo OAuth completo.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('https://developers.facebook.com/docs/instagram-basic-display-api', '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Documentação
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          /* Not Connected State */
          <Card className="glass-card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
              <Instagram className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-medium text-foreground mb-2">Conecte seu Instagram</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Visualize seu grid, planeje novos posts e acompanhe métricas sem sair do SQUAD Hub.
            </p>
            <Button onClick={() => setIsConnectDialogOpen(true)}>
              <Instagram className="w-4 h-4 mr-2" />
              Conectar Instagram
            </Button>
          </Card>
        )}

        {/* Connect Dialog */}
        <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conectar Instagram</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Insira o username da conta que deseja conectar. Para dados completos,
                configure o access_token via Meta Graph API.
              </p>
              <div>
                <Label>Username do Instagram</Label>
                <Input
                  value={connectUsername}
                  onChange={(e) => setConnectUsername(e.target.value.replace('@', ''))}
                  placeholder="squadfilme"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? 'Conectando...' : 'Conectar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Post Detail Dialog */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-lg">
            {selectedPost && (
              <>
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {selectedPost.media_url ? (
                    selectedPost.media_type === 'VIDEO' ? (
                      <video 
                        src={selectedPost.media_url} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={selectedPost.media_url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {selectedPost.caption && (
                  <p className="text-sm text-foreground mt-4 max-h-32 overflow-y-auto">
                    {selectedPost.caption}
                  </p>
                )}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-4">
                    {selectedPost.like_count !== undefined && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {selectedPost.like_count}
                      </span>
                    )}
                    {selectedPost.comments_count !== undefined && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {selectedPost.comments_count}
                      </span>
                    )}
                  </div>
                  {selectedPost.permalink && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(selectedPost.permalink, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Ver no Instagram
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function Stat({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="font-medium text-foreground">{value.toLocaleString('pt-BR')}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function PostThumbnail({ post, onClick }: { post: InstagramPost; onClick: () => void }) {
  return (
    <motion.div
      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer relative group"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
    >
      {post.thumbnail_url || post.media_url ? (
        <img 
          src={post.thumbnail_url || post.media_url} 
          alt="" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Image className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
        {post.like_count !== undefined && (
          <span className="text-white text-sm flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {post.like_count}
          </span>
        )}
      </div>

      {/* Video indicator */}
      {post.media_type === 'VIDEO' && (
        <div className="absolute top-2 right-2">
          <span className="material-symbols-outlined text-white text-sm drop-shadow">play_arrow</span>
        </div>
      )}
    </motion.div>
  );
}
