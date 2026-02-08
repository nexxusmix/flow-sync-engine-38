

# Plano: Reduzir Tamanho de Caracteres em 30% e Tipografia Light/Medium

## Objetivo
1. **Reduzir tamanho global dos caracteres em 30%** (de 115% para ~80%)
2. **Restringir tipografia** apenas a pesos **Light (300)** e **Medium (500)**

---

## Estado Atual

| Configuração | Valor Atual |
|--------------|-------------|
| `font-size` no `html` | `115%` |
| Font weights disponíveis | 200, 300, 400, 500, 600, 700 |
| Pesos em uso | `light: 300`, `normal: 400` |

---

## Mudanças Necessárias

### Cálculo do Novo Tamanho

```text
115% - 30% de 115% = 115% × 0.70 = 80.5%

Arredondando para valor limpo: 80%
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/index.css` | Alterar `font-size: 115%` para `font-size: 80%`, atualizar import de fontes |
| `tailwind.config.ts` | Alterar `fontWeight` para usar apenas `light: 300` e `medium: 500` |
| `index.html` | Atualizar import do Google Fonts para carregar apenas pesos 300 e 500 |

---

## Detalhes Técnicos

### 1. src/index.css

**Linha 1 - Atualizar import de fontes:**
```css
/* ANTES */
@import url('https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@300;400&...');

/* DEPOIS */
@import url('https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@300;500&...');
```

**Linha 117 - Reduzir tamanho global:**
```css
/* ANTES */
html {
  font-size: 115%;
}

/* DEPOIS */
html {
  font-size: 80%;
}
```

---

### 2. tailwind.config.ts

**Linhas 84-87 - Atualizar fontWeight:**
```typescript
// ANTES
fontWeight: {
  light: "300",
  normal: "400",
},

// DEPOIS
fontWeight: {
  light: "300",
  medium: "500",
},
```

---

### 3. index.html

**Linha 13 - Atualizar Google Fonts:**
```html
<!-- ANTES -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&..." />

<!-- DEPOIS (remover pesos não utilizados) -->
<link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@300;500&family=Playfair+Display:ital,wght@0,400;1,400&display=swap" />
```

---

## Impacto Visual

| Métrica | Antes | Depois | Diferença |
|---------|-------|--------|-----------|
| Tamanho base | 115% (~18.4px) | 80% (~12.8px) | -30% |
| Peso corpo | 300 (Light) | 300 (Light) | Mantido |
| Peso títulos | 400 (Normal) | 500 (Medium) | Mais definido |
| Variáveis de peso | 6 (200-700) | 2 (300, 500) | Simplificado |

---

## Resultado Esperado

- Interface com caracteres 30% menores em toda a plataforma
- Tipografia mais coesa usando apenas dois pesos
- Light (300) para corpo de texto e elementos secundários
- Medium (500) para títulos, labels e elementos de destaque
- Performance melhorada (menos variantes de fonte carregadas)

