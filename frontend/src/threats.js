// ============================================================
// STEEL SENTINEL — Threats View Module
// ============================================================

const threats = []   // { id, type, lat, lng, target, status, ts, sector }
let onCountChange = null

export function initThreatsView(onCount) {
  onCountChange = onCount
  renderAll()
}

export function addThreat(threat) {
  threats.unshift({
    id: threat.id ?? threats.length + 1,
    type: threat.type ?? 'aerial_drone',
    target: threat.target ?? 'Nieznany',
    confidence: threat.confidence ?? null,
    sector: threat.sector ?? '?',
    status: 'detected',
    ts: new Date(),
    ai: threat.ai ?? null,
  })
  renderAll()
  onCountChange?.(threats.filter(t => t.status === 'detected' || t.status === 'no_assets').length)
}

export function updateThreatStatus(id, status) {
  const t = threats.find(t => t.id === id)
  if (t) { t.status = status; t.resolvedAt = new Date() }
  renderAll()
  onCountChange?.(threats.filter(t => t.status === 'detected' || t.status === 'no_assets').length)
}

export function clearThreats() {
  threats.length = 0
  renderAll()
  onCountChange?.(0)
}

function renderAll() {
  const container = document.getElementById('threats-list')
  if (!container) return

  if (!threats.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span>✅</span>
        <p>Brak aktywnych zagrożeń.<br/>System monitoruje obszar.</p>
      </div>`
    return
  }

  container.innerHTML = threats.map(t => renderCard(t)).join('')
}

function renderCard(t) {
  const statusMeta = {
    detected:      { label: 'WYKRYTO',          cls: 'status-danger',   icon: '🚨' },
    intercepted:   { label: 'ZNEUTRALIZOWANO',   cls: 'status-success',  icon: '✅' },
    no_assets:     { label: 'BRAK ZASOBÓW',      cls: 'status-warning',  icon: '⚠️' },
    impact:        { label: 'UDERZENIE',          cls: 'status-critical', icon: '💥' },
    evacuation:    { label: 'EWAKUACJA',          cls: 'status-warning',  icon: '🚨' },
  }
  const s = statusMeta[t.status] ?? { label: t.status, cls: '', icon: '❓' }
  const timeStr = t.ts.toLocaleTimeString('pl-PL')
  const duration = t.resolvedAt
    ? Math.round((t.resolvedAt - t.ts) / 1000) + 's'
    : elapsed(t.ts)

  return `
    <div class="threat-card ${t.status === 'impact' ? 'impact' : ''}">
      <div class="threat-header">
        <div class="threat-id">BSP #${t.id}</div>
        <div class="threat-status ${s.cls}">${s.icon} ${s.label}</div>
      </div>
      <div class="threat-body">
        <div class="threat-row">
          <span class="threat-label">Cel</span>
          <span class="threat-value">${t.target}</span>
        </div>
        <div class="threat-row">
          <span class="threat-label">Sektor</span>
          <span class="threat-value">Sektor ${t.sector}</span>
        </div>
        ${t.confidence != null ? `
        <div class="threat-row">
          <span class="threat-label">Pewność AI</span>
          <span class="threat-value conf-bar-wrap">
            <span class="conf-bar" style="width:${Math.round(t.confidence * 100)}%"></span>
            <span>${Math.round(t.confidence * 100)}%</span>
          </span>
        </div>` : ''}
        ${t.ai ? `
        <div class="threat-ai">
          <span class="ai-label">🤖 AI:</span> ${t.ai}
        </div>` : ''}
        <div class="threat-row" style="margin-top:6px">
          <span class="threat-label">Wykryto</span>
          <span class="threat-value">${timeStr}</span>
        </div>
        <div class="threat-row">
          <span class="threat-label">${t.resolvedAt ? 'Czas reakcji' : 'Czas od wykrycia'}</span>
          <span class="threat-value">${duration}</span>
        </div>
      </div>
    </div>
  `
}

function elapsed(ts) {
  const s = Math.round((Date.now() - ts) / 1000)
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

// Odśwież elapsed timery co sekundę
setInterval(() => {
  if (threats.some(t => !t.resolvedAt)) renderAll()
}, 1000)
