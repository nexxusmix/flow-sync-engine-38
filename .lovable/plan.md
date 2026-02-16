
# Isolar Dados por Usuario: Cada um ve apenas o seu

## Problema Atual

As tabelas `revenues`, `expenses`, `campaigns` e `content_items` nao possuem coluna `created_by`. As politicas RLS dessas tabelas apenas verificam `auth.uid() IS NOT NULL`, ou seja, qualquer usuario logado ve TODOS os dados dessas tabelas. Isso faz com que os dados ficticios do Gabriel aparecam para o Matheus e vice-versa.

Alem disso, existem 18 expenses duplicados (3 execucoes do seed criaram 3x os mesmos 6 registros).

## O que sera feito

### 1. Migracoes no banco de dados

Adicionar coluna `created_by UUID REFERENCES auth.users(id)` nas tabelas:
- `revenues`
- `expenses`
- `campaigns`
- `content_items`

Atualizar as politicas RLS de SELECT/UPDATE/DELETE para filtrar por `created_by = auth.uid()` e as de INSERT para setar `created_by = auth.uid()` no `WITH CHECK`.

### 2. Atribuir dados existentes ao Matheus

Executar UPDATE para setar `created_by` dos registros existentes (Porto 153 revenues, content_items existentes, etc.) para o user_id do Matheus (`5bdb380c-6d49-4f80-b42b-856484360bd5`).

### 3. Limpar duplicatas

Deletar as 12 expenses duplicadas (manter apenas 6 unicos).

### 4. Atualizar Edge Function `seed-demo-user`

Adicionar `created_by: userId` em todos os inserts de revenues, expenses, campaigns e content_items. Tambem limpar dados antigos do Gabriel antes de re-inserir (evitar duplicatas em futuras execucoes).

### 5. Atualizar frontend

Modificar os stores e hooks que criam registros nessas tabelas para incluir `created_by` automaticamente:
- `src/stores/financialStore.ts` - createRevenue, createExpense
- `src/stores/marketingStore.ts` - createContentItem, createCampaign (se aplicavel)
- `src/hooks/useProjects.tsx` - onde cria revenues vinculadas a projetos

### 6. Re-executar seed do Gabriel

Chamar a Edge Function novamente para popular os dados do Gabriel com o campo `created_by` corretamente preenchido.

## Arquivos a modificar

1. **Migracao SQL** - Adicionar coluna `created_by` + atualizar RLS em `revenues`, `expenses`, `campaigns`, `content_items`
2. **`supabase/functions/seed-demo-user/index.ts`** - Adicionar `created_by` em todos os inserts + limpeza previa
3. **`src/stores/financialStore.ts`** - Incluir `created_by` nos inserts de revenue/expense
4. **`src/stores/marketingStore.ts`** - Incluir `created_by` nos inserts de content_items/campaigns
5. **`src/hooks/useProjects.tsx`** - Incluir `created_by` nos inserts de revenues
6. **SQL de dados** - Atribuir registros existentes ao Matheus + limpar duplicatas

## Detalhes Tecnicos

### Migracao SQL
```sql
ALTER TABLE revenues ADD COLUMN created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE expenses ADD COLUMN created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE campaigns ADD COLUMN created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE content_items ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Atualizar RLS para filtrar por created_by
DROP POLICY auth_select_revenues ON revenues;
CREATE POLICY auth_select_revenues ON revenues FOR SELECT USING (created_by = auth.uid());
-- (repetir para UPDATE, DELETE, INSERT em todas as 4 tabelas)
```

### Frontend - financialStore.ts
```typescript
createRevenue: async (data) => {
  const { data: { user } } = await supabase.auth.getUser();
  const insertData = { ...data, created_by: user?.id };
  // ...insert
}
```

### Seed - limpeza previa
```typescript
// Limpar dados antigos do Gabriel antes de re-inserir
await supabase.from('revenues').delete().eq('created_by', userId);
await supabase.from('expenses').delete().eq('created_by', userId);
await supabase.from('content_items').delete().eq('created_by', userId);
await supabase.from('campaigns').delete().eq('created_by', userId);
```
