

# Correção de Bugs Visuais e Duplicação

## 1. Remover `ClientPortalPage.tsx` (antigo)
Apenas `ClientPortalPageNew.tsx` é usado (importado em `App.tsx` como `ClientPortalPage`). Deletar `src/pages/ClientPortalPage.tsx`.

## 2. CRMPage.tsx — Live Sync indicator (linhas 148-149)
- `bg-emerald-500` → `bg-primary`
- `text-emerald-500` → `text-primary`
- `text-amber-500` (temperature "Morno", linha 187) → `text-muted-foreground`
- `text-red-500` (temperature "Quente", linha 186) → `text-primary` (não é erro)

## 3. ExecutionPlanView.tsx — Risk colors e status colors
- `riskColors` (linhas 87-91): low → `bg-primary/10 text-primary border-primary/20`, medium → `bg-muted text-muted-foreground border-border`, high → `bg-destructive/10 text-destructive border-destructive/20`
- Success summary (linha 138): `bg-green-500/10 border-green-500/20 text-green-400` → `bg-primary/10 border-primary/20 text-primary`
- Step success bg (linha 177): `bg-green-500/5` → `bg-primary/5`
- Step error bg (linha 178): `bg-red-500/5` → `bg-destructive/5`
- Success icon (linha 188): `text-green-500` → `text-primary`

## 4. ContractClientPage.tsx — Cores de assinatura
- Linha 274: `text-amber-500` → `text-muted-foreground`
- Linhas 293, 298: `bg-emerald-500/10 text-emerald-500`, `bg-emerald-500/20 text-emerald-500` → `bg-primary/10 text-primary`, `bg-primary/20 text-primary`
- Linha 343: `bg-emerald-600 hover:bg-emerald-700` → `bg-primary hover:bg-primary/90`

## 5. MessageDraftModal.tsx
Busca não encontrou emerald nesse arquivo — pode já ter sido corrigido. Verificarei novamente na implementação e corrigirei se necessário.

---

5 arquivos afetados, todas substituições mecânicas de cores seguindo a paleta Sonance (azul/cinza/destructive).

