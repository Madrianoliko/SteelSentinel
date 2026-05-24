// ============================================================
// STEEL SENTINEL — Main Entry Point
// ============================================================
import './style.css'
import { fetchInfrastructure } from './api.js'
import { initMap, updateAllCategoryCounts, toggleCategory, toggleSensors, toggleGpsJam, toggleSectors, toggleCuav, toggleFlood, toggleAirDefense, setBaseLayer } from './map.js'
import { initGraph, renderBottlenecks, setGraphMode } from './graph.js'
import { runDemoStep } from './demo.js'
import { initThreatsView } from './threats.js'
import {
  startClock, initNav, initCategoryFilters, initFilterToggle,
  initDemoPanel, initCascadeClose, showNodeDetail
} from './ui.js'
import { CATEGORIES } from './data.js'

async function main() {
  startClock()

  // Load infrastructure data (API or fallback)
  const nodes = await fetchInfrastructure()

  // Init map
  initMap(nodes)

  // Filter bar toggle (hamburger button)
  initFilterToggle()

  // Category filters — must run before updateAllCategoryCounts so DOM elements exist
  initCategoryFilters(CATEGORIES, (category, visible) => toggleCategory(category, visible))
  updateAllCategoryCounts(nodes)

  // Basemap selector
  document.querySelectorAll('.basemap-btn').forEach(btn => {
    btn.addEventListener('click', () => setBaseLayer(btn.dataset.basemap))
  })

  // Layer toggles
  document.getElementById('toggle-sensors').addEventListener('change', e => toggleSensors(e.target.checked))
  document.getElementById('toggle-gps-jam').addEventListener('change', e => toggleGpsJam(e.target.checked))
  document.getElementById('toggle-sectors').addEventListener('change', e => toggleSectors(e.target.checked))
  document.getElementById('toggle-cuav').addEventListener('change', e => toggleCuav(e.target.checked))
  document.getElementById('toggle-flood').addEventListener('change', e => toggleFlood(e.target.checked))
  document.getElementById('toggle-air-defense').addEventListener('change', e => toggleAirDefense(e.target.checked))

  // Demo panel
  initDemoPanel(runDemoStep)

  // Cascade close
  initCascadeClose()

  // Stat cards — fill critical count from data
  const critCount = nodes.filter(n => n.risk === 'critical').length
  const statCritEl = document.getElementById('stat-critical')
  if (statCritEl) statCritEl.textContent = critCount
  const statObjEl = document.getElementById('stat-objects')
  if (statObjEl) statObjEl.textContent = nodes.length

  // Threats view — badge + stat-threats counter
  initThreatsView((count) => {
    const badge = document.getElementById('threats-badge')
    if (badge) {
      badge.textContent = count
      badge.style.display = count > 0 ? 'inline-block' : 'none'
    }
    const statThreat = document.getElementById('stat-threats')
    if (statThreat) {
      statThreat.textContent = count
      statThreat.className = `stat-val${count > 0 ? ' danger' : ' ok'}`
    }
  })

  // Graph mode buttons
  document.querySelectorAll('.graph-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => setGraphMode(btn.dataset.mode))
  })

  // Navigation — lazy init graph on switch
  let graphInited = false
  initNav((view) => {
    if (view === 'graph' && !graphInited) {
      graphInited = true
      initGraph(nodes)
      renderBottlenecks(nodes)
    }
  })

  console.log('🛡️ Steel Sentinel initialized', { nodes: nodes.length })
}

main()
