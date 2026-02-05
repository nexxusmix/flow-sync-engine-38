

# SQUAD Hub - Plano MVP (30-45 dias)

## Visão do MVP
Sistema focado em **resolver o gargalo principal**: transformar leads em dinheiro no caixa através de um fluxo rápido e padronizado de proposta → contrato → cobrança. Interface dark mode premium, editorial e pensada para uso intensivo.

---

## Módulo 1: Dashboard Executivo
**Objetivo**: Visão única do que importa - dinheiro entrando e oportunidades em risco.

- **Cards de métricas**: Propostas pendentes | Contratos aguardando assinatura | Cobranças a receber | Receita do mês
- **Lista de ações urgentes**: Propostas sem resposta há X dias, contratos expirando, cobranças atrasadas
- **Timeline recente**: Últimas atividades (proposta enviada, contrato assinado, pagamento recebido)

---

## Módulo 2: CRM Essencial
**Objetivo**: Não perder lead e ter contexto completo de cada oportunidade.

### Contas (Empresas/Clientes)
- Cadastro com CNPJ, segmento, contatos vinculados
- Histórico de interações, propostas e projetos

### Pipeline Kanban
- Estágios configuráveis: Lead → Qualificação → Proposta Enviada → Negociação → Fechado Ganho/Perdido
- Arrastar e soltar para mover negócios
- Alertas de oportunidades paradas (stagnation alerts)

### Atividades e Follow-up
- Tarefas com prazo e lembretes
- Registro de calls, reuniões e interações
- **Sistema nunca deixa esquecer**: notificações de follow-ups pendentes

---

## Módulo 3: Propostas Inteligentes
**Objetivo**: Gerar proposta profissional em minutos, não horas.

### Catálogo de Serviços
- Produtos pré-configurados: Filme Institucional, Aftermovie, Reels Pacote, Foto, Drone, Motion, etc.
- Cada serviço com: descrição, preço base, prazo estimado, entregáveis padrão

### Gerador de Propostas
- Seleciona cliente → escolhe serviços do catálogo → customiza valores → gera PDF/link
- Templates visuais alinhados com a identidade SQUAD
- Controle de validade da proposta

### Acompanhamento
- Status: Rascunho → Enviada → Visualizada → Aprovada → Recusada
- Histórico de versões
- Botão para gerar contrato automaticamente quando aprovada

---

## Módulo 4: Contratos com Assinatura Digital
**Objetivo**: Do "fechou" ao contrato assinado em cliques, não dias.

### Gerador de Contrato
- Template inteligente que puxa dados da proposta aprovada
- Campos automáticos: cliente, escopo detalhado, valores, parcelas, prazos, cláusulas padrão
- Cláusulas de: direitos autorais, uso de imagem, limites de revisão, multas

### Fluxo de Assinatura
- Integração com **Clicksign ou DocuSign** para assinatura digital
- Status: Gerado → Enviado → Assinado → Arquivado
- Notificação quando assinado

### Repositório
- Todos os contratos organizados por cliente/projeto
- Busca e filtros
- Alertas de contratos próximos do vencimento

---

## Módulo 5: Cobrança Automática
**Objetivo**: Dinheiro no caixa sem precisar lembrar de cobrar.

### Gatilho Automático
- Contrato assinado → gera automaticamente as parcelas definidas
- Primeira cobrança (entrada) disparada imediatamente

### Parcelas e Pagamentos
- Visualização clara: valor, vencimento, status (pendente/pago/atrasado)
- Integração com **Asaas** para gerar boleto/pix automaticamente
- Registro manual de pagamentos quando necessário

### Régua de Cobrança Automática
- **D-3**: Lembrete educado ("sua parcela vence em 3 dias")
- **D0**: Aviso no dia do vencimento
- **D+3**: Escalonamento ("identificamos que o pagamento está pendente")
- **D+7**: Alerta de trava operacional e contato para renegociação

### Indicadores Financeiros
- Receita prevista x realizada
- Inadimplência
- Forecast simples de 30/60/90 dias

---

## Design & Experiência

### Visual
- **Dark mode premium** como padrão
- Tipografia clara e hierárquica para legibilidade
- Cards com bordas suaves e sombras sutis
- Acentos de cor para status e ações importantes
- Inspiração nos templates "Polo" compartilhados

### Navegação
- Sidebar fixa com acesso rápido aos módulos
- Breadcrumbs para contexto
- Busca global
- Atalhos de teclado para ações frequentes

### Responsivo
- Funcional em mobile para consultas rápidas
- Otimizado para desktop (uso intensivo)

---

## Integrações MVP

| Serviço | Função |
|---------|--------|
| **Supabase** | Banco de dados, autenticação, storage |
| **Asaas** | Geração de boletos/pix, cobrança automática |
| **Clicksign** | Assinatura digital de contratos |
| **WhatsApp** | Links diretos para conversa (sem API complexa no MVP) |

---

## O que fica para V2
- Inbox WhatsApp com chatbot e IA
- Prospecção ativa com IA e cadências
- Gestão completa de projetos e produção
- Sistema de revisão com timecode
- Agentes de IA especializados
- Multi-usuários e RBAC completo
- Gov.br para assinaturas

---

## Stack Técnica
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Database, Auth, Edge Functions, Storage)
- **IA**: Lovable AI para automações inteligentes futuras
- **Pagamentos**: Asaas
- **Assinatura**: Clicksign

---

## Resultado Esperado
Ao final do MVP, você terá um sistema onde:
1. Leads nunca são esquecidos (pipeline + alertas)
2. Propostas são geradas em minutos com visual profissional
3. Contratos são criados automaticamente e assinados digitalmente
4. Cobranças acontecem sozinhas com régua automática
5. Tudo auditável: quem fez, quando fez, qual decisão

**Meta**: Da oportunidade ao dinheiro no caixa em dias, não semanas.

