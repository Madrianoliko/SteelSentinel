// ============================================================
// STEEL SENTINEL — Map Module (Leaflet.js)
// ============================================================
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { STALOWA_WOLA_CENTER, CATEGORIES, SENSORS, CUAV_ASSETS, AIR_DEFENSE_SENSORS, AIR_DEFENSE_EFFECTORS } from './data.js'
import { GPS_JAM_HEXES } from './gpsJamData.js'
import { showNodeDetail, updateCategoryCount, showCascade } from './ui.js'

let map
const layerGroups = {}
const overlayLayers = { sensors: null, gpsJam: null, sectors: null, cuav: null, flood: null, airDefense: null }

// Sector polygon state (for dynamic coloring)
const sectorPolygons = {}  // label → L.polygon

// Śledź markery i polylines do resetu
const nodeMarkers = {}      // nodeId → marker
const demoPolylines = []    // wszystkie linie drona

// ---- Basemap config ----
const BASE_LAYERS = {
  carto: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    opts: { maxZoom: 19, subdomains: ['a', 'b', 'c', 'd'] },
    filter: 'none',
  },
  dark: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    opts: { maxZoom: 19, subdomains: ['a', 'b', 'c'] },
    filter: 'invert(1) hue-rotate(200deg) brightness(0.85) saturate(0.4)',
  },
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    opts: { maxZoom: 19, subdomains: ['a', 'b', 'c'] },
    filter: 'none',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    opts: { maxZoom: 19 },
    filter: 'none',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    opts: { maxZoom: 17, subdomains: ['a', 'b', 'c'] },
    filter: 'invert(1) hue-rotate(200deg) brightness(0.8) saturate(0.3)',
  },
}

let currentBaseLayer = null
let currentBaseKey   = 'dark'

export function setBaseLayer(key) {
  const cfg = BASE_LAYERS[key]
  if (!cfg || !map) return
  if (currentBaseLayer) map.removeLayer(currentBaseLayer)
  currentBaseLayer = L.tileLayer(cfg.url, cfg.opts).addTo(map)
  // Push it below all overlay layers
  currentBaseLayer.setZIndex(0)
  // Apply CSS filter on the tile pane
  const pane = document.querySelector('.leaflet-tile-pane')
  if (pane) pane.style.filter = cfg.filter
  currentBaseKey = key
  // Update active button
  document.querySelectorAll('.basemap-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.basemap === key)
  })
}

// ---- Init ----
export function initMap(nodes) {
  map = L.map('map', {
    center: STALOWA_WOLA_CENTER,
    zoom: 14,
    zoomControl: true,
    attributionControl: false,
  })

  // Dark tactical basemap: OSM tiles + CSS invert/hue-rotate (reliable, no CDN dependency)
  currentBaseLayer = L.tileLayer(BASE_LAYERS.dark.url, BASE_LAYERS.dark.opts).addTo(map)

  L.control.attribution({ prefix: '© OpenStreetMap contributors' }).addTo(map)

  Object.keys(CATEGORIES).forEach(cat => {
    layerGroups[cat] = L.layerGroup().addTo(map)
  })

  nodes.forEach(addNodeMarker)

  return map
}

// Call this after initCategoryFilters() so DOM count elements exist
export function updateAllCategoryCounts(nodes) {
  Object.keys(CATEGORIES).forEach(cat => {
    updateCategoryCount(cat, nodes.filter(n => n.category === cat).length)
  })
}

// ---- Markers ----
// Category → ring color (matches CATEGORIES colors in data.js)
const CAT_COLORS = {
  energy:         '#ffeb3b',
  water:          '#4fc3f7',
  health:         '#f48fb1',
  transport:      '#a5d6a7',
  telecom:        '#ce93d8',
  industrial:     '#ef9a9a',
  administration: '#90caf9',
  rescue:         '#ffcc80',
  chemical:       '#ff8a65',
  food:           '#c5e1a5',
  education:      '#ffe082',
}

