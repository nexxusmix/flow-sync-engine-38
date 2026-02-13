import { motion } from "framer-motion";

interface MkEmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function MkEmptyState({ icon, title, description, action }: MkEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-[hsl(210,100%,55%)]/10 flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-2xl text-[hsl(210,100%,65%)]">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-white/70 mb-1">{title}</h3>
      <p className="text-sm text-white/30 max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 rounded-xl bg-[hsl(210,100%,55%)] text-white text-sm font-medium hover:bg-[hsl(210,100%,50%)] transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
