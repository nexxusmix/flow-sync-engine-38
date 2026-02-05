

# Plano: Correção Definitiva do Loading nas Páginas Overview, Projetos e CRM

## Problema Identificado
As páginas ficam em loading infinito porque a lógica de estado não trata corretamente cenários onde:
- O usuário não está autenticado (queries desabilitadas)
- A verificação de sessão falha silenciosamente
- O React Query v5 retorna estados inconsistentes para queries desabilitadas

## Solução

### 1. Corrigir `useAuth.tsx`
Adicionar tratamento de erro no `getSession()` e timeout de segurança:

```typescript
useEffect(() => {
  let mounted = true;
  
  supabase.auth.getSession()
    .then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    })
    .catch((error) => {
      console.error('Auth session error:', error);
      if (mounted) {
        setIsLoading(false);
      }
    });

  // Timeout de segurança - 5 segundos
  const timeout = setTimeout(() => {
    if (mounted && isLoading) {
      setIsLoading(false);
    }
  }, 5000);

  return () => { 
    mounted = false; 
    clearTimeout(timeout);
  };
}, []);
```

### 2. Corrigir `useProjects.tsx`
Alterar a lógica de loading para verificar se existe usuário:

```typescript
// De:
const isLoading = queryLoading;

// Para:
const isLoading = !!user && queryLoading;
```

### 3. Corrigir `useDashboardMetrics.tsx`
A lógica já está correta, mas garantir consistência:

```typescript
return {
  ...query,
  isLoading: !!user && query.isLoading,
};
```

### 4. Corrigir `useCRM.tsx`
A lógica já está correta:

```typescript
const isLoading = !!user && (isLoadingDeals || isLoadingContacts);
```

### 5. Simplificar lógica nas páginas

**Dashboard.tsx:**
```typescript
const { user, isLoading: authLoading } = useAuth();
const { data, isLoading: dataLoading } = useDashboardMetrics();

// Loading apenas durante auth ou (usuário existe E dados carregando)
const isLoading = authLoading || dataLoading;

if (isLoading) {
  return <Loading />;
}
```

**ProjectsListPage.tsx:**
```typescript
const { isLoading: authLoading } = useAuth();
const { projects, isLoading: dataLoading } = useProjects();

const isLoading = authLoading || dataLoading;

if (isLoading) {
  return <Loading />;
}
```

**CRMPage.tsx:**
```typescript
const { user, isLoading: authLoading } = useAuth();
const { deals, isLoading: dataLoading } = useCRM();

const isLoading = authLoading || dataLoading;

if (isLoading) {
  return <Loading />;
}
```

## Arquivos a Modificar
1. `src/hooks/useAuth.tsx` - Adicionar error handling e timeout
2. `src/hooks/useProjects.tsx` - Corrigir lógica de isLoading
3. `src/pages/Dashboard.tsx` - Simplificar verificação de loading
4. `src/pages/projects/ProjectsListPage.tsx` - Simplificar verificação de loading
5. `src/pages/CRMPage.tsx` - Simplificar verificação de loading

## Resultado Esperado
- Páginas carregam em no máximo 5 segundos (timeout de segurança)
- Usuários não autenticados veem conteúdo/empty state sem loading infinito
- Usuários autenticados veem loading apenas enquanto dados são buscados
- Erros de rede não travam a interface

