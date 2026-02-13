import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Building2, Users, Shield, FolderKanban, DollarSign, FileText, FileSignature,
  Megaphone, Target, Plug, Bell, Palette, ScrollText, AlertTriangle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";

const settingsSections = [
  {
    id: 'workspace',
    title: 'Workspace',
    description: 'Dados da empresa, timezone, moeda e horários',
    icon: Building2,
    path: '/configuracoes/workspace',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    adminOnly: false,
  },
  {
    id: 'users',
    title: 'Usuários',
    description: 'Gerenciar usuários e acessos',
    icon: Users,
    path: '/configuracoes/usuarios',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    adminOnly: false,
  },
  {
    id: 'roles',
    title: 'Papéis e Permissões',
    description: 'Controle de acesso por módulo',
    icon: Shield,
    path: '/configuracoes/papeis',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    adminOnly: false,
  },
  {
    id: 'projects',
    title: 'Projetos',
    description: 'Etapas padrão e SLAs',
    icon: FolderKanban,
    path: '/configuracoes/projetos',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    adminOnly: false,
  },
  {
    id: 'finance',
    title: 'Financeiro',
    description: 'Categorias, métodos e regras de bloqueio',
    icon: DollarSign,
    path: '/configuracoes/financeiro',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    adminOnly: false,
  },
  {
    id: 'proposals',
    title: 'Propostas',
    description: 'Validade, textos e numeração',
    icon: FileText,
    path: '/configuracoes/propostas',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    adminOnly: false,
  },
  {
    id: 'contracts',
    title: 'Contratos',
    description: 'Templates, cláusulas e revisões',
    icon: FileSignature,
    path: '/configuracoes/contratos',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    adminOnly: false,
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Pilares, canais e formatos',
    icon: Megaphone,
    path: '/configuracoes/marketing',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    adminOnly: false,
  },
  {
    id: 'prospecting',
    title: 'Prospecção',
    description: 'Limites, canais e opt-out',
    icon: Target,
    path: '/configuracoes/prospeccao',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    adminOnly: false,
  },
  {
    id: 'integrations',
    title: 'Integrações',
    description: 'Instagram, WhatsApp, IA',
    icon: Plug,
    path: '/configuracoes/integracoes',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    adminOnly: false,
  },
  {
    id: 'notifications',
    title: 'Notificações',
    description: 'Alertas e canais',
    icon: Bell,
    path: '/configuracoes/notificacoes',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    adminOnly: false,
  },
  {
    id: 'branding',
    title: 'Branding',
    description: 'Logo, cores e assinatura',
    icon: Palette,
    path: '/configuracoes/branding',
    color: 'text-fuchsia-500',
    bgColor: 'bg-fuchsia-500/10',
    adminOnly: false,
  },
  {
    id: 'audit',
    title: 'Auditoria',
    description: 'Histórico de ações',
    icon: ScrollText,
    path: '/configuracoes/auditoria',
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    adminOnly: false,
  },
  {
    id: 'platform',
    title: 'Plataforma',
    description: 'Módulos e planos de acesso',
    icon: Building2,
    path: '/plataforma',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    adminOnly: false,
  },
  {
    id: 'danger-zone',
    title: 'Danger Zone',
    description: 'Reset e ações críticas',
    icon: AlertTriangle,
    path: '/configuracoes/danger-zone',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    adminOnly: true,
  },
];

export default function SettingsDashboard() {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();

  // Filtrar seções baseado em permissão
  const visibleSections = settingsSections.filter(section => {
    if (section.adminOnly) return isAdmin;
    return true;
  });

  return (
    <DashboardLayout title="Configurações">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-light text-foreground tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-2">
            Painel de controle do sistema. Configure comportamentos, limites e regras.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card
                key={section.id}
                className="glass-card p-5 cursor-pointer hover:border-primary/20 transition-all group"
                onClick={() => navigate(section.path)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${section.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${section.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {section.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