function buildNodeIcon(node) {
  const cat = CATEGORIES[node.category]
  const color = CAT_COLORS[node.category] ?? '#90caf9'
  const isCritical  = node.risk === 'critical'
  const isHigh      = node.risk === 'high'
  const borderWidth = isCritical ? '2.5px' : '2px'
  const riskClass   = `risk-${node.risk}`
  return L.divIcon({
    html: `<div class="node-badge ${riskClass}" style="--cat-color:${color};border-width:${borderWidth};">`
          + `<span class="node-icon">${cat?.icon ?? '📍'}</span></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

function addNodeMarker(node) {
  const marker = L.marker([node.lat, node.lng], { icon: buildNodeIcon(node) })
    .on('click', () => {
      showNodeDetail(node)
      setupCascadeBtn(node)
    })

  if (layerGroups[node.category]) {
    layerGroups[node.category].addLayer(marker)
  }

  marker._nodeId = node.id
  marker._node = node
  nodeMarkers[node.id] = marker
  return marker
}

function buildPopup(node) {
  const cat = CATEGORIES[node.category]
  return `
    <div style="min-width:180px">
      <div style="font-weight:700;font-size:13px;margin-bottom:4px">${cat?.icon ?? ''} ${node.name}</div>
      <div style="color:#5a7499;font-size:11px;margin-bottom:6px">${cat?.label} · Sektor ${node.sector}</div>
      <div style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;
           background:${riskBg(node.risk)};color:${riskColor(node.risk)};margin-bottom:6px">
        ${node.risk.toUpperCase()}
      </div>
      <div style="font-size:11px;color:#8aa0be">${node.description ?? ''}</div>
    </div>
  `
}

// ---- Category Toggle ----
export function toggleCategory(category, visible) {
  if (!layerGroups[category]) return
  if (visible) map.addLayer(layerGroups[category])
  else map.removeLayer(layerGroups[category])
}

// ---- Overlay Layers ----
export function toggleSensors(visible) {
  if (overlayLayers.sensors) { map.removeLayer(overlayLayers.sensors); overlayLayers.sensors = null }
  if (!visible) return
  const g = L.layerGroup()
  SENSORS.forEach(s => {
    L.circle([s.lat, s.lng], {
      radius: s.radius, color: '#4fc3f7', fillColor: '#4fc3f7',
      fillOpacity: 0.06, weight: 1, dashArray: '6 4',
    }).bindTooltip(`📷 ${s.label} (${s.type})`).addTo(g)
    L.marker([s.lat, s.lng], {
      icon: L.divIcon({ html: '<span class="sensor-icon">📷</span>', className: '', iconSize: [20, 20] })
    }).addTo(g)
  })
  g.addTo(map)
  overlayLayers.sensors = g
}

export function toggleGpsJam(visible) {
  if (overlayLayers.gpsJam) {
    try { overlayLayers.gpsJam._legend?.remove() } catch {}
    map.removeLayer(overlayLayers.gpsJam); overlayLayers.gpsJam = null
  }
  if (!visible) return

  const g = L.layerGroup()

  const COLORS = {
    high:   { stroke: '#ef5350', fill: '#ef5350', opacity: 0.55, fillOpacity: 0.35 },
    medium: { stroke: '#ffeb3b', fill: '#ffeb3b', opacity: 0.45, fillOpacity: 0.22 },
    low:    { stroke: '#00e676', fill: '#00e676', opacity: 0.30, fillOpacity: 0.10 },
  }

  const LABELS = { high: '🔴 Wysokie', medium: '🟡 Średnie', low: '🟢 Niskie' }

  GPS_JAM_HEXES.forEach(hex => {
    const c = COLORS[hex.l]
    if (!c) return
    const pct = Math.round(hex.r * 100)
    L.polygon(hex.c, {
      color:       c.stroke,
      fillColor:   c.fill,
      weight:      0.5,
      opacity:     c.opacity,
      fillOpacity: c.fillOpacity,
    }).bindTooltip(
      `🛰️ Zakłócenia GPS: <b>${LABELS[hex.l]}</b> (${pct}%)<br>` +
      `<small>Zakłócone: ${hex.b} / ${hex.t} samolotów · gpsjam.org</small>`,
      { sticky: true }
    ).addTo(g)
  })

  // Legend control
  const legend = L.control({ position: 'topright' })
  legend.onAdd = () => {
    const div = L.DomUtil.create('div')
    div.style.cssText = `
      background:rgba(13,21,38,0.92);border:1px solid #1e3a5f;border-radius:6px;
      padding:10px 14px;color:#e8edf5;font-size:11px;line-height:2;pointer-events:none;
    `
    div.innerHTML = `
      <b style="color:#ff9800;font-size:12px">🛰️ Zagłuszanie GPS</b><br>
      <span style="display:inline-block;width:10px;height:10px;background:#ef5350;border-radius:2px;margin-right:6px;opacity:0.9"></span>Wysokie (&gt;10%)<br>
      <span style="display:inline-block;width:10px;height:10px;background:#ffeb3b;border-radius:2px;margin-right:6px;opacity:0.9"></span>Średnie (2–10%)<br>
      <span style="display:inline-block;width:10px;height:10px;background:#00e676;border-radius:2px;margin-right:6px;opacity:0.9"></span>Niskie (&lt;2%)<br>
      <span style="color:var(--text-muted);font-size:10px">Źródło: gpsjam.org · adsbexchange.com</span>
    `
    return div
  }
  legend.addTo(map)
  g._legend = legend

  g.addTo(map)
  overlayLayers.gpsJam = g

  // Cleanup legend on layer remove
  const origRemove = g.remove.bind(g)
  g.remove = () => { try { legend.remove() } catch {} origRemove() }
}

// ── SECTOR POLYGONS ──────────────────────────────────────────────────────────
// Powiat stalowowolski — siatka 3×4 = 12 sektorów operacyjnych
// Granice: N 50.725 · S 50.400 · W 21.920 · E 22.300
// Wiersze (N→S): A-C / D-F / G-I / J-L
// Kolumny (W→E): lewa / środkowa / prawa
const _R = [50.725, 50.644, 50.562, 50.481, 50.400]  // lat row boundaries N→S
const _C = [21.920, 22.047, 22.173, 22.300]           // lng col boundaries W→E

function _sec(label, row, col, color) {
  const n = _R[row], s = _R[row + 1]
  const w = _C[col], e = _C[col + 1]
  return {
    label, color,
    coords: [[n, w], [n, e], [s, e], [s, w]],
    center: [(n + s) / 2, (w + e) / 2],
  }
}

const SECTOR_DEFS = [
  // Row 1 — north (Zaklków / Rudnik nad Sanem)
  _sec('A', 0, 0, '#80cbc4'),  // NW — Zaklków west
  _sec('B', 0, 1, '#80cbc4'),  // N  — Zaklków east
  _sec('C', 0, 2, '#80cbc4'),  // NE — Rudnik nad Sanem north

  // Row 2 — Stalowa Wola / San river area
  _sec('D', 1, 0, '#90caf9'),  // W  — HSW / Stalowa Wola west  ← demo
  _sec('E', 1, 1, '#90caf9'),  // C  — Stalowa Wola / Rozwadów  ← demo cascade
  _sec('F', 1, 2, '#90caf9'),  // E  — Pysznica / San east       ← demo threat 2

  // Row 3 — south Stalowa Wola / north Nisko
  _sec('G', 2, 0, '#ce93d8'),  // SW — Pniów area
  _sec('H', 2, 1, '#ce93d8'),  // S  — Nisko north               ← demo cascade
  _sec('I', 2, 2, '#ce93d8'),  // SE — Nisko northeast

  // Row 4 — south (Nisko / south powiat)
  _sec('J', 3, 0, '#ffcc80'),  // far SW
  _sec('K', 3, 1, '#ffcc80'),  // far S — Nisko center
  _sec('L', 3, 2, '#ffcc80'),  // far SE
]

export function toggleSectors(visible) {
  // Remove old layers but keep polygon references
  if (overlayLayers.sectors) { map.removeLayer(overlayLayers.sectors); overlayLayers.sectors = null }
  Object.values(sectorPolygons).forEach(p => { try { map.removeLayer(p) } catch {} })
  Object.keys(sectorPolygons).forEach(k => delete sectorPolygons[k])
  if (!visible) return

  const g = L.layerGroup()

  SECTOR_DEFS.forEach(s => {
    const poly = L.polygon(s.coords, {
      color: s.color, fillColor: s.color,
      fillOpacity: 0.06, weight: 1.5, dashArray: '6 3',
    }).bindTooltip(`Sektor ${s.label}`, { permanent: false })
    poly.addTo(g)
    sectorPolygons[s.label] = poly

    L.marker(s.center, {
      icon: L.divIcon({
        html: `<div class="sector-label">${s.label}</div>`,
        className: '', iconSize: [60, 60],
      })
    }).addTo(g)
  })

  g.addTo(map)
  overlayLayers.sectors = g
}

// Call from demo.js to highlight a sector
export function colorSector(label, status) {
  // status: 'threat' | 'cascade' | 'clear'
  const poly = sectorPolygons[label]
  if (!poly) return
  const cfg = {
    threat:  { color: '#ef5350', fillColor: '#ef5350', fillOpacity: 0.22, weight: 2.5 },
    cascade: { color: '#ff9800', fillColor: '#ff9800', fillOpacity: 0.14, weight: 1.5 },
    clear:   { color: '#90caf9', fillColor: '#90caf9', fillOpacity: 0.06, weight: 1.5 },
  }
  const c = cfg[status] ?? cfg.clear
  poly.setStyle(c)
  if (status === 'threat') {
    poly.bindTooltip(`🔴 Sektor ${label} — ZAGROŻENIE`, { permanent: true, className: 'sector-threat-tooltip' })
    poly.openTooltip()
  } else if (status === 'cascade') {
    poly.bindTooltip(`🟡 Sektor ${label} — narażony kaskadowo`, { permanent: true, className: 'sector-cascade-tooltip' })
    poly.openTooltip()
  } else {
    poly.unbindTooltip()
    poly.bindTooltip(`Sektor ${label}`)
  }
}

export function toggleCuav(visible) {
  if (overlayLayers.cuav) { map.removeLayer(overlayLayers.cuav); overlayLayers.cuav = null }
  if (!visible) return
  const g = L.layerGroup()
  CUAV_ASSETS.forEach(a => {
    L.circle([a.lat, a.lng], {
      radius: a.range, color: a.available ? '#00e676' : '#ef5350',
      fillColor: a.available ? '#00e676' : '#ef5350',
      fillOpacity: 0.05, weight: 1, dashArray: '4 4',
    }).bindTooltip(`🚁 ${a.label} — ${a.available ? 'DOSTĘPNY' : 'NIEDOSTĘPNY'}`).addTo(g)
    L.marker([a.lat, a.lng], {
      icon: L.divIcon({
        html: `<span style="font-size:18px;filter:drop-shadow(0 0 4px ${a.available ? '#00e676' : '#ef5350'})">🚁</span>`,
        className: '', iconSize: [24, 24]
      })
    }).addTo(g)
  })
  g.addTo(map)
  overlayLayers.cuav = g
}

// ── AIR DEFENSE LAYER ────────────────────────────────────────────────────────
export function toggleAirDefense(visible) {
  if (overlayLayers.airDefense) {
    try { overlayLayers.airDefense._legend?.remove() } catch {}
    map.removeLayer(overlayLayers.airDefense); overlayLayers.airDefense = null
  }
  if (!visible) return

  const g = L.layerGroup()

  // ─ Sensor coverage & markers ─
  const SENSOR_CFG = {
    radar:  { color: '#4fc3f7', label: 'Radar dozorowania',   pulse: true  },
    audio:  { color: '#ce93d8', label: 'Sensor audio',        pulse: false },
    imint:  { color: '#fff176', label: 'Kamera EO/IR',        pulse: false },
    rf:     { color: '#80cbc4', label: 'Detektor RF',         pulse: false },
  }

  AIR_DEFENSE_SENSORS.forEach(s => {
    const cfg = SENSOR_CFG[s.type]

    // Coverage circle
    L.circle([s.lat, s.lng], {
      radius: s.radius,
      color: cfg.color,
      fillColor: cfg.color,
      fillOpacity: s.type === 'radar' ? 0.04 : 0.08,
      weight: 1,
      dashArray: s.type === 'radar' ? null : '5 4',
    }).addTo(g)

    // Directional FOV arc for IMINT cameras
    if (s.fov && s.fov < 360 && s.bearing !== undefined) {
      const arc = _buildArc(s.lat, s.lng, s.radius, s.bearing - s.fov / 2, s.bearing + s.fov / 2)
      L.polygon(arc, {
        color: cfg.color, fillColor: cfg.color,
        fillOpacity: 0.18, weight: 1,
      }).addTo(g)
    }

    // Sensor icon marker
    const pulseHtml = cfg.pulse
      ? `animation:pulse-sensor 2s infinite;box-shadow:0 0 0 0 ${cfg.color}88;`
      : ''
    L.marker([s.lat, s.lng], {
      icon: L.divIcon({
        html: `<div style="
          width:28px;height:28px;border-radius:50%;
          background:rgba(13,21,38,0.85);
          border:2px solid ${cfg.color};
          display:flex;align-items:center;justify-content:center;
          font-size:13px;${pulseHtml}
        ">${s.icon}</div>`,
        className: '', iconSize: [28, 28], iconAnchor: [14, 14],
      }),
      zIndexOffset: 500,
    }).bindTooltip(`<b>${s.label}</b><br><span style="color:#8aa0be;font-size:11px">${s.desc}</span>`, {
      maxWidth: 240,
    }).addTo(g)
  })

  // ─ Effector coverage & markers ─
  const EFFECTOR_CFG = {
    vshorad:       { color: '#ef5350', dash: null,    label: 'VSHORAD' },
    shorad:        { color: '#ff7043', dash: null,    label: 'SHORAD'  },
    cuas_operator: { color: '#00e676', dash: '6 3',   label: 'C-UAS'   },
  }

  AIR_DEFENSE_EFFECTORS.forEach(e => {
    const cfg = EFFECTOR_CFG[e.type]
    const activeColor = e.available ? cfg.color : '#546e7a'
    const activeFill  = e.available ? 0.07 : 0.03

    // Kill-zone circle
    L.circle([e.lat, e.lng], {
      radius: e.range,
      color: activeColor,
      fillColor: activeColor,
      fillOpacity: activeFill,
      weight: e.available ? 1.5 : 1,
      dashArray: cfg.dash,
    }).addTo(g)

    // Status badge
    const statusColor = e.available ? '#00e676' : '#ef5350'
    const statusLabel = e.available ? 'AKTYWNY' : 'NIEDOSTĘPNY'
    const glow = e.available ? `filter:drop-shadow(0 0 6px ${activeColor});` : ''

    L.marker([e.lat, e.lng], {
      icon: L.divIcon({
        html: `<div style="position:relative;${glow}">
          <div style="
            width:34px;height:34px;border-radius:4px;
            background:rgba(13,21,38,0.9);
            border:2px solid ${activeColor};
            display:flex;align-items:center;justify-content:center;
            font-size:18px;
          ">${e.icon}</div>
          <div style="
            position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);
            background:${statusColor};color:#000;
            font-size:8px;font-weight:800;padding:1px 4px;border-radius:2px;
            white-space:nowrap;letter-spacing:0.5px;
          ">${statusLabel}</div>
        </div>`,
        className: '', iconSize: [34, 48], iconAnchor: [17, 17],
      }),
      zIndexOffset: 1000,
    }).bindTooltip(`
      <b>${e.label}</b><br>
      <span style="color:${statusColor};font-weight:700">${statusLabel}</span><br>
      <span style="color:#8aa0be;font-size:11px">${e.desc}</span><br>
      <span style="color:#5a7499;font-size:10px">Zasięg: ${(e.range/1000).toFixed(1)} km</span>
    `, { maxWidth: 260 }).addTo(g)
  })

  // ─ Legend ─
  const legend = L.control({ position: 'bottomright' })
  legend.onAdd = () => {
    const div = L.DomUtil.create('div')
    div.style.cssText = `
      background:rgba(13,21,38,0.92);border:1px solid #1e3a5f;border-radius:6px;
      padding:10px 14px;color:#e8edf5;font-size:11px;line-height:1.9;pointer-events:none;margin-bottom:8px;
    `
    div.innerHTML = `
      <b style="color:#90caf9;font-size:12px">⚔️ Ochrona powietrzna</b><br>
      <span style="color:#4fc3f7">📡</span> Radar dozorowania<br>
      <span style="color:#ce93d8">🎙️</span> Sensor audio (matryca)<br>
      <span style="color:#fff176">📷</span> Kamera EO/IR (AI)<br>
      <span style="color:#80cbc4">📻</span> Detektor RF<br>
      <span style="color:#ef5350">🚀</span> VSHORAD / SHORAD<br>
      <span style="color:#00e676">🚁</span> Operator C-UAS<br>
    `
    return div
  }
  legend.addTo(map)

  g._legend = legend
  const origRemove = g.remove.bind(g)
  g.remove = () => { try { legend.remove() } catch {} origRemove() }

  g.addTo(map)
  overlayLayers.airDefense = g
}

