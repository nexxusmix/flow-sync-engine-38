

## Reorganizacao do Menu Lateral (Sidebar)

### Mudanca Solicitada

Reordenar os itens do menu e criar um grupo expansivel "Studio Criativo e Marketing" que agrupa os sub-itens relacionados.

### Nova Ordem do Menu

1. Overview
2. Tarefas
3. Projetos
4. **Studio Criativo e Marketing** (grupo expansivel com sub-itens):
   - Marketing (dashboard)
   - Gerar Posts
   - Transcricao
   - Studio Criativo
5. Central de Acoes
6. CRM
7. Clientes (novo item - apontando para `/crm?tab=clients` ou rota dedicada)
8. Prospeccao
9. Calendario
10. Financeiro
11. Propostas
12. Contratos
13. Relatorios
14. Avisos

---

### Detalhes Tecnicos

**Arquivo**: `src/components/layout/Sidebar.tsx`

#### 1. Reestruturar o modelo de dados

Trocar a lista plana `mainMenuItems` por uma estrutura que suporta itens com `children`:

```typescript
interface MenuItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
  children?: MenuItem[];
}
```

Os itens do grupo "Studio Criativo e Marketing" serao filhos com rotas existentes:
- Marketing -> `/marketing`
- Gerar Posts -> `/marketing/studio?tab=templates`
- Transcricao -> `/marketing/transcricao`
- Studio -> `/marketing/studio`

#### 2. Adicionar estado local para controle do grupo

Usar `useState` para controlar a expansao/colapso do grupo. Auto-expandir quando qualquer rota filha estiver ativa.

#### 3. Renderizacao condicional

- **Sidebar expandida**: Mostrar o grupo como um item clicavel que expande/colapsa, com os sub-itens indentados abaixo.
- **Sidebar colapsada**: Mostrar apenas o icone do grupo pai. Ao passar o mouse ou clicar, nao expandir (manter comportamento simples de navegacao para a rota `/marketing`).

#### 4. Item "Clientes"

Criar novo item apontando para `/crm` com tab de clientes (ou simplesmente `/crm` como entrada separada do CRM). O CRM ja gerencia clientes, entao o href sera `/crm` com icone `group`.

#### 5. Animacao

Manter o padrao existente de `framer-motion` para os sub-itens, usando `AnimatePresence` com altura animada para a expansao do grupo.

### Resumo de Arquivos

| Arquivo | Mudanca |
|---|---|
| `src/components/layout/Sidebar.tsx` | Reordenar itens, criar grupo expansivel, adicionar item Clientes |
