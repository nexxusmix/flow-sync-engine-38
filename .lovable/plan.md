
# Criar Aviso Inteligente -- Modal Avancado com IA + Selecao de Contexto do Projeto

## Resumo
O modal "Novo Aviso" atual e basico (titulo, mensagem, tipo, severidade). Vamos transforma-lo em um modal avancado que:

1. Ao selecionar um projeto, carrega TODOS os dados dele (entregas, reunioes, receitas, revisoes, etapas, escopo, materiais)
2. Permite selecionar itens especificos do projeto para incluir no aviso
3. Botao "Gerar com IA" que analisa o contexto selecionado e gera titulo + mensagem inteligentes
4. Funciona tanto no Quadro de Avisos geral quanto na aba Avisos do projeto individual

---

## O que muda na experiencia

### Fluxo atual
Titulo manual -> Tipo -> Severidade -> Projeto (opcional) -> Criar

### Novo fluxo
1. Seleciona Projeto (ou ja vem preenchido se estiver na aba do projeto)
2. Aparece painel "Contexto do Projeto" com itens selecionaveis:
   - Entregas pendentes (portal_deliverables via portal_links)
   - Reunioes proximas (calendar_events)
   - Receitas pendentes/vencidas (revenues)
   - Revisoes aguardando (portal_change_requests)
   - Prazos do projeto (due_date, stage_current)
   - Saude do projeto (health_score)
   - Escopo / descricao
3. Usuario marca checkboxes nos itens que quer incluir
4. Pode preencher titulo/mensagem manualmente OU clicar "Gerar com IA"
5. IA analisa os itens selecionados e gera titulo + mensagem contextualizados
6. Tipo e severidade sao sugeridos pela IA (editaveis)
7. Cria o aviso

---

## Detalhes Tecnicos

### Arquivos a criar

| Arquivo | Descricao |
|---|---|
| `src/components/alerts/CreateAlertModal.tsx` | **REESCREVER** -- Modal expandido com selecao de contexto + IA |
| `supabase/functions/generate-alert-ai/index.ts` | **NOVO** -- Edge function que gera titulo, mensagem, tipo e severidade via IA |

### Arquivos a editar

| Arquivo | Mudanca |
|---|---|
| `src/components/projects/detail/tabs/AlertsTab.tsx` | Adicionar botao "Novo Aviso" que abre o modal ja com o projeto preenchido |
| `supabase/config.toml` | Registrar a nova edge function `generate-alert-ai` |

### CreateAlertModal expandido

O modal tera 2 colunas em telas grandes:

**Coluna esquerda -- Formulario:**
- Titulo (input, preenchivel por IA)
- Mensagem (textarea, preenchivel por IA)
- Tipo (select, sugerido por IA)
- Severidade (select, sugerido por IA)
- Data limite (date picker)
- Botao "Gerar com IA" (sparkles icon)
- Botao "Criar Aviso"

**Coluna direita -- Contexto do Projeto (aparece ao selecionar projeto):**
- Secao "Prazos": checkbox com due_date, stage_current
- Secao "Entregas": checkboxes com deliverables pendentes
- Secao "Reunioes": checkboxes com proximas reunioes
- Secao "Financeiro": checkboxes com receitas pendentes/vencidas
- Secao "Revisoes": checkboxes com change_requests pendentes
- Secao "Saude": checkbox com health_score
- Secao "Escopo": checkbox para incluir descricao do projeto
- Botao "Selecionar tudo" / "Limpar"

Quando usuario clica "Gerar com IA":
1. Coleta todos os itens selecionados
2. Envia ao edge function `generate-alert-ai`
3. IA retorna: `{ title, message, type, severity }`
4. Preenche os campos automaticamente (editaveis)

### Edge Function `generate-alert-ai`

Recebe:
```text
{
  projectName, clientName, dueDate, stageCurrent, healthScore,
  selectedItems: {
    deliverables: [...],
    meetings: [...],
    revenues: [...],
    revisions: [...],
    includeScope: true/false,
    scopeText: "..."
  },
  userNote: "texto opcional do usuario"
}
```

Retorna:
```text
{
  title: "emoji + titulo direto",
  message: "descricao contextualizada",
  type: "deadline_due | payment_overdue | ...",
  severity: "info | warning | critical"
}
```

Usa Lovable AI (google/gemini-3-flash-preview) com LOVABLE_API_KEY ja configurado.

### AlertsTab -- Botao Novo Aviso

Na aba de Avisos do projeto individual, adicionar botao "Novo Aviso" ao lado do "Gerar Avisos Inteligentes". Ao clicar, abre o CreateAlertModal ja com o `projectId` preenchido (prop opcional no modal).

### Dados carregados ao selecionar projeto

Quando o usuario seleciona um projeto no modal, dispara queries paralelas:
- `projects` -> dados basicos (due_date, health_score, stage_current, description)
- `portal_links` -> IDs dos links do projeto
- `portal_deliverables` -> entregas via portal_link_id
- `calendar_events` -> reunioes do projeto
- `revenues` -> receitas do projeto
- `portal_change_requests` -> revisoes via portal_link_id

Tudo carregado uma vez e exibido como checkboxes selecionaveis.
