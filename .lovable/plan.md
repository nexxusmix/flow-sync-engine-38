
# Diagnostico Completo e Plano de Correcao

## BUGS ENCONTRADOS

### BUG 1 - CRITICO: Landing Page nao rola (scroll travado)
**Localizacao:** `src/index.css` (linhas 126-142) + `src/pages/LandingPage.tsx`
**Causa:** O CSS global aplica `overflow: hidden` e `height: 100vh` em `html` e `body`. A correcao anterior adicionou `h-screen overflow-y-auto` ao container da landing, mas o `useScroll({ container })` do framer-motion nao funciona corretamente quando o container nao tem conteudo visivel alem da viewport no momento do mount. Alem disso, o hero tem `opacity` vinculada ao scroll que o faz desaparecer rapido demais, e a section hero tem `min-h-screen` que empurra todo o conteudo para fora da viewport inicial.
**Correcao:**
1. Remover o efeito de scroll parallax do hero (`heroOpacity` e `heroY`) que causa o hero desaparecer ao rolar
2. Simplificar: remover `style={{ y: heroY, opacity: heroOpacity }}` do section do hero
3. Manter o container `h-screen overflow-y-auto` pois funciona (confirmado no portal)

### BUG 2 - MEDIO: App.css restringe largura do #root
**Localizacao:** `src/App.css` (linhas 1-3)
**Causa:** `#root { max-width: 1280px; margin: 0 auto; padding: 2rem; }` e codigo boilerplate do Vite que limita a largura da aplicacao inteira, causando margens indesejadas em paginas como o portal e landing page que precisam ser full-width.
**Correcao:** Remover ou neutralizar essas regras no `App.css`

### BUG 3 - MEDIO: Portal do Cliente nao exibe logo/banner do projeto no header
**Localizacao:** `src/pages/ClientPortalPageNew.tsx` (linha ~418-424)
**Causa:** O `PortalHeaderPremium` nao recebe o `portal` com dados como `project_name` e `client_name`, e o portal nao mostra a logo do projeto no header quando disponivel.
**Status:** Funcional mas sem branding visual completo.

### BUG 4 - BAIXO: Erro 400 em portal_change_requests no Dashboard
**Localizacao:** Requisicao GET `portal_change_requests` com filtros
**Causa:** A query busca `portal_change_requests` com colunas que podem nao existir ou filtros invalidos. Nao impacta funcionalidade principal mas gera erros no console.
**Correcao:** Verificar a query e alinhar com o schema real da tabela.

### BUG 5 - MEDIO: Task Detail Modal nao mostra titulo visivel
**Localizacao:** `src/components/tasks/TaskDetailModal.tsx` (linha 302-308)
**Causa:** O titulo da tarefa e renderizado como Input sem borda e sem fundo (`border-none px-0 bg-transparent`), mas no primeiro render o titulo aparece fora da viewport visivel do modal porque o Priority/Progress selector aparece antes. O modal precisa scroll para ver o titulo.
**Correcao:** Adicionar um header fixo com o titulo e botao de fechar, e garantir scroll a partir do conteudo abaixo.

### BUG 6 - BAIXO: Storage bucket `project-files` e privado
**Localizacao:** Bucket `project-files` configurado como privado
**Causa:** Em `handleFileUpload` no TaskDetailModal (linha 149), o codigo usa `getPublicUrl()` para gerar a URL do arquivo, mas o bucket e privado, entao a URL nao funcionara para preview.
**Correcao:** Usar `createSignedUrl()` em vez de `getPublicUrl()`, ou garantir que as policies de storage permitam leitura autenticada.

---

## PLANO DE CORRECAO

### Passo 1: Corrigir App.css (remover boilerplate Vite)
Limpar `src/App.css` removendo `max-width: 1280px`, `margin: 0 auto`, `padding: 2rem` e `text-align: center` do `#root` que restringem o layout.

### Passo 2: Corrigir Landing Page scroll
Em `src/components/landing/LandingHero.tsx`:
- Remover `style={{ y: heroY, opacity: heroOpacity }}` da section hero
- Remover o `useScroll` e `useTransform` que causam o hero desaparecer
- Manter as animacoes de entrada (wordVariants, floating video, etc.)

### Passo 3: Corrigir Task Detail Modal
Em `src/components/tasks/TaskDetailModal.tsx`:
- Adicionar header sticky dentro do modal com titulo e botao fechar
- Garantir que o titulo seja visivel logo que o modal abre (scroll to top)
- Manter as animacoes de scale-in/scale-out

### Passo 4: Corrigir query portal_change_requests
Identificar e corrigir a query que gera erro 400 no dashboard para `portal_change_requests`.

### Passo 5: Corrigir file preview no TaskDetailModal
Trocar `getPublicUrl()` por `createSignedUrl()` para bucket privado, garantindo que previews de arquivos funcionem.

---

## Arquivos a Modificar

1. **`src/App.css`** -- Limpar boilerplate Vite (#root constraints)
2. **`src/components/landing/LandingHero.tsx`** -- Remover scroll-linked opacity/transform
3. **`src/components/tasks/TaskDetailModal.tsx`** -- Header sticky + fix file URL
4. **Investigar query** `portal_change_requests` no dashboard hooks

## Resultado Esperado
- Landing page rola normalmente mostrando todas as secoes
- Portal do cliente carrega e funciona 100%
- Task modal abre com titulo visivel e animacao fluida
- Preview de arquivos funciona no modal de tarefas
- Zero erros no console
