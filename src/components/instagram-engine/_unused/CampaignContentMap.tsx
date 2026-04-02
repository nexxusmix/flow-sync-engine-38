import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstagramPost, PILLARS, FORMATS, POST_STATUSES, InstagramCampaign } from '@/hooks/useInstagramEngine';
import { motion } from 'framer-motion';
import { Map, GitBranch, Target, Layers, Zap, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface Props {
  campaign: InstagramCampaign;
  posts: InstagramPost[];
}

type NodeType = 'campaign' | 'pillar' | 'format' | 'status' | 'post';

interface MapNode {
  id: string;
  type: NodeType;
  label: string;
  color: string;
  emoji?: string;
  children: string[];
  postCount?: number;
}

export function CampaignContentMap({ campaign, posts }: Props) {
  const [groupBy, setGroupBy] = useState<'pillar' | 'format' | 'status' | 'funnel'>('pillar');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);

  const FUNNEL_STAGES = [
    { key: 'topo', label: 'Topo (Descoberta)', color: 'hsl(195, 100%, 40%)', pillars: ['educativo', 'entretenimento', 'tendencia'] },
    { key: 'meio', label: 'Meio (Consideração)', color: 'hsl(195, 80%, 50%)', pillars: ['autoridade', 'bastidores', 'comunidade'] },
    { key: 'fundo', label: 'Fundo (Conversão)', color: 'hsl(195, 60%, 60%)', pillars: ['vendas', 'prova_social', 'oferta'] },
  ];

  const nodes = useMemo(() => {
    const map: globalThis.Map<string, MapNode> = new globalThis.Map();

    // Root node
    map.set('root', {
      id: 'root',
      type: 'campaign',
      label: campaign.name,
      color: 'hsl(var(--primary))',
      emoji: '🎯',
      children: [],
      postCount: posts.length,
    });

    if (groupBy === 'pillar') {
      const usedPillars = [...new Set(posts.map(p => p.pillar).filter(Boolean))];
      PILLARS.filter(p => usedPillars.includes(p.key)).forEach(pillar => {
        const pillarPosts = posts.filter(p => p.pillar === pillar.key);
        map.set(`pillar-${pillar.key}`, {
          id: `pillar-${pillar.key}`,
          type: 'pillar',
          label: pillar.label,
          color: pillar.color,
          emoji: '📌',
          children: pillarPosts.map(p => `post-${p.id}`),
          postCount: pillarPosts.length,
        });
        map.get('root')!.children.push(`pillar-${pillar.key}`);
        pillarPosts.forEach(p => {
          map.set(`post-${p.id}`, { id: `post-${p.id}`, type: 'post', label: p.title, color: pillar.color, children: [] });
        });
      });
      // Uncategorized
      const uncategorized = posts.filter(p => !p.pillar);
      if (uncategorized.length > 0) {
        map.set('pillar-none', { id: 'pillar-none', type: 'pillar', label: 'Sem Pilar', color: '#666', emoji: '❓', children: uncategorized.map(p => `post-${p.id}`), postCount: uncategorized.length });
        map.get('root')!.children.push('pillar-none');
        uncategorized.forEach(p => { map.set(`post-${p.id}`, { id: `post-${p.id}`, type: 'post', label: p.title, color: '#666', children: [] }); });
      }
    } else if (groupBy === 'format') {
      const usedFormats = [...new Set(posts.map(p => p.format).filter(Boolean))];
      FORMATS.filter(f => usedFormats.includes(f.key)).forEach(fmt => {
        const fmtPosts = posts.filter(p => p.format === fmt.key);
        map.set(`format-${fmt.key}`, { id: `format-${fmt.key}`, type: 'format', label: fmt.label, color: '#6366f1', emoji: '🎬', children: fmtPosts.map(p => `post-${p.id}`), postCount: fmtPosts.length });
        map.get('root')!.children.push(`format-${fmt.key}`);
        fmtPosts.forEach(p => { map.set(`post-${p.id}`, { id: `post-${p.id}`, type: 'post', label: p.title, color: '#6366f1', children: [] }); });
      });
    } else if (groupBy === 'status') {
      POST_STATUSES.forEach(st => {
        const stPosts = posts.filter(p => p.status === st.key);
        if (stPosts.length > 0) {
          map.set(`status-${st.key}`, { id: `status-${st.key}`, type: 'status', label: st.label, color: st.color, emoji: '📋', children: stPosts.map(p => `post-${p.id}`), postCount: stPosts.length });
          map.get('root')!.children.push(`status-${st.key}`);
          stPosts.forEach(p => { map.set(`post-${p.id}`, { id: `post-${p.id}`, type: 'post', label: p.title, color: st.color, children: [] }); });
        }
      });
    } else if (groupBy === 'funnel') {
      FUNNEL_STAGES.forEach(stage => {
        const stagePosts = posts.filter(p => stage.pillars.includes(p.pillar || ''));
        map.set(`funnel-${stage.key}`, { id: `funnel-${stage.key}`, type: 'pillar', label: stage.label, color: stage.color, children: stagePosts.map(p => `post-${p.id}`), postCount: stagePosts.length });
        map.get('root')!.children.push(`funnel-${stage.key}`);
        stagePosts.forEach(p => { map.set(`post-${p.id}`, { id: `post-${p.id}`, type: 'post', label: p.title, color: stage.color, children: [] }); });
      });
      const unmatched = posts.filter(p => !FUNNEL_STAGES.some(s => s.pillars.includes(p.pillar || '')));
      if (unmatched.length > 0) {
        map.set('funnel-other', { id: 'funnel-other', type: 'pillar', label: 'Outros', color: '#666', emoji: '📌', children: unmatched.map(p => `post-${p.id}`), postCount: unmatched.length });
        map.get('root')!.children.push('funnel-other');
        unmatched.forEach(p => { map.set(`post-${p.id}`, { id: `post-${p.id}`, type: 'post', label: p.title, color: '#666', children: [] }); });
      }
    }

    return map;
  }, [posts, campaign, groupBy]);

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const renderNode = (nodeId: string, depth: number = 0) => {
    const node = nodes.get(nodeId);
    if (!node) return null;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = node.children.length > 0;

    return (
      <motion.div
        key={nodeId}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.05 }}
        style={{ marginLeft: depth * 24 }}
      >
        <div
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-all hover:bg-muted/15 ${
            hoveredPost === nodeId ? 'bg-muted/20' : ''
          }`}
          onClick={() => hasChildren && toggleExpand(nodeId)}
          onMouseEnter={() => setHoveredPost(nodeId)}
          onMouseLeave={() => setHoveredPost(null)}
        >
          {/* Connector line */}
          {depth > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-4 h-px" style={{ backgroundColor: node.color }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color }} />
            </div>
          )}

          {/* Node content */}
          {node.type === 'campaign' ? (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm">{node.emoji}</span>
              <span className="text-[11px] font-bold text-foreground">{node.label}</span>
              <Badge variant="outline" className="text-[7px] ml-auto">{node.postCount} posts</Badge>
            </div>
          ) : node.type === 'post' ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
              <span className="text-[9px] text-foreground/70 truncate">{node.label}</span>
              {posts.find(p => `post-${p.id}` === nodeId)?.ai_generated && (
                <Zap className="w-2.5 h-2.5 text-primary shrink-0" />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              {node.emoji && <span className="text-xs">{node.emoji}</span>}
              <span className="text-[10px] font-semibold text-foreground">{node.label}</span>
              <Badge className="text-[7px]" style={{ backgroundColor: `${node.color}20`, color: node.color }}>{node.postCount}</Badge>
              {hasChildren && (
                <span className="text-[8px] text-muted-foreground ml-auto">
                  {isExpanded ? '▾' : '▸'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
            {node.children.map(childId => renderNode(childId, depth + 1))}
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Stats
  const pillarCount = new Set(posts.map(p => p.pillar).filter(Boolean)).size;
  const formatCount = new Set(posts.map(p => p.format).filter(Boolean)).size;
  const aiCount = posts.filter(p => p.ai_generated).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Map className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Mapa de Conteúdo</h4>
            <p className="text-[10px] text-muted-foreground">{posts.length} posts · {pillarCount} pilares · {formatCount} formatos</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="text-[8px] h-5" onClick={() => setExpandedNodes(new Set<string>(['root', ...Array.from(nodes.keys())]))}><Eye className="w-3 h-3" /></Button>
          <Button size="sm" variant="ghost" className="text-[8px] h-5" onClick={() => setExpandedNodes(new Set(['root']))}><EyeOff className="w-3 h-3" /></Button>
        </div>
      </div>

      {/* Group by selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Agrupar por:</span>
        {([
          { key: 'pillar' as const, label: 'Pilar', icon: <Layers className="w-3 h-3" /> },
          { key: 'format' as const, label: 'Formato', icon: <GitBranch className="w-3 h-3" /> },
          { key: 'status' as const, label: 'Status', icon: <Target className="w-3 h-3" /> },
          { key: 'funnel' as const, label: 'Funil', icon: <ArrowRight className="w-3 h-3" /> },
        ]).map(g => (
          <Button key={g.key} size="sm" variant={groupBy === g.key ? 'default' : 'outline'} className="text-[9px] h-6 gap-1" onClick={() => { setGroupBy(g.key); setExpandedNodes(new Set(['root'])); }}>
            {g.icon} {g.label}
          </Button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{pillarCount}</p>
          <p className="text-[9px] text-muted-foreground">Pilares ativos</p>
        </Card>
        <Card className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-foreground">{formatCount}</p>
          <p className="text-[9px] text-muted-foreground">Formatos usados</p>
        </Card>
        <Card className="glass-card p-3 text-center">
          <p className="text-lg font-bold text-primary">{aiCount}</p>
          <p className="text-[9px] text-muted-foreground">Gerados por IA</p>
        </Card>
      </div>

      {/* Tree map */}
      <Card className="glass-card p-4 max-h-[500px] overflow-y-auto">
        {renderNode('root')}
      </Card>

      {/* Visual distribution */}
      <Card className="glass-card p-4">
        <h5 className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Distribuição Visual</h5>
        <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
          {PILLARS.filter(p => posts.some(post => post.pillar === p.key)).map(pillar => {
            const count = posts.filter(p => p.pillar === pillar.key).length;
            const pct = posts.length > 0 ? (count / posts.length) * 100 : 0;
            return (
              <motion.div
                key={pillar.key}
                className="relative group cursor-pointer"
                style={{ width: `${pct}%`, backgroundColor: pillar.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8 }}
                title={`${pillar.label}: ${count} posts (${Math.round(pct)}%)`}
              >
                {pct > 10 && (
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] text-white font-bold">
                    📌
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {PILLARS.filter(p => posts.some(post => post.pillar === p.key)).map(pillar => (
            <div key={pillar.key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pillar.color }} />
              <span className="text-[8px] text-muted-foreground">{pillar.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
