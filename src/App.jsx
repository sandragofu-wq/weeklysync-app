import { useState, useEffect } from "react";

const DEFAULT_HITOS = [
  "Demolición","Licencia parcelación","Licencia de obra",
  "Proyecto ejecución","Licitación","Construcción excavación",
  "Construcción civil","Construcción edificación","Licencia 1ª ocupación",
];

const DEFAULT_PROJECTS = [
  {
    id: 1, name: "ATABAL", zona: "Sur", estado: "en-marcha",
    projectOwner: "Sandra", pmTecnico: "Sara (BSA)", responsableComercial: "Sandra",
    comercializadora: "", ubicacion: "Málaga",
    totalUnidades: 42, unidadesVendidas: 18, unidadesReservadas: 4,
    precioMedio: 285000, presupuesto: "€8.2M", costeActual: "€7.9M",
    fechaEntrega: "2026-06-01",
    hitos: DEFAULT_HITOS.map((nombre, i) => ({ nombre, estado: i < 3 ? "completado" : i === 3 ? "en-curso" : "pendiente", fechaPrevista: "", fechaReal: "", notas: "" })),
    blockers: [{ tipo: "critico", titulo: "Licencia 1ª ocupación retrasada", desc: "Ayuntamiento solicita documentación adicional. Impacto en fecha entrega.", responsable: "Sara (BSA)" }],
    tareas: [
      { id: 1, texto: "Reunión con ayuntamiento - licencia ocupación", done: false, responsable: "Sara (BSA)", prioridad: "alta", vencimiento: "2025-06-10" },
      { id: 2, texto: "Actualizar BP con nueva fecha entrega", done: false, responsable: "Pilar", prioridad: "media", vencimiento: "2025-06-15" },
    ],
    resumenSemanal: "", ultimaActualizacion: "2025-06-02",
  },
  {
    id: 2, name: "MEDHILLS", zona: "Sur", estado: "en-riesgo",
    projectOwner: "Sandra", pmTecnico: "Inma (BSA)", responsableComercial: "Sandra",
    comercializadora: "Engel & Völkers", ubicacion: "Fuengirola",
    totalUnidades: 28, unidadesVendidas: 6, unidadesReservadas: 2,
    precioMedio: 320000, presupuesto: "€5.1M", costeActual: "€4.8M",
    fechaEntrega: "2027-03-01",
    hitos: DEFAULT_HITOS.map((nombre, i) => ({ nombre, estado: i < 2 ? "completado" : i === 2 ? "en-curso" : "pendiente", fechaPrevista: "", fechaReal: "", notas: "" })),
    blockers: [{ tipo: "aviso", titulo: "Ritmo de ventas por debajo del objetivo", desc: "Absorción 0.8 uds/mes vs objetivo 1.5. Revisar estrategia comercial.", responsable: "Sandra" }],
    tareas: [
      { id: 3, texto: "Revisar pricing tipologías B y C", done: false, responsable: "Sandra", prioridad: "alta", vencimiento: "2025-06-08" },
      { id: 4, texto: "Informe comparativa competencia zona", done: false, responsable: "Alberto", prioridad: "media", vencimiento: "2025-06-12" },
    ],
    resumenSemanal: "", ultimaActualizacion: "2025-06-01",
  },
  {
    id: 3, name: "ALMAYATE", zona: "Sur", estado: "planificacion",
    projectOwner: "Sandra", pmTecnico: "Sara (BSA)", responsableComercial: "Sandra",
    comercializadora: "", ubicacion: "Almayate, Málaga",
    totalUnidades: 35, unidadesVendidas: 0, unidadesReservadas: 0,
    precioMedio: 0, presupuesto: "€6.5M", costeActual: "€0",
    fechaEntrega: "2028-01-01",
    hitos: DEFAULT_HITOS.map(nombre => ({ nombre, estado: "pendiente", fechaPrevista: "", fechaReal: "", notas: "" })),
    blockers: [],
    tareas: [{ id: 5, texto: "Estudio de viabilidad fase 1", done: false, responsable: "Pilar", prioridad: "alta", vencimiento: "2025-07-01" }],
    resumenSemanal: "", ultimaActualizacion: "2025-05-20",
  },
];

const ESTADOS = {
  "en-marcha":    { label: "En marcha",    color: "#22d3a0", bg: "rgba(34,211,160,0.12)" },
  "en-riesgo":    { label: "En riesgo",    color: "#f5c842", bg: "rgba(245,200,66,0.12)" },
  "bloqueado":    { label: "Bloqueado",    color: "#f05a5a", bg: "rgba(240,90,90,0.12)" },
  "planificacion":{ label: "Planificación",color: "#4f8ef7", bg: "rgba(79,142,247,0.12)" },
  "entregado":    { label: "Entregado",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

const HITO_EST = {
  "completado": { color: "#22d3a0", bg: "rgba(34,211,160,0.12)", label: "✓" },
  "en-curso":   { color: "#4f8ef7", bg: "rgba(79,142,247,0.12)", label: "→" },
  "pendiente":  { color: "#4a5070", bg: "transparent",           label: "○" },
  "retrasado":  { color: "#f05a5a", bg: "rgba(240,90,90,0.12)",  label: "!" },
};

const BLOCK_ST = {
  critico: { bg: "rgba(240,90,90,0.10)", border: "rgba(240,90,90,0.3)", icon: "🔴" },
  aviso:   { bg: "rgba(245,200,66,0.10)", border: "rgba(245,200,66,0.3)", icon: "⚠️" },
  info:    { bg: "rgba(79,142,247,0.10)",  border: "rgba(79,142,247,0.3)",  icon: "ℹ️" },
};

const PRIO_CLR = { alta: "#f05a5a", media: "#f5c842", baja: "#22d3a0" };
const TEAM = ["Sandra","Alberto","Pilar","Mónica","María","Fran","Sara (BSA)","Dani (BSA)","Inma (BSA)"];

const INP = { width:"100%", background:"#1c2030", border:"1px solid #252a3a", borderRadius:8, padding:"8px 11px", color:"#e8eaf2", fontFamily:"inherit", fontSize:"0.84rem", outline:"none", boxSizing:"border-box" };

const fmt = (d) => { if(!d) return "—"; try { return new Date(d+"T00:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"}); } catch { return d; } };
const fmtEur = (n) => n ? new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n) : "—";

