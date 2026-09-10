# TaskMyScreen backend (public/apps/api-server) — Cloud Run image.
#
# Build context MUST be the monorepo root (not this folder), because this is
# a pnpm workspace and the backend depends on sibling packages
# (@workspace/db, @workspace/api-zod). Build with:
#   docker build -f public/apps/api-server/Dockerfile -t taskmyscreen-api .
# from the repository root.

# ---- Stage 1: install workspace deps + build the backend bundle ----
FROM node:20-bookworm-slim AS build

WORKDIR /repo

# Pinned version, not "pnpm@latest" — a Dockerfile that resolves a different
# pnpm version on every build is not reproducible.
RUN npm install -g pnpm@12

# Copy the whole monorepo (respecting .dockerignore: no node_modules, no
# .git, no dist, no .env). Simpler and more reliable than hand-listing every
# workspace package.json for cache-only purposes — this is a monorepo with a
# handful of small internal packages, so the extra rebuild cost on unrelated
# changes is negligible next to the risk of a stale/incomplete copy list.
COPY . .

RUN pnpm install --frozen-lockfile

# Production build of the backend only (esbuild bundle in dist/, including
# the pino-*.mjs worker-thread files pino needs at runtime).
RUN pnpm --filter @workspace/api-server run build

# Prunes the workspace down to exactly what public/apps/api-server needs at
# runtime (real node_modules, not pnpm's symlinked store) — this is what
# actually resolves the @workspace/* workspace: protocol into something a
# plain `node` process can run, without dragging in devDependencies, esbuild,
# or the frontend's dependency tree.
RUN pnpm --filter @workspace/api-server deploy --prod /prod

# Belt-and-braces: always copy dist/ explicitly rather than trust that the
# deploy step above picked it up (its behavior depends on whether a .git
# directory is present, which it deliberately is not in this build context).
RUN rm -rf /prod/dist && cp -r public/apps/api-server/dist /prod/dist

# ---- Stage 2: minimal runtime, no build tools, no devDependencies ----
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
# Local convenience default only — Cloud Run always injects its own PORT,
# which overrides this.
ENV PORT=8080

WORKDIR /app

# node:20-bookworm-slim ships a built-in unprivileged "node" user (uid 1000).
COPY --from=build --chown=node:node /prod ./

USER node

EXPOSE 8080

# Straight to the production bundle — no pnpm, no Vite, no dev server, no
# process manager. Cloud Run itself supervises the process.
CMD ["node", "--enable-source-maps", "dist/index.mjs"]
