# -- Stage 1: Builder ---------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first to leverage layer caching
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# -- Stage 2: Production ------------------------------------------
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Install only production deps
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev --ignore-scripts

# Copy built output and generated prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create exports directory for PDFs
RUN mkdir -p /app/exports

EXPOSE 5000

# Run migrations + seed + start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
