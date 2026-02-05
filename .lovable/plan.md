
# Plano: Corrigir Portal do Cliente para Exibir Dados

## Problema Identificado

O portal do cliente nao esta exibindo dados porque existe uma **desconexao entre as fontes de dados**:

1. **Fluxo atual do admin**: Na aba "Arquivos" do projeto, o usuario marca arquivos como `visible_in_portal=true` na tabela `project_files`
2. **Fluxo atual do cliente**: A pagina `ClientPortalPage` busca dados da tabela `portal_deliverables` (que esta vazia)

**Resultado**: Os arquivos marcados como visiveis no admin nunca chegam ao cliente.

### Evidencias encontradas:

```text
portal_links -> OK (link existe e esta ativo)
portal_deliverables -> VAZIO (nenhum registro)
project_files -> TEM DADOS (1 arquivo com visible_in_portal=true)
```

## Solucao Proposta

Modificar o hook `useClientPortal` para buscar arquivos de `project_files` atraves do `project_id` do portal, em vez de buscar de `portal_deliverables`. Isso alinha o fluxo de dados existente.

## Arquitetura da Correcao

```text
Admin marca arquivo como visivel
            |
            v
    project_files (visible_in_portal=true)
            |
            v
    portal_links (project_id) <-- Link de conexao
            |
            v
    useClientPortal busca via project_id
            |
            v
    Cliente ve os arquivos no portal
```

## Alteracoes Necessarias

### 1. Migracao SQL - RLS para project_files

Adicionar politica RLS para permitir leitura anonima de arquivos visiveis no portal:

```sql
-- Permite leitura anonima de arquivos visiveis no portal
-- quando o projeto tem um portal_link ativo
CREATE POLICY "anon_view_portal_files" ON project_files
  FOR SELECT TO anon
  USING (
    visible_in_portal = true
    AND EXISTS (
      SELECT 1 FROM portal_links pl
      WHERE pl.project_id = project_files.project_id
      AND pl.is_active = true
    )
  );
```

### 2. Atualizar useClientPortal.tsx

Modificar a query para buscar de `project_files` em vez de `portal_deliverables`:

**Antes:**
```typescript
const { data: deliverables } = await supabase
  .from('portal_deliverables')
  .select('*')
  .eq('portal_link_id', portal.id)
  .eq('visible_in_portal', true);
```

**Depois:**
```typescript
const { data: files } = await supabase
  .from('project_files')
  .select('*')
  .eq('project_id', portal.project_id)
  .eq('visible_in_portal', true)
  .order('created_at', { ascending: false });
```

### 3. Atualizar Tipos e Interface

Adaptar a interface `PortalDeliverable` para ser compativel com `ProjectFile`:

```typescript
export interface PortalFile {
  id: string;
  project_id: string;
  name: string;
  folder: string;
  file_url: string;
  file_type: string | null;
  visible_in_portal: boolean;
  created_at: string;
}

export interface PortalData {
  portal: PortalLink;
  files: PortalFile[]; // Renomear deliverables para files
  comments: PortalComment[];
  approvals: PortalApproval[];
}
```

### 4. Atualizar ClientPortalPage.tsx

Adaptar o componente para usar a nova estrutura de dados:

- Renomear `deliverables` para `files`
- Ajustar referencias de `deliverable.title` para `file.name`
- Detectar tipo de arquivo por `file_type` ou extensao
- Exibir preview adequado baseado no tipo

### 5. Ajustar Sistema de Comentarios/Aprovacoes

Como comentarios e aprovacoes estao vinculados a `deliverable_id`:
- Mudar para `file_id` referenciando `project_files.id`
- Ou manter `portal_deliverables` apenas para comentarios (vinculo: `project_file_id`)

**Opcao simplificada**: Vincular comentarios diretamente ao `project_file_id`:

```sql
-- Atualizar portal_comments para referenciar project_files
ALTER TABLE portal_comments
  ADD COLUMN project_file_id UUID REFERENCES project_files(id);

-- Adicionar RLS para comentarios
CREATE POLICY "anon_view_comments_portal_files" ON portal_comments
  FOR SELECT TO anon
  USING (
    project_file_id IN (
      SELECT id FROM project_files
      WHERE visible_in_portal = true
    )
  );

CREATE POLICY "anon_insert_comments_portal_files" ON portal_comments
  FOR INSERT TO anon
  WITH CHECK (
    project_file_id IN (
      SELECT id FROM project_files
      WHERE visible_in_portal = true
    )
  );
```

## Arquivos a Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| Migracao SQL | Criar | RLS para project_files e ajuste em portal_comments |
| `src/hooks/useClientPortal.tsx` | Modificar | Buscar de project_files via project_id |
| `src/pages/ClientPortalPage.tsx` | Modificar | Adaptar UI para estrutura de files |

## Sequencia de Implementacao

1. Criar migracao SQL com RLS policies para `project_files` e `portal_comments`
2. Atualizar `useClientPortal.tsx` para buscar de `project_files`
3. Atualizar `ClientPortalPage.tsx` para exibir arquivos
4. Testar fluxo completo end-to-end

## Resultado Esperado

Apos a implementacao:
- Arquivos marcados como "visivel no portal" na aba de arquivos aparecerao no portal do cliente
- Cliente podera comentar e aprovar arquivos
- Fluxo totalmente integrado sem necessidade de tabela separada
