

# Redesign: Modal Modo Foco - Estilo Glass Morphism Premium

## Visao Geral
Redesign completo do modal `TaskExecutionGuide` para replicar fielmente o layout "Liquid Glass" do template de referencia, mantendo toda a funcionalidade existente (completar tarefas, salvar plano, exportar PDF, timer).

## Mudancas Visuais

### 1. Container do Modal
- **De:** `max-w-lg` (512px) com cards coloridos
- **Para:** `max-w-5xl` (~1024px) com glass-morphism escuro
- Fundo: `bg-black/90 backdrop-blur-[20px]` com borda `border-[rgba(0,115,153,0.25)]`
- Cantos: `rounded-3xl`
- Pattern sutil de dots no fundo (radial-gradient)

### 2. Header Premium
- Subtitulo: "MODO FOCO . BLOCOS OTIMIZADOS COM IA // HUB . DATA" em tracking ultra-wide, cor primary/70
- Titulo grande: "PLANO DE EXECUCAO" em gradient branco, bold, uppercase
- Caixa de stats flutuante a direita com 3 metricas separadas por dividers verticais: Blocos | Tarefas | Tempo Estimado
- Botao X reposicionado no canto superior direito absoluto

### 3. Tabela de Blocos (substituindo cards)
- Header de colunas: EXECUCAO ESTRATEGICA | METODO | DURACAO | PROGRESSO
- Tipografia: `text-[9px] uppercase tracking-[0.25em]` mono
- Cada bloco vira uma linha com:
  - Status indicator dot (cor varia: primary para deep_work, slate para shallow, amber para break)
  - Titulo do bloco em `text-[13px] font-medium text-white/90`
  - Subtitulo com nomes das tarefas em `text-[9px] uppercase tracking-widest text-slate-500`
  - Metodo: "DEEP WORK" ou "SHALLOW WORK" em mono
  - Duracao: "{technique} {duration}min" em mono
  - Progresso: Active/Queued/Pending/Scheduled/Done
- Hover effect sutil com fundo azul glass
- Clique na linha expande para mostrar as tarefas individuais com checkboxes (funcionalidade mantida)

### 4. Footer Premium
- Secao "DICAS DE PRODUTIVIDADE" com tips em grid de 3 colunas
- Cada tip com `>` em cor primary
- Botoes de acao (Exportar PDF, Salvar Plano) reposicionados no canto direito do footer
- Branding "powered by SQUAD///FILM" no canto inferior direito

### 5. Estados (Loading/Error)
- Loading: manter spinner centralizado mas com estilo glass
- Error: manter botao retry com estilo atualizado

## Arquivo Modificado
- `src/components/tasks/TaskExecutionGuide.tsx` - Reescrita completa do JSX do modal (logica/state inalterados)

## Detalhes Tecnicos

### Estilos inline (sem CSS externo)
Todos os estilos glass-morphism serao aplicados via Tailwind classes e `style={{}}` quando necessario:
- Glass bg: `bg-[rgba(0,115,153,0.12)] backdrop-blur-[20px] border border-[rgba(0,115,153,0.25)] shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]`
- Data pattern: `style={{ backgroundImage: 'radial-gradient(rgba(0,115,153,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }}`
- Chromatic text: `style={{ textShadow: '1px 0 0 rgba(255,255,255,0.05), -1px 0 0 rgba(0,115,153,0.3)' }}`

### Expansao de bloco
Ao clicar em uma linha de bloco, ela expande para mostrar as tarefas individuais abaixo (com animacao framer-motion). Cada tarefa mantem o checkbox circular + titulo + duracao + timer.

### Mapeamento de status por indice
- `bIdx === activeBlockIdx` -> "Active" (texto branco)
- `bIdx < activeBlockIdx` e todas tarefas completas -> "Done" (verde)
- `bIdx === activeBlockIdx + 1` -> "Queued"
- Demais -> "Scheduled"

### Cores do status indicator
- `deep_work`: `bg-primary shadow-[0_0_6px_rgba(0,115,153,0.5)]`
- `shallow_work`: `bg-slate-600`
- `break`: `bg-amber-500/50`

