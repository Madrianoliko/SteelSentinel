// ============================================================
// STEEL SENTINEL — Demo Scenario Controller
// ============================================================
import { showAlert, closeAlert, showMobileNotif, showCascade, toast } from './ui.js'
import { spawnDrone1, destroyDrone1, spawnDrone2, impactDrone2, resetMap, colorSector } from './map.js'
import { detectThreat, interceptThreat, evacuate } from './api.js'
import { addThreat, updateThreatStatus, clearThreats } from './threats.js'

let currentStep = 0
let threatId1 = null
let threatId2 = null

export function runDemoStep(step) {
  if (step === 0) { resetDemo(); return }
  currentStep = step

  switch (step) {
    case 1: step1(); break
    case 2: step2(); break
    case 3: step3(); break
    case 4: step4(); break
    case 5: step5(); break
    case 6: step6(); break
  }
}

// ── KROK 1 — Wykryto drona #1 ──────────────────────────────
async function step1() {
  spawnDrone1()

  // Wywołaj backend
  const result = await detectThreat(50.5731, 22.0442, 'aerial_drone')
  threatId1 = result?.threat_id ?? 1

  // Koloruj sektor zagrożony
  colorSector('A', 'threat')

  // Dodaj do threats view
  addThreat({
    id: threatId1,
    type: 'aerial_drone',
    target: 'HSW S.A. — Huta Stalowa Wola',
    confidence: 0.87,
    sector: 'A',
    ai: 'Przechwycenie — Alfa-3 (czas: ~38s, zasięg: wystarczający)',
  })

  setTimeout(() => {
    showMobileNotif(
      '🚨 ALERT LOTNICZY — Sektor A\nWykryto wrogie BSP od wschodu.\nMonitorowanie aktywne.',
      6000
    )
  }, 1200)

  setTimeout(() => {
    showAlert({
      icon: '🚨',
      title: 'WYKRYTO WROGIE BSP',
      variant: 'danger',
      body: `
        <b>Kierunek:</b> Wschód → Centrum<br/>
        <b>Wykryto przez:</b> Sensor A (IMINT + Audio)<br/>
        <b>Typ:</b> Dron wielowirnikowy<br/>
        <b>Prędkość:</b> ~120 km/h<br/>
        <b>Przewidywany cel:</b> <b>HSW S.A.</b><br/>
        <b>Pewność AI:</b> 87% · Czas do celu: ~52s
      `,
      actions: [
        { label: 'Monitoruj →', cls: 'btn-dismiss', onClick: closeAlert },
      ],
      autoClose: 5000,
    })
  }, 2500)
}

// ── KROK 2 — Rekomendacja AI ────────────────────────────────
function step2() {
  closeAlert()
  showAlert({
    icon: '🤖',
    title: 'REKOMENDACJA AI',
    variant: 'info',
    body: `
      <b>Cel:</b> HSW S.A. — Huta Stalowa Wola <span style="color:#ffa726">(pewność 87%)</span><br/><br/>
      <b>Zalecana akcja:</b> Przechwycenie<br/>
      <b>Środek:</b> Dron C-UAS <b>Alfa-3</b><br/>
      <b>Uzasadnienie:</b><br/>
      <ul style="margin:6px 0 0 16px;line-height:1.8">
        <li>Odległość od trasy: <b>2,1 km</b> ✓</li>
        <li>Czas przechwycenia: <b>~38s</b> ✓</li>
        <li>Zasięg bojowy: <b>wystarczający</b> ✓</li>
        <li>Stan: <b>DOSTĘPNY</b> ✓</li>
      </ul>
      <br/><span style="color:var(--text-muted);font-size:11px">
        Alternatywa odrzucona: Beta-1 (czas: 95s — za wolno)
      </span>
    `,
    actions: [
      { label: '🎯 ZESTRZEL', cls: 'btn-shoot', onClick: () => runDemoStep(3) },
      { label: 'Anuluj', cls: 'btn-dismiss', onClick: closeAlert },
    ],
  })
}

// ── KROK 3 — Zestrzelenie #1 ────────────────────────────────
async function step3() {
  closeAlert()
  destroyDrone1()
  toast('🚁 Alfa-3 wysłany…', 1500)

  await interceptThreat(threatId1, 3)
  updateThreatStatus(threatId1, 'intercepted')
  colorSector('A', 'clear')

  setTimeout(() => {
    showAlert({
      icon: '✅',
      title: 'CEL ZNEUTRALIZOWANY',
      variant: 'success',
      body: `
        Dron C-UAS <b>Alfa-3</b> przechwycił i zniszczył wrogie BSP.<br/><br/>
        <b>Cel HSW S.A. zabezpieczony.</b><br/>
        <span style="color:var(--text-muted);font-size:11px">
          Czas przechwycenia: 36s · Dokładność: 94%
        </span>
      `,
      actions: [{ label: 'OK', cls: 'btn-dismiss', onClick: closeAlert }],
      autoClose: 4000,
    })
    showMobileNotif('✅ Zagrożenie zneutralizowane.\nMożesz wrócić do normalnej aktywności.', 4000)
  }, 1800)
}

