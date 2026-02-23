

## Corrigir "Gerando resumo..." que nunca termina + Loading animado

### Problema raiz

O componente tem 4 estados: loading, error, summary (parsed OK), e um fallback "Gerando resumo..." (linha 203). O problema e que quando a query **termina com sucesso** mas o JSON parse falha (AI envolve em code blocks, retorna texto livre, etc.), `summary` fica `null` e o componente mostra "Gerando resumo..." para sempre -- nao esta carregando, nao tem erro, mas tambem nao tem dados parseados.

Alem disso, a edge function nao usa `response_format: { type: "json_object" }` que forca o modelo a retornar JSON puro.

### Solucao

**1. Edge function (`polo-ai-chat/index.ts`) - Forcar JSON output**
- Adicionar `response_format: { type: "json_object" }` na chamada `chatCompletion` quando for daily_summary
- Isso garante que o Gemini retorne JSON puro sem markdown wrapping

**2. Componente (`AIDailySummary.tsx`) - Corrigir estados + Loading animado**

- **Eliminar estado limbo**: Se `rawSummary` existe mas `summary` e null (parse falhou), mostrar erro em vez de "Gerando resumo..."
- **Loading animado**: Substituir skeleton por um icone Sparkles animado com pulse + texto "Analisando dados..."
- **Melhor parse**: Tratar mais casos de limpeza do JSON (remover prefixos de texto antes do `{`)

### Arquivos a editar

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/polo-ai-chat/index.ts` | Adicionar `response_format: { type: "json_object" }` para daily_summary |
| `src/components/dashboard/AIDailySummary.tsx` | Fix estado limbo + loading animado com Sparkles pulsando |

### Detalhes tecnicos

**Edge function - forcar JSON:**
```typescript
// No bloco non-streaming, quando daily_summary:
const completionOpts: any = {
  model: "google/gemini-3-flash-preview",
  messages: aiMessages,
  stream: false,
};
if (context?.type === 'daily_summary') {
  completionOpts.response_format = { type: "json_object" };
}
const result = await chatCompletion(completionOpts);
```

**Componente - loading animado:**
```tsx
{(isLoading || isFetching || kpi.isLoading) ? (
  <div className="flex flex-col items-center justify-center py-8 gap-3">
    <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}>
      <Sparkles className="w-6 h-6 text-primary" />
    </motion.div>
    <p className="text-xs text-muted-foreground">Analisando dados...</p>
  </div>
) : ...}
```

**Componente - eliminar estado limbo:**
```tsx
// Ultima condicao: se rawSummary existe mas summary e null = parse falhou
) : rawSummary && !summary ? (
  <div className="flex items-start gap-2 text-xs text-muted-foreground">
    <AlertTriangle className="w-4 h-4 text-amber-500" />
    <p>Formato inesperado. Clique em atualizar para tentar novamente.</p>
  </div>
) : (
  <p className="text-xs text-muted-foreground">Sem dados para resumo.</p>
)}
```

### Resultado
- Loading mostra icone Sparkles pulsando (animado)
- JSON forcado pelo `response_format` elimina maioria dos erros de parse
- Se parse falhar, mostra mensagem de erro em vez de ficar eternamente "Gerando resumo..."
- Funciona automaticamente ao carregar o dashboard
