// ============================================================
// STEEL SENTINEL — UI Components
// ============================================================

// ---------- Clock ----------
export function startClock() {
  const el = document.getElementById('clock')
  const tick = () => { el.textContent = new Date().toLocaleTimeString('pl-PL') }
  tick()
  setInterval(tick, 1000)
}

// ---------- Navigation ----------
function switchView(view, onSwitch) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  const navBtn = document.querySelector(`.nav-btn[data-view="${view}"]`)
  if (navBtn) navBtn.classList.add('active')
  const viewEl = document.getElementById(`view-${view}`)
  if (viewEl) viewEl.classList.add('active')

  // Lazy-load presentation iframe on first open
  if (view === 'presentation') {
    const frame = document.getElementById('presentation-frame')
    if (frame && !frame.src) frame.src = frame.dataset.src
  }

  onSwitch?.(view)
}

export function initNav(onSwitch) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view, onSwitch))
  })

  // Presentation back button → return to map
  const backBtn = document.getElementById('presentation-back')
  if (backBtn) {
    backBtn.addEventListener('click', () => switchView('map', onSwitch))
  }
}

// ---------- Alert Modal ----------
let alertTimer = null

export function showAlert({ icon = '⚠️', title, body, variant = 'danger', actions = [], autoClose = null }) {
  clearTimeout(alertTimer)
  const box = document.getElementById('alert-box')
  box.className = `alert-box ${variant}`
  document.getElementById('alert-icon').textContent = icon
  document.getElementById('alert-title').textContent = title
  document.getElementById('alert-body').innerHTML = body

  const actionsEl = document.getElementById('alert-actions')
  actionsEl.innerHTML = ''
  actions.forEach(({ label, cls, onClick }) => {
    const btn = document.createElement('button')
    btn.className = cls
    btn.textContent = label
    btn.onclick = () => { closeAlert(); onClick?.() }
    actionsEl.appendChild(btn)
  })

  document.getElementById('alert-overlay').classList.remove('hidden')
  if (autoClose) alertTimer = setTimeout(closeAlert, autoClose)
}

export function closeAlert() {
  clearTimeout(alertTimer)
  document.getElementById('alert-overlay').classList.add('hidden')
}

// ---------- Side Alert (wsuwany z lewej, nie zasłania mapy) ----------
export function showSideAlert({ icon = '⚠️', title, body, variant = 'danger', actions = [] }) {
  const el = document.getElementById('side-alert')
  el.className = `variant-${variant} visible`
  document.getElementById('side-alert-icon').textContent  = icon
  document.getElementById('side-alert-title').textContent = title
  document.getElementById('side-alert-body').innerHTML    = body

  const actionsEl = document.getElementById('side-alert-actions')
  actionsEl.innerHTML = ''
  actions.forEach(({ label, cls, onClick }) => {
    const btn = document.createElement('button')
    btn.className   = cls
    btn.textContent = label
    btn.onclick     = () => { closeSideAlert(); onClick?.() }
    actionsEl.appendChild(btn)
  })

  document.getElementById('side-alert-close').onclick = closeSideAlert
}

export function closeSideAlert() {
  const el = document.getElementById('side-alert')
  if (el) el.classList.remove('visible')
}

// ---------- Top Alert Banners ----------
export function showTopAlert({ icon = '⚠️', text, hint = 'kliknij aby wycentrować', onClick, duration = 5000 } = {}) {
  const container = document.getElementById('top-alerts')
  if (!container) return

  const banner = document.createElement('div')
  banner.className = 'top-alert-banner'
  banner.innerHTML = `
    <span class="tba-dot"></span>
    <span class="tba-icon">${icon}</span>
    <span class="tba-text">${text}</span>
    <span class="tba-hint">· ${hint}</span>
  `
  banner.addEventListener('click', () => { onClick?.() })
  container.appendChild(banner)

  setTimeout(() => {
    banner.style.transition = 'opacity 0.4s, transform 0.4s'
    banner.style.opacity = '0'
    banner.style.transform = 'translateY(-12px)'
    setTimeout(() => banner.remove(), 400)
  }, duration)

  return banner
}

