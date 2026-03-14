import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface OnboardingRecord {
  id: string;
  client_name: string;
  client_id: string | null;
  contract_id: string | null;
  project_id: string | null;
  template_name: string | null;
  service_type: string;
  assigned_to: string | null;
  status: string;
  current_phase: number;
  progress: number;
  started_at: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  ai_summary: string | null;
  created_at: string;
}

export interface OnboardingPhase {
  id: string;
  onboarding_id: string;
  phase_number: number;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
  steps?: OnboardingStep[];
}

export interface OnboardingStep {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  is_required: boolean;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface MaterialRequest {
  id: string;
  onboarding_id: string;
  title: string;
  description: string | null;
  item_type: string;
  is_required: boolean;
  status: string;
  submitted_at: string | null;
  file_url: string | null;
  notes: string | null;
}

export interface BriefingAnswer {
  id: string;
  onboarding_id: string;
  question_key: string;
  question_label: string;
  answer: string | null;
  section: string | null;
  sort_order: number;
}

const SERVICE_TEMPLATES: Record<string, { phases: { title: string; description: string; steps: string[] }[]; materials: { title: string; type: string; required: boolean }[]; briefing: { key: string; label: string; section: string }[] }> = {
  social_media: {
    phases: [
      { title: "Confirmação Comercial", description: "Validação de dados e escopo", steps: ["Validar dados do cliente", "Validar escopo vendido", "Confirmar contrato", "Definir responsáveis internos"] },
      { title: "Coleta de Briefing", description: "Entendimento do negócio e objetivos", steps: ["Enviar formulário de briefing", "Revisar respostas", "Validar objetivos e metas", "Mapear público-alvo"] },
      { title: "Coleta de Acessos", description: "Materiais e acessos necessários", steps: ["Solicitar acesso ao Instagram", "Solicitar acesso ao Facebook", "Coletar materiais de marca", "Receber logo e assets visuais"] },
      { title: "Setup Operacional", description: "Configuração de projeto e ferramentas", steps: ["Criar projeto na plataforma", "Configurar calendário editorial", "Definir cronograma", "Configurar portal do cliente"] },
      { title: "Kickoff", description: "Reunião de alinhamento e início", steps: ["Agendar reunião de kickoff", "Consolidar briefing", "Revisar cronograma", "Publicar próximos passos"] },
      { title: "Ativação", description: "Início da operação recorrente", steps: ["Marcar onboarding como concluído", "Iniciar operação recorrente", "Enviar resumo ao cliente"] },
    ],
    materials: [
      { title: "Logo em alta resolução", type: "file", required: true },
      { title: "Manual da marca", type: "file", required: false },
      { title: "Acesso ao Instagram", type: "access", required: true },
      { title: "Acesso ao Meta Business", type: "access", required: true },
      { title: "Fotos e vídeos do negócio", type: "file", required: true },
      { title: "Referências visuais", type: "link", required: false },
    ],
    briefing: [
      { key: "business_description", label: "Descreva seu negócio em poucas palavras", section: "Negócio" },
      { key: "target_audience", label: "Qual seu público-alvo?", section: "Negócio" },
      { key: "objectives", label: "Quais seus principais objetivos com social media?", section: "Objetivos" },
      { key: "competitors", label: "Quais seus principais concorrentes?", section: "Mercado" },
      { key: "tone_of_voice", label: "Como você gostaria que a comunicação soasse?", section: "Identidade" },
      { key: "content_restrictions", label: "Há algo que NÃO devemos publicar?", section: "Identidade" },
      { key: "posting_frequency", label: "Frequência ideal de publicações", section: "Operação" },
      { key: "platforms", label: "Quais plataformas são prioridade?", section: "Operação" },
    ],
  },
  trafego_pago: {
    phases: [
      { title: "Confirmação Comercial", description: "Validação comercial", steps: ["Validar dados do cliente", "Confirmar orçamento de mídia", "Definir responsáveis"] },
      { title: "Coleta de Briefing", description: "Objetivos e estratégia", steps: ["Enviar formulário de briefing", "Definir metas e KPIs", "Mapear funil de conversão"] },
      { title: "Coleta de Acessos", description: "Plataformas e tracking", steps: ["Acesso ao Google Ads", "Acesso ao Meta Ads", "Instalar pixel/tags", "Acesso ao Google Analytics"] },
      { title: "Setup Operacional", description: "Configuração técnica", steps: ["Criar projeto", "Configurar tracking", "Criar campanhas iniciais", "Configurar portal"] },
      { title: "Kickoff e Ativação", description: "Lançamento", steps: ["Reunião de kickoff", "Aprovar criativos iniciais", "Lançar campanhas", "Enviar resumo ao cliente"] },
    ],
    materials: [
      { title: "Acesso ao Google Ads", type: "access", required: true },
      { title: "Acesso ao Meta Ads", type: "access", required: true },
      { title: "Acesso ao Google Analytics", type: "access", required: true },
      { title: "Logo e identidade visual", type: "file", required: true },
      { title: "Landing pages existentes", type: "link", required: false },
    ],
    briefing: [
      { key: "business_model", label: "Qual o modelo de negócio?", section: "Negócio" },
      { key: "monthly_budget", label: "Orçamento mensal de mídia", section: "Investimento" },
      { key: "main_goals", label: "Objetivos principais (leads, vendas, tráfego)", section: "Objetivos" },
      { key: "current_campaigns", label: "Já rodou campanhas antes? Quais resultados?", section: "Histórico" },
      { key: "landing_pages", label: "Possui landing pages?", section: "Estrutura" },
      { key: "target_audience", label: "Público-alvo detalhado", section: "Audiência" },
    ],
  },
  general: {
    phases: [
      { title: "Confirmação Comercial", description: "Validação de dados", steps: ["Validar dados do cliente", "Confirmar escopo", "Definir responsáveis"] },
      { title: "Coleta de Briefing", description: "Entendimento do negócio", steps: ["Enviar formulário", "Revisar respostas", "Validar objetivos"] },
      { title: "Coleta de Materiais", description: "Arquivos e acessos", steps: ["Solicitar materiais", "Validar acessos", "Organizar arquivos"] },
      { title: "Setup e Kickoff", description: "Início da operação", steps: ["Criar projeto", "Agendar kickoff", "Publicar próximos passos"] },
      { title: "Ativação", description: "Conclusão do onboarding", steps: ["Finalizar onboarding", "Enviar resumo ao cliente"] },
    ],
    materials: [
      { title: "Logo", type: "file", required: true },
      { title: "Materiais de marca", type: "file", required: false },
      { title: "Documentos relevantes", type: "file", required: false },
    ],
    briefing: [
      { key: "business_description", label: "Descreva seu negócio", section: "Geral" },
      { key: "objectives", label: "Quais os objetivos principais?", section: "Geral" },
      { key: "expectations", label: "Quais suas expectativas?", section: "Geral" },
      { key: "priorities", label: "Quais as prioridades imediatas?", section: "Geral" },
    ],
  },
};

export function useClientOnboarding() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const onboardingsQuery = useQuery({
    queryKey: ["client-onboardings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_onboardings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as OnboardingRecord[];
    },
    enabled: !!user,
  });

