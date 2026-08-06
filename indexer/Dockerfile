# Built from the REPO ROOT so the @comfy/config workspace resolves.
#   docker build -f indexer/Dockerfile -t indexer .
# @comfy/config ships raw TS; Ponder compiles it at boot, so there is no build step.
FROM node:22-slim
WORKDIR /repo
ENV NODE_ENV=production
# Activate the pinned pnpm at BUILD time. Without `prepare`, corepack downloads
# it on first run, which delays every container start.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY pnpm-workspace.yaml package.json ./
COPY config ./config
COPY indexer ./indexer
RUN pnpm install --prod --frozen-lockfile=false
# `ponder start` runs codegen and rewrites indexer/ponder-env.d.ts, so the
# runtime user needs to own that dir — COPY lands everything as root. Scoped to
# indexer/ on purpose: chown -R on /repo would duplicate the node_modules layer.
RUN chown -R node:node /repo/indexer
USER node
WORKDIR /repo/indexer
# Ponder does NOT read $PORT (it defaults to 42069), so the start script passes
# it explicitly — Railway/Fly assign the port at runtime.
EXPOSE 8080
# /health is up as soon as the server is; /ready only goes 200 after the
# historical backfill finishes, which would fail a deploy mid-sync.
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["pnpm", "start"]
