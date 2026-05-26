import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { loadTurnos, saveTurno, deleteTurno, saveCalculo, loadCalculos, loadClinicas as loadClinicasDB, saveClinica, deleteClinica, seedClinicas, loadMissoes, saveMissao, deleteMissao } from "./lib/db";

// ─── ICONS ───────────────────────────────────────────────────────────────────

const Icon = ({ d, size = 20, stroke = 1.5, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const ICONS = {
  timer:    ["M12 6v6l4 2", "M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"],
  history:  ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5", "M12 7v5l4 2"],
  chart:    ["M3 3v18h18", "M7 16l4-4 4 4 4-4"],
  building: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  calendar: ["M8 2v4", "M16 2v4", "M3 10h18", "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"],
  calculator:["M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z","M8 6h2","M14 6h2","M8 10h2","M14 10h2","M8 14h2","M14 14h4","M8 18h8"],
  plane:    "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
  car:      ["M5 17H3v-7l3.5-6.5A1 1 0 0 1 7.4 3h9.2a1 1 0 0 1 .9.5L21 10v7h-2","M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0","M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0","M5 10h14"],
  home:     ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z","M9 22V12h6v10"],
  steth:    ["M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3","M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"],
  check:    "M20 6 9 17l-5-5",
  x:        ["M18 6 6 18","M6 6l12 12"],
  chevron:  "M9 18l6-6-6-6",
  plus:     ["M12 5v14","M5 12h14"],
  edit:     ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
  trash:    ["M3 6h18","M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6","M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  bus:      ["M6 17h12","M6 11h12","M4 5c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v13a1 1 0 0 1-1 1h-1","M14 20a2 2 0 1 0-4 0","M3 11V5"],
  moto:     ["M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0","M15 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0","M2 12l3-7h9l4 4","M9 5l-2 7","M14 12h6"],
  map:      ["M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z","M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4"],
  activity: "M22 12h-4l-3 9L9 3l-3 9H2",
  leaf:     "M2 22 16 8M8.5 11.5A8 8 0 0 1 20 2s1 14-10 14H8",
  moon:     "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
  alert:    ["M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z","M12 9v4","M12 17h.01"],
  bed:      ["M2 4v16","M2 8h18a2 2 0 0 1 2 2v10","M2 17h20","M6 8v-1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"],
  pause:    ["M6 4h4v16H6z","M14 4h4v16h-4z"],
  play:     "M5 3l14 9-14 9V3z",
  coffee:   ["M18 8h1a4 4 0 0 1 0 8h-1","M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z","M6 1v3","M10 1v3","M14 1v3"],
  edit:     ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7","M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"],
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const CLINICAS_DEFAULT = [
  { id: "hof",             nome: "HOF",            cidade: "Salvador, BA", tipo: "local",  cor: "#7E9B8A" },
  { id: "iofs",            nome: "IOFS",           cidade: "Salvador, BA", tipo: "local",  cor: "#7A8FAF" },
  { id: "oftalmodiagnose", nome: "Oftalmodiagnose",cidade: "Salvador, BA", tipo: "local",  cor: "#A08060" },
  { id: "ame_piraja",      nome: "AME Pirajá",     cidade: "Salvador, BA", tipo: "local",  cor: "#9E7A8A" },
  { id: "hob",             nome: "HOB",            cidade: "Salvador, BA", tipo: "local",  cor: "#8A7AAF" },
  { id: "ivfs",            nome: "IVFS",           cidade: "Salvador, BA", tipo: "local",  cor: "#7A9FAF" },
  { id: "floriano",        nome: "Floriano",       cidade: "Floriano, PI", tipo: "viagem", cor: "#AF9070" },
  { id: "paulo_afonso",    nome: "Paulo Afonso",   cidade: "Paulo Afonso, BA", tipo: "viagem", cor: "#AF7A7A" },
];

const MEIOS_TODOS = ["Carro", "Avião", "Ônibus", "Moto", "Outro"];
const MEIOS_ICONS = { Carro: "car", Avião: "plane", Ônibus: "bus", Moto: "moto", Outro: "map" };

const HUMOR     = [{ v:"otimo",l:"Ótimo" },{ v:"bom",l:"Bom" },{ v:"neutro",l:"Neutro" },{ v:"cansado",l:"Cansado" },{ v:"esgotado",l:"Esgotado" }];
const TRANSITO  = [{ v:"leve",l:"Leve" },{ v:"moderado",l:"Moderado" },{ v:"intenso",l:"Intenso" }];
const DESGASTE  = [
  { v:1, l:"Leve",     sym:"○", cor:"#7E9B8A" },
  { v:2, l:"Moderado", sym:"◐", cor:"#B09060" },
  { v:3, l:"Intenso",  sym:"◉", cor:"#B07060" },
  { v:4, l:"Pesado",   sym:"◉", cor:"#9E6070" },
  { v:5, l:"Extremo",  sym:"◉", cor:"#8E5060" },
];
const CORES_CLINICA = ["#7E9B8A","#7A8FAF","#A08060","#9E7A8A","#8A7AAF","#7A9FAF","#AF9070","#AF7A7A","#8A9E7A","#AF8AAF"];
const LOCAIS_CALC   = ["Clínica privada","SUS / Glaucoma","Plantão","Consultório próprio","Outro"];

// ─── UTILS ───────────────────────────────────────────────────────────────────

const fmtDur = (ms) => {
  if (!ms || ms <= 0) return "—";
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), min = m % 60;
  return h === 0 ? `${m}m` : `${h}h${min > 0 ? String(min).padStart(2,"0") : ""}`;
};
const fmtTime  = (ts) => ts ? new Date(ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) : "—";
const fmtDate  = (ts) => {
  if (!ts) return "—";
  const d = new Date(ts), ds = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  return `${ds[d.getDay()]}, ${d.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})}`;
};
const fmtBRL   = (v) => new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v||0);
const now      = () => Date.now();
const uid      = () => crypto.randomUUID();
const getClinicaById = (id, clinicas) => clinicas.find(c => c.id === id) || clinicas[0] || CLINICAS_DEFAULT[0];

const loadClinicas = () => {
  try { const s = localStorage.getItem("meridian_clinicas_v1"); return s ? JSON.parse(s) : CLINICAS_DEFAULT; }
  catch { return CLINICAS_DEFAULT; }
};
const saveClinicas = (cs) => { try { localStorage.setItem("meridian_clinicas_v1", JSON.stringify(cs)); } catch {} };
const loadCalcHist = () => {
  try { return JSON.parse(localStorage.getItem("meridian_calc_v1") || "[]"); } catch { return []; }
};
const saveCalcHist = (h) => { try { localStorage.setItem("meridian_calc_v1", JSON.stringify(h.slice(0,30))); } catch {} };

const calcProd = (t) => {
  if (!t.atendimentoInicio || !t.atendimentoFim || !t.saidaCasa || !t.chegadaCasa) return null;
  const atendBruto = t.atendimentoFim - t.atendimentoInicio;
  const pausaMs = calcTotalPausa(t.pausas || []);
  const atendLiq = Math.max(0, atendBruto - pausaMs);
  return Math.round((atendLiq / (t.chegadaCasa - t.saidaCasa)) * 100);
};

// Total de ms em pausas concluídas
const calcTotalPausa = (pausas = []) =>
  pausas.filter(p => p.fim).reduce((a, p) => a + (p.fim - p.inicio), 0);
const calcDesgasteVal = (t) => {
  const base = t.desgaste || 2;
  if (t.missao) return Math.min(5, base + Math.min(2,(t.missao.tempoViagemEstimadoH||0)/5));
  return base;
};
const getDesgasteInfo = (val) => DESGASTE[Math.max(0,Math.min(4,Math.round(val)-1))];

const calcMeridianScore = (turnos) => {
  if (!turnos?.length) return null;
  const r = turnos.slice(0,14);
  let s = 100;
  const avgFora = r.reduce((a,t)=>a+(t.chegadaCasa?(t.chegadaCasa-t.saidaCasa)/3600000:0),0)/r.length;
  const avgTransito = r.reduce((a,t)=>{
    const i = t.chegadaClinica?(t.chegadaClinica-t.saidaCasa)/3600000:0;
    const v = t.chegadaCasa&&t.atendimentoFim?(t.chegadaCasa-t.atendimentoFim)/3600000:0;
    return a+i+v;
  },0)/r.length;
  const avgDg   = r.reduce((a,t)=>a+calcDesgasteVal(t),0)/r.length;
  const noites  = r.filter(t=>t.missao).reduce((a,t)=>a+(t.missao?.noites||0),0);
  s -= Math.max(0,(avgFora-7)*5);
  s -= Math.max(0,(avgTransito-1.5)*8);
  s -= (avgDg-1)*8;
  s -= noites*3;
  return Math.max(0,Math.min(100,Math.round(s)));
};
const getMeridianLabel = (s) => {
  if (s===null) return {l:"—",cor:"var(--text3)",desc:"Sem dados suficientes"};
  if (s>=80) return {l:"Sustentável",cor:"var(--sage)",desc:"Sua rotina está em equilíbrio"};
  if (s>=60) return {l:"Atenção",cor:"var(--amber)",desc:"Sinais de sobrecarga moderada"};
  return {l:"Desgaste elevado",cor:"var(--wine)",desc:"Rotina comprometendo recuperação"};
};

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  :root {
    --bg:#0B0C0E; --bg1:#0F1012; --bg2:#141618; --bg3:#191C1F; --bg4:#1E2124; --bg5:#23272B;
    --border:rgba(255,255,255,0.06); --border2:rgba(255,255,255,0.03);
    --text:#EAE6E0; --text2:#9A958E; --text3:#5A5650; --text4:#3A3630;
    --sage:#7E9B8A; --sage2:rgba(126,155,138,0.15);
    --amber:#A08C60; --amber2:rgba(160,140,96,0.15);
    --wine:#9E6070; --wine2:rgba(158,96,112,0.15);
    --slate:#7A8FAF; --slate2:rgba(122,143,175,0.15);
    --r:14px; --r-sm:10px; --r-lg:20px; --r-xl:28px;
    --font-d:'Playfair Display',serif; --font:'Outfit',sans-serif;
    --ease:cubic-bezier(0.4,0,0.2,1); --ease-out:cubic-bezier(0,0,0.2,1);
    --max:860px;
  }
  html,body,#root { min-height:100dvh; }
  body { background:var(--bg); color:var(--text); font-family:var(--font); font-size:14px; line-height:1.5; -webkit-font-smoothing:antialiased; }
  #root { display:flex; flex-direction:column; }

  /* ── LAYOUT ── */
  .app-wrap { display:flex; flex-direction:column; min-height:100dvh; }

  /* Top nav bar (desktop+mobile) */
  .topnav {
    position:sticky; top:0; z-index:90;
    background:rgba(11,12,14,0.93);
    backdrop-filter:blur(20px);
    border-bottom:1px solid var(--border);
    flex-shrink:0;
  }
  .topnav-inner {
    max-width:var(--max);
    margin:0 auto;
    padding:0 24px;
    height:52px;
    display:flex;
    align-items:center;
    gap:0;
  }
  .nav-logo {
    font-family:var(--font-d);
    font-size:17px;
    color:var(--text2);
    letter-spacing:0.3px;
    font-style:italic;
    cursor:pointer;
    border:none; background:none;
    padding:0;
    transition:color 0.2s;
    flex-shrink:0;
  }
  .nav-logo:hover { color:var(--text); }
  .nav-tabs {
    display:flex;
    gap:2px;
    margin-left:32px;
    flex:1;
  }
  .nav-tab {
    display:flex; align-items:center; gap:7px;
    padding:6px 14px;
    border:none; background:none;
    font-family:var(--font); font-size:12px; font-weight:400;
    color:var(--text3);
    cursor:pointer;
    border-radius:8px;
    transition:all 0.18s;
    white-space:nowrap;
  }
  .nav-tab:hover { color:var(--text2); background:rgba(255,255,255,0.04); }
  .nav-tab.on { color:var(--text); background:rgba(255,255,255,0.06); }
  .nav-tab-dot {
    display:none;
    width:4px; height:4px;
    border-radius:50%;
    background:var(--sage);
  }
  .nav-tab.on .nav-tab-dot { display:block; }

  /* Mobile-only bottom tab bar */
  .tabbar {
    display:none;
    position:fixed; bottom:0; left:0; right:0;
    background:rgba(11,12,14,0.93);
    backdrop-filter:blur(24px);
    border-top:1px solid var(--border);
    justify-content:space-around;
    padding:8px 4px 28px;
    z-index:100;
  }
  .tab { display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; cursor:pointer; padding:6px 10px; color:var(--text3); font-family:var(--font); transition:color 0.2s; border-radius:10px; position:relative; }
  .tab.on { color:var(--text); }
  .tab.on::after { content:''; position:absolute; bottom:-2px; left:50%; transform:translateX(-50%); width:4px; height:4px; border-radius:50%; background:var(--sage); }
  .tab-lbl { font-size:9.5px; font-weight:500; letter-spacing:0.3px; text-transform:uppercase; }

  @media (max-width:600px) {
    .nav-tabs { display:none; }
    .tabbar { display:flex; }
    .screen { padding-bottom:90px; }
  }

  /* ── SCREEN / CONTENT ── */
  .screen { flex:1; overflow-y:auto; overflow-x:hidden; scrollbar-width:none; }
  .screen::-webkit-scrollbar { display:none; }
  .content { max-width:var(--max); margin:0 auto; padding:0 16px 40px; }

  /* Desktop grid for home */
  @media (min-width:601px) {
    .home-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; align-items:start; }
    .home-grid-full { grid-column:1/-1; }
    .content { padding:0 24px 40px; }
  }
  @media (max-width:600px) {
    .home-grid { display:flex; flex-direction:column; gap:0; }
  }

  /* ── PAGE HEADER ── */
  .ph { padding:24px 0 16px; }
  .ph-ey { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--text3); margin-bottom:4px; }
  .ph-title { font-family:var(--font-d); font-size:28px; line-height:1.1; }
  .ph-sub { font-size:13px; color:var(--text3); margin-top:4px; font-weight:300; }

  /* ── CARDS ── */
  .card { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); transition:all 0.2s var(--ease); }
  .card:active { transform:scale(0.995); }
  .cp { padding:18px 20px; } .cplg { padding:22px 24px; }
  .mb { margin-bottom:10px; }
  .g2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px; }
  .g3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px; }
  .g2 .card, .g3 .card { margin:0; }
  .c-ey { font-size:9.5px; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); margin-bottom:6px; }
  .c-val { font-family:var(--font-d); font-size:32px; color:var(--text); line-height:1; letter-spacing:-1px; }
  .c-val-md { font-family:var(--font-d); font-size:22px; color:var(--text); line-height:1; }
  .c-sub { font-size:11px; color:var(--text3); margin-top:4px; font-weight:300; }
  .slbl { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); margin-bottom:10px; margin-top:4px; }
  .divider { height:1px; background:var(--border2); margin:8px 0 16px; }

  /* ── SHEET/OVERLAY ── */
  .overlay { position:fixed; inset:0; background:rgba(0,0,0,0.55); z-index:150; backdrop-filter:blur(6px); animation:fadeOv 0.25s ease both; }
  @keyframes fadeOv { from{opacity:0} to{opacity:1} }
  .sheet { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:520px; background:var(--bg1); border-radius:var(--r-xl) var(--r-xl) 0 0; border-top:1px solid var(--border); z-index:200; padding:16px 20px 48px; max-height:90vh; overflow-y:auto; scrollbar-width:none; animation:shUp 0.32s cubic-bezier(0,0,0.2,1) both; }
  .sheet::-webkit-scrollbar { display:none; }
  @keyframes shUp { from{transform:translateX(-50%) translateY(100%)} to{transform:translateX(-50%) translateY(0)} }
  .sh-handle { width:36px; height:3.5px; background:var(--bg5); border-radius:2px; margin:0 auto 18px; }
  .sh-title { font-family:var(--font-d); font-size:22px; margin-bottom:6px; padding:0 4px; }
  .sh-sub { font-size:12px; color:var(--text3); padding:0 4px; margin-bottom:18px; font-weight:300; }

  /* ── FORMS ── */
  .fg { margin-bottom:14px; }
  .fl { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); display:block; margin-bottom:7px; font-weight:400; }
  .fi { width:100%; background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-sm); padding:10px 13px; color:var(--text); font-family:var(--font); font-size:14px; outline:none; transition:border-color 0.2s; }
  .fi:focus { border-color:rgba(126,155,138,0.35); }
  .frow { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .frow3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
  .chips { display:flex; gap:6px; flex-wrap:wrap; }
  .chip { background:var(--bg2); border:1px solid var(--border); border-radius:100px; padding:6px 13px; font-size:12px; cursor:pointer; font-family:var(--font); color:var(--text2); transition:all 0.18s; display:flex; align-items:center; gap:5px; white-space:nowrap; }
  .chip.sel { background:rgba(126,155,138,0.12); border-color:rgba(126,155,138,0.35); color:var(--sage); }
  .btn-p { width:100%; background:var(--bg3); border:1px solid rgba(126,155,138,0.25); border-radius:var(--r); padding:13px; color:var(--text); font-family:var(--font); font-size:14px; font-weight:500; cursor:pointer; margin-top:8px; transition:all 0.2s; }
  .btn-p:active { transform:scale(0.98); }
  .btn-p:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .btn-s { width:100%; background:none; border:1px solid var(--border); border-radius:var(--r); padding:11px; color:var(--text3); font-family:var(--font); font-size:13px; cursor:pointer; margin-top:6px; }
  .btn-icon { background:none; border:none; cursor:pointer; padding:6px; color:var(--text3); border-radius:8px; transition:all 0.18s; display:flex; align-items:center; }
  .btn-icon:hover { color:var(--text); background:rgba(255,255,255,0.06); }
  .btn-danger { color:var(--wine) !important; }
  .btn-danger:hover { background:rgba(158,96,112,0.1) !important; }

  /* ── PAUSA ── */
  .pause-btn {
    width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
    background:rgba(160,140,96,0.08); border:1px solid rgba(160,140,96,0.2);
    border-radius:var(--r); padding:11px; cursor:pointer; font-family:var(--font);
    font-size:12px; font-weight:500; color:var(--amber); margin-top:8px;
    transition:all 0.2s;
  }
  .pause-btn.pausado {
    background:rgba(126,155,138,0.08); border-color:rgba(126,155,138,0.25); color:var(--sage);
  }
  .pause-btn:active { transform:scale(0.98); }
  @keyframes pulse-pause {
    0%,100% { opacity:1; } 50% { opacity:0.4; }
  }
  .pausa-indicator {
    display:flex; align-items:center; gap:7px;
    font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:var(--amber);
    animation:pulse-pause 2s ease infinite;
  }
  .pausa-dot { width:6px; height:6px; border-radius:50%; background:var(--amber); }
  .pausa-lista {
    margin-top:10px; display:flex; flex-direction:column; gap:4px;
  }
  .pausa-item {
    display:flex; align-items:center; justify-content:space-between;
    background:rgba(160,140,96,0.06); border-radius:6px; padding:6px 10px;
    font-size:11px; color:var(--text3); font-weight:300;
  }
  .pausa-item-dur { color:var(--amber); font-weight:500; }

  /* ── SHIFT CARD ── */
  .shift-card { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-xl); padding:24px; position:relative; overflow:hidden; margin-bottom:12px; }
  .shift-card::before { content:''; position:absolute; top:-60px; right:-60px; width:180px; height:180px; border-radius:50%; pointer-events:none; }
  .shift-card.ft::before { background:radial-gradient(circle,rgba(122,143,175,0.08) 0%,transparent 70%); }
  .shift-card.fc::before { background:radial-gradient(circle,rgba(126,155,138,0.1) 0%,transparent 70%); }
  .shift-card.fa::before { background:radial-gradient(circle,rgba(126,155,138,0.14) 0%,transparent 70%); }
  .shift-card.fr::before { background:radial-gradient(circle,rgba(160,128,96,0.1) 0%,transparent 70%); }
  .clin-pill { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.04); border:1px solid var(--border); border-radius:100px; padding:6px 14px 6px 10px; font-size:13px; }
  .cdot { border-radius:50%; flex-shrink:0; }
  @keyframes pd { 0%,100%{opacity:1}50%{opacity:0.3} }
  .live-dot { width:6px; height:6px; border-radius:50%; background:var(--sage); animation:pd 2.5s ease infinite; }
  .ftrack { display:flex; gap:3px; margin-bottom:20px; }
  .fseg { flex:1; height:2px; background:var(--bg5); border-radius:1px; transition:background 0.5s; }
  .fseg.done { background:var(--sage); opacity:0.7; }
  .fseg.cur { background:var(--sage); }
  .timer { font-family:var(--font-d); font-size:52px; color:var(--text); line-height:1; letter-spacing:-3px; margin-bottom:2px; font-style:italic; }
  .agrid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .abtn { background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:var(--r); padding:13px 13px 11px; cursor:pointer; font-family:var(--font); text-align:left; color:var(--text); transition:all 0.18s; position:relative; overflow:hidden; }
  .abtn:active:not(.adone) { transform:scale(0.97); }
  .abtn.acur { background:rgba(126,155,138,0.08); border-color:rgba(126,155,138,0.25); }
  .abtn.adone { opacity:0.38; pointer-events:none; }
  .a-icon { margin-bottom:7px; color:var(--text3); }
  .acur .a-icon { color:var(--sage); }
  .a-lbl { font-size:12px; color:var(--text2); line-height:1.3; margin-bottom:2px; }
  .a-time { font-size:11px; color:var(--sage); font-weight:300; }
  .a-check { position:absolute; top:10px; right:10px; color:var(--sage); opacity:0.7; }
  .enc-btn { width:100%; background:linear-gradient(135deg,rgba(126,155,138,0.15),rgba(126,155,138,0.08)); border:1px solid rgba(126,155,138,0.25); border-radius:var(--r); padding:13px; color:var(--sage); font-family:var(--font); font-size:13px; font-weight:500; cursor:pointer; margin-top:10px; transition:all 0.2s; }

  /* ── START FLOW ── */
  .tipo-list { display:flex; flex-direction:column; gap:8px; }
  .tipo-card { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-lg); padding:18px 20px; cursor:pointer; font-family:var(--font); text-align:left; transition:all 0.2s; display:flex; align-items:center; gap:16px; }
  .tipo-card:active { transform:scale(0.99); }
  .tipo-icon { width:42px; height:42px; border-radius:12px; background:var(--bg4); display:flex; align-items:center; justify-content:center; color:var(--text2); flex-shrink:0; }
  .tipo-title { font-size:14px; font-weight:500; color:var(--text); margin-bottom:2px; }
  .tipo-sub { font-size:11px; color:var(--text3); font-weight:300; }
  .clin-list { display:flex; flex-direction:column; gap:6px; }
  .clin-opt { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); padding:13px 16px; cursor:pointer; font-family:var(--font); display:flex; align-items:center; gap:12px; transition:all 0.18s; }
  .clin-opt.sel { border-color:rgba(126,155,138,0.3); background:rgba(126,155,138,0.06); }
  .clin-nome { font-size:14px; font-weight:400; }
  .clin-cidade { font-size:11px; color:var(--text3); font-weight:300; margin-top:1px; }
  .clin-vtag { margin-left:auto; font-size:10px; color:var(--amber); background:var(--amber2); border-radius:100px; padding:3px 8px; }

  /* Idle day */
  .idle-card { background:linear-gradient(135deg,rgba(160,140,96,0.08),rgba(158,96,112,0.06)); border:1px solid rgba(160,140,96,0.18); border-radius:var(--r); padding:16px 18px; margin-bottom:12px; display:flex; gap:12px; align-items:flex-start; }
  .idle-icon { color:var(--amber); flex-shrink:0; margin-top:1px; }
  .idle-text { font-size:12px; color:var(--text2); line-height:1.55; }
  .idle-text strong { color:var(--text); font-weight:500; }

  /* ── HISTÓRICO ── */
  .ti { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); padding:15px 17px; transition:all 0.2s; margin-bottom:8px; }
  .ti-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:11px; }
  .ti-clin { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:500; }
  .ti-date { font-size:11px; color:var(--text3); font-weight:300; }
  .ti-met { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; margin-bottom:11px; background:var(--bg3); border-radius:var(--r-sm); padding:9px; }
  .ti-m { text-align:center; }
  .ti-mv { font-size:14px; font-weight:500; font-family:var(--font-d); }
  .ti-ml { font-size:9px; color:var(--text3); margin-top:2px; font-weight:300; }
  .ti-tags { display:flex; gap:5px; flex-wrap:wrap; align-items:center; }
  .tag { font-size:10px; color:var(--text3); background:var(--bg3); border-radius:100px; padding:3px 9px; font-weight:300; display:flex; align-items:center; gap:3px; }
  .tag.mp { color:var(--amber); background:var(--amber2); }
  .tag.tp { color:var(--sage); background:var(--sage2); }
  .tag.tw { color:var(--amber); background:var(--amber2); }
  .tag.tl2 { color:var(--wine); background:var(--wine2); }
  .tag.idle { color:var(--amber); background:var(--amber2); }
  .ti-actions { display:flex; gap:6px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border2); }

  /* ── MERIDIAN SCORE ── */
  .ms-card { background:linear-gradient(145deg,var(--bg2),var(--bg3)); border:1px solid var(--border); border-radius:var(--r-xl); padding:22px; position:relative; overflow:hidden; margin-bottom:12px; }
  .ms-card::before { content:''; position:absolute; bottom:-40px; right:-40px; width:160px; height:160px; border-radius:50%; pointer-events:none; }
  .ms-card.s::before { background:radial-gradient(circle,rgba(126,155,138,0.1) 0%,transparent 70%); }
  .ms-card.a::before { background:radial-gradient(circle,rgba(160,140,96,0.1) 0%,transparent 70%); }
  .ms-card.d::before { background:radial-gradient(circle,rgba(158,96,112,0.1) 0%,transparent 70%); }
  .ms-n { font-family:var(--font-d); font-size:56px; line-height:1; letter-spacing:-3px; margin-bottom:4px; }
  .ms-lb { font-size:13px; font-weight:400; margin-bottom:2px; }
  .ms-desc { font-size:11px; color:var(--text3); font-weight:300; margin-bottom:18px; }
  .ms-track { height:3px; background:var(--bg5); border-radius:2px; overflow:hidden; margin-bottom:10px; }
  .ms-fill { height:100%; border-radius:2px; transition:width 1s; }
  .ms-bands { display:flex; justify-content:space-between; font-size:9px; color:var(--text4); }

  /* ── ANALYTICS ── */
  .tog { display:flex; background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-sm); padding:3px; margin-bottom:14px; }
  .tog-b { flex:1; padding:7px; border:none; border-radius:8px; font-family:var(--font); font-size:12px; cursor:pointer; color:var(--text3); background:none; transition:all 0.2s; }
  .tog-b.on { background:var(--bg4); color:var(--text); box-shadow:0 1px 4px rgba(0,0,0,0.3); }
  .bsec { margin-bottom:18px; }
  .brow { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
  .bnm { font-size:12px; color:var(--text2); width:88px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:300; }
  .btrack { flex:1; height:22px; background:var(--bg3); border-radius:5px; overflow:hidden; }
  .bfill { height:100%; border-radius:5px; display:flex; align-items:center; padding-left:9px; font-size:11px; color:rgba(255,255,255,0.7); transition:width 0.9s; min-width:32px; }
  .ins { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); padding:13px 15px; margin-bottom:8px; display:flex; gap:11px; align-items:flex-start; }
  .ins-ic { color:var(--text3); flex-shrink:0; margin-top:1px; }
  .ins-t { font-size:12px; color:var(--text2); line-height:1.55; font-weight:300; }
  .ins-t strong { color:var(--text); font-weight:500; }

  /* ── CLÍNICAS ── */
  .cc { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); padding:17px 19px; margin-bottom:10px; }
  .cc-h { display:flex; align-items:center; justify-content:space-between; margin-bottom:13px; }
  .cc-nm { display:flex; align-items:center; gap:10px; font-size:15px; font-weight:500; }
  .cc-cnt { font-size:11px; color:var(--text3); font-weight:300; }
  .cc-s { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; margin-bottom:12px; }
  .cc-si { background:var(--bg3); border-radius:var(--r-sm); padding:9px; text-align:center; }
  .cc-sv { font-family:var(--font-d); font-size:15px; }
  .cc-sl { font-size:9px; color:var(--text3); margin-top:2px; font-weight:300; }
  .sust-r { display:flex; align-items:center; gap:10px; }
  .sust-l { font-size:10px; color:var(--text3); width:90px; flex-shrink:0; font-weight:300; }
  .sust-t { flex:1; height:3px; background:var(--bg4); border-radius:2px; overflow:hidden; }
  .sust-f { height:100%; border-radius:2px; transition:width 0.8s; }
  .sust-v { font-size:11px; font-weight:500; width:30px; text-align:right; }

  /* ── SEMANA ── */
  .wk-bars { display:flex; gap:8px; align-items:flex-end; height:80px; margin-bottom:8px; }
  .wk-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end; }
  .wk-bw { width:100%; display:flex; align-items:flex-end; flex:1; }
  .wk-b { width:100%; border-radius:4px 4px 3px 3px; min-height:3px; transition:height 0.6s; opacity:0.75; }
  .wk-lbl { font-size:9px; color:var(--text3); text-transform:uppercase; letter-spacing:0.5px; }
  .wk-val { font-size:9px; color:var(--text3); font-weight:300; }

  /* ── CALCULADORA ── */
  .calc-section { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-lg); padding:20px; margin-bottom:12px; }
  .calc-group-title { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); margin-bottom:10px; margin-top:4px; font-weight:400; display:flex; align-items:center; gap:6px; }
  .calc-group-title::after { content:''; flex:1; height:1px; background:var(--border2); }
  .calc-res-card { background:linear-gradient(135deg,var(--bg3),var(--bg4)); border:1px solid var(--border); border-radius:var(--r); padding:18px; margin-bottom:12px; }
  .calc-main-val { font-family:var(--font-d); font-size:40px; color:var(--text); line-height:1; letter-spacing:-2px; margin-bottom:4px; }
  .calc-hist-item { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r-sm); padding:12px 14px; margin-bottom:6px; display:flex; align-items:center; justify-content:space-between; }
  .calc-hist-val { font-family:var(--font-d); font-size:16px; }
  .calc-hist-meta { font-size:11px; color:var(--text3); font-weight:300; margin-top:2px; }

  /* ── ENCERRAR (timeline) ── */
  .tl { margin-bottom:18px; }
  .tl-row { display:flex; gap:12px; align-items:flex-start; }
  .tl-l { width:40px; flex-shrink:0; text-align:right; padding-top:2px; }
  .tl-t { font-size:10.5px; color:var(--text3); font-weight:300; font-variant-numeric:tabular-nums; }
  .tl-sp { display:flex; flex-direction:column; align-items:center; width:14px; flex-shrink:0; }
  .tl-dot { width:7px; height:7px; border-radius:50%; border:1.5px solid var(--text3); background:var(--bg1); flex-shrink:0; margin-top:3px; }
  .tl-dot.f { background:var(--sage); border-color:var(--sage); }
  .tl-line { width:1px; flex:1; background:var(--border); min-height:18px; }
  .tl-c { padding:0 0 14px; flex:1; }
  .tl-lb { font-size:12px; color:var(--text2); padding-top:2px; }
  .tl-dur { font-size:10px; color:var(--text3); font-weight:300; margin-top:1px; }
  .prod-h { display:flex; justify-content:space-between; margin-bottom:7px; }
  .prod-lb { font-size:12px; color:var(--text3); font-weight:300; }
  .prod-track { height:3px; background:var(--bg4); border-radius:2px; overflow:hidden; margin-bottom:14px; }
  .prod-fill { height:100%; border-radius:2px; background:linear-gradient(90deg,var(--sage),rgba(126,155,138,0.6)); transition:width 0.8s; }

  /* ── GESTÃO CLÍNICAS ── */
  .clinica-manage { background:var(--bg2); border:1px solid var(--border); border-radius:var(--r); padding:14px 16px; margin-bottom:8px; display:flex; align-items:center; gap:12px; }
  .cm-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
  .cm-info { flex:1; }
  .cm-nome { font-size:14px; font-weight:500; }
  .cm-cidade { font-size:11px; color:var(--text3); font-weight:300; }
  .cm-actions { display:flex; gap:4px; }
  .color-picker { display:flex; gap:6px; flex-wrap:wrap; }
  .color-swatch { width:24px; height:24px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:all 0.18s; }
  .color-swatch.sel { border-color:var(--text); transform:scale(1.15); }

  /* ── SYNC BADGE ── */
  .sync-badge { display:inline-flex; align-items:center; gap:5px; font-size:10px; color:var(--text3); font-weight:300; }
  .sync-dot { width:5px; height:5px; border-radius:50%; }

  /* ── EMPTY ── */
  .empty { display:flex; flex-direction:column; align-items:center; padding:60px 32px; text-align:center; color:var(--text3); gap:10px; }
  .empty-title { font-family:var(--font-d); font-size:20px; color:var(--text2); }
  .empty-sub { font-size:13px; font-weight:300; line-height:1.6; }

  /* ── ANIMATIONS ── */
  @keyframes fu { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .fu { animation:fu 0.35s cubic-bezier(0,0,0.2,1) both; }
  .fu1{animation-delay:0.05s} .fu2{animation-delay:0.10s} .fu3{animation-delay:0.15s}
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

// ─── FASES ───────────────────────────────────────────────────────────────────

const FASES = [
  { key:"chegadaClinica",    icon:"building", label:"Cheguei na clínica" },
  { key:"atendimentoInicio", icon:"steth",    label:"Iniciei atendimentos" },
  { key:"atendimentoFim",    icon:"check",    label:"Finalizei atendimentos" },
  { key:"chegadaCasa",       icon:"home",     label:"Cheguei em casa" },
];
const getFaseClass = (t) => !t.chegadaClinica?"ft":!t.atendimentoInicio?"fc":!t.atendimentoFim?"fa":"fr";
const getFaseLbl   = (t) => !t.chegadaClinica?"Em deslocamento":!t.atendimentoInicio?"Na clínica":!t.atendimentoFim?"Em atendimento":!t.chegadaCasa?"Retornando":"Concluído";

// Fases para turnos de missão — variam conforme o dia
// Dia 1: chegadaDestino → atendimentoInicio → atendimentoFim
// Dias intermediários: atendimentoInicio → atendimentoFim
// Último dia: atendimentoInicio → atendimentoFim → partidaDestino → chegadaCasa
const getFasesMissao = (turno, missao) => {
  if (!missao) return FASES;
  const isDia1    = turno.diaMissao === 1;
  const isUltimo  = missao.noites === 0 || (turno.diaMissao > missao.noites);
  const fases = [];
  if (isDia1)   fases.push({ key:"chegadaClinica",  icon:"plane",    label:"Cheguei no destino" });
  fases.push(   { key:"atendimentoInicio",           icon:"steth",    label:"Iniciei atendimentos" });
  fases.push(   { key:"atendimentoFim",              icon:"check",    label:"Finalizei atendimentos" });
  if (isUltimo) fases.push({ key:"chegadaCasa",      icon:"home",     label:"Cheguei em casa" });
  return fases;
};

const MEIOS_TRANSPORTE = ["Carro","Avião","Ônibus","Moto","Van","Barco"];

// Calcula deslocamento distribuído por turno de missão
const calcDeslocMissao = (missao, nTurnos) => {
  if (!missao || !nTurnos) return 0;
  const ida   = missao.chegadaDestino && missao.saidaCasa   ? missao.chegadaDestino - missao.saidaCasa   : 0;
  const volta = missao.chegadaCasa    && missao.partidaDestino ? missao.chegadaCasa - missao.partidaDestino : 0;
  return (ida + volta) / nTurnos;
};

// ─── MOCK HISTORY (shown when no real data) ───────────────────────────────────

const mockHistorico = () => {
  const base = Date.now(), dia = 86400000;
  const raw = [
    { cid:"hof",         da:1,  sh:8,   ch:9,    ih:9.25, fh:14.5, cch:15.5, dg:2, hm:"bom",     tr:"leve" },
    { cid:"ame_piraja",  da:2,  sh:7,   ch:8.5,  ih:9,    fh:15,   cch:16.5, dg:3, hm:"cansado", tr:"moderado" },
    { cid:"iofs",        da:4,  sh:8.5, ch:9.25, ih:9.5,  fh:13.5, cch:14.5, dg:2, hm:"bom",     tr:"leve" },
    { cid:"oftalmodiagnose",da:5,sh:8,  ch:8.75, ih:9,    fh:14,   cch:15,   dg:2, hm:"neutro",  tr:"leve" },
    { cid:"floriano",    da:14, sh:9,   ch:9.5,  ih:10,   fh:16,   cch:16.5, dg:3, hm:"neutro",  tr:"leve",
      missao:{ cidade:"Floriano, PI", tempoViagemEstimadoH:7, meios:["Ônibus"], noites:2, diasConsecutivos:3, diasOciosos:1, hospedagemProxima:true }},
  ];
  return raw.map((r,i) => {
    const d = base - r.da * dia, h = (hr) => d + hr * 3600000;
    return { id:`m${i}`, clinicaId:r.cid, saidaCasa:h(r.sh), chegadaClinica:h(r.ch),
      atendimentoInicio:h(r.ih), atendimentoFim:h(r.fh), chegadaCasa:h(r.cch),
      desgaste:r.dg, humor:r.hm, transito:r.tr, missao:r.missao||null, observacoes:"", status:"concluido" };
  }).sort((a,b) => b.saidaCasa - a.saidaCasa);
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const SyncBadge = ({ saving }) => (
  <div className="sync-badge">
    <div className="sync-dot" style={{ background: saving ? "var(--amber)" : "var(--sage)" }} />
    {saving ? "Salvando…" : "Sincronizado"}
  </div>
);

// ── Top Nav ───────────────────────────────────────────────────

const TopNav = ({ active, onChange, saving }) => {
  const tabs = [
    { id:"turno",      icon:"timer",      label:"Turno" },
    { id:"historico",  icon:"history",    label:"Histórico" },
    { id:"analytics",  icon:"chart",      label:"Analytics" },
    { id:"clinicas",   icon:"building",   label:"Clínicas" },
    { id:"semana",     icon:"calendar",   label:"Semana" },
    { id:"calculadora",icon:"calculator", label:"Calculadora" },
  ];
  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <button className="nav-logo" onClick={() => onChange("turno")}>meridian</button>
        <div className="nav-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`nav-tab${active===t.id?" on":""}`} onClick={() => onChange(t.id)}>
              <div className="nav-tab-dot" />
              <Icon d={ICONS[t.icon]} size={14} stroke={1.4} />
              {t.label}
            </button>
          ))}
        </div>
        <SyncBadge saving={saving} />
      </div>
    </nav>
  );
};

