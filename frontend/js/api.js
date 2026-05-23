// ===== STEEL SENTINEL — API.JS =====
// Komunikacja z backendem FastAPI

const API_BASE = 'http://localhost:8000/api';

async function fetchInfrastructure(category = null) {
  const url = category ? `${API_BASE}/infrastructure/?category=${category}` : `${API_BASE}/infrastructure/`;
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    console.warn('Backend niedostępny, używam danych lokalnych.');
    return null;
  }
}

async function fetchGraph() {
  try {
    const res = await fetch(`${API_BASE}/graph/`);
    return await res.json();
  } catch (e) {
    console.warn('Backend niedostępny.');
    return null;
  }
}

async function fetchCascade(nodeId) {
  try {
    const res = await fetch(`${API_BASE}/infrastructure/${nodeId}/cascade`);
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function detectThreat(lat, lng, threatType = 'aerial_drone') {
  try {
    const res = await fetch(`${API_BASE}/threats/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng, threat_type: threatType }),
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}
