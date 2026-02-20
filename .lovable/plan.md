
# Automação Completa: Projetos → Financeiro → Parcelas → Contratos com IA

## O que você quer (resumindo)

Quando um projeto existe no sistema, toda a parte financeira (contrato, parcelas/receitas) e o próprio contrato jurídico devem ser **gerados e preenchidos automaticamente pela IA** com base nos dados do projeto. Além disso, em projetos já existentes, um botão "Sincronizar com IA" deve fazer tudo isso com um clique.

---

## Como o sistema está hoje

- **Projetos** têm: nome, cliente, valor do contrato (`contract_value`), datas, template, etapas.
- **Contratos** (tabela `contracts`): existem mas são criados manualmente, sem vínculo direto obrigatório com `projects`.
- **Receitas/Parcelas** (tabela `revenues`): existem e a edge function `generate-contract-milestones` já gera parcelas a partir de um contrato **assinado** — mas só funciona para contratos com `status = 'signed'`, e não existe nenhuma automação que ligue projeto → contrato automaticamente.
- **IA no Projeto**: o botão "Atualizar com IA" abre o `ProjectCommandCenter` (chat livre com o agente). Não existe fluxo guiado de sincronização financeira.
- **Financeiro por Projeto** (`ProjectsFinancePage`): lista projetos com dados financeiros, mas requer que o usuário crie o contrato manualmente.

## O que falta e o que vamos construir

### Parte 1 — Nova Edge Function: `sync-project-finances`

Edge function que, dado um `project_id`, executa em sequência:

1. **Busca dados do projeto** (`projects`, incluindo `contract_value`, `payment_terms` se houver, `client_name`, `start_date`, `due_date`, `template`).
2. **Verifica se já existe contrato** vinculado ao `project_id` na tabela `contracts`.
   - Se não existe: **cria o contrato** automaticamente com dados do projeto.
   - Se existe: atualiza campos desatualizados (valor, cliente, datas).
3. **Usa IA (Gemini Flash)** para gerar condições de pagamento inteligentes baseadas no tipo de projeto (`template`), valor e duração, caso não estejam definidas.
4. **Gera receitas/parcelas** na tabela `revenues` (lógica já existente em `generate-contract-milestones`, agora chamada internamente). Pula se já existirem parcelas para evitar duplicação.
5. **Retorna resumo** do que foi criado/atualizado.

### Parte 2 — Botão "Sincronizar Financeiro com IA" no Projeto

No `ProjectHeader.tsx`, adicionar um novo botão **"Sincronizar Financeiro"** (com ícone de IA + finanças) que:
- Chama a edge function `sync-project-finances` com o `project_id`.
- Mostra loading state enquanto processa.
- Exibe toast de sucesso com resumo: "Contrato criado + 3 parcelas geradas".
- Invalida as queries de financeiro para atualizar os dados na tela.

### Parte 3 — Auto-sincronização ao Criar/Editar Projeto

No hook `useProjects`, quando um projeto é **criado** com `contract_value > 0`, chamar automaticamente `sync-project-finances` em background após salvar.

### Parte 4 — Tab "Financeiro" no Detalhe do Projeto

Adicionar uma nova aba **"Financeiro"** no `ProjectTabs.tsx`, com o componente `ProjectFinanceDetailPanel` já existente, mas carregando os dados financeiros do projeto atual diretamente — sem precisar ir até a página "Financeiro por Projeto".

### Parte 5 — Botão de Sync na Lista de Projetos

Na `ProjectsListPage`, adicionar no menu de ações de cada projeto (já existente em `ProjectActionsMenu`) uma opção **"Sincronizar Financeiro com IA"** que dispara o mesmo processo.

---

## Arquivos a Criar

- `supabase/functions/sync-project-finances/index.ts` — Edge function principal

## Arquivos a Modificar

- `src/components/projects/detail/ProjectHeader.tsx` — Adicionar botão "Sincronizar Financeiro"
- `src/components/projects/detail/ProjectTabs.tsx` — Adicionar aba "Financeiro"
- `src/components/projects/ProjectActionsMenu.tsx` — Adicionar opção no menu de ações
- `src/hooks/useProjects.ts` — Trigger automático ao criar projeto com valor

---

## Sequência de Implementação

```text
1. Criar edge function sync-project-finances
   (busca projeto → cria/atualiza contrato → usa IA para payment_terms → gera parcelas)
   ↓
2. Adicionar aba "Financeiro" no ProjectTabs (FinanceTab)
   ↓
3. Adicionar botão "Sincronizar Financeiro com IA" no ProjectHeader
   ↓
4. Adicionar opção no ProjectActionsMenu
   ↓
5. Trigger automático no useProjects ao criar projeto com contract_value
```

---

## Lógica da IA na Edge Function

A IA será usada para gerar `payment_terms` inteligentes quando não há condições definidas:

- **Prompt**: dado o tipo de projeto (ex: `filme_institucional`), valor total (ex: R$ 15.000) e duração (ex: 90 dias), gere condições de pagamento padrão de mercado para uma produtora audiovisual brasileira.
- **Output**: string de condições (ex: "50% na assinatura + 50% na entrega") que alimenta o parser já existente em `generate-contract-milestones`.
- **Modelo**: `google/gemini-3-flash-preview` (rápido, custo baixo).

---

## Detalhes Técnicos da Edge Function

```text
POST /functions/v1/sync-project-finances
Body: { project_id: string, force_regenerate?: boolean }

Fluxo:
1. Busca projects WHERE id = project_id
2. Verifica contracts WHERE project_id = project_id
3. Se não existe contrato → INSERT em contracts
4. Se não tem payment_terms → chama IA → preenche
5. Verifica revenues WHERE project_id = project_id AND contract_id = contract.id
6. Se não tem parcelas (ou force_regenerate) → gera e insere
7. Retorna: { contract_id, created_revenues: number, payment_terms, message }
```

A idempotência é garantida: se já existem parcelas para o contrato, não duplica (a menos que `force_regenerate: true`).

---

## O que NÃO muda

- O fluxo de assinatura digital (gov.br/ICP-Brasil) permanece igual.
- O `generate-contract-milestones` existente continua funcionando para contratos assinados.
- As tabelas não precisam de migração — apenas vamos usar as colunas existentes corretamente.
