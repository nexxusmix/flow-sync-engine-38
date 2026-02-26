/**
 * PipelineAIResultDialog — Dialog holográfico para resultado de geração IA
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export interface AIGeneratedContent {
  script: string;
  caption_short: string;
  caption_long: string;
  hashtags: string;
  cta: string;
}

interface PipelineAIResultDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: AIGeneratedContent | null;
}

export function PipelineAIResultDialog({ open, onOpenChange, data }: PipelineAIResultDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!data) return null;

  const sections = [
    { key: "script", label: "Roteiro", value: data.script, accent: "hsl(195,100%,50%)" },
    { key: "caption_short", label: "Legenda Curta", value: data.caption_short, accent: "hsl(45,100%,60%)" },
    { key: "caption_long", label: "Legenda Longa", value: data.caption_long, accent: "hsl(45,100%,60%)" },
    { key: "hashtags", label: "Hashtags", value: data.hashtags, accent: "hsl(280,80%,60%)" },
    { key: "cta", label: "CTA", value: data.cta, accent: "hsl(150,80%,50%)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0c] border-white/[0.08] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-medium text-white/90 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[rgba(0,156,202,0.1)] border border-[rgba(0,156,202,0.2)] flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[hsl(195,100%,50%)]" />
            </div>
            Conteúdo Gerado por IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          {sections.map(({ key, label, value }) => (
            <div key={key} className="holographic-card rounded-lg p-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[9px] text-white/25 uppercase tracking-[0.12em] font-medium">{label}</span>
                <button
                  onClick={() => copyToClipboard(value, key)}
                  className="flex items-center gap-1 text-[9px] text-white/20 hover:text-[hsl(195,100%,55%)] transition-colors"
                >
                  {copiedField === key ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedField === key ? "Copiado" : "Copiar"}
                </button>
              </div>
              <p className="text-[11px] text-white/60 whitespace-pre-wrap leading-relaxed">{value}</p>
            </div>
          ))}
        </div>

        <p className="text-[9px] text-white/15 text-center mt-3 uppercase tracking-wider">
          Conteúdo salvo automaticamente no pipeline
        </p>
      </DialogContent>
    </Dialog>
  );
}
