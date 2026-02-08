
# Plano: Corrigir Scroll e Exibir Materiais no Portal do Cliente

## Problemas Identificados

### 1. Scroll Bloqueado
O CSS global em `src/index.css` define `overflow: hidden` e `height: 100vh` no `html` e `body`. Isso funciona para páginas internas (DashboardLayout gerencia seu próprio scroll), mas bloqueia o scroll na página do Portal do Cliente que não usa esse layout.

### 2. Materiais não Aparecem no Aside
O componente `PortalMaterialsAside` tem cards hardcoded (Brand Assets, Raw Footage) ao invés de exibir os materiais reais do banco. Os deliverables com YouTube/URL existem mas não estão sendo renderizados de forma clicável.

### 3. Materiais Prontos na Página Principal
Os materiais finalizados precisam aparecer de forma destacada na aba Overview, não apenas os uploads do cliente.

---

## Solução Técnica

### Arquivo 1: `src/pages/ClientPortalPageNew.tsx`
Adicionar `overflow-y-auto` ao container principal para permitir scroll:

```text
Antes:  <div className="min-h-screen bg-[#050505] scroll-smooth">
Depois: <div className="min-h-screen h-screen overflow-y-auto bg-[#050505] scroll-smooth">
```

### Arquivo 2: `src/components/client-portal/PortalMaterialsAside.tsx`
Refatorar para exibir dinamicamente os materiais reais:
- Remover cards hardcoded (Brand Assets, Raw Footage)
- Renderizar todos os deliverables que tenham `file_url`, `youtube_url` ou `external_url`
- Tornar os cards clicáveis com link externo
- Adicionar estado vazio se não houver materiais

### Arquivo 3: `src/components/client-portal/PortalOverviewPremium.tsx`
Na aba Overview, adicionar uma seção "Materiais Disponíveis" mostrando os deliverables prontos (com status approved ou com arquivos) de forma destacada, acima do "Status de Entregas".

---

## Resumo das Mudanças

| Arquivo | Alteração |
|---------|-----------|
| `ClientPortalPageNew.tsx` | Adicionar `h-screen overflow-y-auto` no container |
| `PortalMaterialsAside.tsx` | Substituir cards estáticos por lista dinâmica de materiais |
| `PortalOverviewPremium.tsx` | Adicionar seção de materiais prontos na Overview |

---

## Resultado Esperado
- Scroll funcionando em toda a página do portal
- Materiais reais (como o "Video Teaser" com YouTube URL) aparecendo no sidebar
- Materiais finalizados visíveis na página principal (Overview)
