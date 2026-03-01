

## Plano: IA Integrada em Todo o Instagram Engine

### Situação Atual

O Instagram Engine tem a IA isolada na aba "Criar com IA". As outras áreas (Calendário, edição de posts, etc.) são 100% manuais — sem opção de gerar texto, processar links ou arquivos com IA.

### O que será implementado

#### 1. Botão "Gerar com IA" no Dialog de Criação/Edição do Calendário
Quando o usuário cria ou edita um post no calendário, poderá clicar em **"✨ Preencher com IA"** que:
- Usa o título + formato + pilar como contexto
- Chama `instagram-ai` com action `generate_content`
- Preenche automaticamente: hook, script, legenda curta/média/longa, CTA, hashtags, sugestão de capa, slides do carrossel
- Campos ficam editáveis após preenchimento

#### 2. Dialog de Edição Completo para Posts do Calendário
Atualmente não há como editar conteúdo textual dos posts no calendário. Será adicionado:
- Dialog de edição com todos os campos textuais (hook, script, legendas, CTA, hashtags, comentário fixado)
- Botão "✨ Gerar" ao lado de cada campo individual para regenerar só aquele campo
- Botão "✨ Gerar Tudo" para preencher todos de uma vez

#### 3. Campo de Comando/Prompt Livre
Em cada post (no dialog de edição), um campo **"Comando para IA"** onde o usuário pode digitar instruções específicas:
- "Foque em urgência e escassez"
- "Adapte para público feminino 25-35"
- "Use tom humorístico"
A IA processa o comando junto com os dados do post e regenera o conteúdo.

#### 4. Campo de Link/URL para Contexto IA
O usuário pode colar um link (YouTube, artigo, referência) e a IA usa como contexto:
- Extrai o conteúdo/tema do link
- Gera conteúdo Instagram baseado naquela referência
- Útil para "transformar este vídeo em post Instagram"

#### 5. Upload de Arquivo para Processamento IA
Botão de upload no dialog de criação/edição:
- Aceita imagens, PDFs, textos
- Faz upload para o bucket `marketing-assets`
- Envia URL/conteúdo como contexto para a IA gerar o post
- Ex: fazer upload de briefing em PDF e gerar post a partir dele

### Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/components/instagram-engine/CalendarTab.tsx` | Dialog de edição completo com IA integrada, campo de comando, link e upload |
| `supabase/functions/instagram-ai/index.ts` | Nova action `generate_from_context` que aceita link, comando, e file_url como contexto adicional |
| `src/hooks/useInstagramEngine.ts` | Nova mutation `useUpdatePostWithAI` que combina geração IA + update |

### Detalhes Técnicos

**Nova action na Edge Function `instagram-ai`:**
- `generate_from_context`: recebe `{ topic, format, pillar, command, reference_url, file_content }` e gera conteúdo completo usando esses dados como contexto extra no prompt
- Reutiliza a mesma estrutura de output do `generate_content`

**Dialog de edição no CalendarTab:**
- Abre ao clicar no título do post
- Tabs internas: "Conteúdo" (campos textuais) | "IA" (comando livre + link + upload)
- Cada campo textual tem um mini-botão ✨ para regenerar individualmente
- Botão principal "✨ Gerar Tudo com IA" no topo

**Upload de arquivo:**
- Usa `supabase.storage.from('marketing-assets').upload()`
- Gera URL pública
- Para imagens: passa a URL para a IA como contexto visual
- Para textos/PDFs: extrai conteúdo no frontend e passa como texto

