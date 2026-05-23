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

## Główna funkcjonalność — Ochrona nieba przed dronami

Kluczowym elementem systemu jest **koncepcja aktywnej ochrony przestrzeni powietrznej** nad miastem, oparta na danych i analizie infrastruktury:

### 1. Wyznaczenie najbardziej krytycznych elementów infrastruktury
Na podstawie **analizy grafu zależności** (teoria grafów, centrality, wąskie gardła) system automatycznie wskazuje, które obiekty infrastruktury krytycznej mają największy wpływ kaskadowy — czyli których zniszczenie uderzy w największą liczbę pozostałych węzłów. To właśnie te obiekty stają się priorytetowymi celami do ochrony.

### 2. Wyznaczenie optymalnych miejsc dla sensorów
Na podstawie rozmieszczenia kluczowych obiektów, ukształtowania terenu oraz typowych korytarzy przelotów BSP, system wskazuje optymalne lokalizacje dla:
- **sensorów audio** (wykrywanie dźwięku silników dronów)
- **sensorów IMINT** (kamery, systemy detekcji obiektów — computer vision / object detection)
- **radarów małej i średniej odległości** (wykrywanie BSP i amunicji krążącej)

Rozmieszczenie sensorów minimalizuje martwe strefy i maksymalizuje czas ostrzegania.

### 3. Wyznaczenie optymalnych miejsc dla środków przechwytujących
Na podstawie analizy **potencjalnych kierunków ataku przeciwnika** (analiza geograficzna, osi drogowych i rzecznych, danych OSINT) system proponuje optymalne rozmieszczenie:
- **dronów C-UAS** (Counter-UAS) do zwalczania wrogich BSP
- **wyrzutni rakiet krótkiego zasięgu** (SHORAD / VSHORAD)
- **stref pokrycia** zapewniających ochronę kluczowych obiektów z uwzględnieniem zasięgu i czasu reakcji

System w czasie rzeczywistym dobiera najlepszy dostępny środek przechwytujący dla wykrytego zagrożenia i prezentuje decyzję w formie **Explainable AI** — uzasadniając wybór konkretnymi danymi (zasięg, czas reakcji, prawdopodobieństwo trafienia).

---

## Dodatkowe funkcjonalności

### Mapa infrastruktury krytycznej
- Widok na poziomie kraju, województwa i miasta (podzielonego na sektory)
- Różne podkłady mapowe zależnie od przybliżenia (standardowy, satelitarny, taktyczny)
- **Widok operatorski** — mapa z oznaczonymi obiektami infrastruktury, filtrowanie po kategorii
- **Widok ekspercki** — mapa z naniesionymi krawędziami grafu zależności między obiektami
- **Kolorowanie sektorów** — sektor z wykrytym zagrożeniem oznaczony na czerwono, sektory narażone kaskadowo na żółto
- **Warstwa zagłuszeń GPS** — mapa aktywnych zagłuszeń GPS z podziałem na sektory

### Graf zależności — grafowa baza danych
Obiekty infrastruktury krytycznej zgodnie z Ustawą o zarządzaniu kryzysowym, z atrybutami:
- **Zaopatrzenie w energię**: stacje transformatorowe, linie WN
- **Łączność i sieci teleinformatyczne**: maszty, centra danych, serwerownie
- **Finanse**: oddziały bankowe, centra rozliczeniowe
- **Zaopatrzenie w żywność**: magazyny, hurtownie — stan bieżący vs. norma krajowa vs. wymagania wojewody
- **Zaopatrzenie w wodę**: ujęcia, stacje uzdatniania, przepompownie — stan bieżący, zużycie dobowe, rezerwy
- **Ochrona zdrowia**: szpitale, WSPR — zasoby logistyczne, zużycie dzienne, trasy zaopatrzenia
- **Transport**: drogi, mosty, węzły — nośność, stan techniczny
- **Ratownictwo**: jednostki PSP, pogotowie, zasoby
- **Administracja**: centra zarządzania kryzysowego, urzędy
- **Substancje niebezpieczne**: zbiorniki paliw, rurociągi, zakłady chemiczne

