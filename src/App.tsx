import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";

// Pages
import CRMPage from "./pages/CRMPage";
import InboxPage from "./pages/InboxPage";
import ProjectsListPage from "./pages/projects/ProjectsListPage";
import ProjectDetailPage from "./pages/projects/ProjectDetailPage";
import ClientPortalPage from "./pages/ClientPortalPage";
import ProposalsPage from "./pages/ProposalsPage";
import ContractsPage from "./pages/ContractsPage";
import ContentPage from "./pages/ContentPage";
import KnowledgePage from "./pages/KnowledgePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";

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
      <Route path="/propostas" element={<ProtectedRoute><ProposalsPage /></ProtectedRoute>} />
      <Route path="/contratos" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
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
      <Route path="/marketing/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
      <Route path="/marketing/assets" element={<ProtectedRoute><AssetsPage /></ProtectedRoute>} />
      <Route path="/marketing/instagram" element={<ProtectedRoute><InstagramPage /></ProtectedRoute>} />
      <Route path="/marketing/studio" element={<ProtectedRoute><StudioCreativoPage /></ProtectedRoute>} />
      <Route path="/conteudo" element={<Navigate to="/marketing" replace />} />
      <Route path="/knowledge" element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/integracoes" element={<ProtectedRoute><IntegrationsPage /></ProtectedRoute>} />
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
