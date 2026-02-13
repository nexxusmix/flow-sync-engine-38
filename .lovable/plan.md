
# Corrigir Layouts Quebrados e Textos Cortados em Toda a Plataforma

## Problema Identificado
O container "Pipeline Total + Health" no dashboard de projetos (e areas similares) nao possui tratamento de overflow adequado. Valores monetarios longos como "R$ 15.590,00" sao cortados quando o espaco e insuficiente. Esse padrao se repete em multiplos locais da plataforma.

---

## Locais com Problemas e Correcoes

### 1. ProjectsDashboard.tsx -- Header Pipeline + Health (PRINCIPAL)
**Linha 244**: O `glass-card` com Pipeline Total e RadialProgress nao tem `min-w-0`, `overflow-hidden` ou responsividade.

**Correcao:**
- Adicionar `min-w-0` no container do texto para permitir truncamento
- Adicionar `truncate` no valor monetario
- Garantir que o container flex tenha `flex-shrink-0` no RadialProgress
- Tornar o layout responsivo: em telas pequenas, empilhar verticalmente

### 2. ProjectsDashboard.tsx -- Sidebar Metrics (linhas 350-389)
Os 4 cards de metricas (Pipeline Ativo, Projetos Ativos, Health Medio, Margem Liquida) com `text-lg font-medium` podem ter valores cortados em colunas estreitas.

**Correcao:**
- Adicionar `truncate` nos valores monetarios
- Adicionar `min-w-0` nos containers pai

### 3. ProjectsDashboard.tsx -- Visao de Contas cards (linhas 418-422)
Valor formatado com `formatCurrency` pode exceder o espaco disponivel.

**Correcao:**
- Adicionar `truncate` no span do valor

### 4. Dashboard.tsx (Overview) -- Header date card (linha 142)
O `glass-card` com data pode comprimir em telas menores.

**Correcao:**
- Adicionar `flex-shrink-0` para evitar compressao

### 5. Dashboard.tsx -- Visao de Contas grid (linhas 400-403)
Valor "R$ Xk" em `text-[10px]` pode cortar em grid de 3 colunas estreitas.

**Correcao:**
- Adicionar `truncate` nos textos de valor

### 6. ReportMetricsBar.tsx -- Valor Total (linha 82)
Ja tem `truncate` -- OK, mas o `font-bold` viola a regra tipografica (deve ser `font-medium` max 500).

**Correcao:**
- Trocar `font-bold` por `font-medium` para seguir o padrao tipografico

### 7. ClientPortalPage.tsx -- Metric cards (linhas 231-251)
Valor do contrato e health score em cards sem protecao de overflow.

**Correcao:**
- Adicionar `truncate` nos valores

### 8. MetricCard.tsx -- kpi-value (linha 65)
O valor KPI usa `text-4xl` sem `truncate`, pode estourar em telas pequenas.

**Correcao:**
- Adicionar `truncate` na classe `kpi-value` no index.css

### 9. ProjectsMetricsCharts.tsx -- Valores bold (linha 111)
`text-2xl font-bold` viola padrao tipografico.

**Correcao:**
- Trocar `font-bold` por `font-medium`

---

## Detalhes Tecnicos

### Arquivos a editar

| Arquivo | Tipo de correcao |
|---|---|
| `src/components/projects/dashboard/ProjectsDashboard.tsx` | Overflow no header Pipeline+Health, sidebar metrics, e Visao de Contas |
| `src/pages/Dashboard.tsx` | Overflow no header date, Visao de Contas grid |
| `src/components/projects/reporting/ReportMetricsBar.tsx` | font-bold -> font-medium |
| `src/pages/ClientPortalPage.tsx` | truncate nos valores de metricas |
| `src/index.css` | Adicionar truncate na classe .kpi-value |
| `src/components/projects/dashboard/ProjectsMetricsCharts.tsx` | font-bold -> font-medium |

### Padrao de correcao aplicado

Para cada container com valor monetario ou numerico:
1. Container pai: `min-w-0` (permite flex shrink)
2. Elemento de texto: `truncate` (corta com ellipsis)
3. Elementos fixos (icones, radiais): `flex-shrink-0`
4. Em containers flex horizontais com texto longo: substituir por layout vertical em breakpoints menores

### Correcao principal (ProjectsDashboard header):

De:
```text
<div className="glass-card rounded-2xl p-4 flex items-center gap-4">
  <div>
    <p>Pipeline Total</p>
    <p>{formatCurrency(totalPipeline)}</p>
  </div>
  <RadialProgress ... />
</div>
```

Para:
```text
<div className="glass-card rounded-2xl p-4 flex items-center gap-4 max-w-xs">
  <div className="min-w-0 flex-1">
    <p>Pipeline Total</p>
    <p className="truncate">{formatCurrency(totalPipeline)}</p>
  </div>
  <div className="flex-shrink-0">
    <RadialProgress ... />
  </div>
</div>
```

### Regra tipografica aplicada
Conforme o padrao da plataforma, `font-bold` sera substituido por `font-medium` (peso 500) em todos os valores de metricas encontrados.
