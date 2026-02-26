
# Plano Ciclo 2 — Evolução do Quadro de Tarefas

## Fase 6 — Drag-and-Drop Vertical + Atribuição a Membros ✅
## Fase 7 — Templates de Tarefa ✅
## Fase 8 — Dependências entre Tarefas ✅

---

# Plano Ciclo 3 — Subtarefas, Automações, Gantt e Comentários

## Fase 9 — Subtarefas Aninhadas ✅
## Fase 10 — Comentários e Atividade ✅
## Fase 11 — Visão Gantt / Timeline ✅
## Fase 12 — Automações / Regras ✅

---

# Plano Ciclo 4 — Dashboard Executivo, Colaboração, Integrações, Mobile

## Fase 13 — Dashboard Executivo ✅
## Fase 14 — Workspace Colaborativo ✅

### Implementado:
- **Presença em tempo real**: `useWorkspacePresence` hook com Supabase Realtime presence channel
- **Indicadores online**: Dots verdes nos avatares de membros online no TeamManagement e Dashboard
- **Activity Feed**: Componente `ActivityFeed` lendo event_logs com labels em PT-BR, ícones por entity_type
- **Dashboard integrado**: Feed de atividade + painel "Online Agora" no Dashboard Executivo
- **Permission Gate**: `useWorkspacePermissions` hook + `PermissionGate` component para controle de acesso por role
- **Fluxo de convite completo**: TeamManagement agora chama edge function `invite-user` que gera link de convite real via auth
- **Roles por workspace**: owner, admin, editor, viewer com permissões mapeadas

## Fase 15 — Integrações Externas

## Fase 16 — Mobile & PWA ✅

### Implementado:
- **PWA completo**: vite-plugin-pwa com manifest, service worker, cache offline
- **Ícones PWA**: 192x192 e 512x512 (maskable)
- **Meta tags mobile**: apple-mobile-web-app, theme-color, viewport-fit=cover
- **Bottom Navigation**: Barra inferior com 5 itens (Home, Projetos, Tarefas, CRM, Mais) com indicador animado
- **Responsividade**: Sidebar oculta no mobile, padding extra para bottom nav, safe-area-inset
- **Cache offline**: Google Fonts (CacheFirst) + API calls (NetworkFirst com timeout)
- **Instalação**: Automática via browser prompt (Add to Home Screen)

---

## Ordem: Fase 13 ✅ → Fase 16 ✅ → Fase 14 → Fase 15
