
# Plano: Expansão do Portal do Cliente

## Resumo
Expandir o Portal do Cliente para incluir todas as informações que aparecem no detalhe do projeto (Overview), adicionar funcionalidade de upload de materiais/logo pelo gestor, e permitir que o cliente visualize o progresso completo do projeto.

---

## Seção 1: Novas Informações no Portal do Cliente

### 1.1 Header Expandido com Banner + Logo
- Adicionar banner do projeto no topo do header (igual ao ProjectHeader interno)
- Exibir logo do projeto ao lado do título (já parcialmente implementado)
- Mostrar badges de status, template e etapa atual

### 1.2 Cards de Métricas Completos
O portal já tem 4 cards (Valor, Saúde, Entrega, Responsável). Vamos adicionar:
- **Progresso**: percentual de etapas concluídas (0/9 etapas)
- **Etapa Atual**: nome da etapa com badge visual

### 1.3 Seção de Briefing do Projeto
- Exibir o campo `description` do projeto em formato read-only
- Renderizado com Markdown para suportar formatação

### 1.4 Etapas do Projeto (Pipeline Visual)
- Mostrar a timeline de etapas do projeto
- Status visual: concluída (verde), em andamento (azul), não iniciada (cinza)
- Baseado nos dados da tabela `project_stages`

### 1.5 Indicadores Adicionais
Cards de rodapé com:
- Status do projeto (active/paused/completed)
- Data de entrega
- Nome do cliente
- Bloqueio financeiro (ativo/inativo)

---

## Seção 2: Upload de Materiais pelo Gestor

### 2.1 Novo Componente: AddMaterialDialog
Opções de envio:
1. **Upload de Arquivo** - Envia para Storage bucket `project-files`
2. **Link do YouTube** - Extrai ID e salva `youtube_url`
3. **Link Externo** - Drive, Vimeo, qualquer URL

### 2.2 Dados salvos em `portal_deliverables`
- `title`: Nome do material
- `description`: Descrição opcional
- `file_url`: URL do arquivo (se upload)
- `youtube_url`: URL do YouTube (se vídeo)
- `external_url`: URL externa (se link)
- `awaiting_approval`: true por padrão
- `visible_in_portal`: true

### 2.3 Fluxo do Gestor
1. Acessar aba "Portal" no detalhe do projeto
2. Clicar "Adicionar Material"
3. Escolher tipo: Arquivo / YouTube / Link
4. Preencher título e fazer upload/colar URL
5. Material aparece no portal do cliente automaticamente (realtime)

---

## Seção 3: Upload de Logo do Projeto pelo Gestor

### 3.1 Integração no PortalTab
- Adicionar botão "Enviar Logo do Projeto" na aba Portal
- Usar componente existente `ProjectLogoUpload`
- Salvar `logo_url` no projeto

### 3.2 Exibição no Portal
- Logo aparece no header do portal
- Fallback para logo da plataforma (squad-hub-logo.png) se não houver

---

## Arquivos a Criar/Modificar

### Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `src/components/client-portal/PortalOverviewSection.tsx` | Briefing + Etapas + Métricas |
| `src/components/client-portal/PortalProjectStages.tsx` | Timeline visual das etapas |
| `src/components/client-portal/AddMaterialDialog.tsx` | Modal de envio de materiais |

### Arquivos Modificados
| Arquivo | Mudanças |
|---------|----------|
| `src/pages/ClientPortalPageNew.tsx` | Adicionar novas seções |
| `src/hooks/useClientPortalEnhanced.tsx` | Buscar `project_stages` |
| `src/components/projects/detail/tabs/PortalTab.tsx` | Botões de upload |

---

## Seção Técnica

### Estrutura do Portal Expandido

```text
┌─────────────────────────────────────────────────────────┐
│ HEADER (sticky)                                          │
│ ┌─────────┐                                              │
│ │ Logo    │  Título do Projeto     [Etapa] [Bloqueado]   │
│ └─────────┘  Nome do Cliente                             │
├─────────────────────────────────────────────────────────┤
│ BANNER DO PROJETO (se existir)                           │
├─────────────────────────────────────────────────────────┤
│ MÉTRICAS (grid 2x4 ou 2x3)                               │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐             │
│ │ Valor  │ │ Saúde  │ │Entrega │ │Respons.│             │
│ └────────┘ └────────┘ └────────┘ └────────┘             │
│ ┌────────┐ ┌────────┐                                   │
│ │Progres.│ │ Etapa  │                                   │
│ └────────┘ └────────┘                                   │
├─────────────────────────────────────────────────────────┤
│ ALERTA DE BLOQUEIO (se inadimplente)                     │
├─────────────────────────────────────────────────────────┤
│ BRIEFING DO PROJETO (Markdown)                           │
├─────────────────────────────────────────────────────────┤
│ ETAPAS DO PROJETO (pipeline visual)                      │
│ ● Briefing → ○ Roteiro → ○ Pré-Produção → ...           │
├─────────────────────────────────────────────────────────┤
│ MATERIAIS & VÍDEOS (seção existente expandida)           │
│ [Grid de cards com preview, comentários, aprovação]      │
├─────────────────────────────────────────────────────────┤
│ AJUSTES & FEEDBACK (seção existente)                     │
└─────────────────────────────────────────────────────────┘
```

