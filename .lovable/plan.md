
# Plano: Correção do Layout Global - Sidebar Fixa + Scroll no Conteúdo

## Problema Identificado

O layout atual tem os seguintes problemas:

1. **Container raiz** usa `min-h-screen` permitindo que a página toda role
2. **Área de conteúdo** não tem `overflow-y-auto` configurado corretamente
3. **Scroll global** afeta toda a viewport ao invés de apenas o conteúdo

## Estrutura Atual vs. Desejada

```text
ATUAL (problemático):
┌──────────────────────────────────────────┐
│ body (min-h-screen, scroll global)       │
│ ┌────────┐ ┌──────────────────────────┐  │
│ │Sidebar │ │ Header                   │  │
│ │(fixed) │ ├──────────────────────────┤  │
│ │        │ │ Content (sem scroll)     │  │
│ │        │ │                          │  │
│ └────────┘ └──────────────────────────┘  │
└──────────────────────────────────────────┘
                    ↕ scroll afeta tudo


DESEJADO:
┌──────────────────────────────────────────┐
│ body (h-screen, overflow-hidden)         │
│ ┌────────┐ ┌──────────────────────────┐  │
│ │Sidebar │ │ Header (sticky)          │  │
│ │(fixed) │ ├──────────────────────────┤  │
│ │100%    │ │ Content                  │  │
│ │altura  │ │   ↕ scroll apenas aqui   │  │
│ │        │ │                          │  │
│ └────────┘ └──────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## Alterações Técnicas

### 1. Atualizar `DashboardLayout.tsx`

**De:**
```tsx
<div className="min-h-screen bg-background relative flex flex-col">
  ...
  <motion.div className="relative z-10 flex flex-col flex-1" ...>
    <Header ... />
    <motion.main className="p-6 md:p-10 max-w-[1800px] mx-auto preserve-3d flex-1 w-full">
```

**Para:**
```tsx
<div className="h-screen bg-background relative flex overflow-hidden">
  ...
  <motion.div className="relative z-10 flex flex-col flex-1 h-screen overflow-hidden" ...>
    <Header ... />
    <motion.main className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-[1800px] mx-auto preserve-3d w-full min-h-full">
        {children}
      </div>
    </motion.main>
```

**Mudanças principais:**
- Container raiz: `h-screen` + `overflow-hidden` (impede scroll global)
- Área direita: `h-screen` + `overflow-hidden` (define altura fixa)
- Main: `flex-1 overflow-y-auto` (habilita scroll apenas aqui)
- Conteúdo interno: `min-h-full` (garante preenchimento mínimo)

### 2. Atualizar `index.css` - Regras de body

**Adicionar/modificar:**
```css
body {
  @apply bg-background text-foreground antialiased;
  font-family: 'Host Grotesk', sans-serif;
  font-weight: 300;
  overflow: hidden; /* Impede scroll no body */
  height: 100vh;
}

html {
  scroll-behavior: smooth;
  perspective: 1500px;
  font-size: 115%;
  overflow: hidden; /* Impede scroll horizontal */
}
```

### 3. Adicionar utilitários CSS para consistência

```css
/* Layout utilities */
.layout-fixed-sidebar {
  @apply h-screen overflow-hidden;
}

.layout-main-scroll {
  @apply flex-1 overflow-y-auto;
}

.layout-content-fill {
  @apply min-h-full w-full;
}
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/layout/DashboardLayout.tsx` | Reestruturar container e overflow |
| `src/index.css` | Adicionar `overflow: hidden` ao body e utilitários |

---

## Comportamento Final

- Sidebar sempre visível e fixa (100% altura)
- Header sticky dentro da área de conteúdo
- Scroll vertical apenas no conteúdo principal
- Sem scroll horizontal em nenhum lugar
- Cards preenchem o grid corretamente
- Nenhum espaço vazio não intencional
- Consistência em todos os módulos (Dashboard, Projetos, CRM, etc.)
