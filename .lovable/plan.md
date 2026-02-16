
# Melhorar Visualizacao da Analise de Tarefas

## Problema
1. **Insights/Recomendacoes**: Blocos de texto densos, sem hierarquia visual -- tudo parece igual
2. **Modal estreito**: `max-w-2xl` (672px) nao aproveita o espaco horizontal disponivel
3. **Conteudo cortado**: O modal pode ultrapassar os limites da pagina

## Correcoes

### 1. Expandir modal horizontalmente
- Mudar `max-w-2xl` para `max-w-5xl` (1024px) para aproveitar a tela
- Manter `max-h-[85vh]` e `p-4` para respeitar margens

### 2. Insights e Recomendacoes em cards visuais (nao blocos de texto)
Transformar cada insight/recomendacao de um simples `<p>` em um **card compacto** com:
- Icone lateral colorido (lampada para insights, check para recomendacoes)
- Titulo curto extraido da primeira frase
- Texto secundario menor
- Borda sutil com cor diferenciada (azul para insights, verde para recomendacoes)
- Layout em **grid de 2 colunas** no desktop para reduzir altura vertical

### 3. Separar Insights de Recomendacoes visualmente
- Duas secoes distintas com headers proprios
- Insights: icone lampada, borda azul/purple
- Recomendacoes: icone target, borda verde/emerald

## Detalhes Tecnicos

**Arquivo:** `src/components/tasks/TaskAnalysisPanel.tsx`

Mudancas:
- Linha 98: `max-w-2xl` → `max-w-5xl`
- Linhas 265-293: Refatorar secao de insights/recomendacoes
  - Substituir `<p>` simples por cards com icone + texto truncado
  - Grid `grid-cols-1 md:grid-cols-2` para layout horizontal
  - Cards com `rounded-lg border bg-muted/30 p-3 flex items-start gap-3`
  - Icones `Lightbulb` (insights) e `Target` (recomendacoes) com cores distintas
- KPIs: ajustar grid para `grid-cols-4 md:grid-cols-6` se houver mais status
