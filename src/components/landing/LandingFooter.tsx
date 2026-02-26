import squadLogo from "@/assets/squad-hub-logo.png";

const marqueeItems = [
  "SQUAD HUB",
  "·",
  "Produtora + Marketing",
  "·",
  "Tecnologia Brasileira",
  "·",
  "Preço Justo",
  "·",
  "Mentalidade Global",
  "·",
  "powered by SQUAD",
  "·",
];

export function LandingFooter() {
  const marqueeText = marqueeItems.join("  ");

  return (
    <footer className="relative z-10 border-t border-border/20">
      {/* Marquee */}
      <div className="overflow-hidden py-4 border-b border-border/8">
        <div className="marquee">
          <span className="marquee-content text-[10px] uppercase tracking-[0.3em] text-muted-foreground/30 font-light">
            {marqueeText}&nbsp;&nbsp;{marqueeText}&nbsp;&nbsp;
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={squadLogo} alt="SQUAD Hub" className="h-5 max-h-5 object-contain opacity-30" />
          <p className="text-[10px] text-muted-foreground/30 uppercase tracking-wider">
            © 2026 SQUAD HUB · Todos os direitos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
