
# Quadro de Avisos -- Criar, Puxar e Vincular a Projetos

## Resumo
O Quadro de Avisos atual so exibe alertas, mas nao permite criar novos nem gerar automaticamente a partir de projetos. Vamos adicionar:

1. **Botao "Novo Aviso"** com modal completo para criar alerta manual
2. **Botao "Gerar Avisos"** que analisa os projetos e cria alertas automaticos (prazos vencidos, pagamentos pendentes, etc.)
3. **Filtro por Projeto** para ver alertas de um projeto especifico
4. **Link para o projeto** em cada alerta, clicavel

---

## O que sera implementado

### 1. Modal "Criar Aviso Manual"
Um Dialog com formulario para criar qualquer tipo de alerta:
- **Titulo** (obrigatorio)
- **Mensagem** (descricao opcional)
- **Tipo** (dropdown com os 16 tipos existentes: prazo proximo, pagamento vencido, lembrete, etc.)
- **Severidade** (info, atencao, critico)
- **Projeto vinculado** (dropdown com projetos ativos, opcional)
- **Data limite** (date picker opcional)
- Usa o `createAlert` que ja existe no hook `useAlerts`

### 2. Botao "Gerar Avisos dos Projetos"
Funcao que faz um scan nos projetos e cria alertas automaticos:
- Projetos com `due_date` vencido e status != concluido --> alerta `deadline_overdue` (critico)
- Projetos com `due_date` nos proximos 7 dias --> alerta `deadline_due` (atencao)
- Projetos com `has_payment_block = true` --> alerta `payment_overdue` (critico)
- Projetos com `health_score < 50` --> alerta `risk_health_drop` (atencao)
- Usa `idempotency_key` para evitar alertas duplicados (ex: `deadline_overdue_projectId`)

### 3. Filtro por Projeto
- Novo dropdown no header de filtros que lista projetos
- Filtra alertas por `project_id`

### 4. Link do Projeto no Card do Alerta
- Se o alerta tem `project_id`, mostrar nome do projeto clicavel que navega para `/projetos/{id}`

---

## Detalhes Tecnicos

### Arquivos a criar/editar

| Arquivo | Acao |
|---|---|
| `src/components/alerts/CreateAlertModal.tsx` | **NOVO** - Modal com formulario de criacao de alerta |
| `src/components/alerts/GenerateAlertsButton.tsx` | **NOVO** - Botao que escaneia projetos e gera alertas |
| `src/pages/AlertsBoardPage.tsx` | **EDITAR** - Adicionar botoes no header, filtro por projeto, link do projeto nos cards |
| `src/hooks/useAlerts.ts` | **EDITAR** - Adicionar filtro por project_id na query |

### Fluxo de Criacao Manual
1. Clica "Novo Aviso" no header
2. Preenche titulo, tipo, severidade, projeto (opcional), data limite (opcional)
3. Clica "Criar" --> insere na tabela `alerts` via `createAlert`
4. Toast de sucesso, modal fecha, lista atualiza via Realtime

### Fluxo de Geracao Automatica
1. Clica "Gerar dos Projetos"
2. Busca todos projetos ativos
3. Analisa prazos, pagamentos, saude
4. Cria alertas com `idempotency_key` unica para evitar duplicatas
5. Toast mostrando quantos alertas foram criados

### Schema (sem migracao necessaria)
A tabela `alerts` ja tem todos os campos necessarios: `project_id`, `type`, `severity`, `due_at`, `idempotency_key`. Nenhuma migracao de banco e necessaria.
