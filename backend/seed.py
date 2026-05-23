"""
Steel Sentinel — Seed script
Uruchom: python seed.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal, engine, Base
from app.models.infrastructure import InfrastructureNode
from app.models.graph import InfrastructureEdge
from app.models.threat import ThreatEvent

Base.metadata.create_all(bind=engine)

NODES = [
    dict(id=1,  name='HSW S.A. — Huta Stalowa Wola',         category='industrial',     lat=50.5731, lng=22.0442, risk='critical', sector='A',
         description='Główny zakład produkcji sprzętu obronnego. Produkuje armatohaubice Krab, BWP Borsuk.',
         resources={'Zatrudnienie': '3 200 os.', 'Produkcja': 'Operacyjna', 'Ochrona': 'Wojskowa'}),

    dict(id=2,  name='Szpital Powiatowy im. PCK',              category='health',         lat=50.5821, lng=22.0531, risk='critical', sector='B',
         description='Jedyny szpital w mieście. SOR, blok operacyjny, 24h.',
         resources={'Łóżka': '312', 'Rezerwy O2': '18h', 'Rezerwy wody': '24h', 'Generator': '72h'},
         hours_until_critical=72.0),

    dict(id=3,  name='GPZ Stalowa Wola — Stacja 110kV',        category='energy',         lat=50.5780, lng=22.0380, risk='critical', sector='A',
         description='Główny punkt zasilania. Transformator 110/15kV. Zasila 85% odbiorców.',
         resources={'Obciążenie': '68%', 'Rezerwa': '32%', 'UPS': '4h'}),

    dict(id=4,  name='Przepompownia Wody — Centrum',            category='water',          lat=50.5900, lng=22.0610, risk='high',     sector='C',
         description='Główna przepompownia dystrybucji wody. Zasila 70% sieci miejskiej.',
         resources={'Wydajność': '4 200 m³/d', 'Ciśnienie': 'Nominalne', 'Rezerwa bez prądu': '0h'},
         hours_until_critical=0.0),

    dict(id=5,  name='Stacja Uzdatniania Wody — SUW',           category='water',          lat=50.5945, lng=22.0680, risk='high',     sector='C',
         description='Ujęcie i uzdatnianie wody z rzeki San. Zbiorniki buforowe 2×5 000 m³.',
         resources={'Produkcja': '8 000 m³/d', 'Rezerwa zbiornikowa': '30h', 'Chlorowanie': 'Aktywne'},
         hours_until_critical=30.0),

    dict(id=6,  name='Urząd Miasta Stalowa Wola',               category='administration', lat=50.5841, lng=22.0511, risk='medium',   sector='B',
         description='Siedziba władz miejskich. Centrum koordynacji.',
         resources={'Status': 'Aktywny', 'Łączność': 'Radiowa+IP'}),

    dict(id=7,  name='Centrum Zarządzania Kryzysowego',          category='administration', lat=50.5848, lng=22.0522, risk='critical', sector='B',
         description='CZK — centrum operacyjne na czas kryzysu.',
         resources={'Status': 'Gotowość', 'Systemy łączności': '4 kanały', 'UPS': '8h'},
         hours_until_critical=8.0),

    dict(id=8,  name='Komenda Miejska PSP',                      category='rescue',         lat=50.5862, lng=22.0487, risk='high',     sector='B',
         description='Jednostka ratowniczo-gaśnicza. 4 wozy bojowe, CBRN.',
         resources={'Jednostki': '4/4', 'Stan wody': '24 000L', 'CBRN': 'Wyposażona'}),

    dict(id=9,  name='Komenda Miejska Policji',                  category='rescue',         lat=50.5845, lng=22.0530, risk='medium',   sector='B',
         description='KMP Stalowa Wola. Nadzór porządku i koordynacja ewakuacji.',
         resources={'Patrole aktywne': '6', 'Łączność': 'Radio TETRA'}),

    dict(id=10, name='Mast Telekomunikacyjny — ul. Energetyków', category='telecom',        lat=50.5810, lng=22.0555, risk='high',     sector='B',
         description='Główny mast retransmisyjny. 4 operatorzy komórkowi.',
         resources={'Zasięg': '15 km', 'UPS': '6h', 'Łącza radiowe': '8'},
         hours_until_critical=6.0),

    dict(id=11, name='Most drogowy DK77 — rzeka San',            category='transport',      lat=50.5640, lng=22.0420, risk='high',     sector='D',
         description='Jedyna przeprawa przez San na osi N-S. Nośność 60t.',
         resources={'Nośność': '60t', 'Długość': '380m', 'Alternatywa': 'Brak (18 km)'}),

    dict(id=12, name='PKP Stalowa Wola Centrum',                 category='transport',      lat=50.5830, lng=22.0400, risk='medium',   sector='A',
         description='Węzeł kolejowy linia 68. Znaczenie logistyczne.',
         resources={'Linie': '1 (68)', 'Ładowność': '80 wag./d', 'Status': 'Aktywny'}),

    dict(id=13, name='Zbiornik Paliw — HSW Logistyka',           category='chemical',       lat=50.5710, lng=22.0390, risk='high',     sector='A',
         description='Zbiorniki ON i benzyny dla HSW. Pojemność 500 m³.',
         resources={'Pojemność': '500 m³', 'Stan': '67%', 'Klasa zagrożenia': 'I'}),

    dict(id=14, name='Rozdzielnia Gazu — GAZ-SYSTEM',            category='energy',         lat=50.5760, lng=22.0430, risk='high',     sector='A',
         description='Stacja redukcyjno-pomiarowa gazu. Zasila miasto i przemysł.',
         resources={'Przepływ': '12 000 Nm³/h', 'Ciśnienie': '5,5 MPa', 'Odcięcie': 'Zdalne'}),

    dict(id=15, name='Oczyszczalnia Ścieków — Magistrala',       category='water',          lat=50.5650, lng=22.0580, risk='medium',   sector='D',
         description='Mechaniczno-biologiczna oczyszczalnia. Zrzut do rzeki San.',
         resources={'Przepustowość': '18 000 m³/d', 'Status': 'Operacyjna'}),

    dict(id=16, name='Centrum Danych — Urząd Miasta',            category='telecom',        lat=50.5838, lng=22.0508, risk='high',     sector='B',
         description='Serwerownia miejska. Systemy CCTV, rejestry, platforma kryzysowa.',
         resources={'UPS': '4h', 'Klimatyzacja': 'Redundantna', 'Backup': 'Chmura'},
         hours_until_critical=4.0),
]

EDGES = [
    # Energia (GPZ -> wszystko)
    dict(source_id=3,  target_id=1,  dependency_type='energy',    weight=1.0, hours_to_impact=0,  description='Zasilanie zakładu'),
    dict(source_id=3,  target_id=2,  dependency_type='energy',    weight=1.0, hours_to_impact=4,  description='Generator szpitalny 72h'),
    dict(source_id=3,  target_id=4,  dependency_type='energy',    weight=1.0, hours_to_impact=0,  description='Pompy stają bez prądu'),
    dict(source_id=3,  target_id=5,  dependency_type='energy',    weight=1.0, hours_to_impact=0,  description='Uzdatnianie wymaga energii'),
    dict(source_id=3,  target_id=7,  dependency_type='energy',    weight=1.0, hours_to_impact=8,  description='UPS CZK 8h'),
    dict(source_id=3,  target_id=8,  dependency_type='energy',    weight=0.5, hours_to_impact=0,  description='Łączność i sprzęt PSP'),
    dict(source_id=3,  target_id=10, dependency_type='energy',    weight=1.0, hours_to_impact=6,  description='UPS mast 6h'),
    dict(source_id=3,  target_id=16, dependency_type='energy',    weight=1.0, hours_to_impact=4,  description='UPS serwerownia 4h'),
    # Gaz -> Energia
    dict(source_id=14, target_id=3,  dependency_type='fuel',      weight=0.8, hours_to_impact=0,  description='Gaz do agregatów i ogrzewania'),
    # Woda
    dict(source_id=5,  target_id=4,  dependency_type='water',     weight=1.0, hours_to_impact=30, description='Zbiorniki buforowe 30h'),
    dict(source_id=4,  target_id=2,  dependency_type='water',     weight=1.0, hours_to_impact=24, description='Rezerwa szpitalna 24h'),
    dict(source_id=4,  target_id=8,  dependency_type='water',     weight=1.0, hours_to_impact=2,  description='Ciśnienie hydrantów'),
    dict(source_id=4,  target_id=1,  dependency_type='water',     weight=0.7, hours_to_impact=4,  description='Woda technologiczna HSW'),
    # Łączność
    dict(source_id=10, target_id=7,  dependency_type='telecom',   weight=1.0, hours_to_impact=0,  description='Łączność CZK'),
    dict(source_id=7,  target_id=9,  dependency_type='telecom',   weight=1.0, hours_to_impact=0,  description='Koordynacja policji'),
    dict(source_id=7,  target_id=8,  dependency_type='telecom',   weight=0.8, hours_to_impact=0,  description='Łączność radiowa PSP'),
    dict(source_id=16, target_id=6,  dependency_type='telecom',   weight=1.0, hours_to_impact=0,  description='Systemy urzędu miejskiego'),
    dict(source_id=16, target_id=7,  dependency_type='telecom',   weight=1.0, hours_to_impact=0,  description='Platforma kryzysowa'),
    # Transport
    dict(source_id=11, target_id=2,  dependency_type='transport', weight=0.8, hours_to_impact=0,  description='Dostawy leków i personel medyczny'),
    dict(source_id=11, target_id=1,  dependency_type='transport', weight=0.6, hours_to_impact=0,  description='Transport surowców i gotowych produktów'),
    dict(source_id=12, target_id=1,  dependency_type='transport', weight=0.5, hours_to_impact=0,  description='Kolej — dostawy surowców'),
    # Paliwo
    dict(source_id=13, target_id=1,  dependency_type='fuel',      weight=1.0, hours_to_impact=0,  description='Paliwo dla floty i agregatów HSW'),
    dict(source_id=13, target_id=8,  dependency_type='fuel',      weight=0.6, hours_to_impact=48, description='Rezerwa paliwa PSP 48h'),
]


def seed():
    db = SessionLocal()
    try:
        # Clear existing
        db.query(ThreatEvent).delete()
        db.query(InfrastructureEdge).delete()
        db.query(InfrastructureNode).delete()
        db.commit()

        # Insert nodes
        for n in NODES:
            resources = n.pop('resources', {})
            hours = n.pop('hours_until_critical', None)
            node = InfrastructureNode(
                **n,
                resources=resources,
                hours_until_critical=hours,
                is_active=True,
            )
            db.add(node)
        db.commit()
        print(f'✅ Wstawiono {len(NODES)} węzłów infrastruktury')

        # Insert edges
        for e in EDGES:
            db.add(InfrastructureEdge(**e))
        db.commit()
        print(f'✅ Wstawiono {len(EDGES)} krawędzi grafu zależności')

        print('\n🛡️  Baza danych Steel Sentinel gotowa!')

    except Exception as ex:
        db.rollback()
        print(f'❌ Błąd: {ex}')
        raise
    finally:
        db.close()


if __name__ == '__main__':
    seed()
