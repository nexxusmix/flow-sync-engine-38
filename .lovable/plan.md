
# Comando Rapido de Contexto para IA + Preview de Arquivos

## Problema Atual
- O botao "Preencher com IA" envia apenas nomes de arquivos para a IA, sem contexto do usuario
- Nao ha campo para o usuario descrever rapidamente sobre o que sao os materiais
- A IA nao consegue "ver" o conteudo dos arquivos (imagens), apenas analisa o nome

## Solucao

### 1. Campo "Comando Rapido" no Dialog de Upload

Adicionar um campo de texto (textarea) logo acima da lista de itens na fila, visivel quando ha arquivos na fila e antes de clicar "Preencher com IA".

- Placeholder: "Ex: Materiais da campanha de lancamento do produto X para Instagram..."
- Label: "Contexto para IA (opcional)"
- O texto digitado sera enviado como `projectContext` para a edge function `ai-fill-materials`

### 2. Enviar Contexto para a Edge Function

No `ClientUploadDialog.tsx`, a funcao `fillAllWithAI`:
- Atualmente envia apenas `files` no body
- Sera atualizada para enviar tambem `projectContext` com o texto do campo de comando rapido
- A edge function `ai-fill-materials` ja aceita `projectContext` no body (linha 12) e ja o inclui no prompt (linha 26) -- so falta o frontend enviar

### 3. Enviar Imagens em Base64 para IA "Ver" o Conteudo

Para arquivos de imagem (que sao pequenos o suficiente), converter para base64 e enviar junto ao payload para que a IA possa analisar visualmente o conteudo.

- Limitar a imagens com ate 2 MB para nao estourar payload
- Enviar como campo `imageBase64` no array de files
- Atualizar a edge function para usar o modelo `google/gemini-2.5-flash` (que suporta imagens) e incluir as imagens como content multimodal

### Detalhes Tecnicos

**Arquivo: `src/components/client-portal/ClientUploadDialog.tsx`**
- Novo estado: `aiContext: string` (campo de texto)
- Renderizar um `<textarea>` entre o header da fila e o botao "Preencher com IA"
- Na funcao `fillAllWithAI`, adicionar `projectContext: aiContext` ao body da chamada
- Adicionar funcao `fileToBase64` para converter imagens pequenas
- Enviar `imageBase64` para cada arquivo de imagem no payload

**Arquivo: `supabase/functions/ai-fill-materials/index.ts`**
- Trocar modelo para `google/gemini-2.5-flash` (suporta visao)
- Montar mensagem multimodal: para cada arquivo com `imageBase64`, incluir o conteudo como `image_url` no array de content
- Manter fallback: se nao houver imagens, funciona igual ao atual (so texto)
- Manter o `projectContext` que ja esta implementado no prompt

### Fluxo Final

```text
1. Usuario adiciona arquivos ao dialog
2. Digita no campo: "Fotos do backstage da gravacao do clipe XYZ"
3. Clica "Preencher com IA"
4. Frontend converte imagens pequenas para base64
5. Envia {files, projectContext, imagesBase64} para edge function
6. IA recebe contexto + ve as imagens + le os nomes
7. Retorna titulos e descricoes contextualizados
8. UI preenche automaticamente
```

### Arquivos a Editar
1. `src/components/client-portal/ClientUploadDialog.tsx` -- adicionar campo de contexto + enviar base64 de imagens
2. `supabase/functions/ai-fill-materials/index.ts` -- trocar modelo para multimodal + receber imagens
