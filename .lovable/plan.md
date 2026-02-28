

## Analysis

The `TaskAIPreviewPanel` and related files are production-ready. After reviewing all 4 key files, I found only minor polish items remaining:

### Issues Found

1. **No scroll-to-error on validation** — When a task with empty title is below the scroll fold, the user sees no visual feedback. Should auto-scroll to the first error.

2. **No keyboard shortcuts** — Missing `Enter` to confirm and `Escape` to go back from preview.

3. **Category chip click doesn't filter/toggle** — The summary chips are display-only. Clicking a category chip could toggle selection of all tasks in that category.

4. **Regenerate doesn't preserve guidance prompt** — When clicking "Regenerar", the guidance prompt and default category/column from step 1 are used, but the user can't see or adjust them from the preview step.

5. **Toast on success doesn't show task count by category** — After confirming, only shows "X tarefas criadas" without breakdown.

### Proposed Changes

**`TaskAIPreviewPanel.tsx`:**
- Add `useRef` to scroll container and auto-scroll to first validation error
- Add keyboard listener: `Enter` → confirm, `Escape` → back (with edit-loss check)
- Make category summary chips clickable to toggle-select tasks of that category
- Add subtle animation on task removal (opacity fade)

**`TasksPage.tsx`:**
- Improve success toast to show category breakdown: "5 tarefas criadas (3 Operação, 2 Pessoal)"
- Add `Escape` handler to close AI sheet when in input step

### Files
- `src/components/tasks/TaskAIPreviewPanel.tsx`
- `src/pages/TasksPage.tsx`

