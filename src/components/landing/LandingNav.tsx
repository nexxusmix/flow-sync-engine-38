import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import squadLogo from "@/assets/squad-hub-logo.png";

export function LandingNav() {
  const navigate = useNavigate();

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 glass-nav"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between px-6 md:px-12 py-4 max-w-7xl mx-auto">
        <img
          src={squadLogo}
          alt="SQUAD Hub"
          className="h-3 max-h-3 object-contain"
        />

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            className="gap-2 border-border/50 hover:border-foreground/30 hover-invert text-xs uppercase tracking-wider"
          >
            Entrar
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
