import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import squadLogo from "@/assets/squad-hub-logo.png";

const navLinks = [
  { label: "Produto", id: "produto" },
  { label: "Benefícios", id: "beneficios" },
  { label: "Como Funciona", id: "como-funciona" },
  { label: "Para Quem", id: "para-quem" },
  { label: "Planos", id: "planos" },
  { label: "FAQ", id: "faq" },
];

export function LandingNav() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 50));

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "glass-nav py-2 md:py-3" : "py-3 md:py-5"
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between px-4 md:px-12 max-w-7xl mx-auto">
          <motion.img
            src={squadLogo}
            alt="SQUAD Hub"
            className="h-3 md:h-3.5 max-h-3.5 object-contain"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop action buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-xs uppercase tracking-wider h-9 px-4 text-muted-foreground hover:text-foreground"
            >
              Login
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/login?tab=signup")}
              className="text-xs uppercase tracking-wider h-9 px-4 border-border/50 hover:border-primary/30 hover:bg-primary/5"
            >
              Criar Conta
            </Button>
            <Button
              onClick={() => navigate("/login")}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs uppercase tracking-wider h-9 px-5 hover-invert"
            >
              Agendar Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Mobile: CTA + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate("/login")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px] uppercase tracking-wider h-8 px-3 hover-invert"
            >
              Demo
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-foreground/70 hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/98 backdrop-blur-xl pt-20 px-6 md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((item, i) => (
                <motion.button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="text-left text-lg font-light text-foreground/80 py-3 border-b border-border/10 uppercase tracking-wider"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
            <div className="flex flex-col gap-3 mt-8">
              <Button
                onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground hover-invert"
              >
                Agendar Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => { setMobileMenuOpen(false); navigate("/login"); }}
                className="w-full h-12 border-border/50"
              >
                Login
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setMobileMenuOpen(false); navigate("/login?tab=signup"); }}
                className="w-full h-12"
              >
                Criar Conta
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
