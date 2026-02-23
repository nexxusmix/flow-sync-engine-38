

# Implementar Storyboard IA com Geracao de Imagens Automatica

## Resumo

O storyboard gera cenas via IA (texto) mas nao gera imagens. Vamos completar o fluxo para que apos salvar as cenas, imagens cinematograficas sejam geradas automaticamente usando Nano Banana Pro (google/gemini-3-pro-image-preview) com estetica Sony FX3 + GM 28-70mm f/2.8.

## Status Atual

- A edge function `generate-storyboard-ai` funciona (confirmado nos logs: sucesso via OpenAI)
- As cenas sao salvas na tabela `project_storyboard_scenes` corretamente
- A tabela NAO tem coluna `image_url` para armazenar imagens geradas
- A edge function `generate-image` ja existe e usa Nano Banana Pro via Lovable Gateway
- O componente `SceneCard` nao exibe imagens

## Alteracoes Necessarias

### 1. Migracao de Banco - Adicionar coluna `image_url`

```sql
ALTER TABLE project_storyboard_scenes ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### 2. Edge Function `generate-storyboard-ai/index.ts` - Adicionar geracao de imagens

Apos gerar as cenas via IA texto, para cada cena:
- Pegar o `ai_prompt` gerado
- Adicionar prefixo de estetica: "Shot on Sony FX3 with Sony GM 28-70mm f/2.8 lens. Cinema camera look, shallow depth of field, natural bokeh, cinematic color science."
- Chamar Lovable Gateway com `google/gemini-3-pro-image-preview` e `modalities: ["image", "text"]`
- Extrair base64, fazer upload ao storage `marketing-assets`, obter URL publica
- Incluir `image_url` no JSON de resposta de cada cena

A geracao de imagens sera feita em paralelo (todas as cenas ao mesmo tempo) para velocidade.

### 3. Hook `useProjectStoryboards.ts` - Salvar image_url

Atualizar o mapeamento de cenas na mutacao `generateMutation` para incluir `image_url` ao salvar em `project_storyboard_scenes`.

### 4. Componente `StoryboardTab.tsx` - Exibir imagens + botao regenerar

- `SceneCard`: Exibir imagem da cena (se existir) em destaque no topo do card
- Adicionar botao "Gerar Imagem" por cena para regenerar manualmente
- Ao regenerar, chamar `generate-image` com o prompt da cena + prefixo Sony FX3
- Atualizar a cena no banco com a nova URL

### 5. Estetica Sony FX3 GM 28-70mm

Todos os prompts de imagem terao o seguinte prefixo adicionado automaticamente:

```
"Cinematic frame shot on Sony FX3 camera with Sony GM 28-70mm f/2.8 lens. 
Shallow depth of field, natural film-like bokeh, rich color science, 
S-Cinetone color profile. Professional cinematography, 16:9 widescreen frame."
```

## Detalhes Tecnicos

### Edge Function - Fluxo de geracao de imagens

```text
generate-storyboard-ai
  |
  v
[1] Gerar cenas (texto) via Gemini/OpenAI
  |
  v
[2] Para cada cena em paralelo:
    - Montar prompt = prefixo Sony FX3 + scene.ai_prompt
    - POST Lovable Gateway (google/gemini-3-pro-image-preview, modalities: ["image","text"])
    - Extrair base64 da resposta
    - Upload para storage marketing-assets
    - Obter URL publica
    - Adicionar image_url ao objeto da cena
  |
  v
[3] Retornar scenes[] com image_url ao frontend
```

### Tratamento de erros

- Se a geracao de imagem de uma cena falhar (rate limit, timeout), a cena e retornada sem image_url
- O usuario pode regenerar manualmente depois
- Rate limits (429) e erros de pagamento (402) serao tratados com retry e mensagem adequada

### Frontend - SceneCard atualizado

- Imagem exibida em 16:9 com bordas arredondadas no topo do card
- Botao "Gerar Imagem" aparece se nao houver imagem, ou como icone de refresh se ja houver
- Loading spinner durante geracao individual
- Ao gerar, chama `generate-image` edge function diretamente e atualiza `project_storyboard_scenes.image_url`

## Sequencia de Implementacao

1. Migracao SQL (adicionar coluna image_url)
2. Atualizar `generate-storyboard-ai/index.ts` (gerar imagens em paralelo)
3. Atualizar `useProjectStoryboards.ts` (salvar image_url)
4. Atualizar `StoryboardTab.tsx` (exibir imagens + botao regenerar)
5. Deploy da edge function

