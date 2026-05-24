# ============================================================
# STEEL SENTINEL — Multi-stage Docker build for Railway
# Stage 1: Build Vite frontend → /frontend/dist
# Stage 2: FastAPI backend + static files served by uvicorn
# ============================================================

# ── Stage 1: Node — build frontend ───────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
# Override outDir to local dist/ (vite.config default points to ../backend/static)
RUN npx vite build --outDir dist --emptyOutDir

# ── Stage 2: Python — backend + frontend static ───────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Backend source
COPY backend/ ./

# Frontend build → backend/static (where FastAPI looks for it)
COPY --from=frontend-builder /frontend/dist ./static/

# Startup script
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
