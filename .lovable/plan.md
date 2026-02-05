
# Plano de Finalização do SQUAD Hub

## Diagnóstico Completo

### Problema 1: Segurança RLS - Policies Duplicadas
**Status: CRÍTICO**

Foram identificadas **472 policies** no banco, com duplicação massiva:
- Para CADA tabela existem 2 conjuntos de policies:
  - **Antigas (INSEGURAS)**: `"Users can X table"` com `USING(true)` ou `WITH CHECK(true)`
  - **Novas (CORRETAS)**: `"auth_X_table"` com `auth.uid() IS NOT NULL`

Exemplo na tabela `cadences`:
```text
+------------------------------------+----------+------------------+
| Policy Name                        | Command  | Condition        |
+------------------------------------+----------+------------------+
| Users can delete cadences          | DELETE   | USING(true)      |  <- INSEGURA
| auth_delete_cadences               | DELETE   | USING(auth.uid() IS NOT NULL) | <- CORRETA
| Users can insert cadences          | INSERT   | WITH CHECK(true) | <- INSEGURA
| auth_insert_cadences               | INSERT   | WITH CHECK(auth.uid() IS NOT NULL) | <- CORRETA
+------------------------------------+----------+------------------+
```

**165 warnings** vem dessas policies antigas com `USING(true)`.

---

### Problema 2: CRM com Schema Duplicado
**Status: MÉDIO**

| Tabelas Antigas (em uso) | Tabelas Novas (criadas, não usadas) |
|--------------------------|-------------------------------------|
| `prospects`              | `crm_contacts`                      |
| `prospect_opportunities` | `crm_deals`                         |
| `prospect_activities`    | (não tem equivalente direto)        |
| `prospect_lists`         | (não tem equivalente direto)        |

O hook `useCRM.tsx` ainda referencia as tabelas antigas.

---

### Problema 3: Imports Mortos
**Status: RESOLVIDO**

O arquivo `ProjectsHeader.tsx` está limpo, sem imports de `CLIENTS` ou `TEAM_MEMBERS`.

---

## Plano de Execução

### FASE 1: Limpeza de Segurança RLS

**Objetivo**: Remover todas as policies antigas duplicadas e manter apenas as seguras.

**Ações**:

1. **Criar migração SQL para dropar policies antigas**
   - Dropar todas as policies com padrão `"Users can X"` que têm `USING(true)` ou `WITH CHECK(true)`
   - Manter apenas as policies `"auth_X"` com `auth.uid() IS NOT NULL`

2. **Tabelas afetadas** (~40 tabelas):
   - cadences, cadence_steps
   - prospects, prospect_lists, prospect_opportunities, prospect_activities
   - campaigns, content_comments, content_ideas, content_items, content_scripts
   - contracts, contract_templates, contract_links, etc.
   - proposals, proposal_items, proposal_settings
   - revenues, expenses, financial_accounts
   - calendar_events, deadlines
   - inbox_threads, inbox_messages
   - knowledge_articles
   - E todas as demais...

3. **Resultado esperado**:
   - De ~472 policies para ~200 policies
   - De 165 warnings para 0-5 warnings (restantes serão falso positivo do linter)

---

### FASE 2: Consolidação do CRM

**Objetivo**: Migrar o CRM para usar exclusivamente as tabelas `crm_*`.

**Ações**:

1. **Migração de dados** (se existirem registros):
   ```sql
   -- prospects -> crm_contacts
   INSERT INTO crm_contacts (name, company, email, phone, instagram, tags, created_at)
   SELECT decision_maker_name, company_name, email, phone, instagram, tags, created_at
   FROM prospects;
   
   -- prospect_opportunities -> crm_deals
   INSERT INTO crm_deals (title, value, stage_key, contact_id, created_at)
   SELECT po.title, po.estimated_value, po.stage, cc.id, po.created_at
   FROM prospect_opportunities po
   LEFT JOIN crm_contacts cc ON cc.name = (SELECT decision_maker_name FROM prospects WHERE id = po.prospect_id);
   ```

