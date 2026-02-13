import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, Play, Pause, Send, RefreshCw, Loader2, Phone,
  Building2, User, Sparkles, Volume2, CheckCircle, 
  AlertTriangle, Clock, Plus, X, Edit3, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useScoutPipeline, ScoutOpportunity, ScoutMessage, ScoutAudioAsset } from '@/hooks/useScoutPipeline';

// ─── Status config ──────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  NEW: { label: 'Nova', color: 'bg-muted text-muted-foreground', icon: Clock },
  COPY_READY: { label: 'Copy Pronta', color: 'bg-blue-500/20 text-blue-400', icon: Edit3 },
  AUDIO_READY: { label: 'Áudio Pronto', color: 'bg-purple-500/20 text-purple-400', icon: Volume2 },
  PENDING_APPROVAL: { label: 'Aguardando Aprovação', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  SENDING: { label: 'Enviando...', color: 'bg-orange-500/20 text-orange-400', icon: Loader2 },
  SENT: { label: 'Enviado', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  FAILED: { label: 'Falhou', color: 'bg-red-500/20 text-red-400', icon: AlertTriangle },
  ARCHIVED: { label: 'Arquivado', color: 'bg-muted text-muted-foreground', icon: Clock },
};

// ─── New Opportunity Dialog ─────────────────────────────
function NewOpportunityDialog({ onCreated }: { onCreated: () => void }) {
  const { createOpportunity, isCreating } = useScoutPipeline();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    contact_role: '',
    contact_phone_e164: '',
    context_text: '',
  });

  const handleSubmit = async () => {
    if (!form.company_name.trim()) return;
    await createOpportunity({
      company_name: form.company_name,
      contact_name: form.contact_name || undefined,
      contact_role: form.contact_role || undefined,
      contact_phone_e164: form.contact_phone_e164 || undefined,
      context: form.context_text ? { insight: form.context_text } : {},
    });
    setForm({ company_name: '', contact_name: '', contact_role: '', contact_phone_e164: '', context_text: '' });
    setOpen(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Oportunidade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Oportunidade Scout</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Empresa *</label>
            <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Nome da empresa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contato</label>
              <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Nome do contato" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cargo</label>
              <Input value={form.contact_role} onChange={e => setForm(f => ({ ...f, contact_role: e.target.value }))} placeholder="CEO, Diretor..." />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">WhatsApp (E.164)</label>
            <Input value={form.contact_phone_e164} onChange={e => setForm(f => ({ ...f, contact_phone_e164: e.target.value }))} placeholder="+5511999999999" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Contexto / Insight</label>
            <Textarea value={form.context_text} onChange={e => setForm(f => ({ ...f, context_text: e.target.value }))} placeholder="Ex: Empresa postou projeto sem vídeo institucional..." rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={isCreating || !form.company_name.trim()} className="w-full">
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Criar Oportunidade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Audio Player ───────────────────────────────────────
function AudioPlayer({ storagePath }: { storagePath: string }) {
  const { getAudioUrl } = useScoutPipeline();
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getAudioUrl(storagePath).then(setUrl);
  }, [storagePath, getAudioUrl]);

  const toggle = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }, [playing]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress((audio.currentTime / (audio.duration || 1)) * 100);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [url]);

  if (!url) return <div className="text-xs text-muted-foreground">Carregando áudio...</div>;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/30">
      <audio ref={audioRef} src={url} preload="metadata" />
      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={toggle}>
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
}

