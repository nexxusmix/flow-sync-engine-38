
# Plano: Portal de Materiais com Revisões, Versões e Changelog

## Objetivo
Melhorar a seção "Materiais do Projeto" no Portal do Cliente para:
1. **Envio fácil de materiais** pelo gestor
2. **Comentários de revisão** diretamente nos materiais
3. **Exibir título e versão do vídeo** (V01, V02, V03...)
4. **Tags de alteração** resumidas do que mudou em cada versão
5. **Descrição e tópicos** do que foi alterado em cada versão

---

## Alterações no Banco de Dados

Adicionar campos na tabela `portal_deliverable_versions`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `change_tags` | `text[]` | Tags resumidas do que mudou (ex: "cor", "áudio", "corte") |
| `changelog_items` | `jsonb` | Lista estruturada de tópicos alterados |

```sql
ALTER TABLE public.portal_deliverable_versions
ADD COLUMN IF NOT EXISTS change_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS changelog_items JSONB DEFAULT '[]';
```

---

## Arquivos a Modificar/Criar

| Arquivo | Alteração |
|---------|-----------|
| `PortalDeliverablesTab.tsx` | Redesign com foco em versões e comentários rápidos |
| `PortalVersionCard.tsx` | **NOVO** - Card de material com timeline de versões inline |
| `PortalMaterialDetailPanel.tsx` | **NOVO** - Painel lateral com detalhes, versões e comentários |
| `AddMaterialDialog.tsx` | Adicionar campos de versão e changelog ao enviar nova versão |
| `useClientPortalEnhanced.tsx` | Atualizar tipos para incluir novos campos |
| `PortalTabsPremium.tsx` | Renomear "Entregas" para "Materiais" |

---

## Novo Design da Aba de Materiais

```
┌──────────────────────────────────────────────────────────────────────┐
│  MATERIAIS DO PROJETO                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ + Enviar Material │ + Nova Versão                               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ 📹 Filme Institucional - Final                    V03 │ Atual │ │
│  │ ─────────────────────────────────────────────────────────────── │ │
│  │ Tags: [cor] [áudio] [corte final]                              │ │
│  │                                                                 │ │
│  │ O que mudou nesta versão:                                      │ │
│  │ • Ajuste de color grading nos takes externos                   │ │
│  │ • Mixagem de áudio final com VO                               │ │
│  │ • Corte da cena 3 conforme solicitado                         │ │
│  │                                                                 │ │
│  │ ┌─────────────────────────────────────────────────────────────┐│ │
│  │ │ 💬 Adicionar comentário de revisão...                      ││ │
│  │ └─────────────────────────────────────────────────────────────┘│ │
│  │                                                                 │ │
│  │ Versões anteriores: V02 • V01                                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### 1. Novo Componente: PortalMaterialCard

```tsx
interface PortalMaterialCardProps {
  material: PortalDeliverable;
  versions: PortalVersion[];
  comments: PortalComment[];
  approval?: PortalApproval;
  onAddComment: (content: string) => void;
  onRequestRevision: (content: string) => void;
  onViewVersion: (version: PortalVersion) => void;
}

// Exibe:
// - Título com badge de versão (V01, V02, V03)
// - Thumbnail com overlay de play
// - Tags de alteração como badges coloridas
// - Lista de changelog items como bullet points
// - Input de comentário inline (expandível)
// - Timeline compacta de versões anteriores
```

### 2. Tags de Alteração (Predefinidas)

```typescript
const REVISION_TAGS = [
  { id: 'color', label: 'Cor/Grade', color: 'bg-purple-500' },
  { id: 'audio', label: 'Áudio', color: 'bg-blue-500' },
  { id: 'cut', label: 'Corte', color: 'bg-amber-500' },
  { id: 'graphics', label: 'Grafismos', color: 'bg-emerald-500' },
  { id: 'vo', label: 'Locução', color: 'bg-pink-500' },
  { id: 'music', label: 'Música', color: 'bg-cyan-500' },
  { id: 'text', label: 'Texto', color: 'bg-orange-500' },
  { id: 'other', label: 'Outros', color: 'bg-gray-500' },
];
```

### 3. Estrutura do Changelog (JSONB)

```typescript
interface ChangelogItem {
  description: string;
  timestamp?: string;
  category?: string;
}

// Exemplo:
const changelog_items: ChangelogItem[] = [
  { description: "Ajuste de color grading nos takes externos", category: "color" },
  { description: "Mixagem de áudio final com VO", category: "audio" },
  { description: "Corte da cena 3 conforme solicitado", category: "cut" },
];
```

### 4. Fluxo de Enviar Nova Versão

1. Gestor clica em "Nova Versão" em um material existente
2. Modal abre com:
   - Preview do material atual
   - Upload de novo arquivo / link
   - Seletor de tags (multi-select)
   - Campo de changelog (tópicos do que mudou)
3. Ao salvar:
   - Incrementa `current_version` no deliverable
   - Cria novo registro em `portal_deliverable_versions`
   - Notificação para o cliente (futuro)

### 5. Comentário Inline Rápido

- Input sempre visível abaixo de cada material
- Placeholder: "Adicionar comentário de revisão..."
- Ao focar, expande com botões "Aprovar" e "Solicitar Ajuste"
- Comentários anteriores aparecem em thread colapsável

---

## Tipos Atualizados

```typescript
// useClientPortalEnhanced.tsx
export interface PortalVersion {
  id: string;
  deliverable_id: string;
  version_number: number;
  title: string | null;
  notes: string | null;
  file_url: string | null;
  created_at: string;
  created_by_name: string | null;
  change_tags: string[];          // NOVO
  changelog_items: ChangelogItem[]; // NOVO
}

interface ChangelogItem {
  description: string;
  category?: string;
}
```

---

## Fluxo Visual

```
Cliente abre Portal
       │
       ▼
┌─────────────────────┐
│ Aba "Materiais"     │
│ (antes: "Entregas") │
└─────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Lista de Materiais com:                 │
│ • Título + Versão (V01, V02...)        │
│ • Tags de alteração (badges)            │
│ • Changelog (bullet points)             │
│ • Input de comentário inline            │
│ • Versões anteriores (colapsável)       │
└─────────────────────────────────────────┘
       │
       ▼
Cliente pode:
• Ver detalhes de cada versão
• Adicionar comentário de revisão
• Aprovar material
• Solicitar ajuste com descrição
```

---

## Resultado Esperado

- **Visualização clara** de versões (V01, V02, V03...)
- **Tags resumidas** do que mudou em cada versão
- **Changelog estruturado** com bullet points
- **Comentários de revisão** inline e rápidos
- **Timeline de versões** para histórico completo
- **Fluxo intuitivo** para cliente aprovar ou solicitar ajustes