// Helper: build FOV arc polygon [lat, lng]
function _buildArc(lat, lng, radius, startDeg, endDeg) {
  const R = 6371000
  const pts = [[lat, lng]]
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const angle = ((startDeg + (endDeg - startDeg) * i / steps) * Math.PI) / 180
    const dLat = (radius * Math.cos(angle)) / R
    const dLng = (radius * Math.sin(angle)) / (R * Math.cos((lat * Math.PI) / 180))
    pts.push([lat + (dLat * 180) / Math.PI, lng + (dLng * 180) / Math.PI])
  }
  return pts
}

// ── FLOOD ZONES ─────────────────────────────────────────────────────────────
// Tereny zalewowe rzeki San — Stalowa Wola i okolice
// Źródło: IMGW ISOK, plany zarządzania ryzykiem powodziowym RZGW Rzeszów
// Q10 = 10-letni, Q100 = 100-letni, Q500 = 500-letni okres powtarzalności
const FLOOD_ZONES = {
  q500: {
    label: 'Zagrożenie powodziowe Q500 (raz na 500 lat)',
    color: '#4fc3f7',
    fillOpacity: 0.18,
    polygons: [
      // San — odcinek koło Stalowej Woli, szeroka dolina zalewowa
      [[50.620, 22.000], [50.615, 22.010], [50.600, 22.010], [50.585, 22.020],
       [50.570, 22.018], [50.558, 22.025], [50.550, 22.030], [50.548, 22.045],
       [50.552, 22.055], [50.560, 22.060], [50.568, 22.055], [50.575, 22.045],
       [50.580, 22.035], [50.590, 22.028], [50.600, 22.025], [50.610, 22.012],
       [50.618, 22.005]],
      // Dolina Sanu — Nisko/Pysznica
      [[50.530, 22.030], [50.535, 22.038], [50.542, 22.040], [50.548, 22.035],
       [50.545, 22.025], [50.538, 22.022], [50.532, 22.025]],
    ],
  },
  q100: {
    label: 'Zagrożenie powodziowe Q100 (raz na 100 lat)',
    color: '#2196f3',
    fillOpacity: 0.22,
    polygons: [
      // Węższy pas — Q100 bliżej koryta Sanu
      [[50.610, 22.008], [50.600, 22.012], [50.590, 22.015], [50.580, 22.022],
       [50.572, 22.020], [50.562, 22.028], [50.558, 22.038], [50.562, 22.050],
       [50.568, 22.048], [50.574, 22.038], [50.582, 22.028], [50.592, 22.020],
       [50.602, 22.018], [50.610, 22.012]],
      // Tereny zalewowe przy ujściu Sanu — Sandomierz kierunek
      [[50.540, 22.028], [50.545, 22.035], [50.548, 22.032], [50.544, 22.024]],
    ],
  },
  q10: {
    label: 'Zagrożenie powodziowe Q10 (raz na 10 lat)',
    color: '#1565c0',
    fillOpacity: 0.30,
    polygons: [
      // Bezpośrednie koryto Sanu z wąskim pasem zalewowym
      [[50.605, 22.010], [50.598, 22.014], [50.590, 22.017], [50.582, 22.024],
       [50.575, 22.023], [50.566, 22.030], [50.562, 22.040], [50.565, 22.047],
       [50.570, 22.043], [50.575, 22.032], [50.584, 22.026], [50.592, 22.022],
       [50.600, 22.018], [50.606, 22.014]],
    ],
  },
  river: {
    label: 'Rzeka San — koryto główne',
    color: '#29b6f6',
    fillOpacity: 0.55,
    polygons: [
      // Koryto Sanu ~200-300m szerokości
      [[50.612, 22.008], [50.604, 22.012], [50.596, 22.016], [50.588, 22.022],
       [50.578, 22.023], [50.568, 22.028], [50.563, 22.037], [50.565, 22.044],
       [50.567, 22.042], [50.565, 22.035], [50.570, 22.027], [50.579, 22.022],
       [50.589, 22.020], [50.597, 22.015], [50.605, 22.011], [50.612, 22.009]],
    ],
  },
}

