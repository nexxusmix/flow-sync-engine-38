import squadLogo from "@/assets/squad-hub-logo.png";

const marqueeItems = [
  "SQUAD HUB",
  "·",
  "Sistema Operacional para Agências",
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

const productLinks = [
  { label: "Produto", id: "produto" },
  { label: "Benefícios", id: "beneficios" },
  { label: "Como Funciona", id: "como-funciona" },
  { label: "Para Quem", id: "para-quem" },
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

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <img src={squadLogo} alt="SQUAD Hub" className="h-4 max-h-4 object-contain opacity-50" />
            <p className="text-xs text-muted-foreground/40 leading-relaxed max-w-xs">
              A plataforma que transforma agências em operações centralizadas, automatizadas e escaláveis.
            </p>
          </div>

          {/* Product links */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium mb-4">Produto</p>
            <div className="flex flex-col gap-2.5">
              {productLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" })}
                  className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors text-left"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium mb-4">Legal</p>
            <div className="flex flex-col gap-2.5">
              <span className="text-xs text-muted-foreground/40">Política de Privacidade</span>
              <span className="text-xs text-muted-foreground/40">Termos de Uso</span>
              <span className="text-xs text-muted-foreground/40">Contato</span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border/10">
          <p className="text-[10px] text-muted-foreground/30 uppercase tracking-wider text-center">
            © 2026 SQUAD HUB · Todos os direitos reservados · Tecnologia brasileira com mentalidade global
          </p>
        </div>
      </div>
    </footer>
  );
}
