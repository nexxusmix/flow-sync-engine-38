

# Plano: Design Polo Fiel - SQUAD Hub

## Visao Geral
Refatorar completamente o design system do SQUAD Hub para ser hiperfielmente igual ao template Polo, seguindo cada detalhe visual das referencias.

---

## 1. Cores Exatas do Polo

### CSS Variables (valores exatos)
```text
Background:    #050505 (0 0% 2%)
Surface/Card:  #121212 (0 0% 7%)
Border:        #272727 (0 0% 15%)
Text Primary:  #ffffff
Text Muted:    #9ca3af (220 14% 64%)
```

### Mudancas em src/index.css
- Ajustar --background para 0 0% 2%
- Ajustar --card para 0 0% 7%
- Ajustar --border para 0 0% 15%
- Ajustar --muted-foreground para 220 14% 64%

---

## 2. Cards Estilo Polo

### Caracteristicas visuais
- Border radius: rounded-2xl (1rem) padrao, rounded-3xl (1.5rem) para cards maiores
- Borda sutil de 1px com cor #272727
- Padding interno generoso (p-6 a p-8)
- Sem sombras - apenas bordas
- Hover state: borda fica levemente mais clara

### Nova classe .polo-card
```css
.polo-card {
  @apply rounded-2xl border border-[#272727] bg-[#121212] p-6;
  transition: border-color 0.2s ease;
}
.polo-card:hover {
  border-color: #3a3a3a;
}
```

---

## 3. Labels Uppercase Polo

### Estilo dos labels de secao
- Texto uppercase
- Tamanho text-xs
- Tracking wider (letter-spacing: 0.1em)
- Cor muted (#9ca3af)
- Margem inferior mb-4

### Exemplo
```html
<span class="text-xs uppercase tracking-wider text-muted-foreground mb-4">
  SERVICES
</span>
```

---

## 4. Pills/Badges Estilo Polo

### Caracteristicas
- Borda rounded-full
- Border 1px solid #272727
- Background transparente ou #121212
- Padding px-4 py-1.5
- Texto text-sm

### Nova classe .polo-pill
```css
.polo-pill {
  @apply inline-flex items-center px-4 py-1.5 rounded-full 
         border border-[#272727] bg-transparent text-sm 
         text-foreground transition-colors hover:border-[#404040];
}
```

---

## 5. Sidebar Refinada

### Mudancas
- Background igual ao fundo principal (#050505)
- Bordas mais sutis (#272727)
- Logo com icone em rounded-lg
- Nav items com rounded-xl
- Hover states mais sutis

---

## 6. Layout Bento Grid Polo

### Estrutura
- Grid responsivo com gaps consistentes (gap-4)
- Cards de tamanhos variados (col-span-1, col-span-2)
- Rows com altura auto

### Dashboard Layout
```text
+------------------+--------+--------+
|   Welcome Card   | Metric | Metric |
|    (col-span-2)  |   1    |   2    |
+------------------+--------+--------+
| Metric | Metric |   Quick Stats    |
|   3    |   4    |   (col-span-2)   |
+--------+--------+------------------+
|   Urgent List    |    Timeline      |
|   (col-span-2)   |   (col-span-2)   |
+------------------+------------------+
```

---

## 7. Componentes a Atualizar

### src/index.css
- Atualizar variaveis CSS dark mode
- Adicionar classes .polo-card, .polo-pill, .polo-label
- Refinar scrollbar styling

### src/components/layout/AppSidebar.tsx
- Aplicar cores Polo
- Refinar nav items styling

### src/components/dashboard/MetricCard.tsx
- Usar polo-card
- Adicionar label uppercase
- Icone em bg mais sutil

### src/components/dashboard/WelcomeCard.tsx
- Remover gradiente
- Usar polo-card puro
- Tipografia refinada

### src/components/dashboard/QuickStats.tsx
- Usar polo-card
- Label uppercase "RESUMO"
- Dividers mais sutis

### src/components/dashboard/UrgentActionsList.tsx
- Usar polo-card
- Label uppercase "ACOES URGENTES"

### src/components/dashboard/RecentActivityTimeline.tsx
- Usar polo-card
- Label uppercase "ATIVIDADE RECENTE"

### src/pages/Pipeline.tsx
- Header refinado com pills para filtros
- Cards com estilo Polo
- Placeholder mais elaborado

---

## 8. Detalhes de Tipografia

### Hierarquia
- H1: text-2xl font-semibold tracking-tight
- H2: text-lg font-medium
- Body: text-sm
- Label: text-xs uppercase tracking-wider text-muted-foreground
- Muted: text-sm text-muted-foreground

---

## 9. Icones e Interacoes

### Icones
- Tamanho padrao: h-5 w-5
- Cor: text-muted-foreground
- Container: rounded-xl bg-secondary p-2.5

### Hover States
- Cards: border fica mais clara
- Buttons: opacity ou background shift
- Links: arrow-up-right aparece

---

## 10. Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| src/index.css | Variaveis CSS + classes utilitarias |
| src/components/layout/AppSidebar.tsx | Estilo Polo |
| src/components/dashboard/MetricCard.tsx | polo-card + label |
| src/components/dashboard/WelcomeCard.tsx | Remover gradiente |
| src/components/dashboard/QuickStats.tsx | polo-card + label |
| src/components/dashboard/UrgentActionsList.tsx | polo-card + label |
| src/components/dashboard/RecentActivityTimeline.tsx | polo-card + label |
| src/pages/Dashboard.tsx | Grid ajustado |
| src/pages/Pipeline.tsx | Pills + estilo Polo |
| src/pages/Propostas.tsx | Estilo Polo |
| src/pages/Contratos.tsx | Estilo Polo |
| src/pages/Financeiro.tsx | Estilo Polo |

---

## Resultado Esperado

Visual identico ao template Polo:
- Fundo ultra escuro #050505
- Cards elevados #121212 com bordas sutis #272727
- Labels uppercase para secoes
- Pills para tags/categorias
- Tipografia Inter limpa e hierarquica
- Interacoes sutis e refinadas

