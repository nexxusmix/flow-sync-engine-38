
# SQUAD HUB v2.4 — Plano de Execucao Faseado

## Diagnostico do Estado Atual

A plataforma ja possui boa parte da infraestrutura mencionada no comando:
- **Design tokens SQUAD Film** ja existem em `index.css` (dark theme com #000000, #009CCA, glass-card, holographic-card, data-glow, grid-dots)
- **Google Sans Flex** ja e a fonte principal
- **Sidebar + DashboardLayout** ja seguem o padrao SQUAD Film
- **Quadro de Avisos** ja existe (`AlertsBoardPage`) com filtros, severidade, agrupamento por vencimento
- **WhatsApp com IA** ja funciona (`WhatsAppMessageModal` + edge function `generate-alert-whatsapp`)
- **Realtime sync** ja esta configurado (`useRealtimeSync`) para tabelas principais
- **Edge functions de IA** ja existem (30+ funcoes: gerar mensagem, panorama, propostas, alertas, etc.)
- **PDF export** ja existe para financeiro, panorama, campanhas, etc.
- **Componentes MK-UI** existem mas separados (`MkCard`, `MkStatusBadge`, etc.)

O que falta e principalmente: **unificar componentes duplicados**, **corrigir inconsistencias visuais entre modulos**, e **garantir que botoes/acoes realmente funcionem end-to-end**.

---

## Estrategia: 6 Sprints Sequenciais

Dado o tamanho do escopo, vou dividir em sprints menores que podem ser aprovados e implementados um por vez. Cada sprint entrega valor funcional completo.

---

## Sprint 1: Design System Unificado (Base Global)

**Objetivo:** Criar um kit de componentes `squad-ui` que substitua duplicatas e garanta consistencia.

### Tarefas:
1. **Criar `src/components/squad-ui/`** com componentes padronizados:
   - `GlassCard` (substituir `glass-card`, `MkCard`, `card-elevated` por um unico componente)
   - `GlassModal` (wrapper padrao para Dialog com blur + glass)
   - `StatusBadge` (unificar `MkStatusBadge` + badges inline)
   - `SectionHeader` (unificar `MkSectionHeader` + section-label)
   - `ActionButton` (CTA azul com glow + estados loading/success/error)
   - `AIButton` (icone sparkles + "Gerar com IA" + loading state obrigatorio)
   - `DataGlow` (wrapper para numeros com text-shadow)
   - `ProjectedTable` (tabela com hover azul, headers mono, borda glass)

2. **Consolidar tokens CSS** em `index.css`:
   - Garantir que `--glass-border`, `--glass-surface`, `--glow` estejam disponiveis no dark theme (ja estao)
   - Adicionar tokens faltantes: `--shadow-deep`, `--glass-blur`

3. **Migrar modulos existentes** para usar `squad-ui`:
   - Dashboard (ja usa glass-card -- manter)
   - Marketing Hub (migrar de `MkCard` para `GlassCard`)
   - Financeiro (ja consistente -- manter)
   - Prospeccao (verificar e migrar)

### Arquivos criados:
- `src/components/squad-ui/GlassCard.tsx`
- `src/components/squad-ui/GlassModal.tsx`
- `src/components/squad-ui/StatusBadge.tsx`
- `src/components/squad-ui/SectionHeader.tsx`
- `src/components/squad-ui/ActionButton.tsx`
- `src/components/squad-ui/AIButton.tsx`
- `src/components/squad-ui/ProjectedTable.tsx`
- `src/components/squad-ui/index.ts`

### Arquivos modificados:
- `src/index.css` (tokens adicionais)
- Componentes do Marketing Hub que usam `MkCard`

---

## Sprint 2: Quadro de Avisos + Acoes Inteligentes (Overview)

**Objetivo:** Expandir o sistema de alertas existente com card no Dashboard e carrossel de acoes inteligentes.

### Tarefas:
1. **Card "Avisos & Proximas Acoes" no Dashboard**
   - Mostrar top 5 alertas abertos (vencidos primeiro)
   - Botoes rapidos: Resolver, Gerar Msg, WhatsApp
   - Link para `/avisos`

2. **Carrossel "Acoes Inteligentes"** abaixo de Projetos Ativos
   - Cards horizontais: follow-up recomendado, prazo vencendo, revisao pendente, cobranca
   - Cada card com: Gerar Mensagem, Copiar, Enviar WhatsApp, Marcar como feito
   - Dados vindos dos alertas existentes + revenues vencidas + revisoes pendentes

3. **Card de Avisos dentro de cada Projeto**
   - Na pagina de detalhe do projeto, seção "Avisos do Projeto"
   - Filtrar alertas por `project_id`

### Arquivos criados:
- `src/components/dashboard/AlertsQuickCard.tsx`
- `src/components/dashboard/SmartActionsRail.tsx`
- `src/components/projects/ProjectAlertsSection.tsx`

### Arquivos modificados:
- `src/pages/Dashboard.tsx` (adicionar AlertsQuickCard + SmartActionsRail)
- Pagina de detalhe do projeto (adicionar ProjectAlertsSection)

---

## Sprint 3: "Enviar ao Cliente" -- Modal Completo + PDF SQUAD Film

**Objetivo:** Refatorar o modal SendToClientModal para incluir geracao de PDF fiel ao layout e envio WhatsApp completo.

### Tarefas:
1. **Refatorar `SendToClientModal`**
   - Tab "Mensagem": gerar texto WhatsApp com IA (ja existe parcialmente em `MessageTab`)
   - Tab "Material": enviar material individual com link do portal
   - Tab "Panorama": gerar resumo completo do projeto com IA
   - Historico: ja existe

2. **Botoes obrigatorios em cada tab:**
   - "Gerar com IA" (loading + resultado editavel)
   - "Copiar" (clipboard)
   - "Enviar WhatsApp" (wa.me com deteccao mobile/desktop)
   - "Gerar PDF" (chamar edge function `export-panorama-pdf`)

3. **PDF SQUAD Film**
   - Refatorar `export-panorama-pdf` para usar design tokens: fundo preto, texto branco, accent azul, cards glass simulados
   - Conteudo: projeto, cliente, etapa, saude, proximos passos, prazos, itens pendentes, links
   - QR code opcional para abrir portal

4. **WhatsApp inteligente:**
   - Detectar desktop vs mobile para URL correta
   - Buscar telefone do cliente via `crm_contacts`
   - Registrar envio em `event_logs`

### Arquivos modificados:
- `src/components/projects/send-to-client/MessageTab.tsx`
- `src/components/projects/send-to-client/PanoramaTab.tsx`
- `supabase/functions/export-panorama-pdf/index.ts`
- `src/components/projects/SendToClientModal.tsx`

---

## Sprint 4: Realtime Completo Projeto <-> Portal Cliente

**Objetivo:** Garantir que materiais, revisoes, entregas e financeiro estejam 100% sincronizados.

### Tarefas:
1. **Verificar/adicionar tabelas ao realtime:**
   - `portal_deliverables`, `portal_comments`, `portal_approvals`, `portal_change_requests` (ja no realtime conforme memory)
   - `revenues`, `contracts` (adicionados recentemente)
   - `portal_deliverable_versions`

2. **Portal Cliente: remover dados mock restantes**
   - Auditar todos componentes em `src/components/client-portal/`
   - Garantir que `PortalMaterialsSection`, `PortalDeliverables`, `PortalChangeRequests` buscam dados reais

3. **Nome do responsavel: full_name**
   - Substituir exibicao de `username` por `full_name` em todos os componentes
   - Implementar fallback: `full_name` -> `first_name + last_name` -> `username`

4. **Portal: exibir apenas avisos relevantes ao cliente**
   - Filtrar alertas por `visibility = 'client'` ou tipo relevante (prazo, material, pagamento)

### Arquivos modificados:
- `src/hooks/useRealtimeSync.tsx`
- Componentes do Portal Cliente que usam mocks
- Componentes que exibem username em vez de full_name

---

## Sprint 5: Prospeccao -- Campanhas + Cadencia + IA

**Objetivo:** IA gera estrategia por target, mensagens prontas, e cadencia automatizada.

### Tarefas:
1. **Pipeline inteligente:**
   - IA sugere proxima acao por lead/target
   - Gerar mensagem pronta (texto WhatsApp) com contexto do pipeline

2. **Campanhas por cliente:**
   - Objetivo: contato / fechamento / retarget / relacionamento
   - Tom: WhatsApp do Matheus (instrucoes fixas no prompt)
   - Cadencia: dias/horarios configuráveis

3. **Audio opcional (ElevenLabs):**
   - Botao "Gerar Audio" gera texto primeiro, depois oferece conversao
   - Usar edge function `prospect-tts` existente
   - Player inline no card

### Arquivos modificados:
- Paginas de prospeccao
- Edge functions de prospeccao existentes

---

## Sprint 6: Editor Criativo -- Layout SQUAD Film + Export

**Objetivo:** Padronizar o editor criativo com o mesmo DNA visual do financeiro.

### Tarefas:
1. **Layout do editor igual ao financeiro**
   - Header com section label
   - Cards/areas com glass
   - Painel direito "Copiloto" com estetica SQUAD Film

2. **Funcionalidades:**
   - Vincular cliente/projeto/campanha obrigatoriamente
   - Preview thumbnails (templates Figma)
   - IA multiformato (feed, story, carrossel)
   - Export PNG/JPG/ZIP

### Arquivos modificados:
- Componentes em `src/components/creative-studio/`
- Componentes em `src/components/studio/`

---

## Ordem de Prioridade (conforme solicitado)

1. Sprint 1 (Design System) -- base para tudo
2. Sprint 4 (Realtime Projeto <-> Portal) -- prioridade #1 do usuario
3. Sprint 2 (Quadro de Avisos + WhatsApp) -- prioridade #2
4. Sprint 3 (PDF + Enviar ao Cliente) -- prioridade #3
5. Sprint 5 (Prospeccao/IA/Automacao) -- prioridade #4
6. Sprint 6 (Editor Criativo) -- ultimo

---

## Observacoes Tecnicas

- **Nao sera criado Event Bus custom** -- o Supabase Realtime ja funciona como event bus (INSERT/UPDATE/DELETE em tabelas). Adicionar uma camada extra seria over-engineering.
- **WhatsApp Cloud API** requer conta Meta Business verificada + numero empresarial. O sistema mantera `wa.me` como padrao e a integracao via n8n como complemento.
- **QR/Session WhatsApp Web** nao sera implementado (instavel + viola politicas Meta). O fluxo sera sempre: gerar texto -> copiar/abrir wa.me.
- **Cada sprint sera implementado e testado antes de iniciar o proximo**, para evitar regressoes.

---

## Proximo Passo

Aprovar este plano para iniciar pelo **Sprint 1 (Design System Unificado)**. Cada sprint subsequente sera apresentado como continuacao apos o anterior estar completo.
