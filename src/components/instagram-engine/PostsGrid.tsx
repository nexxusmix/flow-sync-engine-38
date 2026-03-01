import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InstagramPost, POST_STATUSES, FORMATS, PILLARS } from '@/hooks/useInstagramEngine';
import { PostEditDialog } from './PostEditDialog';
import { ExternalLink, Play, Image, Layers, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PostsGridProps {
  posts: InstagramPost[];
  onViewPost?: (post: InstagramPost) => void;
}

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  reel: <Play className="w-3.5 h-3.5" />,
  carousel: <Layers className="w-3.5 h-3.5" />,
  single: <Image className="w-3.5 h-3.5" />,
  story: <BookOpen className="w-3.5 h-3.5" />,
  story_sequence: <BookOpen className="w-3.5 h-3.5" />,
};

export function PostsGrid({ posts, onViewPost }: PostsGridProps) {
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);

  if (posts.length === 0) {
    return (
      <Card className="glass-card p-8 text-center">
        <span className="material-symbols-outlined text-3xl text-muted-foreground/40 mb-2">grid_view</span>
        <p className="text-xs text-muted-foreground">Nenhum post ainda. Crie conteúdo com IA!</p>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1 md:gap-1.5 rounded-xl overflow-hidden">
        {posts.map((post) => {
          const status = POST_STATUSES.find(s => s.key === post.status);
          const formatInfo = FORMATS.find(f => f.key === post.format);
          const pillar = PILLARS.find(p => p.key === post.pillar);
          const isPublished = post.status === 'published';
          const isScheduled = post.status === 'scheduled';

          return (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="group relative aspect-square bg-muted/40 hover:bg-muted/60 transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {/* Thumbnail image or gradient background */}
              {post.thumbnail_url ? (
                <img
                  src={post.thumbnail_url}
                  alt={post.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{ background: pillar ? `linear-gradient(135deg, ${pillar.color}22, ${pillar.color}44)` : undefined }}
                />
              )}

              {/* Content overlay */}
              <div className={`relative h-full flex flex-col items-center justify-center p-2 gap-1.5 ${post.thumbnail_url ? 'bg-black/40' : ''}`}>
                {/* Format icon */}
                <div className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground">
                  {FORMAT_ICONS[post.format] || <Image className="w-3.5 h-3.5" />}
                </div>

                {/* Title */}
                <p className={`text-[10px] md:text-xs font-medium text-center line-clamp-2 leading-tight px-1 ${post.thumbnail_url ? 'text-white' : 'text-foreground'}`}>
                  {post.title}
                </p>

                {/* Status badge */}
                {status && (
                  <Badge className={`${status.color} text-[8px] md:text-[9px] px-1.5 py-0`}>
                    {status.label}
                  </Badge>
                )}

                {/* Scheduled date */}
                {isScheduled && post.scheduled_at && (
                  <p className={`text-[8px] ${post.thumbnail_url ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {format(new Date(post.scheduled_at), "dd/MM HH:mm")}
                  </p>
                )}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
                  Editar
                </span>
              </div>

              {/* Published link indicator */}
              {isPublished && post.post_url && (
                <div className="absolute top-1 right-1">
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </div>
              )}

              {/* Format icon corner */}
              {formatInfo && (
                <div className="absolute top-1 left-1 text-[8px] text-muted-foreground uppercase tracking-wider bg-background/60 backdrop-blur-sm px-1 py-0.5 rounded">
                  {formatInfo.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedPost && (
        <PostEditDialog
          post={selectedPost}
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
        />
      )}
    </>
  );
}
