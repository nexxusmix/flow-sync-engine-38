

## Diagnóstico Completo da Prospecção

### O que FUNCIONA (estruturalmente pronto)

| Componente | Status |
|---|---|
| **Tabelas no banco** | Todas existem com RLS habilitado |
| **Store Zustand** | CRUD completo, getters e filters |
| **Edge function `prospect-ai-generate`** | Funcional, usa Gemini 3 Flash |
| **Edge function `prospect-tts`** | Funcional, usa ElevenLabs |
| **Pipeline Kanban (Oportunidades)** | Drag & drop, criar, mover estágios |
| **Atividades** | CRUD, filtros, concluir com outcome |
| **Cadências** | Criar, adicionar passos, ativar/desativar |
| **Inbox / WhatsApp** | Geração de mensagem IA, envio WhatsApp, áudio |
| **Automações** | Toggle rules, kill switch, timeline |
| **Scout** | Pipeline separado com geração de copy/áudio |

### O que esta QUEBRADO ou INCOMPLETO

#### 1. Editar Prospect — Dialog inexistente
`TargetsPage` define `editingProspect` state e o botão "Editar" seta o valor, mas **nao existe nenhum Dialog de edição**. Clicar em "Editar" não faz nada visível.

**Correção**: Criar Dialog de edição que reutiliza o formulário do "Novo Target", pré-populado com os dados do prospect, e chama `updateProspect`.

#### 2. Cadências — Botão "Editar" é noop
`CadencesPage` passa `onEdit={() => {}}` para o CadenceCard. Clicar em "Editar" não faz nada.

**Correção**: Criar Dialog de edição de cadência (nome, nicho alvo, limite diário, descrição).

#### 3. Cadências — "Gerar com IA" sem ação
O botão "Gerar com IA" na CadencesPage não tem `onClick` handler.

**Correção**: Conectar ao `useProspectAI` com command `plan_campaign` e preencher automaticamente cadência + passos.

#### 4. Oportunidades — Sem dialog de edição
`OpportunitiesPage` define `editingOpp` state mas não tem o Dialog correspondente para editar valor, probabilidade, fit_score, next_action etc.

**Correção**: Criar Dialog de edição completo da oportunidade.

#### 5. ProspectAutomations — Cores inconsistentes
Usa `text-amber-400`, `bg-amber-500/10`, `text-emerald-500` em vez da paleta azul/branco/vermelho do resto do app.

**Correção**: Substituir amber → primary, emerald → primary.

#### 6. Oportunidades — Fit Score usa cores fora da paleta
`bg-emerald-500/10 text-emerald-500`, `bg-amber-500/10 text-amber-500` hardcoded.

**Correção**: Mapear para `text-primary`/`text-destructive`.

#### 7. Scout — Cores fora da paleta
`ScoutDashboard` usa `text-yellow-400`, `text-green-400`, `text-red-400`, `bg-green-600`, `bg-yellow-500/20 text-yellow-400`, `bg-purple-500/20`, `bg-blue-500/20`, `bg-orange-500/20`.

**Correção**: Padronizar com a paleta do sistema.

### Plano de Implementação

**Arquivo 1 — `src/pages/prospecting/TargetsPage.tsx`**
- Adicionar Dialog de edição que pré-popula com `editingProspect`, chama `updateProspect(id, data)` e fecha

**Arquivo 2 — `src/pages/prospecting/CadencesPage.tsx`**
- Criar Dialog de edição de cadência
- Conectar botão "Gerar com IA" ao `useProspectAI.planCampaign` que cria cadência + passos automaticamente

**Arquivo 3 — `src/pages/prospecting/OpportunitiesPage.tsx`**
- Criar Dialog de edição de oportunidade (valor, probabilidade, fit_score, next_action_at, conversation_summary)
- Padronizar cores do fit_score badge

**Arquivo 4 — `src/components/prospecting/ProspectAutomations.tsx`**
- Substituir amber/emerald por primary/destructive

**Arquivo 5 — `src/components/scout/ScoutDashboard.tsx`**
- Padronizar cores com a paleta do sistema

