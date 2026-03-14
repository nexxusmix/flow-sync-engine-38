

## Ações Autônomas com IA no Resumo Diário

### O que muda

As ações recomendadas pela IA ganham **botões de execução rápida** que transformam recomendações em tarefas reais com um clique. O sistema analisa o texto da ação para extrair entidades (nomes de projetos, clientes) e oferece opções inteligentes.

### Comportamento

Cada ação recomendada terá, além dos botões atuais (feito/adiar/recusar), um novo **botão "+" (Criar Tarefa)** que abre um popover com:

1. **Ação única** — Cria uma tarefa com o texto da recomendação
2. **Ações individuais** — Se a IA detectar múltiplas entidades (ex: "PORTO 153" e "Fazenda da Matta"), oferece criar uma tarefa separada para cada
3. **Ambas** — Cria todas as tarefas individuais de uma vez

Cada opção mostra preview do título da tarefa que será criada. As tarefas são criadas com:
- Status: `today` (para execução imediata)
- Prioridade: `high` (vinda de recomendação IA)
- Categoria: `operacao`
- Tag: `polo-ai` (rastreabilidade)
- Vinculação automática ao `project_id` se o nome do projeto for encontrado no banco

### Mudanças nos arquivos

1. **`src/components/dashboard/AIDailySummary.tsx`**
   - Novo componente interno `QuickTaskCreator` com popover
   - Lógica de extração de entidades do texto (regex para nomes entre aspas e nomes próprios em maiúsculas)
   - Query para buscar projetos do usuário (match por nome) para vincular `project_id`
   - Usa `createTasksFromAIMutation` do `useTasksUnified` para persistir
   - Botão "+" ao lado dos botões existentes de cada ação
   - Após criar, marca a ação como "done" automaticamente
   - Padronizar cores restantes (emerald/amber/red hardcoded → Sonance)

2. **Nenhuma migração necessária** — usa a tabela `tasks` existente e o hook `useTasksUnified` já tem `createTasksFromAIMutation`

### Fluxo visual

```text
┌─────────────────────────────────────────────────────┐
│ ✓ Priorizar recuperação dos projetos "PORTO 153"    │
│   e "Fazenda da Matta"                              │
│                          [+] [✓] [⏸] [✕]           │
│                           │                          │
│                    ┌──────▼──────────────┐           │
│                    │ Criar como tarefa:  │           │
│                    │ ▸ Tarefa única      │           │
│                    │ ▸ PORTO 153         │           │
│                    │ ▸ Fazenda da Matta  │           │
│                    │ ▸ Criar ambas       │           │
│                    └─────────────────────┘           │
└─────────────────────────────────────────────────────┘
```

### Detalhes técnicos

- Extração de entidades: regex `/"([^"]+)"/g` para nomes entre aspas + match contra lista de projetos do banco
- Query de projetos: `useQuery` com `supabase.from('projects').select('id, name')` para matching
- Criação de tarefas: reutiliza `createTasksFromAIMutation` já existente no `useTasksUnified`
- Feedback: toast de sucesso com contagem de tarefas criadas + link para módulo de tarefas
- Correção de cores: substituir `text-emerald-400`, `text-amber-400`, `text-red-400` hardcoded no mesmo arquivo

