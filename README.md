# 🛡️ Steel Sentinel — System Ochrony Infrastruktury Krytycznej

> **SpaceShield Hack 2026** | Kategoria: DEFENCE  
> Stalowa Wola, 23–24 maja 2026

---

## Czym jest Steel Sentinel?

**Steel Sentinel** to zintegrowany system analizy i ochrony infrastruktury krytycznej miasta średniej wielkości, zaprojektowany z myślą o nowoczesnych zagrożeniach powietrznych (drony, amunicja krążąca, rakiety) oraz zagrożeniach hybrydowych (dywersja, sabotaż, cyberatak).

System łączy:
- **interaktywną mapę infrastruktury krytycznej** Stalowej Woli z widokiem operatorskim i eksperckim
- **grafową bazę zależności** między obiektami (co pada, gdy pada co)
- **silnik kaskadowej analizy zagrożeń** (teoria grafów / wąskie gardła)
- **moduł rekomendacji AI** (Explainable AI — system tłumaczy swoje decyzje)
- **symulację scenariuszy** (Wariant I: dywersja, Wariant II: atak powietrzny, Wariant III: atak lądowy)
- **powiadomienia dla mieszkańców** (aplikacja mobilna / push)

---

## Architektura systemu

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│   Leaflet.js (mapa) + vis.js (graf zależności)      │
│   Widok Operatorski | Widok Ekspercki               │
└────────────────────┬────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────┐
│                   BACKEND                           │
│              Python + FastAPI                       │
│   /infrastructure  /graph  /threats  /scenarios     │
└────────────────────┬────────────────────────────────┘
                     │ SQLAlchemy
┌────────────────────▼────────────────────────────────┐
│                  DATABASE                           │
│              PostgreSQL                             │
│   nodes (infrastruktura) + edges (zależności)       │
└─────────────────────────────────────────────────────┘
```

---

## Struktura projektu

```
SteelSentinel/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── database.py          # SQLAlchemy + PostgreSQL connection
│   │   ├── models/
│   │   │   ├── infrastructure.py  # Model węzłów infrastruktury
│   │   │   ├── graph.py           # Model krawędzi zależności
│   │   │   └── threat.py          # Model scenariuszy zagrożeń
│   │   └── routers/
│   │       ├── infrastructure.py  # GET /infrastructure
│   │       ├── graph.py           # GET /graph
│   │       ├── threats.py         # POST /simulate
│   │       └── scenarios.py       # GET /scenarios
│   ├── alembic/                 # Migracje bazy danych
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── index.html               # Główna aplikacja
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── map.js               # Leaflet.js — mapa i warstwy
│       ├── graph.js             # vis.js — graf zależności
│       ├── demo.js              # Keyboard triggers dla scenariusza demo
│       └── api.js               # Komunikacja z backendem
├── data/
│   └── seed/
│       ├── infrastructure.json  # Dane infrastruktury Stalowej Woli
│       └── edges.json           # Zależności między obiektami
├── docs/
│   └── architecture.md
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Kategorie infrastruktury krytycznej

Zgodnie z Ustawą o zarządzaniu kryzysowym (Dz.U. 2007 nr 89 poz. 590):

| Kategoria | Przykłady w Stalowej Woli |
|-----------|--------------------------|
| Energetyczna | Stacje transformatorowe, linie wysokiego napięcia |
| Wodociągowa | Ujęcia wody, przepompownie, sieć wodociągowa |
| Łączność | Maszty telekomunikacyjne, centra danych |
| Transportowa | Drogi krajowe, mosty, węzły drogowe |
| Ochrona zdrowia | Szpital Powiatowy, WSPR |
| Administracja | Urząd Miasta, komendy służb |
| Przemysłowa | HSW S.A. (produkcja obronna) |
| Chemiczna | Zbiorniki paliw, rurociągi |

---

## Scenariusze zagrożeń

### Wariant I — Dywersja i sabotaż
Grupy dywersyjne mogą uszkodzić wały przeciwpowodziowe, powodując kaskadowe zalanie infrastruktury.

### Wariant II — Atak powietrzny (DEMO)
Drony / amunicja krążąca atakuje kluczowe obiekty infrastruktury.  
System wykrywa zagrożenie, rekomenduje środki zaradcze i symuluje kaskadowe skutki uderzenia.

### Wariant III — Atak lądowy
Analiza tras podejścia, blokady, rozmieszczenia sił.

---

## Demo — Keyboard Triggers

Podczas demonstracji wideo używamy skrótów klawiszowych do wyzwalania kolejnych kroków scenariusza:

| Klawisz | Akcja |
|---------|-------|
| `1` | Wykrycie drona #1 (pojawia się na mapie, leci po trasie) |
| `2` | Rekomendacja AI (popup z przyciskiem Zestrzel) |
| `3` | Zestrzelenie drona #1 (animacja sukcesu) |
| `4` | Wykrycie drona #2 (drugi cel) |
| `5` | Brak zasobów (komunikat + przycisk Ewakuuj) |
| `6` | Uderzenie + kaskada skutków (sektor czerwony, lista zniszczeń) |
| `R` | Reset scenariusza |

---

## Szybki start

### Wymagania
- Python 3.11+
- PostgreSQL 15+
- Node.js (opcjonalnie, do live-reload frontendu)
- Docker + Docker Compose (zalecane)

### Uruchomienie przez Docker (zalecane)

```bash
git clone https://github.com/Madrianoliko/SteelSentinel.git
cd SteelSentinel
cp backend/.env.example backend/.env
docker-compose up -d
```

Aplikacja dostępna pod: http://localhost:8000  
Frontend pod: http://localhost:3000  
Swagger API: http://localhost:8000/docs

### Uruchomienie manualne

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # uzupełnij dane PostgreSQL
uvicorn app.main:app --reload

# Frontend
# Otwórz frontend/index.html w przeglądarce
# lub użyj live-server: npx live-server frontend/
```

---

## Źródła danych

| Źródło | Opis | Link |
|--------|------|------|
| OpenStreetMap | Podkład mapowy, sieć drogowa | https://www.openstreetmap.org |
| BDOT10k | Baza Danych Obiektów Topograficznych | https://www.geoportal.gov.pl |
| dane.gov.pl | Otwarte dane publiczne RP | https://dane.gov.pl |
| GUGiK | Ortofotomapa, NMT | https://www.geoportal.gov.pl |
| RCB | Rządowe Centrum Bezpieczeństwa — mapy zagrożeń | https://rcb.gov.pl |
| IMGW | Dane hydrologiczne, zagrożenia powodziowe | https://hydro.imgw.pl |
| Stalowa Wola BIP | Dane infrastruktury miejskiej | https://bip.stalowawola.pl |

---

## Technologie

| Warstwa | Technologia |
|---------|-------------|
| Frontend — mapa | Leaflet.js |
| Frontend — graf | vis.js |
| Backend | Python 3.11 + FastAPI |
| ORM | SQLAlchemy 2.0 + Alembic |
| Baza danych | PostgreSQL 15 |
| Konteneryzacja | Docker + Docker Compose |
| Licencja | MIT (Open Source — wymaganie regulaminu) |

---

## Licencja

MIT License — projekt Open Source zgodnie z wymaganiami regulaminu SpaceShield Hack 2026.

---

*Projekt stworzony podczas hackathonu SpaceShield Hack 2026 w ramach projektu SPACE 4 TALENTS, Stalowa Wola.*
