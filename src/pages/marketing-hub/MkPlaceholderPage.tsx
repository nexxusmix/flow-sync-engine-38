import { MkAppShell } from "@/components/marketing-hub/MkAppShell";
import { motion } from "framer-motion";

export default function MkPlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <MkAppShell title={title}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[hsl(210,100%,55%)]/10 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-3xl text-[hsl(210,100%,65%)]">construction</span>
        </div>
        <h2 className="text-2xl font-bold text-white/80 mb-2">{title}</h2>
        <p className="text-sm text-white/30 max-w-md">
          {description || "Esta seção do Marketing Hub está em desenvolvimento. Em breve estará disponível."}
        </p>
      </motion.div>
    </MkAppShell>
  );
}