### Modificações no Hook `useClientPortalEnhanced.tsx`

```typescript
// Adicionar busca de stages do projeto
const { data: stages } = await supabase
  .from('project_stages')
  .select('*')
  .eq('project_id', portal.project_id)
  .order('order_index', { ascending: true });

// Retornar junto com o resto
return {
  portal,
  project,
  stages: stages || [], // NOVO
  deliverables,
  files,
  comments,
  approvals,
  changeRequests,
  versions,
};
```

### Componente AddMaterialDialog (estrutura)

```typescript
interface AddMaterialDialogProps {
  portalLinkId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Tipos de material
type MaterialType = 'file' | 'youtube' | 'link';

// Campos do form
interface MaterialForm {
  type: MaterialType;
  title: string;
  description?: string;
  file?: File;
  youtubeUrl?: string;
  externalUrl?: string;
}
```

### Mutation para Adicionar Material

```typescript
const addMaterial = useMutation({
  mutationFn: async (form: MaterialForm) => {
    let fileUrl: string | null = null;
    
    // Se for arquivo, upload primeiro
    if (form.type === 'file' && form.file) {
      const path = `portal/${portalLinkId}/${Date.now()}_${form.file.name}`;
      await supabase.storage
        .from('project-files')
        .upload(path, form.file);
      
      const { data } = supabase.storage
        .from('project-files')
        .getPublicUrl(path);
      fileUrl = data.publicUrl;
    }
    
    // Inserir deliverable
    return supabase
      .from('portal_deliverables')
      .insert({
        portal_link_id: portalLinkId,
        title: form.title,
        description: form.description,
        file_url: fileUrl,
        youtube_url: form.type === 'youtube' ? form.youtubeUrl : null,
        external_url: form.type === 'link' ? form.externalUrl : null,
        visible_in_portal: true,
        awaiting_approval: true,
        status: 'pending',
      })
      .select()
      .single();
  },
});
```

### PortalTab - Adição dos Botões de Upload

```typescript
// Novo import
import { AddMaterialDialog } from './AddMaterialDialog';
import { ProjectLogoUpload } from '../ProjectLogoUpload';

// Dentro do componente, adicionar:
<div className="flex items-center gap-2">
  <Button onClick={() => setAddMaterialOpen(true)}>
    <Plus className="w-4 h-4 mr-2" />
    Adicionar Material
  </Button>
</div>

// Na seção de configurações, adicionar card para logo:
<div className="glass-card rounded-xl p-4">
  <div className="flex items-center gap-3">
    <ImageIcon className="w-5 h-5 text-muted-foreground" />
    <div>
      <p className="font-medium">Logo do Projeto</p>
      <p className="text-xs text-muted-foreground">
        Aparece no header do portal
      </p>
    </div>
  </div>
  <div className="mt-3">
    <ProjectLogoUpload
      projectId={project.id}
      currentLogoUrl={project.logo_url}
      onUpload={handleLogoUpload}
      compact
    />
  </div>
</div>
```

---

## Sequência de Implementação

1. **Expandir hook** `useClientPortalEnhanced` para buscar `project_stages`
2. **Criar** `PortalOverviewSection` com briefing e métricas expandidas
3. **Criar** `PortalProjectStages` com timeline visual
4. **Modificar** `ClientPortalPageNew` para incluir novas seções
5. **Criar** `AddMaterialDialog` para upload de materiais
6. **Modificar** `PortalTab` para incluir botões de gestão

---

## Resultado Esperado

### Portal do Cliente
- Visualização completa do projeto: valor, saúde, progresso, etapa
- Briefing do projeto legível
- Pipeline visual das etapas de produção
- Materiais com vídeos, arquivos e links
- Sistema de feedback e aprovação

### Gestão pelo Admin
- Botão "Adicionar Material" na aba Portal
- Opções: Upload arquivo, Link YouTube, Link externo
- Upload de logo do projeto
- Materiais aparecem automaticamente no portal (realtime)
