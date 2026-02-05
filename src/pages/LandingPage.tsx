import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Zap, Users, BarChart3, Shield } from "lucide-react";
import squadLogo from "@/assets/squad-hub-logo.png";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Grain Overlay */}
      <div className="grain" />
      
      {/* Background Blobs */}
      <div className="blob w-[1200px] h-[1200px] bg-primary top-[-40%] left-[-20%]" />
      <div className="blob w-[800px] h-[800px] bg-white bottom-[-20%] right-[-10%] opacity-5" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <img src={squadLogo} alt="SQUAD Hub" className="h-10 w-auto" />
        </div>
        <Button onClick={() => navigate('/login')} variant="outline" className="gap-2">
          Entrar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 md:px-12 py-12 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Sistema completo para produtoras</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-light text-foreground tracking-tight leading-tight">
                Gerencie sua <span className="text-primary font-normal">produtora</span> com inteligência
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                CRM, projetos, propostas, contratos, financeiro, marketing e muito mais. 
                Tudo integrado em uma única plataforma com IA.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate('/login')} className="gap-2">
                  Começar Agora
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Play className="w-4 h-4" />
                  Ver Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-8 border-t border-border/50">
                <div>
                  <p className="text-3xl font-light text-foreground">+500</p>
                  <p className="text-sm text-muted-foreground">Projetos gerenciados</p>
                </div>
                <div>
                  <p className="text-3xl font-light text-foreground">R$ 2M+</p>
                  <p className="text-sm text-muted-foreground">Em propostas</p>
                </div>
                <div>
                  <p className="text-3xl font-light text-foreground">98%</p>
                  <p className="text-sm text-muted-foreground">Satisfação</p>
                </div>
              </div>
            </div>

            {/* Video */}
            <div className="relative">
              <div className="aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-black">
                <iframe
                  src="https://www.youtube.com/embed/_g9NrlfizbQ?si=N8AQvQTuVaMRN9j9&controls=0"
                  title="SQUAD Hub Demo"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 md:px-12 py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Do primeiro contato até a entrega final, o SQUAD Hub acompanha toda a jornada.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: "CRM Integrado", description: "Gerencie leads e clientes com pipeline visual" },
              { icon: BarChart3, title: "Projetos & Entregas", description: "Kanban, timeline e portal do cliente" },
              { icon: Shield, title: "Propostas & Contratos", description: "Crie, envie e assine digitalmente" },
              { icon: Zap, title: "IA Integrada", description: "Gere roteiros, legendas e ideias com IA" },
            ].map((feature, i) => (
              <div key={i} className="glass-card p-6 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 md:px-12 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light text-foreground mb-6">
            Pronto para transformar sua operação?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a outras produtoras que já usam o SQUAD Hub para escalar seus negócios.
          </p>
          <Button size="lg" onClick={() => navigate('/login')} className="gap-2">
            Começar Gratuitamente
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 md:px-12 py-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={squadLogo} alt="SQUAD Hub" className="h-8 w-auto opacity-50" />
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 SQUAD Hub. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
