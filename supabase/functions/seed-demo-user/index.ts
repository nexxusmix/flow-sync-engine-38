import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const email = 'gabrielvalledesign@gmail.com';
    const password = '123456789';

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u: any) => u.email === email);
    
    let userId: string;
    if (existing) {
      userId = existing.id;
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Gabriel Valle' },
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    const wsId = 'default';

    // Clean existing demo data for this user
    await supabase.from('tasks').delete().eq('user_id', userId);
    await supabase.from('calendar_events').delete().eq('owner_user_id', userId);

    // ===== CRM CONTACTS =====
    const contacts = [
      { name: 'Studio Aurora', email: 'contato@studioaurora.com', phone: '11999001122', company: 'Studio Aurora Filmes', tags: ['producao', 'video'], workspace_id: wsId, created_by: userId },
      { name: 'Maria Design', email: 'maria@mariadesign.com', phone: '11988112233', company: 'Maria Design Studio', tags: ['design', 'branding'], workspace_id: wsId, created_by: userId },
      { name: 'Empresa Nexus', email: 'comercial@nexus.com.br', phone: '11977223344', company: 'Nexus Tecnologia', tags: ['tech', 'corporativo'], workspace_id: wsId, created_by: userId },
      { name: 'Café Artesanal', email: 'joao@cafeartesanal.com', phone: '11966334455', company: 'Café Artesanal LTDA', tags: ['food', 'reels'], workspace_id: wsId, created_by: userId },
      { name: 'Clínica Vida', email: 'admin@clinicavida.com', phone: '11955445566', company: 'Clínica Vida Saúde', tags: ['saude', 'fotografia'], workspace_id: wsId, created_by: userId },
      { name: 'Tech Solutions', email: 'contato@techsolutions.io', phone: '11944556677', company: 'Tech Solutions SA', tags: ['tech', 'motion'], workspace_id: wsId, created_by: userId },
      { name: 'Imobiliária Prime', email: 'vendas@prime.com.br', phone: '11933667788', company: 'Prime Imóveis', tags: ['imoveis', 'tour360'], workspace_id: wsId, created_by: userId },
      { name: 'Restaurante Sabor', email: 'chef@sabor.com.br', phone: '11922778899', company: 'Restaurante Sabor', tags: ['food', 'social'], workspace_id: wsId, created_by: userId },
    ];

    const { data: insertedContacts } = await supabase.from('crm_contacts').insert(contacts).select('id, name');
    const contactMap: Record<string, string> = {};
    (insertedContacts || []).forEach((c: any) => { contactMap[c.name] = c.id; });

    // ===== PROJECTS =====
    const projects = [
      { name: 'Filme Institucional - Studio Aurora', client_name: 'Studio Aurora', status: 'active', stage_current: 'producao', health_score: 80, contract_value: 15000, start_date: '2026-01-10', due_date: '2026-03-15', owner_name: 'Gabriel Valle', owner_id: userId, workspace_id: wsId, created_by: userId, product_type: 'production' },
      { name: 'Pacote Reels - Café Artesanal', client_name: 'Café Artesanal', status: 'active', stage_current: 'edicao', health_score: 90, contract_value: 4500, start_date: '2026-02-01', due_date: '2026-03-01', owner_name: 'Gabriel Valle', owner_id: userId, workspace_id: wsId, created_by: userId, product_type: 'production' },
      { name: 'Ensaio Fotográfico - Clínica Vida', client_name: 'Clínica Vida', status: 'active', stage_current: 'aprovacao', health_score: 70, contract_value: 3200, start_date: '2026-01-20', due_date: '2026-02-28', owner_name: 'Gabriel Valle', owner_id: userId, workspace_id: wsId, created_by: userId, product_type: 'production' },
      { name: 'Motion Vinheta - Tech Solutions', client_name: 'Tech Solutions', status: 'active', stage_current: 'briefing', health_score: 100, contract_value: 8000, start_date: '2026-02-15', due_date: '2026-04-15', owner_name: 'Gabriel Valle', owner_id: userId, workspace_id: wsId, created_by: userId, product_type: 'production' },
      { name: 'Tour 360 - Imobiliária Prime', client_name: 'Imobiliária Prime', status: 'completed', stage_current: 'concluido', health_score: 100, contract_value: 6000, start_date: '2025-11-01', due_date: '2026-01-30', owner_name: 'Gabriel Valle', owner_id: userId, workspace_id: wsId, created_by: userId, product_type: 'production' },
    ];

    const { data: insertedProjects } = await supabase.from('projects').insert(projects).select('id, name');
    const projectMap: Record<string, string> = {};
    (insertedProjects || []).forEach((p: any) => { projectMap[p.name] = p.id; });

    // ===== PROJECT STAGES =====
    const stageTemplates = ['briefing', 'pre_producao', 'producao', 'edicao', 'aprovacao', 'entrega', 'concluido'];
    const stageTitles: Record<string, string> = { briefing: 'Briefing', pre_producao: 'Pré-Produção', producao: 'Produção', edicao: 'Edição', aprovacao: 'Aprovação', entrega: 'Entrega', concluido: 'Concluído' };
    
    const projectStages: any[] = [];
    for (const [pName, pId] of Object.entries(projectMap)) {
      let currentStageIdx = 0;
      if (pName.includes('Aurora')) currentStageIdx = 2;
      else if (pName.includes('Café')) currentStageIdx = 3;
      else if (pName.includes('Clínica')) currentStageIdx = 4;
      else if (pName.includes('Tech')) currentStageIdx = 0;
      else if (pName.includes('Prime')) currentStageIdx = 6;

      stageTemplates.forEach((sk, i) => {
        projectStages.push({
          project_id: pId,
          stage_key: sk,
          title: stageTitles[sk],
          order_index: i,
          status: i < currentStageIdx ? 'completed' : i === currentStageIdx ? 'in_progress' : 'not_started',
        });
      });
    }
    await supabase.from('project_stages').insert(projectStages);

    // ===== CRM DEALS =====
    const deals = [
      { contact_id: contactMap['Studio Aurora'], title: 'Filme Institucional 2026', stage_key: 'fechado', value: 15000, source: 'indicacao', score: 95, temperature: 'hot', workspace_id: wsId, created_by: userId },
      { contact_id: contactMap['Café Artesanal'], title: 'Pacote Reels Mensal', stage_key: 'onboarding', value: 4500, source: 'instagram', score: 80, temperature: 'hot', workspace_id: wsId, created_by: userId },
      { contact_id: contactMap['Empresa Nexus'], title: 'Video Corporativo', stage_key: 'proposta', value: 12000, source: 'site', score: 60, temperature: 'warm', workspace_id: wsId, created_by: userId },
      { contact_id: contactMap['Restaurante Sabor'], title: 'Conteúdo Social Media', stage_key: 'qualificacao', value: 3000, source: 'instagram', score: 40, temperature: 'warm', workspace_id: wsId, created_by: userId },
      { contact_id: contactMap['Maria Design'], title: 'Video de Portfólio', stage_key: 'lead', value: 5000, source: 'indicacao', score: 20, temperature: 'cold', workspace_id: wsId, created_by: userId },
      { contact_id: contactMap['Tech Solutions'], title: 'Motion Vinheta', stage_key: 'negociacao', value: 8000, source: 'linkedin', score: 75, temperature: 'hot', workspace_id: wsId, created_by: userId },
    ];
    await supabase.from('crm_deals').insert(deals);

    // ===== REVENUES =====
    const pIdAurora = projectMap['Filme Institucional - Studio Aurora'];
    const pIdCafe = projectMap['Pacote Reels - Café Artesanal'];
    const pIdClinica = projectMap['Ensaio Fotográfico - Clínica Vida'];
    const pIdTech = projectMap['Motion Vinheta - Tech Solutions'];
    const pIdPrime = projectMap['Tour 360 - Imobiliária Prime'];

    const revenues = [
      { project_id: pIdAurora, description: 'Entrada - Filme Institucional', amount: 7500, due_date: '2026-01-15', received_date: '2026-01-15', status: 'received', payment_method: 'pix' },
      { project_id: pIdAurora, description: 'Parcela 2 - Filme Institucional', amount: 7500, due_date: '2026-03-15', status: 'pending', payment_method: 'pix' },
      { project_id: pIdCafe, description: 'Pacote Reels - Fevereiro', amount: 4500, due_date: '2026-02-05', received_date: '2026-02-05', status: 'received', payment_method: 'transferencia' },
      { project_id: pIdClinica, description: 'Ensaio Fotográfico - Entrada', amount: 1600, due_date: '2026-01-25', received_date: '2026-01-26', status: 'received', payment_method: 'pix' },
      { project_id: pIdClinica, description: 'Ensaio Fotográfico - Final', amount: 1600, due_date: '2026-02-28', status: 'pending', payment_method: 'boleto' },
      { project_id: pIdTech, description: 'Sinal - Motion Vinheta', amount: 4000, due_date: '2026-02-20', status: 'pending', payment_method: 'pix' },
      { project_id: pIdPrime, description: 'Tour 360 - Pagamento', amount: 6000, due_date: '2026-01-30', received_date: '2026-01-30', status: 'received', payment_method: 'pix' },
      { description: 'Freelance - Edição avulsa', amount: 1200, due_date: '2026-01-10', status: 'overdue', payment_method: 'pix' },
    ];
    await supabase.from('revenues').insert(revenues);

    // ===== EXPENSES =====
    const expenses = [
      { category: 'equipamento', description: 'Aluguel de lente 24-70mm', amount: 350, due_date: '2026-02-10', status: 'paid', paid_date: '2026-02-10', supplier: 'LensRent' },
      { category: 'software', description: 'Adobe Creative Cloud - Mensal', amount: 290, due_date: '2026-02-15', status: 'pending', supplier: 'Adobe' },
      { category: 'freelancer', description: 'Editor freelancer - Reels', amount: 1500, due_date: '2026-02-20', status: 'pending', supplier: 'Lucas Editor' },
      { category: 'transporte', description: 'Uber - Sessão fotográfica', amount: 85, due_date: '2026-02-08', status: 'paid', paid_date: '2026-02-08', supplier: 'Uber' },
      { category: 'marketing', description: 'Boost Instagram - Fevereiro', amount: 500, due_date: '2026-02-01', status: 'paid', paid_date: '2026-02-01', supplier: 'Meta Ads' },
      { category: 'other', description: 'Seguro equipamento', amount: 180, due_date: '2026-03-01', status: 'pending', supplier: 'SeguraPro' },
    ];
    await supabase.from('expenses').insert(expenses);

    // ===== CAMPAIGN =====
    const { data: campaignData } = await supabase.from('campaigns').insert({
      name: 'Lançamento Verão 2026',
      objective: 'Aumentar visibilidade e atrair novos clientes para pacotes de verão',
      audience: 'Empreendedores e pequenas empresas',
      status: 'active',
      start_date: '2026-02-01',
      end_date: '2026-03-31',
      budget: 2000,
      workspace_id: wsId,
    }).select('id').single();

    // ===== CONTENT ITEMS =====
    const campaignId = campaignData?.id;
    const contentItems = [
      { title: 'Bastidores: Filmagem Institucional', status: 'published', channel: 'instagram', format: 'reels', hook: 'Olha como foi gravar esse institucional!', pillar: 'autoridade', published_at: '2026-02-10T10:00:00Z', campaign_id: campaignId, workspace_id: wsId },
      { title: 'Dicas de Iluminação para Reels', status: 'scheduled', channel: 'instagram', format: 'carrossel', hook: '5 dicas pro para iluminar seus reels', pillar: 'educacao', scheduled_at: '2026-02-20T14:00:00Z', campaign_id: campaignId, workspace_id: wsId },
      { title: 'Case Study: Tour 360 Imobiliária', status: 'approved', channel: 'youtube', format: 'video', hook: 'Como criamos um tour virtual completo', pillar: 'case', workspace_id: wsId },
      { title: 'Tendências de Vídeo 2026', status: 'review', channel: 'linkedin', format: 'artigo', hook: 'O futuro do conteúdo audiovisual', pillar: 'tendencia', workspace_id: wsId },
      { title: 'Motion Design: Antes e Depois', status: 'draft', channel: 'tiktok', format: 'reels', hook: 'Transformação incrível em motion', pillar: 'portfolio', workspace_id: wsId },
      { title: 'Equipamentos que Uso em 2026', status: 'idea', channel: 'youtube', format: 'video', hook: 'Setup completo de câmera e lentes', pillar: 'educacao', workspace_id: wsId },
      { title: 'Depoimento: Cliente Café Artesanal', status: 'published', channel: 'instagram', format: 'stories', hook: 'Veja o que nosso cliente achou', pillar: 'prova_social', published_at: '2026-02-12T16:00:00Z', workspace_id: wsId },
      { title: 'Workflow de Edição Profissional', status: 'draft', channel: 'youtube', format: 'video', hook: 'Do bruto ao final em 10 passos', pillar: 'educacao', workspace_id: wsId },
      { title: 'Reels: Dia de Gravação', status: 'scheduled', channel: 'tiktok', format: 'reels', hook: 'Um dia inteiro de gravação em 60s', pillar: 'bastidores', scheduled_at: '2026-02-25T12:00:00Z', campaign_id: campaignId, workspace_id: wsId },
      { title: 'Como Precificar Serviços Criativos', status: 'idea', channel: 'linkedin', format: 'artigo', hook: 'Guia prático de precificação', pillar: 'educacao', workspace_id: wsId },
    ];
    await supabase.from('content_items').insert(contentItems);

    // ===== TASKS =====
    const tasks = [
      { user_id: userId, title: 'Revisar corte final - Studio Aurora', description: 'Assistir o corte final e anotar ajustes', status: 'today', category: 'projeto', tags: ['video', 'revisao'], due_date: '2026-02-17', priority: 'alta', position: 0 },
      { user_id: userId, title: 'Enviar proposta para Nexus', description: 'Preparar e enviar proposta de vídeo corporativo', status: 'today', category: 'operacao', tags: ['proposta', 'crm'], due_date: '2026-02-18', priority: 'urgente', position: 1 },
      { user_id: userId, title: 'Gravar reels Café Artesanal', description: 'Sessão de gravação de 4 reels', status: 'week', category: 'projeto', tags: ['reels', 'gravacao'], due_date: '2026-02-22', priority: 'normal', position: 0 },
      { user_id: userId, title: 'Editar vinheta motion Tech Solutions', description: 'Primeira versão da vinheta animada', status: 'week', category: 'projeto', tags: ['motion', 'edicao'], due_date: '2026-02-25', priority: 'normal', position: 1 },
      { user_id: userId, title: 'Postar case Tour 360 no YouTube', description: 'Upload e configurar SEO do vídeo', status: 'backlog', category: 'operacao', tags: ['youtube', 'marketing'], priority: 'normal', position: 0 },
      { user_id: userId, title: 'Atualizar portfólio no site', description: 'Adicionar últimos 3 projetos concluídos', status: 'backlog', category: 'pessoal', tags: ['portfolio', 'site'], priority: 'normal', position: 1 },
      { user_id: userId, title: 'Reunião com Maria Design', description: 'Alinhamento sobre vídeo de portfólio', status: 'done', category: 'operacao', tags: ['reuniao', 'crm'], completed_at: '2026-02-14T15:00:00Z', priority: 'normal', position: 0 },
      { user_id: userId, title: 'Backup de arquivos do mês', description: 'Backup completo dos projetos de janeiro', status: 'done', category: 'pessoal', tags: ['backup', 'organizacao'], completed_at: '2026-02-10T18:00:00Z', priority: 'normal', position: 1 },
    ];
    await supabase.from('tasks').insert(tasks);

    // ===== PROPOSALS =====
    const proposals = [
      { title: 'Proposta - Vídeo Corporativo Nexus', client_name: 'Empresa Nexus', client_email: 'comercial@nexus.com.br', status: 'sent', total_value: 12000, valid_until: '2026-03-15', created_by: userId, notes_internal: 'Cliente pediu opção com drone' },
      { title: 'Proposta - Conteúdo Social Restaurante Sabor', client_name: 'Restaurante Sabor', client_email: 'chef@sabor.com.br', status: 'approved', total_value: 3000, valid_until: '2026-03-01', created_by: userId, notes_internal: 'Aprovado via WhatsApp' },
    ];
    await supabase.from('proposals').insert(proposals);

    // ===== CALENDAR EVENTS =====
    const calendarEvents = [
      { title: 'Reunião de Briefing - Tech Solutions', start_at: '2026-02-19T10:00:00Z', end_at: '2026-02-19T11:00:00Z', event_type: 'meeting', provider: 'manual', owner_user_id: userId, workspace_id: wsId, color: '#00A3D3' },
      { title: 'Gravação - Café Artesanal', start_at: '2026-02-22T08:00:00Z', end_at: '2026-02-22T14:00:00Z', event_type: 'production', provider: 'manual', owner_user_id: userId, workspace_id: wsId, color: '#10B981' },
      { title: 'Entrega Final - Clínica Vida', start_at: '2026-02-28T18:00:00Z', end_at: '2026-02-28T19:00:00Z', event_type: 'delivery', provider: 'manual', owner_user_id: userId, workspace_id: wsId, color: '#F59E0B' },
      { title: 'Review Vinheta - Tech Solutions', start_at: '2026-03-05T14:00:00Z', end_at: '2026-03-05T15:00:00Z', event_type: 'review', provider: 'manual', owner_user_id: userId, workspace_id: wsId, color: '#8B5CF6' },
      { title: 'Entrega Filme - Studio Aurora', start_at: '2026-03-15T10:00:00Z', end_at: '2026-03-15T12:00:00Z', event_type: 'delivery', provider: 'manual', owner_user_id: userId, workspace_id: wsId, color: '#EF4444' },
    ];
    await supabase.from('calendar_events').insert(calendarEvents);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        summary: {
          contacts: insertedContacts?.length || 0,
          projects: insertedProjects?.length || 0,
          deals: deals.length,
          revenues: revenues.length,
          expenses: expenses.length,
          contentItems: contentItems.length,
          tasks: tasks.length,
          proposals: proposals.length,
          calendarEvents: calendarEvents.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
