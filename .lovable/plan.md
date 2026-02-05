

# Plano: Upload de Arquivos do Projeto + Portal do Cliente

## Resumo

Implementar sistema completo de upload e gerenciamento de arquivos por projeto, organizados em pastas (Brutos, Projeto, Referências, Entregas, Contratos, Outros). Além disso, ativar o Portal do Cliente para que clientes acompanhem projetos, revisem entregas e aprovem versões através de link seguro.

---

## Parte 1: Sistema de Arquivos do Projeto

### 1.1 Criar Storage Bucket
Criar bucket `project-files` para armazenar arquivos dos projetos:
- Bucket público para facilitar acesso (URLs diretas)
- Organização: `{project_id}/{folder}/{filename}`

### 1.2 Criar Tabela `project_files`
```text
project_files
├── id (uuid, PK)
├── project_id (uuid, FK -> projects)
├── name (text) - nome do arquivo
├── folder (text) - brutos, projeto, referencias, entregas, contratos, outros
├── file_url (text) - URL do arquivo no storage
├── file_type (text) - mime type
├── file_size (bigint) - tamanho em bytes
├── visible_in_portal (boolean) - se aparece no portal do cliente
├── uploaded_by (uuid) - quem fez upload
├── uploaded_by_name (text)
├── tags (text[]) - tags para busca
├── created_at (timestamp)
```

### 1.3 RLS Policies
- Usuários autenticados podem fazer CRUD em arquivos
- Portal público pode SELECT arquivos marcados como `visible_in_portal`

### 1.4 Hook `useProjectFiles`
- `uploadFile()` - upload para storage + insert no banco
- `deleteFile()` - remove do storage + delete no banco
- `moveFile()` - muda pasta do arquivo
- `togglePortalVisibility()` - marca/desmarca visibilidade no portal

### 1.5 Componente `FilesTab` Atualizado
- Modal de upload com seleção de pasta destino
- Grid de pastas mostrando arquivos reais
- Ações: download, deletar, mover para outra pasta
- Toggle "Visível no Portal"
- Suporte drag-and-drop

---

## Parte 2: Portal do Cliente

### 2.1 Componente `PortalTab` Completo
Interface de gerenciamento do portal com:
- **Criar/Regenerar Link**: gera token único para compartilhar
- **Copiar Link**: botão para copiar URL do portal
- **Ativar/Desativar**: controla acesso ao portal
- **Data de Expiração**: opção de definir validade do link
- **Bloquear por Pagamento**: toggle para bloquear acesso se inadimplente

### 2.2 Gerenciar Entregas do Portal
- Listar entregas visíveis no portal
- Adicionar/Remover entregas
- Ver comentários e aprovações do cliente
- Status de cada entrega (pendente, em revisão, aprovado)

### 2.3 Fluxo do Portal
```text
1. Equipe gera link no PortalTab
2. Link é enviado ao cliente (ex: client/abc123def)
3. Cliente acessa e vê:
   - Nome do projeto
   - Status geral
   - Entregas disponíveis
   - Botão de aprovar/comentar
4. Ações do cliente são registradas (audit)
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `migration.sql` | Criar tabela + bucket + RLS |
| `src/hooks/useProjectFiles.tsx` | Novo hook de arquivos |
| `src/components/projects/detail/tabs/FilesTab.tsx` | Implementar UI completa |
| `src/components/projects/detail/tabs/PortalTab.tsx` | Implementar gestão do portal |

---

## Detalhes Técnicos

### Migration SQL
```sql
-- Storage bucket para arquivos de projeto
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Tabela de arquivos
CREATE TABLE IF NOT EXISTS public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  folder text NOT NULL DEFAULT 'outros',
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  visible_in_portal boolean DEFAULT false,
  uploaded_by uuid,
  uploaded_by_name text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Policy para usuários autenticados
CREATE POLICY "auth_project_files_all" ON project_files
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy para acesso público (portal)
CREATE POLICY "public_portal_files_select" ON project_files
  FOR SELECT TO anon USING (visible_in_portal = true);

-- Storage policies
CREATE POLICY "auth_storage_project_files_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'project-files')
  WITH CHECK (bucket_id = 'project-files');
```

### useProjectFiles Hook
```typescript
// Principais funções:
- useProjectFiles(projectId) // retorna arquivos do projeto
- uploadFile({ file, folder, projectId })
- deleteFile(fileId)
- updateFile({ id, visible_in_portal, folder })
```

### FilesTab UI
- Header com botão "Upload de Arquivo"
- Grid 3 colunas com as 6 pastas
- Cada pasta mostra count e lista de arquivos
- Clique no arquivo abre preview/download
- Menu de contexto: deletar, mover, toggle portal

### PortalTab UI
- Se não tem link: botão "Gerar Link do Portal"
- Se tem link:
  - URL copiável
  - Toggle ativo/inativo
  - Input data expiração
  - Toggle bloqueio por pagamento
  - Lista de entregas no portal
  - Histórico de atividades do cliente

---

## Resultado Esperado

1. **Arquivos**: Upload funcional com organização em pastas, preview, download e gestão de visibilidade no portal
2. **Portal**: Link compartilhável para cliente acompanhar projeto, revisar e aprovar entregas
3. **Segurança**: RLS protegendo dados, apenas arquivos marcados aparecem no portal público

