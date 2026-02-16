
# Criar Usuario Demo + Tutorial Interativo de Onboarding

## Parte 1: Criar usuario e popular com dados demo

### Criar usuario via Edge Function `seed-demo-user`
Uma Edge Function que:
1. Cria o usuario `gabrielvalledesign@gmail.com` com senha `123456789` via Supabase Admin API
2. Insere dados ficticios completos em todas as tabelas principais

### Dados ficticios a serem criados:

**CRM (8 contatos + 6 deals)**
- Contatos: Studio Aurora, Maria Design, Empresa Nexus, Cafe Artesanal, Clinica Vida, Tech Solutions, Imobiliaria Prime, Restaurante Sabor
- Deals em varios estagios do funil (lead, qualificacao, proposta, negociacao, fechado, onboarding)

**Projetos (5 projetos em estagios diferentes)**
- "Filme Institucional - Studio Aurora" (em producao, 80% concluido)
- "Pacote Reels - Cafe Artesanal" (em edicao)
- "Ensaio Fotografico - Clinica Vida" (em aprovacao)
- "Motion Vinheta - Tech Solutions" (briefing)
- "Tour 360 - Imobiliaria Prime" (concluido)
- Cada projeto com etapas (`project_stages`) preenchidas

**Financeiro**
- 8 receitas (mix de recebidas, pendentes e atrasadas)
- 6 despesas (equipamento, software, freelancers, etc.)

**Marketing (10 content_items)**
- Conteudos em todos os status: idea, draft, review, approved, scheduled, published
- Canais: Instagram, YouTube, TikTok, LinkedIn
- 1 campanha ativa "Lancamento Verao 2026"

**Tarefas (8 tarefas)**
- Mix de todo, in_progress, done
- Com tags, prioridades e datas

**Propostas (2)**
- Uma enviada, outra aprovada

**Eventos de Calendario (5)**
- Reunioes, entregas e marcos nos proximos 30 dias

## Parte 2: Tutorial Dinamico de Onboarding

### Componente `OnboardingTutorial.tsx`
Um overlay animado (framer-motion) que aparece na primeira vez que o usuario acessa o Dashboard.

**Mecanismo de controle:**
- Usa tabela `ui_state` com scope `onboarding_completed` para verificar se ja viu
- Se nao existe registro, mostra o tutorial
- Ao finalizar, salva `{ completed: true }` no `ui_state`

**Fluxo do tutorial (6-8 passos):**
1. **Boas-vindas** - "Bem-vindo ao Hub!" com animacao de entrada
2. **Dashboard** - Destaque nos KPIs e acesso rapido a projetos
3. **Projetos** - Explica o fluxo de producao e etapas
4. **CRM** - Pipeline de vendas e contatos
5. **Financeiro** - Receitas, despesas e fluxo de caixa
6. **Marketing** - Pipeline de conteudo e calendario
7. **Tarefas** - Quadro Kanban e organizacao
8. **Pronto!** - "Explore a vontade. Tudo ja esta com dados de exemplo."

**Design:**
- Modal fullscreen com backdrop blur
- Cada passo tem icone, titulo, descricao curta e ilustracao/animacao
- Barra de progresso com dots
- Botoes "Pular" e "Proximo"
- Animacoes de fade + slide entre passos (framer-motion)

### Aplicar tutorial ao Matheus Filipe
- Deletar o registro de `ui_state` com scope `onboarding_completed` do usuario Matheus (se existir)
- Na proxima vez que ele acessar o Dashboard, o tutorial aparecera automaticamente

## Arquivos a criar/modificar

### Criar:
1. `supabase/functions/seed-demo-user/index.ts` - Edge Function para criar usuario e dados
2. `src/components/onboarding/OnboardingTutorial.tsx` - Componente do tutorial animado
3. `src/components/onboarding/OnboardingStep.tsx` - Componente individual de cada passo

### Modificar:
4. `src/pages/Dashboard.tsx` - Importar e renderizar `OnboardingTutorial`
5. `supabase/config.toml` - Registrar nova Edge Function

## Detalhes Tecnicos

### Edge Function `seed-demo-user`
```
- Usa SUPABASE_SERVICE_ROLE_KEY para criar usuario via admin API
- Insere profile, role assignment (admin), e todos os dados demo
- Retorna sucesso com resumo dos dados criados
```

### OnboardingTutorial - Logica de exibicao
```tsx
// No Dashboard.tsx
const { data: onboardingState } = useQuery({
  queryKey: ['onboarding-state', user?.id],
  queryFn: async () => {
    const { data } = await supabase.from('ui_state')
      .select('state')
      .eq('user_id', user.id)
      .eq('scope', 'onboarding_completed')
      .single();
    return data?.state?.completed ?? false;
  },
});

// Mostrar tutorial se onboardingState === false
```

### Marcacao de conclusao para Matheus
- Inserir via SQL direto: deletar qualquer registro de `ui_state` com scope `onboarding_completed` para o user_id do Matheus
