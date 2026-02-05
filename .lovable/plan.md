
# Plano: Landing Page + Fix Processamento IA

## Resumo
Implementar duas correções principais:
1. Redirecionar usuários não autenticados para a Landing Page
2. Corrigir o erro de processamento de documentos no novo projeto (edge function não deployada)
3. Garantir acesso à IA em mais pontos da plataforma

---

## 1. Routing da Landing Page

**Problema Atual:**
- Usuários não logados são redirecionados para `/login`
- Landing page está em `/landing` (rota separada)

**Solução:**
Modificar `src/App.tsx` para:
- Se NÃO autenticado: mostrar `LandingPage` na rota `/`
- Se autenticado: mostrar `Dashboard` na rota `/`

```text
Fluxo atual:
  / ────> ProtectedRoute ────> Redireciona para /login

Fluxo novo:
  / ────> isAuthenticated? ────> SIM: Dashboard
                            └──> NÃO: LandingPage
```

**Arquivos afetados:**
- `src/App.tsx` - Ajustar rota raiz para condicional

---

## 2. Correção do Erro "Processar Documento"

**Diagnóstico:**
A edge function `extract-project-from-document` retorna erro 404 - ela **não está deployada**.

**Solução:**
Deployar a edge function existente em `supabase/functions/extract-project-from-document/index.ts`

**Dependências:**
- LOVABLE_API_KEY: Configurado

---

## 3. Botão IA em Mais Lugares

**Componente Atual:**
O `AICommandButton` já está presente globalmente via `DashboardLayout`.

**Melhorias sugeridas:**
Adicionar acesso rápido à IA dentro de:
- Modal de novo projeto (já tem opção "Criar com IA")
- Header de páginas específicas
- Ações contextuais em cards

---

## Detalhes Técnicos

### Alteração em `src/App.tsx`

```tsx
// Substituir a rota "/" de:
<Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

// Para:
<Route 
  path="/" 
  element={
    isAuthenticated 
      ? <Dashboard /> 
      : <LandingPage />
  } 
/>
```

Também remover a rota `/landing` separada pois não será mais necessária.

### Deploy da Edge Function

Executar deploy da função `extract-project-from-document` que já existe no código mas não está disponível no ambiente.

---

## Sequência de Implementação

| Ordem | Tarefa | Impacto |
|-------|--------|---------|
| 1 | Deploy edge function `extract-project-from-document` | Corrige erro imediato |
| 2 | Ajustar routing em `App.tsx` | Landing page como home |
| 3 | Remover rota `/landing` duplicada | Limpeza |

---

## Resultado Esperado

- Visitantes verão a Landing Page ao acessar a plataforma
- Usuários logados vão direto para o Dashboard
- "Criar Projeto com IA" funcionará corretamente
- Botão flutuante de IA continuará disponível em todas as páginas internas
