# Multi-stage production build for AgriMech

# Stage 1: Build Angular Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Node/Express Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies for backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy compiled frontend assets
COPY --from=frontend-builder /app/frontend/dist/agrimech-frontend/browser ./frontend/dist/agrimech-frontend/browser

EXPOSE 5000

CMD ["node", "backend/dist/server.js"]
