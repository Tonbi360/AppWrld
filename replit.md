# AppWorld

Premium PWA discovery platform — browse, test-drive, and review Progressive Web Apps without an app store.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/app-world run dev` — run the frontend (port 25708)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + Framer Motion + Wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → `@workspace/api-client-react`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/api-client-react/src/generated/` — generated hooks and Zod schemas (do not edit)
- `lib/db/src/schema.ts` — Drizzle ORM database schema
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/app-world/src/pages/` — React page components
- `artifacts/app-world/src/components/` — shared UI components
- `artifacts/app-world/src/index.css` — theme variables and base styles

## Architecture decisions

- **Contract-first API**: OpenAPI spec written first, all hooks + Zod schemas auto-generated. Never hand-write API client code.
- **Always dark theme**: No light mode toggle. Base color `#0D0D11`, primary electric violet `hsl(258 90% 66%)`. The `dark` class or media queries for light are forbidden.
- **Ghost name reviews**: Reviews are anonymous via a user-chosen nickname stored in localStorage — no auth required.
- **Iframe sandbox**: "Try Now" opens the PWA in a sandboxed iframe overlay; if a site blocks framing, the user falls back to "Open App" (new tab).
- **Manual curation queue**: Submissions go into a pending state; admin reviews them at `/admin` — no AI auto-approval.

## Product

- **Home** (`/`): Hero search, category chips, stats bar, featured + trending grids, developer CTA
- **Browse** (`/browse`): Full search, category filter, sort (newest/trending/top-rated), paginated grid
- **App Detail** (`/app/:id`): App header with capability badges, stats, "Try Now" iframe sandbox, reviews + logbook tabs
- **Submit** (`/submit`): URL-first 3-step wizard — paste URL → manifest scrape + auto-fill → UVP + category → queue
- **Feedback** (`/feedback`): Typed feedback form (suggestion/bug/complaint/praise) for users and developers
- **Admin** (`/admin`): Review queue (approve/reject), feedback management, platform stats

## User preferences

- No emojis anywhere in the UI
- Always dark theme — never light mode
- Direct results over discussion (Tonbi360 / non-technical user)

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` before writing any frontend code that uses the generated hooks.
- Do not add the frontend artifact to root `tsconfig.json` references.
- The shared proxy routes `/api` → api-server and `/` → app-world. No Vite proxy config needed.
- `useScrapeManifest` and `useSubmitApp` come from the generated `@workspace/api-client-react` hooks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
