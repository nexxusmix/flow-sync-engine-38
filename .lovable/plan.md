

## Diagnóstico

A geração do Storyboard falha por **timeout da edge function**. A função `generate-storyboard-ai` tenta:
1. Gerar o storyboard via IA (texto) — ~30s (com fallback para OpenAI quando Gemini dá 429)
2. Gerar imagens para TODAS as cenas em paralelo via `gemini-3-pro-image-preview` — ~30s+
3. Upload de cada imagem no storage

Isso ultrapassa o limite de 60s das edge functions, causando timeout silencioso. O usuário vê "Processando..." para sempre.

## Plano de Correção

### 1. Separar geração de texto e imagens na edge function
- Remover a geração de imagens do fluxo principal da `generate-storyboard-ai`
- A função retorna apenas o JSON de cenas (rápido, ~15-20s)
- Usar modelo `google/gemini-2.5-flash` (mais rápido e sem quota issues)

### 2. Gerar imagens sob demanda
- Manter o botão existente de gerar imagem individual por cena
- As imagens são geradas após o storyboard já estar salvo no banco

### 3. Melhorar UX do formulário
- NÃO fechar o formulário imediatamente ao clicar em gerar
- Mostrar estado de loading no botão até a mutation completar
- Fechar o formulário apenas no `onSuccess` da mutation

### 4. Robustez do parsing JSON
- Adicionar regex fallback para extrair JSON da resposta da IA
- Tratar respostas truncadas

### Detalhes Técnicos

**Edge function `generate-storyboard-ai/index.ts`:**
- Remover função `generateSceneImage` e todo o bloco de geração de imagens em paralelo (linhas 14-78, 230-249)
- Trocar modelo de `google/gemini-3-flash-preview` para `google/gemini-2.5-flash`
- Adicionar regex fallback para JSON parsing
- Retornar apenas `{ scenes }` sem imagens

**`StoryboardTab.tsx` (linhas 258-270):**
- Remover `onClose()` da linha 270
- Mover o `onClose()` para o `onSuccess` callback da mutation no hook

**`useProjectStoryboards.ts` (mutation `onSuccess`):**
- Aceitar callback `onSuccess` opcional para fechar o formulário

