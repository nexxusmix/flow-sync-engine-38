import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useRealtimeSync } from "./hooks/useRealtimeSync";
import { useThemeColors } from "./hooks/useThemeColors";
import { ProductProvider } from "./hooks/useProductContext";
import { UndoRedoProvider } from "./components/layout/UndoRedoProvider";
import { BackgroundUploadIndicator } from "./components/ui/BackgroundUploadIndicator";

import Dashboard from "./pages/Dashboard";
import ExecutiveDashboardPage from "./pages/ExecutiveDashboardPage";
import CommandCenterPage from "./pages/CommandCenterPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import AcceptInvitePage from "./pages/AcceptInvitePage";
import LandingPage from "./pages/LandingPage";

// Pages
import CRMPage from "./pages/CRMPage";
import InboxPage from "./pages/InboxPage";
import ProjectsListPage from "./pages/projects/ProjectsListPage";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import ClientPortalPage from "./pages/ClientPortalPageNew";
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
import Report360Page from "./pages/reports/Report360Page";
import OwnerDailyReport from "./pages/reports/OwnerDailyReport";
import SalesReport from "./pages/reports/SalesReport";
import OperationsReport from "./pages/reports/OperationsReport";
import FinancialReport from "./pages/reports/FinancialReport";
import FinanceReportPage from "./pages/reports/FinanceReportPage";
import MarketingReport from "./pages/reports/MarketingReport";
import ProjectsReport from "./pages/reports/ProjectsReport";
import ClientsReport from "./pages/reports/ClientsReport";
import CRMReport from "./pages/reports/CRMReport";
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
import IntegrationsPage from "./pages/settings/IntegrationsPage";
import NotificationSettingsPage from "./pages/settings/NotificationSettingsPage";
import BrandingSettingsPage from "./pages/settings/BrandingSettingsPage";
import AuditSettingsPage from "./pages/settings/AuditSettingsPage";
import DangerZoneSettingsPage from "./pages/settings/DangerZoneSettingsPage";
import UsersSettingsPage from "./pages/settings/UsersSettingsPage";
import TeamSettingsPage from "./pages/settings/TeamSettingsPage";
import AiUsageDashboardPage from "./pages/settings/AiUsageDashboardPage";
import InstallPage from "./pages/InstallPage";
import { PWAInstallBanner } from "./components/pwa/PWAInstallBanner";

// Prospecção Pages
import ProspectingPage from "./pages/prospecting/ProspectingPage";
import TargetsPage from "./pages/prospecting/TargetsPage";
import OpportunitiesPage from "./pages/prospecting/OpportunitiesPage";
import ActivitiesPage from "./pages/prospecting/ActivitiesPage";
import CadencesPage from "./pages/prospecting/CadencesPage";
import ScoutPage from "./pages/prospecting/ScoutPage";

// Finance Pages
import FinanceDashboard from "./pages/finance/FinanceDashboard";
import RevenuesPage from "./pages/finance/RevenuesPage";
import ExpensesPage from "./pages/finance/ExpensesPage";
import CashflowPage from "./pages/finance/CashflowPage";
import FinanceContractsPage from "./pages/finance/ContractsPage";
import ProjectsFinancePage from "./pages/finance/ProjectsFinancePage";

// Marketing Pages
import MarketingDashboard from "./pages/marketing/MarketingDashboard";
import MarketingCalendarPage from "./pages/marketing/CalendarPage";
import IdeasPage from "./pages/marketing/IdeasPage";
import PipelinePage from "./pages/marketing/PipelinePage";
import AiHistoryPage from "./pages/marketing/AiHistoryPage";
import CampaignsPage from "./pages/marketing/CampaignsPage";
import AssetsPage from "./pages/marketing/AssetsPage";
import InstagramPage from "./pages/marketing/InstagramPage";
import StudioCreativoPage from "./pages/marketing/StudioCreativoPage";
import CreativeStudioPage from "./pages/marketing/CreativeStudioPage";
import LibraryPage from "./pages/marketing/LibraryPage";
import ContentDetailPage from "./pages/marketing/ContentDetailPage";
import ReferencesPage from "./pages/marketing/ReferencesPage";
import AutomationsPage from "./pages/marketing/AutomationsPage";
import TranscribePage from "./pages/marketing/TranscribePage";
import UnifiedCalendarPage from "./pages/CalendarPage";
import AgendaPage from "./pages/AgendaPage";
import TasksPage from "./pages/TasksPage";
import AlertsBoardPage from "./pages/AlertsBoardPage";
import ActionHubPage from "./pages/ActionHubPage";
import ClientesPage from "./pages/ClientesPage";
import UnifiedInboxPage from "./pages/UnifiedInboxPage";

