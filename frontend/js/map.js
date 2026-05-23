// ===== STEEL SENTINEL — MAP.JS =====
// Leaflet.js mapa infrastruktury krytycznej Stalowej Woli

const STALOWA_WOLA = [50.5833, 22.0500];

let map, layerGroups = {}, sensorLayer, droneMarker, droneAnimation;

// Dane infrastruktury — do zastąpienia przez API
const INFRASTRUCTURE_DATA = [
  { id: 1, name: "HSW S.A. — Huta Stalowa Wola", category: "industrial", lat: 50.5731, lng: 22.0442, risk: "critical", icon: "🏭", sector: "A", resources: { label: "Produkcja obronna", value: "Operacyjna" } },
  { id: 2, name: "Szpital Powiatowy im. PCK", category: "health", lat: 50.5821, lng: 22.0531, risk: "critical", icon: "🏥", sector: "B", resources: { label: "Zasoby medyczne", value: "78%" } },
  { id: 3, name: "Stacja Elektroenergetyczna GPZ", category: "energy", lat: 50.5780, lng: 22.0380, risk: "high", icon: "⚡", sector: "A", resources: { label: "Obciążenie", value: "65%" } },
  { id: 4, name: "Przepompownia Wody Centralnej", category: "water", lat: 50.5900, lng: 22.0610, risk: "high", icon: "💧", sector: "C", resources: { label: "Ciśnienie sieci", value: "Nominalne" } },
  { id: 5, name: "Urząd Miasta Stalowa Wola", category: "administration", lat: 50.5840, lng: 22.0512, risk: "medium", icon: "🏛️", sector: "B", resources: { label: "Status", value: "Aktywny" } },
  { id: 6, name: "Komenda Miejska PSP", category: "rescue", lat: 50.5860, lng: 22.0490, risk: "high", icon: "🚒", sector: "B", resources: { label: "Jednostki", value: "4/4 gotowych" } },
  { id: 7, name: "Mast Telekomunikacyjny — Centrum", category: "telecom", lat: 50.5810, lng: 22.0550, risk: "high", icon: "📡", sector: "B", resources: { label: "Łączność", value: "100%" } },
  { id: 8, name: "Most drogowy ul. Okulickiego", category: "transport", lat: 50.5760, lng: 22.0480, risk: "medium", icon: "🌉", sector: "A", resources: { label: "Nośność", value: "60t" } },
  { id: 9, name: "Centrum Zarządzania Kryzysowego", category: "administration", lat: 50.5850, lng: 22.0525, risk: "critical", icon: "🎯", sector: "B", resources: { label: "Status", value: "Aktywny" } },
  { id: 10, name: "Stacja Uzdatniania Wody", category: "water", lat: 50.5920, lng: 22.0650, risk: "high", icon: "🚰", sector: "C", resources: { label: "Produkcja", value: "4200 m³/dobę" } },
];

const SENSORS = [
  { lat: 50.5831, lng: 22.0500, radius: 1200, type: "IMINT/Audio" },
  { lat: 50.5731, lng: 22.0442, radius: 900, type: "IMINT" },
  { lat: 50.5900, lng: 22.0610, radius: 800, type: "Audio" },
];

const CATEGORY_LABELS = {
  energy: "Energetyczna",
  water: "Wodociągowa",
  health: "Ochrona zdrowia",
  transport: "Transportowa",
  telecom: "Łączność",
  industrial: "Przemysłowa",
  administration: "Administracja",
  rescue: "Ratownicza",
};

function initMap() {
  map = L.map('map', {
    center: STALOWA_WOLA,
    zoom: 14,
    zoomControl: true,
  });

  // Podkład — ciemny styl
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO',
    maxZoom: 19,
  }).addTo(map);

  // Inicjalizuj warstwy per kategoria
  const categories = ['energy','water','health','transport','telecom','industrial','administration','rescue'];
  categories.forEach(cat => {
    layerGroups[cat] = L.layerGroup().addTo(map);
  });

  sensorLayer = L.layerGroup();

  // Dodaj markery
  INFRASTRUCTURE_DATA.forEach(node => addInfraMarker(node));

  // Filtry checkboxów
  document.querySelectorAll('[data-layer]').forEach(cb => {
    cb.addEventListener('change', () => {
      const layer = cb.dataset.layer;
      if (cb.checked) {
        map.addLayer(layerGroups[layer]);
      } else {
        map.removeLayer(layerGroups[layer]);
      }
    });
  });

  // Toggle sensorów
  document.getElementById('layer-sensors').addEventListener('change', e => {
    if (e.target.checked) {
      addSensors();
      map.addLayer(sensorLayer);
    } else {
      map.removeLayer(sensorLayer);
    }
  });

  // Zegar
  updateClock();
  setInterval(updateClock, 1000);
}

