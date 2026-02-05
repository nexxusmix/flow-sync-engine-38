import { Sparkles, Play, Check } from "lucide-react";

export function AIChatSnippet() {
  return (
    <div className="glass-card rounded-[2rem] p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="icon-box bg-primary/20">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">SQUAD Agent Scout</span>
      </div>

      {/* Chat Messages */}
      <div className="space-y-4">
        {/* AI Message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="glass-card rounded-2xl rounded-tl-sm p-4 text-sm text-muted-foreground leading-relaxed">
            Analisei 42 empresas de arquitetura hoje. A <span className="text-foreground font-semibold">Haus Arquitetura</span> acabou de postar um projeto novo sem vídeo. O CEO é o Ricardo.
          </div>
        </div>

        {/* User Message */}
        <div className="flex gap-3 justify-end">
          <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm p-4 text-sm text-foreground">
            Gere uma abordagem de áudio para o Ricardo.
          </div>
        </div>

        {/* AI Audio Response */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="glass-card rounded-2xl rounded-tl-sm p-4 space-y-3 flex-1">
            {/* Audio Player */}
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </button>
              <div className="flex-1">
                {/* Waveform Placeholder */}
                <div className="flex items-center gap-0.5 h-8">
                  {[...Array(30)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-primary/40 rounded-full" 
                      style={{ height: `${Math.random() * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-mono">0:24</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">record_voice_over</span>
              ElevenLabs: Voz Consultor Senior
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button className="btn-primary w-full justify-center">
        <Check className="w-4 h-4" />
        Aprovar envio via WhatsApp
      </button>
    </div>
  );
}