2. **Atualizar `useCRM.tsx`**:
   - Trocar queries de `prospects` para `crm_contacts`
   - Trocar queries de `prospect_opportunities` para `crm_deals`
   - Buscar stages de `crm_stages` ao invés de constante hardcoded
   - Remover referências a `prospect_activities`

3. **Verificar seed de `crm_stages`**:
   - Garantir que os 8 estágios existem: lead, qualificacao, diagnostico, proposta, negociacao, fechado, onboarding, pos_venda

4. **Dropar tabelas antigas** (ou arquivar):
   ```sql
   -- Opção A: Dropar
   DROP TABLE prospect_activities CASCADE;
   DROP TABLE prospect_opportunities CASCADE;
   DROP TABLE prospects CASCADE;
   DROP TABLE prospect_lists CASCADE;
   DROP TABLE do_not_contact CASCADE;
   
   -- Opção B: Arquivar (renomear)
   ALTER TABLE prospects RENAME TO archived_prospects;
   ```

---

### FASE 3: Ajustes no Frontend

**Objetivo**: Sincronizar componentes CRM com novo schema.

**Ações**:

1. **Atualizar tipos em `useCRM.tsx`**:
   ```typescript
   // De:
   from('prospect_opportunities').select('*, prospect:prospects(*)')
   
   // Para:
   from('crm_deals').select('*, contact:crm_contacts(*), stage:crm_stages(*)')
   ```

2. **Atualizar `CRMPage.tsx`**:
   - Buscar estágios dinamicamente de `crm_stages`
   - Remover `CRM_STAGES` hardcoded do hook

3. **Atualizar `KanbanColumn.tsx`**:
   - Ajustar interface `Deal` para novo schema

4. **Remover referências obsoletas**:
   - `src/types/prospecting.ts` pode ser simplificado ou removido

---

## Detalhamento Técnico

### Migração SQL - Fase 1 (RLS Cleanup)

```sql
-- PARTE 1: Dropar policies antigas (padrão "Users can X")
-- Executar para CADA tabela com duplicação

DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename, schemaname
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND (
        policyname LIKE 'Users can%'
        OR policyname LIKE '%_select'
        OR policyname LIKE '%_insert'
        OR policyname LIKE '%_update'
        OR policyname LIKE '%_delete'
      )
      AND policyname NOT LIKE 'auth_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;
```

### Migração SQL - Fase 2 (CRM)

```sql
-- Verificar se há dados para migrar
SELECT COUNT(*) FROM prospects;
SELECT COUNT(*) FROM prospect_opportunities;

-- Se houver, executar migração
-- (script detalhado será gerado dinamicamente)
```

### Alterações em Código - Fase 3

**Arquivo**: `src/hooks/useCRM.tsx`

```typescript
// ANTES
const { data } = await supabase
  .from('prospect_opportunities')
  .select('*, prospect:prospects(*)');

// DEPOIS
const { data } = await supabase
  .from('crm_deals')
  .select('*, contact:crm_contacts(*), stage:crm_stages(*)');
```

---

## Checklist de Validação Final

- [ ] Nenhuma policy com `USING(true)` ou `WITH CHECK(true)` em tabelas sensíveis
- [ ] Warnings do linter reduzidos para < 10 (restantes são falso positivo)
- [ ] CRM usando apenas `crm_contacts`, `crm_deals`, `crm_stages`
- [ ] Tabelas `prospects` e `prospect_opportunities` arquivadas ou removidas
- [ ] Build sem erros de TypeScript
- [ ] Testes manuais: login, criar deal, mover no kanban

---

## Estimativa de Impacto

| Métrica | Antes | Depois |
|---------|-------|--------|
| Policies RLS | 472 | ~200 |
| Warnings Linter | 165 | < 10 |
| Tabelas CRM | 6 (duplicadas) | 3 (consolidadas) |
| Fontes de verdade CRM | 2 | 1 |
