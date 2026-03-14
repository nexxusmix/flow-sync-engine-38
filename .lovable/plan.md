

# Adicionar suporte a Google Drive no Portal do Cliente

## Problema
Atualmente o portal aceita YouTube, Link genérico e Arquivo. O cliente não tem uma opção dedicada para Google Drive com thumbnail, preview e ícone próprio.

## Plano

### 1. Utilitário de parsing de URLs do Google Drive
Criar helper em `src/lib/google-drive-utils.ts`:
- Extrair `fileId` de URLs do Drive (formatos: `/file/d/{id}`, `/open?id={id}`, `id={id}`)
- Gerar thumbnail: `https://drive.google.com/thumbnail?id={fileId}&sz=w400`
- Gerar URL de preview: `https://drive.google.com/file/d/{fileId}/preview`
- Detectar se uma URL é do Google Drive

### 2. Expandir o tipo de upload para incluir `'drive'`
- `ClientUploadDialog.tsx`: Adicionar `'drive'` ao `UploadType`, novo botão com ícone Drive nos quick-actions, form específico com preview da thumbnail ao colar o link
- `PortalClientUploads.tsx`: Adicionar botão Drive nos quick-actions (4 colunas), ícone Drive na lista de uploads
- `useClientPortalEnhanced.tsx`: Aceitar type `'drive'`, salvar como `external_url` com tipo `'drive'`

### 3. Edge function `portal-upload-material`
- Reconhecer `type === 'drive'`, salvar `external_url` e setar `type = 'drive'`

### 4. Thumbnail e preview na listagem
- Na lista de uploads do cliente, quando o item for `drive`, exibir a thumbnail gerada automaticamente via API pública do Google Drive
- Ao clicar, abrir preview em iframe ou nova aba

### Arquivos a editar
1. **Criar** `src/lib/google-drive-utils.ts` — helpers de parsing
2. **Editar** `src/components/client-portal/ClientUploadDialog.tsx` — novo tipo drive, botão, form, thumbnail preview
3. **Editar** `src/components/client-portal/PortalClientUploads.tsx` — botão Drive, ícone na lista, thumbnail
4. **Editar** `src/hooks/useClientPortalEnhanced.tsx` — aceitar type `'drive'`
5. **Editar** `supabase/functions/portal-upload-material/index.ts` — tratar type `'drive'`
6. **Editar** `src/hooks/useProjectAssets.tsx` — melhorar retorno de `thumbUrl` para Drive

