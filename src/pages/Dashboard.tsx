import { ArrowUpRight, Sparkles, FileText, FileSignature, Wallet, TrendingUp, ChevronDown, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

// Filter Pills Component
function FilterPills() {
  const filters = ["Visão Geral", "Pipeline", "Propostas", "Contratos", "Financeiro"];
  
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter, index) => (
        <button
          key={filter}
          className={cn(
            "polo-pill",
            index === 0 && "polo-pill-active"
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

// Featured Card Component
function FeaturedCard() {
  return (
    <div className="polo-card group cursor-pointer relative overflow-hidden lg:row-span-2">
      <div className="absolute top-4 right-4">
        <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <span className="polo-label">Featured</span>
      
      <div className="mt-auto pt-16">
        <h2 className="text-2xl font-semibold tracking-tight">Visão do Negócio</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Métricas e KPIs em tempo real
        </p>
        <div className="polo-pill mt-4 w-fit">
          Dashboard
        </div>
      </div>
    </div>
  );
}

// Metric Card Polo Style
interface MetricCardPoloProps {
  label: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  size?: "default" | "large";
}

function MetricCardPolo({ label, title, value, subtitle, icon: Icon, trend, size = "default" }: MetricCardPoloProps) {
  return (
    <div className="polo-card group cursor-pointer h-full">
      <div className="flex items-start justify-between">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-secondary border border-border">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="mt-4">
        <span className="polo-label">{label}</span>
        <p className={cn(
          "font-semibold tracking-tight mt-2",
          size === "large" ? "text-4xl" : "text-3xl"
        )}>{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
        {trend && (
          <p className={cn(
            "text-sm font-medium mt-2",
            trend.isPositive ? "text-success" : "text-destructive"
          )}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% vs mês anterior
          </p>
        )}
      </div>
    </div>
  );
}

// Info Card Component
interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  tag: string;
}

function InfoCard({ icon: Icon, title, subtitle, tag }: InfoCardProps) {
  return (
    <div className="polo-card group cursor-pointer h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-secondary border border-border">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      <div className="mt-auto">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        <div className="polo-pill mt-4 w-fit text-xs">
          {tag}
        </div>
      </div>
    </div>
  );
}

// Activity Item Component
interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
}

function ActivityItem({ title, description, time }: ActivityItemProps) {
  return (
    <div className="group flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer">
      <div>
        <p className="text-sm font-medium group-hover:text-primary transition-colors">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{time}</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">SQUAD Hub</span>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Sistema completo de gestão para produtores audiovisuais — propostas, contratos e financeiro.
        </p>
        
        {/* Archive Filter */}
        <div className="mb-4">
          <span className="polo-label mb-3 block">Painel de Controle</span>
          <FilterPills />
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid gap-4 lg:grid-cols-4 lg:grid-rows-[auto_auto_auto]">
        
        {/* Section: Métricas Vol. 01 */}
        <div className="lg:col-span-4 mb-2">
          <span className="polo-label">Métricas — Vol. 01</span>
        </div>
        
        {/* Featured Card */}
        <div className="lg:col-span-2 lg:row-span-2">
          <FeaturedCard />
        </div>
        
        {/* Metric Cards */}
        <MetricCardPolo
          label="Propostas"
          title="Aguardando resposta"
          value={5}
          icon={FileText}
        />
        <MetricCardPolo
          label="Contratos"
          title="Aguardando assinatura"
          value={3}
          icon={FileSignature}
        />
        <MetricCardPolo
          label="A Receber"
          title="Próximos 30 dias"
          value="R$ 32.5k"
          icon={Wallet}
        />
        <MetricCardPolo
          label="Receita"
          title="Este mês"
          value="R$ 48k"
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
        />

        {/* Section: Operações Vol. 02 */}
        <div className="lg:col-span-4 mt-4 mb-2">
          <span className="polo-label">Operações — Vol. 02</span>
        </div>
        
        {/* Info Cards */}
        <InfoCard
          icon={Rocket}
          title="Pipeline Ativo"
          subtitle="12 leads em negociação"
          tag="Pipeline"
        />
        <InfoCard
          icon={FileText}
          title="Propostas do Mês"
          subtitle="Taxa de conversão 42%"
          tag="Propostas"
        />
        
        {/* Activity Section */}
        <div className="lg:col-span-2 polo-card">
          <div className="flex items-center justify-between mb-4">
            <span className="polo-label">Atividade Recente</span>
            <button className="polo-pill text-xs py-1">
              Ver Mais <ChevronDown className="h-3 w-3 ml-1" />
            </button>
          </div>
          
          <div>
            <ActivityItem
              title="Pagamento recebido"
              description="Incorporadora Vista Mar - R$ 8.000"
              time="2h"
            />
            <ActivityItem
              title="Contrato assinado"
              description="Restaurante Sabor & Arte"
              time="5h"
            />
            <ActivityItem
              title="Proposta enviada"
              description="Clínica Estética Premium"
              time="1d"
            />
            <ActivityItem
              title="Negócio fechado"
              description="Arquiteto João Silva"
              time="1d"
            />
          </div>
        </div>

        {/* Section: Urgente Vol. 03 */}
        <div className="lg:col-span-4 mt-4 mb-2">
          <span className="polo-label">Atenção — Vol. 03</span>
        </div>
        
        {/* Urgent Actions */}
        <div className="lg:col-span-2 polo-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              <span className="polo-label">Ações Urgentes</span>
            </div>
            <span className="text-xs text-muted-foreground">3 pendentes</span>
          </div>
          
          <div className="space-y-2">
            <div className="group flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-medium">Proposta sem resposta há 5 dias</p>
                <p className="text-xs text-muted-foreground">Incorporadora Vista Mar</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="group flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-medium">Contrato aguardando há 3 dias</p>
                <p className="text-xs text-muted-foreground">Restaurante Sabor & Arte</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="group flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary cursor-pointer transition-colors">
              <div>
                <p className="text-sm font-medium">Cobrança atrasada - R$ 4.500</p>
                <p className="text-xs text-muted-foreground">Clínica Estética Premium</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="lg:col-span-2 polo-card">
          <span className="polo-label">Resumo do Mês</span>
          
          <div className="mt-4 space-y-0 divide-y divide-border">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Propostas enviadas</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">12</span>
                <span className="text-xs text-success">+3</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Taxa de conversão</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">42%</span>
                <span className="text-xs text-success">+8%</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Ticket médio</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">R$ 6.200</span>
                <span className="text-xs text-destructive">-5%</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Tempo médio fechamento</span>
              <span className="text-sm font-medium">8 dias</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          © 2024 SQUAD Hub. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Ajuda</span>
          <span className="text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Configurações</span>
        </div>
      </div>
    </div>
  );
}