  const createOnboarding = useMutation({
    mutationFn: async (input: { client_name: string; service_type: string; due_date?: string }) => {
      const template = SERVICE_TEMPLATES[input.service_type] || SERVICE_TEMPLATES.general;

      // Create onboarding
      const { data: ob, error } = await supabase
        .from("client_onboardings")
        .insert({
          client_name: input.client_name,
          service_type: input.service_type,
          template_name: input.service_type,
          due_date: input.due_date || null,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Create phases + steps
      for (let i = 0; i < template.phases.length; i++) {
        const p = template.phases[i];
        const { data: phase } = await supabase
          .from("onboarding_phases")
          .insert({ onboarding_id: ob.id, phase_number: i + 1, title: p.title, description: p.description, sort_order: i })
          .select()
          .single();
        if (phase) {
          const steps = p.steps.map((s, j) => ({
            phase_id: phase.id,
            title: s,
            sort_order: j,
          }));
          await supabase.from("onboarding_phase_steps").insert(steps);
        }
      }

      // Create material requests
      if (template.materials.length > 0) {
        const mats = template.materials.map((m, i) => ({
          onboarding_id: ob.id,
          title: m.title,
          item_type: m.type,
          is_required: m.required,
          sort_order: i,
        }));
        await supabase.from("onboarding_material_requests").insert(mats);
      }

      // Create briefing questions
      if (template.briefing.length > 0) {
        const bqs = template.briefing.map((b, i) => ({
          onboarding_id: ob.id,
          question_key: b.key,
          question_label: b.label,
          section: b.section,
          sort_order: i,
        }));
        await supabase.from("onboarding_briefing_answers").insert(bqs);
      }

      return ob;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-onboardings"] });
      toast.success("Onboarding criado com sucesso!");
    },
    onError: () => toast.error("Erro ao criar onboarding"),
  });

  return {
    onboardings: onboardingsQuery.data || [],
    isLoading: onboardingsQuery.isLoading,
    createOnboarding,
    SERVICE_TEMPLATES,
  };
}

export function useOnboardingDetail(onboardingId: string | undefined) {
  const qc = useQueryClient();

  const phasesQuery = useQuery({
    queryKey: ["onboarding-phases", onboardingId],
    queryFn: async () => {
      const { data: phases } = await supabase
        .from("onboarding_phases")
        .select("*")
        .eq("onboarding_id", onboardingId!)
        .order("sort_order");
      if (!phases) return [];

      // Get steps for each phase
      const phaseIds = phases.map((p) => p.id);
      const { data: steps } = await supabase
        .from("onboarding_phase_steps")
        .select("*")
        .in("phase_id", phaseIds)
        .order("sort_order");

      return phases.map((p) => ({
        ...p,
        steps: (steps || []).filter((s) => s.phase_id === p.id),
      })) as OnboardingPhase[];
    },
    enabled: !!onboardingId,
  });

  const materialsQuery = useQuery({
    queryKey: ["onboarding-materials", onboardingId],
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_material_requests")
        .select("*")
        .eq("onboarding_id", onboardingId!)
        .order("sort_order");
      return (data || []) as MaterialRequest[];
    },
    enabled: !!onboardingId,
  });

  const briefingQuery = useQuery({
    queryKey: ["onboarding-briefing", onboardingId],
    queryFn: async () => {
      const { data } = await supabase
        .from("onboarding_briefing_answers")
        .select("*")
        .eq("onboarding_id", onboardingId!)
        .order("sort_order");
      return (data || []) as BriefingAnswer[];
    },
    enabled: !!onboardingId,
  });

  const toggleStep = useMutation({
    mutationFn: async ({ stepId, completed }: { stepId: string; completed: boolean }) => {
      await supabase
        .from("onboarding_phase_steps")
        .update({ is_completed: completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", stepId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding-phases", onboardingId] });
      recalcProgress();
    },
  });

