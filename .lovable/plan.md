

## Padronizar TODOS os PDFs com Design "SQUAD Swiss" 

### Escopo

7 edge functions de PDF precisam ser reescritas para seguir fielmente o design do HTML fornecido ("Swiss Summit 2026"). Todas compartilharao um mesmo design system.

### Design System Extraido do HTML

| Token | Valor | Uso |
|---|---|---|
| Background | #000000 (preto absoluto) | Fundo de todas as paginas |
| Surface | #0A0A0A (quase preto) | Cards e areas elevadas |
| Border | #1A1A1A (cinza muito escuro) | Bordas de cards e tabelas |
| Accent | #009CCA (azul SQUAD) | Destaques, titulos de secao, badges |
| White | #FFFFFF | Titulos grandes, valores KPI |
| Muted | #8C8C8C | Labels, texto secundario |
| Dim | #4A4A4A | Metadata, footers |
| Success | #22C55E | Valores positivos, status "LIVE" |
| Warning | #EAB308 | Alertas |
| Error | #EF4444 | Problemas |

### Elementos Visuais do HTML a Replicar no PDF

1. **Header com marca "SQ"**: Retangulo com borda accent + texto "SQ" em bold
2. **Hero Section**: Titulo grande (28pt) + subtitulo muted + barra accent (60px x 2px)
3. **KPI Row**: 4 cards alinhados com valor grande (20pt bold) + label pequeno (7pt)
4. **Tabelas**: Header com fundo surface, linhas com borda bottom sutil, texto off-white
5. **Pricing Card**: Card com borda accent, titulo grande, lista de features com checkmark (usando "-" por restricao WinAnsi)
6. **Simulacao/Chart**: Barras horizontais simples (retangulos) como indicadores visuais
7. **Footer**: Linha separadora + "SQUAD FILM | 2026" centralizado

### Abordagem Tecnica

**Fase 1: Criar design system compartilhado**

Novo arquivo `supabase/functions/_shared/pdf-design.ts` com:
- Tokens de cor unificados (todos iguais ao HTML)
- Classe `SquadPdfBuilder` com metodos reutilizaveis:
  - `coverPage()` - Pagina de capa estilo Swiss
  - `brandHeader()` - Marca "SQ" no topo de cada pagina
  - `heroSection()` - Titulo grande + subtitulo + accent bar
  - `kpiRow()` - Linha de KPI cards
  - `sectionTitle()` - Titulo de secao com accent
  - `dataTable()` - Tabela com header escuro
  - `statCard()` - Card individual com valor grande
  - `pricingCard()` - Card de destaque com borda accent
  - `progressBar()` - Barra horizontal de progresso
  - `footer()` - Footer padrao "SQUAD FILM | 2026"
  - `alertBanner()` - Banner de alerta

**Fase 2: Reescrever cada edge function**

Cada funcao importa `SquadPdfBuilder` do shared e usa os metodos padronizados.

| Edge Function | Linhas Atuais | Mudanca |
|---|---|---|
| `export-pdf/index.ts` | 868 | Substituir PdfBuilder por SquadPdfBuilder |
| `export-finance-pdf/index.ts` | 238 | Reescrever com design Swiss |
| `export-focus-pdf/index.ts` | 350 | Reescrever com design Swiss |
| `export-panorama-pdf/index.ts` | 257 | Reescrever com design Swiss |
| `export-creative-pdf/index.ts` | ~310 | Reescrever com design Swiss |
| `export-content-pdf/index.ts` | 252 | Reescrever com design Swiss |
| `export-campaign-pdf/index.ts` | 327 | Reescrever com design Swiss |

**Fase 3: Deploy de todas as functions**

### Detalhes do SquadPdfBuilder

```text
+--------------------------------------------------+
|  [SQ]                    SQUAD FILM | 2026        |  <- brandHeader
|--------------------------------------------------|
|                                                    |
|  PROTOCOLO LEMANICO               (accent, 7pt)   |  <- subtitle
|                                                    |
|  TITULO DO                                         |  <- heroSection
|  RELATORIO.                        (white, 28pt)   |
|                                                    |
|  ════════  (accent bar 60px)                       |
|                                                    |
|  Descricao do documento...         (muted, 10pt)   |
|                                                    |
|  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          |  <- kpiRow
|  │ 100  │  │ 2.8k │  │  03  │  │ LIVE │          |
|  │ Leads│  │Entry │  │Event │  │Ready │          |
|  └──────┘  └──────┘  └──────┘  └──────┘          |
|                                                    |
|  PIPELINE                          (accent, 10pt)  |  <- sectionTitle
|  ─────────────────────────────────                 |
|                                                    |
|  ENTIDADE    LOCAL    DIFERENCIAL    ACAO          |  <- dataTable
|  ────────────────────────────────────────          |
|  Dados...                                          |
|                                                    |
|  ┌─── accent border ────────────────────┐          |  <- pricingCard
|  │  SWISS ENTRY                         │          |
|  │  CHF 2.800                           │          |
|  │  - Filmagem 4K                       │          |
|  │  - Edicao em 72h                     │          |
|  └──────────────────────────────────────┘          |
|                                                    |
|  ──────────────────────────────────────            |
|           SQUAD FILM | 2026                        |  <- footer
+--------------------------------------------------+
```

### Cores Unificadas (todas as functions)

```typescript
const SQUAD = {
  bg:      rgb(0, 0, 0),              // #000000 preto absoluto
  surface: rgb(0.04, 0.04, 0.04),     // #0A0A0A cards
  border:  rgb(0.10, 0.10, 0.10),     // #1A1A1A bordas
  accent:  rgb(0, 0.612, 0.792),      // #009CCA azul SQUAD
  white:   rgb(1, 1, 1),              // #FFFFFF
  offWhite:rgb(0.85, 0.87, 0.89),     // texto principal
  muted:   rgb(0.55, 0.55, 0.55),     // #8C8C8C labels
  dim:     rgb(0.29, 0.29, 0.29),     // #4A4A4A metadata
  success: rgb(0.133, 0.773, 0.369),  // #22C55E
  warning: rgb(0.918, 0.702, 0.031),  // #EAB308
  error:   rgb(0.937, 0.267, 0.267),  // #EF4444
};
```

### Restricoes Tecnicas Mantidas

- Font: Helvetica/HelveticaBold (unica opcao com pdf-lib StandardFonts)
- Encoding: WinAnsi (sem emojis, sem caracteres especiais - usar "-" em vez de marcadores)
- Sem gradientes (pdf-lib nao suporta)
- Sem cantos arredondados nativos (simulados com retangulos)
- Sem imagens/logos embutidos (texto "SQ" como marca)

### Ordem de Implementacao

1. `_shared/pdf-design.ts` - Design system compartilhado
2. `export-pdf/index.ts` - Principal (project, report_360, tasks, overview, portal)
3. `export-finance-pdf/index.ts`
4. `export-focus-pdf/index.ts`
5. `export-panorama-pdf/index.ts`
6. `export-creative-pdf/index.ts`
7. `export-content-pdf/index.ts`
8. `export-campaign-pdf/index.ts`
9. Deploy de todas as 7 functions

### Resultado

Todos os PDFs exportados terao:
- Fundo preto absoluto (#000)
- Marca "SQ" no header
- Cores identicas ao HTML de referencia
- Layout Swiss minimalista e limpo
- Footer "SQUAD FILM | 2026"
- KPIs em cards uniformes
- Tabelas com o mesmo estilo

