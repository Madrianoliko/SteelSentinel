// ===== STEEL SENTINEL — DEMO.JS =====
// Keyboard triggers i animacje dla scenariusza demo

let droneMarker1 = null, droneMarker2 = null;
let droneInterval1 = null, droneInterval2 = null;

// Ścieżka drona #1 (od wschodu, cel: HSW)
const DRONE1_PATH = [
  [50.5831, 22.1500],
  [50.5800, 22.1200],
  [50.5770, 22.1000],
  [50.5750, 22.0800],
  [50.5740, 22.0600],
  [50.5731, 22.0442], // HSW
];

// Ścieżka drona #2 (od północy, cel: Przepompownia)
const DRONE2_PATH = [
  [50.6200, 22.0700],
  [50.6100, 22.0680],
  [50.6000, 22.0660],
  [50.5920, 22.0650], // Stacja uzdatniania
  [50.5900, 22.0610], // Przepompownia
];

function demoStep(step) {
  switch(step) {
    case 1: step1_detectDrone1(); break;
    case 2: step2_aiRecommendation(); break;
    case 3: step3_intercept(); break;
    case 4: step4_detectDrone2(); break;
    case 5: step5_noAssets(); break;
    case 6: step6_impact(); break;
  }
}

// KROK 1 — Wykrycie drona #1
function step1_detectDrone1() {
  // Pokaż sensory
  document.getElementById('layer-sensors').checked = true;
  document.getElementById('layer-sensors').dispatchEvent(new Event('change'));

  // Twórz marker drona
  droneMarker1 = L.marker(DRONE1_PATH[0], {
    icon: L.divIcon({ html: '<div style="font-size:24px;filter:drop-shadow(0 0 6px red)">🚁</div>', className: '', iconSize: [30, 30] }),
    zIndexOffset: 1000,
  }).addTo(map);

  // Animacja lotu
  let step = 0;
  droneInterval1 = setInterval(() => {
    step++;
    if (step < DRONE1_PATH.length) {
      droneMarker1.setLatLng(DRONE1_PATH[step]);
      map.panTo(DRONE1_PATH[step], { animate: true, duration: 0.5 });
    } else {
      clearInterval(droneInterval1);
    }
  }, 600);

  // Alert
  setTimeout(() => {
    showAlert({
      icon: '🚨',
      title: 'WYKRYTO WROGIE BSP',
      body: 'Dron przeciwnika zbliża się od strony wschodniej.<br>Przewidywany cel: <b>HSW S.A.</b> (pewność: 87%)<br>Odległość: ~12 km | Prędkość: ~120 km/h',
      buttons: [],
      autoClose: 4000,
    });
    showMobileNotif('⚠️ ALERT — Sektor A\nWykryto wrogie BSP. Monitorowanie aktywne.');
  }, 1000);
}

// KROK 2 — Rekomendacja AI
function step2_aiRecommendation() {
  showAlert({
    icon: '🤖',
    title: 'REKOMENDACJA AI',
    body: `<b>Cel:</b> HSW S.A. (pewność 87%)<br><br>
           <b>Akcja:</b> Przechwycenie — Dron C-UAS <b>Alfa-3</b><br><br>
           <b>Uzasadnienie:</b> Dron Alfa-3 znajduje się 2,1 km od trasy.
           Czas przechwycenia: ~38s. Zasięg: wystarczający.<br><br>
           <i style="color:#90a4ae">Alternatywa: Beta-1 (czas: 90s — za wolno)</i>`,
    buttons: [
      { label: '🎯 ZESTRZEL', cls: 'btn-shoot', action: () => demoStep(3) },
      { label: 'Ignoruj', cls: 'btn-dismiss', action: closeAlert },
    ],
  });
}

// KROK 3 — Zestrzelenie drona #1
function step3_intercept() {
  closeAlert();
  if (droneInterval1) clearInterval(droneInterval1);

  // Animacja zestrzelenia
  if (droneMarker1) {
    droneMarker1.setIcon(L.divIcon({ html: '<div style="font-size:24px">💥</div>', className: '', iconSize: [30, 30] }));
    setTimeout(() => {
      if (droneMarker1) { map.removeLayer(droneMarker1); droneMarker1 = null; }
    }, 1500);
  }

  showAlert({
    icon: '✅',
    title: 'CEL ZNEUTRALIZOWANY',
    body: 'Dron C-UAS Alfa-3 przechwycił i zniszczył wrogie BSP.<br>Zagrożenie dla HSW S.A. zażegnane.',
    buttons: [{ label: 'OK', cls: 'btn-dismiss', action: closeAlert }],
    autoClose: 3000,
  });

  showMobileNotif('✅ Zagrożenie zneutralizowane.\nPowróć do normalnej aktywności.');
}

// KROK 4 — Wykrycie drona #2
function step4_detectDrone2() {
  droneMarker2 = L.marker(DRONE2_PATH[0], {
    icon: L.divIcon({ html: '<div style="font-size:24px;filter:drop-shadow(0 0 6px red)">🚁</div>', className: '', iconSize: [30, 30] }),
    zIndexOffset: 1000,
  }).addTo(map);

  let step = 0;
  droneInterval2 = setInterval(() => {
    step++;
    if (step < DRONE2_PATH.length) {
      droneMarker2.setLatLng(DRONE2_PATH[step]);
    } else {
      clearInterval(droneInterval2);
    }
  }, 700);

  showAlert({
    icon: '🚨',
    title: 'WYKRYTO DRUGIE BSP',
    body: 'Drugi dron zbliża się od północy.<br>Przewidywany cel: <b>Przepompownia Wody Centralnej</b> (pewność: 79%)<br>Czas do celu: ~50s',
    buttons: [],
    autoClose: 3500,
  });
}

