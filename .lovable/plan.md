

## Plano: Campanha Completíssima com IA — Geração Total

### Problema Atual
O gerador de campanhas atual cria apenas o registro da campanha com um `content_plan` em JSON, mas **não gera os posts reais** na tabela `instagram_posts`. O usuário precisa criar cada post manualmente depois.

### O Que Será Feito
Transformar o gerador em um **motor de campanha completa** que, em um único clique, cria:

1. **Campanha** — nome, objetivo, público, KPIs, mensagens-chave, estratégia
2. **Posts completos** — inseridos na `instagram_posts` com todos os campos preenchidos:
   - Título, hook, script/roteiro, caption_short, caption_medium, caption_long
   - CTA, hashtags, pinned_comment, cover_suggestion
   - carousel_slides (para carrosséis), story_sequence (para stories)
   - Formato, pilar, objetivo, data agendada (`scheduled_at`)
   - Vinculados à campanha via `campaign_id`
   - Checklist de produção pré-populado
3. **Calendário distribuído** — posts com datas reais distribuídas ao longo das semanas
4. **Ads sugeridos** — posts marcados como anúncio no plano

### Implementação

**A. Edge Function `instagram-ai/index.ts` — Expandir `generate_campaign`**

Alterar o prompt para gerar JSON muito mais rico:
- Cada item do `content_plan` vira um post completo com TODOS os campos (`hook`, `script`, `caption_short`, `caption_medium`, `caption_long`, `cta`, `hashtags`, `pinned_comment`, `cover_suggestion`, `carousel_slides`, `story_sequence`, `checklist`)
- Incluir `scheduled_date` real (YYYY-MM-DD) distribuído nas semanas
- Incluir `suggested_time` para horário ideal
- Incluir posts tipo `ad` para anúncios

**B. Frontend `CampaignsTab.tsx` — Auto-criar posts após campanha**

Após receber o resultado da IA e salvar a campanha:
1. Iterar sobre `content_plan` 
2. Para cada item, fazer `INSERT` em `instagram_posts` com todos os campos + `campaign_id` + `scheduled_at` (combinando date + time)
3. Mostrar resumo: "Campanha criada com X posts, Y reels, Z carrosséis"
4. Adicionar estado de progresso multi-etapa no loading ("Pesquisando tendências...", "Criando roteiros...", "Montando calendário...")

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/instagram-ai/index.ts` | Expandir prompt do `generate_campaign` para gerar posts completos |
| `src/components/instagram-engine/CampaignsTab.tsx` | Auto-inserir posts na `instagram_posts` após geração |

