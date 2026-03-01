

## Plano: Instagram Engine - Dados Reais + Central de Insights IA

### Contexto
Hoje o Cockpit mostra dados estáticos dos snapshots manuais. O usuário quer:
1. Dados reais do perfil visíveis e editáveis (seguidores, posts, nicho, etc.)
2. Uma funcionalidade de **upload de insights** (textos, arquivos, imagens de prints do Instagram) que a IA analisa e gera: relatório, ações, calendário, projeções, planejamento e orientações
3. Mais funcionalidades antecipadas

### O que será implementado

**1. Dados Reais do Perfil no Cockpit (inline editable)**
- Exibir os dados reais salvos no `instagram_profile_config` + último snapshot como cards editáveis inline no topo do Cockpit
- Campos: handle, nicho, sub-nicho, público-alvo, seguidores, posts, engajamento, alcance
- Botão "Salvar" rápido para atualizar snapshot + config sem sair do Cockpit

**2. Nova funcionalidade: "Análise de Insights com IA"**
- Nova aba **"Insights IA"** no Instagram Engine (ou seção destacada no Cockpit)
- O usuário pode:
  - Colar texto (ex: dados copiados do Instagram Insights)
  - Subir arquivos (PDF de relatórios, CSV de métricas)
  - Subir screenshots/imagens dos Insights do Instagram (a IA interpreta via multimodal)
  - Dar comandos livres ("analise meu alcance dos últimos 30 dias")
- A IA processa tudo e retorna um **relatório completo** com:
  - **Diagnóstico**: resumo do estado atual
  - **Ações prioritárias**: lista de ações concretas
  - **Calendário sugerido**: posts para a próxima semana baseados nos dados
  - **Projeções**: crescimento estimado com base nos dados reais
  - **Orientações**: dicas de conteúdo, horários, formatos
  - **Alertas**: riscos e oportunidades detectados
- O resultado é salvo no banco e exibido em cards organizados

**3. Funcionalidades antecipadas**
- **Comparativo de períodos**: semana vs semana anterior
- **Score de consistência**: baseado na frequência real de postagem
- **Detector de melhores posts**: upload de dados e a IA identifica padrões de sucesso
- **Gerador de relatório exportável**: resultado da análise em formato compartilhável

### Alterações técnicas

**Banco de dados (migração)**
- Nova tabela `instagram_insights_reports` para persistir relatórios gerados:
  - `id`, `workspace_id`, `input_text`, `input_files` (jsonb), `report_json` (jsonb), `report_type`, `created_at`

**Edge Function `instagram-ai`**
- Novo action `analyze_insights` que recebe texto + file_content + comando e retorna o relatório estruturado completo (diagnóstico, ações, calendário, projeções, orientações, alertas)
- Usar modelo `google/gemini-2.5-flash` (suporte multimodal para imagens)

**Frontend**
- `CockpitTab.tsx`: adicionar seção de dados reais editáveis inline com save rápido
- Novo componente `InsightsAnalyzerTab.tsx`: interface de upload + resultados
- `InstagramEnginePage.tsx`: adicionar nova aba "Insights IA" no array de tabs
- Resultados renderizados em cards organizados por seção (diagnóstico, ações, calendário, etc.)

**Arquivos editados/criados:**
- `supabase/functions/instagram-ai/index.ts` (novo action)
- `src/components/instagram-engine/InsightsAnalyzerTab.tsx` (novo)
- `src/components/instagram-engine/CockpitTab.tsx` (dados reais editáveis)
- `src/pages/InstagramEnginePage.tsx` (nova aba)
- Migração SQL para `instagram_insights_reports`

