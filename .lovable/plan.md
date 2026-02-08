
# Plano: Simplificar e Otimizar Funcionalidade de Revisões

## Diagnóstico dos Problemas Atuais

### 1. Fluxo Confuso no Portal do Cliente
- Cliente precisa navegar entre abas "Materiais" e "Revisões"
- O botão "Revisar Agora" leva para a aba Materiais, mas para criar change requests precisa ir na aba Revisões
- Formulário de revisão só aparece após expandir player de vídeo
- Muitos cliques para uma ação simples

### 2. Duplicação de Funcionalidades
- `PortalInlineComment` (na aba Materiais) permite comentar/aprovar/solicitar ajuste
- `PortalRevisionsTab` tem formulário de "Nova Solicitação" separado
- Cliente não sabe qual usar

### 3. UX do Gestor Interno
- Aba Revisões do projeto mostra comentários e change requests misturados
- Sem indicação visual clara de qual material cada revisão se refere
- Botão "Gerar Resumo IA" não funciona

### 4. Falta de Contexto Visual
- Comentários aparecem sem preview do material
- Difícil entender o contexto do feedback

---

## Solução: Interface Unificada e Simplificada

### Princípios de Design
1. **Um lugar para tudo**: Unificar experiência de revisão em um único componente
2. **Menos cliques**: Ação de revisão acessível diretamente do card do material
3. **Contexto visual**: Sempre mostrar preview do material junto com o formulário
4. **Feedback imediato**: Toast + atualização realtime

---

## Implementação

### 1. Portal do Cliente - Aba "Materiais" Redesenhada

**Mudanças:**
- Adicionar botão "Solicitar Ajuste" diretamente no card do material (sem precisar expandir player)
- Ao clicar, abre um drawer/modal simples com:
  - Preview do material (thumbnail + título)
  - Campo de texto "O que precisa mudar?"
  - Seletor de prioridade (Normal/Alta/Urgente)
  - Nome + Email
  - Botão "Enviar"
- Remover a necessidade de expandir player para comentar

**Novo Componente: `QuickRevisionDrawer`**
```text
┌────────────────────────────────────────┐
│ 📹 [Thumbnail]  Material X (V2)        │
├────────────────────────────────────────┤
│                                        │
│ O que precisa mudar? *                 │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Prioridade:  [Normal] [Alta] [Urgente] │
│                                        │
│ Seu nome *          Email (opcional)   │
│ ┌──────────────┐    ┌────────────────┐ │
│ │              │    │                │ │
│ └──────────────┘    └────────────────┘ │
│                                        │
│        [Cancelar]  [Enviar Feedback]   │
└────────────────────────────────────────┘
```

### 2. Portal do Cliente - Simplificar Aba "Revisões"

**Mudanças:**
- Remover formulário de "Nova Solicitação" (já existe no material)
- Focar em mostrar histórico de revisões com status claro
- Agrupar por material
- Mostrar timeline de interações

**Layout:**
```text
┌─────────────────────────────────────────────────────────┐
│  📊 Resumo: 2 Pendentes | 1 Em Análise | 3 Resolvidos   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📹 Material X (V2)                                     │
│  ├── ⚠ "Ajustar cor do logo" - Alta - Pendente        │
│  │    └── Resp: "Vamos ajustar na V3" - Equipe        │
│  └── ✅ "Reduzir volume da música" - Resolvido        │
│                                                         │
│  📹 Material Y (V1)                                     │
│  └── 🔄 "Trocar imagem inicial" - Em Análise          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. Projeto Interno - Aba "Revisões" Melhorada

**Mudanças:**
- Layout em duas colunas: Lista de materiais | Detalhes da revisão
- Preview do material no painel de detalhes
- Ações rápidas: Responder, Resolver, Iniciar Análise
- Filtro por material além de status

**Layout:**
```text
┌────────────────────────┬────────────────────────────────────┐
│ Filtros: [Status ▼]    │  📹 Material X (V2)                │
│          [Material ▼]  │  ──────────────────────────────────│
│                        │  ⚠ Ajustar cor do logo             │
│ ┌────────────────────┐ │  Prioridade: Alta                  │
│ │ 📹 Material X      │ │  Por: João Silva - há 2h           │
│ │ 2 pendentes        │ │                                    │
│ ├────────────────────┤ │  "O logo está muito escuro,        │
│ │ 📹 Material Y      │ │   precisa de mais contraste"       │
│ │ 1 em análise       │ │                                    │
│ └────────────────────┘ │  ┌────────────────────────────────┐│
│                        │  │ Responder...                   ││
│                        │  └────────────────────────────────┘│
│                        │                                    │
│                        │  [Iniciar Análise] [Resolver]      │
└────────────────────────┴────────────────────────────────────┘
```

### 4. Melhorias na UX Geral

1. **Toast com ação de desfazer** (quando aplicável)
2. **Badge de contagem no ícone da aba** - Mostrar número de pendentes
3. **Botão "Revisar" em cada card** - Acesso direto sem expandir
4. **Indicador de "Nova revisão"** - Highlight para itens não vistos

---

## Arquivos a Modificar

### Portal do Cliente
1. **`src/components/client-portal/portal-materials/PortalMaterialCard.tsx`**
   - Adicionar botão "Solicitar Ajuste" no card

2. **Criar: `src/components/client-portal/QuickRevisionDrawer.tsx`**
   - Drawer simplificado para solicitar revisão
   - Props: material, onSubmit, isSubmitting

3. **`src/components/client-portal/portal-materials/PortalMaterialsTab.tsx`**
   - Integrar QuickRevisionDrawer
   - Simplificar lógica de exibição

4. **`src/components/client-portal/portal-tabs/PortalRevisionsTab.tsx`**
   - Remover formulário duplicado
   - Agrupar por material
   - Adicionar timeline view

5. **`src/components/client-portal/PortalTabsPremium.tsx`**
   - Adicionar badge de contagem nas abas

### Projeto Interno
6. **`src/components/projects/detail/tabs/RevisionsTab.tsx`**
   - Layout em duas colunas
   - Adicionar filtro por material
   - Painel de detalhes com preview

7. **`src/components/projects/detail/ProjectTabs.tsx`**
   - Badge de contagem na aba Revisões

---

## Fluxo Simplificado (Resultado Final)

### Cliente quer revisar:
1. Abre portal → Vê materiais
2. Clica "Solicitar Ajuste" no card do material
3. Drawer abre → Escreve feedback → Envia
4. Toast confirma → Revisão aparece na aba Revisões

### Gestor vê revisões:
1. Abre projeto → Badge mostra "3 pendentes"
2. Clica aba Revisões → Vê lista por material
3. Clica em uma revisão → Vê detalhes + preview
4. Responde ou resolve diretamente

---

## Resultado Esperado

- **Menos cliques**: 2-3 cliques para enviar revisão (antes: 5+)
- **Menos confusão**: Um caminho claro para cada ação
- **Mais contexto**: Sempre vê o material junto com o feedback
- **Realtime**: Atualizações instantâneas em ambos os lados
