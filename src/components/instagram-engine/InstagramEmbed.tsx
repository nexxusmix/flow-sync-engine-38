import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, X } from 'lucide-react';

interface InstagramEmbedProps {
  postUrl: string;
  compact?: boolean;
}

interface OEmbedData {
  html: string;
  thumbnail_url?: string;
  author_name?: string;
  title?: string;
}

export function InstagramEmbed({ postUrl, compact = false }: InstagramEmbedProps) {
  const [oembedData, setOembedData] = useState<OEmbedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!postUrl) return;

    const normalizedUrl = postUrl.replace(/\/$/, '').split('?')[0];
    const apiUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(normalizedUrl)}&omitscript=true&maxwidth=${compact ? 320 : 480}`;

    setLoading(true);
    setError(false);

    fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error('oEmbed failed');
        return res.json();
      })
      .then((data: OEmbedData) => {
        setOembedData(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [postUrl, compact]);

  // Load Instagram embed script when HTML is injected
  useEffect(() => {
    if (!oembedData?.html || !containerRef.current) return;

    // Inject the HTML
    containerRef.current.innerHTML = oembedData.html;

    // Load or reload the Instagram embed script
    const existingScript = document.querySelector('script[src*="instagram.com/embed"]');
    if (existingScript) {
      // Re-process embeds if script already loaded
      (window as any).instgrm?.Embeds?.process?.();
    } else {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [oembedData]);

  if (!postUrl) return null;

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${compact ? 'h-20' : 'h-40'} rounded-lg bg-muted/30`}>
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-muted-foreground">
        <span className="text-xs">Não foi possível carregar o preview.</span>
        <a href={postUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline flex items-center gap-1">
          Abrir <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  if (compact && oembedData?.thumbnail_url) {
    return (
      <a href={postUrl} target="_blank" rel="noopener noreferrer" className="block group">
        <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted/30">
          <img
            src={oembedData.thumbnail_url}
            alt={oembedData.title || 'Instagram post'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </a>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <div ref={containerRef} className="instagram-embed-container [&_iframe]:!border-0 [&_.instagram-media]:!shadow-none [&_.instagram-media]:!border-border/20 [&_.instagram-media]:!rounded-lg [&_.instagram-media]:!mx-auto" />
      <a
        href={postUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary mt-1 transition-colors"
      >
        <ExternalLink className="w-3 h-3" /> Abrir no Instagram
      </a>
    </div>
  );
}
