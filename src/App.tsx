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
import FinancePage from "./pages/FinancePage";
import ContentPage from "./pages/ContentPage";
import KnowledgePage from "./pages/KnowledgePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";

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
      <Route path="/projetos" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
      <Route path="/projetos/:projectId" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
      <Route path="/propostas" element={<ProtectedRoute><ProposalsPage /></ProtectedRoute>} />
      <Route path="/contratos" element={<ProtectedRoute><ContractsPage /></ProtectedRoute>} />
      <Route path="/financeiro" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
      <Route path="/conteudo" element={<ProtectedRoute><ContentPage /></ProtectedRoute>} />
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
