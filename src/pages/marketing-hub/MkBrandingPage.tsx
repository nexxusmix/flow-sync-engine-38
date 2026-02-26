import { useEffect, useState } from "react";
import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { MkCard, MkEmptyState, MkSectionHeader } from "@/components/marketing-hub/mk-ui";
import { supabase } from "@/integrations/supabase/client";
import { BrandKit, ColorItem, FontItem } from "@/types/marketing";
import { motion } from "framer-motion";
import { Plus, Palette, Type, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function MkBrandingPage() {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("brand_kits").select("*").order("created_at", { ascending: false });
      if (data) setKits(data as unknown as BrandKit[]);
      setLoading(false);
    })();
  }, []);

  const createKit = async () => {
    const { data, error } = await supabase.from("brand_kits").insert([{ name: "Novo Brand Kit" }]).select().single();
    if (!error && data) {
      setKits(prev => [data as unknown as BrandKit, ...prev]);
      toast.success("Brand Kit criado!");
    }
  };

  if (loading) return <MkAppShell title="Branding Studio"><div className="text-white/30 text-center py-20">Carregando...</div></MkAppShell>;

  return (
    <MkAppShell title="Branding Studio" sectionCode="06" sectionLabel="Brand_Identity">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-white/30">Gerencie identidades visuais e brand kits</p>
        </div>
        <button onClick={createKit} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(210,100%,55%)] text-white text-sm font-medium hover:bg-[hsl(210,100%,50%)] transition-colors">
          <Plus className="w-4 h-4" /> Novo Kit
        </button>
      </div>

      {kits.length === 0 ? (
        <MkEmptyState icon="palette" title="Nenhum Brand Kit" description="Crie um Brand Kit para centralizar identidade visual." action={{ label: "Criar Kit", onClick: createKit }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {kits.map((kit, i) => (
            <motion.div key={kit.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.05 }}>
              <BrandKitCard kit={kit} />
            </motion.div>
          ))}
        </div>
      )}
    </MkAppShell>
  );
}

function BrandKitCard({ kit }: { kit: BrandKit }) {
  const colors = (kit.colors || []) as ColorItem[];
  const fonts = (kit.fonts || []) as FontItem[];

  return (
    <MkCard hover>
      <div className="flex items-center gap-3 mb-4">
        {kit.logo_url ? (
          <img src={kit.logo_url} alt="" className="w-10 h-10 rounded-lg object-contain bg-white/5" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[hsl(210,100%,55%)]/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-[hsl(210,100%,65%)]" />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-white/85">{kit.name}</h3>
          {kit.tone_of_voice && <p className="text-[11px] text-white/30 line-clamp-1">{kit.tone_of_voice}</p>}
        </div>
      </div>

      {/* Colors */}
      {colors.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          {colors.slice(0, 8).map((c, i) => (
            <div key={i} className="w-7 h-7 rounded-lg border border-white/10" style={{ backgroundColor: c.hex }} title={c.name} />
          ))}
        </div>
      )}

      {/* Fonts */}
      {fonts.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-white/30">
          <Type className="w-3 h-3" />
          {fonts.map(f => f.name).join(", ")}
        </div>
      )}

      {/* Tone */}
      {kit.tone_of_voice && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-white/25">
          <MessageSquare className="w-3 h-3" />
          <span className="truncate">{kit.tone_of_voice}</span>
        </div>
      )}
    </MkCard>
  );
}
