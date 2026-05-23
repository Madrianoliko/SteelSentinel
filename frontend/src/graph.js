// ============================================================
// STEEL SENTINEL — Graph Module (vis-network)
// ============================================================
import { Network, DataSet } from 'vis-network/standalone'
import { CATEGORIES, GRAPH_EDGES } from './data.js'

let network = null

const EDGE_COLORS = {
  energy:    { color: '#ffeb3b', highlight: '#fff59d' },
  water:     { color: '#4fc3f7', highlight: '#b3e5fc' },
  telecom:   { color: '#ce93d8', highlight: '#e1bee7' },
  transport: { color: '#a5d6a7', highlight: '#c8e6c9' },
  fuel:      { color: '#ff8a65', highlight: '#ffccbc' },
}

const GROUP_STYLES = {
  energy:         { background: '#2c2000', border: '#ffeb3b' },
  water:          { background: '#001525', border: '#4fc3f7' },
  health:         { background: '#1a0010', border: '#f48fb1' },
  transport:      { background: '#001500', border: '#a5d6a7' },
  telecom:        { background: '#120020', border: '#ce93d8' },
  industrial:     { background: '#1a0000', border: '#ef9a9a' },
  administration: { background: '#001020', border: '#90caf9' },
  rescue:         { background: '#1a1000', border: '#ffcc80' },
  chemical:       { background: '#1a0a00', border: '#ff8a65' },
  food:           { background: '#0a1a00', border: '#c5e1a5' },
  education:      { background: '#1a1500', border: '#ffe082' },
}

export function initGraph(nodes) {
  if (network) return

  const container = document.getElementById('graph-container')

  const visNodes = new DataSet(nodes.map(n => {
    const cat = CATEGORIES[n.category]
    const style = GROUP_STYLES[n.category] ?? { background: '#0d1526', border: '#3b9eff' }
    return {
      id: n.id,
      label: n.name.length > 20 ? n.name.substring(0, 18) + '…' : n.name,
      title: `<div style="color:#e8edf5;font-size:12px;max-width:200px">
        <b>${cat?.icon ?? ''} ${n.name}</b><br/>
        <span style="color:#5a7499">${cat?.label} · Sektor ${n.sector}</span><br/>
        <span style="color:${riskColor(n.risk)}">${n.risk.toUpperCase()}</span>
      </div>`,
      shape: 'box',
      font: { color: style.border, size: 11, face: 'Segoe UI' },
      color: {
        background: style.background,
        border: style.border,
        highlight: { background: '#1c3158', border: '#fff' },
        hover: { background: '#1c3158', border: style.border },
      },
      borderWidth: n.risk === 'critical' ? 2 : 1,
      borderWidthSelected: 3,
      margin: 8,
    }
  }))

  const visEdges = new DataSet(GRAPH_EDGES.map((e, i) => {
    const ec = EDGE_COLORS[e.type] ?? { color: '#3b9eff' }
    return {
      id: i,
      from: e.source,
      to: e.target,
      title: `${e.type}${e.note ? ` · ${e.note}` : ''}`,
      color: { color: ec.color, highlight: ec.highlight, opacity: 0.7 },
      width: e.weight >= 1.0 ? 2 : 1,
      dashes: e.weight < 0.6,
      arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      smooth: { type: 'curvedCW', roundness: 0.15 },
    }
  }))

  network = new Network(container, { nodes: visNodes, edges: visEdges }, {
    physics: {
      enabled: true,
      stabilization: { iterations: 300, fit: true },
      barnesHut: { gravitationalConstant: -12000, centralGravity: 0.3, springLength: 180 },
    },
    interaction: { hover: true, tooltipDelay: 150, navigationButtons: false },
    layout: { improvedLayout: true },
  })

  // Background
  container.style.background = 'var(--bg-base)'

  return network
}

export function highlightCascade(nodeId, affectedIds) {
  if (!network) return
  network.selectNodes([nodeId, ...affectedIds])
}

// ---- Bottlenecks — real API z fallback ----
export async function renderBottlenecks(nodes) {
  const el = document.getElementById('bottlenecks-list')
  el.innerHTML = '<div style="color:var(--text-muted);font-size:11px">Ładowanie…</div>'

  let data = null
  try {
    const res = await fetch('/api/graph/bottlenecks')
    if (res.ok) data = await res.json()
  } catch {}

  if (data && data.length) {
    el.innerHTML = data.slice(0, 5).map(item => {
      const node = nodes.find(n => n.id === item.node_id)
      const cat = CATEGORIES[node?.category]
      return `
        <div class="bottleneck-item">
          <span>${cat?.icon ?? ''} ${node?.name?.substring(0, 22) ?? item.node_id}</span>
          <span class="bottleneck-score">${item.total_weight.toFixed(1)}</span>
        </div>
      `
    }).join('')
  } else {
    // Fallback — oblicz lokalnie
    const scores = {}
    GRAPH_EDGES.forEach(e => {
      if (!scores[e.target]) scores[e.target] = 0
      scores[e.target] += e.weight
    })
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a).slice(0, 5)
    el.innerHTML = sorted.map(([id, score]) => {
      const node = nodes.find(n => n.id === parseInt(id))
      const cat = CATEGORIES[node?.category]
      return `
        <div class="bottleneck-item">
          <span>${cat?.icon ?? ''} ${node?.name?.substring(0, 22) ?? id}</span>
          <span class="bottleneck-score">${score.toFixed(1)}</span>
        </div>
      `
    }).join('')
  }
}

function riskColor(r) {
  return { low: '#00e676', medium: '#ffa726', high: '#ff5722', critical: '#ef5350' }[r] ?? '#fff'
}
