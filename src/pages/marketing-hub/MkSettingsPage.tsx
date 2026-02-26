import { useEffect, useState } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkSectionHeader } from "@/components/marketing-hub/mk-ui";
import { supabase } from "@/integrations/supabase/client";
import { MarketingSettings } from "@/types/settings";
import { Save, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function MkSettingsPage() {
  const [settings, setSettings] = useState<MarketingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPillar, setNewPillar] = useState("");
  const [newChannel, setNewChannel] = useState("");
  const [newFormat, setNewFormat] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("marketing_settings").select("*").limit(1).maybeSingle();
      if (data) { setSettings(data as unknown as MarketingSettings); }
      else {
        const { data: newData } = await supabase.from("marketing_settings").insert([{}]).select().single();
        if (newData) setSettings(newData as unknown as MarketingSettings);
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    await supabase.from("marketing_settings").update({
      active_pillars: settings.active_pillars,
      active_channels: settings.active_channels,
      active_formats: settings.active_formats,
      default_tone: settings.default_tone,
      recommended_frequency: settings.recommended_frequency,
      updated_at: new Date().toISOString(),
    }).eq("id", settings.id);
    toast.success("Salvo!");
    setSaving(false);
  };

  const addItem = (field: "active_pillars" | "active_channels" | "active_formats", value: string, setter: (v: string) => void) => {
    if (!value.trim() || !settings) return;
    setSettings({ ...settings, [field]: [...(settings[field] || []), value.trim()] });
    setter("");
  };

  const removeItem = (field: "active_pillars" | "active_channels" | "active_formats", value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: settings[field].filter(v => v !== value) });
  };

  if (loading) return <MkAppShell title="Configurações"><div className="text-white/30 text-center py-20">Carregando...</div></MkAppShell>;

  return (
    <MkAppShell title="Configurações Hub" sectionCode="11" sectionLabel="Hub_Settings">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-white/30">Pilares, canais e formatos do marketing</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(210,100%,55%)] text-white text-sm font-medium hover:bg-[hsl(210,100%,50%)] transition-colors disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Pillars */}
        <MkCard>
          <MkSectionHeader title="Pilares de Conteúdo" />
          <div className="flex flex-wrap gap-2 mb-3">
            {settings?.active_pillars?.map(p => (
              <span key={p} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(210,100%,55%)]/10 text-[hsl(210,100%,70%)] text-[11px] font-medium">
                {p}
                <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={() => removeItem("active_pillars", p)} />
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newPillar} onChange={e => setNewPillar(e.target.value)} placeholder="Novo pilar"
              onKeyDown={e => e.key === "Enter" && addItem("active_pillars", newPillar, setNewPillar)}
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 focus:outline-none" />
            <button onClick={() => addItem("active_pillars", newPillar, setNewPillar)} className="p-2 rounded-xl bg-white/[0.04] text-white/40 hover:text-white/70">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </MkCard>

        {/* Channels */}
        <MkCard>
          <MkSectionHeader title="Canais Ativos" />
          <div className="flex flex-wrap gap-2 mb-3">
            {settings?.active_channels?.map(c => (
              <span key={c} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(210,100%,55%)]/10 text-[hsl(210,100%,70%)] text-[11px] font-medium">
                {c}
                <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={() => removeItem("active_channels", c)} />
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newChannel} onChange={e => setNewChannel(e.target.value)} placeholder="Novo canal"
              onKeyDown={e => e.key === "Enter" && addItem("active_channels", newChannel, setNewChannel)}
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 focus:outline-none" />
            <button onClick={() => addItem("active_channels", newChannel, setNewChannel)} className="p-2 rounded-xl bg-white/[0.04] text-white/40 hover:text-white/70">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </MkCard>

        {/* Formats */}
        <MkCard>
          <MkSectionHeader title="Formatos Permitidos" />
          <div className="flex flex-wrap gap-2 mb-3">
            {settings?.active_formats?.map(f => (
              <span key={f} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(210,100%,55%)]/10 text-[hsl(210,100%,70%)] text-[11px] font-medium">
                {f}
                <X className="w-3 h-3 cursor-pointer hover:text-red-400" onClick={() => removeItem("active_formats", f)} />
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newFormat} onChange={e => setNewFormat(e.target.value)} placeholder="Novo formato"
              onKeyDown={e => e.key === "Enter" && addItem("active_formats", newFormat, setNewFormat)}
              className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 focus:outline-none" />
            <button onClick={() => addItem("active_formats", newFormat, setNewFormat)} className="p-2 rounded-xl bg-white/[0.04] text-white/40 hover:text-white/70">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </MkCard>

        {/* Tone & Frequency */}
        <MkCard>
          <MkSectionHeader title="Tom e Frequência" />
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-white/30 uppercase tracking-wider">Tom de Voz</label>
              <Textarea value={settings?.default_tone || ""} onChange={e => settings && setSettings({ ...settings, default_tone: e.target.value })}
                className="bg-white/[0.04] border-white/[0.06] text-white mt-1" rows={2} placeholder="Profissional e acessível" />
            </div>
            <div>
              <label className="text-[11px] text-white/30 uppercase tracking-wider">Frequência Recomendada</label>
              <input value={settings?.recommended_frequency || ""} onChange={e => settings && setSettings({ ...settings, recommended_frequency: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 focus:outline-none"
                placeholder="3-5 posts por semana" />
            </div>
          </div>
        </MkCard>
      </div>
    </MkAppShell>
  );
}
