FROM node:20-alpine AS builder
WORKDIR /app
# Install Python and other build dependencies
RUN apk add --no-cache python3 make g++ jq
# Create a symlink for python
RUN ln -sf /usr/bin/python3 /usr/bin/python
# Set environment variables for node-gyp
ENV PYTHON=/usr/bin/python
# Copy package files
COPY package.json package-lock.json* ./
# Remove problematic dependencies
RUN cp package.json package.json.backup && \
    cat package.json | jq 'del(.dependencies."@inco-fhevm/js")' > package.json.tmp && \
    mv package.json.tmp package.json
# Install dependencies with minimal options
RUN npm install --omit=optional --no-audit
# Copy rest of the app
COPY . .
# Fix styled-jsx issue specifically
RUN npm install styled-jsx@5.1.6
# Build the app
RUN npm run build
# --- Runner Stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
# Copy from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]