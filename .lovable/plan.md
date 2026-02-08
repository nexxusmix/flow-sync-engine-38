
# Plano: Sistema Completo de Revisões do Portal do Cliente

## Objetivo
Implementar um sistema robusto de revisões que permita ao cliente:
- Escrever comentários de revisão
- Marcar trechos específicos de vídeo (timecode/frame)
- Desenhar/anotar diretamente no player
- Ver e gerenciar solicitações de ajustes

E à equipe (plataforma):
- Visualizar todas as revisões recebidas em tempo real
- Filtrar por status, prioridade e material
- Responder e resolver ajustes
- Acesso rápido às revisões pendentes

---

## Arquitetura Atual (Análise)

### Banco de Dados
- `portal_comments`: já possui campo `timecode` (texto)
- `portal_change_requests`: sistema de solicitações de ajustes
- `portal_deliverables`: materiais do projeto
- `portal_deliverable_versions`: versionamento

### Componentes Existentes
- `PortalRevisionsTab.tsx` (portal): exibe revisões de forma básica
- `RevisionsTab.tsx` (plataforma): vazio, sem integração real
- `PortalInlineComment.tsx`: formulário básico de comentários
- `PortalChangeRequests.tsx`: lista de ajustes com formulário

### Lacunas Identificadas
1. Sem player com marcação de timecode
2. Sem ferramenta de anotação visual (desenho/seta)
3. Aba de Revisões na plataforma vazia
4. Sem integração real entre Portal e Plataforma
5. Sem notificações/acesso rápido

---

## Implementação

### Fase 1: Migração de Banco de Dados
Adicionar campos para suportar anotações visuais e frames

```sql
-- Adicionar campos para anotações visuais nos comentários
ALTER TABLE public.portal_comments 
ADD COLUMN IF NOT EXISTS frame_timestamp_ms INTEGER,
ADD COLUMN IF NOT EXISTS annotation_data JSONB,
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- Índice para busca por deliverable
CREATE INDEX IF NOT EXISTS idx_portal_comments_deliverable 
ON public.portal_comments(deliverable_id);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_portal_comments_status 
ON public.portal_comments(status);
```

### Fase 2: Componente de Player com Marcação de Timecode

**Novo arquivo:** `src/components/client-portal/portal-materials/VideoPlayerWithMarkers.tsx`

```text
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│              VIDEO PLAYER                       │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ ▶ ───●───────────────────────────── 00:45/02:30│
│  [🎯 Marcar Frame] [✏️ Anotar] [📸 Screenshot]  │
└─────────────────────────────────────────────────┘
│ Comentários no tempo: 00:12 ● 00:45 ● 01:23    │
└─────────────────────────────────────────────────┘
```

Funcionalidades:
- Captura de timecode atual ao pausar
- Botão "Marcar Frame" salva timestamp
- Marcadores visuais na timeline (dots coloridos)
- Clique no marcador navega para o tempo
- Suporte a vídeo nativo e YouTube (via iframe API)

### Fase 3: Sistema de Anotações Visuais

**Novo arquivo:** `src/components/client-portal/portal-materials/AnnotationCanvas.tsx`

Ferramenta overlay sobre o player:
- Desenho livre (brush)
- Setas e formas básicas
- Cores predefinidas (vermelho, amarelo, azul)
- Captura de screenshot com anotação
- Salva como `annotation_data` (JSONB) + `screenshot_url` (storage)

### Fase 4: Formulário de Revisão Avançado

**Atualizar:** `src/components/client-portal/portal-materials/PortalInlineComment.tsx`

Novo design:
```text
┌─────────────────────────────────────────────────┐
│ ⏱ Frame: 00:45                    [Alterar]   │
├─────────────────────────────────────────────────┤
│ [Miniatura do frame com anotação]              │
├─────────────────────────────────────────────────┤
│ Descreva o ajuste necessário...                │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│ Prioridade: ○ Normal ○ Alta ○ Urgente         │
├─────────────────────────────────────────────────┤
│              [Cancelar]  [Enviar Revisão]      │
└─────────────────────────────────────────────────┘
```

### Fase 5: Aba de Revisões no Portal (Aprimorada)

**Atualizar:** `src/components/client-portal/portal-tabs/PortalRevisionsTab.tsx`

Seções:
1. **Resumo Visual**: Cards com contagem (Pendentes, Em Andamento, Resolvidos)
2. **Lista de Revisões**: Timeline visual com filtros
3. **Detalhes**: Clique expande com screenshot/anotação
4. **Novo Ajuste Global**: Botão para criar ajuste sem material específico

### Fase 6: Aba de Revisões na Plataforma (Nova)

**Atualizar:** `src/components/projects/detail/tabs/RevisionsTab.tsx`

Implementar integração real com dados:

