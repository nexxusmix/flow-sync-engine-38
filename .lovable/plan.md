

# Plano: Ajuste Global de Tipografia da Plataforma

## Resumo do Problema

A plataforma está com a tipografia muito pequena e restrita:
- **Escala base**: 80% (muito reduzida)
- **Pesos importados**: apenas 300 (Light) e 500 (Medium)
- **Tamanhos mínimos**: muitos elementos usam `text-[10px]` e `text-[11px]`
- **Falta peso Regular (400)**: solicitado pelo usuário

## Solução Proposta

Ajustar a escala e pesos tipográficos para uma legibilidade elegante, mantendo a estética premium.

---

## Alterações Técnicas

### 1. Arquivo `src/index.css`

**A) Importar peso Regular 400**
```css
/* Antes */
@import url('...family=Host+Grotesk:wght@300;500...');

/* Depois */
@import url('...family=Host+Grotesk:wght@300;400;500...');
```

**B) Aumentar escala base de 80% para 87.5%**
```css
/* Antes */
html {
  font-size: 80%;
}

/* Depois */
html {
  font-size: 87.5%; /* 14px base */
}
```

**C) Atualizar peso padrão do body para Regular**
```css
/* Antes */
body {
  font-weight: 300;
}

/* Depois */
body {
  font-weight: 400;
}
```

**D) Atualizar classes de badge e labels**
- `.badge-*`: de `text-[10px]` para `text-[11px]`
- `.section-label`: de `text-[10px]` para `text-[11px]`
- `.kpi-label`: de `text-[10px]` para `text-[11px]`
- `.chip` e `.chip-active`: de `text-[10px]` para `text-[11px]`
- `.btn-subtle`, `.btn-action`, `.btn-primary`: de `text-[10px]` para `text-[11px]`

---

### 2. Arquivo `tailwind.config.ts`

Adicionar peso `regular` ao sistema de design:
```typescript
fontWeight: {
  light: "300",
  normal: "400",   // adicionar
  regular: "400",  // adicionar alias
  medium: "500",
},
```

---

### 3. Substituições em Componentes UI

Buscar e substituir globalmente nos arquivos `.tsx`:

| De | Para |
|---|---|
| `text-[10px]` | `text-[11px]` |
| `text-[9px]` | `text-[10px]` |
| `font-light` (em textos de corpo) | `font-normal` |

**Componentes prioritários a atualizar:**
- `src/components/ui/card.tsx` - CardTitle usa `font-normal` (manter)
- `src/components/dashboard/*` - labels e descrições
- `src/components/client-portal/*` - badges e métricas
- `src/components/projects/*` - tabelas e cards

---

## Hierarquia Tipográfica Final

| Elemento | Peso | Tamanho |
|---|---|---|
| Títulos principais | Medium 500 | `text-2xl` a `text-4xl` |
| Subtítulos | Medium 500 | `text-lg` a `text-xl` |
| Corpo de texto | Regular 400 | `text-sm` a `text-base` |
| Texto secundário | Light 300 | `text-sm` |
| Labels/Badges | Light 300 | `text-[11px]` |
| Micro-texto | Light 300 | `text-[10px]` |

---

## Impacto Visual

- Texto mais legível sem parecer pesado
- Contraste hierárquico mais claro
- Mantém estética premium "quiet luxury"
- Compatível com a identidade visual SQUAD Film

---

## Arquivos a Modificar

1. `src/index.css` - escala base, pesos, classes utilitárias
2. `tailwind.config.ts` - adicionar peso `regular`
3. ~50 componentes `.tsx` com substituição de tamanhos mínimos

