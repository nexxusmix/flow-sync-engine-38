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
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <img
            src={squadLogo}
            alt="SQUAD Hub"
            className="h-3 max-h-3 object-contain"
          />
        </motion.div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/login')}
            variant="outline"
            className="gap-2 border-border/50 hover:border-foreground/30 hover-invert"
          >
            Entrar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.nav>
  );
}
