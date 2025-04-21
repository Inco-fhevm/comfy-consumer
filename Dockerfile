FROM node:18-alpine AS base

# Set build argument for GitHub authentication
ARG GITHUB_TOKEN

# Install dependencies
FROM base AS deps
WORKDIR /app

# Create .npmrc file with GitHub authentication
RUN mkdir -p /root && \
    echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" > /root/.npmrc && \
    echo "@inco-fhevm:registry=https://npm.pkg.github.com/" >> /root/.npmrc

# Copy package files and install
COPY package.json package-lock.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]