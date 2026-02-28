

## Plano: Upload Universal — Múltiplos Arquivos, Qualquer Tipo, Drag & Drop

### Inventário de uploads encontrados (14 locais)

| # | Arquivo | Múltiplo | Drag&Drop | Accept restritivo |
|---|---------|----------|-----------|-------------------|
| 1 | `ClientUploadDialog.tsx` | ✅ | ✅ | Parcial (falta .7z, .tar) |
| 2 | `UploadMaterialDialog.tsx` | ✅ | ✅ | Sem restrict (ok) |
| 3 | `AddMaterialDialog.tsx` | ❌ single | ❌ | Restritivo |
| 4 | `FilesTab.tsx` | ✅ | ✅ folders | Sem restrict (ok) |
| 5 | `GalleryTab.tsx` | ✅ | ❌ | `image/*,.pdf,.doc,.docx` |
| 6 | `DeliverablesTab.tsx` | ✅ | ❌ | Sem restrict (ok) |
| 7 | `ContentAssetsTab.tsx` | ✅ | ❌ | `image/*,video/*,audio/*,.pdf,.doc,.docx` |
| 8 | `LibraryPage.tsx` | ✅ | ❌ | `image/*,video/*,audio/*,.pdf` |
| 9 | `MkAssetsPage.tsx` | ✅ | ✅ | Sem restrict (ok) |
| 10 | `TaskEditDrawer.tsx` | ✅ | ❌ | Sem restrict (ok) |
| 11 | `TaskDetailModal.tsx` | ✅ | ❌ | Sem restrict (ok) |
| 12 | `ContractAiUploadDialog.tsx` | ❌ single | ✅ | `.pdf,.docx,.doc,.jpg...` |
| 13 | `ContractAiUpdateDialog.tsx` | ❌ single | ✅ | `.pdf,.docx,.doc,.jpg...` |
| 14 | `TranscribePage.tsx` | ✅ | ❌ | `audio/*,video/*` |
| 15 | `AddUpdateModal.tsx` | ✅ | ❌ | `image/*` |
| 16 | `AiAddTasksDialog.tsx` | ✅ | ❌ | Restritivo |
| 17 | `AIAssistant.tsx` | ✅ | ❌ | Restritivo |

### Mudanças por arquivo

**1. Criar componente reutilizável `DropZone.tsx`** (novo)
- Componente genérico de drag & drop + click-to-select
- Props: `multiple`, `accept`, `onFiles`, `disabled`, `children`
- Visual: borda tracejada, highlight ao arrastar, texto "Arraste arquivos aqui"
- Usado como base para padronizar todos os uploads

**2. `AddMaterialDialog.tsx`** — Maior refactor
- Trocar de single file para múltiplos arquivos (array)
- Remover restrict de `accept` → aceitar tudo (`*/*`)
- Adicionar drag & drop zone
- Upload em loop (já existe padrão no projeto)

**3. `GalleryTab.tsx`**
- Remover `accept="image/*,.pdf,.doc,.docx"` → aceitar tudo
- Adicionar drag & drop na área de upload (onDragOver/onDrop)

**4. `ContentAssetsTab.tsx`**
- Remover `accept` restritivo → aceitar tudo
- Adicionar drag & drop zone

**5. `LibraryPage.tsx`**
- Remover `accept="image/*,video/*,audio/*,.pdf"` → aceitar tudo
- Adicionar drag & drop (já existe no MkAssetsPage, replicar padrão)

**6. `TranscribePage.tsx`**
- Manter accept `audio/*,video/*` (faz sentido para transcrição)
- Adicionar drag & drop zone

**7. `TaskEditDrawer.tsx`** + **`TaskDetailModal.tsx`**
- Adicionar drag & drop na área de attachments
- Manter `multiple` (já tem)

**8. `AddUpdateModal.tsx`**
- Manter accept `image/*` (é específico para prints)
- Adicionar drag & drop

**9. `AiAddTasksDialog.tsx`**
- Expandir accept para incluir `.zip,.rar,.7z`
- Adicionar drag & drop zone

**10. `AIAssistant.tsx`**
- Expandir accept para incluir `.zip,.rar,.7z,.pptx,.xlsx`
- Adicionar drag & drop na área de input

**11. `ClientUploadDialog.tsx`**
- Expandir accept: adicionar `.7z,.tar.gz,.mp3,.mp4,.mov,.avi`
- Já tem drag & drop ✅

**12. `DeliverablesTab.tsx`**
- Adicionar drag & drop na área de upload

**13. Contratos (`ContractAiUploadDialog.tsx` + `ContractAiUpdateDialog.tsx`)**
- Manter single file (faz sentido — 1 contrato por vez)
- Já tem drag & drop ✅
- Expandir accept: adicionar `.zip` para contratos compactados

### Resumo de impacto
- **1 novo componente**: `src/components/ui/DropZone.tsx`
- **~14 arquivos editados** para: expandir `accept`, adicionar drag & drop, garantir `multiple`
- Sem mudanças em edge functions ou banco de dados

