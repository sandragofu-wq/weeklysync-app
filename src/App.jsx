import { useState, useEffect, useRef, useCallback, memo } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DEFAULT_HITOS = [
  "Demolición","Licencia parcelación","Licencia de obra",
  "Proyecto ejecución","Licitación","Construcción excavación",
  "Construcción civil","Construcción edificación","Licencia 1ª ocupación",
];
const HITO_CYCLE = ["pendiente","en-curso","completado","retrasado"];
const ESTADOS = {
  "en-marcha":    { label:"En marcha",    color:"#22d3a0", bg:"rgba(34,211,160,0.12)" },
  "en-riesgo":    { label:"En riesgo",    color:"#f5c842", bg:"rgba(245,200,66,0.12)" },
  "bloqueado":    { label:"Bloqueado",    color:"#f05a5a", bg:"rgba(240,90,90,0.12)" },
  "planificacion":{ label:"Planificación",color:"#4f8ef7", bg:"rgba(79,142,247,0.12)" },
  "entregado":    { label:"Entregado",    color:"#a78bfa", bg:"rgba(167,139,250,0.12)" },
};
const HITO_EST = {
  "completado":{ color:"#22d3a0", bg:"rgba(34,211,160,0.15)", icon:"✓" },
  "en-curso":  { color:"#4f8ef7", bg:"rgba(79,142,247,0.15)", icon:"→" },
  "pendiente": { color:"#4a5070", bg:"rgba(74,80,112,0.15)",  icon:"○" },
  "retrasado": { color:"#f05a5a", bg:"rgba(240,90,90,0.15)",  icon:"!" },
};
const BLOCK_ST = {
  critico:{ bg:"rgba(240,90,90,0.10)",  border:"rgba(240,90,90,0.3)",  icon:"🔴" },
  aviso:  { bg:"rgba(245,200,66,0.10)", border:"rgba(245,200,66,0.3)", icon:"⚠️" },
  info:   { bg:"rgba(79,142,247,0.10)", border:"rgba(79,142,247,0.3)", icon:"ℹ️" },
};
const VIV_ESTADOS = {
  "disponible":{ label:"Disponible", color:"#4f8ef7" },
  "reservada": { label:"Reservada",  color:"#f5c842" },
  "vendida":   { label:"Vendida",    color:"#22d3a0" },
  "no-venta":  { label:"No venta",   color:"#6b7394" },
};
const PRIO_CLR = { alta:"#f05a5a", media:"#f5c842", baja:"#22d3a0" };
const TEAM = ["Sandra","Alberto","Pilar","Mónica","María","Fran","Sara (BSA)","Dani (BSA)","Inma (BSA)"];
const S = { width:"100%", background:"#1c2030", border:"1px solid #252a3a", borderRadius:8, padding:"8px 11px", color:"#e8eaf2", fontFamily:"inherit", fontSize:"0.84rem", outline:"none", boxSizing:"border-box" };

const DEFAULT_PROJECTS = [
  {
    id:1, name:"ATABAL", zona:"Sur", estado:"en-marcha",
    projectOwner:"Sandra", pmTecnico:"Sara (BSA)", responsableComercial:"Sandra",
    comercializadora:"", ubicacion:"Málaga", presupuesto:"€8.2M", costeActual:"€7.9M", fechaEntrega:"2026-06-01",
    hitos:DEFAULT_HITOS.map((n,i)=>({nombre:n,estado:i<3?"completado":i===3?"en-curso":"pendiente",fechaPrevista:"",fechaReal:"",notas:""})),
    blockers:[{tipo:"critico",titulo:"Licencia 1ª ocupación retrasada",desc:"Ayuntamiento solicita documentación adicional.",responsable:"Sara (BSA)"}],
    tareas:[{id:1,texto:"Reunión ayuntamiento - licencia",done:false,responsable:"Sara (BSA)",prioridad:"alta",vencimiento:"2025-06-10"}],
    viviendas:[], resumenSemanal:"", ultimaActualizacion:"2025-06-02",
  },
  {
    id:2, name:"MEDHILLS", zona:"Sur", estado:"en-riesgo",
    projectOwner:"Sandra", pmTecnico:"Inma (BSA)", responsableComercial:"Sandra",
    comercializadora:"Engel & Völkers", ubicacion:"Fuengirola", presupuesto:"€5.1M", costeActual:"€4.8M", fechaEntrega:"2027-03-01",
    hitos:DEFAULT_HITOS.map((n,i)=>({nombre:n,estado:i<2?"completado":i===2?"en-curso":"pendiente",fechaPrevista:"",fechaReal:"",notas:""})),
    blockers:[{tipo:"aviso",titulo:"Ritmo de ventas bajo",desc:"Absorción 0.8 uds/mes vs objetivo 1.5.",responsable:"Sandra"}],
    tareas:[{id:3,texto:"Revisar pricing tipologías B y C",done:false,responsable:"Sandra",prioridad:"alta",vencimiento:"2025-06-08"}],
    viviendas:[], resumenSemanal:"", ultimaActualizacion:"2025-06-01",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = d => { if(!d) return "—"; try { return new Date(d+"T00:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"}); } catch { return d; } };
const fmtEur = n => { const v=Number(n); if(!v&&v!==0) return "—"; return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(v); };
const fmtNum = n => new Intl.NumberFormat("es-ES").format(Number(n)||0);

const calcStats = (viviendas=[]) => {
  const vv = viviendas.filter(v=>v&&v.estado);
  const total=vv.length, vendidas=vv.filter(v=>v.estado==="vendida").length,
    reservadas=vv.filter(v=>v.estado==="reservada").length, disponibles=vv.filter(v=>v.estado==="disponible").length;
  const cp=vv.filter(v=>Number(v.precio)>0);
  const precioMedio=cp.length?Math.round(cp.reduce((a,v)=>a+Number(v.precio),0)/cp.length):0;
  const ingresosTotal=vv.reduce((a,v)=>a+Number(v.precio||0),0);
  const ingresosVR=vv.filter(v=>v.estado==="vendida"||v.estado==="reservada").reduce((a,v)=>a+Number(v.precio||0),0);
  return {total,vendidas,reservadas,disponibles,precioMedio,ingresosTotal,ingresosVR};
};

// Parse price: "599.000" / "599000" / "599,000" → 599000
const parsePrice = raw => {
  if(!raw && raw!==0) return 0;
  const s = String(raw).trim();
  // If it's already a number
  if(typeof raw==="number") return Math.round(raw);
  // Remove currency symbols and spaces
  const clean = s.replace(/[€$£\s]/g,"");
  // European format: 599.000 or 599.000,00
  if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(clean)) return parseInt(clean.replace(/\./g,"").replace(/,.*/,""),10);
  // US format: 599,000 or 599,000.00
  if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(clean)) return parseInt(clean.replace(/,/g,"").replace(/\..*/,""),10);
  // Plain number
  return parseInt(clean.replace(/[,.].*/,""),10)||0;
};

// Parse m²: "147,35m²" → 147.35
const parseM2 = raw => {
  if(!raw) return 0;
  const s = String(raw).replace(/m²|m2|M2/gi,"").replace(/\s/g,"").trim();
  // Take first number before + or /
  const first = s.split(/[+/]/)[0];
  return parseFloat(first.replace(",","."))||0;
};

// Detect vivienda estado from "reservas 1ª" presence
const detectEstado = (row, headers) => {
  // Check if there's a "reservas" column with a value
  const reservaKey = headers.find(h=>h.toLowerCase().includes("reserva"));
  if(reservaKey && row[reservaKey] && String(row[reservaKey]).trim()!=="") return "reservada";
  return "disponible";
};

