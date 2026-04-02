import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, FORMATS, PILLARS, POST_STATUSES } from '@/hooks/useInstagramEngine';
import { motion } from 'framer-motion';
import { Smartphone, Zap } from 'lucide-react';

interface Props {
  posts: InstagramPost[];
  profileHandle?: string;
  profileName?: string;
  avatarUrl?: string;
}

export function CampaignFeedPreview({ posts, profileHandle, profileName, avatarUrl }: Props) {
  // Only show posts that have a visual (thumbnail or cover)
  const feedPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const da = a.scheduled_at || a.created_at;
        const db = b.scheduled_at || b.created_at;
        return new Date(db).getTime() - new Date(da).getTime();
      });
  }, [posts]);

  // Grid posts (3 cols like instagram)
  const gridPosts = feedPosts.slice(0, 15);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Smartphone className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Preview do Feed</h4>
        <Badge variant="outline" className="text-[9px]">{feedPosts.length} posts</Badge>
      </div>

      {/* Phone mockup */}
      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-[320px] bg-card border border-border/40 rounded-[2rem] p-3 shadow-2xl relative overflow-hidden"
        >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-background rounded-b-2xl z-10" />

          {/* Screen */}
          <div className="rounded-[1.5rem] overflow-hidden bg-background border border-border/20">
            {/* Profile header */}
            <div className="px-3 pt-8 pb-3 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/30 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-primary">
                      {(profileHandle || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 text-center">
                    <div>
                      <p className="text-sm font-bold text-foreground">{feedPosts.length}</p>
                      <p className="text-[8px] text-muted-foreground">posts</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">—</p>
                      <p className="text-[8px] text-muted-foreground">seguidores</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">—</p>
                      <p className="text-[8px] text-muted-foreground">seguindo</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-semibold text-foreground mt-2">
                {profileName || profileHandle || 'Seu Perfil'}
              </p>
              {profileHandle && (
                <p className="text-[9px] text-muted-foreground">@{profileHandle}</p>
              )}
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-border/20">
              <div className="flex-1 py-2 text-center border-b-2 border-foreground">
                <svg className="w-4 h-4 mx-auto text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div className="flex-1 py-2 text-center">
                <svg className="w-4 h-4 mx-auto text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-0.5 max-h-[360px] overflow-y-auto">
              {gridPosts.map((post, i) => {
                const pillar = PILLARS.find(p => p.key === post.pillar);
                const pillarColor = pillar?.color || 'hsl(var(--muted))';
                const fmtInfo = FORMATS.find(f => f.key === post.format);
                const statusInfo = POST_STATUSES.find(s => s.key === post.status);
                const isReel = post.format === 'reel';
                const isCarousel = post.format === 'carousel';

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="aspect-square relative group cursor-pointer overflow-hidden"
                  >
                    {/* Thumbnail or generated placeholder */}
                    {post.thumbnail_url ? (
                      <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center p-1"
                        style={{
                          background: `linear-gradient(135deg, ${pillarColor}22, ${pillarColor}08)`,
                          borderRight: '0.5px solid hsl(var(--border) / 0.15)',
                          borderBottom: '0.5px solid hsl(var(--border) / 0.15)',
                        }}
                      >
                        <span className="text-[7px] font-semibold text-foreground text-center line-clamp-2 leading-tight">
                          {post.title}
                        </span>
                        <span className="text-[6px] text-muted-foreground mt-0.5">{fmtInfo?.label}</span>
                      </div>
                    )}

                    {/* Format indicator */}
                    {isReel && (
                      <div className="absolute top-1 right-1">
                        <svg className="w-3 h-3 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor"><path d="M10 8l6 4-6 4V8z" /></svg>
                      </div>
                    )}
                    {isCarousel && (
                      <div className="absolute top-1 right-1">
                        <svg className="w-3 h-3 text-white drop-shadow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="14" height="14" rx="1" /><rect x="7" y="7" width="14" height="14" rx="1" /></svg>
                      </div>
                    )}

                    {/* AI indicator */}
                    {post.ai_generated && (
                      <div className="absolute bottom-1 left-1">
                        <Zap className="w-2.5 h-2.5 text-primary drop-shadow" />
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-1.5">
                      <span className="text-[7px] text-white font-medium text-center line-clamp-2">{post.title}</span>
                      <Badge className={`${statusInfo?.color} text-[6px] mt-1 h-3 px-1`}>{statusInfo?.label}</Badge>
                      {pillar && (
                        <span className="flex items-center gap-0.5 text-[6px] text-white/70 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pillar.color }} />
                          {pillar.label}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Empty slots to fill the grid */}
              {gridPosts.length < 9 && Array.from({ length: 9 - gridPosts.length }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square bg-muted/10 border border-dashed border-border/15 flex items-center justify-center">
                  <span className="text-[7px] text-muted-foreground">+</span>
                </div>
              ))}
            </div>
          </div>

          {/* Home bar */}
          <div className="mt-2 flex justify-center">
            <div className="w-24 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center">
        {PILLARS.map(p => (
          <span key={p.key} className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
