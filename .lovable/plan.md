

## Plano: Gerar Campanha com IA baseada em Pesquisa, Analise e Dados

### Objetivo
Adicionar um botão "Gerar Campanha com IA" na aba Campanhas que pesquisa tendencias do nicho, analisa dados do perfil/historico e gera automaticamente uma campanha completa com objetivo, publico, mensagens-chave, KPIs e plano de conteudo pre-populado.

### Fluxo do Usuario
1. Clica em "Gerar Campanha com IA" na tela de campanhas
2. Abre dialog com campos opcionais: tema/foco da campanha, duracao (1-4 semanas), budget
3. A IA recebe como contexto: perfil configurado, referencias salvas, memoria de performance, posts anteriores
4. Retorna campanha completa que e salva automaticamente na tabela `instagram_campaigns` com `key_messages`, `content_plan` e `kpis` preenchidos
5. Apos salvar, mostra a campanha criada com os detalhes

### Implementacao

**A. Nova action `generate_campaign` no Edge Function `instagram-ai/index.ts`**
- Recebe: `theme`, `duration_weeks`, `budget`, contexto automatico (perfil, referencias, memoria)
- Busca dados do `instagram_profile_config` e `instagram_references` para enriquecer o prompt
- Prompt instruido a fazer pesquisa de mercado, analisar tendencias do nicho e gerar:
  - Nome, objetivo, publico-alvo, periodo
  - Mensagens-chave (array)
  - KPIs projetados
  - Plano de conteudo com posts sugeridos (titulos, formatos, pilares, hooks)
- Retorna JSON estruturado

**B. Componente `AiCampaignGenerator` em `CampaignsTab.tsx`**
- Botao "Gerar com IA" ao lado de "Nova Campanha"
- Dialog com inputs: tema (opcional), duracao, budget
- Estado de loading com mensagem "Analisando dados e gerando campanha..."
- Ao receber resultado: INSERT na `instagram_campaigns` com todos os campos preenchidos
- Toast de sucesso + navegar para a campanha criada

**C. Editar `CampaignsTab.tsx`**
- Adicionar botao com icone Sparkles na barra de acoes
- Integrar o dialog de geracao

### Arquivos

| Arquivo | Acao |
|---|---|
| `supabase/functions/instagram-ai/index.ts` | Adicionar case `generate_campaign` |
| `src/components/instagram-engine/CampaignsTab.tsx` | Adicionar botao + dialog de geracao IA |