### Scenariusze zagrożeń
- **Tereny zalewowe** — nakładka z obszarami zagrożonymi powodzią (dane IMGW / hydro.imgw.pl)
- **Wariant I** — dywersja i sabotaż (np. przerwanie wałów → zalanie → kaskada)
- **Wariant II** — atak powietrzny BSP / amunicja krążąca / rakiety (pełne demo)
- **Wariant III** — atak lądowy (analiza osi natarcia, blokady, rozmieszczenie)
- **Atak cybernetyczny** — monitoring sieci teleinformatycznych, SLA pentestów

### Analiza wrażliwości i wąskie gardła
- Na podstawie stanu zasobów i tempa zużycia — automatyczne wskazanie obiektów wymagających priorytetowego uzupełnienia
- Analiza grafowa (betweenness centrality) — wyznaczenie wąskich gardeł sieci infrastruktury

### Dostępne technologie ochronne
- Analiza naturalnych barier (rzeki, tereny zalewowe) — propozycja budowy pasów ochronnych
- Mapa głębokości wód — możliwe przeszkody wodne
- Lokalizacja istniejących schronów — propozycja polowych szpitali i punktów medycznych
- Parkingi podziemne galerii — alternatywne schrony dla ludności

### Ostrzeganie, monitorowanie i naprawy
- **Sensory z poziomami alarmowania** — progi ostrzegawcze dla kluczowych parametrów infrastruktury
- **Lista priorytetów napraw** — wyliczana automatycznie na podstawie grafu zależności po zdarzeniu
- **Zarządzanie ewakuacją** — trasy ewakuacji z zachowaniem drożności dla wojska i służb ratunkowych
- **Zagłuszanie GPS** — monitoring stref zagłuszania, ostrzeżenia dla operatorów
- **OSINT** — integracja z otwartymi źródłami danych wywiadowczych
- **IMINT** — sensory z detekcją obiektów (computer vision) w martwych strefach radarów
- **SIGINT** — monitoring sygnałów radiowych
- **HUMINT** — zarządzanie zgłoszeniami od obywateli i służb terenowych
- **Kamienie milowe** — system śledzenia postępu zagrożenia (np. "Przejęli Przemyśl → szacowany czas dotarcia do Stalowej Woli: 4h")
- **Czujki** — sieć czujników wczesnego ostrzegania na obrzeżach miasta
- **Monitoring pentestów** — pilnowanie terminów testów penetracyjnych, rotacji kluczy API, certyfikatów

### Digital Twin
- Symulacja działania całego systemu infrastruktury w czasie rzeczywistym
- **"Zasymuluj następne 24h"** — prognoza kaskadowych skutków przy aktualnym stanie zasobów
- Symulacja scenariuszy przed podjęciem decyzji operacyjnej
- Analiza: przy dużym wietrze → alert o potencjalnym zagrożeniu bronią chemiczną z zakładów przemysłowych

### Aplikacja mobilna dla mieszkańców
- Komunikaty alarmowe i ewakuacyjne (push notifications)
- Zgłoszenia od obywateli — HUMINT z terenu
- Mapa schronów i punktów ewakuacyjnych
- Instrukcje postępowania w różnych scenariuszach zagrożeń

### Explainable AI
- Każda rekomendacja systemu jest uzasadniona konkretnymi danymi
- Przykład: "Rekomendacja: zestrzel dronem Alfa-3 (zasięg: ✓, czas: 38s, p-stwo: 87%) — alternatywa Beta-1 odrzucona (czas: 90s — za wolno)"
- Analiza kaskadowa z wyjaśnieniem: "Powódź w sektorze C → zablokowana DK77 → brak dostaw do szpitala → wyczerpanie rezerw za 30h"

### Pamięć instytucjonalna
- Repozytorium procedur kryzysowych i dokumentów operacyjnych
- Historia zdarzeń i podjętych decyzji
- Baza wiedzy dla nowych operatorów

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
