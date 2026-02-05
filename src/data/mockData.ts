// SQUAD Hub - Mock Data
// Realistic data for audiovisual production company

export interface Account {
  id: string;
  name: string;
  type: 'empresa' | 'pessoa_fisica';
  segment: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  accountId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface Deal {
  id: string;
  accountId: string;
  accountName: string;
  contactName: string;
  title: string;
  value: number;
  stage: 'lead' | 'qualificacao' | 'diagnostico' | 'proposta' | 'negociacao' | 'fechado' | 'onboarding' | 'pos_venda';
  probability: number;
  lastActivity: string;
  lastActivityDays: number;
  nextAction: string;
  responsible: string;
  createdAt: string;
  lostReason?: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  accountName: string;
  channel: 'whatsapp' | 'instagram' | 'email';
  intent: 'orcamento' | 'prazo' | 'objecao' | 'suporte' | 'cobranca' | 'geral';
  needsHuman: boolean;
  summary: string;
  nextAction: string;
  lastMessage: string;
  unread: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  dealId: string;
  accountName: string;
  title: string;
  type: 'filme_institucional' | 'reels' | 'documentario' | 'evento' | 'comercial';
  stage: 'briefing' | 'pre_producao' | 'producao' | 'pos_producao' | 'revisao' | 'entrega' | 'finalizado';
  deadline: string;
  status: 'ok' | 'em_risco' | 'atrasado';
  blockage?: 'pagamento' | 'briefing' | 'revisao' | 'cliente' | null;
  responsible: string;
  progress: number;
  createdAt: string;
}

export interface Delivery {
  id: string;
  projectId: string;
  projectTitle: string;
  accountName: string;
  type: string;
  dueDate: string;
  status: 'pendente' | 'em_andamento' | 'pronto' | 'entregue';
}

export interface Invoice {
  id: string;
  projectId: string;
  accountId: string;
  accountName: string;
  projectTitle: string;
  amount: number;
  dueDate: string;
  status: 'pendente' | 'pago' | 'vencido';
  daysOverdue: number;
  installment: string;
  paymentHistory: { date: string; action: string }[];
}

export interface Event {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entityType: 'deal' | 'project' | 'invoice' | 'proposal' | 'contract' | 'delivery';
  entityId: string;
  entityName: string;
  description: string;
}

// Mock Accounts
export const accounts: Account[] = [
  { id: 'acc-1', name: 'Incorporadora Vista Mar', type: 'empresa', segment: 'Imobiliário', createdAt: '2024-01-15' },
  { id: 'acc-2', name: 'Restaurante Sabor & Arte', type: 'empresa', segment: 'Gastronomia', createdAt: '2024-02-10' },
  { id: 'acc-3', name: 'Clínica Estética Premium', type: 'empresa', segment: 'Saúde', createdAt: '2024-03-05' },
  { id: 'acc-4', name: 'Arquiteto João Silva', type: 'pessoa_fisica', segment: 'Arquitetura', createdAt: '2024-03-20' },
  { id: 'acc-5', name: 'Tech Solutions Brasil', type: 'empresa', segment: 'Tecnologia', createdAt: '2024-04-01' },
  { id: 'acc-6', name: 'Advocacia Martins & Associados', type: 'empresa', segment: 'Jurídico', createdAt: '2024-04-15' },
  { id: 'acc-7', name: 'Boutique Maria Clara', type: 'empresa', segment: 'Moda', createdAt: '2024-05-01' },
  { id: 'acc-8', name: 'Construtora Horizonte', type: 'empresa', segment: 'Construção', createdAt: '2024-05-10' },
];

// Mock Contacts
export const contacts: Contact[] = [
  { id: 'con-1', accountId: 'acc-1', name: 'Roberto Almeida', email: 'roberto@vistamar.com', phone: '11999887766', role: 'Diretor de Marketing' },
  { id: 'con-2', accountId: 'acc-2', name: 'Marina Costa', email: 'marina@saborarte.com', phone: '11988776655', role: 'Proprietária' },
  { id: 'con-3', accountId: 'acc-3', name: 'Dra. Fernanda Lima', email: 'fernanda@clinicapremium.com', phone: '11977665544', role: 'Diretora Clínica' },
  { id: 'con-4', accountId: 'acc-4', name: 'João Silva', email: 'joao@arqsilva.com', phone: '11966554433', role: 'Arquiteto' },
  { id: 'con-5', accountId: 'acc-5', name: 'Carlos Eduardo', email: 'carlos@techsolutions.com', phone: '11955443322', role: 'CEO' },
  { id: 'con-6', accountId: 'acc-6', name: 'Dr. Paulo Martins', email: 'paulo@martinsadv.com', phone: '11944332211', role: 'Sócio' },
  { id: 'con-7', accountId: 'acc-7', name: 'Maria Clara Santos', email: 'maria@boutiquemaria.com', phone: '11933221100', role: 'Proprietária' },
  { id: 'con-8', accountId: 'acc-8', name: 'André Horizonte', email: 'andre@construtora.com', phone: '11922110099', role: 'Diretor Comercial' },
];

// Mock Deals
export const deals: Deal[] = [
  { id: 'deal-1', accountId: 'acc-1', accountName: 'Incorporadora Vista Mar', contactName: 'Roberto Almeida', title: 'Filme Institucional Lançamento', value: 45000, stage: 'proposta', probability: 60, lastActivity: '2024-01-20', lastActivityDays: 5, nextAction: 'Fazer follow up', responsible: 'Ana Paula', createdAt: '2024-01-10' },
  { id: 'deal-2', accountId: 'acc-2', accountName: 'Restaurante Sabor & Arte', contactName: 'Marina Costa', title: 'Pacote Reels Mensal', value: 8500, stage: 'negociacao', probability: 75, lastActivity: '2024-01-22', lastActivityDays: 3, nextAction: 'Confirmar objeções', responsible: 'Pedro Santos', createdAt: '2024-01-15' },
  { id: 'deal-3', accountId: 'acc-3', accountName: 'Clínica Estética Premium', contactName: 'Dra. Fernanda Lima', title: 'Documentário Cases', value: 32000, stage: 'diagnostico', probability: 40, lastActivity: '2024-01-18', lastActivityDays: 7, nextAction: 'Agendar call', responsible: 'Ana Paula', createdAt: '2024-01-12' },
  { id: 'deal-4', accountId: 'acc-4', accountName: 'Arquiteto João Silva', contactName: 'João Silva', title: 'Vídeos de Portfólio', value: 15000, stage: 'fechado', probability: 100, lastActivity: '2024-01-23', lastActivityDays: 2, nextAction: 'Iniciar onboarding', responsible: 'Pedro Santos', createdAt: '2024-01-08' },
  { id: 'deal-5', accountId: 'acc-5', accountName: 'Tech Solutions Brasil', contactName: 'Carlos Eduardo', title: 'Vídeo Produto SaaS', value: 28000, stage: 'qualificacao', probability: 30, lastActivity: '2024-01-19', lastActivityDays: 6, nextAction: 'Agendar call', responsible: 'Ana Paula', createdAt: '2024-01-17' },
  { id: 'deal-6', accountId: 'acc-6', accountName: 'Advocacia Martins', contactName: 'Dr. Paulo Martins', title: 'Institucional Escritório', value: 22000, stage: 'lead', probability: 20, lastActivity: '2024-01-24', lastActivityDays: 1, nextAction: 'Primeiro contato', responsible: 'Pedro Santos', createdAt: '2024-01-24' },
  { id: 'deal-7', accountId: 'acc-7', accountName: 'Boutique Maria Clara', contactName: 'Maria Clara Santos', title: 'Campanha Coleção Verão', value: 18000, stage: 'onboarding', probability: 100, lastActivity: '2024-01-21', lastActivityDays: 4, nextAction: 'Coletar briefing', responsible: 'Ana Paula', createdAt: '2024-01-05' },
  { id: 'deal-8', accountId: 'acc-8', accountName: 'Construtora Horizonte', contactName: 'André Horizonte', title: 'Drone Obra + Timelapse', value: 35000, stage: 'pos_venda', probability: 100, lastActivity: '2024-01-23', lastActivityDays: 2, nextAction: 'Enviar pesquisa satisfação', responsible: 'Pedro Santos', createdAt: '2023-12-01' },
];

// Mock Conversations
export const conversations: Conversation[] = [
  { id: 'conv-1', contactId: 'con-1', contactName: 'Roberto Almeida', accountName: 'Incorporadora Vista Mar', channel: 'whatsapp', intent: 'orcamento', needsHuman: true, summary: 'Pediu orçamento para filme do novo empreendimento', nextAction: 'Enviar proposta detalhada', lastMessage: 'Preciso de um orçamento urgente para o lançamento', unread: true, createdAt: '2024-01-25T10:30:00' },
  { id: 'conv-2', contactId: 'con-2', contactName: 'Marina Costa', accountName: 'Restaurante Sabor & Arte', channel: 'instagram', intent: 'prazo', needsHuman: false, summary: 'Perguntou sobre prazo de entrega dos reels', nextAction: 'Confirmar cronograma', lastMessage: 'Quando fica pronto o primeiro lote?', unread: true, createdAt: '2024-01-25T09:15:00' },
  { id: 'conv-3', contactId: 'con-3', contactName: 'Dra. Fernanda Lima', accountName: 'Clínica Estética Premium', channel: 'email', intent: 'objecao', needsHuman: true, summary: 'Questionou valor e pediu desconto', nextAction: 'Negociar condições', lastMessage: 'O valor está acima do nosso orçamento previsto', unread: false, createdAt: '2024-01-25T08:00:00' },
  { id: 'conv-4', contactId: 'con-5', contactName: 'Carlos Eduardo', accountName: 'Tech Solutions Brasil', channel: 'whatsapp', intent: 'suporte', needsHuman: false, summary: 'Dúvida sobre formato de entrega', nextAction: 'Explicar formatos disponíveis', lastMessage: 'Vocês entregam em 4K?', unread: false, createdAt: '2024-01-24T16:45:00' },
  { id: 'conv-5', contactId: 'con-6', contactName: 'Dr. Paulo Martins', accountName: 'Advocacia Martins', channel: 'email', intent: 'orcamento', needsHuman: true, summary: 'Novo lead pedindo orçamento institucional', nextAction: 'Agendar reunião', lastMessage: 'Gostaria de um orçamento para vídeo institucional', unread: true, createdAt: '2024-01-25T07:30:00' },
  { id: 'conv-6', contactId: 'con-7', contactName: 'Maria Clara Santos', accountName: 'Boutique Maria Clara', channel: 'whatsapp', intent: 'cobranca', needsHuman: false, summary: 'Pediu segunda via do boleto', nextAction: 'Enviar boleto', lastMessage: 'Pode enviar o boleto novamente?', unread: false, createdAt: '2024-01-24T14:20:00' },
  { id: 'conv-7', contactId: 'con-8', contactName: 'André Horizonte', accountName: 'Construtora Horizonte', channel: 'whatsapp', intent: 'geral', needsHuman: false, summary: 'Agradeceu entrega do projeto', nextAction: 'Solicitar depoimento', lastMessage: 'Ficou excelente, parabéns!', unread: false, createdAt: '2024-01-24T11:00:00' },
  { id: 'conv-8', contactId: 'con-4', contactName: 'João Silva', accountName: 'Arquiteto João Silva', channel: 'instagram', intent: 'prazo', needsHuman: false, summary: 'Confirmou recebimento do briefing', nextAction: 'Iniciar produção', lastMessage: 'Recebi o briefing, tudo certo', unread: false, createdAt: '2024-01-23T15:30:00' },
];

// Mock Projects
export const projects: Project[] = [
  { id: 'proj-1', dealId: 'deal-4', accountName: 'Arquiteto João Silva', title: 'Vídeos de Portfólio', type: 'filme_institucional', stage: 'producao', deadline: '2024-02-15', status: 'ok', blockage: null, responsible: 'Lucas Diretor', progress: 45, createdAt: '2024-01-08' },
  { id: 'proj-2', dealId: 'deal-7', accountName: 'Boutique Maria Clara', title: 'Campanha Coleção Verão', type: 'reels', stage: 'briefing', deadline: '2024-02-01', status: 'em_risco', blockage: 'briefing', responsible: 'Camila Produtora', progress: 10, createdAt: '2024-01-20' },
  { id: 'proj-3', dealId: 'deal-8', accountName: 'Construtora Horizonte', title: 'Drone Obra + Timelapse', type: 'documentario', stage: 'entrega', deadline: '2024-01-25', status: 'ok', blockage: null, responsible: 'Lucas Diretor', progress: 95, createdAt: '2023-12-15' },
  { id: 'proj-4', dealId: 'deal-2', accountName: 'Restaurante Sabor & Arte', title: 'Pacote Reels Janeiro', type: 'reels', stage: 'pos_producao', deadline: '2024-01-30', status: 'em_risco', blockage: 'revisao', responsible: 'Camila Produtora', progress: 70, createdAt: '2024-01-10' },
  { id: 'proj-5', dealId: 'deal-1', accountName: 'Incorporadora Vista Mar', title: 'Institucional Empreendimento', type: 'filme_institucional', stage: 'pre_producao', deadline: '2024-03-01', status: 'atrasado', blockage: 'pagamento', responsible: 'Lucas Diretor', progress: 15, createdAt: '2024-01-15' },
];

// Mock Deliveries
export const deliveries: Delivery[] = [
  { id: 'del-1', projectId: 'proj-1', projectTitle: 'Vídeos de Portfólio', accountName: 'Arquiteto João Silva', type: 'Vídeo Principal', dueDate: '2024-01-28', status: 'em_andamento' },
  { id: 'del-2', projectId: 'proj-3', projectTitle: 'Drone Obra + Timelapse', accountName: 'Construtora Horizonte', type: 'Entrega Final', dueDate: '2024-01-26', status: 'pronto' },
  { id: 'del-3', projectId: 'proj-4', projectTitle: 'Pacote Reels Janeiro', accountName: 'Restaurante Sabor & Arte', type: 'Lote 1 (5 reels)', dueDate: '2024-01-29', status: 'em_andamento' },
  { id: 'del-4', projectId: 'proj-2', projectTitle: 'Campanha Coleção Verão', accountName: 'Boutique Maria Clara', type: 'Teaser', dueDate: '2024-01-31', status: 'pendente' },
  { id: 'del-5', projectId: 'proj-1', projectTitle: 'Vídeos de Portfólio', accountName: 'Arquiteto João Silva', type: 'Cortes Redes Sociais', dueDate: '2024-02-02', status: 'pendente' },
];

// Mock Invoices
export const invoices: Invoice[] = [
  { id: 'inv-1', projectId: 'proj-1', accountId: 'acc-4', accountName: 'Arquiteto João Silva', projectTitle: 'Vídeos de Portfólio', amount: 7500, dueDate: '2024-01-25', status: 'pendente', daysOverdue: 0, installment: '1/2', paymentHistory: [] },
  { id: 'inv-2', projectId: 'proj-2', accountId: 'acc-7', accountName: 'Boutique Maria Clara', projectTitle: 'Campanha Coleção Verão', amount: 9000, dueDate: '2024-01-20', status: 'vencido', daysOverdue: 5, installment: '1/2', paymentHistory: [{ date: '2024-01-21', action: 'Lembrete D+1 enviado' }, { date: '2024-01-23', action: 'Lembrete D+3 enviado' }] },
  { id: 'inv-3', projectId: 'proj-3', accountId: 'acc-8', accountName: 'Construtora Horizonte', projectTitle: 'Drone Obra + Timelapse', amount: 17500, dueDate: '2024-01-15', status: 'pago', daysOverdue: 0, installment: '2/2', paymentHistory: [{ date: '2024-01-14', action: 'Pagamento confirmado' }] },
  { id: 'inv-4', projectId: 'proj-4', accountId: 'acc-2', accountName: 'Restaurante Sabor & Arte', projectTitle: 'Pacote Reels Janeiro', amount: 4250, dueDate: '2024-01-28', status: 'pendente', daysOverdue: 0, installment: '1/2', paymentHistory: [{ date: '2024-01-25', action: 'Lembrete D-3 enviado' }] },
  { id: 'inv-5', projectId: 'proj-5', accountId: 'acc-1', accountName: 'Incorporadora Vista Mar', projectTitle: 'Institucional Empreendimento', amount: 22500, dueDate: '2024-01-10', status: 'vencido', daysOverdue: 15, installment: '1/2 (Entrada)', paymentHistory: [{ date: '2024-01-11', action: 'Lembrete D+1 enviado' }, { date: '2024-01-13', action: 'Lembrete D+3 enviado' }, { date: '2024-01-17', action: 'Lembrete D+7 enviado' }] },
  { id: 'inv-6', projectId: 'proj-2', accountId: 'acc-7', accountName: 'Boutique Maria Clara', projectTitle: 'Campanha Coleção Verão', amount: 9000, dueDate: '2024-02-20', status: 'pendente', daysOverdue: 0, installment: '2/2', paymentHistory: [] },
];

// Mock Events (Audit Log)
export const events: Event[] = [
  { id: 'evt-1', timestamp: '2024-01-25T11:30:00', actor: 'Ana Paula', action: 'Proposta enviada', entityType: 'deal', entityId: 'deal-1', entityName: 'Vista Mar - Institucional', description: 'Proposta de R$ 45.000 enviada por email' },
  { id: 'evt-2', timestamp: '2024-01-25T10:15:00', actor: 'Sistema', action: 'Cobrança D+5 enviada', entityType: 'invoice', entityId: 'inv-2', entityName: 'Boutique Maria Clara', description: 'Cobrança automática para fatura vencida' },
  { id: 'evt-3', timestamp: '2024-01-25T09:45:00', actor: 'Pedro Santos', action: 'Follow up realizado', entityType: 'deal', entityId: 'deal-2', entityName: 'Sabor & Arte - Reels', description: 'Ligação de 15min para negociação' },
  { id: 'evt-4', timestamp: '2024-01-24T17:00:00', actor: 'Lucas Diretor', action: 'Entrega pronta', entityType: 'delivery', entityId: 'del-2', entityName: 'Construtora Horizonte', description: 'Vídeo final exportado e pronto para envio' },
  { id: 'evt-5', timestamp: '2024-01-24T15:30:00', actor: 'Camila Produtora', action: 'Revisão solicitada', entityType: 'project', entityId: 'proj-4', entityName: 'Sabor & Arte - Reels', description: 'Cliente pediu ajustes na colorização' },
  { id: 'evt-6', timestamp: '2024-01-24T14:00:00', actor: 'Sistema', action: 'Pagamento confirmado', entityType: 'invoice', entityId: 'inv-3', entityName: 'Construtora Horizonte', description: 'PIX recebido - R$ 17.500' },
  { id: 'evt-7', timestamp: '2024-01-24T11:20:00', actor: 'Ana Paula', action: 'Contrato assinado', entityType: 'contract', entityId: 'deal-4', entityName: 'Arquiteto João Silva', description: 'Contrato digital assinado via DocuSign' },
  { id: 'evt-8', timestamp: '2024-01-24T10:00:00', actor: 'Pedro Santos', action: 'Lead qualificado', entityType: 'deal', entityId: 'deal-6', entityName: 'Advocacia Martins', description: 'Novo lead com potencial alto' },
  { id: 'evt-9', timestamp: '2024-01-23T16:45:00', actor: 'Sistema', action: 'Lembrete D-3 enviado', entityType: 'invoice', entityId: 'inv-4', entityName: 'Sabor & Arte', description: 'Lembrete automático de vencimento' },
  { id: 'evt-10', timestamp: '2024-01-23T14:30:00', actor: 'Lucas Diretor', action: 'Gravação concluída', entityType: 'project', entityId: 'proj-1', entityName: 'Arquiteto João Silva', description: 'Diária de gravação finalizada com sucesso' },
  { id: 'evt-11', timestamp: '2024-01-23T11:00:00', actor: 'Ana Paula', action: 'Deal movido', entityType: 'deal', entityId: 'deal-7', entityName: 'Boutique Maria Clara', description: 'Movido para Onboarding' },
  { id: 'evt-12', timestamp: '2024-01-23T09:15:00', actor: 'Sistema', action: 'Cobrança D+7 enviada', entityType: 'invoice', entityId: 'inv-5', entityName: 'Vista Mar', description: 'Trava operacional acionada' },
  { id: 'evt-13', timestamp: '2024-01-22T17:30:00', actor: 'Camila Produtora', action: 'Briefing incompleto', entityType: 'project', entityId: 'proj-2', entityName: 'Boutique Maria Clara', description: 'Aguardando fotos dos produtos' },
  { id: 'evt-14', timestamp: '2024-01-22T15:00:00', actor: 'Pedro Santos', action: 'Proposta aceita', entityType: 'deal', entityId: 'deal-4', entityName: 'Arquiteto João Silva', description: 'Cliente aceitou proposta de R$ 15.000' },
  { id: 'evt-15', timestamp: '2024-01-22T10:30:00', actor: 'Ana Paula', action: 'Call realizada', entityType: 'deal', entityId: 'deal-3', entityName: 'Clínica Premium', description: 'Diagnóstico de necessidades - 45min' },
];

// Helper functions
export const getStageLabel = (stage: Deal['stage']): string => {
  const labels: Record<Deal['stage'], string> = {
    lead: 'Lead',
    qualificacao: 'Qualificação',
    diagnostico: 'Diagnóstico',
    proposta: 'Proposta',
    negociacao: 'Negociação',
    fechado: 'Fechado',
    onboarding: 'Onboarding',
    pos_venda: 'Pós-venda',
  };
  return labels[stage];
};

export const getProjectStageLabel = (stage: Project['stage']): string => {
  const labels: Record<Project['stage'], string> = {
    briefing: 'Briefing',
    pre_producao: 'Pré-produção',
    producao: 'Produção',
    pos_producao: 'Pós-produção',
    revisao: 'Revisão',
    entrega: 'Entrega',
    finalizado: 'Finalizado',
  };
  return labels[stage];
};

export const getIntentLabel = (intent: Conversation['intent']): string => {
  const labels: Record<Conversation['intent'], string> = {
    orcamento: 'Orçamento',
    prazo: 'Prazo',
    objecao: 'Objeção',
    suporte: 'Suporte',
    cobranca: 'Cobrança',
    geral: 'Geral',
  };
  return labels[intent];
};

export const getChannelLabel = (channel: Conversation['channel']): string => {
  const labels: Record<Conversation['channel'], string> = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    email: 'Email',
  };
  return labels[channel];
};