// ─── Scout Card ─────────────────────────────────────────
function ScoutCard({ opportunity }: { opportunity: ScoutOpportunity }) {
  const { generateCopy, generateAudio, approveSend, fetchMessages, fetchAudioAssets, isGeneratingCopy, isGeneratingAudio, isSending } = useScoutPipeline();
  const [messages, setMessages] = useState<ScoutMessage[]>([]);
  const [audioAssets, setAudioAssets] = useState<ScoutAudioAsset[]>([]);
  const [expanded, setExpanded] = useState(false);

  const statusCfg = STATUS_CONFIG[opportunity.status] || STATUS_CONFIG.NEW;
  const StatusIcon = statusCfg.icon;
  const activeMessage = messages.find(m => m.is_active);
  const latestAudio = audioAssets[0];
  const sending = isSending(opportunity.id);

  useEffect(() => {
    if (expanded) {
      fetchMessages(opportunity.id).then(setMessages);
      fetchAudioAssets(opportunity.id).then(setAudioAssets);
    }
  }, [expanded, opportunity.id, opportunity.status]);

  return (
    <motion.div
      layout
      className="glass-card rounded-2xl overflow-hidden border border-border/30"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer flex items-start justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <h3 className="font-medium text-sm text-foreground truncate">{opportunity.company_name}</h3>
          </div>
          {opportunity.contact_name && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span>{opportunity.contact_name}</span>
              {opportunity.contact_role && <span className="opacity-60">• {opportunity.contact_role}</span>}
            </div>
          )}
          {opportunity.contact_phone_e164 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <Phone className="w-3 h-3" />
              <span>{opportunity.contact_phone_e164}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className={`text-[10px] ${statusCfg.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusCfg.label}
          </Badge>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Context preview */}
      {(opportunity.context as any)?.insight && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground line-clamp-2">
            💡 {(opportunity.context as any).insight}
          </p>
        </div>
      )}

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/20 pt-4">
              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {['NEW', 'FAILED'].includes(opportunity.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateCopy(opportunity.id)}
                    disabled={isGeneratingCopy}
                    className="gap-2"
                  >
                    {isGeneratingCopy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Gerar Abordagem
                  </Button>
                )}

                {activeMessage && !['SENT', 'SENDING'].includes(opportunity.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateAudio({ oppId: opportunity.id, messageId: activeMessage.id })}
                    disabled={isGeneratingAudio}
                    className="gap-2"
                  >
                    {isGeneratingAudio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                    Gerar Áudio
                  </Button>
                )}

                {['COPY_READY', 'AUDIO_READY', 'PENDING_APPROVAL', 'FAILED'].includes(opportunity.status) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateCopy(opportunity.id)}
                    disabled={isGeneratingCopy}
                    className="gap-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Regenerar Copy
                  </Button>
                )}
              </div>

              {/* Active message */}
              {activeMessage && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      Mensagem WhatsApp (v{activeMessage.version})
                    </label>
                    <div className="mt-1 p-3 rounded-xl bg-background/50 border border-border/30 text-sm text-foreground whitespace-pre-wrap">
                      {activeMessage.text_message}
                    </div>
                  </div>

                  {activeMessage.audio_script && activeMessage.audio_script !== activeMessage.text_message && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        Script de Áudio
                      </label>
                      <div className="mt-1 p-3 rounded-xl bg-background/50 border border-border/30 text-xs text-muted-foreground whitespace-pre-wrap">
                        {activeMessage.audio_script}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Audio player */}
              {latestAudio && (
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 block">
                    Áudio Gerado {latestAudio.duration_seconds ? `(~${Math.round(latestAudio.duration_seconds)}s)` : ''}
                  </label>
                  <AudioPlayer storagePath={latestAudio.storage_path} />
                </div>
              )}

              {/* Approve and Send button */}
              {['COPY_READY', 'AUDIO_READY', 'PENDING_APPROVAL', 'FAILED'].includes(opportunity.status) && (
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                  disabled={sending || !opportunity.contact_phone_e164}
                  onClick={() => approveSend({
                    oppId: opportunity.id,
                    messageId: activeMessage?.id,
                    audioAssetId: latestAudio?.id,
                  })}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {sending ? 'Enviando...' : 'APROVAR ENVIO VIA WHATSAPP'}
                </Button>
              )}

              {!opportunity.contact_phone_e164 && ['COPY_READY', 'AUDIO_READY', 'PENDING_APPROVAL'].includes(opportunity.status) && (
                <p className="text-xs text-yellow-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Adicione um telefone para habilitar o envio
                </p>
              )}

              {opportunity.status === 'SENT' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-400 font-medium">Mensagem enviada com sucesso!</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────
export function ScoutDashboard() {
  const { opportunities, isLoading } = useScoutPipeline();

  const stats = {
    total: opportunities.length,
    pending: opportunities.filter(o => ['NEW', 'COPY_READY', 'AUDIO_READY', 'PENDING_APPROVAL'].includes(o.status)).length,
    sent: opportunities.filter(o => o.status === 'SENT').length,
    failed: opportunities.filter(o => o.status === 'FAILED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">🔍 Agent Scout</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pipeline de prospecção inteligente
          </p>
        </div>
        <NewOpportunityDialog onCreated={() => {}} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-foreground' },
          { label: 'Pendentes', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Enviados', value: stats.sent, color: 'text-green-400' },
          { label: 'Falhas', value: stats.failed, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-xl p-3 text-center">
            <p className={`text-xl font-medium ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Opportunity cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-2xl">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-sm text-muted-foreground">Nenhuma oportunidade criada</p>
          <p className="text-xs text-muted-foreground mt-1">Crie uma oportunidade para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opportunities.map(opp => (
            <ScoutCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
