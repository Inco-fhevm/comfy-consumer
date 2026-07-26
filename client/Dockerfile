FROM node:22-slim AS base
RUN corepack enable
WORKDIR /repo

# deps: install the whole workspace from manifests (cached until a manifest changes)
FROM base AS deps
# Native addons in the web3 stack need a toolchain
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY config/package.json ./config/
COPY indexer/package.json ./indexer/
COPY client/package.json ./client/
COPY packages/sdk/package.json ./packages/sdk/
COPY examples/playground/package.json ./examples/playground/
COPY examples/node/package.json ./examples/node/
RUN pnpm install --frozen-lockfile

# builder: bring deps + source, build the SDK, then the app
FROM base AS builder
COPY --from=deps /repo ./
COPY . .
RUN pnpm --filter @comfy/sdk build
RUN pnpm --filter @comfy/web build

# runner: slim standalone server
FROM base AS runner
ENV NODE_ENV=production
ENV LOG_LEVEL=info
ENV SERVICE_NAME=comfy-consumer
ENV APP_VERSION=1.0.0
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
WORKDIR /app
# Standalone is rooted at the repo (outputFileTracingRoot), so paths keep client/*
COPY --from=builder --chown=nextjs:nodejs /repo/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/client/.next/static ./client/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/client/public ./client/public
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "client/server.js"]
