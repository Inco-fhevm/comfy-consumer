    FROM node:22-alpine AS base
    
    FROM base AS deps
    # Install Python and build tools needed for native packages
    RUN apk add --no-cache libc6-compat python3 make g++
    WORKDIR /app
    COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
    RUN \
      if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
      elif [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
      elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
      else echo "Lockfile not found." && exit 1; \
      fi
    
    FROM base AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    RUN npm run build
    
    FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
# Logging defaults (Winston)
ENV LOG_LEVEL info
ENV SERVICE_NAME comfy-consumer
ENV APP_VERSION 1.0.0

# Install curl for health checks
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]