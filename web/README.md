## Web App

Next.js 15 + React 19 + Tailwind 4, with Supabase integration and Vitest tests.

### Prerequisites
- Node.js 18+ (Node 22 recommended)
- pnpm
- Supabase project (to get URL and anon key)

### Environment
Copy the example env and fill with your project values:

```bash
cp .env.example .env.local
```

Required keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Install
```bash
pnpm install
```

### Dev
```bash
pnpm dev
```

Visit:
- `/api/health` – simple health JSON
- `/supabase-test` – server-side Supabase auth check

### Test
```bash
pnpm test
```

### Lint & Typecheck
```bash
pnpm lint
pnpm typecheck
```

### Build
```bash
pnpm build
```