// KROK 5 — Brak zasobów
function step5_noAssets() {
  showAlert({
    icon: '❌',
    title: 'BRAK DOSTĘPNYCH ŚRODKÓW',
    body: `<b style="color:#ef5350">Wszystkie drony C-UAS są poza zasięgiem lub niedostępne.</b><br><br>
           • Alfa-3: przeładowanie (ETA: 8 min)<br>
           • Beta-1: zbyt daleko (12 km od trasy)<br>
           • Gamma-2: serwis<br><br>
           Przechwycenie niemożliwe. Zalecana ewakuacja sektora C.`,
    buttons: [
      { label: '🚨 EWAKUUJ SEKTOR C', cls: 'btn-evacuate', action: () => { evacuateSector(); demoStep(6); } },
    ],
  });
}

function evacuateSector() {
  showMobileNotif('🚨 PILNA EWAKUACJA — Sektor C\nOpuść obszar natychmiast!\nKieruj się: ul. Okulickiego → DK77');
}

// KROK 6 — Uderzenie i kaskada
function step6_impact() {
  closeAlert();
  if (droneInterval2) clearInterval(droneInterval2);
  if (droneMarker2) {
    droneMarker2.setIcon(L.divIcon({ html: '<div style="font-size:30px">💥</div>', className: '', iconSize: [36, 36] }));
    setTimeout(() => { if (droneMarker2) { map.removeLayer(droneMarker2); droneMarker2 = null; } }, 1500);
  }

  // Podświetl sektor C na czerwono
  highlightSector();

  // Pokaż kaskadę
  setTimeout(() => {
    const panel = document.getElementById('cascade-panel');
    const list = document.getElementById('cascade-list');
    list.innerHTML = `
      <div class="cascade-item">
        <div>💧 <b>Przepompownia Wody</b> — ZNISZCZONA</div>
        <div class="impact-time">⏱ Natychmiastowo</div>
      </div>
      <div class="cascade-item">
        <div>🚒 Komenda PSP</div>
        <div class="impact-time">⏱ Skutek za: 2h</div>
        <div class="impact-reason">Brak ciśnienia w hydrantach</div>
      </div>
      <div class="cascade-item">
        <div>🏥 Szpital Powiatowy</div>
        <div class="impact-time">⏱ Skutek za: 6h</div>
        <div class="impact-reason">Wyczerpanie rezerw wody</div>
      </div>
      <div class="cascade-item">
        <div>🚰 Stacja Uzdatniania Wody</div>
        <div class="impact-time">⏱ Skutek za: 1h</div>
        <div class="impact-reason">Brak dystrybucji wody</div>
      </div>
    `;
    panel.classList.remove('hidden');
  }, 2000);
}

// ===== HELPERS =====

function showAlert({ icon, title, body, buttons = [], autoClose = null }) {
  document.getElementById('alert-icon').textContent = icon;
  document.getElementById('alert-title').textContent = title;
  document.getElementById('alert-body').innerHTML = body;

  const btns = document.getElementById('alert-buttons');
  btns.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.textContent = b.label;
    btn.className = b.cls;
    btn.onclick = b.action;
    btns.appendChild(btn);
  });

  document.getElementById('alert-overlay').classList.remove('hidden');

  if (autoClose) setTimeout(closeAlert, autoClose);
}

function closeAlert() {
  document.getElementById('alert-overlay').classList.add('hidden');
}

function showMobileNotif(text) {
  const notif = document.getElementById('mobile-notif');
  document.getElementById('mobile-notif-body').innerHTML = text.replace(/\n/g, '<br>');
  notif.classList.remove('hidden');
  setTimeout(() => notif.classList.add('hidden'), 5000);
}

function highlightSector() {
  L.circle([50.5900, 22.0610], {
    radius: 600,
    color: '#ef5350',
    fillColor: '#ef5350',
    fillOpacity: 0.25,
    weight: 2,
  }).addTo(map).bindTooltip('🔴 SEKTOR C — UDERZENIE');
}

function demoReset() {
  if (droneInterval1) clearInterval(droneInterval1);
  if (droneInterval2) clearInterval(droneInterval2);
  if (droneMarker1) { map.removeLayer(droneMarker1); droneMarker1 = null; }
  if (droneMarker2) { map.removeLayer(droneMarker2); droneMarker2 = null; }
  closeAlert();
  document.getElementById('cascade-panel').classList.add('hidden');
  document.getElementById('mobile-notif').classList.add('hidden');
  map.setView(STALOWA_WOLA, 14);
}

// ===== KEYBOARD TRIGGERS =====
document.addEventListener('keydown', (e) => {
  const key = e.key;
  if (key >= '1' && key <= '6') demoStep(parseInt(key));
  if (key === 'r' || key === 'R') demoReset();
});
