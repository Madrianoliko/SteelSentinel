// ============================================================
// STEEL SENTINEL — API Client
// ============================================================
import { INFRASTRUCTURE, GRAPH_EDGES } from './data.js'

const BASE = '/api'

async function get(path) {
  try {
    const r = await fetch(BASE + path)
    if (!r.ok) throw new Error(r.status)
    return await r.json()
  } catch {
    return null
  }
}

async function post(path, body) {
  try {
    const r = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) throw new Error(r.status)
    return await r.json()
  } catch {
    return null
  }
}

export async function fetchInfrastructure() {
  const data = await get('/infrastructure/')
  return data ?? INFRASTRUCTURE
}

export async function fetchNode(id) {
  const data = await get(`/infrastructure/${id}`)
  return data ?? INFRASTRUCTURE.find(n => n.id === id)
}

export async function fetchCascade(id) {
  const data = await get(`/infrastructure/${id}/cascade`)
  return data
}

export async function fetchGraph() {
  const data = await get('/graph/')
  return data
}

export async function fetchBottlenecks() {
  const data = await get('/graph/bottlenecks')
  return data
}

export async function detectThreat(lat, lng, type = 'aerial_drone') {
  return await post('/threats/detect', { lat, lng, threat_type: type })
}

export async function interceptThreat(threatId, assetId) {
  return await post(`/threats/${threatId}/intercept?asset_id=${assetId}`, {})
}

export async function evacuate(threatId, sector) {
  return await post(`/threats/${threatId}/evacuate?sector=${sector}`, {})
}
