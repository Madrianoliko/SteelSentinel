// ===== STEEL SENTINEL — GRAPH.JS =====
// vis.js — graf zależności infrastruktury

let graphNetwork = null;

const GRAPH_NODES = [
  { id: 1, label: "HSW S.A.", group: "industrial", title: "Huta Stalowa Wola — produkcja obronna" },
  { id: 2, label: "Szpital\nPowiatowy", group: "health", title: "Szpital Powiatowy im. PCK" },
  { id: 3, label: "GPZ\nEnergетyczna", group: "energy", title: "Stacja Elektroenergetyczna GPZ" },
  { id: 4, label: "Przepompownia\nWody", group: "water", title: "Przepompownia Wody Centralnej" },
  { id: 5, label: "Urząd\nMiasta", group: "administration", title: "Urząd Miasta Stalowa Wola" },
  { id: 6, label: "PSP\nKomenda", group: "rescue", title: "Komenda Miejska PSP" },
  { id: 7, label: "Mast\nTelekom.", group: "telecom", title: "Mast Telekomunikacyjny — Centrum" },
  { id: 8, label: "Most\nOkulickiego", group: "transport", title: "Most drogowy ul. Okulickiego" },
  { id: 9, label: "CZK", group: "administration", title: "Centrum Zarządzania Kryzysowego" },
  { id: 10, label: "Stacja\nUzdatniania", group: "water", title: "Stacja Uzdatniania Wody" },
];

const GRAPH_EDGES = [
  // GPZ zasila wszystkich
  { from: 3, to: 1, label: "⚡", title: "Zasilanie", color: "#ffeb3b", dashes: false },
  { from: 3, to: 2, label: "⚡", title: "Zasilanie", color: "#ffeb3b" },
  { from: 3, to: 4, label: "⚡", title: "Zasilanie pomp", color: "#ffeb3b" },
  { from: 3, to: 6, label: "⚡", title: "Zasilanie", color: "#ffeb3b" },
  { from: 3, to: 9, label: "⚡", title: "Zasilanie", color: "#ffeb3b" },
  { from: 3, to: 7, label: "⚡", title: "Zasilanie", color: "#ffeb3b" },

  // Woda
  { from: 10, to: 4, label: "💧", title: "Woda surowa", color: "#4fc3f7" },
  { from: 4, to: 2, label: "💧", title: "Woda dla szpitala", color: "#4fc3f7" },
  { from: 4, to: 6, label: "💧", title: "Ciśnienie hydrantów", color: "#4fc3f7" },
  { from: 4, to: 1, label: "💧", title: "Woda technologiczna", color: "#4fc3f7" },

  // Łączność
  { from: 7, to: 9, label: "📡", title: "Łączność", color: "#ce93d8" },
  { from: 7, to: 6, label: "📡", title: "Łączność radiowa", color: "#ce93d8" },
  { from: 7, to: 5, label: "📡", title: "Sieć miejska", color: "#ce93d8" },

  // Transport
  { from: 8, to: 2, label: "🚗", title: "Dostęp logistyczny", color: "#a5d6a7", dashes: true },
  { from: 8, to: 6, label: "🚗", title: "Dostęp wozów bojowych", color: "#a5d6a7", dashes: true },
  { from: 8, to: 1, label: "🚗", title: "Transport surowców", color: "#a5d6a7", dashes: true },
];

const GROUP_COLORS = {
  energy: { background: "#3e2c00", border: "#ffeb3b", font: { color: "#ffeb3b" } },
  water: { background: "#003040", border: "#4fc3f7", font: { color: "#4fc3f7" } },
  health: { background: "#1a0030", border: "#ce93d8", font: { color: "#ce93d8" } },
  telecom: { background: "#002020", border: "#80cbc4", font: { color: "#80cbc4" } },
  industrial: { background: "#1a0000", border: "#ef5350", font: { color: "#ef5350" } },
  administration: { background: "#001030", border: "#90caf9", font: { color: "#90caf9" } },
  rescue: { background: "#1a1000", border: "#ffcc80", font: { color: "#ffcc80" } },
  transport: { background: "#002000", border: "#a5d6a7", font: { color: "#a5d6a7" } },
};

function initGraph() {
  if (graphNetwork) return; // już zainicjalizowany

  const container = document.getElementById('graph-container');

  const nodes = new vis.DataSet(GRAPH_NODES.map(n => ({
    ...n,
    shape: 'box',
    borderWidth: 2,
    borderWidthSelected: 3,
    font: { color: GROUP_COLORS[n.group]?.font?.color || '#fff', size: 11 },
    color: {
      background: GROUP_COLORS[n.group]?.background || '#1e3a5f',
      border: GROUP_COLORS[n.group]?.border || '#4fc3f7',
      highlight: { background: '#1e3a5f', border: '#fff' },
    },
    margin: 8,
  })));

  const edges = new vis.DataSet(GRAPH_EDGES.map((e, i) => ({
    id: i,
    from: e.from,
    to: e.to,
    label: e.label,
    title: e.title,
    color: { color: e.color || '#4fc3f7', highlight: '#fff' },
    dashes: e.dashes || false,
    arrows: { to: { enabled: true, scaleFactor: 0.7 } },
    font: { size: 14, align: 'middle' },
    width: 2,
  })));

  graphNetwork = new vis.Network(container, { nodes, edges }, {
    physics: {
      enabled: true,
      stabilization: { iterations: 200 },
      barnesHut: { gravitationalConstant: -8000, springLength: 150 },
    },
    layout: { improvedLayout: true },
    interaction: { hover: true, tooltipDelay: 200 },
    edges: { smooth: { type: 'curvedCW', roundness: 0.2 } },
  });

  // Po kliknięciu węzła — pokaż szczegóły
  graphNetwork.on('click', (params) => {
    if (params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const node = GRAPH_NODES.find(n => n.id === nodeId);
      if (node) {
        console.log('Kliknięto węzeł:', node);
      }
    }
  });
}
