import { Sparkles, Settings, ArrowUpRight, X, Instagram, Dribbble } from "lucide-react";
import { Link } from "react-router-dom";

// Service Pill Component
function ServicePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-transparent text-sm text-foreground hover:border-muted-foreground/50 transition-colors cursor-pointer">
      {children}
    </span>
  );
}

// Experience Item Component
interface ExperienceItemProps {
  role: string;
  type: string;
  company: string;
  period: string;
}

function ExperienceItem({ role, type, company, period }: ExperienceItemProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{role}</p>
        <p className="text-xs text-muted-foreground">{type}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-foreground">{company}</p>
        <p className="text-xs text-muted-foreground">{period}</p>
      </div>
    </div>
  );
}

// Social Icon Button
function SocialIcon({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex items-center justify-center w-12 h-12 rounded-full border border-border bg-transparent hover:border-muted-foreground/50 transition-colors">
      {children}
    </button>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="font-semibold text-foreground">SQUAD Hub</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <Link to="/pipeline" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pipeline</Link>
          <Link to="/propostas" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Propostas</Link>
          <Link to="/contratos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contratos</Link>
          <Link to="/financeiro" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Financeiro</Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/configuracoes" className="p-2 rounded-lg hover:bg-card transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-transparent hover:bg-card transition-colors">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Novo Projeto</span>
          </button>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="px-6 py-8 max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-card border border-border overflow-hidden flex items-center justify-center">
              <span className="text-2xl font-semibold text-foreground">JS</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">João Silva</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-xs uppercase tracking-wider text-primary">Disponível para projetos</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <SocialIcon><X className="h-4 w-4 text-muted-foreground" /></SocialIcon>
            <SocialIcon><Instagram className="h-4 w-4 text-muted-foreground" /></SocialIcon>
            <SocialIcon><Dribbble className="h-4 w-4 text-muted-foreground" /></SocialIcon>
            <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-border bg-card hover:border-muted-foreground/50 transition-colors ml-2">
              <span className="text-sm font-medium">Connect with me</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Bento Grid - Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* About Card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Sobre</span>
            <p className="text-foreground mt-4 leading-relaxed">
              Sou o João Silva, produtor audiovisual de São Paulo, Brasil. Especializado em combinar visão criativa com execução técnica impecável para criar experiências visuais excepcionais.
            </p>
            <p className="text-sm text-muted-foreground mt-6">
              Produtor Audiovisual Baseado em São Paulo.
            </p>
          </div>
          
          {/* Services Card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Serviços</span>
            <div className="flex flex-wrap gap-2 mt-4">
              <ServicePill>Filme Institucional</ServicePill>
              <ServicePill>Reels</ServicePill>
              <ServicePill>Documentário</ServicePill>
              <ServicePill>Evento</ServicePill>
              <ServicePill>Drone</ServicePill>
              <ServicePill>Edição</ServicePill>
            </div>
          </div>
          
          {/* Experience Card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Experiência</span>
            <div className="mt-4">
              <ExperienceItem
                role="Freelance"
                type="Produtor Sênior"
                company="Studio Visual"
                period="2022 - Presente"
              />
              <ExperienceItem
                role="Diretor de Fotografia"
                type="Cinegrafista"
                company="Agência Motion"
                period="2020 - 2022"
              />
              <ExperienceItem
                role="Editor de Vídeo"
                type="Pós-Produção"
                company="CreativeHouse"
                period="2018 - 2020"
              />
            </div>
          </div>
        </div>
        
        {/* Bento Grid - Row 2: Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project Card 1 */}
          <div className="relative rounded-2xl border border-border overflow-hidden h-80 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-secondary"></div>
            {/* Wave pattern overlay */}
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="waves" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
                    <path d="M0 10 Q25 0 50 10 T100 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#waves)"/>
              </svg>
            </div>
            <div className="absolute bottom-6 left-6 z-10">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Filme Institucional</span>
              <h3 className="text-2xl font-semibold text-foreground mt-1">Incorporadora Vista Mar</h3>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="h-5 w-5 text-foreground" />
            </div>
          </div>
          
          {/* Project Card 2 */}
          <div className="relative rounded-2xl border border-border overflow-hidden h-80 group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-card via-secondary/50 to-card"></div>
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                    <rect width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)"/>
              </svg>
            </div>
            <div className="absolute bottom-6 left-6 z-10">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Pacote Reels</span>
              <h3 className="text-2xl font-semibold text-foreground mt-1">Restaurante Sabor & Arte</h3>
            </div>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="h-5 w-5 text-foreground" />
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="px-6 py-6 border-t border-border mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-card border border-border">
              <Sparkles className="h-4 w-4 text-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">SQUAD Hub</span>
          </div>
          
          <p className="text-sm text-muted-foreground">© 2024 SQUAD Hub. Crafted with Precision.</p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Política de Privacidade</a>
            <a href="#" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Termos de Uso</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
