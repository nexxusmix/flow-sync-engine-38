import { motion } from "framer-motion";
import squadLogo from "@/assets/squad-hub-logo.png";

export function LandingFooter() {
  return (
    <footer className="relative z-10 px-6 md:px-12 py-10 border-t border-border/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <img src={squadLogo} alt="SQUAD Hub" className="h-8 max-h-8 object-contain opacity-50" />
          </motion.div>

          <div className="text-center md:text-right">
            <p className="text-sm text-foreground/60 mb-1">
              Produtora + Marketing em um só lugar.
            </p>
            <p className="text-xs text-muted-foreground">
              © 2026 HUB · Tecnologia Brasileira · Preço Justo · Mentalidade Global
            </p>
            <p className="text-[10px] text-muted-foreground/40 mt-1">
              powered by SQUAD
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
