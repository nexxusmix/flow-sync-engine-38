import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";

// Pages
import CRMPage from "./pages/CRMPage";
import InboxPage from "./pages/InboxPage";
import ProjectsListPage from "./pages/projects/ProjectsListPage";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import ClientPortalPage from "./pages/ClientPortalPage";
import ProposalsListPage from "./pages/proposals/ProposalsListPage";
import ProposalDetailPage from "./pages/proposals/ProposalDetailPage";
import ProposalPreviewPage from "./pages/proposals/ProposalPreviewPage";
import ProposalClientPage from "./pages/proposals/ProposalClientPage";
import ContractsPage from "./pages/ContractsPage";
import ContractsListPage from "./pages/contracts/ContractsListPage";
import ContractTemplatesPage from "./pages/contracts/ContractTemplatesPage";
import ContractDetailPage from "./pages/contracts/ContractDetailPage";
import ContractPreviewPage from "./pages/contracts/ContractPreviewPage";
import ContractClientPage from "./pages/contracts/ContractClientPage";
import ContentPage from "./pages/ContentPage";
import KnowledgePage from "./pages/KnowledgePage";
import ReportsDashboard from "./pages/reports/ReportsDashboard";
import OwnerDailyReport from "./pages/reports/OwnerDailyReport";
import SalesReport from "./pages/reports/SalesReport";
import OperationsReport from "./pages/reports/OperationsReport";
import FinancialReport from "./pages/reports/FinancialReport";
import MarketingReport from "./pages/reports/MarketingReport";
import ProjectsReport from "./pages/reports/ProjectsReport";
import ClientsReport from "./pages/reports/ClientsReport";
// Settings Pages
import SettingsDashboard from "./pages/settings/SettingsDashboard";
import WorkspaceSettingsPage from "./pages/settings/WorkspaceSettingsPage";
import RolesSettingsPage from "./pages/settings/RolesSettingsPage";
import ProjectStagesSettingsPage from "./pages/settings/ProjectStagesSettingsPage";
import FinanceSettingsPage from "./pages/settings/FinanceSettingsPage";
import ProposalSettingsPage from "./pages/settings/ProposalSettingsPage";
import ContractSettingsPage from "./pages/settings/ContractSettingsPage";
import MarketingSettingsPage from "./pages/settings/MarketingSettingsPage";
import ProspectingSettingsPage from "./pages/settings/ProspectingSettingsPage";
import IntegrationsSettingsPage from "./pages/settings/IntegrationsSettingsPage";
import NotificationSettingsPage from "./pages/settings/NotificationSettingsPage";
import BrandingSettingsPage from "./pages/settings/BrandingSettingsPage";
import AuditSettingsPage from "./pages/settings/AuditSettingsPage";

// Prospecção Pages
import ProspectingPage from "./pages/prospecting/ProspectingPage";
import TargetsPage from "./pages/prospecting/TargetsPage";
import OpportunitiesPage from "./pages/prospecting/OpportunitiesPage";
import ActivitiesPage from "./pages/prospecting/ActivitiesPage";
import CadencesPage from "./pages/prospecting/CadencesPage";

// Finance Pages
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import RevenuesPage from "./pages/finance/RevenuesPage";
import ExpensesPage from "./pages/finance/ExpensesPage";
import CashflowPage from "./pages/finance/CashflowPage";
import FinanceContractsPage from "./pages/finance/ContractsPage";
import ProjectsFinancePage from "./pages/finance/ProjectsFinancePage";

