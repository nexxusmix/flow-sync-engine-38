
## Problema

Os cards de objetivo e os chips de sugestão da IA no **CampaignWizard** estão sendo cortados visualmente. Isso acontece porque:

1. O `DialogContent` tem `overflow-y-auto` que corta sombras/glows dos cards selecionados
2. Os chips de sugestão da IA têm texto longo que é truncado pelo container
3. O padding interno não dá espaço suficiente para as sombras dos cards selecionados

## Correções

### 1. Ajustar overflow no container dos cards
- Adicionar `overflow-visible` no grid de objetivos e wraps de sugestões, com padding extra para acomodar sombras/glows
- Usar um wrapper interno com `overflow-visible` e padding para que as sombras não sejam cortadas pelo scroll container

### 2. Chips de sugestão — permitir texto multi-linha
- Remover qualquer truncamento implícito nos `SuggestionChip` e usar `text-left` + `whitespace-normal` para que textos longos não sejam cortados
- Ajustar o layout dos chips de sugestão de `flex-wrap` para um stack vertical (`flex-col`) quando o conteúdo for longo (sugestões de temas costumam ser frases completas)

### 3. Cards de objetivo — espaço para glow
- Adicionar `p-1` no wrapper do grid para que o `shadow-[0_0_15px...]` do card selecionado não seja clipado

### Arquivo editado
- `src/components/instagram-engine/CampaignWizard.tsx`
  - Linha ~419: Wrapper do grid de objetivos recebe padding extra (`p-1 -m-1`) para acomodar sombras
  - Linha ~458: Container de sugestões da IA muda de `flex flex-wrap gap-1.5` para `flex flex-col gap-2` (chips viram blocos completos sem truncamento)
  - Linha ~346-358: `SuggestionChip` recebe `whitespace-normal text-left` para permitir texto quebrando em múltiplas linhas