export function clearTopAlerts() {
  const container = document.getElementById('top-alerts')
  if (container) container.innerHTML = ''
}

// ---------- Mobile Notification ----------
let notifTimer = null
export function showMobileNotif(text, duration = 5000) {
  clearTimeout(notifTimer)
  const el = document.getElementById('mobile-notif')
  document.getElementById('mobile-notif-text').innerHTML = text.replace(/\n/g, '<br>')
  el.classList.remove('hidden')
  // restart animation
  el.style.animation = 'none'
  el.offsetHeight // reflow
  el.style.animation = ''
  notifTimer = setTimeout(() => el.classList.add('hidden'), duration)
}

// ---------- Cascade Panel ----------
export function showCascade(items) {
  const content = document.getElementById('cascade-content')
  content.innerHTML = items.map(item => `
    <div class="cascade-item">
      <div class="ci-name">${item.icon ?? ''} ${item.name}</div>
      ${item.hours != null ? `<div class="ci-time">⏱ Skutek za: <b>${item.hours}h</b></div>` : ''}
      <div class="ci-reason">${item.reason ?? ''}</div>
    </div>
  `).join('')
  document.getElementById('cascade-panel').classList.remove('hidden')
}

export function initCascadeClose() {
  const panel = document.getElementById('cascade-panel')
  document.getElementById('cascade-close').onclick = () => panel.classList.add('hidden')
  // Zamknij po kliknięciu w tło (poza boxem)
  panel.addEventListener('click', e => {
    if (e.target === panel) panel.classList.add('hidden')
  })
}

// ---------- Cascade AI Recommendations ----------
const PRIORITY_CFG = {
  critical: { label: 'KRYTYCZNY', color: '#ef5350' },
  high:     { label: 'WYSOKI',    color: '#ffa726' },
  medium:   { label: 'ŚREDNI',    color: '#ffeb3b' },
}

