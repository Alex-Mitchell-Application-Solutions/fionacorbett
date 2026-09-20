# fionacorbett.co.uk

A private site for Fiona Corbett's 60th birthday: a gallery of photographs
spanning her life, and memories written by the people who know her.

Read [AGENTS.md](./AGENTS.md) before changing anything. It carries the scope, the
standards and the reasoning.

## Running it

You need Node 24.20.0 (pinned in `.node-version`, so fnm or nvm will pick it
up), pnpm 11, and Docker for the local database.

```bash
pnpm install
cp env.example .env       # then set PAYLOAD_SECRET: openssl rand -hex 32
pnpm run db:up            # Postgres on 5432
pnpm run migrate          # apply the schema
pnpm run seed             # admin user, placeholder images, sample photographs
pnpm run dev
```

The seed prints a generated admin password once, unless you set
`SEED_ADMIN_PASSWORD` yourself. Sign in at <http://localhost:3000/admin>.

Placeholder images are generated at seed time rather than committed, so nothing
in the repository looks like content but is not. They say PLACEHOLDER on them.

## The commands that matter

| Command                   | What it does                                     |
| ------------------------- | ------------------------------------------------ |
| `pnpm run ci:quality`     | The gate: lint, typecheck, test, format, build   |
| `pnpm run dev`            | Development server                               |
| `pnpm run migrate:create` | Generate a migration after changing the schema   |
| `pnpm run generate:types` | Regenerate `payload-types.ts`. CI fails if stale |
| `pnpm run db:up` / `down` | Local Postgres                                   |

## Where to start

- Anything visual → `src/styles/tokens.css`
- How the gallery is structured → `src/lib/gallery.ts`
- The path a stranger writes through → `src/app/(frontend)/submit-memory/route.ts`
- Every component, live → `/design-system`

## Deploying

Railway, from the Dockerfile. Config is code in `.railway/railway.ts` and is
**not** applied on push:

```bash
railway config plan     # read every line
railway config apply
```

`railway.json` is deliberately absent — Railway silently ignores it on newer
services, which means the pre-deploy migration and the health check never run
and the deploy goes green anyway.
