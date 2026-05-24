// ============================================================
// STEEL SENTINEL — Demo Scenario Controller
// ============================================================
import { showAlert, closeAlert, showSideAlert, closeSideAlert, showTopAlert, clearTopAlerts, showMobileNotif, showCascade, showCascadeRecommendations, toast } from './ui.js'
import { spawnDrone1, destroyDrone1, spawnDrone2, impactDrone2, resetMap, colorSector, centerMapOn, toggleAirDefense } from './map.js'
import { highlightDamaged } from './graph.js'
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
  // Automatycznie włącz warstwę ochrony powietrznej
  const airToggle = document.getElementById('toggle-air-defense')
  if (airToggle && !airToggle.checked) {
    airToggle.checked = true
    toggleAirDefense(true)
  }

  // Banner pojawia się od razu po uruchomieniu kroku
  showTopAlert({
    icon: '✈️',
    text: 'Nadlatujący obiekt BSP ze wschodu',
    onClick: () => centerMapOn(50.5787, 22.1150, 15),
  })

  // Wywołaj backend równolegle z lotem drona
  const resultPromise = detectThreat(50.5787, 22.1150, 'aerial_drone')

  // Dron leci — alerty pojawiają się dopiero po dotarciu do punktu detekcji
  spawnDrone1(async () => {
    const result = await resultPromise
    threatId1 = result?.threat_id ?? 1

    // Koloruj sektor zagrożony
    colorSector('D', 'threat')

    // Dodaj do threats view
    addThreat({
      id: threatId1,
      type: 'aerial_drone',
      target: 'HSW S.A. — Huta Stalowa Wola',
      confidence: 0.91,
      sector: 'D',
      ai: 'Przechwycenie — Alfa-3 (czas: ~38s, zasięg: wystarczający)',
    })

    showMobileNotif(
      '🚨 ALERT LOTNICZY — Błonia Nadsańskie\nWykryto wrogie BSP od wschodu (Pysznica).\n📷 IMINT potwierdzone · 🎙️ Audio potwierdzone.',
      7000
    )

    setTimeout(() => {
      showSideAlert({
        icon: '🚨',
        title: 'WYKRYTO WROGIE BSP',
        variant: 'danger',
        body: `
          <b>Miejsce detekcji:</b> Błonia Nadsańskie (Sektor D)<br/>
          <span style="font-family:monospace;font-size:10px;color:var(--text-muted)">
            50°34'43.3"N  22°06'54.0"E &nbsp;·&nbsp; 50.5787°N, 22.1150°E
          </span><br/><br/>
          <b>Kierunek:</b> Wschód (Pysznica) → Centrum → HSW<br/><br/>
          <b style="color:var(--accent)">Źródła detekcji:</b><br/>
          📷 <b>Kamera IMINT-E</b> <span style="color:var(--text-muted);font-size:10px">[CAM-E01 · 50.5790°N, 22.1050°E]</span><br/>
          🎙️ <b>Sensor Audio-E</b> <span style="color:var(--text-muted);font-size:10px">[AUD-E02 · 50.5800°N, 22.1400°E]</span><br/><br/>
          <b>Typ:</b> Shahed-podobny · ~115 km/h · 180 m AGL<br/>
          <b>Cel:</b> HSW S.A. &nbsp;·&nbsp; <b style="color:#00e676">Pewność AI: 91%</b>
        `,
        actions: [
          { label: '🤖 Wyświetl rekomendację AI', cls: 'btn-shoot', onClick: () => { closeSideAlert(); runDemoStep(2) } },
        ],
      })
    }, 600)
  })
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
  toast('🚁 Alfa-3 wysłany…', 1500)

  await interceptThreat(threatId1, 3)
  updateThreatStatus(threatId1, 'intercepted')
  colorSector('D', 'clear')

  // Alert pojawia się dopiero po faktycznym zestrzeleniu (~5s animacja + eksplozja)
  destroyDrone1(() => {
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
      autoClose: 3000,
      actions: [],
    })
    showMobileNotif('✅ Zagrożenie zneutralizowane.\nMożesz wrócić do normalnej aktywności.', 4000)

    // Automatycznie uruchom krok 4 po zamknięciu alertu
    setTimeout(() => runDemoStep(4), 3500)
  })
}

