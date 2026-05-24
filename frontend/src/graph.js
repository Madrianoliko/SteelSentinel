// ============================================================
// STEEL SENTINEL — Graph Module (vis-network, hierarchical)
// ============================================================
import { Network, DataSet } from 'vis-network/standalone'
import { CATEGORIES, GRAPH_EDGES } from './data.js'

let network = null
let allNodes = []
let visNodesDS = null
let visEdgesDS = null

// State
let modeFilter    = 'critical'   // 'critical' | 'all'
let catFilter     = new Set(['shelter'])  // excluded categories (shelter ukryte domyślnie)

// ── Colors ──────────────────────────────────────────────────
const EDGE_COLORS = {
  energy:    '#ffeb3b',
  water:     '#4fc3f7',
  telecom:   '#ce93d8',
  transport: '#a5d6a7',
  fuel:      '#ff8a65',
}

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

const RISK_GLOW = {
  critical: '#ef5350',
  high:     '#ff5722',
  medium:   '#ffa726',
  low:      '#00e676',
}

// ── In-degree (how many depend on this node) ─────────────────
function buildInDegree() {
  const deg = {}
  GRAPH_EDGES.forEach(e => {
    deg[e.source] = (deg[e.source] ?? 0) + e.weight
  })
  return deg
}

// ── Build tooltip DOM element ────────────────────────────────
function makeTooltip(n, inDeg) {
  const cat   = CATEGORIES[n.category]
  const score = inDeg[n.id] ?? 0

  const el = document.createElement('div')
  el.style.cssText = [
    'background:#0d1526',
    'border:1px solid #254070',
    'border-radius:6px',
    'padding:10px 12px',
    'font-size:12px',
    'color:#e8edf5',
    'max-width:240px',
    'line-height:1.5',
    'box-shadow:0 4px 16px rgba(0,0,0,0.6)',
    'font-family:Segoe UI,system-ui,sans-serif',
  ].join(';')

  el.innerHTML = `
    <div style="font-weight:700;font-size:13px;margin-bottom:4px">
      ${cat?.icon ?? '📍'} ${n.name}
    </div>
    <div style="color:#5a7499;font-size:11px;margin-bottom:6px">
      ${cat?.label ?? n.category} &nbsp;·&nbsp; Sektor ${n.sector}
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:${score > 0 ? 6 : 0}px">
      <span style="
        background:${RISK_GLOW[n.risk]}22;
        color:${RISK_GLOW[n.risk]};
        font-weight:700;font-size:10px;
        letter-spacing:1px;
        padding:2px 8px;border-radius:10px;
      ">${n.risk.toUpperCase()}</span>
    </div>
    ${score > 0 ? `
    <div style="color:#ffa726;font-size:11px">
      ⚡ Zasila <b>${Math.round(score)}</b> ${Math.round(score) === 1 ? 'obiekt' : 'obiektów'}
    </div>` : ''}
    ${n.description ? `<div style="color:#5a7499;font-size:11px;margin-top:6px;border-top:1px solid #1c3158;padding-top:6px">${n.description}</div>` : ''}
  `
  return el
}

// ── Build vis node object ────────────────────────────────────
function makeVisNode(n, inDeg) {
  const cat   = CATEGORIES[n.category]
  const color = CAT_COLORS[n.category] ?? '#90caf9'
  const score = inDeg[n.id] ?? 0
  const isCrit = n.risk === 'critical'

  return {
    id:    n.id,
    label: n.name.length > 22 ? n.name.substring(0, 20) + '…' : n.name,
    title: makeTooltip(n, inDeg),
    shape: 'box',
    font: {
      color: isCrit ? '#ffcdd2' : color,
      size:  isCrit ? 12 : 11,
      face:  'Segoe UI',
      bold:  isCrit ? { color: '#ffcdd2', size: 12 } : false,
    },
    color: {
      background: `color-mix(in srgb, ${color} 10%, #070c18)`,
      border: color,
      highlight: { background: '#1c3158', border: '#fff' },
      hover:     { background: '#1c3158', border: color },
    },
    borderWidth:         isCrit ? 2.5 : 1.5,
    borderWidthSelected: 3,
    shadow: isCrit
      ? { enabled: true, color: 'rgba(239,83,80,0.6)', size: 10, x: 0, y: 0 }
      : false,
    margin: { top: 6, bottom: 6, left: 8, right: 8 },
    widthConstraint: { minimum: 80, maximum: 180 },
    // store for filtering
    _risk:     n.risk,
    _category: n.category,
  }
}

