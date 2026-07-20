# Built from the REPO ROOT so the @comfy/config workspace resolves.
#   docker build -f indexer/Dockerfile -t indexer .
# @comfy/config ships as raw TS, so we run through tsx (no compile step).
FROM node:22-slim
WORKDIR /repo
ENV NODE_ENV=production
RUN corepack enable
COPY pnpm-workspace.yaml package.json ./
COPY config ./config
COPY indexer ./indexer
RUN pnpm install --prod --frozen-lockfile=false
USER node
EXPOSE 8080
WORKDIR /repo/indexer
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--import", "tsx", "src/index.ts"]
