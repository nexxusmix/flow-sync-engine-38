# Squad Hub

SaaS de gestão criativa para produtoras e agências — CRM, projetos, financeiro, portal do cliente e automação de IA.

**Produção:** https://squadhub.studio
**Repo:** nexxusmix/flow-sync-engine-38

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth, database, storage)
- Framer Motion
- Deploy: Vercel (auto-deploy de `main`)

## Desenvolvimento local

```sh
npm install
npm run dev
```

Requer Node 24+ e as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em `.env.local`.

## Scripts

- `npm run dev` — servidor de desenvolvimento (porta 8080)
- `npm run build` — build de produção
- `npm run lint` — ESLint
- `npm test` — Vitest

## Deploy

Push em `main` dispara deploy automático no Vercel. O domínio `squadhub.studio` aponta pro projeto Vercel `squad-hub-projeto`.
