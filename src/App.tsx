import { lazy, Suspense } from "react";
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
import { PageLoader } from "./components/ui/PageLoader";
import { PWAInstallBanner } from "./components/pwa/PWAInstallBanner";

// ── Core Pages ──────────────────────────────────────────────────────────
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ExecutiveDashboardPage = lazy(() => import("./pages/ExecutiveDashboardPage"));
const CommandCenterPage = lazy(() => import("./pages/CommandCenterPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const AcceptInvitePage = lazy(() => import("./pages/AcceptInvitePage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const UnifiedCalendarPage = lazy(() => import("./pages/CalendarPage"));
const AgendaPage = lazy(() => import("./pages/AgendaPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const AlertsBoardPage = lazy(() => import("./pages/AlertsBoardPage"));
const ActionHubPage = lazy(() => import("./pages/ActionHubPage"));
const ClientesPage = lazy(() => import("./pages/ClientesPage"));
const UnifiedInboxPage = lazy(() => import("./pages/UnifiedInboxPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const InstagramEnginePage = lazy(() => import("./pages/InstagramEnginePage"));
const AgencyAutomationsPage = lazy(() => import("./pages/AgencyAutomationsPage"));
const AIGovernanceDashboardPage = lazy(() => import("./pages/AIGovernanceDashboardPage"));
const PlaybooksPage = lazy(() => import("./pages/PlaybooksPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));

// ── CRM & Inbox ─────────────────────────────────────────────────────────
const CRMPage = lazy(() => import("./pages/CRMPage"));
const InboxPage = lazy(() => import("./pages/InboxPage"));
const ClientPortalPage = lazy(() => import("./pages/ClientPortalPageNew"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
const KnowledgePage = lazy(() => import("./pages/KnowledgePage"));

// ── Projects ─────────────────────────────────────────────────────────────
const ProjectsListPage = lazy(() => import("./pages/projects/ProjectsListPage"));
const ProjectDetailPage = lazy(() => import("./pages/projects/ProjectDetailPage"));

// ── Proposals ────────────────────────────────────────────────────────────
const ProposalsListPage = lazy(() => import("./pages/proposals/ProposalsListPage"));
const ProposalDetailPage = lazy(() => import("./pages/proposals/ProposalDetailPage"));
const ProposalPreviewPage = lazy(() => import("./pages/proposals/ProposalPreviewPage"));
const ProposalClientPage = lazy(() => import("./pages/proposals/ProposalClientPage"));

// ── Contracts ────────────────────────────────────────────────────────────
const ContractsPage = lazy(() => import("./pages/ContractsPage"));
const ContractsListPage = lazy(() => import("./pages/contracts/ContractsListPage"));
const ContractTemplatesPage = lazy(() => import("./pages/contracts/ContractTemplatesPage"));
const ContractDetailPage = lazy(() => import("./pages/contracts/ContractDetailPage"));
const ContractPreviewPage = lazy(() => import("./pages/contracts/ContractPreviewPage"));
const ContractClientPage = lazy(() => import("./pages/contracts/ContractClientPage"));

// ── Prospecting ──────────────────────────────────────────────────────────
const ProspectingPage = lazy(() => import("./pages/prospecting/ProspectingPage"));
const TargetsPage = lazy(() => import("./pages/prospecting/TargetsPage"));
const OpportunitiesPage = lazy(() => import("./pages/prospecting/OpportunitiesPage"));
const ActivitiesPage = lazy(() => import("./pages/prospecting/ActivitiesPage"));
const CadencesPage = lazy(() => import("./pages/prospecting/CadencesPage"));
const ScoutPage = lazy(() => import("./pages/prospecting/ScoutPage"));

// ── Finance ──────────────────────────────────────────────────────────────
const FinanceDashboard = lazy(() => import("./pages/finance/FinanceDashboard"));
const RevenuesPage = lazy(() => import("./pages/finance/RevenuesPage"));
const ExpensesPage = lazy(() => import("./pages/finance/ExpensesPage"));
const CashflowPage = lazy(() => import("./pages/finance/CashflowPage"));
const FinanceContractsPage = lazy(() => import("./pages/finance/ContractsPage"));
const ProjectsFinancePage = lazy(() => import("./pages/finance/ProjectsFinancePage"));

// ── Marketing ────────────────────────────────────────────────────────────
const MarketingDashboard = lazy(() => import("./pages/marketing/MarketingDashboard"));
const MarketingCalendarPage = lazy(() => import("./pages/marketing/CalendarPage"));
const IdeasPage = lazy(() => import("./pages/marketing/IdeasPage"));
const PipelinePage = lazy(() => import("./pages/marketing/PipelinePage"));
const AiHistoryPage = lazy(() => import("./pages/marketing/AiHistoryPage"));
const CampaignsPage = lazy(() => import("./pages/marketing/CampaignsPage"));
const AssetsPage = lazy(() => import("./pages/marketing/AssetsPage"));
const InstagramPage = lazy(() => import("./pages/marketing/InstagramPage"));
const StudioCreativoPage = lazy(() => import("./pages/marketing/StudioCreativoPage"));
const CreativeStudioPage = lazy(() => import("./pages/marketing/CreativeStudioPage"));
const LibraryPage = lazy(() => import("./pages/marketing/LibraryPage"));
const ContentDetailPage = lazy(() => import("./pages/marketing/ContentDetailPage"));
const ReferencesPage = lazy(() => import("./pages/marketing/ReferencesPage"));
const AutomationsPage = lazy(() => import("./pages/marketing/AutomationsPage"));
const TranscribePage = lazy(() => import("./pages/marketing/TranscribePage"));

// ── Marketing Hub ────────────────────────────────────────────────────────
const MkDashboardPage = lazy(() => import("./pages/marketing-hub/MkDashboardPage"));
const MkCampaignsPage = lazy(() => import("./pages/marketing-hub/MkCampaignsPage"));
const MkContentsPage = lazy(() => import("./pages/marketing-hub/MkContentsPage"));
const MkCalendarPage = lazy(() => import("./pages/marketing-hub/MkCalendarPage"));
const MkBrandingPage = lazy(() => import("./pages/marketing-hub/MkBrandingPage"));
const MkAssetsPage = lazy(() => import("./pages/marketing-hub/MkAssetsPage"));
const MkApprovalsPage = lazy(() => import("./pages/marketing-hub/MkApprovalsPage"));
const MkReportsPage = lazy(() => import("./pages/marketing-hub/MkReportsPage"));
const MkAutomationsPage = lazy(() => import("./pages/marketing-hub/MkAutomationsPage"));
const MkSettingsPage = lazy(() => import("./pages/marketing-hub/MkSettingsPage"));
const MkInstagramPage = lazy(() => import("./pages/marketing-hub/MkInstagramPage"));
const MkTemplatesPage = lazy(() => import("./pages/marketing-hub/MkTemplatesPage"));
const MkIdeasPage = lazy(() => import("./pages/marketing-hub/MkIdeasPage"));

// ── Reports ──────────────────────────────────────────────────────────────
const ReportsDashboard = lazy(() => import("./pages/reports/ReportsDashboard"));
const Report360Page = lazy(() => import("./pages/reports/Report360Page"));
const OwnerDailyReport = lazy(() => import("./pages/reports/OwnerDailyReport"));
const SalesReport = lazy(() => import("./pages/reports/SalesReport"));
const OperationsReport = lazy(() => import("./pages/reports/OperationsReport"));
const FinancialReport = lazy(() => import("./pages/reports/FinancialReport"));
const FinanceReportPage = lazy(() => import("./pages/reports/FinanceReportPage"));
const MarketingReport = lazy(() => import("./pages/reports/MarketingReport"));
const ProjectsReport = lazy(() => import("./pages/reports/ProjectsReport"));
const ClientsReport = lazy(() => import("./pages/reports/ClientsReport"));
const CRMReport = lazy(() => import("./pages/reports/CRMReport"));

// ── Settings ─────────────────────────────────────────────────────────────
const SettingsDashboard = lazy(() => import("./pages/settings/SettingsDashboard"));
const WorkspaceSettingsPage = lazy(() => import("./pages/settings/WorkspaceSettingsPage"));
const RolesSettingsPage = lazy(() => import("./pages/settings/RolesSettingsPage"));
const ProjectStagesSettingsPage = lazy(() => import("./pages/settings/ProjectStagesSettingsPage"));
const FinanceSettingsPage = lazy(() => import("./pages/settings/FinanceSettingsPage"));
const ProposalSettingsPage = lazy(() => import("./pages/settings/ProposalSettingsPage"));
const ContractSettingsPage = lazy(() => import("./pages/settings/ContractSettingsPage"));
const MarketingSettingsPage = lazy(() => import("./pages/settings/MarketingSettingsPage"));
const ProspectingSettingsPage = lazy(() => import("./pages/settings/ProspectingSettingsPage"));
const IntegrationsSettingsPage = lazy(() => import("./pages/settings/IntegrationsSettingsPage"));
const IntegrationsPage = lazy(() => import("./pages/settings/IntegrationsPage"));
const NotificationSettingsPage = lazy(() => import("./pages/settings/NotificationSettingsPage"));
const BrandingSettingsPage = lazy(() => import("./pages/settings/BrandingSettingsPage"));
const AuditSettingsPage = lazy(() => import("./pages/settings/AuditSettingsPage"));
const DangerZoneSettingsPage = lazy(() => import("./pages/settings/DangerZoneSettingsPage"));
const UsersSettingsPage = lazy(() => import("./pages/settings/UsersSettingsPage"));
const TeamSettingsPage = lazy(() => import("./pages/settings/TeamSettingsPage"));
const AiUsageDashboardPage = lazy(() => import("./pages/settings/AiUsageDashboardPage"));

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
    <Suspense fallback={<PageLoader />}>
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
      <Route path="/onboarding-clientes" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
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
    </Suspense>
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
