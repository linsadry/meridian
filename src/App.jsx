import { useState, useEffect, useCallback, useRef } from "react";
import { loadTurnos, saveTurno } from "./lib/db";

// ─── LUCIDE ICONS (SVG inline, no dep needed) ────────────────────────────────

const Icon = ({ d, size = 20, stroke = 1.5, color = "currentColor", fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((path, i) => <path key={i} d={path} />) : <path d={d} />}
  </svg>
);

const CirclePath = ({ children, size = 20, stroke = 1.5, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

// Icon paths
const ICONS = {
  timer: ["M12 6v6l4 2", "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"],
  history: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5", "M12 7v5l4 2"],
  chart: ["M3 3v18h18", "M7 16l4-4 4 4 4-4"],
  building: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  calendar: ["M8 2v4", "M16 2v4", "M3 10h18", "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"],
  plane: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  car: ["M5 17H3v-7l3.5-6.5A1 1 0 0 1 7.4 3h9.2a1 1 0 0 1 .9.5L21 10v7h-2", "M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0", "M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0", "M5 10h14"],
  home: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  stethoscope: ["M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3", "M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"],
  check: "M20 6 9 17l-5-5",
  x: ["M18 6 6 18", "M6 6l12 12"],
  chevronRight: "M9 18l6-6-6-6",
  plus: ["M12 5v14", "M5 12h14"],
  mapPin: ["M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z", "M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4"],
  moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  sun: ["M12 2v2", "M12 20v2", "M4.93 4.93l1.41 1.41", "M17.66 17.66l1.41 1.41", "M2 12h2", "M20 12h2", "M6.34 17.66l-1.41 1.41", "M19.07 4.93l-1.41 1.41", "M12 6a6 6 0 0 0 0 12 6 6 0 0 0 0-12z"],
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  leaf: "M2 22 16 8M8.5 11.5A8 8 0 0 1 20 2s1 14-10 14H8",
  compass: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"],
  layers: ["M12 2 2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  arrowRight: ["M5 12h14", "M12 5l7 7-7 7"],
  info: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 16v-4", "M12 8h.01"],
  bus: ["M6 17h12", "M6 11h12", "M4 5c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1h-1", "M3 18a1 1 0 0 0 1 1h1", "M14 20a2 2 0 1 0-4 0", "M3 11V5"],
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const CLINICAS = [
  { id: "hof", nome: "HOF", cidade: "Salvador, BA", tipo: "local", cor: "#7E9B8A" },
  { id: "iofs", nome: "IOFS", cidade: "Salvador, BA", tipo: "local", cor: "#7A8FAF" },
  { id: "oftalmodiagnose", nome: "Oftalmodiagnose", cidade: "Salvador, BA", tipo: "local", cor: "#A08060" },
  { id: "ame_piraja", nome: "AME Pirajá", cidade: "Salvador, BA", tipo: "local", cor: "#9E7A8A" },
  { id: "hob", nome: "HOB", cidade: "Salvador, BA", tipo: "local", cor: "#8A7AAF" },
  { id: "ivfs", nome: "IVFS", cidade: "Salvador, BA", tipo: "local", cor: "#7A9FAF" },
  { id: "floriano", nome: "Floriano", cidade: "Floriano, PI", tipo: "viagem", cor: "#AF9070" },
  { id: "paulo_afonso", nome: "Paulo Afonso", cidade: "Paulo Afonso, BA", tipo: "viagem", cor: "#AF7A7A" },
];

const MEIOS = ["Carro", "Avião", "Ônibus", "Moto", "Outro"];
const MEIOS_ICONS = { Carro: "car", Avião: "plane", Ônibus: "bus", Moto: "car", Outro: "mapPin" };

const HUMOR = [
  { v: "otimo", l: "Ótimo" }, { v: "bom", l: "Bom" },
  { v: "neutro", l: "Neutro" }, { v: "cansado", l: "Cansado" }, { v: "esgotado", l: "Esgotado" },
];

const TRANSITO = [{ v: "leve", l: "Leve" }, { v: "moderado", l: "Moderado" }, { v: "intenso", l: "Intenso" }];

// Desgaste system: abstract dots
const DESGASTE = [
  { v: 1, l: "Leve", sym: "○○○", cor: "#7E9B8A" },
  { v: 2, l: "Moderado", sym: "◐○○", cor: "#B09060" },
  { v: 3, l: "Intenso", sym: "◉○○", cor: "#B07060" },
  { v: 4, l: "Pesado", sym: "◉◐○", cor: "#9E6070" },
  { v: 5, l: "Extremo", sym: "◉◉◉", cor: "#8E5060" },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────

const fmt = (ms) => {
  if (!ms || ms <= 0) return "—";
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h === 0) return `${m}m`;
  return `${h}h${min > 0 ? `${String(min).padStart(2, "0")}` : ""}`;
};

const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";
const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};
const fmtDateFull = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts);
  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return `${dias[d.getDay()]}, ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
};

const getClinica = (id) => CLINICAS.find(c => c.id === id) || CLINICAS[0];
const now = () => Date.now();

const calcProd = (t) => {
  if (!t.atendimentoInicio || !t.atendimentoFim || !t.saidaCasa || !t.chegadaCasa) return null;
  return Math.round(((t.atendimentoFim - t.atendimentoInicio) / (t.chegadaCasa - t.saidaCasa)) * 100);
};

const calcDesgasteVal = (t) => {
  const base = t.desgaste || 2;
  if (t.missao) return Math.min(5, base + Math.min(2, (t.missao.tempoViagemEstimadoH || 0) / 5));
  return base;
};

const getDesgasteInfo = (val) => {
  if (val <= 1.5) return DESGASTE[0];
  if (val <= 2.5) return DESGASTE[1];
  if (val <= 3.5) return DESGASTE[2];
  if (val <= 4.5) return DESGASTE[3];
  return DESGASTE[4];
};

// Meridian Score: 0-100 sustainability index
const calcMeridianScore = (turnos) => {
  if (!turnos || turnos.length === 0) return null;
  const recent = turnos.slice(0, 14);
  let score = 100;
  const avgFora = recent.reduce((s, t) => s + (t.chegadaCasa ? (t.chegadaCasa - t.saidaCasa) / 3600000 : 0), 0) / recent.length;
  const avgTransito = recent.reduce((s, t) => {
    const ida = t.chegadaClinica ? (t.chegadaClinica - t.saidaCasa) / 3600000 : 0;
    const volta = t.chegadaCasa && t.atendimentoFim ? (t.chegadaCasa - t.atendimentoFim) / 3600000 : 0;
    return s + ida + volta;
  }, 0) / recent.length;
  const avgDesgaste = recent.reduce((s, t) => s + calcDesgasteVal(t), 0) / recent.length;
  const viagens = recent.filter(t => t.missao);
  const noitesFora = viagens.reduce((s, t) => s + (t.missao?.noites || 0), 0);

  score -= Math.max(0, (avgFora - 7) * 5);
  score -= Math.max(0, (avgTransito - 1.5) * 8);
  score -= (avgDesgaste - 1) * 8;
  score -= noitesFora * 3;

  return Math.max(0, Math.min(100, Math.round(score)));
};

const getMeridianLabel = (s) => {
  if (s === null) return { l: "—", cor: "var(--text3)", desc: "Sem dados suficientes" };
  if (s >= 80) return { l: "Sustentável", cor: "var(--sage)", desc: "Sua rotina está em equilíbrio" };
  if (s >= 60) return { l: "Atenção", cor: "var(--amber)", desc: "Sinais de sobrecarga moderada" };
  return { l: "Desgaste elevado", cor: "var(--wine)", desc: "Rotina comprometendo recuperação" };
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const mockHistorico = () => {
  const base = Date.now();
  const dia = 86400000;
  const raw = [
    { cid: "hof", da: 1, sh: 8, ch: 9, ih: 9.25, fh: 14.5, cch: 15.5, dg: 2, hm: "bom", tr: "leve" },
    { cid: "ame_piraja", da: 2, sh: 7, ch: 8.5, ih: 9, fh: 15, cch: 16.5, dg: 3, hm: "cansado", tr: "moderado" },
    { cid: "iofs", da: 4, sh: 8.5, ch: 9.25, ih: 9.5, fh: 13.5, cch: 14.5, dg: 2, hm: "bom", tr: "leve" },
    { cid: "oftalmodiagnose", da: 5, sh: 8, ch: 8.75, ih: 9, fh: 14, cch: 15, dg: 2, hm: "neutro", tr: "leve" },
    { cid: "hob", da: 7, sh: 7.5, ch: 9, ih: 9.25, fh: 13.5, cch: 15, dg: 3, hm: "cansado", tr: "moderado" },
    { cid: "ame_piraja", da: 9, sh: 7, ch: 8.5, ih: 9, fh: 15.5, cch: 17, dg: 4, hm: "esgotado", tr: "intenso" },
    { cid: "floriano", da: 14, sh: 9, ch: 9.5, ih: 10, fh: 16, cch: 16.5, dg: 3, hm: "neutro", tr: "leve", missao: { cidade: "Floriano, PI", tempoViagemEstimadoH: 7, meio: "Ônibus", noites: 2, diasConsecutivos: 3, hospedagemProxima: true } },
    { cid: "floriano", da: 13, sh: 8.5, ch: 9, ih: 9.5, fh: 16, cch: 16.5, dg: 3, hm: "neutro", tr: "leve", missao: { cidade: "Floriano, PI", tempoViagemEstimadoH: 7, meio: "Ônibus", noites: 2, diasConsecutivos: 3, hospedagemProxima: true } },
    { cid: "hof", da: 20, sh: 8, ch: 9, ih: 9.25, fh: 14, cch: 15.25, dg: 1, hm: "otimo", tr: "leve" },
    { cid: "ivfs", da: 22, sh: 8, ch: 8.75, ih: 9, fh: 13, cch: 14, dg: 2, hm: "bom", tr: "leve" },
    { cid: "paulo_afonso", da: 25, sh: 6, ch: 6.5, ih: 8, fh: 17, cch: 17.5, dg: 4, hm: "esgotado", tr: "intenso", missao: { cidade: "Paulo Afonso, BA", tempoViagemEstimadoH: 5, meio: "Carro", noites: 1, diasConsecutivos: 2, hospedagemProxima: false } },
    { cid: "hof", da: 28, sh: 8.5, ch: 9.25, ih: 9.5, fh: 14, cch: 15, dg: 2, hm: "bom", tr: "leve" },
  ];
  return raw.map((r, i) => {
    const d = base - r.da * dia;
    const h = (hr) => d + hr * 3600000;
    return {
      id: `m${i}`,
      clinicaId: r.cid,
      saidaCasa: h(r.sh),
      chegadaClinica: h(r.ch),
      atendimentoInicio: h(r.ih),
      atendimentoFim: h(r.fh),
      chegadaCasa: h(r.cch),
      desgaste: r.dg,
      humor: r.hm,
      transito: r.tr,
      missao: r.missao || null,
      observacoes: "",
      status: "concluido",
    };
  }).sort((a, b) => b.saidaCasa - a.saidaCasa);
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

  :root {
    --bg:    #0B0C0E;
    --bg1:   #0F1012;
    --bg2:   #141618;
    --bg3:   #191C1F;
    --bg4:   #1E2124;
    --bg5:   #23272B;
    --border: rgba(255,255,255,0.06);
    --border2: rgba(255,255,255,0.03);
    --text:  #EAE6E0;
    --text2: #9A958E;
    --text3: #5A5650;
    --text4: #3A3630;
    --sage:  #7E9B8A;
    --sage2: rgba(126,155,138,0.15);
    --amber: #A08C60;
    --amber2: rgba(160,140,96,0.15);
    --wine:  #9E6070;
    --wine2: rgba(158,96,112,0.15);
    --slate: #7A8FAF;
    --slate2: rgba(122,143,175,0.15);
    --dust:  #A08060;
    --dust2: rgba(160,128,96,0.15);
    --r: 14px;
    --r-sm: 10px;
    --r-lg: 20px;
    --r-xl: 28px;
    --font-d: 'Playfair Display', serif;
    --font: 'Outfit', sans-serif;
    --ease: cubic-bezier(0.4,0,0.2,1);
    --ease-out: cubic-bezier(0,0,0.2,1);
    --ease-spring: cubic-bezier(0.34,1.56,0.64,1);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
    height: 100dvh;
  }

  #root {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    max-width: 430px;
    margin: 0 auto;
    overflow: hidden;
    background: var(--bg);
    position: relative;
  }

  /* ── SCROLLABLE SCREEN ── */
  .screen {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 90px;
    scrollbar-width: none;
  }
  .screen::-webkit-scrollbar { display: none; }

  /* ── STATUS BAR ── */
  .status-bar {
    padding: 14px 24px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }
  .status-time { font-size: 15px; font-weight: 500; letter-spacing: -0.3px; }
  .status-name {
    font-family: var(--font-d);
    font-size: 13px;
    color: var(--text3);
    letter-spacing: 0.5px;
  }
  .status-icons { font-size: 12px; color: var(--text3); letter-spacing: 1px; }

  /* ── TAB BAR ── */
  .tab-bar {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: rgba(11,12,14,0.92);
    backdrop-filter: blur(24px) saturate(180%);
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-around;
    padding: 8px 4px 28px;
    z-index: 100;
  }
  .tab-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 12px;
    color: var(--text3);
    font-family: var(--font);
    transition: color 0.2s var(--ease);
    border-radius: 10px;
    position: relative;
  }
  .tab-btn.active { color: var(--text); }
  .tab-btn.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%; transform: translateX(-50%);
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--sage);
    opacity: 0.8;
  }
  .tab-label { font-size: 9.5px; font-weight: 500; letter-spacing: 0.3px; text-transform: uppercase; }

  /* ── PAGE HEADER ── */
  .page-header {
    padding: 20px 24px 16px;
  }
  .page-eyebrow {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text3);
    font-weight: 400;
    margin-bottom: 4px;
  }
  .page-title {
    font-family: var(--font-d);
    font-size: 30px;
    color: var(--text);
    line-height: 1.1;
    letter-spacing: -0.3px;
  }
  .page-sub {
    font-size: 13px;
    color: var(--text3);
    margin-top: 4px;
    font-weight: 300;
  }

  /* ── CARDS ── */
  .card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r);
    transition: all 0.2s var(--ease);
  }
  .card:active { transform: scale(0.99); opacity: 0.92; }

  .card-p { padding: 18px 20px; }
  .card-p-lg { padding: 22px 24px; }

  .mx { margin: 0 16px 10px; }
  .mx-sm { margin: 0 16px 8px; }

  .card-eyebrow {
    font-size: 9.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text3);
    font-weight: 400;
    margin-bottom: 6px;
  }
  .card-value {
    font-family: var(--font-d);
    font-size: 34px;
    color: var(--text);
    line-height: 1;
    letter-spacing: -1px;
  }
  .card-value-md {
    font-family: var(--font-d);
    font-size: 24px;
    color: var(--text);
    line-height: 1;
    letter-spacing: -0.5px;
  }
  .card-sub {
    font-size: 11px;
    color: var(--text3);
    margin-top: 4px;
    font-weight: 300;
  }

  /* ── GRID ── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0 16px 10px; }
  .grid-2 .card { margin: 0; }

  /* ── SECTION LABEL ── */
  .section-lbl {
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text3);
    font-weight: 400;
    padding: 0 24px;
    margin-bottom: 10px;
    margin-top: 6px;
  }

  /* ── DIVIDER ── */
  .divider { height: 1px; background: var(--border2); margin: 4px 24px; }

  /* ─────────────────────────────
     ACTIVE SHIFT CARD
  ───────────────────────────── */
  .shift-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    margin: 0 16px 12px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .shift-card::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 180px; height: 180px;
    border-radius: 50%;
    pointer-events: none;
    transition: opacity 1s ease;
  }
  .shift-card.fase-transito::before { background: radial-gradient(circle, rgba(122,143,175,0.08) 0%, transparent 70%); }
  .shift-card.fase-clinica::before { background: radial-gradient(circle, rgba(126,155,138,0.1) 0%, transparent 70%); }
  .shift-card.fase-atend::before { background: radial-gradient(circle, rgba(126,155,138,0.14) 0%, transparent 70%); }
  .shift-card.fase-retorno::before { background: radial-gradient(circle, rgba(160,128,96,0.1) 0%, transparent 70%); }

  .shift-clinica-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .shift-clinica-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 6px 14px 6px 10px;
    font-size: 13px;
    font-weight: 400;
  }
  .clinica-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .live-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--sage);
    font-weight: 400;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  .live-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--sage);
    animation: pulse-dot 2.5s ease infinite;
  }

  .shift-fase-lbl {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text3);
    margin-bottom: 4px;
    font-weight: 400;
  }
  .shift-timer {
    font-family: var(--font-d);
    font-size: 56px;
    color: var(--text);
    line-height: 1;
    letter-spacing: -3px;
    margin-bottom: 2px;
    font-style: italic;
  }
  .shift-since {
    font-size: 12px;
    color: var(--text3);
    font-weight: 300;
    margin-bottom: 24px;
  }

  /* ── FASE PROGRESS ── */
  .fase-track {
    display: flex;
    gap: 3px;
    margin-bottom: 22px;
  }
  .fase-seg {
    flex: 1; height: 2px;
    background: var(--bg5);
    border-radius: 1px;
    transition: background 0.5s var(--ease);
  }
  .fase-seg.done { background: var(--sage); opacity: 0.7; }
  .fase-seg.cur { background: var(--sage); }

  /* ── ACTION BUTTONS ── */
  .actions-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .action-btn {
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 14px 14px 12px;
    cursor: pointer;
    font-family: var(--font);
    text-align: left;
    color: var(--text);
    transition: all 0.18s var(--ease);
    position: relative;
    overflow: hidden;
  }
  .action-btn:active:not(.done-btn) { transform: scale(0.97); background: rgba(255,255,255,0.06); }
  .action-btn.cur-btn {
    background: rgba(126,155,138,0.08);
    border-color: rgba(126,155,138,0.25);
  }
  .action-btn.done-btn {
    opacity: 0.38;
    pointer-events: none;
  }
  .action-icon-wrap {
    margin-bottom: 8px;
    color: var(--text3);
  }
  .action-btn.cur-btn .action-icon-wrap { color: var(--sage); }
  .action-lbl {
    font-size: 12px;
    font-weight: 400;
    color: var(--text2);
    line-height: 1.3;
    margin-bottom: 2px;
  }
  .action-time {
    font-size: 11px;
    color: var(--sage);
    font-weight: 300;
  }
  .action-check {
    position: absolute;
    top: 10px; right: 10px;
    color: var(--sage);
    opacity: 0.7;
  }

  /* ── ENCERRAR BTN ── */
  .encerrar-btn {
    width: 100%;
    background: linear-gradient(135deg, rgba(126,155,138,0.15), rgba(126,155,138,0.08));
    border: 1px solid rgba(126,155,138,0.25);
    border-radius: var(--r);
    padding: 14px;
    color: var(--sage);
    font-family: var(--font);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 12px;
    letter-spacing: 0.3px;
    transition: all 0.2s var(--ease);
  }
  .encerrar-btn:active { transform: scale(0.98); }

  /* ─────────────────────────────
     START SHIFT FLOW
  ───────────────────────────── */
  .tipo-cards { display: flex; flex-direction: column; gap: 8px; padding: 0 16px; }
  .tipo-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 20px 22px;
    cursor: pointer;
    font-family: var(--font);
    text-align: left;
    transition: all 0.2s var(--ease);
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .tipo-card:active { transform: scale(0.99); }
  .tipo-card:hover { border-color: rgba(255,255,255,0.1); background: var(--bg3); }
  .tipo-card-icon {
    width: 44px; height: 44px;
    border-radius: 12px;
    background: var(--bg4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text2);
    flex-shrink: 0;
  }
  .tipo-card-title { font-size: 15px; font-weight: 500; color: var(--text); margin-bottom: 2px; }
  .tipo-card-sub { font-size: 12px; color: var(--text3); font-weight: 300; }

  /* CLINICA PICKER */
  .sheet {
    position: fixed;
    bottom: 0;
    left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 430px;
    background: var(--bg1);
    border-radius: var(--r-xl) var(--r-xl) 0 0;
    border-top: 1px solid var(--border);
    z-index: 200;
    padding: 16px 20px 48px;
    max-height: 88vh;
    overflow-y: auto;
    scrollbar-width: none;
    animation: sheetUp 0.32s var(--ease-out) both;
  }
  .sheet::-webkit-scrollbar { display: none; }
  @keyframes sheetUp {
    from { transform: translateX(-50%) translateY(100%); }
    to   { transform: translateX(-50%) translateY(0); }
  }
  .overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 150;
    backdrop-filter: blur(6px);
    animation: fadeOv 0.25s ease both;
  }
  @keyframes fadeOv { from { opacity: 0; } to { opacity: 1; } }

  .sheet-handle {
    width: 36px; height: 3.5px;
    background: var(--bg5);
    border-radius: 2px;
    margin: 0 auto 18px;
  }
  .sheet-title {
    font-family: var(--font-d);
    font-size: 22px;
    margin-bottom: 6px;
    padding: 0 4px;
  }
  .sheet-sub {
    font-size: 12px;
    color: var(--text3);
    padding: 0 4px;
    margin-bottom: 18px;
    font-weight: 300;
  }

  .clinica-list { display: flex; flex-direction: column; gap: 6px; }
  .clinica-opt {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 14px 18px;
    cursor: pointer;
    font-family: var(--font);
    display: flex;
    align-items: center;
    gap: 14px;
    transition: all 0.18s var(--ease);
  }
  .clinica-opt:active { transform: scale(0.99); }
  .clinica-opt.sel { border-color: rgba(126,155,138,0.3); background: rgba(126,155,138,0.06); }
  .clinica-opt-dot-lg { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  .clinica-opt-nome { font-size: 14px; font-weight: 400; color: var(--text); }
  .clinica-opt-cidade { font-size: 11px; color: var(--text3); font-weight: 300; margin-top: 1px; }
  .clinica-badge-viagem {
    margin-left: auto;
    font-size: 10px;
    color: var(--amber);
    background: var(--amber2);
    border-radius: 100px;
    padding: 3px 8px;
    letter-spacing: 0.5px;
  }

  /* FORM */
  .form-group { margin-bottom: 16px; }
  .form-lbl {
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text3);
    display: block;
    margin-bottom: 8px;
    font-weight: 400;
  }
  .form-input {
    width: 100%;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 11px 14px;
    color: var(--text);
    font-family: var(--font);
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s var(--ease);
  }
  .form-input:focus { border-color: rgba(126,155,138,0.35); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 100px;
    padding: 7px 14px;
    font-size: 12px;
    font-weight: 400;
    cursor: pointer;
    font-family: var(--font);
    color: var(--text2);
    transition: all 0.18s var(--ease);
    display: flex; align-items: center; gap: 6px;
  }
  .chip.sel {
    background: rgba(126,155,138,0.12);
    border-color: rgba(126,155,138,0.35);
    color: var(--sage);
  }

  .btn-primary {
    width: 100%;
    background: var(--bg3);
    border: 1px solid rgba(126,155,138,0.25);
    border-radius: var(--r);
    padding: 14px;
    color: var(--text);
    font-family: var(--font);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 8px;
    transition: all 0.2s var(--ease);
    letter-spacing: 0.2px;
  }
  .btn-primary:active { transform: scale(0.98); }
  .btn-secondary {
    width: 100%;
    background: none;
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 12px;
    color: var(--text3);
    font-family: var(--font);
    font-size: 13px;
    cursor: pointer;
    margin-top: 6px;
    transition: all 0.2s var(--ease);
  }

  /* ─────────────────────────────
     ENCERRAR SHEET
  ───────────────────────────── */
  .summary-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border2);
  }
  .summary-clinica-nome { font-family: var(--font-d); font-size: 22px; }
  .summary-missao-tag {
    margin-left: auto;
    font-size: 10px;
    color: var(--amber);
    background: var(--amber2);
    border-radius: 100px;
    padding: 4px 10px;
    letter-spacing: 0.5px;
    font-weight: 400;
    display: flex; align-items: center; gap: 5px;
  }

  /* Timeline */
  .timeline {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .tl-row {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    position: relative;
  }
  .tl-left {
    width: 42px;
    flex-shrink: 0;
    text-align: right;
    padding-top: 2px;
  }
  .tl-time {
    font-size: 11px;
    color: var(--text3);
    font-weight: 300;
    font-variant-numeric: tabular-nums;
  }
  .tl-spine {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    width: 16px;
    flex-shrink: 0;
  }
  .tl-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    border: 1.5px solid var(--text3);
    background: var(--bg1);
    flex-shrink: 0;
    margin-top: 3px;
  }
  .tl-dot.filled { background: var(--sage); border-color: var(--sage); }
  .tl-line {
    width: 1px;
    flex: 1;
    background: var(--border);
    min-height: 20px;
  }
  .tl-content {
    padding: 0 0 16px;
    flex: 1;
  }
  .tl-lbl { font-size: 12px; color: var(--text2); font-weight: 400; padding-top: 2px; }
  .tl-dur { font-size: 10px; color: var(--text3); font-weight: 300; margin-top: 1px; }

  .prod-section { margin-bottom: 16px; }
  .prod-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .prod-lbl { font-size: 12px; color: var(--text3); font-weight: 300; }
  .prod-val { font-size: 13px; font-weight: 500; }
  .prod-track {
    height: 3px;
    background: var(--bg4);
    border-radius: 2px;
    overflow: hidden;
  }
  .prod-fill {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--sage), rgba(126,155,138,0.6));
    transition: width 0.8s var(--ease-out);
  }

  /* Desgaste System */
  .desgaste-sym {
    font-size: 15px;
    letter-spacing: 3px;
    font-family: monospace;
  }

  /* ─────────────────────────────
     HISTÓRICO
  ───────────────────────────── */
  .turno-item {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r);
    margin: 0 16px 8px;
    padding: 16px 18px;
    cursor: pointer;
    transition: all 0.2s var(--ease);
  }
  .turno-item:active { transform: scale(0.99); }

  .ti-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .ti-clinica {
    display: flex; align-items: center; gap: 9px;
    font-size: 14px; font-weight: 500; color: var(--text);
  }
  .ti-date { font-size: 11px; color: var(--text3); font-weight: 300; }

  .ti-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    margin-bottom: 12px;
    background: var(--bg3);
    border-radius: var(--r-sm);
    padding: 10px;
  }
  .ti-metric { text-align: center; }
  .ti-metric-val { font-size: 15px; font-weight: 500; color: var(--text); font-family: var(--font-d); }
  .ti-metric-lbl { font-size: 9.5px; color: var(--text3); margin-top: 2px; font-weight: 300; letter-spacing: 0.3px; }

  .ti-tags { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .ti-tag {
    font-size: 10.5px;
    color: var(--text3);
    background: var(--bg3);
    border-radius: 100px;
    padding: 3px 10px;
    font-weight: 300;
    display: flex; align-items: center; gap: 4px;
  }
  .ti-tag.missao { color: var(--amber); background: var(--amber2); }
  .ti-tag.prod { color: var(--sage); background: var(--sage2); }
  .ti-tag.prod-warn { color: var(--amber); background: var(--amber2); }
  .ti-tag.prod-low { color: var(--wine); background: var(--wine2); }

  /* ─────────────────────────────
     ANALYTICS
  ───────────────────────────── */
  .toggle-row {
    display: flex;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    padding: 3px;
    margin: 0 16px 14px;
  }
  .toggle-btn {
    flex: 1;
    padding: 7px;
    border: none;
    border-radius: 8px;
    font-family: var(--font);
    font-size: 12px;
    font-weight: 400;
    cursor: pointer;
    color: var(--text3);
    background: none;
    transition: all 0.2s var(--ease);
    letter-spacing: 0.2px;
  }
  .toggle-btn.active {
    background: var(--bg4);
    color: var(--text);
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  /* Bar charts */
  .bar-section { padding: 0 16px; margin-bottom: 18px; }
  .bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
  .bar-name { font-size: 12px; color: var(--text2); width: 88px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 300; }
  .bar-track {
    flex: 1;
    height: 24px;
    background: var(--bg3);
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }
  .bar-fill {
    height: 100%;
    border-radius: 6px;
    display: flex; align-items: center;
    padding-left: 10px;
    font-size: 11px;
    font-weight: 400;
    color: rgba(255,255,255,0.7);
    transition: width 0.9s var(--ease-out);
    min-width: 36px;
  }

  /* Meridian Score */
  .meridian-score-card {
    background: linear-gradient(145deg, var(--bg2), var(--bg3));
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    margin: 0 16px 12px;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .meridian-score-card::before {
    content: '';
    position: absolute;
    bottom: -40px; right: -40px;
    width: 160px; height: 160px;
    border-radius: 50%;
    pointer-events: none;
  }
  .meridian-score-card.sustentavel::before { background: radial-gradient(circle, rgba(126,155,138,0.1) 0%, transparent 70%); }
  .meridian-score-card.atencao::before { background: radial-gradient(circle, rgba(160,140,96,0.1) 0%, transparent 70%); }
  .meridian-score-card.desgaste::before { background: radial-gradient(circle, rgba(158,96,112,0.1) 0%, transparent 70%); }

  .ms-num {
    font-family: var(--font-d);
    font-size: 64px;
    line-height: 1;
    letter-spacing: -3px;
    margin-bottom: 4px;
  }
  .ms-label { font-size: 13px; font-weight: 400; margin-bottom: 2px; }
  .ms-desc { font-size: 11px; color: var(--text3); font-weight: 300; margin-bottom: 20px; }
  .ms-track {
    height: 3px;
    background: var(--bg5);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 12px;
  }
  .ms-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 1s var(--ease-out);
  }
  .ms-bands {
    display: flex;
    justify-content: space-between;
    font-size: 9.5px;
    color: var(--text4);
    letter-spacing: 0.3px;
    font-weight: 400;
  }

  /* Insight cards */
  .insight {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r);
    padding: 14px 16px;
    margin: 0 16px 8px;
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }
  .insight-icon { color: var(--text3); flex-shrink: 0; margin-top: 1px; }
  .insight-text { font-size: 12px; color: var(--text2); line-height: 1.55; font-weight: 300; }
  .insight-text strong { color: var(--text); font-weight: 500; }

  /* ─────────────────────────────
     CLÍNICAS TAB
  ───────────────────────────── */
  .clinica-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: var(--r);
    margin: 0 16px 10px;
    padding: 18px 20px;
  }
  .cc-header {
    display: flex; align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .cc-nome {
    display: flex; align-items: center; gap: 10px;
    font-size: 15px; font-weight: 500;
  }
  .cc-count { font-size: 11px; color: var(--text3); font-weight: 300; }
  .cc-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 14px;
  }
  .cc-stat {
    background: var(--bg3);
    border-radius: var(--r-sm);
    padding: 10px;
    text-align: center;
  }
  .cc-stat-val { font-family: var(--font-d); font-size: 17px; color: var(--text); }
  .cc-stat-lbl { font-size: 9.5px; color: var(--text3); margin-top: 2px; font-weight: 300; letter-spacing: 0.3px; }

  .sustent-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .sustent-lbl { font-size: 10px; color: var(--text3); width: 90px; flex-shrink: 0; font-weight: 300; }
  .sustent-track { flex: 1; height: 3px; background: var(--bg4); border-radius: 2px; overflow: hidden; }
  .sustent-fill { height: 100%; border-radius: 2px; transition: width 0.8s var(--ease-out); }
  .sustent-val { font-size: 11px; font-weight: 500; width: 30px; text-align: right; }

  /* ─────────────────────────────
     SEMANA TAB
  ───────────────────────────── */
  .week-bars {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    height: 90px;
    padding: 0 16px;
    margin-bottom: 8px;
  }
  .wb-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    height: 100%;
    justify-content: flex-end;
  }
  .wb-bar-wrap {
    width: 100%;
    display: flex;
    align-items: flex-end;
    flex: 1;
  }
  .wb-bar {
    width: 100%;
    border-radius: 4px 4px 3px 3px;
    min-height: 3px;
    transition: height 0.6s var(--ease-out);
    opacity: 0.75;
  }
  .wb-lbl { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; }
  .wb-val { font-size: 9.5px; color: var(--text3); font-weight: 300; }

  .week-labels {
    display: flex;
    gap: 8px;
    padding: 0 16px;
    margin-bottom: 16px;
  }
  .week-label { flex: 1; text-align: center; font-size: 9px; color: var(--text4); text-transform: uppercase; letter-spacing: 0.5px; }

  /* ─────────────────────────────
     ANIMATIONS
  ───────────────────────────── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fu { animation: fadeUp 0.38s var(--ease-out) both; }
  .fu-1 { animation-delay: 0.05s; }
  .fu-2 { animation-delay: 0.10s; }
  .fu-3 { animation-delay: 0.15s; }
  .fu-4 { animation-delay: 0.20s; }

  /* ── EMPTY STATE ── */
  .empty {
    display: flex; flex-direction: column;
    align-items: center;
    padding: 72px 32px;
    text-align: center;
    color: var(--text3);
    gap: 12px;
  }
  .empty-title { font-family: var(--font-d); font-size: 20px; color: var(--text2); }
  .empty-sub { font-size: 13px; font-weight: 300; line-height: 1.6; }
`;

// ─── HOOKS ───────────────────────────────────────────────────────────────────

const useClock = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return t;
};

const useDuration = (start) => {
  const [d, setD] = useState(start ? Date.now() - start : 0);
  useEffect(() => {
    if (!start) return;
    const i = setInterval(() => setD(Date.now() - start), 1000);
    return () => clearInterval(i);
  }, [start]);
  return d;
};

// ─── TAB BAR ─────────────────────────────────────────────────────────────────

const TabBar = ({ active, onChange }) => {
  const tabs = [
    { id: "turno", icon: "timer", label: "Turno" },
    { id: "historico", icon: "history", label: "Histórico" },
    { id: "analytics", icon: "chart", label: "Analytics" },
    { id: "clinicas", icon: "building", label: "Clínicas" },
    { id: "semana", icon: "calendar", label: "Semana" },
  ];
  return (
    <div className="tab-bar">
      {tabs.map(t => (
        <button key={t.id} className={`tab-btn${active === t.id ? " active" : ""}`} onClick={() => onChange(t.id)}>
          <Icon d={ICONS[t.icon]} size={19} stroke={active === t.id ? 1.8 : 1.4}
            color={active === t.id ? "var(--text)" : "var(--text3)"} />
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </div>
  );
};

// ─── TELA: TURNO ─────────────────────────────────────────────────────────────

const fases = [
  { key: "chegadaClinica", icon: "building", label: "Cheguei na clínica" },
  { key: "atendimentoInicio", icon: "stethoscope", label: "Iniciei atendimentos" },
  { key: "atendimentoFim", icon: "check", label: "Finalizei atendimentos" },
  { key: "chegadaCasa", icon: "home", label: "Cheguei em casa" },
];

const getFaseClasse = (turno) => {
  if (!turno.chegadaClinica) return "fase-transito";
  if (!turno.atendimentoInicio) return "fase-clinica";
  if (!turno.atendimentoFim) return "fase-atend";
  return "fase-retorno";
};

const getFaseLbl = (turno) => {
  if (!turno.chegadaClinica) return "Em deslocamento";
  if (!turno.atendimentoInicio) return "Na clínica";
  if (!turno.atendimentoFim) return "Em atendimento";
  if (!turno.chegadaCasa) return "Retornando";
  return "Concluído";
};

const TurnoAtivo = ({ turno, onAction, onEncerrar }) => {
  const dur = useDuration(turno.saidaCasa);
  const faseAtual = fases.findIndex(f => !turno[f.key]);
  const clinica = getClinica(turno.clinicaId);

  return (
    <div className={`shift-card ${getFaseClasse(turno)} fu`}>
      <div className="shift-clinica-row">
        <div className="shift-clinica-pill">
          <div className="clinica-dot" style={{ background: clinica.cor }} />
          <span style={{ fontSize: 13, color: "var(--text2)", fontWeight: 400 }}>{clinica.nome}</span>
          {turno.missao && (
            <span style={{ fontSize: 10, color: "var(--amber)", marginLeft: 2, display: "flex", alignItems: "center", gap: 3 }}>
              <Icon d={ICONS.plane} size={10} stroke={1.5} color="var(--amber)" /> Missão
            </span>
          )}
        </div>
        <div className="live-pill">
          <div className="live-dot" />
          <span>Live</span>
        </div>
      </div>

      <div className="fase-track">
        {fases.map((f, i) => (
          <div key={f.key} className={`fase-seg${turno[f.key] ? " done" : i === faseAtual ? " cur" : ""}`} />
        ))}
      </div>

      <div className="shift-fase-lbl">{getFaseLbl(turno)}</div>
      <div className="shift-timer">{fmt(dur)}</div>
      <div className="shift-since">Saída às {fmtTime(turno.saidaCasa)}</div>

      <div className="actions-grid">
        {fases.map((f, i) => {
          const isDone = !!turno[f.key];
          const isCur = i === faseAtual;
          return (
            <button key={f.key}
              className={`action-btn${isDone ? " done-btn" : isCur ? " cur-btn" : ""}`}
              onClick={() => isCur && onAction(f.key)}>
              {isDone && (
                <div className="action-check">
                  <Icon d={ICONS.check} size={14} stroke={2} color="var(--sage)" />
                </div>
              )}
              <div className="action-icon-wrap">
                <Icon d={ICONS[f.icon]} size={18} stroke={1.4} />
              </div>
              <div className="action-lbl">{f.label}</div>
              {isDone && <div className="action-time">{fmtTime(turno[f.key])}</div>}
            </button>
          );
        })}
      </div>

      {turno.chegadaCasa && (
        <button className="encerrar-btn" onClick={onEncerrar}>
          Encerrar turno
        </button>
      )}
    </div>
  );
};

// ─── START SHIFT ─────────────────────────────────────────────────────────────

const StartShift = ({ onIniciar }) => {
  const [step, setStep] = useState("tipo");
  const [tipo, setTipo] = useState(null);
  const [clinica, setClinica] = useState(null);
  const [missao, setMissao] = useState({ cidade: "", meio: "Carro", noites: 1, diasConsecutivos: 1, tempoViagemEstimadoH: 0, hospedagemProxima: false });

  const confirmar = (c = clinica, m = null) => {
    onIniciar({ clinicaId: c.id, saidaCasa: now(), missao: m });
  };

  return (
    <div>
      {step === "tipo" && (
        <div className="tipo-cards fu">
          <button className="tipo-card" onClick={() => { setTipo("local"); setStep("clinica"); }}>
            <div className="tipo-card-icon">
              <Icon d={ICONS.building} size={22} stroke={1.3} color="var(--text2)" />
            </div>
            <div>
              <div className="tipo-card-title">Atendimento local</div>
              <div className="tipo-card-sub">Clínica na mesma cidade</div>
            </div>
            <Icon d={ICONS.chevronRight} size={16} stroke={1.5} color="var(--text3)" style={{ marginLeft: "auto" }} />
          </button>
          <button className="tipo-card" onClick={() => { setTipo("viagem"); setStep("clinica"); }}>
            <div className="tipo-card-icon">
              <Icon d={ICONS.plane} size={22} stroke={1.3} color="var(--text2)" />
            </div>
            <div>
              <div className="tipo-card-title">Viagem profissional</div>
              <div className="tipo-card-sub">Missão em outra cidade</div>
            </div>
            <Icon d={ICONS.chevronRight} size={16} stroke={1.5} color="var(--text3)" style={{ marginLeft: "auto" }} />
          </button>
        </div>
      )}

      {step === "clinica" && (
        <>
          <div className="overlay" onClick={() => setStep("tipo")} />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-title">Selecionar clínica</div>
            <div className="sheet-sub">
              {tipo === "local" ? "Atendimento local · Salvador" : "Clínicas disponíveis para missão"}
            </div>
            <div className="clinica-list">
              {CLINICAS.filter(c => tipo === "local" ? c.tipo === "local" : true).map(c => (
                <button key={c.id} className={`clinica-opt${clinica?.id === c.id ? " sel" : ""}`}
                  onClick={() => {
                    setClinica(c);
                    if (c.tipo === "viagem" || tipo === "viagem") {
                      setMissao(m => ({ ...m, cidade: c.cidade }));
                      setStep("missao");
                    } else {
                      confirmar(c, null);
                    }
                  }}>
                  <div className="clinica-opt-dot-lg" style={{ background: c.cor }} />
                  <div>
                    <div className="clinica-opt-nome">{c.nome}</div>
                    <div className="clinica-opt-cidade">{c.cidade}</div>
                  </div>
                  {c.tipo === "viagem" && <div className="clinica-badge-viagem">Missão</div>}
                </button>
              ))}
            </div>
            <button className="btn-secondary" onClick={() => setStep("tipo")}>Voltar</button>
          </div>
        </>
      )}

      {step === "missao" && clinica && (
        <>
          <div className="overlay" />
          <div className="sheet">
            <div className="sheet-handle" />
            <div className="sheet-title">Detalhes da missão</div>
            <div className="sheet-sub">{clinica.nome} · {missao.cidade}</div>

            <div className="form-group">
              <label className="form-lbl">Meio de transporte</label>
              <div className="chips">
                {MEIOS.map(m => (
                  <button key={m} className={`chip${missao.meio === m ? " sel" : ""}`}
                    onClick={() => setMissao(d => ({ ...d, meio: m }))}>
                    <Icon d={ICONS[MEIOS_ICONS[m]]} size={13} stroke={1.4} />
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-lbl">Tempo de viagem (h)</label>
                <input className="form-input" type="number" min="0" max="30"
                  value={missao.tempoViagemEstimadoH}
                  onChange={e => setMissao(d => ({ ...d, tempoViagemEstimadoH: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-lbl">Noites fora</label>
                <input className="form-input" type="number" min="0" max="30"
                  value={missao.noites}
                  onChange={e => setMissao(d => ({ ...d, noites: +e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-lbl">Dias consecutivos</label>
              <input className="form-input" type="number" min="1" max="14"
                value={missao.diasConsecutivos}
                onChange={e => setMissao(d => ({ ...d, diasConsecutivos: +e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-lbl">Hospedagem próxima à clínica</label>
              <div className="chips">
                {[{ v: true, l: "Sim" }, { v: false, l: "Não" }].map(({ v, l }) => (
                  <button key={l} className={`chip${missao.hospedagemProxima === v ? " sel" : ""}`}
                    onClick={() => setMissao(d => ({ ...d, hospedagemProxima: v }))}>{l}</button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={() => confirmar(clinica, missao)}>
              Iniciar turno
            </button>
            <button className="btn-secondary" onClick={() => setStep("clinica")}>Voltar</button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── ENCERRAR SHEET ──────────────────────────────────────────────────────────

const EncerrarSheet = ({ turno, onConfirmar, onCancelar }) => {
  const [humor, setHumor] = useState("bom");
  const [desgaste, setDesgaste] = useState(2);
  const [transito, setTransito] = useState("moderado");
  const [obs, setObs] = useState("");

  const clinica = getClinica(turno.clinicaId);
  const ida = turno.chegadaClinica ? turno.chegadaClinica - turno.saidaCasa : null;
  const atend = turno.atendimentoFim && turno.atendimentoInicio ? turno.atendimentoFim - turno.atendimentoInicio : null;
  const volta = turno.chegadaCasa && turno.atendimentoFim ? turno.chegadaCasa - turno.atendimentoFim : null;
  const total = turno.chegadaCasa ? turno.chegadaCasa - turno.saidaCasa : null;
  const prod = atend && total ? Math.round((atend / total) * 100) : null;
  const dInfo = DESGASTE.find(d => d.v === desgaste) || DESGASTE[1];

  const tlItems = [
    { ts: turno.saidaCasa, lbl: "Saída de casa", dur: ida, filled: true },
    { ts: turno.chegadaClinica, lbl: "Chegada na clínica", dur: atend ? (turno.atendimentoInicio - turno.chegadaClinica) : null, filled: true },
    { ts: turno.atendimentoInicio, lbl: "Início do atendimento", dur: atend, filled: true },
    { ts: turno.atendimentoFim, lbl: "Fim do atendimento", dur: volta, filled: true },
    { ts: turno.chegadaCasa, lbl: "Chegada em casa", dur: null, filled: true },
  ].filter(i => i.ts);

  return (
    <>
      <div className="overlay" onClick={onCancelar} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">Resumo do turno</div>

        <div className="summary-header">
          <div className="clinica-dot" style={{ width: 12, height: 12, background: clinica.cor }} />
          <div className="summary-clinica-nome">{clinica.nome}</div>
          {turno.missao && (
            <div className="summary-missao-tag">
              <Icon d={ICONS.plane} size={10} stroke={1.5} />
              Missão
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="timeline">
          {tlItems.map((item, i) => (
            <div className="tl-row" key={i}>
              <div className="tl-left">
                <span className="tl-time">{fmtTime(item.ts)}</span>
              </div>
              <div className="tl-spine">
                <div className={`tl-dot${item.filled ? " filled" : ""}`} />
                {i < tlItems.length - 1 && <div className="tl-line" />}
              </div>
              <div className="tl-content">
                <div className="tl-lbl">{item.lbl}</div>
                {item.dur > 0 && <div className="tl-dur">{fmt(item.dur)}</div>}
              </div>
            </div>
          ))}
        </div>

        {prod !== null && (
          <div className="prod-section">
            <div className="prod-header">
              <span className="prod-lbl">Produtividade líquida</span>
              <span className="prod-val" style={{ color: prod > 65 ? "var(--sage)" : prod > 45 ? "var(--amber)" : "var(--wine)" }}>
                {prod}%
              </span>
            </div>
            <div className="prod-track">
              <div className="prod-fill" style={{ width: `${prod}%` }} />
            </div>
          </div>
        )}

        {/* Total */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 18, background: "var(--bg2)", borderRadius: "var(--r-sm)", padding: 12 }}>
          {[
            { l: "Ida", v: fmt(ida) },
            { l: "Atendimento", v: fmt(atend) },
            { l: "Total fora", v: fmt(total) },
          ].map(({ l, v }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-d)", fontSize: 17, color: "var(--text)" }}>{v}</div>
              <div style={{ fontSize: 9.5, color: "var(--text3)", marginTop: 2, fontWeight: 300 }}>{l}</div>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label className="form-lbl">Como foi o dia?</label>
          <div className="chips">
            {HUMOR.map(h => (
              <button key={h.v} className={`chip${humor === h.v ? " sel" : ""}`}
                onClick={() => setHumor(h.v)}>{h.l}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-lbl">Desgaste físico</label>
          <div className="chips">
            {DESGASTE.map(d => (
              <button key={d.v} className={`chip${desgaste === d.v ? " sel" : ""}`}
                onClick={() => setDesgaste(d.v)}
                style={desgaste === d.v ? { borderColor: d.cor, color: d.cor, background: `${d.cor}18` } : {}}>
                <span style={{ fontFamily: "monospace", fontSize: 13, letterSpacing: 2 }}>{d.sym.charAt(0)}</span>
                {d.l}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-lbl">Trânsito percebido</label>
          <div className="chips">
            {TRANSITO.map(t => (
              <button key={t.v} className={`chip${transito === t.v ? " sel" : ""}`}
                onClick={() => setTransito(t.v)}>{t.l}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-lbl">Observações</label>
          <textarea className="form-input" rows={2} placeholder="Notas sobre o turno..."
            value={obs} onChange={e => setObs(e.target.value)}
            style={{ resize: "none", lineHeight: 1.6 }} />
        </div>

        <button className="btn-primary" onClick={() => onConfirmar({ humor, desgaste, transito, observacoes: obs })}>
          Salvar turno
        </button>
        <button className="btn-secondary" onClick={onCancelar}>Cancelar</button>
      </div>
    </>
  );
};

// ─── TELA TURNO (root) ───────────────────────────────────────────────────────

const TelaHome = ({ turno, historico, onIniciar, onAction, onEncerrar }) => {
  const score = calcMeridianScore(historico);
  const { l: scoreLabel, cor: scoreCor } = getMeridianLabel(score);
  const scoreClasse = score === null ? "" : score >= 80 ? "sustentavel" : score >= 60 ? "atencao" : "desgaste";
  const ultimo = historico[0];
  const ultimaClinica = ultimo ? getClinica(ultimo.clinicaId) : null;

  return (
    <div>
      <div className="page-header">
        <div className="page-eyebrow">Meridian</div>
        <div className="page-title">{turno ? "Turno ativo" : "Bom dia"}</div>
        {!turno && <div className="page-sub">Selecione o tipo de jornada para iniciar</div>}
      </div>

      {turno ? (
        <TurnoAtivo turno={turno} onAction={onAction} onEncerrar={onEncerrar} />
      ) : (
        <>
          <StartShift onIniciar={onIniciar} />

          {/* Quick stats */}
          <div style={{ height: 20 }} />
          <div className="section-lbl">Visão geral</div>

          <div className="meridian-score-card fu fu-1" style={{ padding: "20px 22px" }}>
            <div className="card-eyebrow" style={{ marginBottom: 8 }}>Meridian Score</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, marginBottom: 16 }}>
              <div className="ms-num" style={{ color: scoreCor, fontSize: 48 }}>
                {score !== null ? score : "—"}
              </div>
              <div style={{ paddingBottom: 6 }}>
                <div className="ms-label" style={{ color: scoreCor }}>{scoreLabel}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 300 }}>dos últimos 14 dias</div>
              </div>
            </div>
            {score !== null && (
              <div className="ms-track">
                <div className="ms-fill" style={{
                  width: `${score}%`,
                  background: score >= 80 ? "var(--sage)" : score >= 60 ? "var(--amber)" : "var(--wine)"
                }} />
              </div>
            )}
          </div>

          <div className="grid-2 fu fu-2">
            <div className="card card-p">
              <div className="card-eyebrow">Último turno</div>
              <div className="card-value-md">{ultimaClinica ? ultimaClinica.nome : "—"}</div>
              <div className="card-sub">{ultimo ? fmtDateFull(ultimo.saidaCasa) : "Sem registro"}</div>
            </div>
            <div className="card card-p">
              <div className="card-eyebrow">Este mês</div>
              <div className="card-value-md">{historico.filter(t => {
                const d = new Date(t.saidaCasa), h = new Date();
                return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear();
              }).length}</div>
              <div className="card-sub">turnos registrados</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── TELA: HISTÓRICO ─────────────────────────────────────────────────────────

const TelaHistorico = ({ historico }) => {
  if (!historico.length) return (
    <div className="empty">
      <Icon d={ICONS.history} size={40} stroke={1.2} color="var(--text4)" />
      <div className="empty-title">Sem turnos</div>
      <div className="empty-sub">Registre seu primeiro turno para começar o rastreamento.</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-eyebrow">Registros</div>
        <div className="page-title">Histórico</div>
        <div className="page-sub">{historico.length} turnos · {CLINICAS.filter(c => historico.some(t => t.clinicaId === c.id)).length} clínicas</div>
      </div>

      {historico.map((t, i) => {
        const c = getClinica(t.clinicaId);
        const ida = t.chegadaClinica ? t.chegadaClinica - t.saidaCasa : null;
        const atend = t.atendimentoFim && t.atendimentoInicio ? t.atendimentoFim - t.atendimentoInicio : null;
        const total = t.chegadaCasa ? t.chegadaCasa - t.saidaCasa : null;
        const prod = calcProd(t);
        const dg = calcDesgasteVal(t);
        const dgInfo = getDesgasteInfo(dg);

        return (
          <div key={t.id} className="turno-item fu" style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="ti-top">
              <div className="ti-clinica">
                <div className="clinica-dot" style={{ background: c.cor }} />
                {c.nome}
              </div>
              <div className="ti-date">{fmtDateFull(t.saidaCasa)}</div>
            </div>

            <div className="ti-metrics">
              <div className="ti-metric">
                <div className="ti-metric-val">{fmt(ida)}</div>
                <div className="ti-metric-lbl">Deslocamento</div>
              </div>
              <div className="ti-metric">
                <div className="ti-metric-val">{fmt(atend)}</div>
                <div className="ti-metric-lbl">Atendimento</div>
              </div>
              <div className="ti-metric">
                <div className="ti-metric-val">{fmt(total)}</div>
                <div className="ti-metric-lbl">Total fora</div>
              </div>
            </div>

            <div className="ti-tags">
              {prod !== null && (
                <span className={`ti-tag ${prod > 65 ? "prod" : prod > 45 ? "prod-warn" : "prod-low"}`}>
                  {prod}% prod.
                </span>
              )}
              <span className="ti-tag" style={{ color: dgInfo.cor, background: `${dgInfo.cor}18` }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, letterSpacing: 2 }}>
                  {dgInfo.sym.charAt(0)}
                </span>
                {dgInfo.l}
              </span>
              {t.missao && (
                <span className="ti-tag missao">
                  <Icon d={ICONS.plane} size={10} stroke={1.5} color="var(--amber)" />
                  Missão
                </span>
              )}
              <span className="ti-tag">
                <Icon d={t.missao ? ICONS.plane : ICONS.car} size={10} stroke={1.4} />
                {t.missao ? "Viagem" : "Local"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── TELA: ANALYTICS ─────────────────────────────────────────────────────────

const TelaAnalytics = ({ historico }) => {
  const [filtro, setFiltro] = useState("todos");

  const ts = filtro === "local" ? historico.filter(t => !t.missao)
    : filtro === "viagem" ? historico.filter(t => t.missao) : historico;

  const score = calcMeridianScore(historico);
  const { l: scoreLabel, cor: scoreCor, desc: scoreDesc } = getMeridianLabel(score);
  const scoreClasse = score === null ? "" : score >= 80 ? "sustentavel" : score >= 60 ? "atencao" : "desgaste";

  const byClinica = CLINICAS.map(c => {
    const ct = ts.filter(t => t.clinicaId === c.id);
    if (!ct.length) return null;
    const totalFora = ct.reduce((s, t) => s + (t.chegadaCasa ? t.chegadaCasa - t.saidaCasa : 0), 0);
    const avgDg = ct.reduce((s, t) => s + calcDesgasteVal(t), 0) / ct.length;
    const avgProd = ct.filter(t => calcProd(t) !== null).length
      ? Math.round(ct.filter(t => calcProd(t) !== null).reduce((s, t) => s + calcProd(t), 0) / ct.filter(t => calcProd(t) !== null).length) : null;
    return { c, ct, totalFora, avgDg, avgProd };
  }).filter(Boolean).sort((a, b) => b.totalFora - a.totalFora);

  const maxFora = byClinica[0]?.totalFora || 1;
  const totalAtend = ts.reduce((s, t) => s + (t.atendimentoFim && t.atendimentoInicio ? t.atendimentoFim - t.atendimentoInicio : 0), 0);
  const totalFora = ts.reduce((s, t) => s + (t.chegadaCasa ? t.chegadaCasa - t.saidaCasa : 0), 0);
  const totalTransito = ts.reduce((s, t) => {
    const i = t.chegadaClinica ? t.chegadaClinica - t.saidaCasa : 0;
    const v = t.chegadaCasa && t.atendimentoFim ? t.chegadaCasa - t.atendimentoFim : 0;
    return s + i + v;
  }, 0);

  const transitoPct = totalFora > 0 ? Math.round((totalTransito / totalFora) * 100) : 0;

  const insights = [
    byClinica.length > 0 && byClinica.sort((a, b) => b.avgDg - a.avgDg)[0] && {
      icon: "activity",
      text: <><strong>{byClinica.sort((a, b) => b.avgDg - a.avgDg)[0].c.nome}</strong> apresenta o maior índice de desgaste entre suas clínicas.</>
    },
    byClinica.length > 0 && byClinica.filter(x => x.avgProd !== null).sort((a, b) => b.avgProd - a.avgProd)[0] && {
      icon: "leaf",
      text: <><strong>{byClinica.filter(x => x.avgProd !== null).sort((a, b) => b.avgProd - a.avgProd)[0].c.nome}</strong> possui a melhor relação deslocamento/produtividade ({byClinica.filter(x => x.avgProd !== null).sort((a, b) => b.avgProd - a.avgProd)[0].avgProd}%).</>
    },
    transitoPct > 0 && {
      icon: "car",
      text: <><strong>{transitoPct}%</strong> do seu tempo fora de casa é trânsito — {fmt(totalTransito)} no período selecionado.</>
    },
    ts.filter(t => t.missao).length > 0 && {
      icon: "plane",
      text: <>Você realizou <strong>{ts.filter(t => t.missao).length} missões</strong> com {ts.filter(t => t.missao).reduce((s, t) => s + (t.missao?.noites || 0), 0)} noites fora de casa.</>
    },
  ].filter(Boolean);

  if (!historico.length) return (
    <div className="empty">
      <Icon d={ICONS.chart} size={40} stroke={1.2} color="var(--text4)" />
      <div className="empty-title">Sem dados</div>
      <div className="empty-sub">Registre alguns turnos para ver suas análises.</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-eyebrow">Análises</div>
        <div className="page-title">Analytics</div>
      </div>

      {/* Meridian Score */}
      <div className={`meridian-score-card ${scoreClasse} fu`}>
        <div className="card-eyebrow">Meridian Score</div>
        <div className="ms-num" style={{ color: scoreCor }}>{score !== null ? score : "—"}</div>
        <div className="ms-label" style={{ color: scoreCor }}>{scoreLabel}</div>
        <div className="ms-desc">{scoreDesc}</div>
        {score !== null && (
          <>
            <div className="ms-track">
              <div className="ms-fill" style={{
                width: `${score}%`,
                background: score >= 80 ? "var(--sage)" : score >= 60 ? "var(--amber)" : "var(--wine)"
              }} />
            </div>
            <div className="ms-bands">
              <span>0 · Crítico</span>
              <span>60 · Atenção</span>
              <span>80 · Sustentável</span>
            </div>
          </>
        )}
      </div>

      <div className="toggle-row fu fu-1">
        {[["todos", "Todos"], ["local", "Local"], ["viagem", "Viagens"]].map(([v, l]) => (
          <button key={v} className={`toggle-btn${filtro === v ? " active" : ""}`} onClick={() => setFiltro(v)}>{l}</button>
        ))}
      </div>

      <div className="grid-2 fu fu-2">
        <div className="card card-p">
          <div className="card-eyebrow">Horas atendendo</div>
          <div className="card-value-md">{fmt(totalAtend)}</div>
          <div className="card-sub">{ts.length} turnos</div>
        </div>
        <div className="card card-p">
          <div className="card-eyebrow">Fora de casa</div>
          <div className="card-value-md">{fmt(totalFora)}</div>
          <div className="card-sub">Total acumulado</div>
        </div>
        <div className="card card-p">
          <div className="card-eyebrow">Em trânsito</div>
          <div className="card-value-md" style={{ color: "var(--amber)" }}>{fmt(totalTransito)}</div>
          <div className="card-sub">{transitoPct}% do tempo total</div>
        </div>
        <div className="card card-p">
          <div className="card-eyebrow">Missões</div>
          <div className="card-value-md">{ts.filter(t => t.missao).length}</div>
          <div className="card-sub">{ts.filter(t => t.missao).reduce((s, t) => s + (t.missao?.noites || 0), 0)} noites fora</div>
        </div>
      </div>

      <div className="section-lbl fu fu-3">Tempo fora de casa por clínica</div>
      <div className="bar-section fu fu-3">
        {byClinica.map(({ c, totalFora: tf }) => (
          <div className="bar-row" key={c.id}>
            <div className="bar-name">{c.nome}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{
                width: `${Math.max(8, (tf / maxFora) * 100)}%`,
                background: `linear-gradient(90deg, ${c.cor}, ${c.cor}88)`
              }}>{fmt(tf)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="divider" style={{ margin: "6px 16px 16px" }} />

      <div className="section-lbl">Desgaste médio por clínica</div>
      <div className="bar-section">
        {[...byClinica].sort((a, b) => b.avgDg - a.avgDg).map(({ c, avgDg }) => {
          const dgI = getDesgasteInfo(avgDg);
          return (
            <div className="bar-row" key={c.id}>
              <div className="bar-name">{c.nome}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{
                  width: `${(avgDg / 5) * 100}%`,
                  background: `linear-gradient(90deg, ${dgI.cor}, ${dgI.cor}88)`
                }}>{dgI.l}</div>
              </div>
            </div>
          );
        })}
      </div>

      {insights.length > 0 && (
        <>
          <div className="divider" style={{ margin: "6px 16px 16px" }} />
          <div className="section-lbl">Insights</div>
          {insights.map((ins, i) => (
            <div className="insight fu" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="insight-icon">
                <Icon d={ICONS[ins.icon]} size={16} stroke={1.4} />
              </div>
              <div className="insight-text">{ins.text}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// ─── TELA: CLÍNICAS ──────────────────────────────────────────────────────────

const TelaClinicas = ({ historico }) => {
  const clinicas = CLINICAS.map(c => {
    const ts = historico.filter(t => t.clinicaId === c.id);
    if (!ts.length) return null;
    const totalAtend = ts.reduce((s, t) => s + (t.atendimentoFim && t.atendimentoInicio ? t.atendimentoFim - t.atendimentoInicio : 0), 0);
    const avgIda = ts.filter(t => t.chegadaClinica).length
      ? ts.filter(t => t.chegadaClinica).reduce((s, t) => s + (t.chegadaClinica - t.saidaCasa), 0) / ts.filter(t => t.chegadaClinica).length : 0;
    const avgProd = ts.filter(t => calcProd(t) !== null).length
      ? Math.round(ts.filter(t => calcProd(t) !== null).reduce((s, t) => s + calcProd(t), 0) / ts.filter(t => calcProd(t) !== null).length) : null;
    const avgDg = ts.reduce((s, t) => s + calcDesgasteVal(t), 0) / ts.length;
    const sustent = avgProd !== null ? Math.round((avgProd / 100) * 0.55 + ((5 - avgDg) / 5) * 0.45) * 100 : null;
    const score = calcMeridianScore(ts);
    return { c, ts, totalAtend, avgIda, avgProd, avgDg, sustent, score };
  }).filter(Boolean).sort((a, b) => b.ts.length - a.ts.length);

  if (!clinicas.length) return (
    <div className="empty">
      <Icon d={ICONS.building} size={40} stroke={1.2} color="var(--text4)" />
      <div className="empty-title">Sem clínicas</div>
      <div className="empty-sub">Registre turnos para ver a análise por clínica.</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-eyebrow">Performance</div>
        <div className="page-title">Clínicas</div>
        <div className="page-sub">{clinicas.length} clínicas com dados</div>
      </div>

      {clinicas.map(({ c, ts, avgIda, avgProd, avgDg, sustent }, i) => {
        const dgI = getDesgasteInfo(avgDg);
        const sustPct = sustent !== null ? Math.min(100, Math.max(0, sustent)) : null;
        const sustCor = sustPct > 65 ? "var(--sage)" : sustPct > 40 ? "var(--amber)" : "var(--wine)";

        return (
          <div className="clinica-card fu" key={c.id} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="cc-header">
              <div className="cc-nome">
                <div className="clinica-dot" style={{ width: 10, height: 10, background: c.cor }} />
                {c.nome}
                {c.tipo === "viagem" && (
                  <span style={{ fontSize: 10, color: "var(--amber)", background: "var(--amber2)", borderRadius: 100, padding: "2px 8px", fontWeight: 300, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon d={ICONS.plane} size={10} stroke={1.5} />
                    Missão
                  </span>
                )}
              </div>
              <span className="cc-count">{ts.length} turno{ts.length > 1 ? "s" : ""}</span>
            </div>

            <div className="cc-stats">
              <div className="cc-stat">
                <div className="cc-stat-val">{fmt(avgIda)}</div>
                <div className="cc-stat-lbl">Ida média</div>
              </div>
              <div className="cc-stat">
                <div className="cc-stat-val">{avgProd !== null ? `${avgProd}%` : "—"}</div>
                <div className="cc-stat-lbl">Prod. média</div>
              </div>
              <div className="cc-stat">
                <div className="cc-stat-val" style={{ fontSize: 14, color: dgI.cor }}>
                  <span style={{ fontFamily: "monospace", letterSpacing: 2 }}>{dgI.sym.charAt(0)}</span> {dgI.l}
                </div>
                <div className="cc-stat-lbl">Desgaste</div>
              </div>
            </div>

            {sustPct !== null && (
              <div className="sustent-row">
                <span className="sustent-lbl">Sustentabilidade</span>
                <div className="sustent-track">
                  <div className="sustent-fill" style={{ width: `${sustPct}%`, background: sustCor }} />
                </div>
                <span className="sustent-val" style={{ color: sustCor }}>{sustPct}%</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── TELA: SEMANA ────────────────────────────────────────────────────────────

const TelaSemana = ({ historico }) => {
  const hoje = new Date();
  const semana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - 6 + i);
    return d;
  });
  const diasPt = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDayT = (d) => historico.filter(t => {
    const td = new Date(t.saidaCasa);
    return td.getDate() === d.getDate() && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
  });

  const maxH = 10 * 3600000;
  const semTurnos = semana.flatMap(d => getDayT(d));
  const totalSemFora = semTurnos.reduce((s, t) => s + (t.chegadaCasa ? t.chegadaCasa - t.saidaCasa : 0), 0);
  const totalSemAtend = semTurnos.reduce((s, t) => s + (t.atendimentoFim && t.atendimentoInicio ? t.atendimentoFim - t.atendimentoInicio : 0), 0);
  const diasTrab = semana.filter(d => getDayT(d).length > 0).length;
  const score = calcMeridianScore(semTurnos.length > 0 ? semTurnos : historico.slice(0, 7));
  const { l: scoreLabel, cor: scoreCor } = getMeridianLabel(score);

  return (
    <div>
      <div className="page-header">
        <div className="page-eyebrow">Esta semana</div>
        <div className="page-title">Dashboard</div>
        <div className="page-sub">{semTurnos.length} turno{semTurnos.length !== 1 ? "s" : ""} · {diasTrab} dias trabalhados</div>
      </div>

      {/* Week bars */}
      <div className="week-bars fu">
        {semana.map((d, i) => {
          const ts = getDayT(d);
          const total = ts.reduce((s, t) => s + (t.chegadaCasa ? t.chegadaCasa - t.saidaCasa : 0), 0);
          const isHoje = d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth();
          const c = ts.length > 0 ? getClinica(ts[0].clinicaId) : null;
          const pct = Math.min(100, (total / maxH) * 100);
          return (
            <div className="wb-col" key={i}>
              <div className="wb-bar-wrap">
                <div className="wb-bar" style={{
                  height: `${pct > 0 ? Math.max(8, pct) : 0}%`,
                  background: c ? c.cor : "var(--bg4)",
                  opacity: isHoje ? 1 : 0.65,
                }} />
              </div>
              <div className="wb-val">{total > 0 ? `${Math.floor(total / 3600000)}h` : ""}</div>
              <div className="wb-lbl" style={{ color: isHoje ? "var(--text2)" : "var(--text4)" }}>
                {diasPt[d.getDay()]}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-2 fu fu-1">
        <div className="card card-p">
          <div className="card-eyebrow">Fora de casa</div>
          <div className="card-value-md">{fmt(totalSemFora)}</div>
          <div className="card-sub">esta semana</div>
        </div>
        <div className="card card-p">
          <div className="card-eyebrow">Atendendo</div>
          <div className="card-value-md" style={{ color: "var(--sage)" }}>{fmt(totalSemAtend)}</div>
          <div className="card-sub">horas produtivas</div>
        </div>
      </div>

      <div className="card card-p mx fu fu-2" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <div className="card-eyebrow">Score da semana</div>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 36, color: scoreCor, letterSpacing: -1 }}>
            {score !== null ? score : "—"}
          </div>
          <div style={{ fontSize: 12, color: scoreCor, fontWeight: 400 }}>{scoreLabel}</div>
        </div>
        <div style={{ flex: 1 }}>
          {score !== null && (
            <div className="ms-track" style={{ marginTop: 8 }}>
              <div className="ms-fill" style={{
                width: `${score}%`,
                background: score >= 80 ? "var(--sage)" : score >= 60 ? "var(--amber)" : "var(--wine)"
              }} />
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8, fontWeight: 300 }}>
            Meridian Score · sustentabilidade
          </div>
        </div>
      </div>

      {semTurnos.length > 0 && (
        <>
          <div className="section-lbl fu fu-3">Turnos da semana</div>
          {semTurnos.map((t, i) => {
            const c = getClinica(t.clinicaId);
            const atend = t.atendimentoFim && t.atendimentoInicio ? t.atendimentoFim - t.atendimentoInicio : null;
            const total = t.chegadaCasa ? t.chegadaCasa - t.saidaCasa : null;
            return (
              <div className="turno-item fu" key={t.id} style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="ti-top">
                  <div className="ti-clinica">
                    <div className="clinica-dot" style={{ background: c.cor }} />
                    {c.nome}
                  </div>
                  <div className="ti-date">{fmtDateFull(t.saidaCasa)} · {fmtTime(t.saidaCasa)}</div>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, fontFamily: "var(--font-d)", color: "var(--text)" }}>{fmt(atend)}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 300 }}>atendimento</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, fontFamily: "var(--font-d)", color: "var(--text)" }}>{fmt(total)}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 300 }}>total fora</div>
                  </div>
                  {t.missao && <span className="ti-tag missao" style={{ alignSelf: "center" }}>
                    <Icon d={ICONS.plane} size={10} stroke={1.5} color="var(--amber)" /> Missão
                  </span>}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

const SyncBadge = ({ saving }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--text3)", fontWeight: 300 }}>
    <div style={{ width: 5, height: 5, borderRadius: "50%", background: saving ? "var(--amber)" : "var(--sage)", flexShrink: 0 }} />
    {saving ? "Salvando…" : "Sincronizado"}
  </div>
);

export default function App() {
  const [tab,          setTab]         = useState("turno");
  const [turno,        setTurno]       = useState(null);
  const [showEncerrar, setShowEncerrar] = useState(false);
  const [historico,    setHistorico]   = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [saving,       setSaving]      = useState(false);
  const clock = useClock();

  // Load from Supabase (or localStorage fallback) on mount
  useEffect(() => {
    loadTurnos()
      .then(data => {
        // Show mock data if no real data exists yet
        const real = data.filter(t => t.status === "concluido");
        setHistorico(real.length > 0 ? real : mockHistorico());
      })
      .finally(() => setLoading(false));
  }, []);

  const iniciarTurno = useCallback(async (dados) => {
    const novoTurno = {
      id: crypto.randomUUID(),
      ...dados,
      chegadaClinica: null, atendimentoInicio: null, atendimentoFim: null, chegadaCasa: null,
      status: "ativo"
    };
    setSaving(true);
    await saveTurno(novoTurno);
    setSaving(false);
    setTurno(novoTurno);
  }, []);

  const registrarAcao = useCallback(async (acao) => {
    const updated = { ...turno, [acao]: now() };
    setTurno(updated);
    await saveTurno(updated);
    if (acao === "chegadaCasa") setTimeout(() => setShowEncerrar(true), 700);
  }, [turno]);

  const encerrarTurno = useCallback(async (extras) => {
    if (!turno) return;
    setSaving(true);
    const final = { ...turno, ...extras, status: "concluido" };
    const { data } = await saveTurno(final);
    setSaving(false);
    setHistorico(h => [data || final, ...h]);
    setTurno(null);
    setShowEncerrar(false);
    setTab("historico");
  }, [turno]);

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100dvh", flexDirection:"column", gap:16 }}>
        <div style={{ fontFamily:"var(--font-d)", fontSize:22, color:"var(--text2)", fontStyle:"italic" }}>meridian</div>
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", position: "relative", overflow: "hidden", maxWidth: 430, margin: "0 auto", background: "var(--bg)" }}>
        {/* Status bar */}
        <div className="status-bar">
          <span className="status-time">
            {clock.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="status-name">meridian</span>
          <SyncBadge saving={saving} />
        </div>

        {/* Screen */}
        <div className="screen">
          {tab === "turno" && (
            <TelaHome turno={turno} historico={historico} onIniciar={iniciarTurno}
              onAction={registrarAcao} onEncerrar={() => setShowEncerrar(true)} saving={saving} />
          )}
          {tab === "historico" && <TelaHistorico historico={historico} />}
          {tab === "analytics" && <TelaAnalytics historico={historico} />}
          {tab === "clinicas"  && <TelaClinicas historico={historico} />}
          {tab === "semana"    && <TelaSemana historico={historico} />}
        </div>

        <TabBar active={tab} onChange={setTab} />

        {showEncerrar && turno && (
          <EncerrarSheet turno={turno} onConfirmar={encerrarTurno}
            onCancelar={() => setShowEncerrar(false)} saving={saving} />
        )}
      </div>
    </>
  );
}
