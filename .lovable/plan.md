
# Plano: Sincronização Completa de Projetos IA com Toda a Plataforma

## Objetivo
Garantir que quando um projeto for criado/processado via IA (de contratos ou propostas), todas as funcionalidades da plataforma sejam atualizadas automaticamente: calendário, timeline, financeiro, e outros módulos.

## Análise do Estado Atual

### O que JÁ está funcionando:
1. **Financeiro**: Criação de contratos, milestones e receitas automáticas
2. **Timeline 30D**: Hook `useTimelineMilestones` já lê dados de projetos e financeiro
3. **Stages do Projeto**: Datas planejadas sendo definidas na criação

### O que FALTA integrar:
1. Calendário geral de projetos (além do calendário de marketing)
2. Notificações/alertas automáticos para prazos
3. Sincronização com Google Calendar (opcional)
4. Dashboard de próximas entregas por período

---

## Implementação

### Fase 1: Criar Calendário Unificado de Projetos

**Novo componente**: `src/components/calendar/ProjectsCalendar.tsx`

Criará um calendário que exibe:
- Entregas de projetos (delivery dates)
- Marcos de pagamento (payment milestones)
- Etapas do projeto (stages)
- Reuniões/eventos (se houver)

```text
┌─────────────────────────────────────────────────────────┐
│  Calendário de Projetos                    [Mês ▼]     │
├─────────────────────────────────────────────────────────┤
│  Dom   Seg   Ter   Qua   Qui   Sex   Sáb               │
├─────────────────────────────────────────────────────────┤
│  ...                                                     │
│        ● Entrega: Institucional 2025                    │
│        💰 Pagamento: Cliente X                          │
│        📋 Captação: Aftermovie                          │
│  ...                                                     │
└─────────────────────────────────────────────────────────┘
```

### Fase 2: Hook de Eventos Unificados

**Novo hook**: `src/hooks/useCalendarEvents.ts`

Agregará eventos de todas as fontes:
- `projectsStore` - entregas e etapas
- `financialStore` - pagamentos e milestones
- `marketingStore` - conteúdos agendados (opcional)

### Fase 3: Melhorar Fluxo de Criação de Projeto

**Editar**: `src/components/projects/modals/NewProjectModal.tsx`

Adicionar chamadas para:
1. Criar eventos no calendário do banco de dados
2. Atualizar timeline automaticamente
3. Disparar notificações/alertas
4. Conectar com Google Calendar (se integração ativa)

### Fase 4: Página de Calendário Geral

**Nova página**: `src/pages/CalendarPage.tsx`

Calendário unificado acessível pelo menu lateral mostrando:
- Todos os prazos de projetos
- Pagamentos a receber/vencer
- Entregas programadas

---

## Alterações Técnicas Detalhadas

### 1. Novo Hook: `useCalendarEvents.ts`

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'delivery' | 'payment' | 'stage' | 'meeting' | 'content';
  projectId?: string;
  projectName?: string;
  severity: 'normal' | 'risk' | 'critical';
  color: string;
}
```

### 2. Tabela no Banco (Supabase)

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL,
  project_id TEXT,
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. Atualizar NewProjectModal

No `handleSubmit`, após criar projeto:
1. Criar eventos de calendário para cada etapa
2. Criar eventos para cada marco de pagamento
3. Criar evento de entrega final

### 4. Rota no App.tsx

```typescript
<Route path="/calendar" element={<CalendarPage />} />
```

### 5. Menu Lateral

Adicionar link "Calendário" no sidebar

---

## Resumo das Tarefas

| # | Tarefa | Arquivo |
|---|--------|---------|
| 1 | Criar hook de eventos de calendário | `src/hooks/useCalendarEvents.ts` |
| 2 | Criar componente calendário projetos | `src/components/calendar/ProjectsCalendar.tsx` |
| 3 | Criar página de calendário | `src/pages/CalendarPage.tsx` |
| 4 | Criar tabela calendar_events | Migration SQL |
| 5 | Atualizar NewProjectModal para criar eventos | `src/components/projects/modals/NewProjectModal.tsx` |
| 6 | Adicionar rota no App | `src/App.tsx` |
| 7 | Adicionar link no Sidebar | `src/components/layout/Sidebar.tsx` |

---

## Fluxo Final

```text
Usuário importa contrato PDF
           ↓
    IA extrai dados
           ↓
    Cria Projeto
           ↓
  ┌────────┴────────┐
  ↓        ↓        ↓
Timeline  Financeiro Calendário
(auto)    Contratos  Eventos
          Milestones Notificações
          Receitas
```

Após aprovação, implementarei todas as integrações para que a plataforma funcione como um sistema unificado.
