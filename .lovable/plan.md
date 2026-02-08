
# Plano: Corrigir Sistema de Revisões do Portal do Cliente

## Problemas Identificados

Após análise detalhada do código, banco de dados e RLS policies, identifiquei os seguintes problemas:

### 1. RLS Policy Não Funciona para Usuários Anônimos (Cliente)
O portal do cliente usa o Supabase client em modo anônimo (sem autenticação), mas a RLS policy exige que a inserção venha de um deliverable válido. O problema é que **o cliente Supabase não passa o contexto correto** para a validação.

### 2. Material é Vídeo do YouTube (Sem Suporte a Marcação)
O único material existente é um vídeo do YouTube. O código já trata isso corretamente mostrando uma mensagem, mas não há campo de revisão alternativo para escrever comentários sem marcação de frame.

### 3. Campo de Revisão Não Aparece Sem Expandir Player
O formulário de revisão (`PortalInlineComment`) só aparece quando um material é selecionado E expandido, mas para YouTube isso não abre o player de marcação.

### 4. RevisionForm Não Integrado para Caso Geral
O `RevisionForm` só aparece após marcar um frame, mas deveria haver opção de comentar/solicitar revisão sem marcar frame.

---

## Solução Proposta

### Fase 1: Corrigir Fluxo de Exibição do Campo de Revisão

**Problema**: O campo de comentário/revisão não aparece de forma acessível ao cliente.

**Solução**:
1. Mostrar `PortalInlineComment` sempre que um material for clicado/selecionado
2. Para vídeos do YouTube, mostrar o embed E o formulário de comentários abaixo
3. Adicionar botão "Solicitar Revisão" diretamente nos cards de material

**Arquivos a modificar**:
- `src/components/client-portal/portal-materials/PortalMaterialsTab.tsx`

### Fase 2: Corrigir Problema de Permissão (RLS)

**Problema**: A inserção de comentários pode falhar silenciosamente por erro de permissão.

**Solução**:
1. Adicionar tratamento de erro adequado no hook `useClientPortalEnhanced`
2. Exibir toast com mensagem de erro quando a inserção falhar
3. Logs de console para debug

**Arquivos a modificar**:
- `src/hooks/useClientPortalEnhanced.tsx`

### Fase 3: Melhorar UX do Player de YouTube

**Problema**: Vídeos do YouTube não permitem marcação de frame, mas o cliente ainda precisa poder comentar.

**Solução**:
1. Mostrar player de YouTube expandido
2. Exibir campo de comentário/revisão abaixo do player
3. Remover restrição de "sem marcação" e permitir comentários gerais

**Arquivos a modificar**:
- `src/components/client-portal/portal-materials/VideoPlayerWithMarkers.tsx`
- `src/components/client-portal/portal-materials/PortalMaterialsTab.tsx`

### Fase 4: Adicionar Feedback Visual de Submissão

**Problema**: O usuário não sabe se a revisão foi enviada ou se houve erro.

**Solução**:
1. Toast de sucesso ao enviar revisão
2. Toast de erro se falhar
3. Limpar formulário após sucesso
4. Invalidar cache para atualizar lista

**Arquivos a modificar**:
- `src/hooks/useClientPortalEnhanced.tsx`
- `src/pages/ClientPortalPageNew.tsx`

---

## Detalhes Técnicos

### Modificação 1: PortalMaterialsTab.tsx

```text
Atual:
- Material clicado → Expande player → Marcar frame → Formulário aparece

Proposto:
- Material clicado → Expande player (se vídeo) OU mostra detalhes (se outro)
- Formulário de comentário/revisão SEMPRE visível quando selecionado
- YouTube: Player + Formulário sem marcação
- MP4: Player com marcação + Formulário com timecode
```

### Modificação 2: useClientPortalEnhanced.tsx

Adicionar callbacks de sucesso/erro:

```typescript
const requestRevision = useMutation({
  mutationFn: async (...) => { ... },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['client-portal', shareToken] });
    toast.success('Solicitação de revisão enviada!');
  },
  onError: (error) => {
    console.error('Erro ao enviar revisão:', error);
    toast.error('Erro ao enviar solicitação. Tente novamente.');
  },
});
```

### Modificação 3: VideoPlayerWithMarkers.tsx

Para YouTube:
```text
Atual:
┌─────────────────────────────────────────────────┐
│           YOUTUBE EMBED                         │
├─────────────────────────────────────────────────┤
│ "Para marcar frames, use vídeo hospedado"       │
└─────────────────────────────────────────────────┘

Proposto:
┌─────────────────────────────────────────────────┐
│           YOUTUBE EMBED                         │
├─────────────────────────────────────────────────┤
│ [💬 Adicionar Comentário] [⚠ Solicitar Ajuste] │
└─────────────────────────────────────────────────┘
```

### Modificação 4: PortalInlineComment.tsx

Garantir que funciona sem timecode:
- Remover validação de timecode obrigatório
- Permitir envio de comentário/revisão apenas com texto
- Manter timecode como opcional (quando disponível)

---

## Arquivos a Modificar

1. **`src/components/client-portal/portal-materials/PortalMaterialsTab.tsx`**
   - Sempre mostrar formulário quando material selecionado
   - Suporte a YouTube sem marcação

2. **`src/hooks/useClientPortalEnhanced.tsx`**
   - Adicionar toast de sucesso/erro
   - Melhorar logs de debug

3. **`src/components/client-portal/portal-materials/VideoPlayerWithMarkers.tsx`**
   - Adicionar prop `onRequestRevision` para YouTube
   - Mostrar botões de ação mesmo sem marcação

4. **`src/pages/ClientPortalPageNew.tsx`**
   - Verificar se callbacks estão passando dados corretos

---

## Resultado Esperado

1. **Cliente no Portal**:
   - Clica no material
   - Vê o player (YouTube ou MP4)
   - Campo de revisão visível e funcional
   - Pode escrever comentário/revisão sem marcar frame
   - Recebe feedback (sucesso ou erro)

2. **Equipe na Plataforma**:
   - Vê revisões na aba Revisões do projeto
   - Pode responder e resolver

3. **Sem Erros Silenciosos**:
   - Logs claros no console
   - Toasts informativos para o usuário
