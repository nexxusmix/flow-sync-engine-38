

## Resumo do Dia: Auto-gerado + Visual com Cards Interativos

### O que muda

O componente `AIDailySummary` sera completamente redesenhado para:

1. **Gerar automaticamente** ao carregar o dashboard (sem precisar clicar em nada)
2. **Exibir resultados em cards visuais** em vez de texto markdown corrido
3. **AI retorna JSON estruturado** em vez de texto livre, permitindo renderizacao visual

### Como funciona

**1. Edge function (`polo-ai-chat/index.ts`) - resposta estruturada para daily_summary**

Alterar o system prompt do `daily_summary` para pedir ao AI que retorne um JSON estruturado com categorias:

```json
{
  "greeting": "Bom dia! Aqui vai seu resumo.",
  "highlights": [
    { "icon": "trending-up", "label": "Receita", "value": "R$ 12.500", "status": "positive", "detail": "3 pagamentos previstos esta semana" },
    { "icon": "users", "label": "Leads", "value": "5 novos", "status": "neutral", "detail": "Pipeline estavel" },
    { "icon": "alert-triangle", "label": "Entregas", "value": "2 proximas", "status": "warning", "detail": "Projeto X vence em 3 dias" }
  ],
  "action_items": [
    "Cobrar pagamento do Projeto Y (venceu ha 2 dias)",
    "Confirmar reuniao com cliente Z amanha"
  ]
}
```

**2. Componente `AIDailySummary.tsx` - redesign visual completo**

- Remover `ReactMarkdown` e renderizar cards visuais com icones, cores por status e animacoes
- Cada highlight vira um mini-card glass com icone, valor e detalhe
- Action items aparecem como checklist visual
- Saudacao do AI aparece no topo
- Gera automaticamente quando o dashboard carrega (ja funciona com `enabled: !!user?.id && !kpi.isLoading`)
- Remover texto "Clique em atualizar" -- nunca mais sera necessario

**3. Layout visual**

```
+--------------------------------------------------+
| Sparkles  Resumo do Dia  [Polo AI]     [refresh]  |
+--------------------------------------------------+
| "Bom dia! Aqui vai seu resumo de hoje."           |
|                                                    |
| [card receita]  [card leads]  [card entregas]      |
|  R$ 12.500       5 novos      2 proximas           |
|  3 pagamentos    Pipeline      Projeto X em 3d     |
|  previstos       estavel                           |
|                                                    |
| Acoes recomendadas:                                |
|  * Cobrar pagamento do Projeto Y                   |
|  * Confirmar reuniao com cliente Z                  |
+--------------------------------------------------+
```

### Arquivos a editar

| Arquivo | Mudanca |
|---|---|
| `supabase/functions/polo-ai-chat/index.ts` | Alterar prompt do `daily_summary` para pedir JSON estruturado |
| `src/components/dashboard/AIDailySummary.tsx` | Redesign completo com cards visuais, parse de JSON, auto-load |

### Detalhes tecnicos

**Prompt atualizado (polo-ai-chat):**
- Instrui o AI a responder APENAS com JSON valido (sem markdown, sem code blocks)
- Define schema exato com `greeting`, `highlights` (max 6 items), `action_items` (max 4 items)
- Cada highlight tem: `icon` (nome lucide), `label`, `value`, `status` (positive/warning/neutral/negative), `detail`

**Componente redesenhado:**
- Parse do JSON com `try/catch` e fallback para texto se o parse falhar
- Grid responsivo de mini-cards (2-3 colunas)
- Cores por status: `positive` = verde, `warning` = amber, `negative` = vermelho, `neutral` = azul
- Icones mapeados de string para componente Lucide
- Animacao staggered com framer-motion nos cards
- Secao de action items com icone de check

**Auto-geracao:**
- O query ja tem `enabled: !!user?.id && !kpi.isLoading` -- dispara automaticamente
- `staleTime: 30 min` -- nao regenera a cada visita, so a cada 30 minutos
- Botao de refresh manual continua disponivel

### Resultado
- Resumo aparece automaticamente ao abrir o dashboard
- Visual com cards coloridos, icones e animacoes (padrao glass-card da plataforma)
- Dados baseados nas metricas reais do KPI
- Zero cliques necessarios