// ── KROK 4 — Dron #2 ────────────────────────────────────────
async function step4() {
  closeAlert()
  spawnDrone2()

  const result = await detectThreat(50.5900, 22.0610, 'aerial_drone')
  threatId2 = result?.threat_id ?? 2

  // Sektor C — zagrożenie, sektory B i D — narażone kaskadowo
  colorSector('C', 'threat')
  colorSector('B', 'cascade')

  addThreat({
    id: threatId2,
    type: 'aerial_drone',
    target: 'Przepompownia Wody — Centrum',
    confidence: 0.79,
    sector: 'C',
    ai: 'Brak dostępnych środków C-UAS — rozważ ewakuację',
  })

  setTimeout(() => {
    showMobileNotif(
      '🚨 ALERT — Sektor C\nWykryto drugie wrogie BSP od północy.\nPrzepompownia wody — cel potencjalny.',
      6000
    )
  }, 800)

  setTimeout(() => {
    showAlert({
      icon: '🚨',
      title: 'DRUGIE WROGIE BSP',
      variant: 'danger',
      body: `
        <b>Kierunek:</b> Północ → Sektor C<br/>
        <b>Wykryto przez:</b> Sensor C (Audio) + Radar D<br/>
        <b>Przewidywany cel:</b> <b>Przepompownia Wody Centralnej</b><br/>
        <b>Pewność:</b> 79% · Czas do celu: ~48s<br/><br/>
        <span style="color:var(--warning)">⚠️ Obiekt krytyczny — zasilanie wodą dla 60 000 os.</span>
      `,
      actions: [{ label: 'Analizuj →', cls: 'btn-dismiss', onClick: closeAlert }],
      autoClose: 4000,
    })
  }, 2000)
}

// ── KROK 5 — Brak zasobów ───────────────────────────────────
function step5() {
  closeAlert()
  updateThreatStatus(threatId2, 'no_assets')

  showAlert({
    icon: '❌',
    title: 'BRAK ŚRODKÓW PRZECHWYTUJĄCYCH',
    variant: 'danger',
    body: `
      <b style="color:var(--danger)">Żaden system C-UAS nie może przechwycić zagrożenia:</b><br/><br/>
      <ul style="margin:6px 0 0 16px;line-height:1.8">
        <li>Alfa-3: <span style="color:var(--warning)">Przeładowanie</span> (ETA: 8 min)</li>
        <li>Beta-1: <span style="color:var(--danger)">Poza zasięgiem</span> (13 km)</li>
        <li>Gamma-2: <span style="color:var(--danger)">Serwis</span></li>
      </ul>
      <br/>
      <b>Zalecane działania:</b><br/>
      <span style="color:var(--warning)">→ Natychmiastowa ewakuacja Sektora C<br/>
      → Alert dla służb ratunkowych</span>
    `,
    actions: [
      { label: '🚨 EWAKUUJ SEKTOR C', cls: 'btn-evacuate', onClick: triggerEvacuation },
    ],
  })
}

async function triggerEvacuation() {
  closeAlert()
  await evacuate(threatId2, 'C')
  updateThreatStatus(threatId2, 'evacuation')

  showMobileNotif(
    '🚨 PILNA EWAKUACJA — Sektor C\nOpuść obszar NATYCHMIAST!\n\nTrasa 1: ul. Okulickiego → DK77\nTrasa 2: ul. Hutnicza → DK9',
    8000
  )
  toast('Ewakuacja sektora C zarządzona · 3 412 mieszkańców')
  setTimeout(() => runDemoStep(6), 3000)
}

// ── KROK 6 — Uderzenie + kaskada ────────────────────────────
function step6() {
  closeAlert()
  impactDrone2()
  updateThreatStatus(threatId2, 'impact')
  // Uderzenie — sektor C zniszczony, kaskada na B i D
  colorSector('C', 'threat')
  colorSector('B', 'cascade')
  colorSector('D', 'cascade')

  setTimeout(() => {
    showAlert({
      icon: '💥',
      title: 'UDERZENIE — SEKTOR C',
      variant: 'danger',
      body: `
        <b>Przepompownia Wody Centralnej</b> — ZNISZCZONA<br/><br/>
        Analiza kaskadowa aktywna…
      `,
      actions: [],
      autoClose: 2500,
    })
  }, 1500)

  setTimeout(() => {
    closeAlert()
    showCascade([
      { icon: '💧', name: 'Przepompownia Wody — ZNISZCZONA', hours: null, reason: 'Bezpośrednie uderzenie' },
      { icon: '🚒', name: 'Komenda PSP',        hours: 2,  reason: 'Brak ciśnienia w hydrantach' },
      { icon: '🏥', name: 'Szpital Powiatowy',  hours: 24, reason: 'Wyczerpanie rezerw wody (24h)' },
      { icon: '🏭', name: 'HSW S.A.',           hours: 4,  reason: 'Brak wody technologicznej' },
      { icon: '🚰', name: 'Stacja Uzdatniania', hours: 1,  reason: 'Brak dystrybucji — zbiorniki rosną' },
    ])
  }, 4500)
}

// ── Reset ────────────────────────────────────────────────────
function resetDemo() {
  currentStep = 0
  threatId1 = null
  threatId2 = null
  closeAlert()
  clearThreats()
  document.getElementById('cascade-panel').classList.add('hidden')
  document.getElementById('mobile-notif').classList.add('hidden')
  document.getElementById('toast').classList.add('hidden')
  resetMap()
  toast('🔄 Scenariusz zresetowany')
}