export function toggleFlood(visible) {
  if (overlayLayers.flood) {
    try { overlayLayers.flood._floodLegend?.remove() } catch {}
    map.removeLayer(overlayLayers.flood); overlayLayers.flood = null
  }
  if (!visible) return

  const g = L.layerGroup()

  // Draw Q500 → Q100 → Q10 → river (outermost to innermost)
  ;['q500', 'q100', 'q10', 'river'].forEach(key => {
    const zone = FLOOD_ZONES[key]
    zone.polygons.forEach(coords => {
      L.polygon(coords, {
        color: zone.color,
        fillColor: zone.color,
        fillOpacity: zone.fillOpacity,
        weight: key === 'river' ? 0 : 1,
        dashArray: key === 'q500' ? '6 4' : (key === 'q100' ? '4 3' : null),
      }).bindTooltip(zone.label, { sticky: true }).addTo(g)
    })
  })

  // Legend
  const legend = L.control({ position: 'bottomleft' })
  legend.onAdd = () => {
    const div = L.DomUtil.create('div', 'flood-legend')
    div.style.cssText = `
      background:rgba(13,21,38,0.92);border:1px solid #1e3a5f;
      border-radius:6px;padding:10px 14px;color:#e8edf5;font-size:11px;
      line-height:1.8;pointer-events:none;
    `
    div.innerHTML = `
      <b style="color:#4fc3f7;font-size:12px">🌊 Tereny zalewowe — San</b><br>
      <span style="display:inline-block;width:10px;height:10px;background:#1565c0;border-radius:2px;margin-right:6px;opacity:0.8"></span>Q10 — raz na 10 lat<br>
      <span style="display:inline-block;width:10px;height:10px;background:#2196f3;border-radius:2px;margin-right:6px;opacity:0.8"></span>Q100 — raz na 100 lat<br>
      <span style="display:inline-block;width:10px;height:10px;background:#4fc3f7;border-radius:2px;margin-right:6px;opacity:0.8"></span>Q500 — raz na 500 lat<br>
      <span style="color:var(--text-muted);font-size:10px">Źródło: IMGW ISOK · RZGW Rzeszów</span>
    `
    return div
  }
  legend.addTo(map)

  // Store legend reference for removal
  g._floodLegend = legend
  const origRemove = g.remove.bind(g)
  g.remove = () => { legend.remove(); origRemove() }

  g.addTo(map)
  overlayLayers.flood = g
}

