
# Diagnostico Completo: Marketing, Conteudo e Studio Criativo

## Bugs Encontrados

### BUG 1 - CRITICO: Badge ref warning no MarketingDashboard
O console mostra "Function components cannot be given refs" no componente `Badge` dentro de `MarketingDashboard.tsx`. Isso ocorre porque o `Badge` (linha 25 de badge.tsx) e um `div`, nao usa `forwardRef`, mas esta sendo usado como child de um componente que tenta passar ref (provavelmente via Tooltip ou DropdownMenu).
- **Arquivo**: `src/components/ui/badge.tsx`
- **Correcao**: Adicionar `React.forwardRef` ao componente Badge

### BUG 2 - CRITICO: N+1 queries no fetchContentItems
O `marketingStore.ts` (linhas 226-248) faz uma query separada de `content_comments` e `content_checklist` para **cada** content item usando `Promise.all`. Com 50 itens, isso gera 100+ queries ao banco. Causa lentidao perceptivel ao carregar Pipeline, Dashboard e Calendario.
- **Arquivo**: `src/stores/marketingStore.ts`
- **Correcao**: Buscar comments e checklist em batch (um SELECT para todos os IDs) em vez de N queries individuais

### BUG 3: getContentByStatus ignora filtros de busca
No Pipeline (Kanban), `getContentByStatus` (linha 442-444) retorna todos os itens daquele status sem aplicar o filtro de busca. Digitar algo na busca nao filtra os cards nas colunas.
- **Arquivo**: `src/stores/marketingStore.ts`
- **Correcao**: Aplicar `contentFilters.search` dentro de `getContentByStatus`

### BUG 4: Pagina "Conteudo" vazia (placeholder)
`ContentPage.tsx` mostra apenas "Em desenvolvimento" sem funcionalidade. Deveria redirecionar para `/marketing/pipeline` ou ser removida da navegacao.
- **Arquivo**: `src/pages/ContentPage.tsx`

### BUG 5: "Ver Conteudos" no CampaignCard nao faz nada
Na pagina de Campanhas, o botao "Ver Conteudos" (linha 170) nao tem onClick - e apenas um `Button` sem acao.
- **Arquivo**: `src/pages/marketing/CampaignsPage.tsx` (linha 170)
- **Correcao**: Navegar para pipeline filtrado por campanha

### BUG 6: "Exportar PDF" no StudioCopilot mostra toast placeholder
No painel Copilot do Studio Criativo (linha 221), clicar em "Exportar PDF" mostra `toast.info('Export PDF em breve')` em vez de realmente exportar.
- **Arquivo**: `src/components/creative-studio/StudioCopilot.tsx` (linha 221)
- **Correcao**: Implementar export real ou remover botao

### BUG 7: Studio Criativo auto-cria trabalho ao acessar sem ID
`CreativeStudioPage.tsx` (linhas 131-135) cria automaticamente um novo trabalho criativo toda vez que o usuario acessa `/marketing/studio` sem ID. Isso gera trabalhos "fantasma" sem conteudo.
- **Arquivo**: `src/pages/marketing/CreativeStudioPage.tsx`
- **Correcao**: Mostrar tela de selecao/listagem em vez de criar automaticamente

### BUG 8: Calendario - view "Semana" nao funciona
O `CalendarPage.tsx` tem um seletor "Mes/Semana" (linhas 193-200) mas nao implementa a view de semana - sempre mostra o mes completo.
- **Arquivo**: `src/pages/marketing/CalendarPage.tsx`
- **Correcao**: Implementar view semanal ou remover opcao

### BUG 9: LoginPage footer com ano 2024 hardcoded
A tela de login mostra "2024 SQUAD FILM GLOBAL" no footer (visivel no screenshot).
- **Arquivo**: Tela de login
- **Correcao**: Usar `new Date().getFullYear()`

## Problemas de UX

