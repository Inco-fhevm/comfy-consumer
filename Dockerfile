FROM oven/bun:1-alpine AS base

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 nextjs

# Copy application files (built during CI)
# Use more explicit paths for Docker context
COPY --chown=nextjs:bunjs ./public ./public
COPY --chown=nextjs:bunjs ./.next/standalone ./
COPY --chown=nextjs:bunjs ./.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["bun", "server.js"]