// ---- Cascade Button — wywołuje prawdziwe API ----
function setupCascadeBtn(node) {
  document.getElementById('btn-cascade').onclick = async () => {
    try {
      const res = await fetch(`/api/infrastructure/${node.id}/cascade`)
      if (res.ok) {
        const data = await res.json()
        const catIcons = {
          energy: '⚡', water: '💧', health: '🏥', transport: '🌉',
          telecom: '📡', industrial: '🏭', administration: '🏛️',
          rescue: '🚒', chemical: '🛢️', food: '🏪',
        }
        const items = data.cascade.length
          ? data.cascade.map(c => ({
              icon: catIcons[c.category] ?? '📍',
              name: c.name,
              hours: c.hours_to_impact,
              reason: c.reason,
            }))
          : [{ name: 'Brak bezpośrednich zależności krytycznych', hours: null, reason: '' }]
        showCascade(items)
      } else {
        throw new Error('API error')
      }
    } catch {
      // Fallback — mock dane
      const cascades = {
        3: [
          { icon: '🏥', name: 'Szpital Powiatowy',        hours: 4,  reason: 'Brak zasilania (generator 72h)' },
          { icon: '💧', name: 'Przepompownia Wody',        hours: 0,  reason: 'Pompy stają natychmiast' },
          { icon: '🎯', name: 'Centrum Zarządz. Kryz.',    hours: 8,  reason: 'UPS 8h' },
          { icon: '📡', name: 'Mast Telekomunikacyjny',    hours: 6,  reason: 'UPS 6h' },
          { icon: '🚒', name: 'Komenda PSP',               hours: 0,  reason: 'Brak łączności' },
        ],
        4: [
          { icon: '🏥', name: 'Szpital Powiatowy',  hours: 24, reason: 'Wyczerpanie rezerwy wody' },
          { icon: '🚒', name: 'Komenda PSP',        hours: 2,  reason: 'Brak ciśnienia w hydrantach' },
          { icon: '🏭', name: 'HSW S.A.',           hours: 4,  reason: 'Brak wody technologicznej' },
        ],
        5: [
          { icon: '💧', name: 'Przepompownia Wody', hours: 30, reason: 'Zbiorniki buforowe 30h' },
          { icon: '🏥', name: 'Szpital Powiatowy',  hours: 54, reason: 'Kaskada od przepompowni' },
        ],
        11: [
          { icon: '🏥', name: 'Szpital Powiatowy',  hours: 0, reason: 'Odcięcie dostaw leków i personelu' },
          { icon: '🚒', name: 'Komenda PSP',        hours: 0, reason: 'Wozy bojowe nie dotrą na południe' },
          { icon: '🏭', name: 'HSW S.A.',           hours: 0, reason: 'Odcięcie od dostaw surowców' },
        ],
      }
      const items = cascades[node.id] ?? [{ name: 'Brak bezpośrednich zależności', hours: null, reason: '' }]
      showCascade(items)
    }
  }
}

