    FROM node:18-alpine AS base
    
    FROM base AS deps
    # Install Python and build tools needed for native packages
    RUN apk add --no-cache libc6-compat python3 make g++
    WORKDIR /app
    COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
    RUN \
      if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
      elif [ -f package-lock.json ]; then npm ci; \
      elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
      else echo "Lockfile not found." && exit 1; \
      fi
    
    FROM base AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    RUN yarn build
    
    FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
# Add logging and metrics environment variables
ENV LOG_LEVEL info
ENV SERVICE_NAME comfy-consumer
ENV APP_VERSION 1.0.0
ENV METRICS_PORT 9090

# Install curl for health checks
RUN apk add --no-cache curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Provide runtime deps for metrics-server.js (requires prom-client)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/metrics-server.js ./
COPY --from=builder /app/start.sh ./
RUN chown nextjs:nodejs metrics-server.js start.sh
RUN chmod +x start.sh
USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["./start.sh"]