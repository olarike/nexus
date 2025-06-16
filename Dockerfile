# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install dependencies for UI
WORKDIR /app/packages/ui
RUN npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy the entire monorepo and node_modules from deps stage
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY . .

# Set environment variables
# ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the UI application
WORKDIR /app/packages/ui
# Skip admin page generation during build
# ENV NEXT_PUBLIC_SKIP_ADMIN_PAGE=true
# Set a dummy mint authority key in the correct format (64 comma-separated numbers)
# ENV NEXT_PUBLIC_MINT_AUTHORITY_KEY="0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0"
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1
# Remove the dummy key, it should be provided at runtime in the correct format
# ENV NEXT_PUBLIC_MINT_AUTHORITY_KEY=""

# Create a non-root user
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/packages/ui/public ./public
COPY --from=builder /app/packages/ui/.next/standalone ./
COPY --from=builder /app/packages/ui/.next/static ./.next/static

# Set correct permissions
# RUN chown -R nextjs:nodejs /app

# Switch to non-root user
# USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the hostname to 0.0.0.0 to allow external connections
# ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["npm", "run", "start"] 