// KPI Data
export const todayKPIs = {
  newLeads: 3,
  responsesReceived: 7,
  callsScheduled: 2,
  proposalsSent: 1,
  expectedPayments: 7500,
  deliveriesIn7Days: 4,
};

// Pipeline summary
export const pipelineSummary = [
  { stage: 'lead', label: 'Lead', count: 1, value: 22000 },
  { stage: 'qualificacao', label: 'Qualificação', count: 1, value: 28000 },
  { stage: 'diagnostico', label: 'Diagnóstico', count: 1, value: 32000 },
  { stage: 'proposta', label: 'Proposta', count: 1, value: 45000 },
  { stage: 'negociacao', label: 'Negociação', count: 1, value: 8500 },
  { stage: 'fechado', label: 'Fechado', count: 1, value: 15000 },
  { stage: 'onboarding', label: 'Onboarding', count: 1, value: 18000 },
  { stage: 'pos_venda', label: 'Pós-venda', count: 1, value: 35000 },
];

// Cash flow forecast (30 days)
export const cashFlowForecast = [
  { date: '25/01', expected: 7500, received: 0 },
  { date: '26/01', expected: 0, received: 0 },
  { date: '27/01', expected: 0, received: 0 },
  { date: '28/01', expected: 4250, received: 0 },
  { date: '29/01', expected: 0, received: 0 },
  { date: '30/01', expected: 0, received: 0 },
  { date: '31/01', expected: 0, received: 0 },
  { date: '01/02', expected: 0, received: 0 },
  { date: '05/02', expected: 7500, received: 0 },
  { date: '10/02', expected: 4250, received: 0 },
  { date: '15/02', expected: 22500, received: 0 },
  { date: '20/02', expected: 9000, received: 0 },
];