function addInfraMarker(node) {
  const riskClass = `risk-${node.risk}`;
  const icon = L.divIcon({
    html: `<div class="infra-marker ${riskClass}" title="${node.name}">${node.icon}</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const marker = L.marker([node.lat, node.lng], { icon })
    .bindPopup(`
      <div style="color:#0a0e1a">
        <strong>${node.icon} ${node.name}</strong><br>
        <small>Kategoria: ${CATEGORY_LABELS[node.category]}</small><br>
        <small>Sektor: ${node.sector} | Ryzyko: ${node.risk.toUpperCase()}</small><br>
        <small>${node.resources.label}: <b>${node.resources.value}</b></small>
      </div>
    `)
    .on('click', () => showNodeDetail(node));

  marker.nodeData = node;
  layerGroups[node.category].addLayer(marker);
}

function addSensors() {
  sensorLayer.clearLayers();
  SENSORS.forEach(s => {
    L.circle([s.lat, s.lng], {
      radius: s.radius,
      color: '#4fc3f7',
      fillColor: '#4fc3f7',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '4',
    }).bindTooltip(`Sensor ${s.type}`).addTo(sensorLayer);

    L.marker([s.lat, s.lng], {
      icon: L.divIcon({ html: '📷', className: '', iconSize: [20, 20] })
    }).addTo(sensorLayer);
  });
}

function showNodeDetail(node) {
  document.getElementById('node-detail').classList.remove('hidden');
  document.getElementById('node-name').textContent = `${node.icon} ${node.name}`;
  document.getElementById('node-category').textContent = `${CATEGORY_LABELS[node.category]} | Sektor ${node.sector}`;
  document.getElementById('node-resources').innerHTML = `
    <small style="color:#90a4ae">${node.resources.label}: <b style="color:#4fc3f7">${node.resources.value}</b></small>
  `;
  window._selectedNode = node;
}

function showCascade() {
  const node = window._selectedNode;
  if (!node) return;

  // Mock cascade data
  const CASCADE = {
    3: [ // GPZ Stacja
      { name: "🏥 Szpital Powiatowy", hours: 4, reason: "Brak zasilania" },
      { name: "💧 Przepompownia wody", hours: 2, reason: "Brak zasilania pomp" },
      { name: "🎯 Centrum Zarządzania", hours: 1, reason: "Brak łączności" },
      { name: "🚒 Komenda PSP", hours: 6, reason: "Brak łączności radiowej" },
    ],
    4: [ // Przepompownia
      { name: "🏥 Szpital Powiatowy", hours: 6, reason: "Brak wody" },
      { name: "🚒 Komenda PSP", hours: 2, reason: "Brak ciśnienia w hydrantach" },
    ],
  };

  const impacts = CASCADE[node.id] || [
    { name: "Brak znanych zależności bezpośrednich", hours: null, reason: "" }
  ];

  const panel = document.getElementById('cascade-panel');
  const list = document.getElementById('cascade-list');
  list.innerHTML = impacts.map(i => `
    <div class="cascade-item">
      <div>${i.name}</div>
      ${i.hours ? `<div class="impact-time">⏱ Skutek za: ${i.hours}h</div>` : ''}
      <div class="impact-reason">${i.reason}</div>
    </div>
  `).join('');
  panel.classList.remove('hidden');
}

function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`view-${view}`).classList.add('active');
  event.target.classList.add('active');

  if (view === 'graph') initGraph();
}

function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('pl-PL');
}

// Init po załadowaniu
window.addEventListener('load', initMap);
