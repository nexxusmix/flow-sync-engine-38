
## Adicionar URLs do Cliente (Site, Instagram, etc.) como Fonte de Identidade Visual

### Objetivo
Permitir que o usuário informe links do cliente (site, Instagram, Behance, Pinterest, etc.) para que a IA extraia automaticamente screenshots, cores, logos e elementos visuais — alimentando a **Galeria IA** e a aba **Identidade Visual** com dados reais da presença digital do cliente.

---

### Visão Geral do Fluxo

```text
Usuário cola URL do cliente
        ↓
Nova Edge Function: scrape-client-url
  ├── Captura screenshot via Gemini Vision (URL → imagem)
  ├── Extrai OG tags, favicon, cores, logos
  └── Salva como project_asset (source_type=link, asset_type=image)
        ↓
process-asset (já existente) é chamado para enriquecer o asset
        ↓
Galeria IA + Identidade Visual exibem automaticamente
```

---

### Mudanças Técnicas

#### 1. Nova Edge Function: `scrape-client-url`

Responsável por receber uma URL do cliente e:

- Buscar o HTML da página via `fetch()` para extrair: título, `og:image`, `og:title`, favicon, meta description, cores CSS
- Chamar o Gemini Vision (`gemini-2.5-flash`) passando a URL da `og:image` para análise visual e extração de paleta/logo
- Salvar o resultado como um `project_asset` com `source_type = 'link'`, `asset_type = 'image'` e `ai_entities` populado com cores e brand_name detectados
- Suportar Instagram: detectar perfil, extrair imagem pública disponível via OG

#### 2. UI — Novo Modal "Adicionar URL do Cliente" na Galeria IA

Um botão adicional **"+ URL / Site"** na toolbar da `GalleryTab`, abrindo um pequeno popover/dialog com:

- Campo de texto: "URL do site ou perfil do Instagram, Behance, Pinterest..."
- Sugestão de tipo detectado automaticamente (site, instagram, behance, etc.)
- Botão **"Extrair Identidade"** que dispara a edge function
- Feedback de progresso e toast de conclusão

#### 3. UI — Seção "Sites do Cliente" na Identidade Visual (`BrandIdentityTab`)

Acima do upload, uma seção colapsável **"Fontes Digitais"** exibindo:
- Cards das URLs já processadas com ícone do domínio (favicon), título e status
- Botão "+ Adicionar URL" que abre o mesmo popover
- As cores e logos extraídos aparecem automaticamente no Kit de Marca abaixo

#### 4. Detecção de Tipo por URL

| Padrão de URL | Tipo detectado | Estratégia |
|---|---|---|
| `instagram.com/user` | Instagram | OG image + perfil público |
| `behance.net/user` | Behance | OG image + thumbnail |
| `pinterest.com` | Pinterest | OG image |
| `youtube.com/channel` | YouTube | OG image + banner |
| Qualquer outro | Site genérico | Screenshot via fetch + og:image |

#### 5. Persistência

Os links são armazenados como `project_asset` com:
- `source_type = 'link'`
- `url = URL_original`
- `provider = 'generic' | 'instagram' | 'behance' | 'pinterest'`
- `og_image_url` = imagem open graph capturada
- `thumb_url` = a og:image salva no bucket `asset-thumbs`
- `ai_entities.color_palette` = cores extraídas
- `ai_entities.brand_name` = nome detectado

Nenhuma nova tabela é necessária — usa a infraestrutura existente de `project_assets`.

---

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `supabase/functions/scrape-client-url/index.ts` | **Criar** — Edge Function principal |
| `supabase/config.toml` | Registrar nova função |
| `src/components/projects/detail/tabs/GalleryTab.tsx` | Adicionar botão "+ URL / Site" e lógica de chamada |
| `src/components/projects/detail/tabs/BrandIdentityTab.tsx` | Adicionar seção "Fontes Digitais" com cards e botão |

---

### Sem necessidade de migração de banco de dados

Toda a infraestrutura de `project_assets` já suporta links (`source_type = 'link'`). Nenhuma coluna nova é necessária.