function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#141720",border:"1px solid #252a3a",borderRadius:16,padding:28,width:wide?700:520,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontWeight:800,fontSize:"1.05rem"}}>{title}</div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7394",fontSize:"1.3rem",cursor:"pointer"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function F({ label, children }) {
  return (
    <div style={{marginBottom:12}}>
      <div style={{fontSize:"0.7rem",color:"#6b7394",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
      {children}
    </div>
  );
}

function Btn({ onClick, children, v="ghost", sm }) {
  const S = {
    primary:{background:"#4f8ef7",color:"#fff",border:"none"},
    danger:{background:"transparent",color:"#f05a5a",border:"1px solid rgba(240,90,90,0.3)"},
    ghost:{background:"transparent",color:"#6b7394",border:"1px solid #252a3a"},
  };
  return <button onClick={onClick} style={{...S[v],borderRadius:8,padding:sm?"4px 10px":"7px 16px",cursor:"pointer",fontSize:sm?"0.73rem":"0.84rem",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>{children}</button>;
}

export default function Overview() {
  const [projects, setProjects] = useState(() => {
    try { const s=localStorage.getItem("overview_v3"); return s?JSON.parse(s):DEFAULT_PROJECTS; } catch { return DEFAULT_PROJECTS; }
  });
  const [view, setView] = useState("dashboard");
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState("hitos");
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const EP = {name:"",zona:"Sur",estado:"planificacion",projectOwner:"",pmTecnico:"",responsableComercial:"",comercializadora:"",ubicacion:"",totalUnidades:"",unidadesVendidas:0,unidadesReservadas:0,precioMedio:0,presupuesto:"",costeActual:"",fechaEntrega:"",resumenSemanal:""};
  const [pF, setPF] = useState(EP);
  const [tF, setTF] = useState({texto:"",responsable:"",prioridad:"media",vencimiento:""});
  const [bF, setBF] = useState({tipo:"aviso",titulo:"",desc:"",responsable:""});
  const [hIdx, setHIdx] = useState(null);
  const [hF, setHF] = useState({nombre:"",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""});
  const [newH, setNewH] = useState("");

  const proj = projects.find(p=>p.id===activeId);

  useEffect(()=>{ try{localStorage.setItem("overview_v3",JSON.stringify(projects));}catch{} },[projects]);

  const save = fn => setProjects(prev=>fn(prev));
  const upd = (id,fn) => save(prev=>prev.map(p=>p.id!==id?p:fn(p)));

  // Project
  const openNew = () => { setEditing(null); setPF(EP); setModal("proj"); };
  const openEdit = () => { setEditing(proj.id); setPF({...proj}); setModal("proj"); };
  const saveProj = () => {
    if(!pF.name.trim()) return;
    if(editing) { upd(editing,p=>({...p,...pF})); }
    else {
      const np={...pF,id:Date.now(),totalUnidades:Number(pF.totalUnidades)||0,unidadesVendidas:0,unidadesReservadas:0,precioMedio:0,
        hitos:DEFAULT_HITOS.map(n=>({nombre:n,estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""})),
        blockers:[],tareas:[],ultimaActualizacion:new Date().toISOString().split("T")[0]};
      save(prev=>[...prev,np]); setActiveId(np.id); setView("proyecto");
    }
    setModal(null);
  };
  const delProj = (id) => { if(!confirm("¿Eliminar esta promoción?")) return; save(prev=>prev.filter(p=>p.id!==id)); setView("dashboard"); setActiveId(null); };

  // Hitos
  const openEditH = (idx) => { setHIdx(idx); setHF({...proj.hitos[idx]}); setModal("hito"); };
  const saveH = () => { upd(activeId,p=>({...p,hitos:p.hitos.map((h,i)=>i!==hIdx?h:{...hF})})); setModal(null); };
  const addH = () => { if(!newH.trim()) return; upd(activeId,p=>({...p,hitos:[...p.hitos,{nombre:newH,estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""}]})); setNewH(""); };
  const delH = (idx) => upd(activeId,p=>({...p,hitos:p.hitos.filter((_,i)=>i!==idx)}));

  // Tareas
  const openNewT = () => { setEditing(null); setTF({texto:"",responsable:proj?.projectOwner||"",prioridad:"media",vencimiento:""}); setModal("tarea"); };
  const openEditT = (t) => { setEditing(t.id); setTF({texto:t.texto,responsable:t.responsable,prioridad:t.prioridad,vencimiento:t.vencimiento}); setModal("tarea"); };
  const saveT = () => {
    if(!tF.texto.trim()) return;
    if(editing) { upd(activeId,p=>({...p,tareas:p.tareas.map(t=>t.id!==editing?t:{...t,...tF})})); }
    else { upd(activeId,p=>({...p,tareas:[...p.tareas,{id:Date.now(),...tF,done:false}]})); }
    setModal(null);
  };
  const togT = (tid) => upd(activeId,p=>({...p,tareas:p.tareas.map(t=>t.id===tid?{...t,done:!t.done}:t)}));
  const delT = (tid) => upd(activeId,p=>({...p,tareas:p.tareas.filter(t=>t.id!==tid)}));

  // Blockers
  const openNewB = () => { setEditing(null); setBF({tipo:"aviso",titulo:"",desc:"",responsable:proj?.projectOwner||""}); setModal("blocker"); };
  const openEditB = (b,idx) => { setEditing(idx); setBF({...b}); setModal("blocker"); };
  const saveB = () => {
    if(!bF.titulo.trim()) return;
    if(editing!==null&&typeof editing==="number") { upd(activeId,p=>({...p,blockers:p.blockers.map((b,i)=>i!==editing?b:{...bF})})); }
    else { upd(activeId,p=>({...p,blockers:[...p.blockers,{...bF}]})); }
    setModal(null);
  };
  const delB = (idx) => upd(activeId,p=>({...p,blockers:p.blockers.filter((_,i)=>i!==idx)}));

  const saveResumen = (text) => upd(activeId,p=>({...p,resumenSemanal:text,ultimaActualizacion:new Date().toISOString().split("T")[0]}));

  const today = new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});

  // ── DASHBOARD ──
  const Dashboard = () => {
    const totalU = projects.reduce((a,p)=>a+(p.totalUnidades||0),0);
    const totalV = projects.reduce((a,p)=>a+(p.unidadesVendidas||0),0);
    const bloq = projects.filter(p=>p.estado==="bloqueado").length;
    const risk = projects.filter(p=>p.estado==="en-riesgo").length;
    return (
      <div style={{padding:"24px 32px",overflowY:"auto",flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div>
            <div style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.03em",marginBottom:3}}>Panel de promociones</div>
            <div style={{fontSize:"0.78rem",color:"#6b7394"}}>Vista consolidada de todos los proyectos activos</div>
          </div>
          <Btn onClick={openNew} v="primary">+ Nueva promoción</Btn>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:26}}>
          {[
            {label:"Promociones",val:projects.length,color:"#4f8ef7",sub:"activas"},
            {label:"Unidades totales",val:totalU,color:"#e8eaf2",sub:"en cartera"},
            {label:"Vendidas",val:`${totalV}/${totalU}`,color:"#22d3a0",sub:totalU?`${Math.round(totalV/totalU*100)}% absorción`:"—"},
            {label:"Alertas",val:bloq+risk,color:bloq>0?"#f05a5a":risk>0?"#f5c842":"#22d3a0",sub:`${bloq} bloqueados · ${risk} en riesgo`},
          ].map(k=>(
            <div key={k.label} style={{background:"#141720",borderRadius:14,border:"1px solid #252a3a",padding:"18px 22px"}}>
              <div style={{fontSize:"0.65rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.09em",fontWeight:700,marginBottom:8}}>{k.label}</div>
              <div style={{fontSize:"1.7rem",fontWeight:800,color:k.color,letterSpacing:"-0.03em",marginBottom:3}}>{k.val}</div>
              <div style={{fontSize:"0.72rem",color:"#6b7394"}}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div style={{background:"#141720",borderRadius:14,border:"1px solid #252a3a",overflow:"hidden"}}>
          <div style={{padding:"15px 22px",borderBottom:"1px solid #252a3a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontWeight:800,fontSize:"0.92rem"}}>📋 Todas las promociones</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 0.8fr 1fr 0.9fr 1.1fr 1.3fr 1fr 50px",padding:"9px 22px",borderBottom:"1px solid #1c2030"}}>
            {["Promoción","Zona","Estado","Hitos","Ventas","Project Owner","Última act.",""].map(h=>(
              <div key={h} style={{fontSize:"0.62rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</div>
            ))}
          </div>
          {projects.map((p,idx)=>{
            const est=ESTADOS[p.estado]||ESTADOS["planificacion"];
            const hOk=p.hitos.filter(h=>h.estado==="completado").length;
            const pct=p.totalUnidades?Math.round(p.unidadesVendidas/p.totalUnidades*100):0;
            return (
              <div key={p.id} onClick={()=>{setActiveId(p.id);setView("proyecto");setTab("hitos");}}
                style={{display:"grid",gridTemplateColumns:"2fr 0.8fr 1fr 0.9fr 1.1fr 1.3fr 1fr 50px",padding:"13px 22px",borderBottom:idx<projects.length-1?"1px solid #1c2030":"none",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1e2c"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div>
                  <div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:2}}>{p.name}</div>
                  <div style={{fontSize:"0.71rem",color:"#6b7394"}}>{p.ubicacion}</div>
                </div>
                <div style={{fontSize:"0.8rem",color:"#6b7394",alignSelf:"center"}}>{p.zona}</div>
                <div style={{alignSelf:"center"}}>
                  <span style={{fontSize:"0.65rem",fontWeight:700,padding:"3px 8px",borderRadius:8,background:est.bg,color:est.color,textTransform:"uppercase"}}>{est.label}</span>
                </div>
                <div style={{alignSelf:"center"}}>
                  <div style={{fontSize:"0.82rem",fontWeight:600,marginBottom:4}}>{hOk}/{p.hitos.length}</div>
                  <div style={{height:3,background:"#252a3a",borderRadius:2,width:50,overflow:"hidden"}}><div style={{height:"100%",width:`${p.hitos.length?(hOk/p.hitos.length*100):0}%`,background:"#4f8ef7",borderRadius:2}}/></div>
                </div>
                <div style={{alignSelf:"center"}}>
                  <div style={{fontSize:"0.82rem",fontWeight:600,color:pct>70?"#22d3a0":pct>40?"#f5c842":"#e8eaf2"}}>{pct}%</div>
                  <div style={{fontSize:"0.7rem",color:"#6b7394"}}>{p.unidadesVendidas}/{p.totalUnidades} uds</div>
                </div>
                <div style={{alignSelf:"center"}}>
                  <div style={{fontWeight:500,fontSize:"0.82rem"}}>{p.projectOwner||"—"}</div>
                  <div style={{fontSize:"0.7rem",color:"#6b7394"}}>{p.pmTecnico||"—"}</div>
                </div>
                <div style={{fontSize:"0.73rem",color:"#6b7394",alignSelf:"center"}}>
                  {p.ultimaActualizacion?fmt(p.ultimaActualizacion):"—"}
                  {p.blockers.length>0&&<div style={{color:"#f05a5a",fontSize:"0.67rem",marginTop:2}}>⚠ {p.blockers.length} alerta{p.blockers.length>1?"s":""}</div>}
                </div>
                <div style={{alignSelf:"center",textAlign:"right",color:"#6b7394",fontSize:"0.85rem"}}>→</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── PROYECTO ──
  const Proyecto = () => {
    if(!proj) return null;
    const est=ESTADOS[proj.estado]||ESTADOS["planificacion"];
    const pct=proj.totalUnidades?Math.round(proj.unidadesVendidas/proj.totalUnidades*100):0;
    const tabs=[
      {id:"hitos",label:"🏗 Hitos"},
      {id:"comercial",label:"📊 Comercial"},
      {id:"equipo",label:"👥 Equipo"},
      {id:"blockers",label:`🚧 Alertas${proj.blockers.length>0?` (${proj.blockers.length})`:""}` },
      {id:"tareas",label:`✅ Tareas${proj.tareas.filter(t=>!t.done).length>0?` (${proj.tareas.filter(t=>!t.done).length})`:""}` },
      {id:"reporte",label:"📝 Reporte"},
    ];
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"18px 32px 0",background:"#0d0f14",borderBottom:"1px solid #252a3a",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                <button onClick={()=>setView("dashboard")} style={{background:"none",border:"none",color:"#6b7394",cursor:"pointer",fontSize:"0.78rem",padding:0}}>← Volver</button>
                <h1 style={{margin:0,fontSize:"1.5rem",fontWeight:800,letterSpacing:"-0.03em"}}>{proj.name}</h1>
                <span style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 9px",borderRadius:8,background:est.bg,color:est.color,textTransform:"uppercase"}}>{est.label}</span>
                <span style={{fontSize:"0.73rem",color:"#6b7394"}}>{proj.ubicacion} · Zona {proj.zona}</span>
              </div>
              <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
                {[`👤 PO: ${proj.projectOwner||"—"}`,`🏗 PM: ${proj.pmTecnico||"—"}`,`💼 Comercial: ${proj.responsableComercial||"—"}`,`📅 Entrega: ${fmt(proj.fechaEntrega)}`].map(m=>(
                  <span key={m} style={{fontSize:"0.76rem",color:"#6b7394"}}>{m}</span>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={openEdit} sm>✏️ Editar</Btn>
              <Btn onClick={()=>delProj(proj.id)} v="danger" sm>Eliminar</Btn>
            </div>
          </div>

          {/* Mini KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
            {[
              {label:"Total uds",val:proj.totalUnidades||"—"},
              {label:"Vendidas",val:proj.unidadesVendidas,color:"#22d3a0"},
              {label:"Reservadas",val:proj.unidadesReservadas,color:"#f5c842"},
              {label:"Absorción",val:`${pct}%`,color:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a"},
              {label:"Precio medio",val:fmtEur(proj.precioMedio)},
            ].map(k=>(
              <div key={k.label} style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"10px 14px"}}>
                <div style={{fontSize:"0.6rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{k.label}</div>
                <div style={{fontSize:"1.1rem",fontWeight:800,color:k.color||"#e8eaf2"}}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:0,overflowX:"auto"}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?"#4f8ef7":"transparent"}`,color:tab===t.id?"#e8eaf2":"#6b7394",padding:"9px 15px",cursor:"pointer",fontSize:"0.8rem",fontWeight:tab===t.id?700:400,fontFamily:"inherit",whiteSpace:"nowrap"}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{flex:1,overflowY:"auto",padding:"22px 32px"}}>

          {/* HITOS */}
          {tab==="hitos"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:"0.92rem"}}>Hitos del proyecto <span style={{color:"#6b7394",fontWeight:400,fontSize:"0.78rem"}}> — click en ✏️ para editar estado y fechas</span></div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input value={newH} onChange={e=>setNewH(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addH()} placeholder="Nuevo hito..." style={{...INP,width:180}} />
                  <Btn onClick={addH} sm>+ Añadir</Btn>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {proj.hitos.map((h,idx)=>{
                  const hs=HITO_EST[h.estado]||HITO_EST["pendiente"];
                  return (
                    <div key={idx} style={{display:"flex",alignItems:"center",gap:12,background:"#141720",borderRadius:11,border:`1px solid ${h.estado==="retrasado"?"rgba(240,90,90,0.35)":h.estado==="en-curso"?"rgba(79,142,247,0.3)":"#252a3a"}`,padding:"13px 16px"}}>
                      <div style={{width:28,height:28,borderRadius:7,background:hs.bg,border:`1px solid ${hs.color}40`,display:"flex",alignItems:"center",justifyContent:"center",color:hs.color,fontWeight:800,fontSize:"0.85rem",flexShrink:0}}>{hs.label}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:"0.87rem",marginBottom:h.notas?3:0}}>{h.nombre}</div>
                        {h.notas&&<div style={{fontSize:"0.73rem",color:"#6b7394"}}>{h.notas}</div>}
                      </div>
                      <div style={{display:"flex",gap:12,alignItems:"center"}}>
                        {h.fechaPrevista&&<div style={{fontSize:"0.72rem",color:"#6b7394"}}>Prev: {fmt(h.fechaPrevista)}</div>}
                        {h.fechaReal&&<div style={{fontSize:"0.72rem",color:"#22d3a0"}}>Real: {fmt(h.fechaReal)}</div>}
                        <span style={{fontSize:"0.64rem",fontWeight:700,padding:"2px 7px",borderRadius:6,background:hs.bg,color:hs.color,textTransform:"uppercase"}}>{h.estado}</span>
                      </div>
                      <div style={{display:"flex",gap:5}}>
                        <Btn onClick={()=>openEditH(idx)} sm>✏️</Btn>
                        <Btn onClick={()=>delH(idx)} v="danger" sm>✕</Btn>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:14,marginTop:18,flexWrap:"wrap"}}>
                {Object.entries(HITO_EST).map(([k,v])=>(
                  <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:"0.71rem",color:v.color}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:v.color}}/> {k}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* COMERCIAL */}
          {tab==="comercial"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div style={{fontWeight:700,fontSize:"0.92rem"}}>Métricas comerciales</div>
                <Btn onClick={()=>{setPF({...proj});setModal("metricas");}} sm>✏️ Actualizar datos</Btn>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:18}}>
                {[
                  {label:"Total unidades",val:proj.totalUnidades||0},
                  {label:"Vendidas",val:proj.unidadesVendidas||0,color:"#22d3a0"},
                  {label:"Reservadas",val:proj.unidadesReservadas||0,color:"#f5c842"},
                  {label:"Disponibles",val:Math.max(0,(proj.totalUnidades||0)-(proj.unidadesVendidas||0)-(proj.unidadesReservadas||0)),color:"#4f8ef7"},
                  {label:"Precio medio",val:fmtEur(proj.precioMedio)},
                  {label:"% Vendido",val:`${pct}%`,color:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a"},
                ].map(k=>(
                  <div key={k.label} style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"15px 18px"}}>
                    <div style={{fontSize:"0.63rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>{k.label}</div>
                    <div style={{fontSize:"1.45rem",fontWeight:800,color:k.color||"#e8eaf2"}}>{k.val}</div>
                  </div>
                ))}
              </div>
              {/* Barra */}
              <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 20px",marginBottom:13}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
                  <span style={{fontSize:"0.78rem",color:"#6b7394",fontWeight:500}}>Absorción total</span>
                  <span style={{fontSize:"0.92rem",fontWeight:800,color:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a"}}>{pct}%</span>
                </div>
                <div style={{height:8,background:"#1c2030",borderRadius:4,overflow:"hidden",marginBottom:8}}>
                  <div style={{height:"100%",width:`${pct}%`,background:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a",borderRadius:4,transition:"width 0.4s"}}/>
                </div>
                <div style={{display:"flex",gap:14}}>
                  {[{c:"#22d3a0",l:"Vendidas"},{c:"#f5c842",l:"Reservadas"},{c:"#252a3a",l:"Disponibles"}].map(x=>(
                    <div key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:"0.71rem",color:"#6b7394"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:x.c}}/> {x.l}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 20px"}}>
                <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:12}}>💶 Control económico</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[{l:"Presupuesto",v:proj.presupuesto||"—"},{l:"Coste actual",v:proj.costeActual||"—"},{l:"Comercializadora",v:proj.comercializadora||"—"},{l:"Fecha entrega",v:fmt(proj.fechaEntrega)}].map(f=>(
                    <div key={f.l}>
                      <div style={{fontSize:"0.63rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{f.l}</div>
                      <div style={{fontSize:"0.88rem",fontWeight:600}}>{f.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EQUIPO */}
          {tab==="equipo"&&(
            <div>
              <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:18}}>Estructura de equipo — {proj.name}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:16}}>
                {[
                  {rol:"Project Owner (Overview)",persona:proj.projectOwner,desc:"Responsable global. Coordinación transversal, decisiones clave, reporting a Dirección.",color:"#4f8ef7"},
                  {rol:"PM Técnico (BSA)",persona:proj.pmTecnico,desc:"Proyecto, obra, licencias, ingenierías. Exclusivamente técnico.",color:"#22d3a0"},
                  {rol:"Responsable Comercial",persona:proj.responsableComercial,desc:"Pricing, estrategia de ventas, posicionamiento, dirección de comercializadora.",color:"#f5c842"},
                  {rol:"Comercializadora",persona:proj.comercializadora||"Sin asignar",desc:"Ejecución de ventas, atención a leads, reporte semanal de actividad.",color:"#f5924e"},
                ].map(r=>(
                  <div key={r.rol} style={{background:"#141720",borderRadius:12,border:`1px solid ${r.color}20`,padding:"17px 19px"}}>
                    <div style={{fontSize:"0.62rem",color:r.color,textTransform:"uppercase",letterSpacing:"0.09em",fontWeight:700,marginBottom:7}}>{r.rol}</div>
                    <div style={{fontWeight:700,fontSize:"0.98rem",marginBottom:7}}>{r.persona||"—"}</div>
                    <div style={{fontSize:"0.74rem",color:"#6b7394",lineHeight:1.55}}>{r.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"17px 20px"}}>
                <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:12}}>Jerarquía de reporting</div>
                <div style={{fontSize:"0.8rem",color:"#6b7394",lineHeight:2.2,fontFamily:"'Courier New', monospace"}}>
                  <div style={{color:"#e8eaf2",fontWeight:700}}>Director General (Alberto Muñoz)</div>
                  <div style={{paddingLeft:20}}>↓</div>
                  <div style={{paddingLeft:20,color:"#4f8ef7",fontWeight:700}}>Project Owner → {proj.projectOwner||"—"}</div>
                  <div style={{paddingLeft:40}}>↓</div>
                  <div style={{paddingLeft:40,display:"flex",gap:28,flexWrap:"wrap"}}>
                    <span style={{color:"#f5c842"}}>Comercial ({proj.responsableComercial||"—"})</span>
                    <span style={{color:"#22d3a0"}}>PM Técnico ({proj.pmTecnico||"—"})</span>
                    <span style={{color:"#a78bfa"}}>Financiero (Pilar)</span>
                  </div>
                  {proj.comercializadora&&<div style={{paddingLeft:60,color:"#f5924e"}}>↳ Comercializadora ({proj.comercializadora})</div>}
                </div>
              </div>
            </div>
          )}

          {/* BLOCKERS */}
          {tab==="blockers"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:"0.92rem"}}>Alertas, bloqueos y riesgos</div>
                <Btn onClick={openNewB} sm>+ Añadir alerta</Btn>
              </div>
              {proj.blockers.length===0?(
                <div style={{padding:"18px",color:"#22d3a0",fontSize:"0.86rem",background:"rgba(34,211,160,0.05)",borderRadius:12,border:"1px solid rgba(34,211,160,0.2)"}}>✅ Sin bloqueos ni alertas activas</div>
              ):proj.blockers.map((b,i)=>{
                const bs=BLOCK_ST[b.tipo]||BLOCK_ST.info;
                return (
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:13,background:bs.bg,borderRadius:12,border:`1px solid ${bs.border}`,padding:"15px 18px",marginBottom:9}}>
                    <div style={{fontSize:"1.15rem",flexShrink:0,marginTop:2}}>{bs.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:4}}>{b.titulo}</div>
                      <div style={{fontSize:"0.77rem",color:"#6b7394",marginBottom:5}}>{b.desc}</div>
                      <div style={{fontSize:"0.71rem",color:"#6b7394"}}>Responsable: <span style={{color:"#e8eaf2"}}>{b.responsable}</span></div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <Btn onClick={()=>openEditB(b,i)} sm>✏️</Btn>
                      <Btn onClick={()=>delB(i)} v="danger" sm>✕</Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAREAS */}
          {tab==="tareas"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{fontWeight:700,fontSize:"0.92rem"}}>Tareas del proyecto</div>
                <Btn onClick={openNewT} sm>+ Nueva tarea</Btn>
              </div>
              {proj.tareas.length===0&&<div style={{color:"#6b7394",fontSize:"0.84rem"}}>No hay tareas. Añade la primera.</div>}
              {proj.tareas.map((t,i)=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:11,background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"11px 15px",marginBottom:7}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:PRIO_CLR[t.prioridad]||"#f5c842",flexShrink:0}}/>
                  <div onClick={()=>togT(t.id)} style={{width:17,height:17,borderRadius:5,border:`2px solid ${t.done?"#22d3a0":"#252a3a"}`,background:t.done?"#22d3a0":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.62rem",color:"#0d0f14",fontWeight:900,flexShrink:0}}>{t.done?"✓":""}</div>
                  <div style={{flex:1,fontSize:"0.83rem",textDecoration:t.done?"line-through":"none",color:t.done?"#6b7394":"#e8eaf2"}}>{t.texto}</div>
                  <div style={{fontSize:"0.71rem",padding:"2px 7px",borderRadius:8,background:"#1c2030",border:"1px solid #252a3a",color:"#6b7394",whiteSpace:"nowrap"}}>{t.responsable}</div>
                  <div style={{fontSize:"0.71rem",color:"#6b7394",whiteSpace:"nowrap"}}>{fmt(t.vencimiento)}</div>
                  <div style={{display:"flex",gap:5}}>
                    <Btn onClick={()=>openEditT(t)} sm>✏️</Btn>
                    <Btn onClick={()=>delT(t.id)} v="danger" sm>✕</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REPORTE */}
          {tab==="reporte"&&(
            <div>
              <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:4}}>Reporte semanal — {proj.name}</div>
              <div style={{fontSize:"0.77rem",color:"#f5c842",marginBottom:18,padding:"8px 12px",background:"rgba(245,200,66,0.06)",borderRadius:8,border:"1px solid rgba(245,200,66,0.2)"}}>
                ⚠️ Este reporte debe completarse por el Project Owner antes de cada reunión semanal
              </div>
              <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px",marginBottom:14}}>
                <div style={{fontSize:"0.7rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:9}}>Resumen ejecutivo de la semana</div>
                <textarea value={proj.resumenSemanal||""} onChange={e=>saveResumen(e.target.value)}
                  placeholder="¿Qué ha pasado esta semana? Avances, problemas, decisiones tomadas. Máx. 5 líneas."
                  style={{...INP,minHeight:95,resize:"vertical",lineHeight:1.6}}/>
                <div style={{marginTop:7,fontSize:"0.7rem",color:"#6b7394"}}>Última actualización: {proj.ultimaActualizacion?fmt(proj.ultimaActualizacion):"—"}</div>
              </div>
              <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px"}}>
                <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:13}}>Checklist de reporte completo</div>
                {[
                  {label:"Estado comercial actualizado",ok:proj.unidadesVendidas>0||proj.totalUnidades>0},
                  {label:"Hitos revisados y actualizados",ok:proj.hitos.some(h=>h.estado!=="pendiente")},
                  {label:"Alertas y bloqueos documentados",ok:true},
                  {label:"Resumen ejecutivo completado (mín. 20 caracteres)",ok:(proj.resumenSemanal||"").length>20},
                  {label:"Tareas asignadas con responsable claro",ok:proj.tareas.length>0&&proj.tareas.every(t=>t.responsable)},
                ].map((item,i,arr)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #252a3a":"none"}}>
                    <div style={{width:20,height:20,borderRadius:6,background:item.ok?"rgba(34,211,160,0.12)":"rgba(240,90,90,0.08)",border:`1px solid ${item.ok?"#22d3a0":"#f05a5a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.68rem",color:item.ok?"#22d3a0":"#f05a5a",flexShrink:0}}>
                      {item.ok?"✓":"✕"}
                    </div>
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
      {/* HEADER */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 32px",borderBottom:"1px solid #252a3a",background:"#141720",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>setView("dashboard")}>
          <div style={{fontWeight:800,fontSize:"1.05rem",letterSpacing:"-0.02em"}}><span style={{color:"#4f8ef7"}}>Overview</span></div>
          <div style={{width:1,height:16,background:"#252a3a"}}/>
          <div style={{fontSize:"0.73rem",color:"#6b7394"}}>Gestión de promociones inmobiliarias</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(34,211,160,0.08)",border:"1px solid rgba(34,211,160,0.25)",color:"#22d3a0",fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",padding:"4px 10px",borderRadius:20}}>
            <div style={{width:5,height:5,background:"#22d3a0",borderRadius:"50%"}}/> En vivo
          </div>
          <div style={{fontSize:"0.76rem",color:"#6b7394",textTransform:"capitalize"}}>{today}</div>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {view==="dashboard"?<Dashboard/>:<Proyecto/>}
      </div>

      {/* MODAL PROYECTO */}
      {modal==="proj"&&(
        <Modal title={editing?"✏️ Editar promoción":"➕ Nueva promoción"} onClose={()=>setModal(null)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <F label="Nombre de la promoción"><input style={{...INP,gridColumn:"span 2"}} value={pF.name} onChange={e=>setPF(p=>({...p,name:e.target.value}))} placeholder="Ej: RESIDENCIAL LAS PALMAS"/></F>
            <F label="Ubicación"><input style={INP} value={pF.ubicacion} onChange={e=>setPF(p=>({...p,ubicacion:e.target.value}))} placeholder="Ciudad, provincia"/></F>
            <F label="Zona"><select style={INP} value={pF.zona} onChange={e=>setPF(p=>({...p,zona:e.target.value}))}>{["Sur","Norte","Canarias","Centro","Este","Oeste"].map(z=><option key={z}>{z}</option>)}</select></F>
            <F label="Estado"><select style={INP} value={pF.estado} onChange={e=>setPF(p=>({...p,estado:e.target.value}))}>{Object.entries(ESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></F>
            <F label="Total unidades"><input type="number" style={INP} value={pF.totalUnidades} onChange={e=>setPF(p=>({...p,totalUnidades:e.target.value}))}/></F>
            <F label="Project Owner"><select style={INP} value={pF.projectOwner} onChange={e=>setPF(p=>({...p,projectOwner:e.target.value}))}><option value="">— Seleccionar —</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></F>
            <F label="PM Técnico (BSA)"><select style={INP} value={pF.pmTecnico} onChange={e=>setPF(p=>({...p,pmTecnico:e.target.value}))}><option value="">— Seleccionar —</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></F>
            <F label="Responsable Comercial"><select style={INP} value={pF.responsableComercial} onChange={e=>setPF(p=>({...p,responsableComercial:e.target.value}))}><option value="">— Seleccionar —</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></F>
            <F label="Comercializadora"><input style={INP} value={pF.comercializadora} onChange={e=>setPF(p=>({...p,comercializadora:e.target.value}))} placeholder="Nombre empresa"/></F>
            <F label="Fecha entrega prevista"><input type="date" style={INP} value={pF.fechaEntrega} onChange={e=>setPF(p=>({...p,fechaEntrega:e.target.value}))}/></F>
            <F label="Presupuesto"><input style={INP} value={pF.presupuesto} onChange={e=>setPF(p=>({...p,presupuesto:e.target.value}))} placeholder="Ej: €5.2M"/></F>
            <F label="Coste actual"><input style={INP} value={pF.costeActual} onChange={e=>setPF(p=>({...p,costeActual:e.target.value}))} placeholder="Ej: €4.8M"/></F>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}>
            <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveProj} v="primary">{editing?"Guardar cambios":"Crear promoción"}</Btn>
          </div>
        </Modal>
      )}

      {/* MODAL HITO */}
      {modal==="hito"&&(
        <Modal title="✏️ Editar hito" onClose={()=>setModal(null)}>
          <F label="Nombre del hito"><input style={INP} value={hF.nombre} onChange={e=>setHF(h=>({...h,nombre:e.target.value}))}/></F>
          <F label="Estado">
            <select style={INP} value={hF.estado} onChange={e=>setHF(h=>({...h,estado:e.target.value}))}>
              <option value="pendiente">⭕ Pendiente</option>
              <option value="en-curso">→ En curso</option>
              <option value="completado">✓ Completado</option>
              <option value="retrasado">⚠ Retrasado</option>
            </select>
          </F>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <F label="Fecha prevista"><input type="date" style={INP} value={hF.fechaPrevista} onChange={e=>setHF(h=>({...h,fechaPrevista:e.target.value}))}/></F>
            <F label="Fecha real (si completado)"><input type="date" style={INP} value={hF.fechaReal} onChange={e=>setHF(h=>({...h,fechaReal:e.target.value}))}/></F>
          </div>
          <F label="Notas / Observaciones"><textarea style={{...INP,minHeight:70,resize:"vertical"}} value={hF.notas} onChange={e=>setHF(h=>({...h,notas:e.target.value}))} placeholder="Dependencias, impacto, observaciones..."/></F>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
            <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveH} v="primary">Guardar hito</Btn>
          </div>
        </Modal>
      )}

      {/* MODAL TAREA */}
      {modal==="tarea"&&(
        <Modal title={editing?"✏️ Editar tarea":"➕ Nueva tarea"} onClose={()=>setModal(null)}>
          <F label="Descripción"><input style={INP} value={tF.texto} onChange={e=>setTF(t=>({...t,texto:e.target.value}))} placeholder="¿Qué hay que hacer?"/></F>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <F label="Responsable"><select style={INP} value={tF.responsable} onChange={e=>setTF(t=>({...t,responsable:e.target.value}))}><option value="">— Seleccionar —</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></F>
            <F label="Prioridad"><select style={INP} value={tF.prioridad} onChange={e=>setTF(t=>({...t,prioridad:e.target.value}))}><option value="alta">🔴 Alta</option><option value="media">🟡 Media</option><option value="baja">🟢 Baja</option></select></F>
          </div>
          <F label="Fecha límite"><input type="date" style={INP} value={tF.vencimiento} onChange={e=>setTF(t=>({...t,vencimiento:e.target.value}))}/></F>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
            <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveT} v="primary">{editing?"Guardar":"Crear tarea"}</Btn>
          </div>
        </Modal>
      )}

      {/* MODAL BLOCKER */}
      {modal==="blocker"&&(
        <Modal title={editing!==null?"✏️ Editar alerta":"➕ Nueva alerta"} onClose={()=>setModal(null)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <F label="Tipo"><select style={INP} value={bF.tipo} onChange={e=>setBF(b=>({...b,tipo:e.target.value}))}><option value="critico">🔴 Crítico</option><option value="aviso">⚠️ Aviso</option><option value="info">ℹ️ Info</option></select></F>
            <F label="Responsable"><select style={INP} value={bF.responsable} onChange={e=>setBF(b=>({...b,responsable:e.target.value}))}><option value="">— Seleccionar —</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></F>
          </div>
          <F label="Título"><input style={INP} value={bF.titulo} onChange={e=>setBF(b=>({...b,titulo:e.target.value}))} placeholder="Describe el bloqueo o riesgo"/></F>
          <F label="Descripción y impacto"><textarea style={{...INP,minHeight:75,resize:"vertical"}} value={bF.desc} onChange={e=>setBF(b=>({...b,desc:e.target.value}))} placeholder="Causa, impacto, acciones necesarias..."/></F>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
            <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveB} v="primary">{editing!==null?"Guardar":"Crear alerta"}</Btn>
          </div>
        </Modal>
      )}

      {/* MODAL MÉTRICAS */}
      {modal==="metricas"&&(
        <Modal title="📊 Actualizar métricas comerciales" onClose={()=>setModal(null)}>
          {[
            {label:"Unidades vendidas",key:"unidadesVendidas",type:"number"},
            {label:"Unidades reservadas",key:"unidadesReservadas",type:"number"},
            {label:"Precio medio (€)",key:"precioMedio",type:"number"},
            {label:"Presupuesto total",key:"presupuesto",type:"text"},
            {label:"Coste actual",key:"costeActual",type:"text"},
          ].map(f=>(
            <F key={f.key} label={f.label}>
              <input type={f.type} style={INP} value={pF[f.key]??proj[f.key]} onChange={e=>setPF(p=>({...p,[f.key]:f.type==="number"?Number(e.target.value):e.target.value}))}/>
            </F>
          ))}
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
            <Btn onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn v="primary" onClick={()=>{
              upd(activeId,p=>({...p,
                unidadesVendidas:Number(pF.unidadesVendidas??p.unidadesVendidas),
                unidadesReservadas:Number(pF.unidadesReservadas??p.unidadesReservadas),
                precioMedio:Number(pF.precioMedio??p.precioMedio),
                presupuesto:pF.presupuesto??p.presupuesto,
                costeActual:pF.costeActual??p.costeActual,
              }));
              setModal(null);
            }}>Guardar métricas</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