// ---- Demo Helpers ----
let droneMarker1 = null, droneMarker2 = null
let droneInterval1 = null, droneInterval2 = null
let impactCircle = null
let parkedHeliMarker = null  // Alfa-3 stacjonuje w miejscu przechwycenia

// Dron #1: Pysznica (wschód) → Błonia Nadsańskie (detekcja) → HSW (cel)
const DRONE1_PATH = [
  [50.5815, 22.2300],  // start: wschód, Pysznica
  [50.5808, 22.2000],  // zbliżanie
  [50.5800, 22.1700],  // przekracza San
  [50.5793, 22.1400],  // wchodzi w Błonia Nadsańskie ← audio-east wykrywa
  [50.5787, 22.1150],  // środek Błoni ← kamera IMINT-East potwierdza
  [50.5778, 22.0950],  // koniec Błoni
  [50.5765, 22.0750],  // wlot do zabudowy
  [50.5748, 22.0560],  // strefa HSW
  [50.5731, 22.0442],  // cel: HSW S.A.
]

// Indeks punktu gdzie dron jest "wykryty" — Błonia Nadsańskie
const DRONE1_DETECT_IDX = 4

const DRONE2_PATH = [
  [50.6300, 22.0700],  // 0 — start: północ (Nisko)
  [50.6200, 22.0680],  // 1
  [50.6100, 22.0660],  // 2
  [50.5980, 22.0645],  // 3 ← wykrycie: sensor audio Brandwica
  [50.5920, 22.0640],  // 4
  [50.5860, 22.0600],  // 5
  [50.5800, 22.0570],  // 6
  [50.5748, 22.0620],  // 7 — cel: Elektrociepłownia SW
]
// Indeks punktu gdzie dron #2 jest wykryty przez sensor audio (Brandwica)
const DRONE2_DETECT_IDX = 3

function makeDroneIcon(color = '#ef5350') {
  return L.divIcon({
    html: `<div class="drone-icon" style="filter:drop-shadow(0 0 8px ${color})">🚁</div>`,
    className: '', iconSize: [32, 32], iconAnchor: [16, 16],
  })
}

function makeRadarBlipIcon() {
  return L.divIcon({
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:#ef5350;
      box-shadow:0 0 0 3px rgba(239,83,80,0.3),0 0 12px rgba(239,83,80,0.8);
      animation:pulse-critical 1s ease-in-out infinite;
    "></div>`,
    className: '', iconSize: [14, 14], iconAnchor: [7, 7],
  })
}

function makeIdentifiedDroneIcon() {
  return L.divIcon({
    html: `<img src="/dronkrok1.png" style="width:38px;height:38px;object-fit:contain;filter:drop-shadow(0 0 8px #ef5350) drop-shadow(0 0 4px rgba(239,83,80,0.6));animation:drone-bob 0.7s ease-in-out infinite alternate;" />`,
    className: '', iconSize: [38, 38], iconAnchor: [19, 19],
  })
}

function trackPolyline(polyline) {
  demoPolylines.push(polyline)
  return polyline
}

export function spawnDrone1(onDetect) {
  clearDrone1()

  droneMarker1 = L.marker(DRONE1_PATH[0], { icon: makeRadarBlipIcon(), zIndexOffset: 2000 }).addTo(map)

  // Ślad drona — rośnie na bieżąco wraz z lotem (zaczyna od punktu startowego)
  const droneTrail = L.polyline([DRONE1_PATH[0]], {
    color: '#ff9800', weight: 1.5, dashArray: '6 4', opacity: 0.55,
  }).addTo(map)
  trackPolyline(droneTrail)

  // Dron leci wzdłuż ścieżki do punktu detekcji — dokładnie 20 sekund
  const DURATION = 20000
  const segments = DRONE1_DETECT_IDX   // 4 odcinki
  const startTime = performance.now()
  let rafId1 = null

  function animateDrone(now) {
    const t = Math.min((now - startTime) / DURATION, 1)

    // Interpolacja wzdłuż segmentów ścieżki
    const segT    = t * segments
    const segIdx  = Math.min(Math.floor(segT), segments - 1)
    const segFrac = segT - segIdx
    const a = DRONE1_PATH[segIdx]
    const b = DRONE1_PATH[segIdx + 1]
    const pos = [
      a[0] + (b[0] - a[0]) * segFrac,
      a[1] + (b[1] - a[1]) * segFrac,
    ]
    if (droneMarker1) droneMarker1.setLatLng(pos)
    droneTrail.addLatLng(pos)

    if (t < 1) {
      rafId1 = requestAnimationFrame(animateDrone)
    } else {
      // Dron stanął w punkcie detekcji — zmień ikonę: radar blip → zidentyfikowany Shahed
      const detPt = DRONE1_PATH[DRONE1_DETECT_IDX]
      if (droneMarker1) {
        droneMarker1.setLatLng(detPt)
        droneMarker1.setIcon(makeIdentifiedDroneIcon())
      }
      rafId1 = null
      if (onDetect) onDetect()
    }
  }

  rafId1 = requestAnimationFrame(animateDrone)

  // Zapisz id do ewentualnego anulowania
  droneInterval1 = { cancel: () => { if (rafId1) cancelAnimationFrame(rafId1) } }
}