// Critical alerts
export const criticalAlerts = [
  { id: 'alert-1', type: 'proposal_no_followup', label: 'Propostas sem follow up em 24h', count: 2, items: [deals[0], deals[4]] },
  { id: 'alert-2', type: 'contract_unsigned', label: 'Contratos gerados e não assinados', count: 1, items: [deals[1]] },
  { id: 'alert-3', type: 'unpaid_started', label: 'Entrada não paga e projeto iniciado', count: 1, items: [projects[4]] },
  { id: 'alert-4', type: 'delivery_blocked', label: 'Entrega pronta bloqueada por inadimplência', count: 1, items: [deliveries[1]] },
  { id: 'alert-5', type: 'no_briefing', label: 'Projeto sem briefing completo', count: 1, items: [projects[1]] },
  { id: 'alert-6', type: 'hot_deal_no_action', label: 'Deal quente sem próxima ação', count: 2, items: [deals[2], deals[4]] },
];

// Today's prioritized actions
export const todayActions = {
  commercial: [
    { id: 'act-1', task: 'Follow up proposta Vista Mar', entity: 'deal-1', entityName: 'Vista Mar', deadline: '10:00', done: false },
    { id: 'act-2', task: 'Ligar para Clínica Premium', entity: 'deal-3', entityName: 'Clínica Premium', deadline: '11:30', done: false },
    { id: 'act-3', task: 'Enviar proposta Tech Solutions', entity: 'deal-5', entityName: 'Tech Solutions', deadline: '14:00', done: false },
    { id: 'act-4', task: 'Confirmar call Dr. Paulo', entity: 'deal-6', entityName: 'Advocacia Martins', deadline: '15:00', done: false },
    { id: 'act-5', task: 'Negociar desconto Sabor & Arte', entity: 'deal-2', entityName: 'Sabor & Arte', deadline: '16:30', done: false },
  ],
  financial: [
    { id: 'act-6', task: 'Cobrar Boutique Maria Clara', entity: 'inv-2', entityName: 'Boutique Maria Clara', deadline: '09:00', done: false },
    { id: 'act-7', task: 'Cobrar Vista Mar (D+15)', entity: 'inv-5', entityName: 'Vista Mar', deadline: '10:00', done: false },
    { id: 'act-8', task: 'Confirmar recebimento João Silva', entity: 'inv-1', entityName: 'Arquiteto João Silva', deadline: '17:00', done: false },
  ],
  operational: [
    { id: 'act-9', task: 'Coletar briefing Boutique', entity: 'proj-2', entityName: 'Boutique Maria Clara', deadline: '11:00', done: false },
    { id: 'act-10', task: 'Revisar corte Sabor & Arte', entity: 'proj-4', entityName: 'Sabor & Arte', deadline: '14:00', done: false },
    { id: 'act-11', task: 'Entregar vídeo Construtora', entity: 'proj-3', entityName: 'Construtora Horizonte', deadline: '16:00', done: false },
  ],
};
