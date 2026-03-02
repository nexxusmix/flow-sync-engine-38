

## Plano: Geração de Imagem Visual + Exportação Completa (PNG + ZIP com PDF)

### Problema Atual
O sistema gera apenas **texto** (legenda, hook, script, hashtags). O preview mostra uma área vazia preta. O usuário quer que a IA gere a **imagem visual real do post** (PNG) e ofereça download completo em pacote ZIP (PNG + PDF com textos/agendamento).

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────┐
│  handleGeneratePost()                       │
│  1. Gera textos via instagram-ai            │
│  2. Gera imagem via generate-image          │  ← NOVO
│  3. Salva post com thumbnail_url            │
│  4. Abre PostResultView com imagem real     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  PostResultView - Botões de Export          │
│  • Download PNG (imagem direto)             │  ← NOVO
│  • Exportar ZIP (PNG + PDF com textos)      │  ← NOVO
│  • Copiar Legenda + Hashtags (existente)    │
│  • Agendar no Calendário (existente)        │
└─────────────────────────────────────────────┘
```

### Tarefas de Implementação

**1. Gerar imagem visual no fluxo de criação de post**
- Em `InstagramEnginePage.tsx`, após a IA retornar os textos, chamar a edge function `generate-image` passando o `cover_suggestion` como prompt
- Usar o modelo `google/gemini-3-pro-image-preview` (já implementado em `generate-image/index.ts`)
- Salvar a URL retornada como `thumbnail_url` no post criado
- O prompt combina: título + cover_suggestion + pilar + aspect ratio para gerar a imagem ideal

**2. Criar edge function `export-instagram-post` para gerar PDF + ZIP**
- Nova edge function que recebe `post_id`
- Busca o post completo no banco
- Gera um PDF via Gemini HTML (padrão SQUAD Swiss já existente) com:
  - Imagem do post
  - Legenda completa + hashtags
  - Hook, script, CTA
  - Data de agendamento
  - Checklist de produção
- Se o post tem thumbnail, baixa o PNG e empacota tudo em ZIP (PNG + PDF)
- Retorna `{ zip_url, pdf_url, png_url }` com signed URLs do bucket `exports`

**3. Atualizar PostResultView com novos botões de export**
- **Download PNG**: botão direto que baixa `thumbnail_url` como arquivo PNG
- **Exportar ZIP Completo**: chama a edge function `export-instagram-post`, baixa o ZIP com PNG + PDF
- Preview agora mostra a imagem real gerada pela IA em vez da área vazia
- Para carrossel: gerar uma imagem por slide (ou ao menos a capa)

**4. Atualizar o preview do post**
- O mockup do Instagram no `PostResultView` agora exibe a imagem gerada
- Adicionar indicador de loading durante geração da imagem (pode demorar ~5-10s)

### Detalhes Técnicos

- A imagem é gerada usando `supabase.functions.invoke('generate-image', { body: { prompt, purpose: 'key_visual', aspectRatio } })`
- O ZIP é montado server-side usando a lib Deno `JSZip` (importada via esm.sh)
- O PDF segue o padrão SQUAD Swiss (fundo preto #000, azul #009CCA, Space Grotesk) já utilizado em todos os outros exports
- Arquivos salvos no bucket `exports` com signed URLs temporárias (1h)

