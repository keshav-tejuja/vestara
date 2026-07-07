# ═══════════════════════════════════════════════════
# STAGE 1: Build React Frontend
# ═══════════════════════════════════════════════════
FROM node:20-alpine AS build-frontend
WORKDIR /app/frontend

# Install dependencies first (for docker layer caching)
COPY frontend/package*.json ./
RUN npm install

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ═══════════════════════════════════════════════════
# STAGE 2: Production Server
# ═══════════════════════════════════════════════════
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Install backend dependencies (production only)
COPY package*.json ./
RUN npm install --production

# Copy backend files
COPY server.js ./
COPY src/ ./src/

# Copy built frontend assets from Stage 1
COPY --from=build-frontend /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 3001

# Run the app
CMD ["node", "server.js"]
