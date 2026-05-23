.PHONY: install dev build seed up down logs reset

# ── Instalacja zależności frontendowych ──────────────────────────────────────
install:
	cd frontend && npm install

# ── Dev: baza danych w Docker + backend lokalnie + frontend Vite (dev server) ─
dev:
	@echo "▶ Startowanie bazy danych..."
	docker compose up -d db
	@echo "▶ Czekam na gotowość PostgreSQL..."
	@until docker compose exec db pg_isready -U postgres -d steelsentinel > /dev/null 2>&1; do sleep 1; done
	@echo "▶ Uruchamiam backend..."
	cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
	@echo "▶ Uruchamiam frontend (Vite)..."
	cd frontend && npm run dev

# ── Produkcja: wszystko w Dockerze ───────────────────────────────────────────
up:
	cd frontend && npm run build
	docker compose up --build -d
	@echo ""
	@echo "✅ Steel Sentinel działa na http://localhost:8000"
	@echo "   API docs: http://localhost:8000/docs"

# ── Seed bazy danych ─────────────────────────────────────────────────────────
seed:
	cd backend && python seed.py

# ── Zatrzymaj kontenery ───────────────────────────────────────────────────────
down:
	docker compose down

# ── Logi backendu ─────────────────────────────────────────────────────────────
logs:
	docker compose logs -f backend

# ── Reset — usuń bazę i zacznij od nowa ──────────────────────────────────────
reset:
	docker compose down -v
	docker compose up -d db
	@until docker compose exec db pg_isready -U postgres -d steelsentinel > /dev/null 2>&1; do sleep 1; done
	cd backend && python seed.py
	@echo "✅ Baza danych zresetowana i zasilona danymi"
