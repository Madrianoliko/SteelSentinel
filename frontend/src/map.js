// ============================================================
// STEEL SENTINEL — Map Module (Leaflet.js)
// ============================================================
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { STALOWA_WOLA_CENTER, CATEGORIES, SENSORS, CUAV_ASSETS } from './data.js'
import { showNodeDetail, updateCategoryCount, showCascade } from './ui.js'

let map
const layerGroups = {}
const overlayLayers = { sensors: null, gpsJam: null, sectors: null, cuav: null }

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
  L.circle([50.5700, 22.0450], {
    radius: 2000, color: '#ff9800', fillColor: '#ff9800',
    fillOpacity: 0.08, weight: 1, dashArray: '4 4',
  }).bindTooltip('⚡ Strefa zagłuszania GPS').addTo(g)
  g.addTo(map)
  overlayLayers.gpsJam = g
}

export function toggleSectors(visible) {
  if (overlayLayers.sectors) { map.removeLayer(overlayLayers.sectors); overlayLayers.sectors = null }
  if (!visible) return
  const g = L.layerGroup()
  const sectors = [
    { label: 'A', lat: 50.575, lng: 22.040 },
    { label: 'B', lat: 50.585, lng: 22.052 },
    { label: 'C', lat: 50.593, lng: 22.063 },
    { label: 'D', lat: 50.564, lng: 22.050 },
  ]
  sectors.forEach(s => {
    L.marker([s.lat, s.lng], {
      icon: L.divIcon({ html: `<div class="sector-label">${s.label}</div>`, className: '', iconSize: [60, 60] })
    }).addTo(g)
  })
  g.addTo(map)
  overlayLayers.sectors = g
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