// Marketing Pages
import MarketingDashboard from "./pages/marketing/MarketingDashboard";
import CalendarPage from "./pages/marketing/CalendarPage";
import IdeasPage from "./pages/marketing/IdeasPage";
import PipelinePage from "./pages/marketing/PipelinePage";
import CampaignsPage from "./pages/marketing/CampaignsPage";
import AssetsPage from "./pages/marketing/AssetsPage";
import InstagramPage from "./pages/marketing/InstagramPage";
import StudioCreativoPage from "./pages/marketing/StudioCreativoPage";
import LibraryPage from "./pages/marketing/LibraryPage";
import ContentDetailPage from "./pages/marketing/ContentDetailPage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, login } = useAuth();

  return (
    <Routes>
      <Route path="/landing" element={<LandingPage />} />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />} 
      />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/crm" element={<ProtectedRoute><CRMPage /></ProtectedRoute>} />
      <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
      {/* Projetos */}
      <Route path="/projetos" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
      <Route path="/projetos/board" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
      <Route path="/projetos/kanban" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
      <Route path="/projetos/timeline" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
      <Route path="/projetos/list" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
      <Route path="/projetos/:projectId" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
      <Route path="/projetos/:projectId/portal" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
      {/* Prospecção */}
      <Route path="/prospeccao" element={<ProtectedRoute><ProspectingPage /></ProtectedRoute>} />
      <Route path="/prospeccao/targets" element={<ProtectedRoute><TargetsPage /></ProtectedRoute>} />
      <Route path="/prospeccao/oportunidades" element={<ProtectedRoute><OpportunitiesPage /></ProtectedRoute>} />
      <Route path="/prospeccao/atividades" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
      <Route path="/prospeccao/cadencias" element={<ProtectedRoute><CadencesPage /></ProtectedRoute>} />
      <Route path="/propostas" element={<ProtectedRoute><ProposalsListPage /></ProtectedRoute>} />
      <Route path="/propostas/list" element={<ProtectedRoute><ProposalsListPage /></ProtectedRoute>} />
      <Route path="/propostas/:proposalId" element={<ProtectedRoute><ProposalDetailPage /></ProtectedRoute>} />
      <Route path="/propostas/:proposalId/preview" element={<ProtectedRoute><ProposalPreviewPage /></ProtectedRoute>} />
      <Route path="/propostas/:proposalId/client" element={<ProposalClientPage />} />
      {/* Contratos */}
      <Route path="/contratos" element={<ProtectedRoute><ContractsListPage /></ProtectedRoute>} />
      <Route path="/contratos/templates" element={<ProtectedRoute><ContractTemplatesPage /></ProtectedRoute>} />
      <Route path="/contratos/:contractId" element={<ProtectedRoute><ContractDetailPage /></ProtectedRoute>} />
      <Route path="/contratos/:contractId/preview" element={<ProtectedRoute><ContractPreviewPage /></ProtectedRoute>} />
      <Route path="/contratos/:contractId/client" element={<ContractClientPage />} />
      {/* Financeiro */}
      <Route path="/financeiro" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
      <Route path="/financeiro/caixa" element={<ProtectedRoute><CashflowPage /></ProtectedRoute>} />
      <Route path="/financeiro/receitas" element={<ProtectedRoute><RevenuesPage /></ProtectedRoute>} />
      <Route path="/financeiro/despesas" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
      <Route path="/financeiro/contratos" element={<ProtectedRoute><FinanceContractsPage /></ProtectedRoute>} />
      <Route path="/financeiro/projetos" element={<ProtectedRoute><ProjectsFinancePage /></ProtectedRoute>} />
      {/* Marketing */}
      <Route path="/marketing" element={<ProtectedRoute><MarketingDashboard /></ProtectedRoute>} />
      <Route path="/marketing/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/marketing/ideas" element={<ProtectedRoute><IdeasPage /></ProtectedRoute>} />
      <Route path="/marketing/pipeline" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
      <Route path="/marketing/content/:contentItemId" element={<ProtectedRoute><ContentDetailPage /></ProtectedRoute>} />
      <Route path="/marketing/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
      <Route path="/marketing/assets" element={<ProtectedRoute><AssetsPage /></ProtectedRoute>} />
      <Route path="/marketing/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
      <Route path="/marketing/instagram" element={<ProtectedRoute><InstagramPage /></ProtectedRoute>} />
      <Route path="/marketing/studio" element={<ProtectedRoute><StudioCreativoPage /></ProtectedRoute>} />
      <Route path="/conteudo" element={<Navigate to="/marketing" replace />} />
      <Route path="/knowledge" element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
      {/* Relatórios */}
      <Route path="/relatorios" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
      <Route path="/relatorios/dono" element={<ProtectedRoute><OwnerDailyReport /></ProtectedRoute>} />
      <Route path="/relatorios/vendas" element={<ProtectedRoute><SalesReport /></ProtectedRoute>} />
      <Route path="/relatorios/operacao" element={<ProtectedRoute><OperationsReport /></ProtectedRoute>} />
      <Route path="/relatorios/financeiro" element={<ProtectedRoute><FinancialReport /></ProtectedRoute>} />
      <Route path="/relatorios/marketing" element={<ProtectedRoute><MarketingReport /></ProtectedRoute>} />
      <Route path="/relatorios/projetos" element={<ProtectedRoute><ProjectsReport /></ProtectedRoute>} />
      <Route path="/relatorios/clientes" element={<ProtectedRoute><ClientsReport /></ProtectedRoute>} />
      {/* Configurações */}
      <Route path="/configuracoes" element={<ProtectedRoute><SettingsDashboard /></ProtectedRoute>} />
      <Route path="/configuracoes/workspace" element={<ProtectedRoute><WorkspaceSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/papeis" element={<ProtectedRoute><RolesSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/projetos" element={<ProtectedRoute><ProjectStagesSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/financeiro" element={<ProtectedRoute><FinanceSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/propostas" element={<ProtectedRoute><ProposalSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/contratos" element={<ProtectedRoute><ContractSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/marketing" element={<ProtectedRoute><MarketingSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/prospeccao" element={<ProtectedRoute><ProspectingSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/integracoes" element={<ProtectedRoute><IntegrationsSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/notificacoes" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/branding" element={<ProtectedRoute><BrandingSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/auditoria" element={<ProtectedRoute><AuditSettingsPage /></ProtectedRoute>} />
      <Route path="/client/:shareToken" element={<ClientPortalPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
