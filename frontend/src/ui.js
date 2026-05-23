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
export function initNav(onSwitch) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
      btn.classList.add('active')
      const view = btn.dataset.view
      document.getElementById(`view-${view}`).classList.add('active')
      onSwitch?.(view)
    })
  })
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
  document.getElementById('cascade-close').onclick = () =>
    document.getElementById('cascade-panel').classList.add('hidden')
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

export function showNodeDetail(node) {
  const section = document.getElementById('node-detail-section')
  const detail = document.getElementById('node-detail')
  const cat = CATEGORIES[node.category]

  detail.innerHTML = `
    <div class="node-name">${cat?.icon ?? ''} ${node.name}</div>
    <div class="node-cat">${cat?.label ?? node.category} — Sektor ${node.sector}</div>
    <span class="risk-badge risk-${node.risk}">${node.risk.toUpperCase()}</span>
    ${Object.entries(node.resources ?? {}).map(([k, v]) => `
      <div class="resource-row">
        <span>${k}</span>
        <span class="resource-val">${v}</span>
      </div>
    `).join('')}
    ${node.description ? `<p style="margin-top:8px;font-size:11px;color:var(--text-muted);line-height:1.4">${node.description}</p>` : ''}
  `
  section.style.display = 'block'
  section.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

// ---------- Demo Panel ----------
export function initDemoPanel(onStep) {
  // Collapse toggle
  const toggle = document.getElementById('demo-toggle')
  const body = document.getElementById('demo-body')
  toggle.onclick = () => {
    const collapsed = body.style.display === 'none'
    body.style.display = collapsed ? '' : 'none'
    toggle.textContent = collapsed ? '−' : '+'
  }

  // Step buttons
  document.querySelectorAll('.demo-step').forEach(el => {
    el.addEventListener('click', () => {
      const step = parseInt(el.dataset.step)
      highlightDemoStep(step)
      onStep(step)
    })
  })

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return
    if (e.key >= '1' && e.key <= '6') { const s = parseInt(e.key); highlightDemoStep(s); onStep(s) }
    if (e.key === 'r' || e.key === 'R') { highlightDemoStep(0); onStep(0) }
  })
}

function highlightDemoStep(step) {
  document.querySelectorAll('.demo-step').forEach(el => el.classList.remove('active'))
  const el = document.querySelector(`.demo-step[data-step="${step}"]`)
  if (el) el.classList.add('active')
}

// ---------- Category Filters ----------
export function initCategoryFilters(categories, onToggle) {
  const container = document.getElementById('category-filters')
  Object.entries(categories).forEach(([key, cat]) => {
    const label = document.createElement('label')
    label.className = 'filter-item'
    label.innerHTML = `
      <input type="checkbox" checked data-category="${key}" />
      <span>${cat.icon} ${cat.label}</span>
      <span class="count" id="count-${key}">0</span>
    `
    label.querySelector('input').addEventListener('change', e => onToggle(key, e.target.checked))
    container.appendChild(label)
  })
}

export function updateCategoryCount(category, count) {
  const el = document.getElementById(`count-${category}`)
  if (el) el.textContent = count
}