### UX 1: Transcrições nao persistem
`TranscribePage.tsx` armazena transcrições apenas em `useState`. Ao navegar para outra pagina e voltar, todas as transcrições sao perdidas. Deveria salvar no banco.

### UX 2: Instagram Page - MVP limitado sem feedback claro
A pagina mostra informacao tecnica sobre "access_token" e "Meta Graph API" que confunde usuarios nao-tecnicos. Deveria esconder detalhes tecnicos.

### UX 3: Dois Studios Criativos duplicados
Existem duas paginas de studio: `StudioCreativoPage.tsx` (antigo, baseado em briefs) e `CreativeStudioPage.tsx` (novo, modular com blocos). Isso pode confundir rotas e manutenção.

### UX 4: Acoes rapidas no Copilot sem bloco selecionado
No Studio Criativo, as acoes rapidas (Resumir, Expandir, etc.) ficam desabilitadas quando nao ha bloco com conteudo, mas nao explicam por que estao desabilitadas.

### UX 5: Delete de brief sem confirmação
`StudioCreativoPage.tsx` (linha 452-462) deleta briefs sem dialogo de confirmacao, gerando risco de perda acidental.

## Plano de Correcao (Priorizado)

### Alta Prioridade
1. **Badge forwardRef** - Corrigir warning no `badge.tsx` adicionando `React.forwardRef`
2. **N+1 queries** - Refatorar `fetchContentItems` no `marketingStore.ts` para buscar comments/checklist em batch
3. **Pipeline search** - Fazer `getContentByStatus` respeitar filtro de busca
4. **CampaignCard "Ver Conteudos"** - Adicionar navegacao com filtro

### Media Prioridade
5. **Studio auto-create** - Mostrar lista de trabalhos existentes ao acessar `/marketing/studio`
6. **Transcrições persistencia** - Salvar resultados no banco
7. **Exportar PDF no Copilot** - Conectar ao export real ou remover

### Baixa Prioridade
8. **ContentPage redirect** - Redirecionar para pipeline
9. **Calendario view semana** - Implementar ou remover opcao
10. **Instagram UX** - Esconder detalhes tecnicos da API
11. **Login footer ano** - Dinamico
12. **Delete confirmation** - Dialogo antes de excluir briefs

### Detalhes Tecnicos

**badge.tsx** - Mudar de:
```tsx
function Badge({ className, variant, ...props }: BadgeProps) {
  return <div ... />;
}
```
Para:
```tsx
const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return <div ref={ref} ... />;
  }
);
Badge.displayName = "Badge";
```

**marketingStore.ts - fetchContentItems** - Mudar de N queries individuais para:
```tsx
const itemIds = data.map(i => i.id);
const { data: allComments } = await supabase
  .from('content_comments').select('*').in('content_item_id', itemIds);
const { data: allChecklist } = await supabase
  .from('content_checklist').select('*').in('content_item_id', itemIds);
// Depois mapear por item
```

**marketingStore.ts - getContentByStatus** - Adicionar filtro:
```tsx
getContentByStatus: (status) => {
  const { contentItems, contentFilters } = get();
  return contentItems.filter((i) => {
    if (i.status !== status) return false;
    if (contentFilters.search && !i.title.toLowerCase().includes(contentFilters.search.toLowerCase())) return false;
    return true;
  });
},
```

**CampaignsPage.tsx** - Botao "Ver Conteudos":
```tsx
<Button variant="outline" className="flex-1" size="sm"
  onClick={() => navigate(`/marketing/pipeline?campaign=${campaign.id}`)}>
  Ver Conteudos
</Button>
```

### Arquivos a modificar:
1. `src/components/ui/badge.tsx`
2. `src/stores/marketingStore.ts`
3. `src/pages/marketing/CampaignsPage.tsx`
4. `src/pages/marketing/CreativeStudioPage.tsx`
5. `src/components/creative-studio/StudioCopilot.tsx`
6. `src/pages/marketing/CalendarPage.tsx`
7. `src/pages/ContentPage.tsx`
