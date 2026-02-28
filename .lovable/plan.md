

## Plano: Cirurgia de Hierarquia — Header do Projeto

### Diagnóstico

O header do projeto tem o mesmo problema da tela de tarefas: 8 botões primários competindo. Além disso, 3 botões de IA se sobrepõem:

1. **Sincronizar Financeiro** → chama `sync-project-finances` (só finanças)
2. **Auto Update IA** → chama `auto-update-project` (já inclui sync financeiro + tarefas + calendário)
3. **Atualizar com IA** → abre `ProjectCommandCenter` (chat livre com IA)

"Sincronizar Financeiro" é redundante — já está dentro do "Auto Update IA". E os nomes são confusos entre si.

### Solução

**1. Eliminar "Sincronizar Financeiro" do header** — redundante, já vive dentro do Auto Update e no menu ⚙.

**2. Unificar em 2 linhas limpas no header (`ProjectHeader.tsx`)**

Ações primárias (visíveis):
- `🔵 Enviar Material` (CTA primário, faz sentido como ação frequente)
- `✨ Auto Update IA` → renomear para **"Atualizar Projeto ✨"** (botão outline com destaque primary, hero da IA)
- `🟢 Enviar ao Cliente` (ação de entrega, verde)
- `Portal do Cliente` (outline)

Ações secundárias → **botão ⚙ Ferramentas** (dropdown):
- Sincronizar Financeiro (mantém como opção manual para power users)
- Comando IA (antigo "Atualizar com IA" — abre o Command Center)
- Exportar PDF
- Copiar Link
- Gerar Cliente + Pipeline (já está no ProjectActionsMenu)

**3. Renomear para eliminar confusão**
- "Auto Update IA" → **"Atualizar Projeto"** (com ícone ✨) — botão principal
- "Atualizar com IA" → **"Comando IA"** — dentro do dropdown Ferramentas
- "Sincronizar Financeiro" → mantém label, dentro do dropdown

**4. Melhorar feedback do Auto Update (`ProjectHeader.tsx`)**
- Após execução, mostrar toast detalhado com as ações realizadas (já retorna `actions[]`)
- Listar cada ação: ✓ Financeiro sincronizado, ✓ 4 tarefas criadas, ✓ Entrega agendada

**5. Melhorar edge function (`auto-update-project/index.ts`)**
- Adicionar Action 4: atualizar `health_score` após todas as ações (chama `calculate_project_health_score`)
- Adicionar Action 5: se projeto não tem `due_date`, sugerir com IA baseado no template e criar
- Tratar melhor o caso de tasks — hoje só cria se não existe NENHUMA task do user (deveria checar tasks do projeto via `project_id`)

### Arquivos impactados
- `src/components/projects/detail/ProjectHeader.tsx` — reestruturar toolbar, agrupar em dropdown Ferramentas
- `supabase/functions/auto-update-project/index.ts` — adicionar health_score refresh, melhorar query de tasks, sugerir due_date

### Resultado visual esperado
```text
┌──────────────────────────────────────────────────────────────┐
│  [Banner]                                                    │
│                                                              │
│  [📤 Enviar Material]  [✨ Atualizar Projeto]                │
│  [📨 Enviar ao Cliente]  [🌐 Portal]  [⚙ Ferramentas ▾]    │
│                                                              │
│  active  filme_institucional  Briefing                       │
│  🖼 Fazenda da Matta // Vídeo Institucional                  │
│     Amanda  Fazenda da Matta                                 │
│                                                              │
│  💰 R$ 2.200  │  📊 100%  │  📅 26 fev  │  👤 Matheus      │
└──────────────────────────────────────────────────────────────┘
```