export function showCascadeRecommendations(recs) {
  const content = document.getElementById('cascade-content')

  // Separator + nagłówek AI
  const header = document.createElement('div')
  header.style.cssText = `
    margin-top:14px;padding-top:12px;border-top:1px solid #1c3158;
    display:flex;align-items:center;gap:8px;
    font-size:11px;font-weight:700;letter-spacing:1px;color:#ce93d8;
  `
  header.innerHTML = `<span style="font-size:16px">🤖</span> REKOMENDACJE AI — PLAN NAPRAWCZY`
  content.appendChild(header)

  // Kontener na rekomendacje
  const container = document.createElement('div')
  container.style.marginTop = '8px'
  content.appendChild(container)

  // Animacja "pisania" kolejnych rekomendacji
  recs.forEach((rec, i) => {
    setTimeout(() => {
      const p = PRIORITY_CFG[rec.priority] ?? PRIORITY_CFG.medium
      const el = document.createElement('div')
      el.style.cssText = `
        display:flex;gap:8px;align-items:flex-start;
        padding:7px 8px;margin-bottom:4px;
        background:rgba(255,255,255,0.03);border-radius:5px;
        border-left:3px solid ${p.color};
        animation:top-banner-in 0.3s ease;
        font-size:11px;
      `
      el.innerHTML = `
        <span style="
          flex-shrink:0;font-size:9px;font-weight:800;letter-spacing:0.8px;
          background:${p.color}22;color:${p.color};
          border:1px solid ${p.color}55;border-radius:3px;
          padding:2px 5px;margin-top:1px;white-space:nowrap;
        ">${p.label}</span>
        <span style="flex:1;color:#e8edf5;line-height:1.5">${rec.action}</span>
        ${rec.time ? `<span style="flex-shrink:0;color:#5a7499;font-size:10px;white-space:nowrap">⏱ ${rec.time}</span>` : ''}
      `
      container.appendChild(el)

      // Po ostatniej rekomendacji dodaj przycisk "Wyślij"
      if (i === recs.length - 1) {
        setTimeout(() => {
          const sendBtn = document.createElement('button')
          sendBtn.textContent = '📤 Wyślij plan naprawczy'
          sendBtn.style.cssText = `
            margin-top:12px;width:100%;padding:8px 12px;
            background:rgba(206,147,216,0.12);
            border:1px solid #ce93d855;border-radius:6px;
            color:#ce93d8;font-size:11px;font-weight:700;letter-spacing:0.8px;
            cursor:pointer;transition:background 0.2s,opacity 0.2s;
            display:flex;align-items:center;justify-content:center;gap:8px;
          `
          sendBtn.addEventListener('mouseenter', () => {
            if (!sendBtn.disabled) sendBtn.style.background = 'rgba(206,147,216,0.22)'
          })
          sendBtn.addEventListener('mouseleave', () => {
            if (!sendBtn.disabled) sendBtn.style.background = 'rgba(206,147,216,0.12)'
          })
          sendBtn.addEventListener('click', () => {
            sendBtn.disabled = true
            sendBtn.style.opacity = '0.75'
            sendBtn.style.cursor = 'default'
            sendBtn.innerHTML = `
              <span style="
                display:inline-block;width:11px;height:11px;
                border:2px solid #ce93d855;border-top-color:#ce93d8;
                border-radius:50%;animation:spin-btn 0.7s linear infinite;
                flex-shrink:0;
              "></span>
              Wysyłanie…
            `
            setTimeout(() => {
              sendBtn.innerHTML = '✅ Wysłano'
              sendBtn.style.color = '#66bb6a'
              sendBtn.style.borderColor = '#66bb6a55'
              sendBtn.style.background = 'rgba(102,187,106,0.08)'
              sendBtn.style.opacity = '1'
            }, 1000)
          })
          container.appendChild(sendBtn)
        }, 300)
      }
    }, i * 400)  // każda rekomendacja pojawia się z 400ms opóźnieniem
  })
}

// ---------- Toast ----------
let toastTimer = null
export function toast(msg, duration = 2500) {
  clearTimeout(toastTimer)
  const el = document.getElementById('toast')
  el.textContent = msg
  el.classList.remove('hidden')
  el.style.animation = 'none'
  el.offsetHeight
  el.style.animation = ''
  toastTimer = setTimeout(() => el.classList.add('hidden'), duration)
}

// ---------- Node Detail ----------
import { CATEGORIES } from './data.js'

// Ikony dla konkretnych kluczy zasobów
const RESOURCE_ICONS = {
  'Łóżka ogółem':   '🛏️',
  'Wolne łóżka':    '🟢',
  'OIOM':           '❤️‍🩹',
  'Rezerwa paliwa': '⛽',
  'Generator':      '⚡',
  'Zapas krwi':     '🩸',
  'Pojemność':      '👥',
  'Zajęte':         '🔵',
  'Zapas wody':     '💧',
  'Zapas żywności': '🥫',
  'Wentylacja':     '💨',
  'Zatrudnienie':   '👷',
  'Podatność':      '⚠️',
}

const RISK_LABELS = { critical: 'KRYTYCZNY', high: 'WYSOKI', medium: 'ŚREDNI', low: 'NISKI' }
const RISK_COLORS = { critical: 'var(--danger)', high: '#ffa726', medium: '#ffeb3b', low: 'var(--success)' }