// ── KROK 4 — Dron #2 ────────────────────────────────────────
async function step4() {
  closeAlert()
  closeSideAlert()

  // Banner pojawia się od razu po uruchomieniu kroku
  showTopAlert({
    icon: '✈️',
    text: 'Nadlatujący obiekt BSP z północy',
    onClick: () => centerMapOn(50.5980, 22.0645, 15),
  })

  // API call równolegle z lotem
  const resultPromise = detectThreat(50.5900, 22.0610, 'aerial_drone')

  // Dron leci jako radar blip — alerty pojawiają się dopiero po wykryciu przez sensor audio
  spawnDrone2(async () => {
    const result = await resultPromise
    threatId2 = result?.threat_id ?? 2

    // Sektor F — zagrożenie, sektor E — narażony kaskadowo
    colorSector('F', 'threat')
    colorSector('E', 'cascade')

    addThreat({
      id: threatId2,
      type: 'aerial_drone',
      target: 'Elektrociepłownia Stalowa Wola',
      confidence: 0.79,
      sector: 'F',
      ai: 'Brak dostępnych środków C-UAS — rozważ ewakuację',
    })

    showMobileNotif(
      '🚨 ALERT LOTNICZY — Korytarz Północny\nWykryto wrogie BSP od północy (Nisko).\n🎙️ Audio potwierdzone · 📡 Radar potwierdzone.',
      7000
    )

    setTimeout(() => {
      showSideAlert({
        icon: '🚨',
        title: 'WYKRYTO WROGIE BSP',
        variant: 'danger',
        body: `
          <b>Miejsce detekcji:</b> Brandwica (Sektor F)<br/>
          <span style="font-family:monospace;font-size:10px;color:var(--text-muted)">
            50°35'52.8"N  22°03'52.2"E &nbsp;·&nbsp; 50.5980°N, 22.0645°E
          </span><br/><br/>
          <b>Kierunek:</b> Północ (Nisko) → Sektor F → Elektrociepłownia<br/><br/>
          <b style="color:var(--accent)">Źródła detekcji:</b><br/>
          🎙️ <b>Sensor Audio-N</b> <span style="color:var(--text-muted);font-size:10px">[AUD-N01 · 50.6050°N, 22.0650°E]</span><br/>
          📡 <b>Radar SW-1</b> <span style="color:var(--text-muted);font-size:10px">[RAD-SW1 · 50.5848°N, 22.0522°E]</span><br/><br/>
          <b>Typ:</b> Shahed-podobny · ~115 km/h · 180 m AGL<br/>
          <b>Cel:</b> Elektrociepłownia SW &nbsp;·&nbsp; <b style="color:#ffa726">Pewność AI: 79%</b>
        `,
        actions: [{ label: '🤖 Wyświetl rekomendację AI', cls: 'btn-shoot', onClick: () => { closeSideAlert(); runDemoStep(5) } }],
      })
    }, 600)
  })
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
      { label: '🚨 EWAKUUJ SEKTOR F', cls: 'btn-evacuate', onClick: triggerEvacuation },
    ],
  })
}

async function triggerEvacuation() {
  closeAlert()
  await evacuate(threatId2, 'F')
  updateThreatStatus(threatId2, 'evacuation')

  showMobileNotif(
    '🚨 PILNA EWAKUACJA — Sektor F\nOpuść obszar NATYCHMIAST!\n\nTrasa 1: ul. Okulickiego → DK77\nTrasa 2: ul. Hutnicza → DK9',
    8000
  )
  toast('Ewakuacja sektora F zarządzona · 3 412 mieszkańców')

  // Dron od razu startuje do celu
  runDemoStep(6)
}

