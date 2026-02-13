import { useProductContext, ProductModule } from "@/hooks/useProductContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const moduleOptions: { id: ProductModule; label: string; icon: string; shortLabel: string }[] = [
  { id: 'production', label: 'Produtora', icon: 'movie_edit', shortLabel: 'P' },
  { id: 'marketing', label: 'Marketing', icon: 'perm_media', shortLabel: 'M' },
  { id: 'full', label: 'Completo', icon: 'hub', shortLabel: 'A' },
];

interface ModuleSwitcherProps {
  collapsed: boolean;
}

export function ModuleSwitcher({ collapsed }: ModuleSwitcherProps) {
  const { activeModule, setActiveModule } = useProductContext();
  const navigate = useNavigate();

  const handleSwitch = (mod: ProductModule) => {
    setActiveModule(mod);
    if (mod === 'marketing') {
      navigate('/marketing');
    } else {
      navigate('/');
    }
  };

  if (collapsed) {
    // Show active module icon only when collapsed
    const active = moduleOptions.find(m => m.id === activeModule);
    return (
      <div className="px-2 py-2">
        <button
          onClick={() => {
            // Cycle through modules
            const idx = moduleOptions.findIndex(m => m.id === activeModule);
            const next = moduleOptions[(idx + 1) % moduleOptions.length];
            handleSwitch(next.id);
          }}
          className="w-full flex items-center justify-center h-9 rounded-lg bg-primary/10 text-primary"
          title={`Módulo: ${active?.label}`}
        >
          <span className="material-symbols-outlined text-lg">{active?.icon}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04]">
        {moduleOptions.map(mod => (
          <button
            key={mod.id}
            onClick={() => handleSwitch(mod.id)}
            className={cn(
              "relative flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-light uppercase tracking-wider transition-all",
              activeModule === mod.id
                ? "text-primary"
                : "text-muted-foreground/60 hover:text-foreground"
            )}
          >
            {activeModule === mod.id && (
              <motion.div
                layoutId="module-indicator"
                className="absolute inset-0 bg-primary/10 rounded-md"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="material-symbols-outlined text-sm relative z-10">{mod.icon}</span>
            <span className="relative z-10 hidden xl:inline">{mod.shortLabel === 'A' ? 'All' : mod.shortLabel}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
