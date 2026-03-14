import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  InstagramPost, ProfileConfig, ProfileSnapshot,
  POST_STATUSES, FORMATS, PILLARS,
} from '@/hooks/useInstagramEngine';
import { PostEditDialog } from './PostEditDialog';
import {
  Grid3X3, Bookmark, PlaySquare, ExternalLink, Heart, MessageCircle, Send,
  MoreHorizontal, ChevronLeft, X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import instagramIcon from '@/assets/instagram-icon.png';

interface InstagramFeedPreviewProps {
  posts: InstagramPost[];
  config: ProfileConfig | null;
  snapshot: ProfileSnapshot | null;
}

export function InstagramFeedPreview({ posts, config, snapshot }: InstagramFeedPreviewProps) {
  const [open, setOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [activeTab, setActiveTab] = useState('grid');

  const handle = config?.profile_handle || 'meuperfil';
  const name = config?.profile_name || handle;
  const bio = config?.bio_current || '';
  const avatarUrl = config?.avatar_url || '';
  const followers = snapshot?.followers || 0;
  const following = snapshot?.following || 0;
  const postsCount = snapshot?.posts_count || posts.length;

  const reels = posts.filter(p => p.format === 'reel');
  const gridPosts = posts;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-2 text-xs"
      >
        <img src={instagramIcon} alt="" className="w-4 h-4 opacity-60" />
        Preview do Perfil
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl border-0 bg-background">
          {/* Phone frame */}
          <div className="flex flex-col h-[85vh] max-h-[750px] overflow-hidden">
            {/* Status bar mock */}
            <div className="flex items-center justify-between px-4 py-1.5 text-[10px] text-foreground bg-background border-b border-border/30">
              <span className="font-medium">9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-2.5 border border-foreground/60 rounded-[2px] relative">
                  <div className="absolute inset-[1px] right-[2px] bg-foreground/60 rounded-[1px]" />
                </div>
              </div>
            </div>

            {/* Instagram Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border/30">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-foreground">{handle}</span>
                <svg className="w-3 h-3 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              <div className="flex items-center gap-4">
                <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {/* Profile Info Section */}
              <div className="px-4 pt-3 pb-2">
                {/* Avatar + Stats row */}
                <div className="flex items-center gap-5">
                  {/* Avatar with story ring */}
                  <div className="shrink-0">
                    <div className="w-[78px] h-[78px] rounded-full bg-gradient-to-tr from-[#FCAF45] via-[#E1306C] to-[#833AB4] p-[3px]">
                      <div className="w-full h-full rounded-full bg-background p-[2px]">
                        <Avatar className="w-full h-full">
                          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
                          <AvatarFallback className="text-lg font-bold bg-muted text-muted-foreground">
                            {name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex-1 flex justify-around">
                    <StatCol value={postsCount} label="posts" />
                    <StatCol value={followers} label="seguidores" />
                    <StatCol value={following} label="seguindo" />
                  </div>
                </div>

                {/* Name + Bio */}
                <div className="mt-3">
                  <p className="text-[13px] font-semibold text-foreground">{name}</p>
                  {config?.niche && (
                    <p className="text-[11px] text-muted-foreground">{config.niche}</p>
                  )}
                  {bio && (
                    <p className="text-[12px] text-foreground mt-0.5 whitespace-pre-line leading-[1.4]">{bio}</p>
                  )}
                  {config?.profile_handle && (
                    <a
                      href={`https://instagram.com/${config.profile_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[hsl(210,90%,55%)] font-medium mt-0.5 block"
                    >
                      instagram.com/{config.profile_handle}
                    </a>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1.5 mt-3">
                  <button className="flex-1 bg-muted hover:bg-muted/80 rounded-lg py-[6px] text-[12px] font-semibold text-foreground transition-colors">
                    Editar perfil
                  </button>
                  <button className="flex-1 bg-muted hover:bg-muted/80 rounded-lg py-[6px] text-[12px] font-semibold text-foreground transition-colors">
                    Compartilhar
                  </button>
                </div>

                {/* Story Highlights placeholder */}
                <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                  {PILLARS.slice(0, 5).map(pillar => {
                    const count = posts.filter(p => p.pillar === pillar.key).length;
                    if (count === 0) return null;
                    return (
                      <div key={pillar.key} className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          className="w-[58px] h-[58px] rounded-full border-[1.5px] border-border/60 flex items-center justify-center"
                        >
                          <div
                            className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[18px]"
                            style={{ backgroundColor: `${pillar.color}20` }}
                          >
                            <span style={{ color: pillar.color }} className="text-sm font-bold">{count}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-foreground truncate max-w-[60px]">{pillar.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tab Bar */}
              <div className="flex border-t border-b border-border/30 sticky top-0 bg-background z-10">
                <button
                  onClick={() => setActiveTab('grid')}
                  className={`flex-1 py-2.5 flex justify-center border-b-[1.5px] transition-colors ${
                    activeTab === 'grid' ? 'border-foreground' : 'border-transparent text-muted-foreground'
                  }`}
                >
                  <Grid3X3 className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={() => setActiveTab('reels')}
                  className={`flex-1 py-2.5 flex justify-center border-b-[1.5px] transition-colors ${
                    activeTab === 'reels' ? 'border-foreground' : 'border-transparent text-muted-foreground'
                  }`}
                >
                  <PlaySquare className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={() => setActiveTab('saved')}
                  className={`flex-1 py-2.5 flex justify-center border-b-[1.5px] transition-colors ${
                    activeTab === 'saved' ? 'border-foreground' : 'border-transparent text-muted-foreground'
                  }`}
                >
                  <Bookmark className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Grid Content */}
              {activeTab === 'grid' && (
                <div className="grid grid-cols-3 gap-[1px]">
                  {gridPosts.map((post) => {
                    const status = POST_STATUSES.find(s => s.key === post.status);
                    const pillar = PILLARS.find(p => p.key === post.pillar);
                    const isReel = post.format === 'reel';

                    return (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className="relative aspect-square bg-muted/50 hover:opacity-80 transition-opacity group overflow-hidden"
                      >
                        {post.thumbnail_url ? (
                          <img
                            src={post.thumbnail_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: pillar ? `linear-gradient(135deg, ${pillar.color}15, ${pillar.color}30)` : undefined }}
                          >
                            <span className="text-[10px] text-muted-foreground text-center px-2 line-clamp-3 leading-tight">
                              {post.title}
                            </span>
                          </div>
                        )}

                        {/* Reel icon */}
                        {isReel && (
                          <div className="absolute top-1.5 right-1.5">
                            <PlaySquare className="w-3.5 h-3.5 text-white drop-shadow-md" />
                          </div>
                        )}

                        {/* Carousel icon */}
                        {post.format === 'carousel' && (
                          <div className="absolute top-1.5 right-1.5">
                            <svg className="w-3.5 h-3.5 text-white drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="4" y="2" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                              <rect x="8" y="6" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </div>
                        )}

                        {/* Status indicator dot */}
                        {status && post.status !== 'published' && (
                          <div className="absolute bottom-1.5 left-1.5">
                            <div className={`w-2 h-2 rounded-full ${
                              post.status === 'scheduled' ? 'bg-primary/60' :
                              post.status === 'ready' ? 'bg-primary' :
                              post.status === 'in_production' ? 'bg-muted-foreground' :
                              post.status === 'planned' ? 'bg-primary/40' :
                              'bg-muted-foreground/40'
                            }`} />
                          </div>
                        )}

                        {/* Hover overlay with stats */}
                        {post.thumbnail_url && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center gap-4 transition-all">
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-white text-xs font-semibold transition-opacity">
                              <Heart className="w-3.5 h-3.5 fill-white" />
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-white text-xs font-semibold transition-opacity">
                              <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Empty state */}
                  {gridPosts.length === 0 && (
                    <div className="col-span-3 py-12 text-center">
                      <svg className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p className="text-xs text-muted-foreground">Nenhum post ainda</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reels' && (
                <div className="grid grid-cols-3 gap-[1px]">
                  {reels.length === 0 ? (
                    <div className="col-span-3 py-12 text-center">
                      <PlaySquare className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhum Reel ainda</p>
                    </div>
                  ) : (
                    reels.map((post) => {
                      const pillar = PILLARS.find(p => p.key === post.pillar);
                      return (
                        <button
                          key={post.id}
                          onClick={() => setSelectedPost(post)}
                          className="relative aspect-[9/16] bg-muted/50 hover:opacity-80 transition-opacity overflow-hidden"
                        >
                          {post.thumbnail_url ? (
                            <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div
                              className="w-full h-full flex items-end p-2"
                              style={{ background: pillar ? `linear-gradient(180deg, ${pillar.color}10, ${pillar.color}30)` : undefined }}
                            >
                              <span className="text-[9px] text-muted-foreground line-clamp-2">{post.title}</span>
                            </div>
                          )}
                          <div className="absolute top-1.5 right-1.5">
                            <PlaySquare className="w-3 h-3 text-white drop-shadow-md" />
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="py-12 text-center">
                  <Bookmark className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Itens salvos aparecerão aqui</p>
                </div>
              )}
            </ScrollArea>

            {/* Bottom Navigation Bar */}
            <div className="flex items-center justify-around py-2 border-t border-border/30 bg-background">
              <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M3 12l9-9 9 9v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>
              <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <PlaySquare className="w-5 h-5 text-muted-foreground" />
              <Avatar className="w-6 h-6 ring-1 ring-foreground">
                <AvatarImage src={avatarUrl} className="object-cover" />
                <AvatarFallback className="text-[8px] bg-muted">{name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedPost && (
        <PostEditDialog
          post={selectedPost}
          open={!!selectedPost}
          onOpenChange={(v) => !v && setSelectedPost(null)}
        />
      )}
    </>
  );
}

function StatCol({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-[15px] font-semibold text-foreground">{value.toLocaleString('pt-BR')}</p>
      <p className="text-[11px] text-foreground">{label}</p>
    </div>
  );
}
