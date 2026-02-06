import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Zap, Users, BarChart3, Shield } from "lucide-react";
import squadLogo from "@/assets/squad-hub-logo.png";
import {
  ParticlesBackground,
  AnimatedGradientOrbs,
  CyberpunkGrid,
  NeonTitle,
  AnimatedCounter,
  FloatingCard,
} from "@/components/landing";

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const features = [
    { icon: Users, title: "CRM Integrado", description: "Gerencie leads e clientes com pipeline visual" },
    { icon: BarChart3, title: "Projetos & Entregas", description: "Kanban, timeline e portal do cliente" },
    { icon: Shield, title: "Propostas & Contratos", description: "Crie, envie e assine digitalmente" },
    { icon: Zap, title: "IA Integrada", description: "Gere roteiros, legendas e ideias com IA" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden overflow-y-auto">
      {/* Background Effects */}
      <ParticlesBackground />
      <AnimatedGradientOrbs />
      <CyberpunkGrid />
      
      {/* Grain Overlay */}
      <div className="grain" />

      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 glass-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="flex items-center justify-between px-6 md:px-12 py-4">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <img src={squadLogo} alt="SQUAD Hub" className="h-10 max-h-10 object-contain" />
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
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
      </motion.nav>

      {/* Hero Section */}
      <motion.section 
        className="relative z-10 px-6 md:px-12 pt-32 pb-12 md:pt-40 md:pb-24 min-h-screen flex items-center"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              {/* Animated Badge */}
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 neon-badge"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Sistema completo para produtoras</span>
              </motion.div>
              
              {/* Neon Title */}
              <NeonTitle 
                text="Gerencie sua produtora com inteligência"
                highlightWord="produtora"
              />
              
              {/* Description */}
              <motion.p 
                className="text-lg text-muted-foreground max-w-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                CRM, projetos, propostas, contratos, financeiro, marketing e muito mais. 
                Tudo integrado em uma única plataforma com IA.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/login')} 
                    className="gap-2 neon-button bg-primary hover:bg-primary/90"
                  >
                    Começar Agora
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="gap-2 border-border/50 hover:border-primary/30 hover:bg-primary/5"
                  >
                    <Play className="w-4 h-4" />
                    Ver Demo
                  </Button>
                </motion.div>
              </motion.div>

              {/* Animated Stats */}
              <motion.div 
                className="flex gap-8 pt-8 border-t border-border/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                <div>
                  <p className="text-3xl font-light text-foreground">
                    +<AnimatedCounter value={500} />
                  </p>
                  <p className="text-sm text-muted-foreground">Projetos gerenciados</p>
                </div>
                <div>
                  <p className="text-3xl font-light text-foreground">
                    R$ <AnimatedCounter value={2000000} suffix="+" />
                  </p>
                  <p className="text-sm text-muted-foreground">Em propostas</p>
                </div>
                <div>
                  <p className="text-3xl font-light text-foreground">
                    <AnimatedCounter value={98} suffix="%" />
                  </p>
                  <p className="text-sm text-muted-foreground">Satisfação</p>
                </div>
              </motion.div>
            </div>

            {/* Floating Video */}
            <motion.div 
              className="relative floating-video"
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              style={{ perspective: '1000px' }}
            >
              <div className="video-aura" />
              
              <div className="aspect-video rounded-2xl overflow-hidden border border-border/30 shadow-2xl bg-black relative">
                <video
                  src="/videos/hero-demo.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Video Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
              </div>
              
              {/* Floating Elements Around Video */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-primary/20 blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              <motion.div
                className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-primary/15 blur-2xl"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              />
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
              Tudo que você precisa em <span className="text-primary neon-text">um só lugar</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Do primeiro contato até a entrega final, o SQUAD Hub acompanha toda a jornada.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <FloatingCard
                key={i}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-6">
            Pronto para <span className="text-primary neon-text">transformar</span> sua operação?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a outras produtoras que já usam o SQUAD Hub para escalar seus negócios.
          </p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              onClick={() => navigate('/login')} 
              className="gap-2 neon-button bg-primary hover:bg-primary/90"
            >
              Começar Gratuitamente
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-8 border-t border-border/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <img src={squadLogo} alt="SQUAD Hub" className="h-8 max-h-8 object-contain opacity-50" />
          </motion.div>
          <p className="text-sm text-muted-foreground">
            © 2025 SQUAD Hub. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
