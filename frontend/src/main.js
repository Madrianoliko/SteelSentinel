// ============================================================
// STEEL SENTINEL — Main Entry Point
// ============================================================
import './style.css'
import { fetchInfrastructure } from './api.js'
import { initMap, toggleCategory, toggleSensors, toggleGpsJam, toggleSectors, toggleCuav, toggleFlood, toggleAirDefense } from './map.js'
import { initGraph, renderBottlenecks } from './graph.js'
import { runDemoStep } from './demo.js'
import { initThreatsView } from './threats.js'
import {
  startClock, initNav, initCategoryFilters, initDemoPanel,
  initCascadeClose, showNodeDetail
} from './ui.js'
import { CATEGORIES } from './data.js'

async function main() {
  startClock()

  // Load infrastructure data (API or fallback)
  const nodes = await fetchInfrastructure()

  // Init map
  initMap(nodes)

  // Category filters
  initCategoryFilters(CATEGORIES, (category, visible) => toggleCategory(category, visible))

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

  // Threats view — badge z liczbą aktywnych zagrożeń
  initThreatsView((count) => {
    const badge = document.getElementById('threats-badge')
    if (!badge) return
    if (count > 0) {
      badge.textContent = count
      badge.style.display = 'inline-block'
    } else {
      badge.style.display = 'none'
    }
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