  const updateMaterialStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase
        .from("onboarding_material_requests")
        .update({ status, submitted_at: status === "received" ? new Date().toISOString() : null })
        .eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-materials", onboardingId] }),
  });

  const saveBriefingAnswer = useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) => {
      await supabase
        .from("onboarding_briefing_answers")
        .update({ answer, updated_at: new Date().toISOString() })
        .eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding-briefing", onboardingId] }),
  });

  const recalcProgress = async () => {
    if (!onboardingId) return;
    const phases = phasesQuery.data || [];
    const allSteps = phases.flatMap((p) => p.steps || []);
    if (allSteps.length === 0) return;
    const done = allSteps.filter((s) => s.is_completed).length;
    const progress = Math.round((done / allSteps.length) * 100);
    const status = progress >= 100 ? "completed" : "in_progress";
    await supabase
      .from("client_onboardings")
      .update({ progress, status, completed_at: status === "completed" ? new Date().toISOString() : null })
      .eq("id", onboardingId);
    qc.invalidateQueries({ queryKey: ["client-onboardings"] });
  };

  return {
    phases: phasesQuery.data || [],
    materials: materialsQuery.data || [],
    briefing: briefingQuery.data || [],
    isLoading: phasesQuery.isLoading,
    toggleStep,
    updateMaterialStatus,
    saveBriefingAnswer,
  };
}