export function destroyDrone1(onComplete) {
  if (!droneMarker1) return

  // Dron startuje z punktu detekcji (gdzie stanął w spawnDrone1)
  const detPt  = DRONE1_PATH[DRONE1_DETECT_IDX]   // [50.5787, 22.1150]
  const hswPt  = DRONE1_PATH[DRONE1_PATH.length - 1] // [50.5731, 22.0442] — cel HSW

  // Punkt przechwycenia — w połowie trasy detekcja→HSW
  const interceptPt = [
    (detPt[0] + hswPt[0]) / 2,
    (detPt[1] + hswPt[1]) / 2,
  ]

  // Predykcja trasy — pojawia się dopiero po kliknięciu "Zestrzel"
  trackPolyline(
    L.polyline(DRONE1_PATH.slice(DRONE1_DETECT_IDX), {
      color: '#ef5350', weight: 1.5, dashArray: '4 6', opacity: 0.4,
    }).bindTooltip('⚠️ Predykcja trasy → HSW S.A.', { sticky: true }).addTo(map)
  )

  // Baza Alfa-3 (C-UAS operator)
  const alfaBase = [50.5831, 22.0510]

  // Przybliż mapę tak, żeby widać było całą akcję
  map.flyTo([
    (alfaBase[0] + interceptPt[0]) / 2,
    (alfaBase[1] + interceptPt[1] + detPt[1]) / 3,
  ], 13, { duration: 0.8 })

  // Helikopter Alfa-3
  const heliIcon = L.divIcon({
    html: `<img src="/dronkrok3.png" style="width:36px;height:36px;object-fit:contain;filter:drop-shadow(0 0 6px #00e676);animation:drone-bob 0.4s ease-in-out infinite alternate;" />`,
    className: '', iconSize: [36, 36], iconAnchor: [18, 18],
  })
  const heliMarker = L.marker(alfaBase, { icon: heliIcon, zIndexOffset: 3000 }).addTo(map)
  demoPolylines.push(heliMarker)

  // Ślad helikoptera
  const heliTrail = L.polyline([alfaBase], {
    color: '#00e676', weight: 1.5, dashArray: '4 4', opacity: 0.6,
  }).addTo(map)
  demoPolylines.push(heliTrail)

  // ── Animacja 10 sekund — oba obiekty lecą do punktu przechwycenia ──
  const DURATION = 10000
  const startTime = performance.now()

  function lerp(a, b, t) { return a + (b - a) * t }

  function animate(now) {
    const t = Math.min((now - startTime) / DURATION, 1)

    // Dron: punkt detekcji → punkt przechwycenia
    if (droneMarker1) {
      droneMarker1.setLatLng([
        lerp(detPt[0], interceptPt[0], t),
        lerp(detPt[1], interceptPt[1], t),
      ])
    }

    // Helikopter: baza → punkt przechwycenia
    const heliLat = lerp(alfaBase[0], interceptPt[0], t)
    const heliLng = lerp(alfaBase[1], interceptPt[1], t)
    heliMarker.setLatLng([heliLat, heliLng])
    heliTrail.addLatLng([heliLat, heliLng])

    if (t < 1) {
      requestAnimationFrame(animate)
      return
    }

    // ── t=1: przechwycenie! ──
    map.flyTo(interceptPt, 15, { duration: 0.6 })

    if (droneMarker1) {
      droneMarker1.setIcon(L.divIcon({
        html: '<div style="font-size:36px">💥</div>',
        className: '', iconSize: [40, 40], iconAnchor: [20, 20],
      }))
      setTimeout(() => {
        if (droneMarker1) { map.removeLayer(droneMarker1); droneMarker1 = null }
        if (onComplete) onComplete()
      }, 1600)
    }

    // Helikopter zostaje w miejscu przechwycenia jako PATROL
    setTimeout(() => {
      heliMarker.setIcon(L.divIcon({
        html: `<img src="/dronkrok3.png" style="width:32px;height:32px;object-fit:contain;filter:drop-shadow(0 0 5px #00e676);animation:drone-bob 1.2s ease-in-out infinite alternate;" />
               <div style="font-size:9px;font-weight:700;letter-spacing:0.5px;
                 background:rgba(0,230,118,0.15);color:#00e676;
                 border:1px solid #00e676;border-radius:3px;
                 padding:1px 5px;margin-top:2px;white-space:nowrap;text-align:center">PATROL</div>`,
        className: '', iconSize: [44, 38], iconAnchor: [22, 14],
      }))
      parkedHeliMarker = heliMarker
    }, 1800)
  }

  requestAnimationFrame(animate)
}

export function clearDrone1() {
  if (droneInterval1?.cancel) droneInterval1.cancel()
  else clearInterval(droneInterval1)
  droneInterval1 = null
  if (droneMarker1) { map.removeLayer(droneMarker1); droneMarker1 = null }
}

