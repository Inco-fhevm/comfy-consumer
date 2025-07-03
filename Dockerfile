FROM node:20-alpine AS builder

WORKDIR /app

# :hammer_and_spanner: Install build tools and Python for native modules
RUN apk add --no-cache python3 make g++ jq

# :jigsaw: Symlink python3 → python (required by node-gyp)
RUN ln -sf /usr/bin/python3 /usr/bin/python

# :brain: Let node-gyp know where Python is
ENV PYTHON=/usr/bin/python

# :package: Copy package files
COPY package.json package-lock.json* ./

# :rocket: Install dependencies (including dev dependencies for flexibility)
RUN npm install --no-audit

# :file_folder: Copy the full project source
COPY . .

# :plaster: Fix styled-jsx issue (explicitly add compatible version)
RUN npm install styled-jsx@5.1.6

# :package: Build the Next.js app (for all environments)
# NODE_ENV will be set at runtime for the runner stage
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# :seedling: Default to production, but can be overridden at runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# :silhouette: Create a non-root user for security
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# :open_file_folder: Copy only necessary files from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Add environment configuration files for all environments
COPY --from=builder /app/.env* ./

# Install Sharp for image optimization
RUN npm install --no-optional sharp

# :silhouette: Switch to non-root user
USER nextjs

# :satellite_antenna: Expose port 3000
EXPOSE 3000

# :checkered_flag: Start the app with environment-specific settings
CMD ["node", "server.js"]