// Marketing Hub Pages
import MkDashboardPage from "./pages/marketing-hub/MkDashboardPage";
import MkCampaignsPage from "./pages/marketing-hub/MkCampaignsPage";
import MkContentsPage from "./pages/marketing-hub/MkContentsPage";
import MkCalendarPage from "./pages/marketing-hub/MkCalendarPage";
import MkBrandingPage from "./pages/marketing-hub/MkBrandingPage";
import MkAssetsPage from "./pages/marketing-hub/MkAssetsPage";
import MkApprovalsPage from "./pages/marketing-hub/MkApprovalsPage";
import MkReportsPage from "./pages/marketing-hub/MkReportsPage";
import MkAutomationsPage from "./pages/marketing-hub/MkAutomationsPage";
import MkSettingsPage from "./pages/marketing-hub/MkSettingsPage";
import MkInstagramPage from "./pages/marketing-hub/MkInstagramPage";
import MkTemplatesPage from "./pages/marketing-hub/MkTemplatesPage";
import MkIdeasPage from "./pages/marketing-hub/MkIdeasPage";
import InstagramEnginePage from "./pages/InstagramEnginePage";
import AgencyAutomationsPage from "./pages/AgencyAutomationsPage";
import AIGovernanceDashboardPage from "./pages/AIGovernanceDashboardPage";
import PlaybooksPage from "./pages/PlaybooksPage";
import BillingPage from "./pages/BillingPage";

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
  
  // Inicializa sincronização realtime global
  useRealtimeSync();
  
  // Aplica cores dinâmicas do branding
  useThemeColors();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      {/* Invite accept page — always public so the token hash can be processed */}
      <Route path="/auth" element={<AcceptInvitePage />} />
      <Route path="/" element={isAuthenticated ? <Dashboard /> : <LandingPage />} />
      <Route path="/executivo" element={<ProtectedRoute><ExecutiveDashboardPage /></ProtectedRoute>} />
      <Route path="/command-center" element={<ProtectedRoute><CommandCenterPage /></ProtectedRoute>} />
      <Route path="/calendario" element={<ProtectedRoute><UnifiedCalendarPage /></ProtectedRoute>} />
      <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
      <Route path="/tarefas" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/avisos" element={<ProtectedRoute><AlertsBoardPage /></ProtectedRoute>} />
      <Route path="/central-acoes" element={<ProtectedRoute><ActionHubPage /></ProtectedRoute>} />
      <Route path="/automacoes-agencia" element={<ProtectedRoute><AgencyAutomationsPage /></ProtectedRoute>} />
      <Route path="/ia-governanca" element={<ProtectedRoute><AIGovernanceDashboardPage /></ProtectedRoute>} />
      <Route path="/playbooks" element={<ProtectedRoute><PlaybooksPage /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/crm" element={<ProtectedRoute><CRMPage /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
      <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
      <Route path="/inbox-operacional" element={<ProtectedRoute><UnifiedInboxPage /></ProtectedRoute>} />
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
      <Route path="/prospeccao/scout" element={<ProtectedRoute><ScoutPage /></ProtectedRoute>} />
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
      <Route path="/marketing/calendar" element={<ProtectedRoute><MarketingCalendarPage /></ProtectedRoute>} />
      <Route path="/marketing/ideas" element={<ProtectedRoute><IdeasPage /></ProtectedRoute>} />
      <Route path="/marketing/pipeline" element={<ProtectedRoute><PipelinePage /></ProtectedRoute>} />
      <Route path="/marketing/content/:contentItemId" element={<ProtectedRoute><ContentDetailPage /></ProtectedRoute>} />
      <Route path="/marketing/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
      <Route path="/marketing/assets" element={<ProtectedRoute><AssetsPage /></ProtectedRoute>} />
      <Route path="/marketing/library" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
      <Route path="/marketing/instagram" element={<ProtectedRoute><InstagramPage /></ProtectedRoute>} />
      <Route path="/marketing/references" element={<ProtectedRoute><ReferencesPage /></ProtectedRoute>} />
      <Route path="/marketing/studio" element={<ProtectedRoute><CreativeStudioPage /></ProtectedRoute>} />
      <Route path="/marketing/studio/:workId" element={<ProtectedRoute><CreativeStudioPage /></ProtectedRoute>} />
      <Route path="/marketing/studio-legacy" element={<ProtectedRoute><StudioCreativoPage /></ProtectedRoute>} />
      <Route path="/marketing/automacoes" element={<ProtectedRoute><AutomationsPage /></ProtectedRoute>} />
      <Route path="/marketing/ai-history" element={<ProtectedRoute><AiHistoryPage /></ProtectedRoute>} />
      <Route path="/marketing/transcricao" element={<ProtectedRoute><TranscribePage /></ProtectedRoute>} />
      <Route path="/conteudo" element={<Navigate to="/marketing" replace />} />
      <Route path="/knowledge" element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
      {/* Relatórios */}
      <Route path="/relatorios" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
      <Route path="/relatorios/360" element={<ProtectedRoute><Report360Page /></ProtectedRoute>} />
      <Route path="/relatorios/dono" element={<ProtectedRoute><OwnerDailyReport /></ProtectedRoute>} />
      <Route path="/relatorios/vendas" element={<ProtectedRoute><SalesReport /></ProtectedRoute>} />
      <Route path="/relatorios/operacao" element={<ProtectedRoute><OperationsReport /></ProtectedRoute>} />
      <Route path="/relatorios/financeiro" element={<ProtectedRoute><FinancialReport /></ProtectedRoute>} />
      <Route path="/relatorios/finance" element={<ProtectedRoute><FinanceReportPage /></ProtectedRoute>} />
      <Route path="/relatorios/marketing" element={<ProtectedRoute><MarketingReport /></ProtectedRoute>} />
      <Route path="/relatorios/projetos" element={<ProtectedRoute><ProjectsReport /></ProtectedRoute>} />
      <Route path="/relatorios/clientes" element={<ProtectedRoute><ClientsReport /></ProtectedRoute>} />
      <Route path="/relatorios/crm" element={<ProtectedRoute><CRMReport /></ProtectedRoute>} />
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
      <Route path="/configuracoes/integracoes" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/notificacoes" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/branding" element={<ProtectedRoute><BrandingSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/usuarios" element={<ProtectedRoute><UsersSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/equipe" element={<ProtectedRoute><TeamSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/auditoria" element={<ProtectedRoute><AuditSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/danger-zone" element={<ProtectedRoute><DangerZoneSettingsPage /></ProtectedRoute>} />
      <Route path="/configuracoes/ai-usage" element={<ProtectedRoute><AiUsageDashboardPage /></ProtectedRoute>} />
      <Route path="/plataforma" element={<Navigate to="/" replace />} />
      <Route path="/client/:shareToken" element={<ClientPortalPage />} />
      <Route path="/portal/:shareToken" element={<ClientPortalPage />} />
      {/* Marketing Hub — /m/* */}
      <Route path="/m" element={<ProtectedRoute><MkDashboardPage /></ProtectedRoute>} />
      <Route path="/m/ideias" element={<ProtectedRoute><MkIdeasPage /></ProtectedRoute>} />
      <Route path="/m/campanhas" element={<ProtectedRoute><MkCampaignsPage /></ProtectedRoute>} />
      <Route path="/m/conteudos" element={<ProtectedRoute><MkContentsPage /></ProtectedRoute>} />
      <Route path="/m/content/:contentItemId" element={<ProtectedRoute><ContentDetailPage /></ProtectedRoute>} />
      <Route path="/m/calendario" element={<ProtectedRoute><MkCalendarPage /></ProtectedRoute>} />
      <Route path="/m/instagram" element={<ProtectedRoute><MkInstagramPage /></ProtectedRoute>} />
      <Route path="/m/templates" element={<ProtectedRoute><MkTemplatesPage /></ProtectedRoute>} />
      <Route path="/m/branding" element={<ProtectedRoute><MkBrandingPage /></ProtectedRoute>} />
      <Route path="/m/assets" element={<ProtectedRoute><MkAssetsPage /></ProtectedRoute>} />
      <Route path="/m/aprovacoes" element={<ProtectedRoute><MkApprovalsPage /></ProtectedRoute>} />
      <Route path="/m/relatorios" element={<ProtectedRoute><MkReportsPage /></ProtectedRoute>} />
      <Route path="/m/automacoes" element={<ProtectedRoute><MkAutomationsPage /></ProtectedRoute>} />
      <Route path="/m/configuracoes" element={<ProtectedRoute><MkSettingsPage /></ProtectedRoute>} />
      <Route path="/instagram-engine" element={<ProtectedRoute><InstagramEnginePage /></ProtectedRoute>} />
      <Route path="/instalar" element={<InstallPage />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" storageKey="hub_theme" enableSystem disableTransitionOnChange={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ProductProvider>
            <UndoRedoProvider>
              <Toaster />
              <Sonner />
              <BackgroundUploadIndicator />
              <PWAInstallBanner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </UndoRedoProvider>
          </ProductProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