// ── KROK 6 — Dron leci do celu → Uderzenie + kaskada ────────
function step6() {
  closeAlert()
  closeSideAlert()
  updateThreatStatus(threatId2, 'impact')
  colorSector('F', 'threat')
  colorSector('E', 'cascade')
  colorSector('H', 'cascade')

  // Dron leci od punktu detekcji do Elektrociepłowni — po dotarciu eksplozja
  impactDrone2(() => {
    showAlert({
      icon: '💥',
      title: 'UDERZENIE — ELEKTROCIEPŁOWNIA SW',
      variant: 'danger',
      body: `
        <b>Elektrociepłownia Stalowa Wola</b> — ZNISZCZONA<br/><br/>
        Analiza kaskadowa aktywna…
      `,
      actions: [],
      autoClose: 2500,
    })

    setTimeout(() => {
      closeAlert()
      showCascade([
        { icon: '🏭', name: 'Elektrociepłownia SW — ZNISZCZONA', hours: null, reason: 'Bezpośrednie uderzenie' },
        { icon: '⚡', name: 'Sieć energetyczna',  hours: 0,  reason: 'Utrata głównego źródła ciepła i prądu' },
        { icon: '🏥', name: 'Szpital Powiatowy',  hours: 4,  reason: 'Przejście na generator (72h rezerwa)' },
        { icon: '🏭', name: 'HSW S.A.',           hours: 2,  reason: 'Zatrzymanie linii produkcyjnych' },
        { icon: '🏠', name: 'Ogrzewanie miejskie',hours: 1,  reason: 'Brak ciepła dla 40 000 mieszkańców' },
      ])

      // Przycisk "Pokaż graf zależności"
      const cascadeContent = document.getElementById('cascade-content')
      const graphBtn = document.createElement('button')
      graphBtn.innerHTML = '🔗 Pokaż graf zależności'
      graphBtn.style.cssText = `
        margin-top:10px;width:100%;padding:7px 12px;
        background:rgba(59,158,255,0.1);
        border:1px solid #3b9eff55;border-radius:6px;
        color:#3b9eff;font-size:11px;font-weight:700;letter-spacing:0.8px;
        cursor:pointer;transition:background 0.2s;
      `
      graphBtn.addEventListener('mouseenter', () => graphBtn.style.background = 'rgba(59,158,255,0.2)')
      graphBtn.addEventListener('mouseleave', () => graphBtn.style.background = 'rgba(59,158,255,0.1)')
      graphBtn.addEventListener('click', () => {
        // Przełącz na zakładkę Graf (lazy-init obsłużony w main.js przez click)
        const navBtn = document.querySelector('.nav-btn[data-view="graph"]')
        if (navBtn) navBtn.click()
        // Poczekaj na inicjalizację grafu i podświetl zniszczony węzeł
        setTimeout(() => highlightDamaged(4, [2, 3, 79, 86]), 900)
      })
      cascadeContent.appendChild(graphBtn)

      // AI recovery recommendations appear after cascade items render
      setTimeout(() => {
        showCascadeRecommendations([
          { priority: 'critical', action: 'Uruchom agregaty awaryjne — Szpital Powiatowy SW (blok B)', time: '15 min' },
          { priority: 'critical', action: 'Odłącz uszkodzony węzeł od sieci energetycznej (GPZ Stalowa Wola)', time: '20 min' },
          { priority: 'high',     action: 'Przełącz HSW S.A. na zasilanie rezerwowe (linia 110 kV)', time: '2h' },
          { priority: 'high',     action: 'Skieruj tabor mobilny MPEC na dostawę ciepła dla szpitala', time: '45 min' },
          { priority: 'medium',   action: 'Otwórz punkty ciepłe dla 40 000 mieszkańców bez ogrzewania', time: '4h' },
        ])
      }, 1200)
    }, 3000)
  })
}

// ── Reset ────────────────────────────────────────────────────
function resetDemo() {
  currentStep = 0
  threatId1 = null
  threatId2 = null
  closeAlert()
  closeSideAlert()
  clearTopAlerts()
  clearThreats()
  document.getElementById('cascade-panel').classList.add('hidden')
  document.getElementById('mobile-notif').classList.add('hidden')
  document.getElementById('toast').classList.add('hidden')
  // Reset all 12 sectors
  ;['A','B','C','D','E','F','G','H','I','J','K','L'].forEach(s => colorSector(s, 'clear'))
  resetMap()
  toast('🔄 Scenariusz zresetowany')
}