// ─── XLSX PROCESSOR ───────────────────────────────────────────────────────────
const processXLSX = (wb) => {
  const allViviendas = [];

  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    if(!ws) return;

    // Get raw array of arrays (no header parsing yet)
    const raw = window.XLSX.utils.sheet_to_json(ws, { header:1, defval:"", raw:true });
    if(!raw || raw.length < 2) return;

    // Find header row: look for row containing "NÚM" or "NUM" or "ref" or "precio" or "PVP"
    let headerRowIdx = -1;
    for(let i=0;i<Math.min(raw.length,10);i++){
      const r = raw[i].map(c=>String(c||"").toLowerCase().trim());
      if(r.some(c=>c==="núm"||c==="num"||c==="ref"||c==="referencia"||c.includes("pvp")||c.includes("precio"))){
        headerRowIdx=i; break;
      }
    }
    if(headerRowIdx===-1) return; // skip sheet with no recognizable header

    const headers = raw[headerRowIdx].map(c=>String(c||"").trim());

    // Map column names to indices
    const idx = {};
    headers.forEach((h,i)=>{
      const hl=h.toLowerCase();
      if(hl==="núm"||hl==="num"||hl==="nº"||hl==="n") idx.ref=i;
      else if(hl==="ref"||hl==="referencia"||hl==="unidad") idx.ref=i;
      // Prefer PVP as sale price; fall back to precio
      else if(hl==="pvp"||hl==="pvp 2"||hl==="pvp2") { if(idx.pvp===undefined) idx.pvp=i; }
      else if(hl==="precio"||hl==="precio venta"||hl==="importe") { if(idx.precio===undefined) idx.precio=i; }
      else if(hl.includes("m2 útil")||hl.includes("m2 util")||hl.includes("m² útil")||hl.includes("útil int")||hl.includes("util int")) idx.sup=i;
      else if(hl==="superficie"||hl==="sup"||hl.includes("m2 cons")) { if(idx.sup===undefined) idx.sup=i; }
      else if(hl==="dor"||hl==="dormitorios"||hl==="habitaciones"||hl==="hab") idx.dor=i;
      else if(hl==="orientación"||hl==="orientacion"||hl==="orient") idx.orientacion=i;
      else if(hl==="jardín"||hl==="jardin"||hl==="m2 jardin"||hl==="jardín m²") idx.jardin=i;
      else if(hl.includes("adosado")||hl==="tipo"||hl==="tipologia"||hl==="tipología") idx.tipo=i;
      else if(hl.includes("vista")||hl.includes("ubicacion")||hl.includes("ubicación")) idx.vistas=i;
      else if(hl.includes("terraza")||hl.includes("jardín /")||hl.includes("exterior")) idx.terraza=i;
      else if(hl.includes("sótano")||hl.includes("sotano")||hl.includes("garaje")) idx.garaje=i;
      else if(hl.includes("reserva")) idx.reservas=i;
      else if(hl==="mar"||hl.includes("vistas mar")) idx.mar=i;
    });

    // Process data rows
    for(let i=headerRowIdx+1;i<raw.length;i++){
      const row=raw[i];
      if(!row||row.length===0) continue;

      // Get ref
      const refRaw = idx.ref!==undefined ? row[idx.ref] : "";
      const refStr = String(refRaw||"").trim();

      // Skip empty rows, totals, headers
      if(!refStr || refStr==="" || isNaN(Number(refStr)) && refStr.toLowerCase().includes("total")) continue;
      // Skip if ref is not a number or doesn't look like a unit ref
      if(String(refStr).toLowerCase().includes("total") || String(refStr).toLowerCase().includes("parcela")) continue;

      // Price: prefer PVP column, fall back to precio
      const priceRaw = idx.pvp!==undefined ? row[idx.pvp] : (idx.precio!==undefined ? row[idx.precio] : 0);
      const precio = parsePrice(priceRaw||0) || parsePrice(idx.precio!==undefined?row[idx.precio]:0);

      if(!precio) continue; // skip rows with no price

      const supRaw = idx.sup!==undefined ? row[idx.sup] : "";
      const dorRaw = idx.dor!==undefined ? row[idx.dor] : "";
      const orientacion = idx.orientacion!==undefined ? String(row[idx.orientacion]||"").trim() : "";
      const jardinRaw = idx.jardin!==undefined ? row[idx.jardin] : "";
      const tipoRaw = idx.tipo!==undefined ? String(row[idx.tipo]||"").trim() : "";
      const vistasRaw = idx.vistas!==undefined ? String(row[idx.vistas]||"").trim() : "";
      const terrazaRaw = idx.terraza!==undefined ? String(row[idx.terraza]||"").trim() : "";
      const marRaw = idx.mar!==undefined ? String(row[idx.mar]||"").trim() : "";

      // Detect estado
      const reservasVal = idx.reservas!==undefined ? String(row[idx.reservas]||"").trim() : "";
      const estado = reservasVal && reservasVal!=="0" ? "reservada" : "disponible";

      // Build tipologia from dormitorios
      const dor = Number(dorRaw)||0;
      const tipologia = dor ? `${dor} dorm.` : (tipoRaw||"—");

      // Notes
      const notas = [
        orientacion ? `Orient: ${orientacion}` : "",
        vistasRaw ? `Vistas: ${vistasRaw}` : "",
        marRaw ? `Mar: ${marRaw}` : "",
        terrazaRaw ? terrazaRaw.substring(0,40) : "",
      ].filter(Boolean).join(" · ");

      allViviendas.push({
        id: Date.now()+Math.random(),
        ref: `${sheetName!=="Hoja1"?sheetName+"-":""}${refStr}`,
        tipologia,
        planta: tipoRaw||"—",
        superficie: parseM2(supRaw),
        precio,
        estado,
        notas: notas.substring(0,100),
      });
    }
  });

  return allViviendas;
};

// ─── STABLE FORM HOOK ─────────────────────────────────────────────────────────
// This is the KEY fix: form state lives outside the main component tree
// so editing a field doesn't re-render the whole app and lose focus

