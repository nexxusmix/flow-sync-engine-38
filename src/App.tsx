import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Placeholder pages
import CRMPage from "./pages/CRMPage";
import InboxPage from "./pages/InboxPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProposalsPage from "./pages/ProposalsPage";
import ContractsPage from "./pages/ContractsPage";
import FinancePage from "./pages/FinancePage";
import ContentPage from "./pages/ContentPage";
import KnowledgePage from "./pages/KnowledgePage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import IntegrationsPage from "./pages/IntegrationsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/crm" element={<CRMPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/projetos" element={<ProjectsPage />} />
          <Route path="/propostas" element={<ProposalsPage />} />
          <Route path="/contratos" element={<ContractsPage />} />
          <Route path="/financeiro" element={<FinancePage />} />
          <Route path="/conteudo" element={<ContentPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
          <Route path="/integracoes" element={<IntegrationsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
