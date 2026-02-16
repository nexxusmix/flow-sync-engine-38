
# Diagnostico do Portal do Cliente - Bugs e Melhorias

## Bugs Criticos Encontrados

### 1. YouTube Thumbnail quebrado (404)
A regex que extrai o ID do YouTube captura parametros de URL como parte do ID do video.
- URL: `https://youtu.be/nd2-q-WL07w?si=BWouv7BVFpwN_H9d`
- ID extraido (ERRADO): `nd2-q-WL07w?si=BWouv7BVFpwN_H9d`
- ID correto: `nd2-q-WL07w`
- Resultado: Thumbnail retorna 404 e imagem aparece quebrada
- Afeta 5+ arquivos que duplicam essa funcao (`PortalMaterialCard`, `MaterialLightbox`, `QuickRevisionDrawer`, etc.)
- **Correcao**: Criar util centralizado com regex corrigida: `([^&?\s]+)` em vez de `([^&\s]+)`, adicionando `?` aos caracteres excluidos

### 2. Aba Materiais mostra apenas 1 de 10 itens
A filtragem `deliverables.filter(d => !d.uploaded_by_client)` exclui 9 dos 10 materiais porque foram marcados como `uploaded_by_client: true` (provavelmente pela funcao de upload). O sidebar da Overview mostra "10 materiais prontos" mas ao clicar em Materiais so aparece 1.
- **Correcao**: Exibir todos os materiais na aba, separando por secoes (Entregas da equipe / Envios do cliente) em vez de esconder os uploads do cliente

### 3. Lightbox nao abre em fullscreen verdadeiro
Ao clicar num material, o lightbox aparece inline sobrepondo parcialmente o conteudo, nao como modal fullscreen imersivo conforme esperado.
- **Correcao**: Revisar o `MaterialLightbox` para usar `fixed inset-0 z-50` e garantir cobertura total

### 4. Ano do footer fixo em 2024
O arquivo `PortalFooterPremium.tsx` tem `© 2024` hardcoded.
- **Correcao**: Trocar para `new Date().getFullYear()`

## Problemas de UX

### 5. Links quebrados no footer
Os links "Suporte Direto", "Privacidade" e "Dashboard" apontam para `#` (nao fazem nada). "Dashboard" nao deveria existir para clientes nao autenticados.
- **Correcao**: Remover "Dashboard", fazer "Suporte Direto" abrir WhatsApp/email configurado e "Privacidade" apontar para pagina valida ou remover

### 6. "Previsao Entrega" vazio
O card de metrica mostra "—" mesmo com 9 etapas cadastradas e Briefing em andamento. Poderia mostrar a data do `due_date` do projeto se disponivel.
- **Correcao**: Usar `project.due_date` quando disponivel, senao mostrar estimativa baseada nas etapas

## Plano de Correcao

### Arquivos a modificar:

1. **Criar `src/lib/youtube-utils.ts`** - Funcao centralizada para extrair ID do YouTube com regex corrigida
2. **`src/components/client-portal/portal-materials/PortalMaterialCard.tsx`** - Importar util centralizado
3. **`src/components/client-portal/portal-materials/MaterialLightbox.tsx`** - Importar util centralizado + verificar posicionamento fullscreen
4. **`src/components/client-portal/QuickRevisionDrawer.tsx`** - Importar util centralizado
5. **`src/components/client-portal/portal-tabs/PortalMaterialsTab.tsx`** - Importar util centralizado
6. **`src/components/client-portal/portal-tabs/PortalDeliverablesTab.tsx`** - Importar util centralizado
7. **`src/components/client-portal/portal-materials/PortalMaterialsTab.tsx`** - Mostrar todos os materiais (com secao separada para uploads do cliente)
8. **`src/components/client-portal/PortalFooterPremium.tsx`** - Ano dinamico + corrigir links
9. **`src/components/client-portal/PortalMetricsGrid.tsx`** - Usar due_date para previsao de entrega

### Ordem de execucao:
1. YouTube util (resolve 404 em todas as views)
2. MaterialsTab filtering (resolve materiais faltantes)
3. Lightbox fullscreen (corrige experiencia de revisao)
4. Footer e metricas (polish)
