
# Plano: Finalizar Limpeza de Dados Mock

## 1. Corrigir Erro de Build (ScheduleTab.tsx)

**Problema:** O tipo `status` está como `string` mas precisa ser um literal type.

**Correção:**
```typescript
status: (stage.status === 'concluido' ? 'done' : 
         stage.status === 'em_andamento' ? 'in_progress' : 
         'not_started') as 'done' | 'in_progress' | 'not_started' | 'blocked',
```

---

## 2. Limpar CRMPage.tsx

Remover os arrays mock `initialDeals` e `initialColumns` e substituir por estado vazio com empty state elegante.

**Mudanças:**
- Remover dados hardcoded de deals e contacts
- Mostrar empty state: "Nenhum deal no CRM" com CTA "Criar Primeiro Deal"
- Manter estrutura do Kanban para quando houver dados reais

---

## 3. Criar Página Danger Zone (Settings)

**Novo arquivo:** `src/pages/settings/DangerZoneSettingsPage.tsx`

**Funcionalidades:**
- Botão "Zerar Plataforma" (vermelho, danger zone)
- Modal de confirmação pedindo digitar "ZERAR"
- Só visível para admin/dono
- Chama edge function para limpar dados

---

## 4. Criar Edge Function para Reset

**Novo arquivo:** `supabase/functions/platform-reset/index.ts`

**Lógica:**
- Verificar autenticação e role do usuário
- Deletar dados das tabelas operacionais em ordem (respeitando FKs):
  - content_ideas, campaigns, content_posts
  - revenues, expenses, contracts, invoices
  - proposals
  - (outras tabelas conforme existirem)
- Manter tabelas de configuração e usuários
- Registrar log do reset

---

## 5. Atualizar Roteamento

Adicionar rota `/configuracoes/danger-zone` no `App.tsx`

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/projects/detail/tabs/ScheduleTab.tsx` | Corrigir tipo |
| `src/pages/CRMPage.tsx` | Remover mock, adicionar empty state |
| `src/pages/settings/DangerZoneSettingsPage.tsx` | Criar novo |
| `src/pages/settings/SettingsDashboard.tsx` | Adicionar link para Danger Zone |
| `supabase/functions/platform-reset/index.ts` | Criar novo |
| `src/App.tsx` | Adicionar rota |

---

## Resultado Final

- Plataforma 100% limpa
- Todas as telas com empty states elegantes
- Botão admin para zerar dados reais no Supabase
- Segurança via verificação de role na edge function