export function showNodeDetail(node) {
  const section = document.getElementById('node-detail-section')
  const detail  = document.getElementById('node-detail')
  const cat     = CATEGORIES[node.category]
  const riskColor = RISK_COLORS[node.risk] ?? '#5a7499'
  const resources = Object.entries(node.resources ?? {})

  // Oddziel podatność od reszty zasobów
  const mainRes = resources.filter(([k]) => k !== 'Podatność')
  const vuln    = resources.find(([k]) => k === 'Podatność')

  detail.innerHTML = `
    <div class="nd-header">
      <span class="nd-icon">${cat?.icon ?? '📍'}</span>
      <div class="nd-meta">
        <div class="nd-name">${node.name}</div>
        <div class="nd-sub">${cat?.label ?? node.category} · Sektor ${node.sector}</div>
      </div>
    </div>

    <div class="nd-risk" style="border-color:${riskColor};color:${riskColor}">
      ${RISK_LABELS[node.risk] ?? node.risk.toUpperCase()}
    </div>

    ${mainRes.length ? `
    <div class="nd-resources">
      ${mainRes.map(([k, v]) => `
        <div class="nd-row">
          <span class="nd-key">${RESOURCE_ICONS[k] ?? '•'} ${k}</span>
          <span class="nd-val">${v}</span>
        </div>
      `).join('')}
    </div>` : ''}

    ${vuln ? `
    <div class="nd-vuln">
      ⚠️ Podatność: <b>${vuln[1]}</b>
    </div>` : ''}

    ${node.description ? `
    <div class="nd-desc">${node.description.replace(/^[^·]*·\s*tier\s*\d+\s*·?\s*/i, '')}</div>
    ` : ''}
  `

  section.style.display = 'block'
  // Scroll sidebar to top so stats + detail are both visible
  const sidebar = document.getElementById('sidebar')
  if (sidebar) sidebar.scrollTop = 0
}

// ---------- Demo Panel ----------
export function initDemoPanel(onStep) {
  document.querySelectorAll('.demo-step').forEach(el => {
    el.addEventListener('click', () => onStep(parseInt(el.dataset.step)))
  })

  // Keyboard shortcuts: 1 = start demo, R = reset
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return
    if (e.key === '1') onStep(1)
    if (e.key === 'r' || e.key === 'R') onStep(0)
  })
}

// ---------- Filter Bar Toggle ----------
export function initFilterToggle() {
  const btn   = document.getElementById('filter-toggle')
  const panel = document.getElementById('filter-panel')
  if (!btn || !panel) return

  btn.addEventListener('click', () => {
    const open = !panel.classList.contains('hidden')
    panel.classList.toggle('hidden', open)
    btn.classList.toggle('open', !open)
  })

  // Close on outside click
  document.addEventListener('click', e => {
    const bar = document.getElementById('filter-bar')
    if (bar && !bar.contains(e.target)) {
      panel.classList.add('hidden')
      btn.classList.remove('open')
    }
  })
}

// ---------- Category Filters (chip style) ----------
export function initCategoryFilters(categories, onToggle) {
  const container = document.getElementById('category-filters')
  let activeCount = Object.keys(categories).length

  const updateBadge = () => {
    const badge = document.getElementById('filter-badge')
    if (badge) badge.textContent = activeCount
  }

  Object.entries(categories).forEach(([key, cat]) => {
    const color = cat.color ?? '#3b9eff'
    const label = document.createElement('label')
    label.className = 'cat-chip active'
    label.dataset.category = key
    label.style.setProperty('--item-color', color)
    label.innerHTML = `
      <input type="checkbox" checked data-category="${key}" />
      <span class="chip-dot"></span>
      <span class="chip-icon">${cat.icon}</span>
      <span class="chip-label">${cat.label}</span>
      <span class="chip-count" id="count-${key}">0</span>
    `
    label.querySelector('input').addEventListener('change', e => {
      const checked = e.target.checked
      label.classList.toggle('active', checked)
      label.classList.toggle('inactive', !checked)
      activeCount += checked ? 1 : -1
      updateBadge()
      onToggle(key, checked)
    })
    container.appendChild(label)
  })

  updateBadge()
}

export function updateCategoryCount(category, count) {
  const el = document.getElementById(`count-${category}`)
  if (el) el.textContent = count
}
