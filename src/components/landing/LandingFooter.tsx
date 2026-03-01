import squadLogo from "@/assets/squad-hub-logo.png";

const marqueeItems = [
  "SQUAD HUB",
  "·",
  "Hub Criativo Completo",
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

const links = [
  { label: "Módulos", id: "solucao" },
  { label: "Planos", id: "planos" },
  { label: "FAQ", id: "faq" },
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

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src={squadLogo} alt="SQUAD Hub" className="h-4 max-h-4 object-contain opacity-40" />
            <p className="text-[10px] text-muted-foreground/30 uppercase tracking-wider">
              © 2026 SQUAD HUB · Todos os direitos reservados
            </p>
          </div>

          <div className="flex items-center gap-6">
            {links.map((link) => (
              <button
                key={link.id}
                onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" })}
                className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