// ── Build vis edge object ────────────────────────────────────
function makeVisEdge(e, i) {
  const col = EDGE_COLORS[e.type] ?? '#3b9eff'
  return {
    id:    i,
    from:  e.source,
    to:    e.target,
    title: e.type + (e.note ? ` · ${e.note}` : ''),
    color: { color: col, highlight: col, opacity: e.weight >= 1 ? 0.75 : 0.35 },
    width: e.weight >= 1 ? 2 : 1,
    dashes: e.weight < 0.6,
    arrows: { to: { enabled: true, scaleFactor: 0.55 } },
    smooth: { enabled: true, type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.4 },
  }
}

// ── Filter helpers ───────────────────────────────────────────
// catFilter = zbiór WYKLUCZONYCH kategorii (ukrytych)
function getFilteredNodes() {
  return allNodes.filter(n => {
    const riskOk = modeFilter === 'all' || n.risk === 'critical' || n.risk === 'high'
    const catOk  = !catFilter.has(n.category)
    return riskOk && catOk
  })
}

function rebuildGraph() {
  if (!network) return
  const filtered  = getFilteredNodes()
  const nodeIds   = new Set(filtered.map(n => n.id))
  const inDeg     = buildInDegree()

  const newNodes = filtered.map(n => makeVisNode(n, inDeg))
  const newEdges = GRAPH_EDGES
    .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e, i) => makeVisEdge(e, i))

  visNodesDS.clear()
  visEdgesDS.clear()
  visNodesDS.add(newNodes)
  visEdgesDS.add(newEdges)

  // Re-run physics to stabilize new layout, then fit
  network.setOptions({ physics: { enabled: true } })
  network.once('stabilized', () => {
    network.setOptions({ physics: { enabled: false } })
    network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } })
  })
}

// ── Init ─────────────────────────────────────────────────────
export function initGraph(nodes) {
  if (network) return
  allNodes = nodes

  const container = document.getElementById('graph-container')
  const inDeg     = buildInDegree()

  const filtered = getFilteredNodes()
  const nodeIds  = new Set(filtered.map(n => n.id))

  visNodesDS = new DataSet(filtered.map(n => makeVisNode(n, inDeg)))
  visEdgesDS = new DataSet(
    GRAPH_EDGES
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e, i) => makeVisEdge(e, i))
  )

  network = new Network(container, { nodes: visNodesDS, edges: visEdgesDS }, {
    layout: { improvedLayout: true },
    physics: {
      enabled: true,
      stabilization: { iterations: 400, fit: true },
      barnesHut: {
        gravitationalConstant: -14000,
        centralGravity:        0.25,
        springLength:          200,
        springConstant:        0.04,
        damping:               0.18,
      },
    },
    interaction: {
      hover:             true,
      tooltipDelay:      120,
      navigationButtons: false,
      keyboard:          true,
      zoomView:          true,
    },
    edges: {
      smooth: { type: 'curvedCW', roundness: 0.2 },
    },
  })

  container.style.background = '#070c18'

  // Click handler — highlight neighbours
  network.on('click', params => {
    if (!params.nodes.length) { network.unselectAll(); return }
    const nodeId    = params.nodes[0]
    const connected = network.getConnectedNodes(nodeId)
    network.selectNodes([nodeId, ...connected], true)
  })

  // Build category chips
  buildCatChips()

  return network
}

// ── Category chip controls ───────────────────────────────────
function buildCatChips() {
  const container = document.getElementById('graph-cat-chips')
  if (!container) return

  // Collect which categories exist in current visible nodes
  const present = new Set(allNodes.map(n => n.category))

  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    if (!present.has(key)) return
    const color = cat.color ?? '#3b9eff'
    const chip  = document.createElement('button')
    const defaultOff = catFilter.has(key)  // shelter starts off
    chip.className     = `graph-cat-chip${defaultOff ? ' off' : ''}`
    chip.dataset.cat   = key
    chip.style.setProperty('--chip-color', color)
    chip.innerHTML     = `<span class="chip-dot" style="background:${color};display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:4px"></span>${cat.icon} ${cat.label}`
    chip.title         = cat.label

    chip.addEventListener('click', () => {
      chip.classList.toggle('off')
      if (chip.classList.contains('off')) {
        catFilter.add(key)     // wyklucz kategorię
      } else {
        catFilter.delete(key)  // przywróć kategorię
      }
      rebuildGraph()
    })
    container.appendChild(chip)
  })
}