// ── Mobile Tab Bar ────────────────────────────────────────────

const TabBar = ({ active, onChange }) => {
  const tabs = [
    { id:"turno",      icon:"timer",      label:"Turno" },
    { id:"historico",  icon:"history",    label:"Histórico" },
    { id:"analytics",  icon:"chart",      label:"Analytics" },
    { id:"clinicas",   icon:"building",   label:"Clínicas" },
    { id:"calculadora",icon:"calculator", label:"Calcular" },
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <button key={t.id} className={`tab${active===t.id?" on":""}`} onClick={() => onChange(t.id)}>
          <Icon d={ICONS[t.icon]} size={19} stroke={active===t.id?1.8:1.4} color={active===t.id?"var(--text)":"var(--text3)"} />
          <span className="tab-lbl">{t.label}</span>
        </button>
      ))}
    </div>
  );
};

// ── Turno Ativo ───────────────────────────────────────────────

const TurnoAtivo = ({ turno, onAction, onPausa, onRetomar, onEncerrar, onEncerrarDia, clinicas, missoes = [] }) => {
  const clinica = getClinicaById(turno.clinicaId, clinicas);

  // Determina se é turno de missão e qual o contexto
  const missao      = turno.missaoId ? missoes.find(m => m.id === turno.missaoId) : null;
  const isMissao    = !!missao;
  const isUltimoDia = !isMissao || missao.noites === 0 || (turno.diaMissao || 1) > missao.noites;
  const diaAtual    = turno.diaMissao || 1;

  // Fases adaptadas: missão dia intermediário não tem "Cheguei em casa"
  const fases = useMemo(() => {
    if (!isMissao) return FASES;
    const base = [
      ...(diaAtual === 1 ? [{ key:"chegadaClinica",  icon:"plane",    label:"Cheguei no destino" }] :
                           [{ key:"chegadaClinica",  icon:"building", label:"Cheguei na clínica" }]),
      { key:"atendimentoInicio", icon:"steth",    label:"Iniciei atendimentos" },
      { key:"atendimentoFim",    icon:"check",    label:"Finalizei atendimentos" },
    ];
    if (isUltimoDia) base.push({ key:"chegadaCasa", icon:"home", label:"Cheguei em casa" });
    return base;
  }, [isMissao, diaAtual, isUltimoDia]);

  const faseIdx = fases.findIndex(f => !turno[f.key]);

  // Timer — usa saidaCasa do turno ou atendimentoInicio se for dia intermediário
  const timerBase = turno.saidaCasa || turno.atendimentoInicio;
  const dur = useDuration(timerBase);

  const emAtendimento = !!turno.atendimentoInicio && !turno.atendimentoFim;
  const pausas = turno.pausas || [];
  const pausaAtiva = pausas.find(p => !p.fim);
  const totalPausaMs = calcTotalPausa(pausas);
  const pausaAtivaDur = useDuration(pausaAtiva?.inicio || null);

  // Atendimento finalizado mas não é último dia → estado suspenso
  const atendimentoFinalizado = !!turno.atendimentoFim;
  const diaSuspenso = isMissao && atendimentoFinalizado && !isUltimoDia && !turno.chegadaCasa;

  const [mostraMotivoInput, setMostraMotivoInput] = useState(false);
  const [motivo, setMotivo] = useState("");
  const inputRef = useRef(null);

  const handlePausarClick = () => { setMostraMotivoInput(true); setMotivo(""); setTimeout(() => inputRef.current?.focus(), 80); };
  const confirmarPausa = () => { setMostraMotivoInput(false); onPausa(motivo.trim() || null); setMotivo(""); };
  const cancelarPausa = () => { setMostraMotivoInput(false); setMotivo(""); };

  return (
    <div className={`shift-card ${getFaseClass(turno)} fu`}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
        <div className="clin-pill">
          <div className="cdot" style={{ width:7, height:7, background:clinica.cor }} />
          <span style={{ color:"var(--text2)", fontSize:13 }}>{clinica.nome}</span>
          {isMissao && (
            <span style={{ fontSize:10, color:"var(--amber)", display:"flex", alignItems:"center", gap:3 }}>
              <Icon d={ICONS.plane} size={10} stroke={1.5} color="var(--amber)" />
              {missao.cidade} · Dia {diaAtual}
            </span>
          )}
          {!isMissao && turno.missao && (
            <span style={{ fontSize:10, color:"var(--amber)", display:"flex", alignItems:"center", gap:3 }}>
              <Icon d={ICONS.plane} size={10} stroke={1.5} color="var(--amber)" /> Missão
            </span>
          )}
        </div>

        {/* Indicador de estado */}
        {diaSuspenso ? (
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, letterSpacing:"1.2px", textTransform:"uppercase", color:"var(--amber)" }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--amber)" }} />
            <span>Suspenso</span>
          </div>
        ) : pausaAtiva ? (
          <div className="pausa-indicator">
            <div className="pausa-dot" />
            <span>Pausado · {fmtDur(pausaAtivaDur)}</span>
          </div>
        ) : (
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--sage)" }}>
            <div className="live-dot" /><span>Live</span>
          </div>
        )}
      </div>

      {/* Estado suspenso — atendimento do dia encerrado, não é último dia */}
      {diaSuspenso ? (
        <div style={{ textAlign:"center", padding:"24px 0" }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🏨</div>
          <div style={{ fontFamily:"var(--font-d)", fontSize:22, color:"var(--amber)", marginBottom:6 }}>
            Dia {diaAtual} encerrado
          </div>
          <div style={{ fontSize:13, color:"var(--text3)", fontWeight:300, marginBottom:4 }}>
            Atendimento finalizado às {fmtTime(turno.atendimentoFim)}
          </div>
          <div style={{ fontSize:11, color:"var(--text4)", fontWeight:300, marginBottom:24 }}>
            {missao.noites - diaAtual} dia{missao.noites - diaAtual !== 1 ? "s" : ""} restante{missao.noites - diaAtual !== 1 ? "s" : ""} de missão · {missao.cidade}
          </div>
          <button className="enc-btn" style={{ background:"rgba(160,140,96,0.12)", borderColor:"rgba(160,140,96,0.3)", color:"var(--amber)" }} onClick={onEncerrarDia}>
            Encerrar dia e ir para o hotel
          </button>
        </div>
      ) : (
        <>
          {/* Barra de progresso de fases */}
          <div className="ftrack">
            {fases.map((f,i) => (
              <div key={f.key} className={`fseg${turno[f.key]?" done":i===faseIdx?" cur":""}`} />
            ))}
          </div>

          <div style={{ fontSize:10, letterSpacing:"2px", textTransform:"uppercase", color:"var(--text3)", marginBottom:4 }}>
            {pausaAtiva ? "Em pausa" : getFaseLbl(turno)}
          </div>
          <div className="timer" style={{ color: pausaAtiva ? "var(--amber)" : "var(--text)" }}>{fmtDur(dur)}</div>
          <div style={{ fontSize:12, color:"var(--text3)", fontWeight:300, marginBottom:22 }}>
            {timerBase ? `Saída às ${fmtTime(timerBase)}` : ""}
          </div>

          {/* Grid de ações */}
          <div className="agrid">
            {fases.map((f,i) => {
              const done = !!turno[f.key];
              const cur  = i === faseIdx && !pausaAtiva;
              return (
                <button key={f.key} className={`abtn${done?" adone":cur?" acur":""}`} onClick={() => cur && onAction(f.key)}>
                  {done && <div className="a-check"><Icon d={ICONS.check} size={13} stroke={2} color="var(--sage)" /></div>}
                  <div className="a-icon"><Icon d={ICONS[f.icon]} size={17} stroke={1.4} /></div>
                  <div className="a-lbl">{f.label}</div>
                  {done && <div className="a-time">{fmtTime(turno[f.key])}</div>}
                </button>
              );
            })}
          </div>

          {/* Botão de pausa */}
          {emAtendimento && !mostraMotivoInput && (
            <button className={`pause-btn${pausaAtiva ? " pausado" : ""}`} onClick={pausaAtiva ? onRetomar : handlePausarClick}>
              <Icon d={pausaAtiva ? ICONS.play : ICONS.pause} size={14} stroke={1.6} color={pausaAtiva ? "var(--sage)" : "var(--amber)"} />
              {pausaAtiva ? "Retomar atendimento" : "Pausar atendimento"}
            </button>
          )}

          {/* Mini-form motivo da pausa */}
          {mostraMotivoInput && (
            <div style={{ marginTop:8, background:"rgba(160,140,96,0.06)", border:"1px solid rgba(160,140,96,0.2)", borderRadius:"var(--r)", padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--amber)", fontWeight:400 }}>
                Motivo da pausa <span style={{ color:"var(--text3)" }}>(opcional)</span>
              </div>
              <input ref={inputRef} className="fi" style={{ fontSize:13, padding:"8px 12px" }}
                placeholder="Ex.: sem paciente, intervalo, reunião…" value={motivo}
                onChange={e => setMotivo(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirmarPausa(); if (e.key === "Escape") cancelarPausa(); }} />
              <div style={{ display:"flex", gap:8 }}>
                <button className="pause-btn" style={{ flex:1, marginTop:0 }} onClick={confirmarPausa}>
                  <Icon d={ICONS.pause} size={13} stroke={1.6} color="var(--amber)" /> Pausar
                </button>
                <button onClick={cancelarPausa} style={{ background:"none", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"10px 16px", color:"var(--text3)", fontSize:12, cursor:"pointer", fontFamily:"var(--font)" }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de pausas */}
          {pausas.length > 0 && (
            <div className="pausa-lista">
              {pausas.map((p, i) => (
                <div key={i} style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  <div className="pausa-item">
                    <span><Icon d={ICONS.coffee} size={11} stroke={1.4} style={{ marginRight:5, verticalAlign:"middle" }} />
                      Pausa {i+1} · {fmtTime(p.inicio)}{p.fim ? ` → ${fmtTime(p.fim)}` : " · em andamento"}
                    </span>
                    {p.fim && <span className="pausa-item-dur">{fmtDur(p.fim - p.inicio)}</span>}
                  </div>
                  {p.motivo && <div style={{ fontSize:10, color:"var(--text3)", fontWeight:300, paddingLeft:14, fontStyle:"italic" }}>"{p.motivo}"</div>}
                </div>
              ))}
              {totalPausaMs > 0 && <div style={{ fontSize:10, color:"var(--text3)", textAlign:"right", marginTop:2, fontWeight:300 }}>Total em pausa: {fmtDur(totalPausaMs)}</div>}
            </div>
          )}

          {/* Encerrar turno (último dia ou local) */}
          {turno.chegadaCasa && !pausaAtiva && (
            <button className="enc-btn" onClick={onEncerrar}>Encerrar turno</button>
          )}
        </>
      )}
    </div>
  );
};
// ── Start Shift ───────────────────────────────────────────────

const StartShift = ({ onIniciar, onIniciarMissaoDia, clinicas, missoes, saving }) => {
  const [step,     setStep]   = useState("tipo");
  const [tipo,     setTipo]   = useState(null);
  const [clinica,  setClin]   = useState(null);
  const [meiosSel, setMeios]  = useState([]);
  const [novaM,    setNovaM]  = useState({
    cidade:"", noites:1, tempoViagemH:2, hospedagemProxima:false,
    saidaCasa:"", chegadaDestino:"", observacoes:""
  });
  const [missaoSel, setMissaoSel] = useState(null); // missão existente selecionada

  const toggleMeio = (m) => setMeios(prev => prev.includes(m) ? prev.filter(x=>x!==m) : [...prev, m]);

  const confirmarLocal = (c = clinica) => onIniciar({ clinicaId: c.id, saidaCasa: now(), missaoId: null });

  const confirmarNovaMissao = () => {
    const missao = {
      id:            uid(),
      clinicaId:     clinica.id,
      cidade:        novaM.cidade || clinica.cidade,
      meios:         meiosSel.length ? meiosSel : ["Outro"],
      noites:        novaM.noites,
      tempoViagemH:  novaM.tempoViagemH,
      hospedagemProxima: novaM.hospedagemProxima,
      saidaCasa:     novaM.saidaCasa ? new Date(novaM.saidaCasa).getTime() : now(),
      chegadaDestino: novaM.chegadaDestino ? new Date(novaM.chegadaDestino).getTime() : null,
      observacoes:   novaM.observacoes || null,
      status:        "aberta",
    };
    onIniciar({ clinicaId: clinica.id, saidaCasa: missao.saidaCasa, missaoId: missao.id, diaMissao: 1, novaMissao: missao });
  };

  const confirmarDiaMissao = () => {
    if (!missaoSel) return;
    // Quantos turnos já existem nessa missão?
    onIniciarMissaoDia(missaoSel);
  };

  // Missões abertas disponíveis para novo dia
  const missoesAbertas = (missoes || []).filter(m => m.status === "aberta");

  return (
    <div>
      {step === "tipo" && (
        <div className="tipo-list fu">
          {[
            { t:"local",     icon:"building", title:"Atendimento local",       sub:"Clínica na mesma cidade" },
            { t:"missao_nova", icon:"plane",  title:"Nova missão profissional", sub:"Primeira saída desta viagem" },
            ...(missoesAbertas.length ? [{ t:"missao_dia", icon:"calendar", title:"Novo dia de missão", sub:`${missoesAbertas.length} missão${missoesAbertas.length>1?"ões":""} em andamento` }] : []),
          ].map(({ t, icon, title, sub }) => (
            <button key={t} className="tipo-card" onClick={() => { setTipo(t); setStep(t === "missao_dia" ? "missao_sel" : "clinica"); }}>
              <div className="tipo-icon"><Icon d={ICONS[icon] || ICONS.building} size={20} stroke={1.3} /></div>
              <div><div className="tipo-title">{title}</div><div className="tipo-sub">{sub}</div></div>
              <Icon d={ICONS.chevron} size={15} stroke={1.5} color="var(--text3)" style={{ marginLeft:"auto" }} />
            </button>
          ))}
        </div>
      )}

      {/* Selecionar missão existente para novo dia */}
      {step === "missao_sel" && (
        <>
          <div className="overlay" onClick={() => setStep("tipo")} />
          <div className="sheet">
            <div className="sh-handle" />
            <div className="sh-title">Qual missão está em andamento?</div>
            <div className="clin-list">
              {missoesAbertas.map(m => {
                const c = getClinicaById(m.clinicaId, clinicas);
                return (
                  <button key={m.id} className={`clin-opt${missaoSel?.id===m.id?" sel":""}`}
                    onClick={() => setMissaoSel(m)}>
                    <div className="cdot" style={{ width:10, height:10, background:c.cor }} />
                    <div>
                      <div className="clin-nome">{m.cidade}</div>
                      <div className="clin-cidade">{c.nome} · {m.noites > 0 ? `${m.noites} noite${m.noites>1?"s":""}` : "ida e volta"}</div>
                    </div>
                    <div className="clin-vtag">✈ Missão</div>
                  </button>
                );
              })}
            </div>
            {missaoSel && (
              <button className="btn-p" onClick={confirmarDiaMissao} disabled={saving}>
                {saving ? "Iniciando…" : "Iniciar dia de atendimento"}
              </button>
            )}
            <button className="btn-s" onClick={() => setStep("tipo")}>Voltar</button>
          </div>
        </>
      )}

      {/* Selecionar clínica */}
      {step === "clinica" && (
        <>
          <div className="overlay" onClick={() => setStep("tipo")} />
          <div className="sheet">
            <div className="sh-handle" />
            <div className="sh-title">Selecionar clínica</div>
            <div className="sh-sub">{tipo==="local" ? "Atendimento local" : "Nova missão"}</div>
            <div className="clin-list">
              {clinicas.filter(c => tipo==="local" ? c.tipo!=="viagem" : true).map(c => (
                <button key={c.id} className={`clin-opt${clinica?.id===c.id?" sel":""}`}
                  onClick={() => {
                    setClin(c);
                    if (tipo === "local") confirmarLocal(c);
                    else { setNovaM(m=>({...m, cidade: c.cidade || ""})); setStep("missao_form"); }
                  }}>
                  <div className="cdot" style={{ width:10, height:10, background:c.cor }} />
                  <div><div className="clin-nome">{c.nome}</div><div className="clin-cidade">{c.cidade}</div></div>
                  {c.tipo==="viagem" && <div className="clin-vtag">Missão</div>}
                </button>
              ))}
            </div>
            <button className="btn-s" onClick={() => setStep("tipo")}>Voltar</button>
          </div>
        </>
      )}

      {/* Formulário de nova missão */}
      {step === "missao_form" && clinica && (
        <>
          <div className="overlay" />
          <div className="sheet" style={{ maxHeight:"90vh", overflowY:"auto" }}>
            <div className="sh-handle" />
            <div className="sh-title">Detalhes da missão</div>
            <div className="sh-sub">{clinica.nome}</div>

            <div className="fg" style={{ marginBottom:10 }}>
              <label className="fl">Cidade de destino</label>
              <input className="fi" type="text" value={novaM.cidade} placeholder="Ex: Floriano, PI"
                onChange={e => setNovaM(m=>({...m, cidade:e.target.value}))} />
            </div>

            <div className="fg" style={{ marginBottom:10 }}>
              <label className="fl">Meio(s) de transporte</label>
              <div className="chips">
                {MEIOS_TRANSPORTE.map(m => (
                  <button key={m} className={`chip${meiosSel.includes(m)?" sel":""}`} onClick={() => toggleMeio(m)}>{m}</button>
                ))}
              </div>
            </div>

            <div className="frow" style={{ marginBottom:10 }}>
              <div className="fg">
                <label className="fl">Saída de casa</label>
                <input className="fi" type="datetime-local" value={novaM.saidaCasa}
                  onChange={e => {
                    const saida = e.target.value;
                    setNovaM(m => {
                      const chegada = m.chegadaDestino;
                      const h = saida && chegada
                        ? Math.round(((new Date(chegada) - new Date(saida)) / 3600000) * 10) / 10
                        : m.tempoViagemH;
                      return { ...m, saidaCasa: saida, tempoViagemH: h > 0 ? h : m.tempoViagemH };
                    });
                  }} />
              </div>
              <div className="fg">
                <label className="fl">Chegada no destino</label>
                <input className="fi" type="datetime-local" value={novaM.chegadaDestino}
                  onChange={e => {
                    const chegada = e.target.value;
                    setNovaM(m => {
                      const h = m.saidaCasa && chegada
                        ? Math.round(((new Date(chegada) - new Date(m.saidaCasa)) / 3600000) * 10) / 10
                        : m.tempoViagemH;
                      return { ...m, chegadaDestino: chegada, tempoViagemH: h > 0 ? h : m.tempoViagemH };
                    });
                  }} />
              </div>
            </div>

            <div className="frow" style={{ marginBottom:10 }}>
              <div className="fg">
                <label className="fl">Noites fora <span style={{ color:"var(--text3)", fontWeight:300 }}>(0 = mesmo dia)</span></label>
                <input className="fi" type="number" min="0" max="30" value={novaM.noites}
                  onChange={e => setNovaM(m=>({...m, noites:+e.target.value}))} />
              </div>
              <div className="fg">
                <label className="fl">
                  Tempo de viagem (h)
                  {novaM.saidaCasa && novaM.chegadaDestino && (
                    <span style={{ color:"var(--sage)", fontWeight:300, textTransform:"none", letterSpacing:0, marginLeft:4 }}>· calculado</span>
                  )}
                </label>
                <input className="fi" type="number" min="0" max="48" step="0.5" value={novaM.tempoViagemH}
                  onChange={e => setNovaM(m=>({...m, tempoViagemH:+e.target.value}))} />
              </div>
            </div>

            <div className="fg" style={{ marginBottom:10 }}>
              <label className="fl">Hospedagem próxima à clínica</label>
              <div className="chips">
                {[{v:true,l:"Sim"},{v:false,l:"Não"}].map(({v,l}) => (
                  <button key={l} className={`chip${novaM.hospedagemProxima===v?" sel":""}`}
                    onClick={() => setNovaM(m=>({...m, hospedagemProxima:v}))}>{l}</button>
                ))}
              </div>
            </div>

            <div className="fg" style={{ marginBottom:14 }}>
              <label className="fl">Observações</label>
              <input className="fi" type="text" value={novaM.observacoes} placeholder="Opcional..."
                onChange={e => setNovaM(m=>({...m, observacoes:e.target.value}))} />
            </div>

            <div style={{ background:"rgba(160,140,96,0.08)", border:"1px solid rgba(160,140,96,0.2)", borderRadius:"var(--r-sm)", padding:"10px 12px", marginBottom:14, fontSize:11, color:"var(--text3)", fontWeight:300 }}>
              ✈ Primeiro turno registrado agora. Para os próximos dias, escolha "Novo dia de missão" na tela inicial.
              {novaM.noites === 0 && " Esta é uma missão de ida e volta — apenas 1 turno."}
            </div>

            <button className="btn-p" onClick={confirmarNovaMissao} disabled={saving || !novaM.cidade}>
              {saving ? "Iniciando…" : "Iniciar missão"}
            </button>
            <button className="btn-s" onClick={() => setStep("clinica")}>Voltar</button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Encerrar Sheet ────────────────────────────────────────────

const EncerrarSheet = ({ turno, onConfirmar, onCancelar, saving, clinicas }) => {
  const [humor,    setHumor]   = useState("bom");
  const [desgaste, setDesgaste] = useState(2);
  const [transito, setTransito] = useState("moderado");
  const [obs,      setObs]     = useState("");

  const clinica    = getClinicaById(turno.clinicaId, clinicas);
  const pausas     = turno.pausas || [];
  const totalPausa = calcTotalPausa(pausas);
  const ida        = turno.chegadaClinica ? turno.chegadaClinica - turno.saidaCasa : null;
  const atendBruto = turno.atendimentoFim && turno.atendimentoInicio ? turno.atendimentoFim - turno.atendimentoInicio : null;
  const atendLiq   = atendBruto !== null ? Math.max(0, atendBruto - totalPausa) : null;
  const volta      = turno.chegadaCasa && turno.atendimentoFim ? turno.chegadaCasa - turno.atendimentoFim : null;
  const total      = turno.chegadaCasa ? turno.chegadaCasa - turno.saidaCasa : null;
  const prod       = atendLiq && total ? Math.round((atendLiq / total) * 100) : null;

  // Build timeline inserindo pausas entre início e fim de atendimento
  const tlBase = [
    { ts:turno.saidaCasa,        lbl:"Saída de casa",         dur:ida,       tipo:"normal" },
    { ts:turno.chegadaClinica,   lbl:"Chegada na clínica",    dur:turno.atendimentoInicio&&turno.chegadaClinica?turno.atendimentoInicio-turno.chegadaClinica:null, tipo:"normal" },
    { ts:turno.atendimentoInicio,lbl:"Início do atendimento", dur:null,      tipo:"normal" },
    ...pausas.filter(p=>p.fim).flatMap(p => [
      { ts:p.inicio, lbl:`Pausa iniciada${p.motivo ? ` · ${p.motivo}` : ""}`, dur:p.fim-p.inicio, tipo:"pausa" },
      { ts:p.fim,    lbl:"Atendimento retomado", dur:null, tipo:"retomada" },
    ]),
    { ts:turno.atendimentoFim,   lbl:"Fim do atendimento",   dur:volta,     tipo:"normal" },
    { ts:turno.chegadaCasa,      lbl:"Chegada em casa",       dur:null,      tipo:"normal" },
  ].filter(i => i.ts).sort((a,b) => a.ts - b.ts);

  return (
    <>
      <div className="overlay" onClick={onCancelar} />
      <div className="sheet">
        <div className="sh-handle" />
        <div className="sh-title">Resumo do turno</div>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18, paddingBottom:16, borderBottom:"1px solid var(--border2)" }}>
          <div className="cdot" style={{ width:12, height:12, background:clinica.cor }} />
          <div style={{ fontFamily:"var(--font-d)", fontSize:20 }}>{clinica.nome}</div>
          {turno.missao && (
            <div style={{ marginLeft:"auto", fontSize:10, color:"var(--amber)", background:"var(--amber2)", borderRadius:100, padding:"4px 10px", display:"flex", alignItems:"center", gap:5 }}>
              <Icon d={ICONS.plane} size={10} stroke={1.5} />Missão
            </div>
          )}
        </div>

        {/* Timeline com pausas */}
        <div className="tl">
          {tlBase.map((item,i) => (
            <div className="tl-row" key={i}>
              <div className="tl-l"><span className="tl-t">{fmtTime(item.ts)}</span></div>
              <div className="tl-sp">
                <div className="tl-dot f" style={item.tipo==="pausa"?{background:"var(--amber)",borderColor:"var(--amber)"}:item.tipo==="retomada"?{background:"var(--sage)",borderColor:"var(--sage)"}:{}} />
                {i < tlBase.length - 1 && <div className="tl-line" style={item.tipo==="pausa"?{background:"rgba(160,140,96,0.3)",borderLeft:"1px dashed rgba(160,140,96,0.3)",width:0,marginLeft:3}:{}} />}
              </div>
              <div className="tl-c">
                <div className="tl-lb" style={item.tipo==="pausa"?{color:"var(--amber)"}:item.tipo==="retomada"?{color:"var(--sage)"}:{}}>{item.lbl}</div>
                {item.dur > 0 && <div className="tl-dur" style={item.tipo==="pausa"?{color:"var(--amber)"}:{}}>{fmtDur(item.dur)}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Produtividade */}
        {prod !== null && (
          <div>
            <div className="prod-h">
              <span className="prod-lb">Produtividade líquida</span>
              <span style={{ fontSize:13, fontWeight:500, color:prod>65?"var(--sage)":prod>45?"var(--amber)":"var(--wine)" }}>{prod}%</span>
            </div>
            <div className="prod-track"><div className="prod-fill" style={{ width:`${prod}%` }} /></div>
          </div>
        )}

        {/* Métricas */}
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${totalPausa>0?4:3},1fr)`, gap:6, marginBottom:16, background:"var(--bg2)", borderRadius:"var(--r-sm)", padding:10 }}>
          {[
            {l:"Ida",         v:fmtDur(ida)},
            {l:"Atend. líq.", v:fmtDur(atendLiq)},
            ...(totalPausa>0?[{l:`Pausa (${pausas.filter(p=>p.fim).length}×)`, v:fmtDur(totalPausa), cor:"var(--amber)"}]:[]),
            {l:"Total fora",  v:fmtDur(total)},
          ].map(({l,v,cor}) => (
            <div key={l} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"var(--font-d)", fontSize:15, color:cor||"var(--text)" }}>{v}</div>
              <div style={{ fontSize:9, color:"var(--text3)", marginTop:2, fontWeight:300 }}>{l}</div>
            </div>
          ))}
        </div>

        {turno.missao?.diasOciosos > 0 && (
          <div className="idle-card" style={{ marginBottom:14 }}>
            <div className="idle-icon"><Icon d={ICONS.bed} size={15} stroke={1.4} /></div>
            <div className="idle-text">
              <strong>{turno.missao.diasOciosos} dia{turno.missao.diasOciosos>1?"s":""} ocioso{turno.missao.diasOciosos>1?"s":""}</strong> somados ao custo desta missão.
            </div>
          </div>
        )}

        <div className="fg">
          <label className="fl">Como foi o dia?</label>
          <div className="chips">{HUMOR.map(h => <button key={h.v} className={`chip${humor===h.v?" sel":""}`} onClick={()=>setHumor(h.v)}>{h.l}</button>)}</div>
        </div>
        <div className="fg">
          <label className="fl">Desgaste físico</label>
          <div className="chips">
            {DESGASTE.map(d => (
              <button key={d.v} className={`chip${desgaste===d.v?" sel":""}`} onClick={()=>setDesgaste(d.v)}
                style={desgaste===d.v?{borderColor:d.cor,color:d.cor,background:`${d.cor}18`}:{}}>
                <span style={{ fontFamily:"monospace", fontSize:13 }}>{d.sym}</span>{d.l}
              </button>
            ))}
          </div>
        </div>
        <div className="fg">
          <label className="fl">Trânsito percebido</label>
          <div className="chips">{TRANSITO.map(t => <button key={t.v} className={`chip${transito===t.v?" sel":""}`} onClick={()=>setTransito(t.v)}>{t.l}</button>)}</div>
        </div>
        <div className="fg">
          <label className="fl">Observações</label>
          <textarea className="fi" rows={2} placeholder="Notas sobre o turno…" value={obs} onChange={e=>setObs(e.target.value)} style={{ resize:"none", lineHeight:1.6 }} />
        </div>
        <button className="btn-p" onClick={() => onConfirmar({humor,desgaste,transito,observacoes:obs})} disabled={saving}>
          {saving?"Salvando…":"Salvar turno"}
        </button>
        <button className="btn-s" onClick={onCancelar}>Cancelar</button>
      </div>
    </>
  );
};

// ── Tela Home ─────────────────────────────────────────────────

const getSaudacao = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
};

const TelaHome = ({ turno, historico, missoes, onIniciar, onIniciarMissaoDia, onAction, onPausa, onRetomar, onEncerrar, onEncerrarDia, saving, clinicas }) => {
  const score = calcMeridianScore(historico);
  const { l:sl, cor:sc } = getMeridianLabel(score);
  const cls = score===null?"":score>=80?"s":score>=60?"a":"d";
  const ultimo = historico[0];
  const agora  = new Date();

  // ── Métricas mês atual ──
  const turnosMes = historico.filter(t => {
    const d = new Date(t.saidaCasa);
    return d.getMonth()===agora.getMonth() && d.getFullYear()===agora.getFullYear();
  });
  const foraMs  = turnosMes.reduce((a,t)=>a+(t.chegadaCasa?t.chegadaCasa-t.saidaCasa:0),0);
  const atendMs = turnosMes.reduce((a,t)=>a+(t.atendimentoFim&&t.atendimentoInicio?t.atendimentoFim-t.atendimentoInicio:0),0);

  // ── Métricas ano atual ──
  const turnosAno = historico.filter(t => new Date(t.saidaCasa).getFullYear()===agora.getFullYear());
  const foraAno   = turnosAno.reduce((a,t)=>a+(t.chegadaCasa?t.chegadaCasa-t.saidaCasa:0),0);
  const atendAno  = turnosAno.reduce((a,t)=>a+(t.atendimentoFim&&t.atendimentoInicio?t.atendimentoFim-t.atendimentoInicio:0),0);

  const nomeMes = agora.toLocaleDateString("pt-BR",{month:"long"});
  const anoAtual = agora.getFullYear();

  // ── Toggle mês / ano ──
  const [periodoView, setPeriodoView] = useState("mes");
  const isMes = periodoView === "mes";
  const turnosPeriodo = isMes ? turnosMes : turnosAno;
  const foraPeriodo   = isMes ? foraMs   : foraAno;
  const atendPeriodo  = isMes ? atendMs  : atendAno;
  const labelPeriodo  = isMes ? nomeMes  : String(anoAtual);

  return (
    <div className="content">
      <div className="ph">
        <div className="ph-ey">Meridian</div>
        <div className="ph-title">{turno ? "Turno ativo" : getSaudacao()}</div>
        {!turno && <div className="ph-sub">Selecione o tipo de jornada</div>}
      </div>

      {turno ? (
        <TurnoAtivo turno={turno} onAction={onAction} onPausa={onPausa} onRetomar={onRetomar} onEncerrar={onEncerrar} onEncerrarDia={onEncerrarDia} clinicas={clinicas} missoes={missoes} />
      ) : (
        <div className="home-grid">
          <div className="home-grid-full">
            <StartShift onIniciar={onIniciar} onIniciarMissaoDia={onIniciarMissaoDia} clinicas={clinicas} missoes={missoes} saving={saving} />
          </div>

          <div className={`ms-card ${cls} fu fu1 home-grid-full`}>
            <div className="c-ey">Meridian Score</div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:16, marginBottom:14 }}>
              <div style={{ fontFamily:"var(--font-d)", fontSize:48, color:sc, lineHeight:1, letterSpacing:-2 }}>
                {score!==null?score:"—"}
              </div>
              <div style={{ paddingBottom:4 }}>
                <div style={{ fontSize:13, color:sc, fontWeight:400 }}>{sl}</div>
                <div style={{ fontSize:11, color:"var(--text3)", fontWeight:300 }}>últimos 14 dias</div>
              </div>
            </div>
            {score!==null && <div className="ms-track"><div className="ms-fill" style={{ width:`${score}%`, background:score>=80?"var(--sage)":score>=60?"var(--amber)":"var(--wine)" }} /></div>}
          </div>

          {/* Toggle mês / ano */}
          <div className="home-grid-full">
            <div className="tog fu fu2" style={{ marginBottom:10 }}>
              <button className={`tog-b${isMes?" on":""}`} onClick={()=>setPeriodoView("mes")}>
                {nomeMes}
              </button>
              <button className={`tog-b${!isMes?" on":""}`} onClick={()=>setPeriodoView("ano")}>
                {anoAtual}
              </button>
            </div>
          </div>

          {/* Cards do período */}
          <div className="card cp fu fu2">
            <div className="c-ey">Turnos · {labelPeriodo}</div>
            <div className="c-val-md">{turnosPeriodo.length}</div>
            <div className="c-sub">registrados</div>
          </div>
          <div className="card cp fu fu2">
            <div className="c-ey">Fora de casa · {labelPeriodo}</div>
            <div className="c-val-md">{fmtDur(foraPeriodo) || "—"}</div>
            <div className="c-sub">total acumulado</div>
          </div>
          <div className="card cp fu fu3">
            <div className="c-ey">Atendendo · {labelPeriodo}</div>
            <div className="c-val-md" style={{ color:"var(--sage)" }}>{fmtDur(atendPeriodo) || "—"}</div>
            <div className="c-sub">horas produtivas</div>
          </div>
          <div className="card cp fu fu3">
            <div className="c-ey">Último turno</div>
            <div className="c-val-md">{ultimo?getClinicaById(ultimo.clinicaId,clinicas).nome:"—"}</div>
            <div className="c-sub">{ultimo?fmtDate(ultimo.saidaCasa):"Sem registro"}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Histórico ─────────────────────────────────────────────────

const fmtDatetimeLocal = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const parseDatetimeLocal = (s) => s ? new Date(s).getTime() : null;

// ── Tela Histórico ────────────────────────────────────────────
const TelaHistorico = ({ historico, setHistorico, clinicas, missoes = [], setMissoes }) => {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteAll,     setDeleteAll]     = useState(false);
  const [editando,      setEditando]      = useState(null);
  const [editForm,      setEditForm]      = useState({});
  const [savingEdit,    setSavingEdit]    = useState(false);
  const [missaoExpand,  setMissaoExpand]  = useState({});

  const grupos = useMemo(() => {
    const result = [];
    const usados = new Set();
    missoes.forEach(m => {
      const turnos = historico.filter(t => t.missaoId === m.id).sort((a,b)=>(a.diaMissao||1)-(b.diaMissao||1));
      if (!turnos.length) return;
      turnos.forEach(t => usados.add(t.id));
      result.push({ tipo:"missao", missao:m, turnos });
    });
    historico.forEach(t => { if (!usados.has(t.id)) result.push({ tipo:"turno", turno:t }); });
    result.sort((a,b) => {
      const da = a.tipo==="missao" ? (a.turnos[0]?.saidaCasa||a.turnos[0]?.atendimentoInicio||0) : (a.turno?.saidaCasa||a.turno?.atendimentoInicio||0);
      const db = b.tipo==="missao" ? (b.turnos[0]?.saidaCasa||b.turnos[0]?.atendimentoInicio||0) : (b.turno?.saidaCasa||b.turno?.atendimentoInicio||0);
      return db - da;
    });
    return result;
  }, [historico, missoes]);

  const handleDelete = async (id) => {
    setHistorico(h => h.filter(t => t.id !== id));
    setConfirmDelete(null);
    await deleteTurno(id);
  };

  const handleDeleteAll = async () => {
    setHistorico([]);
    setDeleteAll(false);
    localStorage.removeItem("meridian_turnos_v1");
    await Promise.all(historico.map(t => deleteTurno(t.id)));
  };

  const abrirEdicao = (t) => {
    setEditForm({
      humor:             t.humor    || "bom",
      desgaste:          t.desgaste ?? 2,
      transito:          t.transito || "moderado",
      observacoes:       t.observacoes || "",
      saidaCasa:         fmtDatetimeLocal(t.saidaCasa),
      chegadaClinica:    fmtDatetimeLocal(t.chegadaClinica),
      atendimentoInicio: fmtDatetimeLocal(t.atendimentoInicio),
      atendimentoFim:    fmtDatetimeLocal(t.atendimentoFim),
      chegadaCasa:       fmtDatetimeLocal(t.chegadaCasa),
      pausas:            (t.pausas || []).map(p => ({ ...p })),
    });
    setEditando(t);
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    setSavingEdit(true);

    const pausasEditadas = editForm.pausas.filter(p => p.inicio && p.fim);

    const updated = {
      ...editando,
      humor:             editForm.humor,
      desgaste:          Number(editForm.desgaste),
      transito:          editForm.transito,
      observacoes:       editForm.observacoes || null,
      saidaCasa:         parseDatetimeLocal(editForm.saidaCasa),
      chegadaClinica:    parseDatetimeLocal(editForm.chegadaClinica),
      atendimentoInicio: parseDatetimeLocal(editForm.atendimentoInicio),
      atendimentoFim:    parseDatetimeLocal(editForm.atendimentoFim),
      chegadaCasa:       parseDatetimeLocal(editForm.chegadaCasa),
      pausas:            pausasEditadas,
    };

    await saveTurno(updated);
    setHistorico(h => h.map(t => t.id === updated.id ? updated : t));
    setSavingEdit(false);
    setEditando(null);
  };

  const ef = (field) => (e) => setEditForm(f => ({ ...f, [field]: e.target.value }));
  const removePausa = (i) => setEditForm(f => ({ ...f, pausas: f.pausas.filter((_,j)=>j!==i) }));

  if (!historico.length) return (
    <div className="content">
      <div className="ph"><div className="ph-ey">Registros</div><div className="ph-title">Histórico</div></div>
      <div className="empty"><Icon d={ICONS.history} size={36} stroke={1.2} color="var(--text4)" /><div className="empty-title">Sem turnos</div><div className="empty-sub">Registre seu primeiro turno para começar.</div></div>
    </div>
  );

  return (
    <div className="content">
      <div className="ph" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
        <div>
          <div className="ph-ey">Registros</div>
          <div className="ph-title">Histórico</div>
          <div className="ph-sub">{historico.length} turnos</div>
        </div>
        <button className="btn-icon btn-danger" title="Excluir todo o histórico" onClick={() => setDeleteAll(true)}>
          <Icon d={ICONS.trash} size={15} stroke={1.4} />
        </button>
      </div>

      {deleteAll && (
        <>
          <div className="overlay" onClick={() => setDeleteAll(false)} />
          <div className="sheet">
            <div className="sh-handle" />
            <div className="sh-title">Excluir histórico</div>
            <div className="sh-sub">Esta ação remove todos os {historico.length} turnos registrados. Não pode ser desfeita.</div>
            <button className="btn-p" style={{ background:"rgba(158,96,112,0.15)", borderColor:"rgba(158,96,112,0.3)", color:"var(--wine)" }} onClick={handleDeleteAll}>Excluir tudo</button>
            <button className="btn-s" onClick={() => setDeleteAll(false)}>Cancelar</button>
          </div>
        </>
      )}

      {/* ── Sheet de edição ── */}
      {editando && (
        <>
          <div className="overlay" onClick={() => setEditando(null)} />
          <div className="sheet" style={{ maxHeight:"88vh", overflowY:"auto" }}>
            <div className="sh-handle" />
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <div className="sh-title" style={{ margin:0 }}>Editar turno</div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div className="cdot" style={{ width:8, height:8, background:getClinicaById(editando.clinicaId, clinicas).cor }} />
                <span style={{ fontSize:13, color:"var(--text2)" }}>{getClinicaById(editando.clinicaId, clinicas).nome}</span>
              </div>
            </div>

            {/* Horários */}
            <div style={{ fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--text3)", marginBottom:10, fontWeight:400 }}>Horários</div>
            {[
              { label:"Saída de casa",        field:"saidaCasa" },
              { label:"Chegada na clínica",   field:"chegadaClinica" },
              { label:"Início atendimento",   field:"atendimentoInicio" },
              { label:"Fim atendimento",      field:"atendimentoFim" },
              { label:"Chegada em casa",      field:"chegadaCasa" },
            ].map(({ label, field }) => (
              <div key={field} className="fg" style={{ marginBottom:8 }}>
                <label className="fl">{label}</label>
                <input className="fi" type="datetime-local" value={editForm[field] || ""} onChange={ef(field)} />
              </div>
            ))}

            {/* Pausas */}
            {editForm.pausas?.length > 0 && (
              <div style={{ marginTop:12, marginBottom:4 }}>
                <div style={{ fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--text3)", marginBottom:8, fontWeight:400 }}>Pausas</div>
                {editForm.pausas.map((p, i) => (
                  <div key={i} style={{ background:"var(--bg3)", borderRadius:"var(--r-sm)", padding:"10px 12px", marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontSize:11, color:"var(--amber)" }}>Pausa {i+1}</span>
                      <button onClick={() => removePausa(i)} style={{ fontSize:10, color:"var(--wine)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font)" }}>
                        🗑 remover
                      </button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:6 }}>
                      <div className="fg">
                        <label className="fl">Início</label>
                        <input className="fi" type="datetime-local" value={fmtDatetimeLocal(p.inicio)} onChange={e => setEditForm(f => ({ ...f, pausas: f.pausas.map((x,j)=>j===i?{...x,inicio:parseDatetimeLocal(e.target.value)}:x) }))} />
                      </div>
                      <div className="fg">
                        <label className="fl">Fim</label>
                        <input className="fi" type="datetime-local" value={fmtDatetimeLocal(p.fim)} onChange={e => setEditForm(f => ({ ...f, pausas: f.pausas.map((x,j)=>j===i?{...x,fim:parseDatetimeLocal(e.target.value)}:x) }))} />
                      </div>
                    </div>
                    <div className="fg">
                      <label className="fl">Motivo (opcional)</label>
                      <input className="fi" type="text" value={p.motivo||""} placeholder="Ex: sem paciente, intervalo..." onChange={e => setEditForm(f => ({ ...f, pausas: f.pausas.map((x,j)=>j===i?{...x,motivo:e.target.value}:x) }))} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Avaliação */}
            <div style={{ fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--text3)", margin:"14px 0 10px", fontWeight:400 }}>Avaliação</div>
            <div className="fg" style={{ marginBottom:8 }}>
              <label className="fl">Como foi o dia?</label>
              <div className="chips">
                {HUMOR.map(h => <button key={h.v} className={`chip${editForm.humor===h.v?" sel":""}`} onClick={()=>setEditForm(f=>({...f,humor:h.v}))}>{h.l}</button>)}
              </div>
            </div>
            <div className="fg" style={{ marginBottom:8 }}>
              <label className="fl">Desgaste físico</label>
              <div className="chips">
                {DESGASTE.map(d => (
                  <button key={d.v} className={`chip${editForm.desgaste==d.v?" sel":""}`}
                    onClick={()=>setEditForm(f=>({...f,desgaste:d.v}))}
                    style={editForm.desgaste==d.v?{borderColor:d.cor,color:d.cor,background:`${d.cor}18`}:{}}>
                    <span style={{ fontFamily:"monospace", fontSize:13 }}>{d.sym}</span>{d.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="fg" style={{ marginBottom:8 }}>
              <label className="fl">Trânsito percebido</label>
              <div className="chips">
                {TRANSITO.map(t => <button key={t.v} className={`chip${editForm.transito===t.v?" sel":""}`} onClick={()=>setEditForm(f=>({...f,transito:t.v}))}>{t.l}</button>)}
              </div>
            </div>
            <div className="fg" style={{ marginBottom:16 }}>
              <label className="fl">Observações</label>
              <textarea className="fi" rows={2} value={editForm.observacoes||""} onChange={ef("observacoes")} placeholder="Notas sobre o turno…" style={{ resize:"none", lineHeight:1.6 }} />
            </div>

            <button className="btn-p" onClick={salvarEdicao} disabled={savingEdit}>
              {savingEdit ? "Salvando…" : "Salvar alterações"}
            </button>
            <button className="btn-s" onClick={() => setEditando(null)}>Cancelar</button>
          </div>
        </>
      )}

      {grupos.map((grupo, gi) => {
        if (grupo.tipo === "missao") {
          const { missao, turnos } = grupo;
          const c = getClinicaById(missao.clinicaId, clinicas);
          const expanded = missaoExpand[missao.id];
          const totalAtend = turnos.reduce((a,t) => a + (t.atendimentoFim&&t.atendimentoInicio ? t.atendimentoFim-t.atendimentoInicio : 0), 0);
          const totalPausas = turnos.reduce((a,t) => a + calcTotalPausa(t.pausas||[]), 0);
          const totalLiq = Math.max(0, totalAtend - totalPausas);
          const totalFora = missao.chegadaCasa && missao.saidaCasa ? missao.chegadaCasa - missao.saidaCasa : 0;
          const prodGlobal = totalFora > 0 ? Math.round((totalLiq / totalFora) * 100) : null;
          const diaLabel = missao.noites === 0 ? "ida e volta" : `${missao.noites} noite${missao.noites>1?"s":""}`;

          return (
            <div key={missao.id} className="ti fu missao-group" style={{ animationDelay:`${gi*0.03}s`, borderLeft:"3px solid var(--amber)", paddingLeft:2 }}>
              {/* Cabeçalho da missão */}
              <div className="ti-top" style={{ cursor:"pointer" }} onClick={() => setMissaoExpand(e=>({...e, [missao.id]:!e[missao.id]}))}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div className="cdot" style={{ width:7, height:7, background:c.cor }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:500 }}>{missao.cidade}</div>
                    <div style={{ fontSize:10, color:"var(--text3)", fontWeight:300 }}>{c.nome} · {turnos.length} dia{turnos.length>1?"s":""} · {diaLabel}</div>
                  </div>
                  <div className="clin-vtag" style={{ marginLeft:4 }}>✈ Missão</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div className="ti-date">{fmtDate(missao.saidaCasa || turnos[0]?.atendimentoInicio)}</div>
                  <span style={{ fontSize:14, color:"var(--text3)" }}>{expanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {/* Métricas consolidadas */}
              <div className="ti-met">
                {[
                  { l:"Deslocamento",  v: missao.tempoViagemH ? `${missao.tempoViagemH}h` : "—" },
                  { l:"Atendimento",   v: fmtDur(totalLiq) || "—" },
                  { l:"Total fora",    v: totalFora ? fmtDur(totalFora) : "—" },
                ].map(({l,v}) => (
                  <div key={l} className="ti-m"><div className="ti-mv">{v}</div><div className="ti-ml">{l}</div></div>
                ))}
              </div>
              <div className="ti-tags">
                {prodGlobal !== null && <span className={`tag ${prodGlobal>65?"tp":prodGlobal>45?"tw":"tl2"}`}>{prodGlobal}% prod.</span>}
                {missao.meios?.length > 0 && <span className="tag">{missao.meios.join(" + ")}</span>}
                <span className="tag" style={{ color:"var(--amber)", background:"rgba(160,140,96,0.12)" }}>{missao.status === "concluida" ? "✓ Concluída" : "Em andamento"}</span>
              </div>

              {/* Dias expandidos */}
              {expanded && (
                <div style={{ marginTop:10, borderTop:"1px solid var(--border2)", paddingTop:10 }}>
                  {turnos.map((t, ti) => {
                    const atend = t.atendimentoFim&&t.atendimentoInicio ? t.atendimentoFim-t.atendimentoInicio : null;
                    const pausaMs = calcTotalPausa(t.pausas||[]);
                    const liq = atend ? Math.max(0, atend - pausaMs) : null;
                    const dg = calcDesgasteVal(t);
                    const dgI = getDesgasteInfo(dg);
                    return (
                      <div key={t.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:ti<turnos.length-1?"1px solid var(--border2)":"none" }}>
                        <div>
                          <div style={{ fontSize:12, fontWeight:500 }}>Dia {t.diaMissao || ti+1}</div>
                          <div style={{ fontSize:11, color:"var(--text3)", fontWeight:300, marginTop:2 }}>
                            {fmtDur(liq) || "—"} atendimento
                            {t.pausas?.filter(p=>p.fim).length > 0 && ` · ${t.pausas.filter(p=>p.fim).length} pausa(s)`}
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span className="tag" style={{ color:dgI.cor, background:`${dgI.cor}18`, fontSize:10 }}>
                            <span style={{ fontFamily:"monospace" }}>{dgI.sym}</span>{dgI.l}
                          </span>
                          <button className="btn-icon" style={{ padding:4, color:"var(--text3)" }} onClick={() => abrirEdicao(t)}>
                            <Icon d={ICONS.edit} size={12} stroke={1.4} />
                          </button>
                          <button className="btn-icon btn-danger" style={{ padding:4 }} onClick={() => setConfirmDelete(t.id)}>
                            <Icon d={ICONS.trash} size={12} stroke={1.4} />
                          </button>
                        </div>
                        {confirmDelete === t.id && (
                          <div style={{ width:"100%", background:"rgba(158,96,112,0.08)", borderRadius:"var(--r-sm)", padding:"8px 10px", marginTop:6, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <span style={{ fontSize:11, color:"var(--wine)" }}>Excluir dia {t.diaMissao}?</span>
                            <div style={{ display:"flex", gap:8 }}>
                              <button onClick={() => handleDelete(t.id)} style={{ fontSize:11, color:"var(--wine)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font)", fontWeight:500 }}>Excluir</button>
                              <button onClick={() => setConfirmDelete(null)} style={{ fontSize:11, color:"var(--text3)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font)" }}>Cancelar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Turno local (sem missão)
        const t = grupo.turno;
        const i = gi;
        const c   = getClinicaById(t.clinicaId, clinicas);
        const ida  = t.chegadaClinica ? t.chegadaClinica - t.saidaCasa : null;
        const atend = t.atendimentoFim&&t.atendimentoInicio ? t.atendimentoFim-t.atendimentoInicio : null;
        const total = t.chegadaCasa ? t.chegadaCasa - t.saidaCasa : null;
        const prod  = calcProd(t);
        const dg    = calcDesgasteVal(t);
        const dgI   = getDesgasteInfo(dg);
        const meios = t.missao?.meios || [];

        return (
          <div key={t.id} className="ti fu" style={{ animationDelay:`${i*0.03}s` }}>
            {confirmDelete === t.id && (
              <div style={{ background:"rgba(158,96,112,0.08)", borderRadius:"var(--r-sm)", padding:"10px 12px", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:12, color:"var(--wine)" }}>Excluir este turno?</span>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => handleDelete(t.id)} style={{ fontSize:12, color:"var(--wine)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font)", fontWeight:500 }}>Excluir</button>
                  <button onClick={() => setConfirmDelete(null)} style={{ fontSize:12, color:"var(--text3)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font)" }}>Cancelar</button>
                </div>
              </div>
            )}
            <div className="ti-top">
              <div className="ti-clin"><div className="cdot" style={{ width:7,height:7,background:c.cor }} />{c.nome}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div className="ti-date">{fmtDate(t.saidaCasa)}</div>
                {/* Botão editar */}
                <button className="btn-icon" style={{ padding:4, color:"var(--text3)" }} onClick={() => abrirEdicao(t)}>
                  <Icon d={ICONS.edit} size={13} stroke={1.4} />
                </button>
                <button className="btn-icon btn-danger" style={{ padding:4 }} onClick={() => setConfirmDelete(t.id)}>
                  <Icon d={ICONS.trash} size={13} stroke={1.4} />
                </button>
              </div>
            </div>
            <div className="ti-met">
              {[{l:"Deslocamento",v:fmtDur(ida)},{l:"Atendimento",v:fmtDur(atend)},{l:"Total fora",v:fmtDur(total)}].map(({l,v}) => (
                <div key={l} className="ti-m"><div className="ti-mv">{v}</div><div className="ti-ml">{l}</div></div>
              ))}
            </div>
            <div className="ti-tags">
              {prod!==null && <span className={`tag ${prod>65?"tp":prod>45?"tw":"tl2"}`}>{prod}% prod.</span>}
              <span className="tag" style={{ color:dgI.cor,background:`${dgI.cor}18` }}>
                <span style={{ fontFamily:"monospace" }}>{dgI.sym}</span>{dgI.l}
              </span>
              {t.missao && <span className="tag mp"><Icon d={ICONS.plane} size={10} stroke={1.5} color="var(--amber)" />Missão</span>}
              {t.missao?.diasOciosos > 0 && <span className="tag idle"><Icon d={ICONS.bed} size={10} stroke={1.5} color="var(--amber)" />{t.missao.diasOciosos}d ocioso{t.missao.diasOciosos>1?"s":""}</span>}
              {meios.length > 1 && <span className="tag">{meios.join(" + ")}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Analytics ─────────────────────────────────────────────────

const TelaAnalytics = ({ historico, clinicas }) => {
  const [filtro, setFiltro] = useState("todos");
  const ts = filtro==="local"?historico.filter(t=>!t.missao):filtro==="viagem"?historico.filter(t=>t.missao):historico;
  const score = calcMeridianScore(historico);
  const {l:sl,cor:sc,desc:sd} = getMeridianLabel(score);
  const cls = score===null?"":score>=80?"s":score>=60?"a":"d";

  const byC = clinicas.map(c => {
    const ct = ts.filter(t => t.clinicaId===c.id);
    if (!ct.length) return null;
    const totalFora = ct.reduce((a,t)=>a+(t.chegadaCasa?t.chegadaCasa-t.saidaCasa:0),0);
    const avgDg  = ct.reduce((a,t)=>a+calcDesgasteVal(t),0)/ct.length;
    const prods  = ct.filter(t=>calcProd(t)!==null);
    const avgProd = prods.length ? Math.round(prods.reduce((a,t)=>a+calcProd(t),0)/prods.length) : null;
    return { c, ct, totalFora, avgDg, avgProd };
  }).filter(Boolean).sort((a,b)=>b.totalFora-a.totalFora);

  const maxFora = byC[0]?.totalFora || 1;
  const totalAtend    = ts.reduce((a,t)=>a+(t.atendimentoFim&&t.atendimentoInicio?t.atendimentoFim-t.atendimentoInicio:0),0);
  const totalFora     = ts.reduce((a,t)=>a+(t.chegadaCasa?t.chegadaCasa-t.saidaCasa:0),0);
  const totalTransito = ts.reduce((a,t)=>{const i=t.chegadaClinica?t.chegadaClinica-t.saidaCasa:0;const v=t.chegadaCasa&&t.atendimentoFim?t.chegadaCasa-t.atendimentoFim:0;return a+i+v;},0);
  const tPct = totalFora>0 ? Math.round((totalTransito/totalFora)*100) : 0;
  const totalOciosos = ts.filter(t=>t.missao?.diasOciosos>0).reduce((a,t)=>a+(t.missao?.diasOciosos||0),0);

  if (!historico.length) return (
    <div className="content">
      <div className="ph"><div className="ph-ey">Análises</div><div className="ph-title">Analytics</div></div>
      <div className="empty"><Icon d={ICONS.chart} size={36} stroke={1.2} color="var(--text4)" /><div className="empty-title">Sem dados</div><div className="empty-sub">Registre turnos para ver suas análises.</div></div>
    </div>
  );

  return (
    <div className="content">
      <div className="ph"><div className="ph-ey">Análises</div><div className="ph-title">Analytics</div></div>

      <div className={`ms-card ${cls} fu mb`}>
        <div className="c-ey">Meridian Score</div>
        <div className="ms-n" style={{ color:sc }}>{score!==null?score:"—"}</div>
        <div className="ms-lb" style={{ color:sc }}>{sl}</div>
        <div className="ms-desc">{sd}</div>
        {score!==null && (
          <><div className="ms-track"><div className="ms-fill" style={{ width:`${score}%`,background:score>=80?"var(--sage)":score>=60?"var(--amber)":"var(--wine)" }} /></div>
          <div className="ms-bands"><span>0 · Crítico</span><span>60 · Atenção</span><span>80 · Sustentável</span></div></>
        )}
      </div>

      <div className="tog fu fu1">
        {[["todos","Todos"],["local","Local"],["viagem","Viagens"]].map(([v,l]) => (
          <button key={v} className={`tog-b${filtro===v?" on":""}`} onClick={()=>setFiltro(v)}>{l}</button>
        ))}
      </div>

      <div className="g2 fu fu2">
        {[
          {l:"Horas atendendo", v:fmtDur(totalAtend),    s:`${ts.length} turnos`},
          {l:"Fora de casa",    v:fmtDur(totalFora),     s:"Total acumulado"},
          {l:"Em trânsito",     v:fmtDur(totalTransito), s:`${tPct}% do tempo`, cor:"var(--amber)"},
          {l:"Dias ociosos",    v:String(totalOciosos),  s:"em missões", cor:totalOciosos>0?"var(--amber)":undefined},
        ].map(({l,v,s,cor})=>(
          <div key={l} className="card cp">
            <div className="c-ey">{l}</div>
            <div className="c-val-md" style={cor?{color:cor}:{}}>{v}</div>
            <div className="c-sub">{s}</div>
          </div>
        ))}
      </div>

      {byC.length > 0 && (
        <>
          <div className="slbl fu fu3">Tempo fora de casa por clínica</div>
          <div className="bsec fu fu3">
            {byC.map(({c,totalFora:tf})=>(
              <div className="brow" key={c.id}>
                <div className="bnm">{c.nome}</div>
                <div className="btrack"><div className="bfill" style={{ width:`${Math.max(8,(tf/maxFora)*100)}%`,background:`linear-gradient(90deg,${c.cor},${c.cor}88)` }}>{fmtDur(tf)}</div></div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="slbl">Desgaste médio por clínica</div>
          <div className="bsec">
            {[...byC].sort((a,b)=>b.avgDg-a.avgDg).map(({c,avgDg})=>{
              const di = getDesgasteInfo(avgDg);
              return (
                <div className="brow" key={c.id}>
                  <div className="bnm">{c.nome}</div>
                  <div className="btrack"><div className="bfill" style={{ width:`${(avgDg/5)*100}%`,background:`linear-gradient(90deg,${di.cor},${di.cor}88)` }}>{di.l}</div></div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {byC.length > 1 && (
        <>
          <div className="divider" />
          <div className="slbl">Insights</div>
          {[
            { icon:"activity", text:<><strong>{[...byC].sort((a,b)=>b.avgDg-a.avgDg)[0]?.c.nome}</strong> apresenta o maior índice de desgaste acumulado.</> },
            byC.filter(x=>x.avgProd!==null).length>0 && { icon:"leaf", text:<><strong>{byC.filter(x=>x.avgProd!==null).sort((a,b)=>b.avgProd-a.avgProd)[0]?.c.nome}</strong> possui a melhor relação deslocamento/produtividade.</> },
            tPct>0 && { icon:"car", text:<><strong>{tPct}%</strong> do tempo fora de casa é trânsito — {fmtDur(totalTransito)} no período.</> },
            totalOciosos>0 && { icon:"bed", text:<>Você acumulou <strong>{totalOciosos} dia{totalOciosos>1?"s":""} ocioso{totalOciosos>1?"s":""}</strong> em missões — tempo fora de casa sem atendimento.</> },
          ].filter(Boolean).map((ins,i) => (
            <div key={i} className="ins fu" style={{ animationDelay:`${i*0.06}s` }}>
              <div className="ins-ic"><Icon d={ICONS[ins.icon]} size={15} stroke={1.4} /></div>
              <div className="ins-t">{ins.text}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// ── Clínicas (com gestão) ─────────────────────────────────────

const TelaClinicas = ({ historico, clinicas, setClinicas }) => {
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nome:"", cidade:"", tipo:"local", cor:CORES_CLINICA[0] });

  const abrirNova = () => { setForm({nome:"",cidade:"",tipo:"local",cor:CORES_CLINICA[0]}); setEditando(null); setShowForm(true); };
  const abrirEditar = (c) => { setForm({nome:c.nome,cidade:c.cidade,tipo:c.tipo,cor:c.cor}); setEditando(c.id); setShowForm(true); };
  const salvar = async () => {
    if (!form.nome.trim()) return;
    let next;
    let clinicaParaSalvar;
    if (editando) {
      clinicaParaSalvar = { id: editando, ...form };
      next = clinicas.map(c => c.id===editando ? clinicaParaSalvar : c);
    } else {
      clinicaParaSalvar = { id:`c_${uid().slice(0,8)}`, ...form };
      next = [...clinicas, clinicaParaSalvar];
    }
    // Otimista: atualiza UI imediatamente
    setClinicas(next); saveClinicas(next); setShowForm(false);
    // Persiste no Supabase (silencioso)
    const idx = next.indexOf(clinicaParaSalvar);
    const { data } = await saveClinica(clinicaParaSalvar, idx);
    // Se Supabase retornou um UUID novo, substitui o id local
    if (data && data.id !== clinicaParaSalvar.id) {
      const corrigido = next.map(c => c.id === clinicaParaSalvar.id ? { ...c, id: data.id } : c);
      setClinicas(corrigido); saveClinicas(corrigido);
    }
  };
  const excluir = async (id) => {
    const next = clinicas.filter(c => c.id !== id);
    setClinicas(next); saveClinicas(next);
    await deleteClinica(id);
  };

  const comDados = clinicas.map(c => {
    const ts = historico.filter(t => t.clinicaId===c.id);
    if (!ts.length) return { c, ts, avgIda:0, avgProd:null, avgDg:null, sustent:null };
    const avgIda  = ts.filter(t=>t.chegadaClinica).length ? ts.filter(t=>t.chegadaClinica).reduce((a,t)=>a+(t.chegadaClinica-t.saidaCasa),0)/ts.filter(t=>t.chegadaClinica).length : 0;
    const prods   = ts.filter(t=>calcProd(t)!==null);
    const avgProd = prods.length ? Math.round(prods.reduce((a,t)=>a+calcProd(t),0)/prods.length) : null;
    const avgDg   = ts.reduce((a,t)=>a+calcDesgasteVal(t),0)/ts.length;
    const sustent = avgProd!==null ? Math.min(100,Math.max(0,Math.round((avgProd/100)*55+((5-avgDg)/5)*45))) : null;
    return { c, ts, avgIda, avgProd, avgDg, sustent };
  }).sort((a,b) => b.ts.length - a.ts.length);

  return (
    <div className="content">
      <div className="ph" style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
        <div>
          <div className="ph-ey">Performance</div>
          <div className="ph-title">Clínicas</div>
          <div className="ph-sub">{clinicas.length} clínicas</div>
        </div>
        <button className="btn-icon" title="Adicionar clínica" onClick={abrirNova} style={{ color:"var(--sage)" }}>
          <Icon d={ICONS.plus} size={20} stroke={1.6} />
        </button>
      </div>

      {showForm && (
        <>
          <div className="overlay" onClick={() => setShowForm(false)} />
          <div className="sheet">
            <div className="sh-handle" />
            <div className="sh-title">{editando?"Editar clínica":"Nova clínica"}</div>
            <div className="fg"><label className="fl">Nome</label><input className="fi" value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Ex.: HOF" /></div>
            <div className="fg"><label className="fl">Cidade</label><input className="fi" value={form.cidade} onChange={e=>setForm(f=>({...f,cidade:e.target.value}))} placeholder="Ex.: Salvador, BA" /></div>
            <div className="fg">
              <label className="fl">Tipo</label>
              <div className="chips">
                {[{v:"local",l:"Local"},{v:"viagem",l:"Viagem"}].map(({v,l}) => (
                  <button key={v} className={`chip${form.tipo===v?" sel":""}`} onClick={()=>setForm(f=>({...f,tipo:v}))}>{l}</button>
                ))}
              </div>
            </div>
            <div className="fg">
              <label className="fl">Cor</label>
              <div className="color-picker">
                {CORES_CLINICA.map(cor => (
                  <div key={cor} className={`color-swatch${form.cor===cor?" sel":""}`}
                    style={{ background:cor }} onClick={() => setForm(f=>({...f,cor}))} />
                ))}
              </div>
            </div>
            <button className="btn-p" onClick={salvar}>Salvar</button>
            <button className="btn-s" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </>
      )}

      {comDados.map(({ c, ts, avgIda, avgProd, avgDg, sustent }, i) => {
        const dgI = avgDg ? getDesgasteInfo(avgDg) : null;
        const sustCor = sustent>65?"var(--sage)":sustent>40?"var(--amber)":"var(--wine)";
        return (
          <div className="cc fu" key={c.id} style={{ animationDelay:`${i*0.04}s` }}>
            <div className="cc-h">
              <div className="cc-nm">
                <div className="cdot" style={{ width:10,height:10,background:c.cor }} />
                {c.nome}
                {c.tipo==="viagem" && <span style={{ fontSize:10,color:"var(--amber)",background:"var(--amber2)",borderRadius:100,padding:"2px 8px",display:"flex",alignItems:"center",gap:4 }}><Icon d={ICONS.plane} size={10} stroke={1.5} />Missão</span>}
              </div>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span className="cc-cnt">{ts.length} turno{ts.length!==1?"s":""}</span>
                <button className="btn-icon" style={{ padding:4 }} onClick={() => abrirEditar(c)}><Icon d={ICONS.edit} size={13} stroke={1.4} /></button>
                <button className="btn-icon btn-danger" style={{ padding:4 }} onClick={() => excluir(c.id)}><Icon d={ICONS.trash} size={13} stroke={1.4} /></button>
              </div>
            </div>
            {ts.length > 0 ? (
              <>
                <div className="cc-s">
                  {[{l:"Ida média",v:fmtDur(avgIda)},{l:"Prod. média",v:avgProd!==null?`${avgProd}%`:"—"},{l:"Desgaste",v:dgI?.l||"—",cor:dgI?.cor}].map(({l,v,cor})=>(
                    <div key={l} className="cc-si"><div className="cc-sv" style={cor?{color:cor}:{}}>{v}</div><div className="cc-sl">{l}</div></div>
                  ))}
                </div>
                {sustent!==null && (
                  <div className="sust-r">
                    <span className="sust-l">Sustentabilidade</span>
                    <div className="sust-t"><div className="sust-f" style={{ width:`${sustent}%`,background:sustCor }} /></div>
                    <span className="sust-v" style={{ color:sustCor }}>{sustent}%</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize:11,color:"var(--text3)",fontWeight:300 }}>Sem turnos registrados</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Semana ────────────────────────────────────────────────────

const TelaSemana = ({ historico, clinicas }) => {
  const hoje   = new Date();
  const semana = Array.from({length:7},(_,i)=>{const d=new Date(hoje);d.setDate(hoje.getDate()-6+i);return d;});
  const dias   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const getDT  = (d) => historico.filter(t=>{const td=new Date(t.saidaCasa);return td.getDate()===d.getDate()&&td.getMonth()===d.getMonth()&&td.getFullYear()===d.getFullYear();});
  const maxH   = 10*3600000;
  const semT   = semana.flatMap(d=>getDT(d));
  const totalFora  = semT.reduce((a,t)=>a+(t.chegadaCasa?t.chegadaCasa-t.saidaCasa:0),0);
  const totalAtend = semT.reduce((a,t)=>a+(t.atendimentoFim&&t.atendimentoInicio?t.atendimentoFim-t.atendimentoInicio:0),0);
  const score  = calcMeridianScore(semT.length>0?semT:historico.slice(0,7));
  const {l:sl,cor:sc} = getMeridianLabel(score);

  // ── Mês ──
  const turnosMes = historico.filter(t=>{const d=new Date(t.saidaCasa);return d.getMonth()===hoje.getMonth()&&d.getFullYear()===hoje.getFullYear();});
  const foraMs    = turnosMes.reduce((a,t)=>a+(t.chegadaCasa?t.chegadaCasa-t.saidaCasa:0),0);
  const atendMs   = turnosMes.reduce((a,t)=>a+(t.atendimentoFim&&t.atendimentoInicio?t.atendimentoFim-t.atendimentoInicio:0),0);
  const transitoMs = turnosMes.reduce((a,t)=>{const i=t.chegadaClinica?t.chegadaClinica-t.saidaCasa:0;const v=t.chegadaCasa&&t.atendimentoFim?t.chegadaCasa-t.atendimentoFim:0;return a+i+v;},0);
  const missoesMes = turnosMes.filter(t=>t.missao).length;
  const scoreMes   = calcMeridianScore(turnosMes);
  const {l:slMs, cor:scMs} = getMeridianLabel(scoreMes);

  // ── Ano ──
  const turnosAno = historico.filter(t=>new Date(t.saidaCasa).getFullYear()===hoje.getFullYear());
  const foraAno   = turnosAno.reduce((a,t)=>a+(t.chegadaCasa?t.chegadaCasa-t.saidaCasa:0),0);
  const atendAno  = turnosAno.reduce((a,t)=>a+(t.atendimentoFim&&t.atendimentoInicio?t.atendimentoFim-t.atendimentoInicio:0),0);
  const transitoAno = turnosAno.reduce((a,t)=>{const i=t.chegadaClinica?t.chegadaClinica-t.saidaCasa:0;const v=t.chegadaCasa&&t.atendimentoFim?t.chegadaCasa-t.atendimentoFim:0;return a+i+v;},0);
  const missoesAno = turnosAno.filter(t=>t.missao).length;
  const noitesAno  = turnosAno.filter(t=>t.missao).reduce((a,t)=>a+(t.missao?.noites||0),0);

  const nomeMes  = hoje.toLocaleDateString("pt-BR",{month:"long"});
  const anoAtual = hoje.getFullYear();

  // Gráfico de barras por mês no ano
  const meses = Array.from({length:12},(_,i)=>{
    const ts = turnosAno.filter(t=>new Date(t.saidaCasa).getMonth()===i);
    const fora = ts.reduce((a,t)=>a+(t.chegadaCasa?t.chegadaCasa-t.saidaCasa:0),0);
    return { i, fora, count:ts.length };
  });
  const maxForaAno = Math.max(...meses.map(m=>m.fora), 1);
  const mesesNomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

  return (
    <div className="content">
      <div className="ph">
        <div className="ph-ey">Dashboard</div>
        <div className="ph-title">Semana · Mês · Ano</div>
        <div className="ph-sub">{fmtDate(semana[0])} — {fmtDate(semana[6])}</div>
      </div>

      {/* ── SEMANA ── */}
      <div className="slbl">Esta semana</div>
      <div className="wk-bars fu">
        {semana.map((d,i)=>{
          const ts=getDT(d),tot=ts.reduce((a,t)=>a+(t.chegadaCasa?t.chegadaCasa-t.saidaCasa:0),0);
          const isHoje=d.getDate()===hoje.getDate()&&d.getMonth()===hoje.getMonth();
          const c=ts[0]?getClinicaById(ts[0].clinicaId,clinicas):null;
          return (
            <div className="wk-col" key={i}>
              <div className="wk-bw"><div className="wk-b" style={{ height:`${tot>0?Math.max(8,(tot/maxH)*100):0}%`,background:c?c.cor:"var(--bg4)",opacity:isHoje?1:0.65 }} /></div>
              <div className="wk-val">{tot>0?`${Math.floor(tot/3600000)}h`:""}</div>
              <div className="wk-lbl" style={{ color:isHoje?"var(--text2)":"var(--text4)" }}>{dias[d.getDay()]}</div>
            </div>
          );
        })}
      </div>

      <div className="g2 fu fu1">
        <div className="card cp"><div className="c-ey">Fora de casa</div><div className="c-val-md">{fmtDur(totalFora)}</div><div className="c-sub">{semT.length} turnos</div></div>
        <div className="card cp"><div className="c-ey">Atendendo</div><div className="c-val-md" style={{color:"var(--sage)"}}>{fmtDur(totalAtend)}</div><div className="c-sub">horas produtivas</div></div>
      </div>

      <div className="card cp mb fu fu2" style={{ display:"flex",alignItems:"center",gap:16 }}>
        <div>
          <div className="c-ey">Score semanal</div>
          <div style={{ fontFamily:"var(--font-d)",fontSize:34,color:sc,letterSpacing:-1 }}>{score!==null?score:"—"}</div>
          <div style={{ fontSize:12,color:sc }}>{sl}</div>
        </div>
        <div style={{ flex:1 }}>
          {score!==null&&<div className="ms-track" style={{marginTop:8}}><div className="ms-fill" style={{width:`${score}%`,background:score>=80?"var(--sage)":score>=60?"var(--amber)":"var(--wine)"}}/></div>}
          <div style={{ fontSize:11,color:"var(--text3)",marginTop:8,fontWeight:300 }}>Meridian Score · sustentabilidade</div>
        </div>
      </div>

      <div className="divider" />

      {/* ── MÊS ── */}
      <div className="slbl" style={{ marginTop:8 }}>
        {nomeMes} {anoAtual}
      </div>

      <div className="g2 fu">
        <div className="card cp">
          <div className="c-ey">Fora de casa</div>
          <div className="c-val-md">{fmtDur(foraMs)||"—"}</div>
          <div className="c-sub">{turnosMes.length} turnos</div>
        </div>
        <div className="card cp">
          <div className="c-ey">Atendendo</div>
          <div className="c-val-md" style={{color:"var(--sage)"}}>{fmtDur(atendMs)||"—"}</div>
          <div className="c-sub">horas produtivas</div>
        </div>
        <div className="card cp">
          <div className="c-ey">Em trânsito</div>
          <div className="c-val-md" style={{color:"var(--amber)"}}>{fmtDur(transitoMs)||"—"}</div>
          <div className="c-sub">deslocamento total</div>
        </div>
        <div className="card cp">
          <div className="c-ey">Missões</div>
          <div className="c-val-md">{missoesMes}</div>
          <div className="c-sub">viagens profissionais</div>
        </div>
      </div>

      {scoreMes !== null && (
        <div className="card cp mb fu" style={{ display:"flex",alignItems:"center",gap:16 }}>
          <div>
            <div className="c-ey">Score do mês</div>
            <div style={{ fontFamily:"var(--font-d)",fontSize:34,color:scMs,letterSpacing:-1 }}>{scoreMes}</div>
            <div style={{ fontSize:12,color:scMs }}>{slMs}</div>
          </div>
          <div style={{ flex:1 }}>
            <div className="ms-track" style={{marginTop:8}}><div className="ms-fill" style={{width:`${scoreMes}%`,background:scoreMes>=80?"var(--sage)":scoreMes>=60?"var(--amber)":"var(--wine)"}}/></div>
            <div style={{ fontSize:11,color:"var(--text3)",marginTop:8,fontWeight:300 }}>Meridian Score · {nomeMes}</div>
          </div>
        </div>
      )}

      <div className="divider" />

      {/* ── ANO ── */}
      <div className="slbl" style={{ marginTop:8 }}>{anoAtual}</div>

      <div className="g2 fu">
        <div className="card cp">
          <div className="c-ey">Fora de casa</div>
          <div className="c-val-md">{fmtDur(foraAno)||"—"}</div>
          <div className="c-sub">{turnosAno.length} turnos</div>
        </div>
        <div className="card cp">
          <div className="c-ey">Atendendo</div>
          <div className="c-val-md" style={{color:"var(--sage)"}}>{fmtDur(atendAno)||"—"}</div>
          <div className="c-sub">horas produtivas</div>
        </div>
        <div className="card cp">
          <div className="c-ey">Em trânsito</div>
          <div className="c-val-md" style={{color:"var(--amber)"}}>{fmtDur(transitoAno)||"—"}</div>
          <div className="c-sub">deslocamento total</div>
        </div>
        <div className="card cp">
          <div className="c-ey">Missões · noites</div>
          <div className="c-val-md">{missoesAno}<span style={{fontSize:16,fontFamily:"var(--font)",color:"var(--text3)",fontWeight:300}}> / {noitesAno}n</span></div>
          <div className="c-sub">viagens · noites fora</div>
        </div>
      </div>

      {/* Gráfico de barras por mês */}
      {turnosAno.length > 0 && (
        <>
          <div className="slbl" style={{marginTop:4}}>Horas fora de casa por mês</div>
          <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:72, marginBottom:6 }} className="fu">
            {meses.map(m => {
              const pct = (m.fora / maxForaAno) * 100;
              const isMesAtual = m.i === hoje.getMonth();
              return (
                <div key={m.i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, height:"100%", justifyContent:"flex-end" }}>
                  <div style={{ width:"100%", display:"flex", alignItems:"flex-end", flex:1 }}>
                    <div style={{ width:"100%", height:`${pct>0?Math.max(6,pct):0}%`, borderRadius:"3px 3px 2px 2px", background:isMesAtual?"var(--sage)":"var(--bg4)", opacity:isMesAtual?0.9:0.55, transition:"height 0.6s" }} />
                  </div>
                  <div style={{ fontSize:8, color:isMesAtual?"var(--text2)":"var(--text4)", textTransform:"uppercase", letterSpacing:"0.3px" }}>{mesesNomes[m.i]}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ── Calculadora Valor/Hora ────────────────────────────────────

// ── Calculadora Valor/Hora ─────────────────────────────────────
//
// Fluxo de cálculo:
//   Produtividade bruta (o que a clínica registrou em seu nome)
//   → Valor recebido por categoria (já com repasse aplicado — você informa direto)
//   → Total recebido bruto
//   − Impostos pagos (R$ — ISS, PIS/COFINS, IR, CSLL...)
//   − Taxa de contabilidade (R$)
//   − Custos da sessão (R$)
//   = Resultado líquido final
//   ÷ horas → Valor/hora
//   ÷ horas reais (c/ deslocamento) → Valor/hora real
//
// A calculadora também exibe o % de imposto calculado automaticamente
// a partir dos valores informados, para fins de análise.

// Fld precisa estar FORA de TelaCalculadora — se ficar dentro, React recria
// o componente a cada render e o input perde o foco após cada tecla.
const CalcFld = ({ label, hint, children }) => (
  <div className="fg" style={{ marginBottom:0 }}>
    <label className="fl">
      {label}
      {hint && <span style={{ fontWeight:300, textTransform:"none", letterSpacing:0, color:"var(--text3)", marginLeft:4 }}>{hint}</span>}
    </label>
    {children}
  </div>
);

const TelaCalculadora = () => {
  // Contexto da sessão
  const [local,  setLocal]  = useState("Clínica privada");
  const [h,      setH]      = useState(4);
  const [pac,    setPac]    = useState(12);
  const [desl,   setDesl]   = useState(0);

  // Valores recebidos por categoria (já com repasse aplicado)
  const [recC,  setRecC]  = useState(0);   // consultas
  const [recE,  setRecE]  = useState(0);   // exames
  const [recL,  setRecL]  = useState(0);   // laser / procedimentos

  // Deduções
  const [imposto,   setImposto]   = useState(0);  // total de impostos pagos (R$)
  const [contab,    setContab]    = useState(0);  // taxa contabilidade (R$)
  const [custos,    setCustos]    = useState(0);  // outros custos da sessão (R$)

  // UI state
  const [res,            setRes]            = useState(null);
  const [hist,           setHist]           = useState([]);
  const [loadingHist,    setLoadingHist]    = useState(true);
  const [showClearHist,  setShowClearHist]  = useState(false);
  const [savingCalc,     setSavingCalc]     = useState(false);

  useEffect(() => {
    loadCalculos()
      .then(data => setHist(data))
      .finally(() => setLoadingHist(false));
  }, []);

  const calcular = async () => {
    // Totais recebidos (já com repasse)
    const totalRec = recC + recE + recL;
    if (totalRec <= 0) return;

    // Deduções fiscais e operacionais
    const totalDed = imposto + contab + custos;

    // Resultado final
    const final = totalRec - totalDed;

    // Valor/hora
    const hora     = h > 0 ? final / h : 0;
    const hReal    = h + (desl / 60);
    const horaReal = hReal > 0 ? final / hReal : 0;

    // Por paciente
    const porPac = pac > 0 ? final / pac : 0;

    // % imposto calculado automaticamente (informativo)
    const pctImposto = totalRec > 0 ? Math.round((imposto / totalRec) * 1000) / 10 : 0;
    const pctContab  = totalRec > 0 ? Math.round((contab  / totalRec) * 1000) / 10 : 0;
    const pctDed     = totalRec > 0 ? Math.round((totalDed / totalRec) * 1000) / 10 : 0;

    // Classificação
    let classif = "🔴 Baixa rentabilidade", classColor = "var(--wine)";
    if      (hora >= 400) { classif = "🟢 Alta rentabilidade";    classColor = "var(--sage)"; }
    else if (hora >= 200) { classif = "🟡 Rentabilidade média";   classColor = "var(--amber)"; }

    const result = {
      local, h, pac, desl,
      recC, recE, recL, totalRec,
      imposto, contab, custos, totalDed,
      final, hora, horaReal: desl > 0 ? horaReal : null, porPac,
      pctImposto, pctContab, pctDed,
      classif, classColor,
      ts: Date.now(),
    };

    setRes(result);
    setSavingCalc(true);
    await saveCalculo(result);
    // Recarrega do Supabase para pegar o id real do registro
    const fresh = await loadCalculos();
    setHist(fresh);
    setSavingCalc(false);
  };

  const limparHist = async () => {
    // Deleta todos do Supabase
    for (const r of hist) {
      if (r.id) {
        const { supabase } = await import('./lib/supabase');
        if (supabase) await supabase.from('iryx_calculos').delete().eq('id', r.id);
      }
    }
    setHist([]);
    saveCalcHist([]);
    setShowClearHist(false);
  };

  const totalRec    = recC + recE + recL;
  const totalDed    = imposto + contab + custos;
  const finalPreview = totalRec - totalDed;
  const pctImpCalc  = totalRec > 0 ? ((imposto / totalRec) * 100).toFixed(1) : "—";
  const pctContCalc = totalRec > 0 ? ((contab  / totalRec) * 100).toFixed(1) : "—";
  const pctDedCalc  = totalRec > 0 ? ((totalDed / totalRec) * 100).toFixed(1) : "—";

  return (
    <div className="content">
      <div className="ph">
        <div className="ph-ey">Meridian</div>
        <div className="ph-title" style={{ fontStyle:"italic" }}>
          Calculadora <span style={{ color:"var(--sage)" }}>Valor/Hora</span>
        </div>
        <div className="ph-sub">Rentabilidade real por sessão de trabalho</div>
      </div>

      {/* ── Resultado ── */}
      {res && (
        <div className="calc-res-card mb fu">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <div className="c-ey">Valor por hora líquido</div>
              <div className="calc-main-val">
                {fmtBRL(res.hora)}
                <span style={{ fontSize:18, fontFamily:"var(--font)", color:"var(--text3)", fontWeight:300 }}>/h</span>
              </div>
              {res.horaReal && (
                <div style={{ fontSize:12, color:"var(--text3)", fontWeight:300, marginTop:2 }}>
                  {fmtBRL(res.horaReal)}/h real (c/ {res.desl}min deslocamento)
                </div>
              )}
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:12, color:res.classColor, fontWeight:500, marginBottom:4 }}>{res.classif}</div>
              <div style={{ fontSize:11, color:"var(--text3)", fontWeight:300 }}>{res.local} · {res.h}h</div>
            </div>
          </div>

          <div className="prod-track" style={{ marginBottom:14 }}>
            <div className="prod-fill" style={{ width:`${Math.min(100,(res.hora/500)*100)}%` }} />
          </div>

          {/* Cadeia de valor */}
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
            {[
              { l:"Total recebido",       v: fmtBRL(res.totalRec),  cor:"var(--text)",  note: [res.recC>0&&`Consultas ${fmtBRL(res.recC)}`, res.recE>0&&`Exames ${fmtBRL(res.recE)}`, res.recL>0&&`Laser ${fmtBRL(res.recL)}`].filter(Boolean).join(" · ") },
              { l:`Impostos (${res.pctImposto}%)`,   v:`− ${fmtBRL(res.imposto)}`, cor:"var(--wine)", note:"ISS · PIS/COFINS · IR · CSLL" },
              { l:`Contabilidade (${res.pctContab}%)`,v:`− ${fmtBRL(res.contab)}`, cor:"var(--wine)", note:res.custos>0?`Outros custos: ${fmtBRL(res.custos)}`:undefined },
              ...(res.custos > 0 ? [{ l:"Outros custos", v:`− ${fmtBRL(res.custos)}`, cor:"var(--wine)" }] : []),
            ].map(({ l, v, cor, note }) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"7px 0", borderBottom:"1px solid var(--border2)" }}>
                <div>
                  <div style={{ fontSize:12, color:"var(--text2)" }}>{l}</div>
                  {note && <div style={{ fontSize:10, color:"var(--text3)", fontWeight:300, marginTop:1 }}>{note}</div>}
                </div>
                <div style={{ fontSize:13, fontWeight:500, color:cor, fontFamily:"var(--font-d)", flexShrink:0, marginLeft:12 }}>{v}</div>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:6 }}>
              <div style={{ fontSize:13, fontWeight:500, color:"var(--text)" }}>Resultado líquido</div>
              <div style={{ fontFamily:"var(--font-d)", fontSize:18, color: res.final >= 0 ? "var(--sage)" : "var(--wine)" }}>{fmtBRL(res.final)}</div>
            </div>
          </div>

          {/* Grid de métricas secundárias */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
            {[
              { l:"Por hora",    v: fmtBRL(res.hora) },
              { l:"Por paciente",v: fmtBRL(res.porPac) },
              { l:"Ded. total",  v: `${res.pctDed}%`, cor: res.pctDed > 30 ? "var(--wine)" : "var(--amber)" },
            ].map(({ l, v, cor }) => (
              <div key={l} style={{ background:"var(--bg4)", borderRadius:"var(--r-sm)", padding:"8px 10px", textAlign:"center" }}>
                <div style={{ fontFamily:"var(--font-d)", fontSize:14, color: cor || "var(--text)" }}>{v}</div>
                <div style={{ fontSize:9, color:"var(--text3)", marginTop:2, fontWeight:300 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Formulário ── */}
      <div className="calc-section mb">
        <div style={{ fontSize:12, color:"var(--text3)", marginBottom:16, fontWeight:300 }}>
          Informe o que você efetivamente recebeu em cada categoria — o repasse já está aplicado nesses valores.
        </div>

        {/* Contexto */}
        <div className="frow" style={{ marginBottom:12 }}>
          <CalcFld label="Local de trabalho">
            <select className="fi" value={local} onChange={e => setLocal(e.target.value)}>
              {LOCAIS_CALC.map(l => <option key={l}>{l}</option>)}
            </select>
          </CalcFld>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <CalcFld label="Horas trabalhadas">
              <input className="fi" type="number" min="0.5" step="0.5" value={h} onChange={e => setH(+e.target.value)} />
            </CalcFld>
            <CalcFld label="Nº de pacientes">
              <input className="fi" type="number" min="0" value={pac} onChange={e => setPac(+e.target.value)} />
            </CalcFld>
          </div>
        </div>

        {/* Valores recebidos */}
        <div className="calc-group-title">O que você recebeu (já com repasse)</div>
        <div className="frow3" style={{ marginBottom:14 }}>
          <CalcFld label="Consultas (R$)">
            <input className="fi" type="number" min="0" step="10" value={recC} onChange={e => setRecC(+e.target.value)} placeholder="0" />
          </CalcFld>
          <CalcFld label="Exames (R$)">
            <input className="fi" type="number" min="0" step="10" value={recE} onChange={e => setRecE(+e.target.value)} placeholder="0" />
          </CalcFld>
          <CalcFld label="Laser / Procedimentos (R$)">
            <input className="fi" type="number" min="0" step="50" value={recL} onChange={e => setRecL(+e.target.value)} placeholder="0" />
          </CalcFld>
        </div>

        {/* Preview total recebido */}
        {totalRec > 0 && (
          <div style={{ background:"var(--bg3)", borderRadius:"var(--r-sm)", padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:"var(--text3)", fontWeight:300 }}>Total recebido bruto</span>
            <span style={{ fontFamily:"var(--font-d)", fontSize:18, color:"var(--text)" }}>{fmtBRL(totalRec)}</span>
          </div>
        )}

        {/* Deduções */}
        <div className="calc-group-title">Deduções</div>
        <div className="frow3" style={{ marginBottom:6 }}>
          <CalcFld label="Impostos pagos (R$)" hint="ISS · PIS · COFINS · IR · CSLL">
            <input className="fi" type="number" min="0" step="10" value={imposto} onChange={e => setImposto(+e.target.value)} placeholder="0" />
          </CalcFld>
          <CalcFld label="Contabilidade (R$)" hint="taxa do contador">
            <input className="fi" type="number" min="0" step="10" value={contab} onChange={e => setContab(+e.target.value)} placeholder="0" />
          </CalcFld>
          <CalcFld label="Outros custos (R$)" hint="transporte, alimentação...">
            <input className="fi" type="number" min="0" step="10" value={custos} onChange={e => setCustos(+e.target.value)} placeholder="0" />
          </CalcFld>
        </div>

        {/* Preview % calculado automaticamente */}
        {totalRec > 0 && totalDed > 0 && (
          <div style={{ background:"rgba(158,96,112,0.06)", border:"1px solid rgba(158,96,112,0.15)", borderRadius:"var(--r-sm)", padding:"10px 14px", marginBottom:14 }}>
            <div style={{ fontSize:10, letterSpacing:"1.2px", textTransform:"uppercase", color:"var(--wine)", marginBottom:6, fontWeight:400 }}>
              Percentuais calculados automaticamente
            </div>
            <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
              {[
                imposto > 0 && { l:`Impostos`, v:`${pctImpCalc}% do total` },
                contab  > 0 && { l:`Contabilidade`, v:`${pctContCalc}% do total` },
                { l:`Total deduzido`, v:`${pctDedCalc}% do total (${fmtBRL(totalDed)})` },
              ].filter(Boolean).map(({ l, v }) => (
                <div key={l}>
                  <div style={{ fontSize:10, color:"var(--text3)", fontWeight:300 }}>{l}</div>
                  <div style={{ fontSize:12, color:"var(--wine)", fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deslocamento */}
        <div style={{ marginBottom:14 }}>
          <CalcFld label="Deslocamento (min)" hint="ida + volta">
            <input className="fi" type="number" min="0" step="5" value={desl} onChange={e => setDesl(+e.target.value)} placeholder="0"
              style={{ maxWidth:200 }} />
          </CalcFld>
        </div>

        {/* Preview resultado antes de calcular */}
        {totalRec > 0 && (
          <div style={{ background:"var(--bg3)", borderRadius:"var(--r-sm)", padding:"10px 14px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color:"var(--text3)", fontWeight:300 }}>Resultado estimado</span>
            <span style={{ fontFamily:"var(--font-d)", fontSize:16, color: finalPreview >= 0 ? "var(--sage)" : "var(--wine)" }}>
              {fmtBRL(finalPreview)}
              {h > 0 && <span style={{ fontSize:12, color:"var(--text3)", fontWeight:300, marginLeft:8 }}>· {fmtBRL(finalPreview/h)}/h</span>}
            </span>
          </div>
        )}

        <button className="btn-p" style={{ marginTop:4 }} onClick={calcular} disabled={savingCalc || totalRec <= 0}>
          {savingCalc ? "Calculando…" : "Calcular rentabilidade"}
        </button>
      </div>

      {/* ── Histórico ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div className="slbl" style={{ margin:0 }}>Histórico de cálculos</div>
        {hist.length > 0 && (
          <button className="btn-icon btn-danger" style={{ padding:4 }} onClick={() => setShowClearHist(true)}>
            <Icon d={ICONS.trash} size={13} stroke={1.4} />
          </button>
        )}
      </div>

      {showClearHist && (
        <>
          <div className="overlay" onClick={() => setShowClearHist(false)} />
          <div className="sheet">
            <div className="sh-handle" />
            <div className="sh-title">Limpar histórico</div>
            <div className="sh-sub">Remove todos os {hist.length} cálculos salvos.</div>
            <button className="btn-p" style={{ background:"rgba(158,96,112,0.15)",borderColor:"rgba(158,96,112,0.3)",color:"var(--wine)" }} onClick={limparHist}>Limpar tudo</button>
            <button className="btn-s" onClick={() => setShowClearHist(false)}>Cancelar</button>
          </div>
        </>
      )}

      {hist.length === 0 ? (
        <div style={{ textAlign:"center", padding:"32px 0", color:"var(--text3)", fontSize:13, fontWeight:300 }}>Nenhum cálculo realizado.</div>
      ) : hist.map((r, i) => (
        <div key={i} className="calc-hist-item fu" style={{ animationDelay:`${i*0.03}s` }}>
          <div>
            <div className="calc-hist-val" style={{ color: r.classColor || (r.hora >= 400 ? "var(--sage)" : r.hora >= 200 ? "var(--amber)" : "var(--wine)") }}>
              {fmtBRL(r.hora)}/h
            </div>
            <div className="calc-hist-meta">
              {r.local} · {r.h}h
              {r.pctDed > 0 && <span style={{ color:"var(--wine)", marginLeft:6 }}>· {r.pctDed}% deduzido</span>}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, color:"var(--text2)", fontWeight:300 }}>{fmtBRL(r.final)}</div>
            <div style={{ fontSize:10, color:"var(--text3)", fontWeight:300 }}>{fmtDate(r.ts)}</div>
            {r.id && (
              <button
                onClick={async () => {
                  if (!window.confirm('Excluir este cálculo?')) return;
                  const { supabase } = await import('./lib/supabase');
                  if (supabase) await supabase.from('iryx_calculos').delete().eq('id', r.id);
                  const fresh = await loadCalculos();
                  setHist(fresh);
                }}
                style={{ fontSize:10, color:"var(--wine)", background:"none", border:"none", cursor:"pointer", marginTop:4, padding:0, fontFamily:"var(--font)" }}
              >
                🗑 excluir
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── TURNO ATIVO PERSISTENCE ─────────────────────────────────────────────────
// O turno ativo é salvo no localStorage a cada ação para sobreviver a recargas.
// Chave separada para não conflitar com o histórico concluído.

const TURNO_ATIVO_KEY = "meridian_turno_ativo_v1";

const persistTurnoAtivo = (t) => {
  try {
    if (t) localStorage.setItem(TURNO_ATIVO_KEY, JSON.stringify(t));
    else    localStorage.removeItem(TURNO_ATIVO_KEY);
  } catch {}
};

const restoreTurnoAtivo = () => {
  try {
    const s = localStorage.getItem(TURNO_ATIVO_KEY);
    if (!s) return null;
    const t = JSON.parse(s);
    if (t?.status !== "ativo") return null;

    // Turnos de missão podem não ter saidaCasa (dia intermediário)
    // Usa atendimentoInicio ou saidaCasa para verificar validade
    const refTs = t.saidaCasa || t.atendimentoInicio || t.chegadaClinica;
    if (!refTs) return t; // sem referência de data — restaura assim mesmo

    const ref  = new Date(refTs);
    const hoje = new Date();

    // Aceita turnos de hoje E turnos de missão iniciados nos últimos 7 dias
    // (missão pode durar vários dias)
    const diasAtras = (hoje - ref) / (1000 * 60 * 60 * 24);
    if (t.missaoId) {
      if (diasAtras > 7) return null; // missão muito antiga, descarta
    } else {
      if (ref.toDateString() !== hoje.toDateString()) return null; // local: só hoje
    }

    return t;
  } catch { return null; }
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab,          setTab]         = useState("turno");
  const [turno,        setTurno]       = useState(null);
  const [showEncerrar, setShowEncerrar] = useState(false);
  const [historico,    setHistorico]   = useState([]);
  const [missoes,      setMissoes]     = useState([]);
  const [clinicas,     setClinicas]    = useState(CLINICAS_DEFAULT);
  const [loading,      setLoading]     = useState(true);
  const [saving,       setSaving]      = useState(false);

  useEffect(() => {
    const init = async () => {
      // 1. Restaurar turno ativo salvo localmente
      const turnoSalvo = restoreTurnoAtivo();
      if (turnoSalvo) setTurno(turnoSalvo);

      // 2. Carregar clínicas — Supabase é sempre a fonte de verdade
      try {
        const clinicasDB = await loadClinicasDB();
        if (clinicasDB === null) {
          // Supabase indisponível — usa localStorage como fallback temporário
          setClinicas(loadClinicas());
        } else if (clinicasDB.length === 0) {
          // Primeiro acesso: semeia as clínicas padrão no Supabase
          await seedClinicas(CLINICAS_DEFAULT);
          setClinicas(CLINICAS_DEFAULT);
          saveClinicas(CLINICAS_DEFAULT);
        } else {
          // Supabase tem dados — usa sempre, ignora localStorage
          setClinicas(clinicasDB);
          saveClinicas(clinicasDB); // mantém cópia local só como fallback offline
        }
      } catch {
        setClinicas(loadClinicas());
      }

      // 3. Carregar histórico
      try {
        const data = await loadTurnos();
        const concluidos = data.filter(t => t.status === "concluido");
        const ativoRemoto = data.find(t => t.status === "ativo");
        if (ativoRemoto && !turnoSalvo) setTurno(ativoRemoto);
        setHistorico(concluidos);
      } catch {
        setHistorico([]);
      }

      // 4. Carregar missões
      try {
        const ms = await loadMissoes();
        setMissoes(ms);
      } catch {
        setMissoes([]);
      }

      setLoading(false);
    };
    init();
  }, []);

  // Wrapper: atualiza estado + persiste localStorage + salva Supabase
  const setTurnoComPersistencia = useCallback((t) => {
    setTurno(t);
    persistTurnoAtivo(t);
  }, []);

  const iniciarTurno = useCallback(async (dados) => {
    const { novaMissao, ...resto } = dados;

    // Salva a missão sem bloquear — erro silencioso, localStorage garante o dado
    if (novaMissao) {
      try {
        await saveMissao(novaMissao);
        setMissoes(ms => [novaMissao, ...ms.filter(m => m.id !== novaMissao.id)]);
      } catch (e) {
        // Mesmo se falhar no Supabase, continua — missão está no localStorage
        console.error('[Meridian] saveMissao falhou, continuando:', e);
        setMissoes(ms => [novaMissao, ...ms.filter(m => m.id !== novaMissao.id)]);
      }
    }

    const novoTurno = {
      id: uid(), ...resto,
      chegadaClinica: null, atendimentoInicio: null,
      atendimentoFim: null, chegadaCasa: null,
      status: "ativo"
    };
    setTurnoComPersistencia(novoTurno);
    setSaving(true);
    await saveTurno(novoTurno);
    setSaving(false);
  }, [setTurnoComPersistencia]);

  // Inicia novo dia de atendimento dentro de uma missão existente
  const iniciarMissaoDia = useCallback(async (missao) => {
    // Conta quantos turnos já existem nessa missão
    const turnosDaMissao = historico.filter(t => t.missaoId === missao.id);
    const dia = turnosDaMissao.length + 1;

    const novoTurno = {
      id: uid(),
      clinicaId: missao.clinicaId,
      missaoId: missao.id,
      diaMissao: dia,
      saidaCasa: null, // não sai de casa — já está no destino
      chegadaClinica: null, atendimentoInicio: null,
      atendimentoFim: null, chegadaCasa: null,
      status: "ativo"
    };
    setTurnoComPersistencia(novoTurno);
    setSaving(true);
    await saveTurno(novoTurno);
    setSaving(false);
  }, [setTurnoComPersistencia, historico]);

  const registrarAcao = useCallback(async (acao) => {
    const updated = { ...turno, [acao]: now() };
    setTurnoComPersistencia(updated);
    await saveTurno(updated);
    if (acao === "chegadaCasa") setTimeout(() => setShowEncerrar(true), 700);
  }, [turno, setTurnoComPersistencia]);

  const pausarAtendimento = useCallback(async (motivo = null) => {
    const pausas = [...(turno.pausas || []), { inicio: now(), fim: null, motivo }];
    const updated = { ...turno, pausas };
    setTurnoComPersistencia(updated);
    await saveTurno(updated);
  }, [turno, setTurnoComPersistencia]);

  const retomarAtendimento = useCallback(async () => {
    const pausas = (turno.pausas || []).map(p =>
      p.fim === null ? { ...p, fim: now() } : p
    );
    const updated = { ...turno, pausas };
    setTurnoComPersistencia(updated);
    await saveTurno(updated);
  }, [turno, setTurnoComPersistencia]);

  const encerrarTurno = useCallback(async (extras) => {
    if (!turno) return;
    setSaving(true);
    const final = { ...turno, ...extras, status: "concluido" };
    const { data } = await saveTurno(final);
    setSaving(false);
    persistTurnoAtivo(null);
    setTurno(null);
    setHistorico(h => [data || final, ...h]);
    setShowEncerrar(false);

    // Se é turno de missão com chegadaCasa preenchida, fecha a missão
    if (final.missaoId && final.chegadaCasa) {
      const missaoAtual = missoes.find(m => m.id === final.missaoId);
      if (missaoAtual) {
        const missaoFechada = {
          ...missaoAtual,
          chegadaCasa:      final.chegadaCasa,
          partidaDestino:   final.chegadaCasa, // simplificado
          status:           "concluida",
        };
        await saveMissao(missaoFechada);
        setMissoes(ms => ms.map(m => m.id === missaoFechada.id ? missaoFechada : m));
      }
    }

    setTab("historico");
  }, [turno, missoes]);

  // Encerra o dia de missão (vai para o hotel) sem encerrar a missão
  const encerrarDia = useCallback(async () => {
    if (!turno) return;
    // Marca o turno como concluído com os dados que tem, sem chegadaCasa
    const final = { ...turno, status: "concluido" };
    const { data } = await saveTurno(final);
    persistTurnoAtivo(null);
    setTurno(null);
    setHistorico(h => [data || final, ...h]);
    setShowEncerrar(false);
    // Não fecha a missão — fica aberta para o próximo dia
  }, [turno]);
  const setClinicasComPersistencia = useCallback((cs) => {
    setClinicas(cs);
    saveClinicas(cs); // cópia local sempre
  }, []);

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
      <div className="app-wrap">
        <TopNav active={tab} onChange={setTab} saving={saving} />

        <div className="screen">
          {tab==="turno"       && <TelaHome turno={turno} historico={historico} missoes={missoes} onIniciar={iniciarTurno} onIniciarMissaoDia={iniciarMissaoDia} onAction={registrarAcao} onPausa={pausarAtendimento} onRetomar={retomarAtendimento} onEncerrar={()=>setShowEncerrar(true)} onEncerrarDia={encerrarDia} saving={saving} clinicas={clinicas} />}
          {tab==="historico"   && <TelaHistorico historico={historico} setHistorico={setHistorico} clinicas={clinicas} missoes={missoes} setMissoes={setMissoes} />}
          {tab==="analytics"   && <TelaAnalytics historico={historico} clinicas={clinicas} />}
          {tab==="clinicas"    && <TelaClinicas historico={historico} clinicas={clinicas} setClinicas={setClinicasComPersistencia} />}
          {tab==="semana"      && <TelaSemana historico={historico} clinicas={clinicas} />}
          {tab==="calculadora" && <TelaCalculadora clinicas={clinicas} />}
        </div>

        <TabBar active={tab} onChange={setTab} />

        {showEncerrar && turno && (
          <EncerrarSheet turno={turno} onConfirmar={encerrarTurno} onCancelar={()=>setShowEncerrar(false)} saving={saving} clinicas={clinicas} />
        )}
      </div>
    </>
  );
}
