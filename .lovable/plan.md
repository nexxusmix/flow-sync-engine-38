
# OG Image Dinamica para Portal do Cliente

Quando o link do portal e compartilhado no WhatsApp, atualmente aparece a thumbnail padrao do Lovable. O objetivo e gerar uma imagem OG dinamica e personalizada para cada projeto, com layout:

```text
+------------------------------------------+
|                                          |
|        [Logo Cliente]  +  [SQUAD]        |
|                                          |
|          Titulo do Projeto               |
|                                          |
+------------------------------------------+
```

Fundo azul (#00A3D3), logos em preto centralizados com margens generosas, titulo abaixo.

---

## Solucao

### 1. Nova Edge Function: `generate-og-image`

Gera uma imagem OG (1200x630) dinamicamente usando SVG renderizado como PNG.

**Entrada:** Recebe `token` como query param (GET request para crawlers do WhatsApp).

**Logica:**
1. Busca `portal_links` pelo `share_token` para obter `project_id`, `project_name`, `client_name`
2. Busca `projects.logo_url` para o logo do cliente
3. Monta um SVG 1200x630 com:
   - Fundo azul SQUAD (#00A3D3)
   - Logo do cliente (via `<image>` SVG, com `object-fit: contain` equivalente via `preserveAspectRatio`)
   - Sinal "+" entre os logos
   - Logo SQUAD (URL fixa do storage)
   - Ambos logos com filtro preto (usando SVG filter ou logos ja em preto)
   - Titulo do projeto abaixo em texto branco/preto
   - Margens generosas para "respiro"
4. Converte SVG para PNG usando `resvg-wasm` (biblioteca disponivel em Deno para renderizar SVG em PNG)
5. Faz cache da imagem no storage bucket `marketing-assets` para nao regenerar a cada crawl
6. Retorna a imagem diretamente como `image/png`

**Alternativa simplificada (sem dependencia de resvg):**
- Retornar o SVG diretamente como `image/svg+xml` -- porem WhatsApp/Telegram nao suportam SVG em OG
- Melhor abordagem: usar a Lovable AI (Gemini image) para gerar a imagem OG sob demanda e cachear no storage

**Abordagem escolhida: SVG inline como data URI nao funciona para OG. Vamos usar a AI para gerar a imagem e cachear:**
1. Primeira vez que o link e acessado: gera via Gemini image (prompt com instrucoes de layout)
2. Salva no storage `marketing-assets/og/{project_id}.png`
3. Proximas vezes: serve direto do storage (cache)

### 2. Atualizar `og-portal/index.ts`

Mudar a logica de `ogImage`:
1. Buscar `projects.logo_url` e `projects.name`
2. Verificar se ja existe imagem OG cacheada no storage: `marketing-assets/og/{project_id}.png`
3. Se nao existe, chamar a nova function `generate-og-image` para gerar
4. Usar a URL publica da imagem gerada como `og:image`

### 3. Gerar OG image com SVG puro (abordagem final)

Na verdade, a melhor abordagem para Deno Edge Functions e gerar um SVG e converter para PNG usando `resvg-wasm`. Isso evita depender da AI para cada imagem e e deterministico.

**SVG Layout (1200x630):**
- Retangulo de fundo: `#0088CC` (azul SQUAD)
- Logo do cliente: embeddado via `<image>` SVG, centralizado a esquerda, max 180x180, com `preserveAspectRatio="xMidYMid meet"` (nao corta)
- Texto "+": entre os logos, fonte bold branca
- Logo SQUAD: a direita, max 180x180
- Titulo do projeto: abaixo, centralizado, fonte branca, max 40 chars

**Conversao SVG para PNG:**
- Usar `https://esm.sh/@aspect-dev/resvg-wasm` ou similar para renderizar
- Ou alternativamente, servir o SVG e usar um servico de conversao

**Abordagem mais simples e confiavel:** Gerar a imagem OG usando a Lovable AI (Gemini image) uma unica vez por projeto e cachear no storage. Isso produz um PNG real que funciona em todos os crawlers.

---

## Detalhes tecnicos

### Arquivos a criar
- `supabase/functions/generate-og-image/index.ts` -- gera OG image via AI e cacheia no storage

### Arquivos a editar  
- `supabase/functions/og-portal/index.ts` -- usar OG image dinamica em vez do logo SQUAD fixo

### Fluxo completo

1. Crawler do WhatsApp acessa `og-portal?token=ABC`
2. `og-portal` busca dados do projeto e verifica se existe `marketing-assets/og/{project_id}.png` no storage
3. Se nao existe: chama `generate-og-image` internamente para gerar via Gemini (prompt: "fundo azul, logo cliente + SQUAD em preto, titulo abaixo")
4. OG image URL aponta para o PNG publico no storage
5. Proximas vezes, usa cache do storage direto

### Prompt para AI gerar OG image
```
Create a 1200x630 OG image with:
- Solid blue background (#00A3D3)
- Two logos side by side centered vertically with generous margins
- Left logo: [client logo URL] rendered in black/dark
- Right logo: SQUAD Film logo rendered in black/dark  
- A "+" symbol between the logos in white
- Below the logos, centered text: "[Project Title]" in white, clean sans-serif font
- Minimalist, professional, with breathing room around all elements
- NO other text or decorations
```

### Cache e invalidacao
- Imagem gerada uma vez por projeto
- Se logo do projeto mudar, regenerar (verificar `updated_at` do projeto vs timestamp do arquivo no storage)
- Cache-Control de 5min no `og-portal` para permitir atualizacoes
