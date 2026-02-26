import squadLogo from "@/assets/squad-hub-logo.png";

const marqueeItems = [
  "SQUAD HUB",
  "•",
  "Produtora + Marketing",
  "•",
  "Tecnologia Brasileira",
  "•",
  "Preço Justo",
  "•",
  "Mentalidade Global",
  "•",
  "powered by SQUAD",
  "•",
];

export function LandingFooter() {
  const marqueeText = marqueeItems.join("  ");

  return (
    <footer className="relative z-10 border-t border-border/30">
      {/* Marquee */}
      <div className="overflow-hidden py-4 border-b border-border/10">
        <div className="marquee">
          <span className="marquee-content text-xs uppercase tracking-[0.3em] text-muted-foreground/40 font-light">
            {marqueeText}&nbsp;&nbsp;{marqueeText}&nbsp;&nbsp;
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={squadLogo} alt="SQUAD Hub" className="h-6 max-h-6 object-contain opacity-40" />
          <p className="text-xs text-muted-foreground/40">
            © 2026 SQUAD HUB · Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