function useStableForm(initial) {
  const [form, setForm] = useState(initial);
  const setField = useCallback((key, val) => {
    setForm(prev => ({...prev, [key]: val}));
  }, []);
  const reset = useCallback((vals) => setForm(vals), []);
  return [form, setField, reset, setForm];
}

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const Modal = memo(({ title, onClose, children, wide }) => (
  <div onMouseDown={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:"#141720",border:"1px solid #252a3a",borderRadius:16,padding:28,width:wide?720:520,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div style={{fontWeight:800,fontSize:"1.05rem"}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7394",fontSize:"1.3rem",cursor:"pointer",lineHeight:1}}>✕</button>
      </div>
      {children}
    </div>
  </div>
));

const FL = ({ label, children }) => (
  <div style={{marginBottom:12}}>
    <div style={{fontSize:"0.7rem",color:"#6b7394",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
    {children}
  </div>
);

const Btn = ({ onClick, children, v="ghost", sm, type="button" }) => {
  const styles = {
    primary:{background:"#4f8ef7",color:"#fff",border:"none"},
    danger:{background:"transparent",color:"#f05a5a",border:"1px solid rgba(240,90,90,0.3)"},
    ghost:{background:"transparent",color:"#6b7394",border:"1px solid #252a3a"},
    green:{background:"#22d3a0",color:"#0d0f14",border:"none"},
  };
  return (
    <button type={type} onClick={onClick}
      style={{...styles[v],borderRadius:8,padding:sm?"4px 10px":"7px 16px",cursor:"pointer",fontSize:sm?"0.73rem":"0.84rem",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>
      {children}
    </button>
  );
};

// ─── HITO ROW (memoized to prevent re-render) ─────────────────────────────────
const HitoRow = memo(({ h, idx, onCycle, onEdit, onDelete, onDragStart, onDragEnter, onDragEnd, isDragging, isOver }) => {
  const hs = HITO_EST[h.estado]||HITO_EST.pendiente;
  return (
    <div draggable
      onDragStart={()=>onDragStart(idx)} onDragEnter={()=>onDragEnter(idx)}
      onDragOver={e=>e.preventDefault()} onDragEnd={onDragEnd}
      style={{display:"flex",alignItems:"center",gap:12,background:isDragging?"#1c2030":"#141720",borderRadius:11,border:isOver?"1px solid #4f8ef7":`1px solid ${h.estado==="retrasado"?"rgba(240,90,90,0.35)":h.estado==="en-curso"?"rgba(79,142,247,0.2)":"#252a3a"}`,padding:"12px 15px",marginBottom:7,opacity:isDragging?0.4:1,cursor:"grab",userSelect:"none"}}>
      <div style={{color:"#3a4060",fontSize:"1rem",flexShrink:0}}>⠿</div>
      <div onClick={()=>onCycle(idx)} title="Click para cambiar estado"
        style={{width:30,height:30,borderRadius:"50%",background:hs.bg,border:`2px solid ${hs.color}`,display:"flex",alignItems:"center",justifyContent:"center",color:hs.color,fontWeight:800,fontSize:"0.85rem",flexShrink:0,cursor:"pointer"}}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.15)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        {hs.icon}
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight:600,fontSize:"0.87rem",marginBottom:h.notas?3:0}}>{h.nombre}</div>
        {h.notas&&<div style={{fontSize:"0.72rem",color:"#6b7394"}}>{h.notas}</div>}
      </div>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        {h.fechaPrevista&&<div style={{fontSize:"0.71rem",color:"#6b7394"}}>Prev: {fmt(h.fechaPrevista)}</div>}
        {h.fechaReal&&<div style={{fontSize:"0.71rem",color:"#22d3a0"}}>Real: {fmt(h.fechaReal)}</div>}
        <span style={{fontSize:"0.63rem",fontWeight:700,padding:"2px 7px",borderRadius:6,background:hs.bg,color:hs.color,textTransform:"uppercase"}}>{h.estado}</span>
      </div>
      <div style={{display:"flex",gap:5}}>
        <Btn onClick={()=>onEdit(idx)} sm>✏️</Btn>
        <Btn onClick={()=>onDelete(idx)} v="danger" sm>✕</Btn>
      </div>
    </div>
  );
});

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Overview() {
  const [projects, setProjects] = useState(() => {
    try { const s=localStorage.getItem("overview_v6"); if(s){const p=JSON.parse(s);return p.map(x=>({...x,viviendas:x.viviendas||[]}));} return DEFAULT_PROJECTS; } catch { return DEFAULT_PROJECTS; }
  });
  const [view, setView] = useState("dashboard");
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState("hitos");
  const [modal, setModal] = useState(null); // null | "proj" | "hito" | "tarea" | "blocker" | "vivienda"

  // Drag refs
  const dragItem = useRef(null);
  const dragOver = useRef(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  // ── STABLE FORM STATES (the key fix for input focus) ──
  const EP = {name:"",zona:"Sur",estado:"planificacion",projectOwner:"",pmTecnico:"",responsableComercial:"",comercializadora:"",ubicacion:"",presupuesto:"",costeActual:"",fechaEntrega:""};
  const [pF, pSet, pReset] = useStableForm(EP);
  const [tF, tSet, tReset] = useStableForm({texto:"",responsable:"",prioridad:"media",vencimiento:""});
  const [bF, bSet, bReset] = useStableForm({tipo:"aviso",titulo:"",desc:"",responsable:""});
  const [hF, hSet, hReset] = useStableForm({nombre:"",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""});
  const [vF, vSet, vReset] = useStableForm({ref:"",tipologia:"",planta:"",superficie:"",precio:"",estado:"disponible",notas:""});

  // These are SEPARATE from modal forms to avoid re-render issues
  const [newHName, setNewHName] = useState("");
  const [resumenLocal, setResumenLocal] = useState("");

  // editing ID
  const editRef = useRef(null);
  const hitoIdxRef = useRef(null);

  const proj = projects.find(p=>p.id===activeId);

  useEffect(()=>{ try{localStorage.setItem("overview_v6",JSON.stringify(projects));}catch{} },[projects]);
  useEffect(()=>{ if(proj){setResumenLocal(proj.resumenSemanal||"");} },[activeId]);

  const save = fn => setProjects(prev=>fn(prev));
  const upd = useCallback((id,fn) => setProjects(prev=>prev.map(p=>p.id!==id?p:fn(p))), []);

  // ── PROJECT ──
  const openNewP = () => { editRef.current=null; pReset(EP); setModal("proj"); };
  const openEditP = () => {
    if(!proj) return;
    editRef.current=proj.id;
    pReset({name:proj.name,zona:proj.zona,estado:proj.estado,projectOwner:proj.projectOwner,pmTecnico:proj.pmTecnico,responsableComercial:proj.responsableComercial,comercializadora:proj.comercializadora||"",ubicacion:proj.ubicacion,presupuesto:proj.presupuesto||"",costeActual:proj.costeActual||"",fechaEntrega:proj.fechaEntrega||""});
    setModal("proj");
  };
  const saveP = () => {
    if(!pF.name.trim()) return;
    if(editRef.current) {
      upd(editRef.current, p=>({...p,...pF}));
    } else {
      const np={...pF,id:Date.now(),hitos:DEFAULT_HITOS.map(n=>({nombre:n,estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""})),blockers:[],tareas:[],viviendas:[],resumenSemanal:"",ultimaActualizacion:new Date().toISOString().split("T")[0]};
      save(prev=>[...prev,np]); setActiveId(np.id); setView("proyecto");
    }
    setModal(null);
  };
  const delP = id => { if(!confirm("¿Eliminar esta promoción?")) return; save(prev=>prev.filter(p=>p.id!==id)); setView("dashboard"); setActiveId(null); };

  // ── HITOS ──
  const cycleHito = useCallback(idx => {
    upd(activeId, p => {
      const h=[...p.hitos]; const cur=h[idx].estado;
      const next=HITO_CYCLE[(HITO_CYCLE.indexOf(cur)+1)%HITO_CYCLE.length];
      h[idx]={...h[idx],estado:next,fechaReal:next==="completado"?new Date().toISOString().split("T")[0]:h[idx].fechaReal};
      return {...p,hitos:h};
    });
  },[activeId,upd]);

  const handleDragStart = useCallback(idx=>{dragItem.current=idx;setDragIdx(idx);},[]);
  const handleDragEnter = useCallback(idx=>{dragOver.current=idx;setOverIdx(idx);},[]);
  const handleDragEnd = useCallback(()=>{
    if(dragItem.current!==null&&dragOver.current!==null&&dragItem.current!==dragOver.current){
      upd(activeId,p=>{const h=[...p.hitos];const el=h.splice(dragItem.current,1)[0];h.splice(dragOver.current,0,el);return {...p,hitos:h};});
    }
    dragItem.current=null;dragOver.current=null;setDragIdx(null);setOverIdx(null);
  },[activeId,upd]);

  const openEditH = idx => { hitoIdxRef.current=idx; const h=proj?.hitos[idx]; if(h) hReset({...h}); setModal("hito"); };
  const saveH = () => { upd(activeId,p=>({...p,hitos:p.hitos.map((h,i)=>i!==hitoIdxRef.current?h:{...hF})})); setModal(null); };
  const addH = () => { if(!newHName.trim()) return; upd(activeId,p=>({...p,hitos:[...p.hitos,{nombre:newHName,estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""}]})); setNewHName(""); };
  const delH = useCallback(idx=>upd(activeId,p=>({...p,hitos:p.hitos.filter((_,i)=>i!==idx)})),[activeId,upd]);

  // ── TAREAS ──
  const openNewT = () => { editRef.current=null; tReset({texto:"",responsable:proj?.projectOwner||"",prioridad:"media",vencimiento:""}); setModal("tarea"); };
  const openEditT = t => { editRef.current=t.id; tReset({texto:t.texto,responsable:t.responsable,prioridad:t.prioridad,vencimiento:t.vencimiento}); setModal("tarea"); };
  const saveT = () => { if(!tF.texto.trim()) return; if(editRef.current) { upd(activeId,p=>({...p,tareas:p.tareas.map(t=>t.id!==editRef.current?t:{...t,...tF})})); } else { upd(activeId,p=>({...p,tareas:[...p.tareas,{id:Date.now(),...tF,done:false}]})); } setModal(null); };
  const togT = useCallback(tid=>upd(activeId,p=>({...p,tareas:p.tareas.map(t=>t.id===tid?{...t,done:!t.done}:t)})),[activeId,upd]);
  const delT = useCallback(tid=>upd(activeId,p=>({...p,tareas:p.tareas.filter(t=>t.id!==tid)})),[activeId,upd]);

  // ── BLOCKERS ──
  const openNewB = () => { editRef.current=null; bReset({tipo:"aviso",titulo:"",desc:"",responsable:proj?.projectOwner||""}); setModal("blocker"); };
  const openEditB = (b,idx) => { editRef.current=idx; bReset({...b}); setModal("blocker"); };
  const saveB = () => { if(!bF.titulo.trim()) return; if(editRef.current!==null&&typeof editRef.current==="number"){ upd(activeId,p=>({...p,blockers:p.blockers.map((b,i)=>i!==editRef.current?b:{...bF})})); } else { upd(activeId,p=>({...p,blockers:[...p.blockers,{...bF}]})); } setModal(null); };
  const delB = useCallback(idx=>upd(activeId,p=>({...p,blockers:p.blockers.filter((_,i)=>i!==idx)})),[activeId,upd]);

  // ── VIVIENDAS ──
  const openNewV = () => { editRef.current=null; vReset({ref:"",tipologia:"",planta:"",superficie:"",precio:"",estado:"disponible",notas:""}); setModal("vivienda"); };
  const openEditV = v => { editRef.current=v.id; vReset({ref:v.ref,tipologia:v.tipologia,planta:v.planta,superficie:String(v.superficie||""),precio:String(v.precio||""),estado:v.estado,notas:v.notas||""}); setModal("vivienda"); };
  const saveV = () => {
    if(!vF.ref.trim()) return;
    const clean={...vF,precio:parsePrice(vF.precio),superficie:parseM2(vF.superficie)||Number(vF.superficie)||0};
    if(editRef.current) { upd(activeId,p=>({...p,viviendas:p.viviendas.map(v=>v.id!==editRef.current?v:{...v,...clean})})); }
    else { upd(activeId,p=>({...p,viviendas:[...(p.viviendas||[]),{id:Date.now(),...clean}]})); }
    setModal(null);
  };
  const delV = useCallback(vid=>upd(activeId,p=>({...p,viviendas:p.viviendas.filter(v=>v.id!==vid)})),[activeId,upd]);
  const cycleViv = useCallback(vid=>{
    const cycle=["disponible","reservada","vendida","no-venta"];
    upd(activeId,p=>({...p,viviendas:p.viviendas.map(v=>v.id!==vid?v:{...v,estado:cycle[(cycle.indexOf(v.estado)+1)%cycle.length]})}));
  },[activeId,upd]);
  const clearViviendas = () => { if(!confirm("¿Eliminar todas las viviendas de esta promoción?")) return; upd(activeId,p=>({...p,viviendas:[]})); };

  // ── FILE IMPORT ──
  useEffect(()=>{
    if(!document.getElementById("sheetjs")){
      const sc=document.createElement("script");
      sc.id="sheetjs"; sc.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      document.head.appendChild(sc);
    }
  },[]);

  const handleFile = useCallback(e => {
    const file=e.target.files[0]; if(!file) return;
    const ext=file.name.split(".").pop().toLowerCase();

    const doProcess = wb => {
      const viviendas=processXLSX(wb);
      if(viviendas.length===0){ alert("No se encontraron viviendas con precio. Revisa el formato del archivo."); return; }
      upd(activeId,p=>({...p,viviendas:[...(p.viviendas||[]),...viviendas]}));
      alert(`✅ ${viviendas.length} viviendas importadas correctamente`);
    };

    const reader=new FileReader();
    if(ext==="xlsx"||ext==="xls"){
      reader.onload=ev=>{
        if(!window.XLSX){ alert("SheetJS aún cargando, espera 2 segundos e inténtalo de nuevo."); return; }
        try { const wb=window.XLSX.read(ev.target.result,{type:"binary"}); doProcess(wb); }
        catch(err){ alert("Error leyendo Excel: "+err.message); }
      };
      reader.readAsBinaryString(file);
    } else {
      reader.onload=ev=>{
        if(!window.XLSX){ alert("SheetJS aún cargando."); return; }
        try { const wb=window.XLSX.read(ev.target.result,{type:"string"}); doProcess(wb); }
        catch(err){ alert("Error: "+err.message); }
      };
      reader.readAsText(file,"UTF-8");
    }
    e.target.value="";
  },[activeId,upd]);

  const saveResumen = () => {
    upd(activeId,p=>({...p,resumenSemanal:resumenLocal,ultimaActualizacion:new Date().toISOString().split("T")[0]}));
  };

  const today=new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});

  // ─── DASHBOARD ───────────────────────────────────────────────────────────────
  const Dashboard = () => {
    const allStats=projects.map(p=>calcStats(p.viviendas||[]));
    const totalU=allStats.reduce((a,s)=>a+s.total,0), totalV=allStats.reduce((a,s)=>a+s.vendidas,0);
    const bloq=projects.filter(p=>p.estado==="bloqueado").length, risk=projects.filter(p=>p.estado==="en-riesgo").length;
    return (
      <div style={{padding:"24px 32px",overflowY:"auto",flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div><div style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.03em",marginBottom:3}}>Panel de promociones</div><div style={{fontSize:"0.78rem",color:"#6b7394"}}>Vista consolidada</div></div>
          <Btn onClick={openNewP} v="primary">+ Nueva promoción</Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:26}}>
          {[
            {label:"Promociones",val:projects.length,color:"#4f8ef7",sub:"activas"},
            {label:"Unidades en cartera",val:fmtNum(totalU),color:"#e8eaf2",sub:"total registradas"},
            {label:"Vendidas",val:`${fmtNum(totalV)} / ${fmtNum(totalU)}`,color:"#22d3a0",sub:totalU?`${Math.round(totalV/totalU*100)}% absorción`:"—"},
            {label:"Alertas",val:bloq+risk,color:bloq>0?"#f05a5a":risk>0?"#f5c842":"#22d3a0",sub:`${bloq} bloqueados · ${risk} en riesgo`},
          ].map(k=>(
            <div key={k.label} style={{background:"#141720",borderRadius:14,border:"1px solid #252a3a",padding:"18px 22px"}}>
              <div style={{fontSize:"0.65rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.09em",fontWeight:700,marginBottom:8}}>{k.label}</div>
              <div style={{fontSize:"1.7rem",fontWeight:800,color:k.color,letterSpacing:"-0.03em",marginBottom:3}}>{k.val}</div>
              <div style={{fontSize:"0.72rem",color:"#6b7394"}}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#141720",borderRadius:14,border:"1px solid #252a3a",overflow:"hidden"}}>
          <div style={{padding:"15px 22px",borderBottom:"1px solid #252a3a"}}><div style={{fontWeight:800,fontSize:"0.92rem"}}>📋 Todas las promociones</div></div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 0.8fr 1fr 0.9fr 1.1fr 1.3fr 1fr 50px",padding:"9px 22px",borderBottom:"1px solid #1c2030"}}>
            {["Promoción","Zona","Estado","Hitos","Ventas","Project Owner","Última act.",""].map(h=><div key={h} style={{fontSize:"0.62rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</div>)}
          </div>
          {projects.map((p,idx)=>{
            const est=ESTADOS[p.estado]||ESTADOS.planificacion;
            const st=calcStats(p.viviendas||[]);
            const hOk=p.hitos.filter(h=>h.estado==="completado").length;
            const pct=st.total?Math.round(st.vendidas/st.total*100):0;
            return (
              <div key={p.id} onClick={()=>{setActiveId(p.id);setView("proyecto");setTab("hitos");}}
                style={{display:"grid",gridTemplateColumns:"2fr 0.8fr 1fr 0.9fr 1.1fr 1.3fr 1fr 50px",padding:"13px 22px",borderBottom:idx<projects.length-1?"1px solid #1c2030":"none",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1e2c"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div><div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:2}}>{p.name}</div><div style={{fontSize:"0.71rem",color:"#6b7394"}}>{p.ubicacion}</div></div>
                <div style={{fontSize:"0.8rem",color:"#6b7394",alignSelf:"center"}}>{p.zona}</div>
                <div style={{alignSelf:"center"}}><span style={{fontSize:"0.65rem",fontWeight:700,padding:"3px 8px",borderRadius:8,background:est.bg,color:est.color,textTransform:"uppercase"}}>{est.label}</span></div>
                <div style={{alignSelf:"center"}}>
                  <div style={{fontSize:"0.82rem",fontWeight:600,marginBottom:4}}>{hOk}/{p.hitos.length}</div>
                  <div style={{height:3,background:"#252a3a",borderRadius:2,width:50,overflow:"hidden"}}><div style={{height:"100%",width:`${p.hitos.length?hOk/p.hitos.length*100:0}%`,background:"#4f8ef7",borderRadius:2}}/></div>
                </div>
                <div style={{alignSelf:"center"}}>
                  <div style={{fontSize:"0.82rem",fontWeight:600,color:pct>70?"#22d3a0":pct>40?"#f5c842":"#e8eaf2"}}>{pct}%</div>
                  <div style={{fontSize:"0.7rem",color:"#6b7394"}}>{st.vendidas}/{st.total} uds</div>
                </div>
                <div style={{alignSelf:"center"}}><div style={{fontWeight:500,fontSize:"0.82rem"}}>{p.projectOwner||"—"}</div><div style={{fontSize:"0.7rem",color:"#6b7394"}}>{p.pmTecnico||"—"}</div></div>
                <div style={{fontSize:"0.73rem",color:"#6b7394",alignSelf:"center"}}>
                  {p.ultimaActualizacion?fmt(p.ultimaActualizacion):"—"}
                  {p.blockers.length>0&&<div style={{color:"#f05a5a",fontSize:"0.67rem",marginTop:2}}>⚠ {p.blockers.length} alerta{p.blockers.length>1?"s":""}</div>}
                </div>
                <div style={{alignSelf:"center",textAlign:"right",color:"#6b7394"}}>→</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── PROYECTO ─────────────────────────────────────────────────────────────────
  const Proyecto = () => {
    if(!proj) return null;
    const est=ESTADOS[proj.estado]||ESTADOS.planificacion;
    const st=calcStats(proj.viviendas||[]);
    const pct=st.total?Math.round(st.vendidas/st.total*100):0;
    const tabs=[
      {id:"hitos",label:"🏗 Hitos"},
      {id:"viviendas",label:`🏠 Viviendas${st.total>0?` (${st.total})`:""}`},
      {id:"comercial",label:"📊 Comercial"},
      {id:"equipo",label:"👥 Equipo"},
      {id:"blockers",label:`🚧 Alertas${proj.blockers.length>0?` (${proj.blockers.length})`:""}`},
      {id:"tareas",label:`✅ Tareas${proj.tareas.filter(t=>!t.done).length>0?` (${proj.tareas.filter(t=>!t.done).length})`:""}`},
      {id:"reporte",label:"📝 Reporte"},
    ];
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"18px 32px 0",background:"#0d0f14",borderBottom:"1px solid #252a3a",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                <button onClick={()=>setView("dashboard")} style={{background:"none",border:"none",color:"#6b7394",cursor:"pointer",fontSize:"0.78rem",padding:0}}>← Volver</button>
                <h1 style={{margin:0,fontSize:"1.5rem",fontWeight:800,letterSpacing:"-0.03em"}}>{proj.name}</h1>
                <span style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 9px",borderRadius:8,background:est.bg,color:est.color,textTransform:"uppercase"}}>{est.label}</span>
                <span style={{fontSize:"0.73rem",color:"#6b7394"}}>{proj.ubicacion} · {proj.zona}</span>
              </div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                {[`👤 ${proj.projectOwner||"—"}`,`🏗 ${proj.pmTecnico||"—"}`,`💼 ${proj.responsableComercial||"—"}`,`📅 ${fmt(proj.fechaEntrega)}`].map(m=><span key={m} style={{fontSize:"0.75rem",color:"#6b7394"}}>{m}</span>)}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}><Btn onClick={openEditP} sm>✏️ Editar</Btn><Btn onClick={()=>delP(proj.id)} v="danger" sm>Eliminar</Btn></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
            {[{label:"Total uds",val:st.total||"—"},{label:"Vendidas",val:st.vendidas,color:"#22d3a0"},{label:"Reservadas",val:st.reservadas,color:"#f5c842"},{label:"Absorción",val:`${pct}%`,color:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a"},{label:"Precio medio",val:fmtEur(st.precioMedio)}].map(k=>(
              <div key={k.label} style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"10px 14px"}}>
                <div style={{fontSize:"0.6rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{k.label}</div>
                <div style={{fontSize:"1.1rem",fontWeight:800,color:k.color||"#e8eaf2"}}>{k.val}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:0,overflowX:"auto"}}>
            {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?"#4f8ef7":"transparent"}`,color:tab===t.id?"#e8eaf2":"#6b7394",padding:"9px 14px",cursor:"pointer",fontSize:"0.79rem",fontWeight:tab===t.id?700:400,fontFamily:"inherit",whiteSpace:"nowrap"}}>{t.label}</button>)}
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"22px 32px"}}>

          {/* ── HITOS ── */}
          {tab==="hitos"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div><div style={{fontWeight:700,fontSize:"0.92rem"}}>Hitos del proyecto</div><div style={{fontSize:"0.73rem",color:"#6b7394",marginTop:2}}>Arrastra ⠿ para reordenar · Click en el círculo para cambiar estado</div></div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input value={newHName} onChange={e=>setNewHName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addH();}}} placeholder="Nombre del nuevo hito..." style={{...S,width:200}}/>
                  <Btn onClick={addH} sm>+ Añadir</Btn>
                </div>
              </div>
              {proj.hitos.map((h,idx)=>(
                <HitoRow key={`h-${proj.id}-${idx}`} h={h} idx={idx}
                  onCycle={cycleHito} onEdit={openEditH} onDelete={delH}
                  onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd}
                  isDragging={dragIdx===idx} isOver={overIdx===idx&&dragIdx!==idx}/>
              ))}
              <div style={{display:"flex",gap:14,marginTop:16,flexWrap:"wrap"}}>
                {Object.entries(HITO_EST).map(([k,v])=><div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:"0.71rem",color:v.color}}><div style={{width:7,height:7,borderRadius:"50%",background:v.color}}/> {k}</div>)}
              </div>
            </div>
          )}

          {/* ── VIVIENDAS ── */}
          {tab==="viviendas"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <div><div style={{fontWeight:700,fontSize:"0.92rem"}}>Tabla de viviendas</div><div style={{fontSize:"0.73rem",color:"#6b7394",marginTop:2}}>Click en el estado para cambiarlo · Precio medio calculado automáticamente</div></div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  {proj.viviendas.length>0&&<Btn onClick={clearViviendas} v="danger" sm>🗑 Limpiar todo</Btn>}
                  <label style={{background:"transparent",border:"1px solid #4f8ef7",color:"#4f8ef7",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6}}>
                    📥 Importar Excel / CSV
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{display:"none"}}/>
                  </label>
                  <Btn onClick={openNewV} sm>+ Añadir</Btn>
                </div>
              </div>

              <div style={{background:"rgba(79,142,247,0.06)",border:"1px solid rgba(79,142,247,0.2)",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:"0.74rem",color:"#6b7394"}}>
                💡 <strong style={{color:"#4f8ef7"}}>Formato aceptado:</strong> Excel con columnas <code style={{color:"#e8eaf2",background:"#1c2030",padding:"1px 5px",borderRadius:4}}>NÚM, PVP, M2 ÚTIL INT, DOR, ORIENTACIÓN, JARDÍN, reservas 1ª...</code> — compatible con el formato de Atalaya y similares
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
                {[{l:"Total",v:st.total,c:"#e8eaf2"},{l:"Vendidas",v:st.vendidas,c:"#22d3a0"},{l:"Reservadas",v:st.reservadas,c:"#f5c842"},{l:"Disponibles",v:st.disponibles,c:"#4f8ef7"}].map(x=>(
                  <div key={x.l} style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"10px 14px",textAlign:"center"}}>
                    <div style={{fontSize:"0.62rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>{x.l}</div>
                    <div style={{fontSize:"1.3rem",fontWeight:800,color:x.c}}>{x.v}</div>
                  </div>
                ))}
              </div>

              {proj.viviendas.length===0?(
                <div style={{textAlign:"center",padding:"50px 20px",color:"#6b7394",background:"#141720",borderRadius:12,border:"1px solid #252a3a"}}>
                  <div style={{fontSize:"2.5rem",marginBottom:10}}>🏠</div>
                  <div style={{fontWeight:600,marginBottom:4,color:"#e8eaf2",fontSize:"1rem"}}>No hay viviendas cargadas</div>
                  <div style={{fontSize:"0.8rem",marginBottom:20}}>Importa tu Excel de precios o añade viviendas manualmente</div>
                  <label style={{background:"#4f8ef7",color:"#fff",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:"0.85rem",fontWeight:700}}>
                    📥 Importar Excel de precios
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{display:"none"}}/>
                  </label>
                </div>
              ):(
                <>
                  <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",overflow:"hidden",marginBottom:12}}>
                    <div style={{display:"grid",gridTemplateColumns:"0.8fr 1fr 1fr 0.7fr 1.2fr 1fr 1.5fr 80px",padding:"8px 16px",borderBottom:"1px solid #252a3a"}}>
                      {["Ref","Tipología","Tipo/Adosado","m²","Precio PVP","Estado","Notas",""].map(h=><div key={h} style={{fontSize:"0.62rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>)}
                    </div>
                    {proj.viviendas.map((v,i)=>{
                      const vs=VIV_ESTADOS[v.estado]||VIV_ESTADOS.disponible;
                      return (
                        <div key={v.id} style={{display:"grid",gridTemplateColumns:"0.8fr 1fr 1fr 0.7fr 1.2fr 1fr 1.5fr 80px",padding:"10px 16px",borderBottom:i<proj.viviendas.length-1?"1px solid #1c2030":"none",alignItems:"center"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#1a1e2c"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{fontWeight:600,fontSize:"0.84rem"}}>{v.ref}</div>
                          <div style={{fontSize:"0.82rem"}}>{v.tipologia||"—"}</div>
                          <div style={{fontSize:"0.78rem",color:"#6b7394"}}>{v.planta||"—"}</div>
                          <div style={{fontSize:"0.78rem",color:"#6b7394"}}>{v.superficie?`${v.superficie} m²`:"—"}</div>
                          <div style={{fontSize:"0.88rem",fontWeight:700,color:"#e8eaf2"}}>{fmtEur(v.precio)}</div>
                          <div>
                            <span onClick={()=>cycleViv(v.id)} title="Click para cambiar estado"
                              style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 8px",borderRadius:8,background:`${vs.color}18`,color:vs.color,cursor:"pointer",border:`1px solid ${vs.color}35`,textTransform:"uppercase"}}>
                              {vs.label}
                            </span>
                          </div>
                          <div style={{fontSize:"0.72rem",color:"#6b7394",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={v.notas}>{v.notas||"—"}</div>
                          <div style={{display:"flex",gap:4}}>
                            <Btn onClick={()=>openEditV(v)} sm>✏️</Btn>
                            <Btn onClick={()=>delV(v.id)} v="danger" sm>✕</Btn>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"14px 18px",display:"flex",gap:28,flexWrap:"wrap"}}>
                    {[{l:"Precio medio",v:fmtEur(st.precioMedio)},{l:"Ingresos potenciales",v:fmtEur(st.ingresosTotal)},{l:"Ingresos asegurados (v+r)",v:fmtEur(st.ingresosVR),c:"#22d3a0"}].map(x=>(
                      <div key={x.l}><div style={{fontSize:"0.62rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{x.l}</div><div style={{fontWeight:700,color:x.c||"#e8eaf2"}}>{x.v}</div></div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── COMERCIAL ── */}
          {tab==="comercial"&&(
            <div>
              <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:18}}>Métricas comerciales</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:18}}>
                {[{label:"Total unidades",val:st.total||0},{label:"Vendidas",val:st.vendidas,color:"#22d3a0"},{label:"Reservadas",val:st.reservadas,color:"#f5c842"},{label:"Disponibles",val:st.disponibles,color:"#4f8ef7"},{label:"Precio medio",val:fmtEur(st.precioMedio)},{label:"% Vendido",val:`${pct}%`,color:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a"}].map(k=>(
                  <div key={k.label} style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"15px 18px"}}>
                    <div style={{fontSize:"0.63rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>{k.label}</div>
                    <div style={{fontSize:"1.45rem",fontWeight:800,color:k.color||"#e8eaf2"}}>{k.val}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 20px",marginBottom:13}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}><span style={{fontSize:"0.78rem",color:"#6b7394",fontWeight:500}}>Absorción total</span><span style={{fontSize:"0.92rem",fontWeight:800,color:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a"}}>{pct}%</span></div>
                <div style={{height:8,background:"#1c2030",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a",borderRadius:4}}/></div>
              </div>
              <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 20px"}}>
                <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:12}}>💶 Financiero</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[{l:"Ingresos potenciales",v:fmtEur(st.ingresosTotal)},{l:"Ingresos asegurados",v:fmtEur(st.ingresosVR)},{l:"Presupuesto",v:proj.presupuesto||"—"},{l:"Coste actual",v:proj.costeActual||"—"},{l:"Comercializadora",v:proj.comercializadora||"—"},{l:"Entrega prevista",v:fmt(proj.fechaEntrega)}].map(f=>(
                    <div key={f.l}><div style={{fontSize:"0.63rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{f.l}</div><div style={{fontSize:"0.88rem",fontWeight:600}}>{f.v}</div></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EQUIPO ── */}
          {tab==="equipo"&&(
            <div>
              <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:18}}>Estructura de equipo — {proj.name}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:16}}>
                {[{rol:"Project Owner (Overview)",persona:proj.projectOwner,desc:"Responsable global. Coordinación transversal, decisiones clave.",color:"#4f8ef7"},{rol:"PM Técnico (BSA)",persona:proj.pmTecnico,desc:"Proyecto, obra, licencias. Exclusivamente técnico.",color:"#22d3a0"},{rol:"Responsable Comercial",persona:proj.responsableComercial,desc:"Pricing, estrategia, posicionamiento, dirección comercializadora.",color:"#f5c842"},{rol:"Comercializadora",persona:proj.comercializadora||"Sin asignar",desc:"Ejecución ventas, atención leads, reporte semanal.",color:"#f5924e"}].map(r=>(
                  <div key={r.rol} style={{background:"#141720",borderRadius:12,border:`1px solid ${r.color}20`,padding:"17px 19px"}}>
                    <div style={{fontSize:"0.62rem",color:r.color,textTransform:"uppercase",letterSpacing:"0.09em",fontWeight:700,marginBottom:7}}>{r.rol}</div>
                    <div style={{fontWeight:700,fontSize:"0.98rem",marginBottom:7}}>{r.persona||"—"}</div>
                    <div style={{fontSize:"0.74rem",color:"#6b7394",lineHeight:1.55}}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ALERTAS ── */}
          {tab==="blockers"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:"0.92rem"}}>Alertas y bloqueos</div>
                <Btn onClick={openNewB} sm>+ Añadir</Btn>
              </div>
              {proj.blockers.length===0?<div style={{padding:"18px",color:"#22d3a0",fontSize:"0.86rem",background:"rgba(34,211,160,0.05)",borderRadius:12,border:"1px solid rgba(34,211,160,0.2)"}}>✅ Sin bloqueos activos</div>:proj.blockers.map((b,i)=>{
                const bs=BLOCK_ST[b.tipo]||BLOCK_ST.info;
                return <div key={i} style={{display:"flex",alignItems:"flex-start",gap:13,background:bs.bg,borderRadius:12,border:`1px solid ${bs.border}`,padding:"15px 18px",marginBottom:9}}>
                  <div style={{fontSize:"1.15rem",flexShrink:0,marginTop:2}}>{bs.icon}</div>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:4}}>{b.titulo}</div><div style={{fontSize:"0.77rem",color:"#6b7394",marginBottom:5}}>{b.desc}</div><div style={{fontSize:"0.71rem",color:"#6b7394"}}>Responsable: <span style={{color:"#e8eaf2"}}>{b.responsable}</span></div></div>
                  <div style={{display:"flex",gap:5}}><Btn onClick={()=>openEditB(b,i)} sm>✏️</Btn><Btn onClick={()=>delB(i)} v="danger" sm>✕</Btn></div>
                </div>;
              })}
            </div>
          )}

          {/* ── TAREAS ── */}
          {tab==="tareas"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:"0.92rem"}}>Tareas</div>
                <Btn onClick={openNewT} sm>+ Nueva tarea</Btn>
              </div>
              {proj.tareas.length===0&&<div style={{color:"#6b7394",fontSize:"0.84rem"}}>No hay tareas aún.</div>}
              {proj.tareas.map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:11,background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"11px 15px",marginBottom:7}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:PRIO_CLR[t.prioridad]||"#f5c842",flexShrink:0}}/>
                  <div onClick={()=>togT(t.id)} style={{width:17,height:17,borderRadius:5,border:`2px solid ${t.done?"#22d3a0":"#252a3a"}`,background:t.done?"#22d3a0":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.62rem",color:"#0d0f14",fontWeight:900,flexShrink:0}}>{t.done?"✓":""}</div>
                  <div style={{flex:1,fontSize:"0.83rem",textDecoration:t.done?"line-through":"none",color:t.done?"#6b7394":"#e8eaf2"}}>{t.texto}</div>
                  <div style={{fontSize:"0.71rem",padding:"2px 7px",borderRadius:8,background:"#1c2030",border:"1px solid #252a3a",color:"#6b7394",whiteSpace:"nowrap"}}>{t.responsable}</div>
                  <div style={{fontSize:"0.71rem",color:"#6b7394",whiteSpace:"nowrap"}}>{fmt(t.vencimiento)}</div>
                  <div style={{display:"flex",gap:5}}><Btn onClick={()=>openEditT(t)} sm>✏️</Btn><Btn onClick={()=>delT(t.id)} v="danger" sm>✕</Btn></div>
                </div>
              ))}
            </div>
          )}

          {/* ── REPORTE ── */}
          {tab==="reporte"&&(
            <div>
              <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:4}}>Reporte semanal — {proj.name}</div>
              <div style={{fontSize:"0.77rem",color:"#f5c842",marginBottom:18,padding:"8px 12px",background:"rgba(245,200,66,0.06)",borderRadius:8,border:"1px solid rgba(245,200,66,0.2)"}}>⚠️ Debe completarse por el Project Owner antes de cada reunión semanal</div>
              <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px",marginBottom:14}}>
                <div style={{fontSize:"0.7rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:9}}>Resumen ejecutivo de la semana</div>
                <textarea value={resumenLocal} onChange={e=>setResumenLocal(e.target.value)}
                  placeholder="¿Qué ha pasado esta semana? Avances, problemas, decisiones tomadas."
                  style={{...S,minHeight:100,resize:"vertical",lineHeight:1.6}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                  <div style={{fontSize:"0.7rem",color:"#6b7394"}}>Guardado: {proj.ultimaActualizacion?fmt(proj.ultimaActualizacion):"—"}</div>
                  <Btn onClick={saveResumen} v="primary" sm>💾 Guardar resumen</Btn>
                </div>
              </div>
              <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px"}}>
                <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:13}}>Checklist</div>
                {[
                  {label:"Viviendas cargadas",ok:st.total>0},
                  {label:"Hitos actualizados",ok:proj.hitos.some(h=>h.estado!=="pendiente")},
                  {label:"Resumen guardado (mín. 20 caracteres)",ok:(proj.resumenSemanal||"").length>20},
                  {label:"Tareas asignadas con responsable",ok:proj.tareas.length>0&&proj.tareas.every(t=>t.responsable)},
                ].map((item,i,arr)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #252a3a":"none"}}>
                    <div style={{width:20,height:20,borderRadius:6,background:item.ok?"rgba(34,211,160,0.12)":"rgba(240,90,90,0.08)",border:`1px solid ${item.ok?"#22d3a0":"#f05a5a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.68rem",color:item.ok?"#22d3a0":"#f05a5a",flexShrink:0}}>{item.ok?"✓":"✕"}</div>
                    <div style={{fontSize:"0.83rem",color:item.ok?"#e8eaf2":"#6b7394"}}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#0d0f14",color:"#e8eaf2",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 32px",borderBottom:"1px solid #252a3a",background:"#141720",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>setView("dashboard")}>
          <span style={{fontWeight:800,fontSize:"1.05rem",color:"#4f8ef7"}}>Overview</span>
          <div style={{width:1,height:16,background:"#252a3a"}}/>
          <span style={{fontSize:"0.73rem",color:"#6b7394"}}>Gestión de promociones inmobiliarias</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(34,211,160,0.08)",border:"1px solid rgba(34,211,160,0.25)",color:"#22d3a0",fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",padding:"4px 10px",borderRadius:20}}><div style={{width:5,height:5,background:"#22d3a0",borderRadius:"50%"}}/> En vivo</div>
          <div style={{fontSize:"0.76rem",color:"#6b7394",textTransform:"capitalize"}}>{today}</div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>{view==="dashboard"?<Dashboard/>:<Proyecto/>}</div>

      {/* ── MODAL PROYECTO ── */}
      {modal==="proj"&&<Modal title={editRef.current?"✏️ Editar promoción":"➕ Nueva promoción"} onClose={()=>setModal(null)} wide>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{gridColumn:"span 2"}}><FL label="Nombre de la promoción"><input style={S} value={pF.name} onChange={e=>pSet("name",e.target.value)} placeholder="Ej: RESIDENCIAL LAS PALMAS" autoFocus/></FL></div>
          <FL label="Ubicación"><input style={S} value={pF.ubicacion} onChange={e=>pSet("ubicacion",e.target.value)} placeholder="Ciudad, provincia"/></FL>
          <FL label="Zona"><select style={S} value={pF.zona} onChange={e=>pSet("zona",e.target.value)}>{["Sur","Norte","Canarias","Centro","Este","Oeste"].map(z=><option key={z}>{z}</option>)}</select></FL>
          <FL label="Estado"><select style={S} value={pF.estado} onChange={e=>pSet("estado",e.target.value)}>{Object.entries(ESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></FL>
          <FL label="Fecha entrega"><input type="date" style={S} value={pF.fechaEntrega} onChange={e=>pSet("fechaEntrega",e.target.value)}/></FL>
          <FL label="Project Owner"><select style={S} value={pF.projectOwner} onChange={e=>pSet("projectOwner",e.target.value)}><option value="">— Seleccionar —</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
          <FL label="PM Técnico (BSA)"><select style={S} value={pF.pmTecnico} onChange={e=>pSet("pmTecnico",e.target.value)}><option value="">— Seleccionar —</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
          <FL label="Responsable Comercial"><select style={S} value={pF.responsableComercial} onChange={e=>pSet("responsableComercial",e.target.value)}><option value="">— Seleccionar —</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
          <FL label="Comercializadora"><input style={S} value={pF.comercializadora} onChange={e=>pSet("comercializadora",e.target.value)} placeholder="Nombre empresa"/></FL>
          <FL label="Presupuesto"><input style={S} value={pF.presupuesto} onChange={e=>pSet("presupuesto",e.target.value)} placeholder="Ej: €5.2M"/></FL>
          <FL label="Coste actual"><input style={S} value={pF.costeActual} onChange={e=>pSet("costeActual",e.target.value)} placeholder="Ej: €4.8M"/></FL>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn onClick={saveP} v="primary">{editRef.current?"Guardar cambios":"Crear promoción"}</Btn></div>
      </Modal>}

      {/* ── MODAL HITO ── */}
      {modal==="hito"&&<Modal title="✏️ Editar hito" onClose={()=>setModal(null)}>
        <FL label="Nombre del hito"><input style={S} value={hF.nombre} onChange={e=>hSet("nombre",e.target.value)} autoFocus/></FL>
        <FL label="Estado"><select style={S} value={hF.estado} onChange={e=>hSet("estado",e.target.value)}><option value="pendiente">⭕ Pendiente</option><option value="en-curso">→ En curso</option><option value="completado">✓ Completado</option><option value="retrasado">⚠ Retrasado</option></select></FL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FL label="Fecha prevista"><input type="date" style={S} value={hF.fechaPrevista} onChange={e=>hSet("fechaPrevista",e.target.value)}/></FL>
          <FL label="Fecha real"><input type="date" style={S} value={hF.fechaReal} onChange={e=>hSet("fechaReal",e.target.value)}/></FL>
        </div>
        <FL label="Notas"><textarea style={{...S,minHeight:70,resize:"vertical"}} value={hF.notas} onChange={e=>hSet("notas",e.target.value)} placeholder="Dependencias, impacto, observaciones..."/></FL>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn onClick={saveH} v="primary">Guardar hito</Btn></div>
      </Modal>}

      {/* ── MODAL TAREA ── */}
      {modal==="tarea"&&<Modal title={editRef.current?"✏️ Editar tarea":"➕ Nueva tarea"} onClose={()=>setModal(null)}>
        <FL label="Descripción"><input style={S} value={tF.texto} onChange={e=>tSet("texto",e.target.value)} placeholder="¿Qué hay que hacer?" autoFocus/></FL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FL label="Responsable"><select style={S} value={tF.responsable} onChange={e=>tSet("responsable",e.target.value)}><option value="">— Seleccionar —</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
          <FL label="Prioridad"><select style={S} value={tF.prioridad} onChange={e=>tSet("prioridad",e.target.value)}><option value="alta">🔴 Alta</option><option value="media">🟡 Media</option><option value="baja">🟢 Baja</option></select></FL>
        </div>
        <FL label="Fecha límite"><input type="date" style={S} value={tF.vencimiento} onChange={e=>tSet("vencimiento",e.target.value)}/></FL>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn onClick={saveT} v="primary">{editRef.current?"Guardar":"Crear tarea"}</Btn></div>
      </Modal>}

      {/* ── MODAL BLOCKER ── */}
      {modal==="blocker"&&<Modal title="Alerta / Bloqueo" onClose={()=>setModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FL label="Tipo"><select style={S} value={bF.tipo} onChange={e=>bSet("tipo",e.target.value)}><option value="critico">🔴 Crítico</option><option value="aviso">⚠️ Aviso</option><option value="info">ℹ️ Info</option></select></FL>
          <FL label="Responsable"><select style={S} value={bF.responsable} onChange={e=>bSet("responsable",e.target.value)}><option value="">— Seleccionar —</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
        </div>
        <FL label="Título"><input style={S} value={bF.titulo} onChange={e=>bSet("titulo",e.target.value)} placeholder="Describe el bloqueo o riesgo" autoFocus/></FL>
        <FL label="Descripción e impacto"><textarea style={{...S,minHeight:75,resize:"vertical"}} value={bF.desc} onChange={e=>bSet("desc",e.target.value)} placeholder="Causa, impacto, acciones necesarias..."/></FL>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn onClick={saveB} v="primary">Guardar</Btn></div>
      </Modal>}

      {/* ── MODAL VIVIENDA ── */}
      {modal==="vivienda"&&<Modal title={editRef.current?"✏️ Editar vivienda":"➕ Nueva vivienda"} onClose={()=>setModal(null)}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FL label="Referencia"><input style={S} value={vF.ref} onChange={e=>vSet("ref",e.target.value)} placeholder="Ej: 01, A-01" autoFocus/></FL>
          <FL label="Tipología (dormitorios)"><input style={S} value={vF.tipologia} onChange={e=>vSet("tipologia",e.target.value)} placeholder="Ej: 3 dorm., 2D, Ático"/></FL>
          <FL label="Tipo / Adosado"><input style={S} value={vF.planta} onChange={e=>vSet("planta",e.target.value)} placeholder="Ej: esquina, paso, adosado"/></FL>
          <FL label="Superficie m² útil"><input type="number" style={S} value={vF.superficie} onChange={e=>vSet("superficie",e.target.value)}/></FL>
          <FL label="Precio PVP (€)"><input type="number" style={S} value={vF.precio} onChange={e=>vSet("precio",e.target.value)} placeholder="Ej: 599000"/></FL>
          <FL label="Estado"><select style={S} value={vF.estado} onChange={e=>vSet("estado",e.target.value)}><option value="disponible">Disponible</option><option value="reservada">Reservada</option><option value="vendida">Vendida</option><option value="no-venta">No venta</option></select></FL>
        </div>
        <FL label="Notas (orientación, vistas, jardín...)"><input style={S} value={vF.notas} onChange={e=>vSet("notas",e.target.value)} placeholder="Ej: Orient: n-e/s-o · Vistas mar · jardín 30m²"/></FL>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={()=>setModal(null)}>Cancelar</Btn><Btn onClick={saveV} v="primary">{editRef.current?"Guardar cambios":"Añadir vivienda"}</Btn></div>
      </Modal>}
    </div>
  );
}
