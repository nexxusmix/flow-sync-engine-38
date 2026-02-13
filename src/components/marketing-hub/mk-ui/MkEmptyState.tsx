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
      <div className="w-14 h-14 rounded-lg border border-[rgba(0,156,202,0.15)] flex items-center justify-center mb-5 bg-[rgba(0,156,202,0.03)]">
        <span className="material-symbols-outlined text-2xl text-[hsl(195,100%,50%)]">{icon}</span>
      </div>
      <h3 className="text-lg font-light text-white/50 mb-1">{title}</h3>
      <p className="text-sm text-white/20 max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 rounded border border-[rgba(0,156,202,0.3)] text-[hsl(195,100%,55%)] text-sm font-normal hover:bg-[rgba(0,156,202,0.08)] transition-colors tracking-wide"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
