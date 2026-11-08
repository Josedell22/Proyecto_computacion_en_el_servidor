FROM node:20-bookworm-slim AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev
COPY backend/ ./backend/
COPY --from=frontend /app/dist ./frontend/dist
WORKDIR /app/backend
EXPOSE 4000
CMD ["sh", "-c", "node src/initDb.js && node src/index.js"]
