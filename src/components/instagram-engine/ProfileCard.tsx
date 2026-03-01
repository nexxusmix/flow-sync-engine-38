import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProfileConfig, ProfileSnapshot, useSaveProfileConfig } from '@/hooks/useInstagramEngine';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Copy, Check, ExternalLink, Pencil, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileCardProps {
  config: ProfileConfig | null;
  snapshot: ProfileSnapshot | null;
  publishedCount: number;
  daysSincePost: number;
}

export function ProfileCard({ config, snapshot, publishedCount, daysSincePost }: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editName, setEditName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const saveConfig = useSaveProfileConfig();

  const handle = config?.profile_handle || '';
  const name = config?.profile_name || handle || 'Meu Perfil';
  const bio = config?.bio_current || '';
  const avatarUrl = config?.avatar_url || '';
  const followers = snapshot?.followers || 0;
  const following = snapshot?.following || 0;
  const postsCount = snapshot?.posts_count || publishedCount;

  // Ring color based on posting activity
  const ringColor = daysSincePost <= 3
    ? 'ring-emerald-500'
    : daysSincePost <= 7
      ? 'ring-amber-500'
      : 'ring-destructive';

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `instagram-profile-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await saveConfig.mutateAsync({ avatar_url: publicUrl });
      toast.success('Avatar atualizado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const handleCopyBio = () => {
    navigator.clipboard.writeText(bio);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEditBio = () => {
    setEditBio(bio);
    setEditName(name);
    setIsEditing(true);
  };

  const handleSaveBio = async () => {
    await saveConfig.mutateAsync({ bio_current: editBio, profile_name: editName });
    setIsEditing(false);
    toast.success('Perfil atualizado!');
  };

  return (
    <div className="overflow-hidden">
      <div>
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className={`ring-[3px] ${ringColor} ring-offset-2 ring-offset-background rounded-full`}>
              <Avatar className="w-20 h-20 md:w-24 md:h-24">
                <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
                <AvatarFallback className="text-xl font-bold bg-muted text-muted-foreground">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            {/* Activity indicator dot */}
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background ${
              daysSincePost <= 3 ? 'bg-emerald-500' : daysSincePost <= 7 ? 'bg-amber-500' : 'bg-destructive'
            }`} />
          </div>

          {/* Profile info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground truncate">{name}</h2>
              {handle && (
                <a
                  href={`https://instagram.com/${handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
                >
                  @{handle} <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={handleStartEditBio} className="h-6 w-6 p-0 ml-auto">
                  <Pencil className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Stats row - Instagram style */}
            <div className="flex gap-6 mt-3">
              <StatItem value={postsCount} label="posts" />
              <StatItem value={followers} label="seguidores" />
              <StatItem value={following} label="seguindo" />
            </div>

            {/* Bio */}
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 space-y-2">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome do perfil" className="h-8 text-xs" />
                  <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Bio do perfil..." className="min-h-[60px] text-xs" />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-7 text-xs"><X className="w-3 h-3 mr-1" /> Cancelar</Button>
                    <Button size="sm" onClick={handleSaveBio} className="h-7 text-xs bg-primary hover:bg-primary/90"><Save className="w-3 h-3 mr-1" /> Salvar</Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3">
                  {bio ? (
                    <div className="relative group/bio">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">{bio}</p>
                      <button onClick={handleCopyBio} className="absolute -right-1 -top-1 opacity-0 group-hover/bio:opacity-100 transition-opacity p-1 rounded bg-muted">
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Nenhuma bio configurada</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {config?.niche && <Badge variant="secondary" className="text-[9px]">{config.niche}</Badge>}
              {config?.sub_niche && <Badge variant="outline" className="text-[9px]">{config.sub_niche}</Badge>}
              {config?.brand_voice && <Badge variant="outline" className="text-[9px]">🎙 {config.brand_voice}</Badge>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold text-foreground">{value.toLocaleString('pt-BR')}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
