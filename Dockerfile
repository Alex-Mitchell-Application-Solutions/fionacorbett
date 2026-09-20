# check=skip=SecretsUsedInArgOrEnv
#
# Multi-stage build for Railway.
#
# Stages: base, deps, build, prod-deps, runtime.
# The point of prod-deps is that no build tooling reaches the final image.

ARG NODE_VERSION=24.20.0
ARG PNPM_VERSION=11.5.2

FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# Manifests before source, so the dependency layer caches across source changes.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ---------------------------------------------------------------------------
# Build arguments.
#
# Anything inlined into the client bundle at build time has to be a build arg as
# well as a runtime variable, or it is baked in as `undefined` and the failure
# shows up in the browser rather than in the build log. This catches people out
# constantly.
# ---------------------------------------------------------------------------
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

# ---------------------------------------------------------------------------
# The build reads the database, and that is deliberate.
#
# Every public page is prerendered and every one of them reads site settings for
# its hero, so `next build` opens a Payload connection and needs both Postgres
# and the secret Payload refuses to start without. The alternative to reading the
# CMS at build time is rendering the public pages dynamically, which would mean
# a database round trip on every visit to a page that changes once a week.
#
# DATABASE_URL here is not the one the container uses, which is why there are
# two. Railway's private network is attached to a running service rather than to
# a builder, so postgres.railway.internal does not resolve during a build — it
# fails with ENOTFOUND rather than a refused connection, which is the tell. The
# build therefore takes the Postgres service's public proxy URL through
# DATABASE_BUILD_URL, and the runtime variable keeps the private address so the
# container's own traffic never leaves Railway's network.
#
# It falls back to DATABASE_URL when DATABASE_BUILD_URL is unset, for the case
# where one URL reaches the database from both places: a local `docker build`,
# and any host with no private network to be outside of.
#
# `docker build --check` objects to both of these as sensitive data in an ARG.
# The objection is silenced at the top of the file rather than dismissed, and
# this is the reasoning. Two things bound it: the runtime stage is a fresh FROM
# and inherits none of it, so the shipped image carries neither value; and a
# build arg is the only channel Railway offers a Dockerfile build, so the
# alternative is not a safer mechanism but a build that cannot read the CMS.
# Do not resolve the warning by deleting these.
# ---------------------------------------------------------------------------
ARG PAYLOAD_SECRET
ARG DATABASE_URL
ARG DATABASE_BUILD_URL
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV DATABASE_URL=${DATABASE_BUILD_URL:-${DATABASE_URL}}

# Migrate before building.
#
# The build reads the database, so the schema has to match the code that is
# about to read it. A migration in this commit that has not been applied means
# `next build` queries a column that does not exist yet, and the build fails
# rather than producing something subtly wrong — which is the good version of
# this failure, but still a failure.
#
# This layer is busted by the `COPY . .` above, so any source change re-runs it
# and a commit carrying a migration always migrates on its first build. What is
# genuinely skipped is a redeploy of an unchanged commit, where the migration has
# already been applied. That residue is what the Railway pre-deploy command
# covers — see .railway/railway.ts.
#
# The constraint this places on migrations: they must be additive. This applies
# the new schema while the previous container is still serving the old code
# against it, so a migration that drops or renames a column breaks the running
# site for the length of the build. Expand and contract, across two deploys.
RUN pnpm run migrate

RUN pnpm run build

# Production dependencies only, installed fresh rather than pruned, so no build
# tooling reaches the final image.
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Run as a non-root user. The node image ships one already.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
# src and the configs are kept so the Payload binary can run migrations as a
# release step. Without them `payload migrate` has no config to load.
COPY --from=build --chown=node:node /app/src ./src
COPY --chown=node:node package.json next.config.ts tsconfig.json ./

USER node
EXPOSE 3000

# Matches the health path declared in .railway/railway.ts. /health rather than
# /api/health, because Payload owns /api/[...slug] and a probe routed through
# the CMS fails for reasons unrelated to the process being alive.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Exec form, so the process is PID 1 and receives SIGTERM directly rather than
# through a shell that would swallow it.
CMD ["node_modules/.bin/next", "start"]
