

# Plano: Remover Dados Mock e Preparar Plataforma para Producao

## Resumo Executivo

Remover todos os dados ficticios restantes, garantir que o botao "Zerar Plataforma" seja exclusivo para admin, e certificar que todas as telas mostrem empty states adequados quando nao houver dados.

---

## ANALISE ATUAL

### Ja Funcionando com Dados Reais:
- Dashboard principal (useDashboardMetrics)
- CRM/Pipeline (useCRM)
- Projetos (useProjects)
- Marketing Store (Supabase)
- Prospecting Store (Supabase)
- Financial Store (Supabase)
- Relatorios (useReportMetrics)

### Problemas Identificados:

| Problema | Local | Impacto |
|----------|-------|---------|
| Mock AI responses | AIAssistant.tsx | Respostas fake da IA |
| Sem verificacao admin | DangerZone + Edge Function | Seguranca |
| Tabelas faltando no reset | platform-reset | Reset incompleto |
| Import desnecessario | ProjectsHeader.tsx | Mock data referenciado |

---

## FASE 1: SEGURANCA - ADMIN ONLY

### 1.1 Atualizar Edge Function platform-reset

Adicionar verificacao de role admin antes de executar:

```typescript
// Verificar se usuario tem role admin
const { data: roleData, error: roleError } = await supabaseAdmin
  .from('user_role_assignments')
  .select('role')
  .eq('user_id', user.id)
  .eq('role', 'admin')
  .single();

if (roleError || !roleData) {
  return new Response(JSON.stringify({ error: "Apenas administradores podem executar esta acao" }), { 
    status: 403, 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
}
```

Adicionar tabelas faltantes na lista de limpeza:
- `projects`
- `project_stages`
- `prospect_lists`
- `prospect_opportunities`
- `prospect_activities`

### 1.2 Atualizar DangerZoneSettingsPage.tsx

Adicionar verificacao de admin na UI:

```typescript
import { useUserRole } from "@/hooks/useUserRole";

const { isAdmin, isLoading: roleLoading } = useUserRole();

// Se nao for admin, redirecionar
if (!roleLoading && !isAdmin) {
  navigate('/configuracoes');
  return null;
}
```

### 1.3 Atualizar SettingsDashboard.tsx

Filtrar Danger Zone para mostrar apenas para admin:

```typescript
const { isAdmin } = useUserRole();

// Filtrar secoes baseado em permissao
const visibleSections = settingsSections.filter(section => {
  if (section.id === 'danger-zone') return isAdmin;
  return true;
});
```

---

## FASE 2: REMOVER MOCK DATA

### 2.1 Remover Mock AI Responses

Arquivo: `src/components/ai/AIAssistant.tsx`

Substituir respostas mock por mensagem informativa:

```typescript
const handleSend = async () => {
  if (!input.trim() || loading) return;

  const userMsg = input.trim();
  setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
  setInput('');
  setLoading(true);

  // TODO: Integrar com Lovable AI quando configurado
  setTimeout(() => {
    setMessages(prev => [...prev, { 
      role: 'ai', 
      content: "Assistente IA em desenvolvimento. Esta funcionalidade estara disponivel em breve." 
    }]);
    setLoading(false);
  }, 500);
};
```

### 2.2 Limpar Import Mock Data

Arquivo: `src/components/projects/list/ProjectsHeader.tsx`

Remover import nao utilizado:
```typescript
// REMOVER esta linha
import { CLIENTS, TEAM_MEMBERS } from "@/data/projectsMockData";
```

### 2.3 Manter projectsMockData.ts

O arquivo ja esta limpo (arrays vazios) e e usado como estrutura de tipos. Manter como esta:

```typescript
// Team Members - Keep structure for creating new projects
export const TEAM_MEMBERS: TeamMember[] = [];

// Clients - Keep structure for creating new projects  
export const CLIENTS: Client[] = [];

// No mock projects - platform starts clean
export const MOCK_PROJECTS = [];
```

---

## FASE 3: EMPTY STATES CONSISTENTES

### 3.1 Componentes do Dashboard Ja OK

Os seguintes componentes ja mostram empty states adequados:
- ProductionSection.tsx - "Nenhum projeto em producao" + CTA
- PipelineSection.tsx - "Nenhum deal no pipeline" + CTA
- AuditFeed.tsx - "Nenhuma atividade registrada"

### 3.2 Verificar Consistencia

Garantir que todas as telas sigam o padrao:

```text
+--------------------------------------------------+
|     [Icone contextual em bg circular]            |
|                                                  |
|     Titulo curto e claro                         |
|     Descricao de 1 linha                         |
|                                                  |
|     [CTA Primario]                               |
+--------------------------------------------------+
```

Telas verificadas:
- Dashboard - OK
- CRM - OK (usando EmptyState component)
- Projetos - OK
- Marketing - OK
- Financeiro - OK
- Propostas - OK
- Contratos - OK
- Calendario - OK
- Knowledge Base - OK

---

## FASE 4: TABELAS DO RESET COMPLETO

### Lista Final de Tabelas para Limpeza

```typescript
const tables = [
  // NOVOS - Projetos
  "project_stages",
  "projects",
  
  // NOVOS - Prospeccao
  "prospect_activities",
  "prospect_opportunities", 
  "prospect_lists",
  
  // Marketing existentes
  "content_checklist", 
  "content_comments", 
  "content_scripts", 
  "instagram_references",
  "content_items", 
  "content_ideas", 
  "campaign_creatives", 
  "campaigns",
  "instagram_snapshots", 
  "creative_outputs", 
  "creative_briefs", 
  "generated_images",
  "marketing_assets",
  
  // Prospeccao existentes
  "cadence_steps", 
  "cadences", 
  "do_not_contact", 
  "prospects",
  
  // Financeiro existentes
  "revenues", 
  "expenses", 
  "cashflow_snapshots",
  
  // Contratos existentes
  "contract_signatures",
  "contract_addendums", 
  "contract_alerts", 
  "contract_links", 
  "contract_versions",
  "contracts",
  
  // Outros existentes
  "proposals",
  "meeting_notes", 
  "calendar_events", 
  "deadlines",
  "storyboard_scenes", 
  "storyboards",
];
```

---

## ARQUIVOS A MODIFICAR

| Arquivo | Acao | Prioridade |
|---------|------|------------|
| `supabase/functions/platform-reset/index.ts` | Adicionar verificacao admin + novas tabelas | ALTA |
| `src/pages/settings/DangerZoneSettingsPage.tsx` | Verificar role admin | ALTA |
| `src/pages/settings/SettingsDashboard.tsx` | Filtrar DangerZone | ALTA |
| `src/components/ai/AIAssistant.tsx` | Remover mock responses | MEDIA |
| `src/components/projects/list/ProjectsHeader.tsx` | Remover import mock | BAIXA |

---

## ORDEM DE IMPLEMENTACAO

1. **Seguranca (ALTA)** - platform-reset + DangerZone admin check
2. **AI Assistant** - Remover mocks
3. **Imports** - Limpar referencias
4. **Teste** - Verificar todas as telas com banco vazio

---

## RESULTADO ESPERADO

Apos implementacao:

- Botao "Zerar Plataforma" visivel apenas para admins
- Edge function rejeita usuarios nao-admin com erro 403
- AIAssistant mostra mensagem de "em desenvolvimento"
- Todas as telas iniciam com empty states premium
- Reset limpa TODAS as tabelas operacionais incluindo projects e prospects
- Event log registra quem executou o reset
- Plataforma 100% pronta para dados reais de producao