export function spawnDrone2(onDetect) {
  clearDrone2()

  droneMarker2 = L.marker(DRONE2_PATH[0], { icon: makeRadarBlipIcon(), zIndexOffset: 2000 }).addTo(map)

  // Ślad rośnie na bieżąco
  const droneTrail2 = L.polyline([DRONE2_PATH[0]], {
    color: '#ff9800', weight: 1.5, dashArray: '6 4', opacity: 0.55,
  }).addTo(map)
  trackPolyline(droneTrail2)

  const DURATION = 15000   // 15 sekund do punktu detekcji
  const segments = DRONE2_DETECT_IDX
  const startTime = performance.now()
  let rafId2 = null

  function animateDrone2(now) {
    const t = Math.min((now - startTime) / DURATION, 1)

    const segT    = t * segments
    const segIdx  = Math.min(Math.floor(segT), segments - 1)
    const segFrac = segT - segIdx
    const a = DRONE2_PATH[segIdx]
    const b = DRONE2_PATH[segIdx + 1]
    const pos = [
      a[0] + (b[0] - a[0]) * segFrac,
      a[1] + (b[1] - a[1]) * segFrac,
    ]
    if (droneMarker2) droneMarker2.setLatLng(pos)
    droneTrail2.addLatLng(pos)

    if (t < 1) {
      rafId2 = requestAnimationFrame(animateDrone2)
    } else {
      // Dron wykryty — zmień ikonę na zidentyfikowany
      const detPt = DRONE2_PATH[DRONE2_DETECT_IDX]
      if (droneMarker2) {
        droneMarker2.setLatLng(detPt)
        droneMarker2.setIcon(L.divIcon({
          html: `<img src="/dronkrok4.png" style="width:38px;height:38px;object-fit:contain;filter:drop-shadow(0 0 8px #ff9800) drop-shadow(0 0 4px rgba(255,152,0,0.6));animation:drone-bob 0.7s ease-in-out infinite alternate;" />`,
          className: '', iconSize: [38, 38], iconAnchor: [19, 19],
        }))
      }
      rafId2 = null
      if (onDetect) onDetect()
    }
  }

  rafId2 = requestAnimationFrame(animateDrone2)
  droneInterval2 = { cancel: () => { if (rafId2) cancelAnimationFrame(rafId2) } }
}

export function impactDrone2(onImpact) {
  if (droneInterval2?.cancel) droneInterval2.cancel()
  else clearInterval(droneInterval2)
  droneInterval2 = null

  if (!droneMarker2) return

  // Dron leci od punktu detekcji do celu
  const remainingPath = DRONE2_PATH.slice(DRONE2_DETECT_IDX)
  const segments = remainingPath.length - 1
  const targetPt = remainingPath[remainingPath.length - 1]

  // Kontynuuj rysowanie śladu
  const impactTrail = L.polyline([remainingPath[0]], {
    color: '#ef5350', weight: 2, dashArray: '5 3', opacity: 0.7,
  }).addTo(map)
  demoPolylines.push(impactTrail)

  // Przybliż kamerę żeby widać było lot
  map.flyTo([
    (remainingPath[0][0] + targetPt[0]) / 2,
    (remainingPath[0][1] + targetPt[1]) / 2,
  ], 14, { duration: 0.8 })

  const DURATION = 8000  // 8 sekund lotu do celu
  const startTime = performance.now()
  let rafId = null

  function animate(now) {
    const t = Math.min((now - startTime) / DURATION, 1)

    const segT    = t * segments
    const segIdx  = Math.min(Math.floor(segT), segments - 1)
    const segFrac = segT - segIdx
    const a = remainingPath[segIdx]
    const b = remainingPath[segIdx + 1]
    const pos = [
      a[0] + (b[0] - a[0]) * segFrac,
      a[1] + (b[1] - a[1]) * segFrac,
    ]
    if (droneMarker2) droneMarker2.setLatLng(pos)
    impactTrail.addLatLng(pos)

    if (t < 1) {
      rafId = requestAnimationFrame(animate)
      return
    }

    // ── Uderzenie! ──
    map.flyTo(targetPt, 15, { duration: 0.6 })

    if (droneMarker2) {
      droneMarker2.setIcon(L.divIcon({
        html: '<div style="font-size:36px">💥</div>',
        className: '', iconSize: [40, 40], iconAnchor: [20, 20],
      }))
      setTimeout(() => {
        if (droneMarker2) { map.removeLayer(droneMarker2); droneMarker2 = null }
      }, 1500)
    }

    // Czerwone kółko uderzenia
    impactCircle = L.circle(targetPt, {
      radius: 400, color: '#ef5350', fillColor: '#ef5350', fillOpacity: 0.45, weight: 2.5,
    }).bindTooltip('🔴 UDERZENIE — Elektrociepłownia SW', { permanent: true }).addTo(map)
    demoPolylines.push(impactCircle)

    markNodeDestroyed(4)

    if (onImpact) setTimeout(onImpact, 2000)
  }

  rafId = requestAnimationFrame(animate)
}

export function clearDrone2() {
  if (droneInterval2?.cancel) droneInterval2.cancel()
  else clearInterval(droneInterval2)
  droneInterval2 = null
  if (droneMarker2) { map.removeLayer(droneMarker2); droneMarker2 = null }
}

function markNodeDestroyed(nodeId) {
  const marker = nodeMarkers[nodeId]
  if (!marker) return
  marker.setIcon(L.divIcon({
    html: `<div class="marker-pin risk-destroyed"><span class="pin-icon">💀</span></div>`,
    className: '', iconSize: [34, 34], iconAnchor: [17, 34],
  }))
}

export function resetMap() {
  clearDrone1()
  clearDrone2()

  // Usuń parkującego helikoptera
  if (parkedHeliMarker) { try { map.removeLayer(parkedHeliMarker) } catch {} parkedHeliMarker = null }

  // Usuń wszystkie linie i kręgi z demo
  demoPolylines.forEach(p => { try { map.removeLayer(p) } catch {} })
  demoPolylines.length = 0
  impactCircle = null

  // Przywróć oryginalne ikony węzłów
  Object.values(nodeMarkers).forEach(marker => {
    if (marker._node) {
      marker.setIcon(buildNodeIcon(marker._node))
    }
  })

  // Resetuj kolory sektorów
  Object.keys(sectorPolygons).forEach(label => colorSector(label, 'clear'))

  map.flyTo(STALOWA_WOLA_CENTER, 14, { duration: 0.8 })
}

export function getMap() { return map }

export function centerMapOn(lat, lng) {
  if (map) map.panTo([lat, lng], { animate: true, duration: 0.6 })
}

// ---- Helpers ----
function riskBg(r) {
  return { low: 'rgba(0,230,118,0.15)', medium: 'rgba(255,167,38,0.15)', high: 'rgba(255,87,34,0.15)', critical: 'rgba(239,83,80,0.2)' }[r] ?? ''
}
function riskColor(r) {
  return { low: '#00e676', medium: '#ffa726', high: '#ff5722', critical: '#ef5350' }[r] ?? '#fff'
}
