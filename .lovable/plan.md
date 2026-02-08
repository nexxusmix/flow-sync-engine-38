
# Plano: Corrigir PDF e Melhorar Seção de Resumo Executivo

## Problemas Identificados

### 1. PDF Bugado
O sistema atualmente gera um arquivo **SVG** (imagem vetorial) e o nomeia como PDF. Isso causa problemas:
- Não é um PDF real
- Salvamento com extensão `.svg`
- Content-type `image/svg+xml`

### 2. Botão "Gerar com IA" Visível Quando Fechado
Atualmente o botão aparece no header quando o resumo está minimizado. O usuário quer que apareça **apenas quando expandido**.

### 3. Texto do Resumo com Caracteres Especiais
O texto markdown está sendo exibido com `#`, `##`, `-` e `**` visíveis ao invés de ser renderizado como HTML formatado.

---

## Solução Técnica

### Arquivo 1: `supabase/functions/export-universal-pdf/index.ts`
Corrigir a exportação para gerar PDF real:

1. Instalar dependência `jspdf` ou converter SVG para PDF usando biblioteca adequada
2. Alternativa mais simples: Manter SVG mas gerar HTML com CSS inline que possa ser impresso como PDF pelo navegador
3. **Solução recomendada**: Gerar HTML profissional com `@media print` e abrir para impressão nativa do browser

**Mudanças específicas:**
- Trocar extensão de `.svg` para `.html`
- Gerar HTML editorial com CSS inline
- Adicionar meta tags para impressão A4
- Manter layout sidebar + conteúdo principal
- Renderizar markdown como HTML estruturado

### Arquivo 2: `src/components/projects/reporting/ExecutiveSummarySection.tsx`

**Remoção do botão quando fechado:**
```tsx
// Remover linhas 98-129 (botões no header quando fechado)
// Manter botões APENAS dentro do conteúdo expandido (linhas 166-191)
```

**Renderização rica do texto:**
- Usar `react-markdown` para parsear o conteúdo
- Aplicar estilos visuais aos headings, listas e parágrafos
- Remover caracteres especiais do markdown visualmente

**Componentes de estilo:**
```tsx
// Usar react-markdown com componentes customizados
import ReactMarkdown from 'react-markdown';

<ReactMarkdown
  components={{
    h1: ({children}) => <h2 className="text-2xl font-semibold mb-4">{children}</h2>,
    h2: ({children}) => <h3 className="text-xl font-medium text-primary mb-3">{children}</h3>,
    h3: ({children}) => <h4 className="text-lg font-medium mb-2">{children}</h4>,
    p: ({children}) => <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>,
    ul: ({children}) => <ul className="space-y-2 mb-4">{children}</ul>,
    li: ({children}) => <li className="flex gap-2"><span className="text-primary">•</span>{children}</li>,
  }}
>
  {description}
</ReactMarkdown>
```

---

## Detalhes Técnicos

### Geração de PDF/HTML para Impressão

```typescript
// Gerar HTML com CSS inline para impressão
const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 20mm; }
    @media print { body { -webkit-print-color-adjust: exact; } }
    body { 
      font-family: 'Host Grotesk', sans-serif;
      background: #050505;
      color: #FFFFFF;
    }
    .sidebar { width: 180px; ... }
    .main { margin-left: 200px; ... }
    // ... demais estilos
  </style>
</head>
<body>
  <div class="sidebar">...</div>
  <div class="main">...</div>
</body>
</html>
`;
```

---

## Resumo das Mudanças

| Arquivo | Alteração |
|---------|-----------|
| `export-universal-pdf/index.ts` | Converter para HTML imprimível + corrigir extensão |
| `ExecutiveSummarySection.tsx` | Remover botões do header fechado + usar ReactMarkdown |

---

## Resultado Esperado
- PDF exportável corretamente (via impressão HTML)
- Botão "Gerar com IA" aparece somente quando expandido
- Texto do resumo renderizado com formatação visual rica (títulos, listas, parágrafos estilizados)
