

# Plano: Portal do Cliente Interativo + Upload de Materiais

## Resumo

Este plano implementa duas melhorias principais no Portal do Cliente:

1. **Portal navegável e animado** - Transições suaves, scrolling customizado, animações de entrada e efeitos visuais usando Framer Motion (já instalado no projeto)
2. **Sistema de upload de materiais pelo cliente** - Permitir que o cliente também suba links, vídeos, referências e materiais diretamente no portal
3. **Padronização tipográfica** - Migrar toda a fonte para **Host Grotesk** (já é a padrão do projeto), removendo qualquer uso de Playfair Display no portal

---

## Parte 1: Tipografia Host Grotesk

### Situação Atual
- O projeto já utiliza **Host Grotesk** como fonte padrão (`tailwind.config.ts` e `index.css`)
- O único uso de **Playfair Display** no portal está em `PortalHeaderPremium.tsx` (título do projeto)

### Alterações Necessárias

| Arquivo | Mudança |
|---------|---------|
| `PortalHeaderPremium.tsx` | Remover `style={{ fontFamily: "'Playfair Display', serif" }}` do título |
| Verificação geral | Garantir que nenhum componente do portal usa `font-serif` |

---

## Parte 2: Portal Navegável com Animações

### Componentes a Criar/Atualizar

#### 2.1. Wrapper de Animação
Criar `src/components/client-portal/PortalAnimatedSection.tsx`:
- Wrapper reutilizável com Framer Motion
- Animações de entrada (fade-in-up) com stagger para múltiplos filhos
- Suporte a `useInView` para animações ao entrar na viewport

#### 2.2. Atualizar Componentes Existentes

| Componente | Animações a Adicionar |
|------------|----------------------|
| `ClientPortalPageNew.tsx` | Smooth scroll, animação de entrada do header, transição entre abas |
| `PortalHeaderPremium.tsx` | Fade-in suave dos badges e título |
| `PortalMetricsGrid.tsx` | Stagger animation nos cards de métricas |
| `PortalOverviewPremium.tsx` | Animação de entrada sequencial das seções |
| `PortalDeliverablesPremium.tsx` | Hover lift e glow nos cards, animação de entrada |
| `PortalTabsPremium.tsx` | Transição suave entre abas com AnimatePresence |
| `PortalMaterialsAside.tsx` | Hover effects e entrada animada |
| `PortalFilesTab.tsx` | Grid animado com stagger |

#### 2.3. Efeitos de Scroll
Implementar em `ClientPortalPageNew.tsx`:
- Smooth scroll com `scroll-behavior: smooth`
- Parallax sutil no header (opcional - baseado em preferência de reduced motion)
- Scroll indicator discreto
- Snap suave nas seções principais

#### 2.4. Animações Detalhadas

```text
┌─────────────────────────────────────────────────────────┐
│  ENTRADA DA PÁGINA                                       │
│  ───────────────                                         │
│  1. Header (0ms) - Fade in                              │
│  2. Badges (100ms delay) - Scale in stagger             │
│  3. Título (200ms delay) - Fade up                      │
│  4. Métricas (300ms delay) - Stagger cards              │
│  5. Tabs (400ms delay) - Slide in from bottom           │
│  6. Conteúdo (500ms delay) - Fade in                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TROCA DE ABA                                            │
│  ───────────────                                         │
│  - Exit: Fade out + slide left (150ms)                  │
│  - Enter: Fade in + slide right (200ms)                 │
│  - AnimatePresence com mode="wait"                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  HOVER EFFECTS                                           │
│  ───────────────                                         │
│  - Cards: Lift (translateY -4px) + glow sutil           │
│  - Links: Underline animado                             │
│  - Botões: Scale (1.02) + shadow                        │
│  - Ícones: Rotate ou scale pequeno                      │
└─────────────────────────────────────────────────────────┘
```

---

## Parte 3: Upload de Materiais pelo Cliente

### Situação Atual
- O **gestor** pode adicionar materiais via `AddMaterialDialog` na aba Portal do projeto
- O **cliente** não tem opção de enviar materiais, apenas comentar/aprovar

### Nova Funcionalidade

#### 3.1. Criar `ClientUploadDialog.tsx`
Similar ao `AddMaterialDialog`, mas adaptado para o cliente:
- Tipos permitidos: Link do YouTube, Link externo (Drive/Vimeo), Arquivo de referência
- Campos: Título, Descrição, URL ou Arquivo
- Indicador de "Enviado pelo cliente"

#### 3.2. Criar Seção "Enviar Material" no Portal
Em `PortalOverviewPremium.tsx` e/ou nova aba:
- Card destacado "Envie referências e materiais para a equipe"
- Botões: Upload Arquivo, Link do YouTube, Link Externo
- Lista de materiais enviados pelo cliente

#### 3.3. Atualizar Banco de Dados

