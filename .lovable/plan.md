

## Plano: Ações Rápidas Contextuais no ActionCard

### O que muda

Cada ActionCard ganha **botões de ação rápida contextuais** baseados no tipo da tarefa, que levam o usuário direto para executar/resolver. Além disso, adiciono funcionalidades novas que antecipam necessidades.

### Ações por tipo de tarefa

| Tipo | Botão Principal | Destino/Ação |
|------|----------------|--------------|
| `financial` | **Ver Fatura →** | `/financeiro/receitas` |
| `deadline` | **Abrir Projeto →** | `/projetos/{project_id}` |
| `delivery` | **Ver Entrega →** | `/projetos/{project_id}` |
| `production_step` | **Ir para Produção →** | `/projetos/{project_id}` |
| `follow_up` | **Abrir CRM →** | `/crm` |
| `task_overdue` | **Ver Tarefa →** | `/tarefas` |
| `meeting` / `call` | **Ver Agenda →** | `/agenda` |
| `proposal` | **Ver Proposta →** | `/propostas` |
| `contract` | **Ver Contrato →** | `/contratos` |
| `campaign` | **Ver Marketing →** | `/marketing` |

### Funcionalidades novas (antecipadas)

1. **Botão "Copiar Resumo"** — Copia título + descrição + prazo para a clipboard (útil para colar no WhatsApp, email, etc.)
2. **Botão "Delegar"** — Abre tooltip para atribuir a outro membro (usa metadata para marcar assignee)
3. **Badge de tempo relativo animado** — "Há 2h", "Vence em 30min" com cor pulsante para urgentes
4. **Quick-nav no compact mode** — Mesmo no rail do dashboard, o card leva direto ao destino ao clicar

### Implementação técnica

- Criar função `resolveQuickActions(item)` que retorna array de `{ label, icon, href, onClick? }` baseado no `type` e `metadata`
- Usar `useNavigate()` do react-router para navegação
- Botões com `motion.button` + hover scale + ícone contextual (ExternalLink, Copy, UserPlus)
- No modo compact: clique no card inteiro navega para o destino principal
- No modo expandido: botões aparecem na barra de ações inferior, ao lado dos existentes (Concluir, Msg IA, Adiar)
- Botão "Copiar" usa `navigator.clipboard.writeText()` + toast de confirmação

### Arquivo alterado

- `src/components/action-hub/ActionCard.tsx` — único arquivo, toda a lógica fica aqui