```text
┌─────────────────────────────────────────────────────────────┐
│  Revisões do Projeto                          [🔄 Atualizar]│
├────────────┬────────────┬────────────┬────────────┬─────────┤
│   Total    │ Pendentes  │ Em Análise │ Resolvidos │ Etapas  │
│     12     │     5      │     2      │     5      │    8    │
├────────────┴────────────┴────────────┴────────────┴─────────┤
│  [Gerar Resumo com IA ✨]                                   │
├─────────────────────────────────────────────────────────────┤
│ Filtros: [Todos ▼] [Material ▼] [Prioridade ▼]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔴 Urgente  |  Vídeo Institucional - V02                │ │
│ │ 00:45 - "Corrigir cor do logo neste frame"             │ │
│ │ Cliente: João Silva  •  há 2 horas                      │ │
│ │ [📸 Ver Anotação] [💬 Responder] [✅ Resolver]          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟡 Normal   |  Teaser Redes - V01                       │ │
│ │ 01:23 - "Adicionar legenda neste trecho"               │ │
│ │ Cliente: Maria Costa  •  há 5 horas                     │ │
│ │ [📸 Ver Anotação] [💬 Responder] [✅ Resolver]          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 7: Hook de Revisões Centralizado

**Novo arquivo:** `src/hooks/useProjectRevisions.tsx`

```typescript
export function useProjectRevisions(projectId: string) {
  // Busca comentários do portal via portal_link_id
  // Busca change_requests
  // Agrupa por deliverable
  // Métodos: updateStatus, addResponse, resolve
  return {
    comments,
    changeRequests,
    pendingCount,
    resolvedCount,
    markAsResolved,
    addManagerResponse,
    isLoading,
  };
}
```

### Fase 8: Acesso Rápido / Dashboard

**Atualizar:** `src/components/dashboard/ActionsList.tsx` ou criar widget

Adicionar na dashboard principal:
- Card "Revisões Pendentes" com badge de contagem
- Clique direto leva para a revisão no projeto
- Ordenado por prioridade e data

### Fase 9: Realtime Sync

**Atualizar:** `src/hooks/usePortalRealtime.tsx`

Já existe estrutura básica, garantir que:
- Novos comentários invalidem cache
- Mudanças de status propagam para plataforma
- Toast de notificação para equipe

---

## Arquivos a Criar/Modificar

### Novos Arquivos
1. `src/components/client-portal/portal-materials/VideoPlayerWithMarkers.tsx`
2. `src/components/client-portal/portal-materials/AnnotationCanvas.tsx`
3. `src/components/client-portal/portal-materials/RevisionForm.tsx`
4. `src/hooks/useProjectRevisions.tsx`

### Modificações
1. `src/components/client-portal/portal-tabs/PortalRevisionsTab.tsx` - Aprimorar UI
2. `src/components/projects/detail/tabs/RevisionsTab.tsx` - Implementar integração
3. `src/components/client-portal/portal-materials/PortalInlineComment.tsx` - Adicionar campos
4. `src/components/client-portal/portal-materials/PortalMaterialsTab.tsx` - Integrar player
5. `src/hooks/useClientPortalEnhanced.tsx` - Adicionar campos de anotação
6. `src/pages/ClientPortalPageNew.tsx` - Conectar componentes

### Migração SQL
1. Adicionar colunas `frame_timestamp_ms`, `annotation_data`, `screenshot_url` em `portal_comments`

---

## Fluxo de Uso

### Cliente no Portal
1. Abre material → Player carrega
2. Pausa no frame problemático → Clica "Marcar Frame"
3. Desenha anotação visual (opcional)
4. Escreve descrição do ajuste
5. Define prioridade → Envia

### Equipe na Plataforma
1. Recebe notificação / vê badge no dashboard
2. Abre projeto → Aba Revisões
3. Visualiza screenshot com anotação + timecode
4. Abre player, navega para o frame exato
5. Responde / Marca como resolvido
6. Cliente recebe atualização em tempo real

---

## Técnicas Especiais

### Captura de Frame do Vídeo
```typescript
// Para vídeo HTML5
const captureFrame = (video: HTMLVideoElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')?.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8);
};
```

### YouTube iframe API
```typescript
// Carregar API e controlar player
const player = new YT.Player('player', {
  events: {
    onStateChange: (e) => {
      if (e.data === YT.PlayerState.PAUSED) {
        const currentTime = player.getCurrentTime();
        // Capturar timecode
      }
    }
  }
});
```

---

## Resultado Esperado

1. **Portal do Cliente**: Experiência completa de revisão com marcação visual
2. **Plataforma**: Visão centralizada de todas as revisões do projeto
3. **Integração**: Dados fluem em tempo real entre ambos
4. **Produtividade**: Menos idas e vindas, comunicação precisa com frames marcados