| Tabela | Campo | Tipo | Descrição |
|--------|-------|------|-----------|
| `portal_deliverables` | `uploaded_by_client` | boolean | Se foi enviado pelo cliente |
| `portal_deliverables` | `client_name` | text | Nome do cliente que enviou |
| `portal_deliverables` | `material_type` | text | 'reference', 'feedback', 'asset' |

#### 3.4. Atualizar `useClientPortalEnhanced.tsx`
Adicionar mutation:
```typescript
const uploadClientMaterial = useMutation({
  mutationFn: async ({ title, description, type, url, file }) => {
    // Upload to storage if file
    // Insert in portal_deliverables with uploaded_by_client = true
  }
});
```

#### 3.5. UI para Gestor
No painel interno (aba Portal do projeto), mostrar materiais enviados pelo cliente com badge "Enviado pelo Cliente" para revisão.

---

## Fluxo Visual

```text
┌──────────────────────────────────────────────────────────────────┐
│                      PORTAL DO CLIENTE                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  [HEADER ANIMADO]                                           │ │
│  │  🏷️ Active  │  filme_institucional  │  Pré-Produção         │ │
│  │  PORTO 153 (Host Grotesk Medium 48px)                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   (stagger animation)     │
│  │Valor │ │Saúde │ │Data  │ │Owner │                           │
│  └──────┘ └──────┘ └──────┘ └──────┘                           │
│                                                                  │
│  [Visão Geral] [Tarefas] [Entregas] [Revisões] [Arquivos]...   │
│  ─────────────────────────────────────────────────────────────  │
│                    (transição suave entre abas)                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  📤 ENVIE MATERIAIS                           [+Adicionar]  │ │
│  │  Compartilhe referências, logos ou arquivos com a equipe    │ │
│  │                                                             │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │ │
│  │  │ 📎 Arquivo  │ │ 🎥 YouTube  │ │ 🔗 Link     │           │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  📦 ENTREGAS                         (hover: lift + glow)  │ │
│  │  [Card 1] [Card 2] [Card 3]                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

### Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `src/components/client-portal/PortalAnimatedSection.tsx` | Wrapper de animação reutilizável |
| `src/components/client-portal/ClientUploadDialog.tsx` | Dialog para cliente enviar material |
| `src/components/client-portal/PortalClientUploads.tsx` | Seção mostrando uploads do cliente |

### Arquivos a Modificar
| Arquivo | Alterações |
|---------|------------|
| `src/pages/ClientPortalPageNew.tsx` | Adicionar Framer Motion, smooth scroll, AnimatePresence nas tabs |
| `src/components/client-portal/PortalHeaderPremium.tsx` | Remover Playfair Display, adicionar animações |
| `src/components/client-portal/PortalMetricsGrid.tsx` | Stagger animation nos cards |
| `src/components/client-portal/PortalOverviewPremium.tsx` | Animações + seção "Enviar Material" |
| `src/components/client-portal/PortalDeliverablesPremium.tsx` | Hover effects e animações |
| `src/components/client-portal/PortalTabsPremium.tsx` | AnimatePresence para transição de abas |
| `src/components/client-portal/portal-tabs/PortalFilesTab.tsx` | Animação de grid |
| `src/hooks/useClientPortalEnhanced.tsx` | Mutation para upload do cliente |

### Migração de Banco
```sql
-- Adicionar campos para identificar uploads do cliente
ALTER TABLE portal_deliverables 
ADD COLUMN IF NOT EXISTS uploaded_by_client boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS client_upload_name text,
ADD COLUMN IF NOT EXISTS material_category text DEFAULT 'deliverable';

-- RLS para permitir INSERT pelo cliente (via token)
CREATE POLICY "Allow client upload via portal"
ON portal_deliverables
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM portal_links 
    WHERE portal_links.id = portal_deliverables.portal_link_id 
    AND portal_links.is_active = true
  )
);
```

---

## Ordem de Implementação

1. **Tipografia** - Remover Playfair do portal (5 min)
2. **Animação base** - Criar `PortalAnimatedSection` e integrar Framer Motion (30 min)
3. **Animações por componente** - Header, Metrics, Tabs, Deliverables (45 min)
4. **Transição de abas** - AnimatePresence no TabsContent (15 min)
5. **Migração DB** - Adicionar campos para upload do cliente (5 min)
6. **ClientUploadDialog** - Dialog para cliente enviar material (30 min)
7. **Integração** - Adicionar seção de upload na visão geral (20 min)
8. **Testes** - Validar animações, uploads e fluxo completo (15 min)

---

## Considerações Técnicas

- **Reduced Motion**: Todas as animações devem respeitar `prefers-reduced-motion: reduce`
- **Performance**: Usar `will-change` com moderação, preferir `transform` e `opacity`
- **Mobile**: Animações simplificadas em telas menores
- **Storage**: Uploads do cliente vão para o bucket `project-files` existente
- **Segurança**: RLS garante que cliente só pode inserir em portais ativos

