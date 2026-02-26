

## Agendar Blocos do Modo Foco no Calendário

### O que será feito
Adicionar um botão "Agendar" no footer do Modo Foco que cria eventos na tabela `calendar_events` para cada bloco do plano de execução, com horários sequenciais a partir de agora (ou horário escolhido).

### Implementação

**Arquivo: `src/components/tasks/TaskExecutionGuide.tsx`**

1. Adicionar botão "Agendar no Calendário" (ícone `CalendarPlus`) ao lado dos botões "Exportar PDF" e "Salvar Plano" no footer
2. Ao clicar, inserir cada bloco do plano como um `calendar_event` com:
   - `title`: nome do bloco (ex: "Deep Work: Revisão de Projetos")
   - `start_at` / `end_at`: calculados sequencialmente a partir de `new Date()`, usando `duration_minutes` de cada bloco
   - `event_type`: `'task'`
   - `description`: lista das tarefas do bloco
   - `color`: cor baseada no tipo do bloco (deep_work = azul, shallow_work = cinza, break = amarelo)
3. Usar `supabase.from('calendar_events').insert(events)` diretamente (sem edge function)
4. Invalidar query `['calendar-events']` após inserção para atualizar a agenda em tempo real
5. Toast de sucesso com link/indicação para ir ao calendário

### Fluxo do usuário
Modo Foco → Gera plano → Clica "Agendar" → Blocos aparecem no calendário como eventos sequenciais começando agora

### Arquivos modificados
- `src/components/tasks/TaskExecutionGuide.tsx` — adicionar botão e lógica de criação dos eventos

