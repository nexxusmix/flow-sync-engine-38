import { useNavigate } from "react-router-dom";
import { useProductContext, ProductModule } from "@/hooks/useProductContext";
import { motion } from "framer-motion";
import squadHubLogo from "@/assets/squad-hub-logo.png";

const modules: { id: ProductModule; title: string; description: string; icon: string; route: string; gradient: string }[] = [
  {
    id: 'production',
    title: 'Produtora Audiovisual',
    description: 'Projetos, roteiros, captação, edição, entregas e portal do cliente.',
    icon: 'movie_edit',
    route: '/',
    gradient: 'from-violet-500/20 to-purple-600/20',
  },
  {
    id: 'marketing',
    title: 'Marketing & Social Media',
    description: 'Calendário editorial, campanhas, design, branding e métricas.',
    icon: 'perm_media',
    route: '/m',
    gradient: 'from-sky-500/20 to-blue-600/20',
  },
  {
    id: 'full',
    title: 'Agency Suite (Completo)',
    description: 'Acesso total a todos os módulos. Produtora + Marketing unificados.',
    icon: 'hub',
    route: '/',
    gradient: 'from-primary/20 to-emerald-500/20',
  },
];

export default function PlatformSelectorPage() {
  const navigate = useNavigate();
  const { setActiveModule } = useProductContext();

  const handleSelect = (mod: typeof modules[0]) => {
    setActiveModule(mod.id);
    navigate(mod.route, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <img src={squadHubLogo} alt="SQUAD Hub" className="h-10 mx-auto mb-6" />
        <h1 className="text-3xl font-light text-foreground tracking-tight">
          Escolha sua Área
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Selecione o módulo para começar. Você pode trocar a qualquer momento.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        {modules.map((mod, i) => (
          <motion.button
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => handleSelect(mod)}
            className={`group relative p-8 rounded-2xl border border-white/[0.06] bg-gradient-to-br ${mod.gradient} backdrop-blur-sm hover:border-primary/30 transition-all duration-300 text-left`}
          >
            <span className="material-symbols-outlined text-4xl text-primary mb-4 block">
              {mod.icon}
            </span>
            <h2 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
              {mod.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {mod.description}
            </p>
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/20 transition-all duration-300" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
