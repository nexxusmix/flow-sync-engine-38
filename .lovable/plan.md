
# Unificar Plataforma: Remover Separacao de Modulos

A plataforma deixa de ter "Produtora" e "Marketing" como modulos separados. Tudo vira uma unica plataforma integrada.

## Resumo das Mudancas

1. **Remover ModuleSwitcher da Sidebar** - O switcher Produtora/Marketing/Completo some do menu lateral
2. **Mostrar todos os itens de menu sempre** - Sem filtro por modulo, tudo visivel
3. **Remover PlatformSelectorPage** - A pagina de "Escolha sua Area" deixa de existir
4. **Simplificar useProductContext** - Sempre retorna 'full', mantendo compatibilidade com codigo existente
5. **Remover filtro de projetos por modulo** - `useProjects` busca todos os projetos sem filtrar por `product_type`
6. **Limpar rotas** - Redirecionar `/plataforma` para `/` e remover item "Plataforma" das configuracoes

## Detalhes Tecnicos

### Arquivos modificados:

**1. `src/hooks/useProductContext.tsx`**
- Simplificar para sempre retornar `activeModule = 'full'`
- Manter a interface para nao quebrar imports existentes
- `hasAccess()` sempre retorna `true`
- Remover logica de localStorage

**2. `src/components/layout/Sidebar.tsx`**
- Remover import e uso do `ModuleSwitcher`
- Remover import do `useProductContext`
- Remover a propriedade `modules` dos `MenuItem`
- Mostrar todos os `mainMenuItems` sem filtro
- Remover o bloco `<ModuleSwitcher collapsed={collapsed} />`

**3. `src/components/layout/ModuleSwitcher.tsx`**
- Manter arquivo mas esvaziar (retorna null) para nao quebrar imports residuais

**4. `src/hooks/useProjects.tsx`**
- Remover uso de `useProductContext`
- Remover filtro `.eq('product_type', activeModule)`
- Remover `activeModule` da queryKey

**5. `src/App.tsx`**
- Redirecionar rota `/plataforma` para `/` ao inves de renderizar `PlatformSelectorPage`
- Remover import de `PlatformSelectorPage`

**6. `src/pages/settings/SettingsDashboard.tsx`**
- Remover o item "Plataforma" (id: 'platform') da lista de configuracoes

### Arquivos NAO modificados (mantem compatibilidade):
- Todas as paginas de marketing continuam funcionando nas mesmas rotas
- Marketing Hub (`/m/*`) continua existindo
- Nenhuma rota e removida, apenas o filtro de visibilidade
