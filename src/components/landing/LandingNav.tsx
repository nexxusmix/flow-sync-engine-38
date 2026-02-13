import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import squadLogo from "@/assets/squad-hub-logo.png";
import { useRef } from "react";

export function LandingNav() {
  const navigate = useNavigate();
  const logoRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), { stiffness: 200, damping: 20 });

  const handleLogoMouseMove = (e: React.MouseEvent) => {
    if (!logoRef.current) return;
    const rect = logoRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLogoMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 glass-nav"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-center justify-between px-6 md:px-12 py-4 max-w-7xl mx-auto">
        <motion.div
          ref={logoRef}
          className="flex items-center gap-3 relative"
          onMouseMove={handleLogoMouseMove}
          onMouseLeave={handleLogoMouseLeave}
          style={{
            perspective: 600,
            transformStyle: "preserve-3d",
          }}
          initial={{ opacity: 0, filter: "blur(16px)", scale: 0.6 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Glow layer behind logo */}
          <motion.div
            className="absolute inset-0 -m-2 rounded-xl pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.15), transparent 70%)",
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.img
            src={squadLogo}
            alt="SQUAD Hub"
            className="h-3 max-h-3 object-contain relative z-10 drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
            style={{
              rotateX,
              rotateY,
              transformStyle: "preserve-3d",
            }}
            whileHover={{
              scale: 1.15,
              filter: "drop-shadow(0 0 16px hsl(var(--primary)/0.6)) brightness(1.2)",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        </motion.div>

        <div className="flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="gap-2 neon-button border-primary/30 hover:border-primary/60 hover:bg-primary/10"
            >
              Entrar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}
