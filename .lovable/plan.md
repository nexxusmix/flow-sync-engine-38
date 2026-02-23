

# Resumo do Dia Completo -- Visao 360 com Clientes, Relacionamento e Acoes

Hoje o "Resumo do Dia" recebe apenas 6 metricas basicas (leads, respostas, reunioes, propostas, pagamentos, entregas). O objetivo e enriquece-lo massivamente com dados de clientes, relacionamento, datas criticas e acoes inteligentes para que o Polo AI gere um resumo verdadeiramente completo e antecipativo.

---

## O que muda

### 1. Novo hook `useDailySummaryMetrics` (substituindo uso direto do `useKPIMetrics`)

Um hook dedicado que coleta TODAS as metricas necessarias para o resumo, organizadas em blocos:

**Bloco Comercial**
- Leads novos (7 dias)
- Deals com next_action vencida ou para hoje (crm_deals.next_action_at <= hoje)
- Deals quentes (temperature = 'hot') sem acao nos ultimos 5 dias
- Propostas enviadas aguardando resposta (proposals.status = 'sent', > 3 dias)

**Bloco Clientes / Relacionamento**
- Clientes sem contato ha mais de 30 dias (crm_contacts sem deal/projeto atualizado)
- Aniversarios/datas importantes (se houver campo, senao contratos completando 1 ano)
- Contratos vencendo nos proximos 15 dias (contracts.end_date)
- Contratos com renovacao pendente (renewal_type != null, perto do end_date)
- Mensagens nao respondidas no inbox (inbox_threads.status = 'open', sem resposta > 24h)
- Total de clientes ativos (com projeto em andamento)

**Bloco Operacional**
- Entregas proximas (7 dias)
- Projetos atrasados (due_date < hoje, status != concluido)
- Projetos sem atividade ha mais de 7 dias
- Reunioes de hoje e amanha

**Bloco Financeiro**
- Pagamentos a receber (7 dias)
- Pagamentos atrasados (revenues.status = 'overdue')
- Valor total em pipeline aberto (crm_deals nao fechados)

**Bloco Prospeccao**
- Prospects com follow-up para hoje (prospect_opportunities.next_action_at)
- Prospects sem interacao > 7 dias
- Oportunidades em fase de negociacao

### 2. Atualizar `AIDailySummary.tsx`

- Substituir uso de `useKPIMetrics` pelo novo `useDailySummaryMetrics`
- Montar o texto de metricas muito mais rico para enviar ao Polo AI
- Adicionar nova secao visual "Relacionamento" com cards de clientes que precisam de atencao
- Expandir o grid de highlights para suportar ate 9 cards (3x3)
- Adicionar nova secao "Mensagens para Enviar" apos action_items

### 3. Atualizar prompt do Polo AI em `polo-ai-chat/index.ts`

Expandir o prompt do daily_summary para incluir novas categorias de highlights e um novo campo `client_actions`:

```
{
  "greeting": "...",
  "highlights": [...],  // ate 9 items agora
  "action_items": [...],
  "client_actions": [
    {
      "client_name": "Nome",
      "reason": "Sem contato ha 35 dias",
      "suggested_message": "Oi [nome], tudo bem? Passando pra ver como estao as coisas...",
      "urgency": "medium",
      "channel": "whatsapp"
    }
  ]
}
```

### 4. Nova secao visual "Clientes para Contatar"

Renderizar os `client_actions` como cards interativos com:
- Nome do cliente + motivo do contato
- Mensagem sugerida pela IA (copiavel)
- Botao de WhatsApp deep-link
- Badge de urgencia (alta/media/baixa)

---

## Detalhes tecnicos

### Arquivos a criar
- `src/hooks/useDailySummaryMetrics.ts` -- hook centralizado com todas as queries

### Arquivos a editar
- `src/components/dashboard/AIDailySummary.tsx` -- usar novo hook, nova UI com secao de clientes
- `supabase/functions/polo-ai-chat/index.ts` -- expandir prompt do daily_summary com novo schema

### Queries do novo hook (todas em paralelo via useQuery)
- `crm_deals` WHERE next_action_at <= hoje -- deals com acao pendente
- `crm_deals` WHERE temperature = 'hot' AND updated_at < 5 dias -- deals quentes parados
- `contracts` WHERE end_date BETWEEN hoje AND +15 dias -- contratos vencendo
- `inbox_threads` WHERE status = 'open' -- threads abertas sem resposta
- `projects` WHERE due_date < hoje AND status != 'concluido' -- projetos atrasados
- `projects` WHERE updated_at < 7 dias AND status IN ('em_andamento') -- projetos inativos
- `revenues` WHERE status = 'overdue' -- pagamentos atrasados
- `prospect_opportunities` WHERE next_action_at <= hoje -- follow-ups de hoje
- `crm_contacts` LEFT JOIN ultimas interacoes -- clientes sem contato recente
- Reutilizar dados existentes do KPI (leads, reunioes, propostas, entregas, pagamentos)

### Texto enviado ao Polo AI (exemplo)
```
Dados completos do workspace:

COMERCIAL:
- Leads novos (7d): 3
- Deals com acao vencida: 2 (Cliente X - follow-up, Cliente Y - proposta)
- Deals quentes parados: 1 (Cliente Z, sem acao ha 8 dias)
- Propostas aguardando resposta: 2 (ha 5 e 7 dias)

CLIENTES / RELACIONAMENTO:
- Clientes sem contato >30d: 3 (Maria, Joao, Pedro)
- Contratos vencendo em 15d: 1 (Contrato ABC - vence 10/03)
- Mensagens nao respondidas: 2 (inbox aberto)
- Clientes ativos: 8

OPERACIONAL:
- Entregas proximos 7d: 2
- Projetos atrasados: 1 (Projeto XYZ, 3 dias atrasado)
- Projetos inativos >7d: 2
- Reunioes hoje: 1, amanha: 2

FINANCEIRO:
- A receber proximos 7d: R$15.000
- Atrasados: R$5.000 (2 parcelas)
- Pipeline aberto total: R$120.000

PROSPECCAO:
- Follow-ups para hoje: 3
- Prospects sem interacao >7d: 5
- Em negociacao: 4

Gere o resumo executivo com highlights, acoes e mensagens sugeridas para clientes.
```

### Novo schema de resposta da IA
O campo `client_actions` e novo e permite que a IA sugira mensagens personalizadas para enviar aos clientes que precisam de atencao, com canal preferencial e nivel de urgencia.

