
# Diagnóstico e Solução Completa

## Problema 1: Erro no "Sincronizar Financeiro"

**Causa raiz confirmada:** O projeto "Identidade Visual Porto 153" tem `contract_value = 0` no banco. A edge function `sync-project-finances` retorna HTTP 400 com a mensagem `"Projeto sem valor de contrato definido."`. O frontend captura esse erro e exibe o toast genérico do Lovable SDK como "Edge Function returned a non-2xx status code".

**O que falta:** O `handleSyncFinance` em `ProjectHeader.tsx` já trata o erro com `toast.error`, mas o SDK do Supabase às vezes lança o erro antes de o body ser lido, perdendo a mensagem específica. Além disso, não há nenhum aviso proativo ao usuário de que o projeto precisa de um valor de contrato antes de sincronizar.

**Correções:**
- Melhorar o tratamento de erro em `ProjectHeader.tsx` e `ProjectActionsMenu.tsx` para extrair a mensagem do body da resposta mesmo em erros não-2xx
- Adicionar validação visual: se `project.contract_value === 0`, o botão mostra aviso amigável e abre o modal de edição em vez de chamar a edge function
- Corrigir a edge function `sync-project-finances` para aceitar `force_regenerate` via UI (já tem suporte, mas não é exposto)

---

## Problema 2: Botão de "Auto-Sync Inteligente" sem abrir chat

O usuário quer uma ação que, ao clicar, a IA analisa o estado atual do projeto e executa tudo que for necessário automaticamente — sem precisar abrir o Command Center / chat.

**Solução: Novo botão "Auto Sync IA" com Edge Function dedicada**

### Nova Edge Function: `auto-update-project`

Recebe o `project_id`, lê todos os dados do projeto (tarefas, etapas, financeiro, calendário) e executa um plano de ações de forma autônoma:
1. Se `contract_value > 0` e não há contrato → cria contrato + parcelas
2. Se não há tarefas → gera tarefas com base no template e etapa atual
3. Se não há próximas entregas no calendário → gera evento de entrega
4. Se etapa atual não tem tarefas concluídas → sugere próxima etapa (opcional)
5. Retorna um resumo das ações executadas

### UI: Botão "Auto Update" em `ProjectHeader.tsx`

- Substitui o atual "Atualizar com IA" (que abre chat) por um botão que executa automaticamente
- Mantém o "Atualizar com IA" como opção secundária no menu
- Durante a execução: loading spinner + toast "Analisando projeto..."
- Ao concluir: toast com resumo "✓ 3 ações executadas: contrato criado, 5 tarefas geradas, entrega agendada"

---

## Implementação Técnica

### Arquivos a modificar

**`src/components/projects/detail/ProjectHeader.tsx`**
- Corrigir `handleSyncFinance`: validar `contract_value > 0` antes de chamar a edge function; se zero, abrir modal de edição com aviso claro
- Melhorar extração da mensagem de erro da resposta da edge function
- Adicionar botão "Auto Update" com ícone `Wand2` e loading state
- Mover "Atualizar com IA" para o menu secundário (`ProjectActionsMenu`)

**`src/components/projects/ProjectActionsMenu.tsx`**
- Adicionar opção "Atualizar com IA" (abre Command Center)
- Adicionar opção "Auto Sync IA" (chama a nova edge function)

**`supabase/functions/auto-update-project/index.ts`** *(novo)*
- Autenticação via `getClaims()` (padrão da plataforma)
- Lê: projeto, tarefas existentes, contrato, revenues, próximos eventos
- Executa ações paralelas via `Promise.allSettled`:
  - Sync financeiro (se `contract_value > 0`)
  - Geração de tarefas via IA (se não há tarefas)
  - Criação de evento de entrega (se `due_date` existe e não há evento)
- Usa modelo `google/gemini-3-flash-preview` para gerar tarefas contextuais
- Retorna JSON com lista de ações executadas e contagem de sucesso/erro

**`supabase/config.toml`**
- Registrar `auto-update-project` com `verify_jwt = false` (validação no código)

### Fluxo visual do Auto Update

```text
[Clique em "Auto Update"]
        ↓
Spinner + toast "Analisando projeto..."
        ↓
Edge function analisa o estado atual
        ↓
Executa ações em paralelo:
  - Sync financeiro (se aplicável)
  - Gera tarefas (se aplicável)  
  - Agenda entrega (se aplicável)
        ↓
Invalida todos os React Query caches relevantes
        ↓
Toast de sucesso com resumo das ações
```

### Validação no botão "Sincronizar Financeiro"

```text
contract_value === 0?
   ↓ SIM → toast.warning + abre EditProjectModal
   ↓ NÃO → chama edge function normalmente
```

---

## Resumo das mudanças

| Arquivo | Tipo | O que muda |
|---|---|---|
| `src/components/projects/detail/ProjectHeader.tsx` | Modificação | Validação pre-sync, botão Auto Update |
| `src/components/projects/ProjectActionsMenu.tsx` | Modificação | Adiciona "Auto Sync IA" no menu |
| `supabase/functions/auto-update-project/index.ts` | Criação | Engine de auto-atualização com IA |
| `supabase/config.toml` | Modificação | Registra nova edge function |