// ── Mode toggle (called from HTML buttons) ───────────────────
export function setGraphMode(mode) {
  modeFilter = mode
  document.querySelectorAll('.graph-mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode)
  })
  rebuildGraph()
}

// ── Bottlenecks ──────────────────────────────────────────────
export function highlightCascade(nodeId, affectedIds) {
  if (!network) return
  network.selectNodes([nodeId, ...affectedIds])
}

export function highlightDamaged(nodeId, affectedIds) {
  // Ensure we're in 'all' mode so the node is visible
  if (modeFilter !== 'all') {
    modeFilter = 'all'
    document.querySelectorAll('.graph-mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === 'all')
    })
    rebuildGraph()
  }

  const apply = () => {
    // Zniszczony węzeł — czerwony
    if (visNodesDS.get(nodeId)) {
      visNodesDS.update({
        id: nodeId,
        color: {
          background: 'rgba(239,83,80,0.25)',
          border: '#ef5350',
          highlight: { background: 'rgba(239,83,80,0.35)', border: '#ef5350' },
          hover:     { background: 'rgba(239,83,80,0.2)',  border: '#ef5350' },
        },
        font:        { color: '#ef5350' },
        shadow:      { enabled: true, color: 'rgba(239,83,80,0.9)', size: 18, x: 0, y: 0 },
        borderWidth: 3,
      })
    }

    // Krawędzie wychodzące z uszkodzonego węzła → czerwone
    visEdgesDS.getIds().forEach(edgeId => {
      const edge = visEdgesDS.get(edgeId)
      if (edge.from === nodeId && affectedIds.includes(edge.to)) {
        visEdgesDS.update({
          id:     edgeId,
          color:  { color: '#ef5350', highlight: '#ef5350', opacity: 1 },
          width:  3,
          dashes: false,
        })
      }
    })

    // Wycentruj na zniszczonym węźle
    network.focus(nodeId, {
      scale:     1.1,
      animation: { duration: 800, easingFunction: 'easeInOutQuad' },
    })
    network.selectNodes([nodeId, ...affectedIds])
  }

  // Jeśli graf właśnie przechodzi przebudowę po zmianie trybu, daj mu chwilę
  if (network) {
    setTimeout(apply, modeFilter !== 'all' ? 800 : 0)
  }
}

export async function renderBottlenecks(nodes) {
  const el = document.getElementById('bottlenecks-list')
  el.innerHTML = '<div style="color:var(--text-muted);font-size:11px">Ładowanie…</div>'

  let data = null
  try {
    const res = await fetch('/api/graph/bottlenecks')
    if (res.ok) data = await res.json()
  } catch {}

  if (data?.length) {
    el.innerHTML = data.slice(0, 6).map(item => {
      const node = nodes.find(n => n.id === item.node_id)
      const cat  = CATEGORIES[node?.category]
      return `<div class="bottleneck-item">
        <span>${cat?.icon ?? ''} ${node?.name?.substring(0, 24) ?? item.node_id}</span>
        <span class="bottleneck-score">${item.total_weight.toFixed(1)}</span>
      </div>`
    }).join('')
  } else {
    // Local fallback — in-degree score
    const inDeg = buildInDegree()
    const sorted = Object.entries(inDeg).sort(([, a], [, b]) => b - a).slice(0, 6)
    el.innerHTML = sorted.map(([id, score]) => {
      const node = nodes.find(n => n.id === parseInt(id))
      const cat  = CATEGORIES[node?.category]
      return `<div class="bottleneck-item">
        <span>${cat?.icon ?? ''} ${node?.name?.substring(0, 24) ?? id}</span>
        <span class="bottleneck-score">${score.toFixed(1)}</span>
      </div>`
    }).join('')
  }
}
