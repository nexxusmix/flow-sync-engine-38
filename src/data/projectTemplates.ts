import { ProjectTemplateConfig, ProjectStageType, ProjectTemplate } from '@/types/projects';

export const PROJECT_STAGES: { type: ProjectStageType; name: string; order: number }[] = [
  { type: 'briefing', name: 'Briefing', order: 1 },
  { type: 'roteiro', name: 'Roteiro', order: 2 },
  { type: 'pre_producao', name: 'Pré-produção', order: 3 },
  { type: 'captacao', name: 'Captação', order: 4 },
  { type: 'edicao', name: 'Edição', order: 5 },
  { type: 'revisao', name: 'Revisão', order: 6 },
  { type: 'aprovacao', name: 'Aprovação', order: 7 },
  { type: 'entrega', name: 'Entrega', order: 8 },
  { type: 'pos_venda', name: 'Pós-venda', order: 9 },
];

export const PROJECT_TEMPLATES: ProjectTemplateConfig[] = [
  {
    id: 'filme_institucional',
    name: 'Filme Institucional',
    description: 'Vídeo institucional completo com captação, edição e entrega final',
    defaultStages: ['briefing', 'roteiro', 'pre_producao', 'captacao', 'edicao', 'revisao', 'aprovacao', 'entrega', 'pos_venda'],
    defaultRevisionLimit: 2,
    defaultSLADays: 30,
    defaultChecklist: [
      { stageId: 'briefing', title: 'Reunião de briefing realizada', isCritical: true, status: 'pendente' },
      { stageId: 'briefing', title: 'Documento de briefing aprovado', isCritical: true, status: 'pendente' },
      { stageId: 'briefing', title: 'Referências visuais coletadas', isCritical: false, status: 'pendente' },
      { stageId: 'roteiro', title: 'Roteiro redigido', isCritical: true, status: 'pendente' },
      { stageId: 'roteiro', title: 'Roteiro aprovado pelo cliente', isCritical: true, status: 'pendente' },
      { stageId: 'pre_producao', title: 'Locação definida', isCritical: true, status: 'pendente' },
      { stageId: 'pre_producao', title: 'Equipe escalada', isCritical: true, status: 'pendente' },
      { stageId: 'pre_producao', title: 'Equipamentos reservados', isCritical: false, status: 'pendente' },
      { stageId: 'captacao', title: 'Diária 1 realizada', isCritical: true, status: 'pendente' },
      { stageId: 'captacao', title: 'Backup dos brutos realizado', isCritical: true, status: 'pendente' },
      { stageId: 'edicao', title: 'Corte 1 finalizado', isCritical: true, status: 'pendente' },
      { stageId: 'edicao', title: 'Colorização aplicada', isCritical: false, status: 'pendente' },
      { stageId: 'edicao', title: 'Trilha sonora adicionada', isCritical: false, status: 'pendente' },
      { stageId: 'revisao', title: 'Comentários do cliente coletados', isCritical: true, status: 'pendente' },
      { stageId: 'revisao', title: 'Ajustes aplicados', isCritical: true, status: 'pendente' },
      { stageId: 'aprovacao', title: 'Aprovação formal recebida', isCritical: true, status: 'pendente' },
      { stageId: 'entrega', title: 'Arquivos finais exportados', isCritical: true, status: 'pendente' },
      { stageId: 'entrega', title: 'Entrega realizada via portal', isCritical: true, status: 'pendente' },
    ],
    defaultDeliverables: [
      { title: 'Corte 1', type: 'video' },
      { title: 'Corte 2 (Revisado)', type: 'video' },
      { title: 'Versão Final', type: 'video' },
      { title: 'Versão para Redes (Vertical)', type: 'video' },
    ],
  },
  {
    id: 'filme_produto',
    name: 'Filme de Produto',
    description: 'Vídeo focado em produto com captação em estúdio',
    defaultStages: ['briefing', 'roteiro', 'pre_producao', 'captacao', 'edicao', 'revisao', 'aprovacao', 'entrega'],
    defaultRevisionLimit: 2,
    defaultSLADays: 21,
    defaultChecklist: [
      { stageId: 'briefing', title: 'Briefing de produto coletado', isCritical: true, status: 'pendente' },
      { stageId: 'briefing', title: 'Produto recebido', isCritical: true, status: 'pendente' },
      { stageId: 'roteiro', title: 'Shot list definido', isCritical: true, status: 'pendente' },
      { stageId: 'pre_producao', title: 'Estúdio reservado', isCritical: true, status: 'pendente' },
      { stageId: 'captacao', title: 'Captação realizada', isCritical: true, status: 'pendente' },
      { stageId: 'edicao', title: 'Edição finalizada', isCritical: true, status: 'pendente' },
      { stageId: 'revisao', title: 'Revisão aplicada', isCritical: true, status: 'pendente' },
      { stageId: 'aprovacao', title: 'Aprovação recebida', isCritical: true, status: 'pendente' },
      { stageId: 'entrega', title: 'Entrega realizada', isCritical: true, status: 'pendente' },
    ],
    defaultDeliverables: [
      { title: 'Vídeo Principal', type: 'video' },
      { title: 'Versão 15s', type: 'video' },
      { title: 'Versão Stories', type: 'video' },
    ],
  },
  {
    id: 'aftermovie',
    name: 'Aftermovie',
    description: 'Cobertura e edição de evento',
    defaultStages: ['briefing', 'pre_producao', 'captacao', 'edicao', 'revisao', 'aprovacao', 'entrega'],
    defaultRevisionLimit: 2,
    defaultSLADays: 14,
    defaultChecklist: [
      { stageId: 'briefing', title: 'Briefing do evento', isCritical: true, status: 'pendente' },
      { stageId: 'pre_producao', title: 'Credenciamento confirmado', isCritical: true, status: 'pendente' },
      { stageId: 'captacao', title: 'Cobertura realizada', isCritical: true, status: 'pendente' },
      { stageId: 'edicao', title: 'Corte 1 finalizado', isCritical: true, status: 'pendente' },
      { stageId: 'revisao', title: 'Revisão aplicada', isCritical: true, status: 'pendente' },
      { stageId: 'aprovacao', title: 'Aprovação recebida', isCritical: true, status: 'pendente' },
      { stageId: 'entrega', title: 'Entrega realizada', isCritical: true, status: 'pendente' },
    ],
    defaultDeliverables: [
      { title: 'Aftermovie Completo', type: 'video' },
      { title: 'Teaser', type: 'video' },
    ],
  },
  {
    id: 'reels_pacote',
    name: 'Reels (Pacote)',
    description: 'Pacote de vídeos curtos para redes sociais',
    defaultStages: ['briefing', 'captacao', 'edicao', 'revisao', 'aprovacao', 'entrega'],
    defaultRevisionLimit: 3,
    defaultSLADays: 7,
    defaultChecklist: [
      { stageId: 'briefing', title: 'Pautas definidas', isCritical: true, status: 'pendente' },
      { stageId: 'captacao', title: 'Captação realizada', isCritical: true, status: 'pendente' },
      { stageId: 'edicao', title: 'Edição finalizada', isCritical: true, status: 'pendente' },
      { stageId: 'revisao', title: 'Revisões aplicadas', isCritical: true, status: 'pendente' },
      { stageId: 'aprovacao', title: 'Aprovação recebida', isCritical: true, status: 'pendente' },
      { stageId: 'entrega', title: 'Entrega realizada', isCritical: true, status: 'pendente' },
    ],
    defaultDeliverables: [
      { title: 'Reel 1', type: 'video' },
      { title: 'Reel 2', type: 'video' },
      { title: 'Reel 3', type: 'video' },
      { title: 'Reel 4', type: 'video' },
    ],
  },
  {
    id: 'foto_pacote',
    name: 'Foto (Pacote)',
    description: 'Ensaio fotográfico com tratamento',
    defaultStages: ['briefing', 'captacao', 'edicao', 'aprovacao', 'entrega'],
    defaultRevisionLimit: 2,
    defaultSLADays: 5,
    defaultChecklist: [
      { stageId: 'briefing', title: 'Briefing coletado', isCritical: true, status: 'pendente' },
      { stageId: 'captacao', title: 'Ensaio realizado', isCritical: true, status: 'pendente' },
      { stageId: 'edicao', title: 'Seleção e tratamento', isCritical: true, status: 'pendente' },
      { stageId: 'aprovacao', title: 'Aprovação recebida', isCritical: true, status: 'pendente' },
      { stageId: 'entrega', title: 'Entrega realizada', isCritical: true, status: 'pendente' },
    ],
    defaultDeliverables: [
      { title: 'Galeria Completa', type: 'zip' },
      { title: 'Fotos Selecionadas (Alta)', type: 'zip' },
      { title: 'Fotos para Web', type: 'zip' },
    ],
  },
  {
    id: 'tour_360',
    name: 'Tour 360',
    description: 'Tour virtual em 360 graus',
    defaultStages: ['briefing', 'pre_producao', 'captacao', 'edicao', 'aprovacao', 'entrega'],
    defaultRevisionLimit: 1,
    defaultSLADays: 10,
    defaultChecklist: [
      { stageId: 'briefing', title: 'Briefing e escopo definidos', isCritical: true, status: 'pendente' },
      { stageId: 'pre_producao', title: 'Agendamento de visita', isCritical: true, status: 'pendente' },
      { stageId: 'captacao', title: 'Captação 360 realizada', isCritical: true, status: 'pendente' },
      { stageId: 'edicao', title: 'Stitching e edição', isCritical: true, status: 'pendente' },
      { stageId: 'aprovacao', title: 'Aprovação recebida', isCritical: true, status: 'pendente' },
      { stageId: 'entrega', title: 'Tour publicado', isCritical: true, status: 'pendente' },
    ],
    defaultDeliverables: [
      { title: 'Tour 360 Interativo', type: 'outro' },
      { title: 'Fotos 360 (Individuais)', type: 'zip' },
    ],
  },
  {
    id: 'motion_vinheta',
    name: 'Motion / Vinheta',
    description: 'Animação ou vinheta em motion graphics',
    defaultStages: ['briefing', 'roteiro', 'pre_producao', 'edicao', 'revisao', 'aprovacao', 'entrega'],
    defaultRevisionLimit: 2,
    defaultSLADays: 14,
    defaultChecklist: [
      { stageId: 'briefing', title: 'Briefing coletado', isCritical: true, status: 'pendente' },
      { stageId: 'roteiro', title: 'Storyboard aprovado', isCritical: true, status: 'pendente' },
      { stageId: 'pre_producao', title: 'Assets recebidos', isCritical: true, status: 'pendente' },
      { stageId: 'edicao', title: 'Animação finalizada', isCritical: true, status: 'pendente' },
      { stageId: 'revisao', title: 'Revisão aplicada', isCritical: true, status: 'pendente' },
      { stageId: 'aprovacao', title: 'Aprovação recebida', isCritical: true, status: 'pendente' },
      { stageId: 'entrega', title: 'Entrega realizada', isCritical: true, status: 'pendente' },
    ],
    defaultDeliverables: [
      { title: 'Vinheta Principal', type: 'video' },
      { title: 'Versão Curta (5s)', type: 'video' },
      { title: 'Versão Longa (15s)', type: 'video' },
    ],
  },
];

export const getTemplateById = (id: ProjectTemplate): ProjectTemplateConfig | undefined => {
  return PROJECT_TEMPLATES.find(t => t.id === id);
};

export const getStageInfo = (type: ProjectStageType) => {
  return PROJECT_STAGES.find(s => s.type === type);
};

export const STAGE_COLORS: Record<ProjectStageType, string> = {
  briefing: 'bg-slate-500',
  roteiro: 'bg-blue-500',
  pre_producao: 'bg-indigo-500',
  captacao: 'bg-violet-500',
  edicao: 'bg-amber-500',
  revisao: 'bg-orange-500',
  aprovacao: 'bg-emerald-500',
  entrega: 'bg-green-500',
  pos_venda: 'bg-pink-500',
};

export const STATUS_CONFIG = {
  ok: { label: 'Ok', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  em_risco: { label: 'Em Risco', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  atrasado: { label: 'Atrasado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  bloqueado: { label: 'Bloqueado', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
};
