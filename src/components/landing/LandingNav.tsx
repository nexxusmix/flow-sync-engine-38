import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import squadLogo from "@/assets/squad-hub-logo.png";

export function LandingNav() {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 50));

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-nav py-3" : "py-5"
      }`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto">
        <motion.img
          src={squadLogo}
          alt="SQUAD Hub"
          className="h-3.5 max-h-3.5 object-contain"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Produto", id: "produto" },
            { label: "Benefícios", id: "beneficios" },
            { label: "Como Funciona", id: "como-funciona" },
            { label: "Para Quem", id: "para-quem" },
            { label: "Planos", id: "planos" },
            { label: "FAQ", id: "faq" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })}
              className="text-xs uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/login")}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs uppercase tracking-wider h-9 px-5 hover-invert"
          >
            Agendar Demo
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
