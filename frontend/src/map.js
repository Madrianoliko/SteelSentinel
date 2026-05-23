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

// ---- Init ----
export function initMap(nodes) {
  map = L.map('map', {
    center: STALOWA_WOLA_CENTER,
    zoom: 14,
    zoomControl: true,
    attributionControl: false,
  })

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map)

  L.control.attribution({ prefix: '© OpenStreetMap · © CARTO' }).addTo(map)

  Object.keys(CATEGORIES).forEach(cat => {
    layerGroups[cat] = L.layerGroup().addTo(map)
  })

  nodes.forEach(addNodeMarker)

  Object.keys(CATEGORIES).forEach(cat => {
    updateCategoryCount(cat, nodes.filter(n => n.category === cat).length)
  })

  return map
}

// ---- Markers ----
function buildNodeIcon(node) {
  const cat = CATEGORIES[node.category]
  return L.divIcon({
    html: `<div class="marker-pin risk-${node.risk}"><span class="pin-icon">${cat?.icon ?? '📍'}</span></div>`,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  })
}

function addNodeMarker(node) {
  const marker = L.marker([node.lat, node.lng], { icon: buildNodeIcon(node) })
    .bindPopup(buildPopup(node))
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
  if (overlayLayers.gpsJam) { map.removeLayer(overlayLayers.gpsJam); overlayLayers.gpsJam = null }
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
// Stalowa Wola podzielona na 4 sektory operacyjne
const SECTOR_DEFS = [
  {
    label: 'A', color: '#90caf9',
    coords: [[50.570, 22.030], [50.585, 22.030], [50.585, 22.050], [50.570, 22.050]],
    center: [50.577, 22.040],
  },
  {
    label: 'B', color: '#90caf9',
    coords: [[50.570, 22.050], [50.595, 22.050], [50.595, 22.065], [50.570, 22.065]],
    center: [50.582, 22.057],
  },
  {
    label: 'C', color: '#90caf9',
    coords: [[50.595, 22.050], [50.615, 22.050], [50.615, 22.075], [50.595, 22.075]],
    center: [50.605, 22.062],
  },
  {
    label: 'D', color: '#90caf9',
    coords: [[50.555, 22.035], [50.570, 22.035], [50.570, 22.070], [50.555, 22.070]],
    center: [50.562, 22.052],
  },
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
  if (overlayLayers.airDefense) { map.removeLayer(overlayLayers.airDefense); overlayLayers.airDefense = null }
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
  if (overlayLayers.flood) { map.removeLayer(overlayLayers.flood); overlayLayers.flood = null }
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

const DRONE1_PATH = [
  [50.5831, 22.1800], [50.5810, 22.1500], [50.5790, 22.1200],
  [50.5770, 22.1000], [50.5750, 22.0800], [50.5740, 22.0600], [50.5731, 22.0442],
]

const DRONE2_PATH = [
  [50.6300, 22.0700], [50.6200, 22.0680], [50.6100, 22.0660],
  [50.5980, 22.0645], [50.5945, 22.0680], [50.5900, 22.0610],
]

function makeDroneIcon(color = '#ef5350') {
  return L.divIcon({
    html: `<div class="drone-icon" style="filter:drop-shadow(0 0 8px ${color})">🚁</div>`,
    className: '', iconSize: [32, 32], iconAnchor: [16, 16],
  })
}

function trackPolyline(polyline) {
  demoPolylines.push(polyline)
  return polyline
}

export function spawnDrone1(onReach) {
  clearDrone1()
  map.flyTo([50.5750, 22.1000], 13, { duration: 0.8 })
  droneMarker1 = L.marker(DRONE1_PATH[0], { icon: makeDroneIcon('#ef5350'), zIndexOffset: 2000 }).addTo(map)

  trackPolyline(
    L.polyline(DRONE1_PATH, { color: '#ef5350', weight: 1.5, dashArray: '6 4', opacity: 0.6 }).addTo(map)
  )

  let i = 0
  droneInterval1 = setInterval(() => {
    i++
    if (i < DRONE1_PATH.length) {
      droneMarker1.setLatLng(DRONE1_PATH[i])
    } else {
      clearInterval(droneInterval1)
      onReach?.()
    }
  }, 400)
}

export function destroyDrone1() {
  if (!droneMarker1) return
  clearInterval(droneInterval1)
  droneMarker1.setIcon(L.divIcon({ html: '<div style="font-size:28px">💥</div>', className: '', iconSize: [32, 32] }))
  setTimeout(() => { if (droneMarker1) { map.removeLayer(droneMarker1); droneMarker1 = null } }, 1500)
}

export function clearDrone1() {
  clearInterval(droneInterval1)
  if (droneMarker1) { map.removeLayer(droneMarker1); droneMarker1 = null }
}

export function spawnDrone2() {
  clearDrone2()
  droneMarker2 = L.marker(DRONE2_PATH[0], { icon: makeDroneIcon('#ff9800'), zIndexOffset: 2000 }).addTo(map)

  trackPolyline(
    L.polyline(DRONE2_PATH, { color: '#ff9800', weight: 1.5, dashArray: '6 4', opacity: 0.6 }).addTo(map)
  )

  map.flyTo([50.6100, 22.0660], 13, { duration: 1 })

  let i = 0
  droneInterval2 = setInterval(() => {
    i++
    if (i < DRONE2_PATH.length) {
      droneMarker2.setLatLng(DRONE2_PATH[i])
    } else {
      clearInterval(droneInterval2)
    }
  }, 500)
}

export function impactDrone2() {
  clearInterval(droneInterval2)
  if (droneMarker2) {
    droneMarker2.setIcon(L.divIcon({ html: '<div style="font-size:32px">💥</div>', className: '', iconSize: [36, 36] }))
    setTimeout(() => { if (droneMarker2) { map.removeLayer(droneMarker2); droneMarker2 = null } }, 1500)
  }

  markNodeDestroyed(4)

  impactCircle = L.circle([50.5900, 22.0610], {
    radius: 500, color: '#ef5350', fillColor: '#ef5350', fillOpacity: 0.2, weight: 2,
  }).bindTooltip('🔴 SEKTOR C — UDERZENIE').addTo(map)
  demoPolylines.push(impactCircle)

  map.flyTo([50.5900, 22.0610], 15, { duration: 1 })
}

export function clearDrone2() {
  clearInterval(droneInterval2)
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

// ---- Helpers ----
function riskBg(r) {
  return { low: 'rgba(0,230,118,0.15)', medium: 'rgba(255,167,38,0.15)', high: 'rgba(255,87,34,0.15)', critical: 'rgba(239,83,80,0.2)' }[r] ?? ''
}
function riskColor(r) {
  return { low: '#00e676', medium: '#ffa726', high: '#ff5722', critical: '#ef5350' }[r] ?? '#fff'
}
