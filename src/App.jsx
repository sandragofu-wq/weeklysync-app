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
const CSS = { inp:{ width:"100%", background:"#1c2030", border:"1px solid #252a3a", borderRadius:8, padding:"8px 11px", color:"#e8eaf2", fontFamily:"inherit", fontSize:"0.84rem", outline:"none", boxSizing:"border-box" } };

const DEFAULT_PROJECTS = [
  {
    id:1, name:"ATABAL", zona:"Sur", estado:"en-marcha",
    projectOwner:"Sandra", pmTecnico:"Sara (BSA)", responsableComercial:"Sandra",
    comercializadora:"", ubicacion:"Málaga", presupuesto:"€43.1M", costeActual:"€41.0M", fechaEntrega:"2029-01-09",
    hitos:DEFAULT_HITOS.map((n,i)=>({nombre:n,estado:i<3?"completado":i===3?"en-curso":"pendiente",fechaPrevista:"",fechaReal:"",notas:""})),
    blockers:[], tareas:[], viviendas:[], bp:null, resumenSemanal:"", ultimaActualizacion:"2025-06-02",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = d => { if(!d) return "—"; try { return new Date(d+"T00:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"}); } catch { return d; } };
const fmtEur = n => { const v=Number(n); if(!v&&v!==0) return "—"; return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(v); };
const fmtEurM = n => { const v=Number(n); if(!v) return "—"; if(Math.abs(v)>=1000000) return `€${(v/1000000).toFixed(2)}M`; if(Math.abs(v)>=1000) return `€${(v/1000).toFixed(0)}K`; return fmtEur(v); };
const fmtPct = n => { const v=Number(n); if(!v&&v!==0) return "—"; return `${(v*100).toFixed(1)}%`; };
const fmtNum = n => new Intl.NumberFormat("es-ES").format(Number(n)||0);
const calcStats = (vv=[]) => {
  const total=vv.length, vendidas=vv.filter(v=>v.estado==="vendida").length,
    reservadas=vv.filter(v=>v.estado==="reservada").length, disponibles=vv.filter(v=>v.estado==="disponible").length;
  const cp=vv.filter(v=>Number(v.precio)>0);
  const precioMedio=cp.length?Math.round(cp.reduce((a,v)=>a+Number(v.precio),0)/cp.length):0;
  const ingresosTotal=vv.reduce((a,v)=>a+Number(v.precio||0),0);
  const ingresosVR=vv.filter(v=>v.estado==="vendida"||v.estado==="reservada").reduce((a,v)=>a+Number(v.precio||0),0);
  return {total,vendidas,reservadas,disponibles,precioMedio,ingresosTotal,ingresosVR};
};
const parsePrice = raw => {
  if(!raw&&raw!==0) return 0;
  if(typeof raw==="number") return Math.round(raw);
  const s=String(raw).replace(/[€$£\s]/g,"");
  if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return parseInt(s.replace(/\./g,""),10);
  if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return parseInt(s.replace(/,/g,""),10);
  return parseInt(s.replace(/[,.].*$/,""),10)||0;
};
const excelDateToISO = n => {
  if(!n) return "";
  if(typeof n==="string" && n.includes("-")) return n.substring(0,10);
  if(n instanceof Date) return n.toISOString().substring(0,10);
  if(typeof n==="number" && n>40000) {
    const d=new Date(Math.round((n-25569)*86400*1000));
    return d.toISOString().substring(0,10);
  }
  return "";
};

// ─── BP IMPORTER ──────────────────────────────────────────────────────────────
const parseBP = wb => {
  const result = { ok:false, error:"", data:{} };
  try {
    const X = window.XLSX;
    const sheetRows = name => {
      const ws = wb.Sheets[name];
      if(!ws) return [];
      return X.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});
    };
    const n = (r,c) => { try { return Number(r[c])||0; } catch { return 0; } };
    const t = (r,c) => { try { return String(r[c]||"").trim(); } catch { return ""; } };

    // ── 1. MONITORING sheet ──
    // CONFIRMED layout from file:
    //   col 4  = label (Parcela, Localidad, Número de Viviendas, Edificabilidad)
    //   col 15 = value for col4 labels
    //   col 32 = calendar label (Fecha inicio obra, escritura, etc.) OR BP Base value
    //   col 37 = BP Actual value
    //   col 5  = P&L labels (VENTAS, COMPRA SUELO, SOFT COST, TOTAL GASTOS, etc.)
    //   col 3  = KPI labels (Fondos Propios, Beneficio, MgV, TIR, etc.)
    // Calendar rows: col32=label text, col41=meses, col42=date
    const mon = sheetRows("Monitoring");
    const fin = {};
    for(let i=0;i<mon.length;i++){
      const r=mon[i];
      if(!r||r.length<10) continue;

      const t4=t(r,4), t5=t(r,5), t3=t(r,3), t32=t(r,32);

      // Basic project info — col4=label, col15=value
      if(t4==="Parcela")              fin.nombre        = t(r,15);
      if(t4==="Localidad")            fin.localidad     = t(r,15);
      if(t4==="Número de Viviendas")  fin.numViviendas  = n(r,15);
      if(t4==="Edificabilidad")       fin.edificabilidad= n(r,15);

      // Calendar — col32=label, col41=duration, col42=date
      if(t32.includes("inicio de obra"))   fin.fechaInicioObra = excelDateToISO(r[42]);
      if(t32.includes("Obtención licencia"))fin.fechaLicencia   = excelDateToISO(r[42]);
      if(t32.includes("escritura"))         fin.fechaEntrega    = excelDateToISO(r[42]);
      if(t32.includes("Duración de obra"))  fin.duracionObra    = n(r,41);
      if(t32.includes("Meses ejecución")||t32.includes("Duración total")) fin.duracionMeses = n(r,37)||n(r,32);

      // P&L — col5=label, col32=BP Base, col37=BP Actual
      if(t5==="VENTAS")                          { fin.ventasPrev=n(r,32);      fin.ventasActual=n(r,37); }
      if(t5==="COMPRA SUELO")                    { fin.sueloPrev=n(r,32);       fin.sueloActual=n(r,37); }
      if(t5==="SOFT COST")                       { fin.softPrev=n(r,32);        fin.softActual=n(r,37); }
      if(t5.includes("COSTES CONSTRUCCIÓN")||t5.includes("HARD COST")) { fin.hardPrev=n(r,32); fin.hardActual=n(r,37); }
      if(t5==="GASTOS FINANCIEROS")              { fin.financieroPrev=n(r,32);  fin.financieroActual=n(r,37); }
      if(t5.includes("COMERCIALIZACIÓN"))        { fin.comercialPrev=n(r,32);   fin.comercialActual=n(r,37); }
      if(t5==="GASTOS BANCARIOS Y AVALES")       { fin.avalesPrev=n(r,32);      fin.avalesActual=n(r,37); }
      if(t5==="POSTVENTA")                       { fin.postventaPrev=n(r,32);   fin.postventaActual=n(r,37); }
      if(t5==="TOTAL GASTOS")                    { fin.totalGastosPrev=n(r,32); fin.totalGastosActual=n(r,37); }
      if(t5==="RESULTADO PLAN VIABILIDAD")       { fin.beneficioPrev=n(r,32);   fin.beneficioActual=n(r,37); }

      // KPIs — col3=label, col32=BP Base, col37=Actual
      if(t3.includes("Fondos Propios aportados"))   { fin.fondosPropiosPrev=n(r,32); fin.fondosPropios=n(r,37); }
      if(t3.includes("Beneficio de la p"))           { fin.beneficioPrev=n(r,32);     fin.beneficioActual=n(r,37); }
      if(t3.includes("Beneficio / Fondos"))          { fin.roePrev=n(r,32);           fin.roeActual=n(r,37); }
      if(t3.includes("Margen Bruto"))                { fin.mgbPrev=n(r,32);           fin.mgbActual=n(r,37); }
      if(t3.includes("Margen Neto"))                 { fin.mgnPrev=n(r,32);           fin.mgnActual=n(r,37); }
      if(t3.includes("MgV"))                         { fin.mgvPrev=n(r,32);           fin.mgvActual=n(r,37); }
      if(t3==="TIR (pretax)")                        { fin.tirPrev=n(r,32);           fin.tirActual=n(r,37); }
      if(t3.includes("Mom"))                         { fin.momPrev=n(r,32);           fin.momActual=n(r,37); }
      if(t3.includes("REI"))                         { fin.reiPrev=n(r,32);           fin.reiActual=n(r,37); }
      if(t3.includes("RRP"))                         { fin.rrpPrev=n(r,32);           fin.rrpActual=n(r,37); }
    }

    // MgV from Monitoring is stored as ratio (e.g. 0.178), convert to display
    // TIR also as ratio
    // Beneficio/Fondos = multiple (e.g. 1.43x)

    // ── 2. Lista_Precios sheet ──
    // Row 0-2 = headers/info, rows 3+ = data
    // col0=tipo(VIV/PA), col1=num_ref, col2=status, col3=precio_origen, cols4..N=repricings
    const lp = sheetRows("Lista_Precios");
    const viviendas = [];
    const estadoMap = {
      "reservado":"reservada","reservada":"reservada",
      "libre":"disponible","disponible":"disponible",
      "vendido":"vendida","vendida":"vendida",
      "bloqueado promotor":"no-venta","bloqueado promotor ":"no-venta","bloqueado":"no-venta",
    };
    for(let i=0;i<lp.length;i++){
      const r=lp[i];
      if(!r||r[0]==null) continue;
      const tipo = String(r[0]||"").trim().toUpperCase();
      if(tipo!=="VIV"&&tipo!=="PA") continue;
      const ref = String(r[1]||"").trim();
      if(!ref||isNaN(Number(ref))) continue;
      const status = String(r[2]||"").trim().toLowerCase();
      const precioOrigen = Number(r[3])||0;
      if(!precioOrigen) continue;
      // Last non-null/non-zero price = most recent repricing
      let precioActual = precioOrigen;
      for(let c=4;c<r.length;c++){
        if(r[c]!=null && Number(r[c])>10000) precioActual=Number(r[c]);
      }
      const estado = estadoMap[status]||"disponible";
      viviendas.push({
        id: Date.now()+Math.random(),
        ref: `${tipo}-${ref}`,
        tipologia: tipo==="VIV" ? "Vivienda" : "Parcela",
        planta: tipo==="VIV" ? "—" : "Parcela",
        superficie: 0,
        precio: precioActual,
        precioOrigen,
        estado,
        notas: precioActual!==precioOrigen ? `Origen: ${new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(precioOrigen)}` : "",
      });
    }
    fin.viviendas = viviendas;
    result.ok = true;
    result.data = fin;
  } catch(e) {
    result.error = e.message;
  }
  return result;
};

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const Btn = ({ onClick, children, v="ghost", sm }) => {
  const S={primary:{background:"#4f8ef7",color:"#fff",border:"none"},danger:{background:"transparent",color:"#f05a5a",border:"1px solid rgba(240,90,90,0.3)"},ghost:{background:"transparent",color:"#6b7394",border:"1px solid #252a3a"},green:{background:"#22d3a0",color:"#0d0f14",border:"none"}};
  return <button onClick={onClick} style={{...S[v],borderRadius:8,padding:sm?"4px 10px":"7px 16px",cursor:"pointer",fontSize:sm?"0.73rem":"0.84rem",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>{children}</button>;
};
const FL = ({ label, children }) => (
  <div style={{marginBottom:12}}>
    <div style={{fontSize:"0.7rem",color:"#6b7394",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
    {children}
  </div>
);
const Modal = ({ title, onClose, children, wide }) => (
  <div onMouseDown={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:"#141720",border:"1px solid #252a3a",borderRadius:16,padding:28,width:wide?720:500,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontWeight:800,fontSize:"1rem"}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7394",fontSize:"1.3rem",cursor:"pointer",lineHeight:1}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── MODAL COMPONENTS (stable, defined outside) ───────────────────────────────
const ModalProj = memo(function ModalProj({pF,onChange,onSave,onClose,isEdit}){
  return <Modal title={isEdit?"✏️ Editar promoción":"➕ Nueva promoción"} onClose={onClose} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={{gridColumn:"span 2"}}><FL label="Nombre"><input style={CSS.inp} value={pF.name} onChange={e=>onChange("name",e.target.value)} autoFocus/></FL></div>
      <FL label="Ubicación"><input style={CSS.inp} value={pF.ubicacion} onChange={e=>onChange("ubicacion",e.target.value)} placeholder="Ciudad, provincia"/></FL>
      <FL label="Zona"><select style={CSS.inp} value={pF.zona} onChange={e=>onChange("zona",e.target.value)}>{["Sur","Norte","Canarias","Centro","Este","Oeste"].map(z=><option key={z}>{z}</option>)}</select></FL>
      <FL label="Estado"><select style={CSS.inp} value={pF.estado} onChange={e=>onChange("estado",e.target.value)}>{Object.entries(ESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></FL>
      <FL label="Fecha entrega"><input type="date" style={CSS.inp} value={pF.fechaEntrega} onChange={e=>onChange("fechaEntrega",e.target.value)}/></FL>
      <FL label="Project Owner"><select style={CSS.inp} value={pF.projectOwner} onChange={e=>onChange("projectOwner",e.target.value)}><option value="">—</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
      <FL label="PM Técnico (BSA)"><select style={CSS.inp} value={pF.pmTecnico} onChange={e=>onChange("pmTecnico",e.target.value)}><option value="">—</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
      <FL label="Responsable Comercial"><select style={CSS.inp} value={pF.responsableComercial} onChange={e=>onChange("responsableComercial",e.target.value)}><option value="">—</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
      <FL label="Comercializadora"><input style={CSS.inp} value={pF.comercializadora} onChange={e=>onChange("comercializadora",e.target.value)}/></FL>
      <FL label="Presupuesto"><input style={CSS.inp} value={pF.presupuesto} onChange={e=>onChange("presupuesto",e.target.value)} placeholder="Ej: €5.2M"/></FL>
      <FL label="Coste actual"><input style={CSS.inp} value={pF.costeActual} onChange={e=>onChange("costeActual",e.target.value)} placeholder="Ej: €4.8M"/></FL>
    </div>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">{isEdit?"Guardar":"Crear"}</Btn></div>
  </Modal>;
});
const ModalHito = memo(function ModalHito({hF,onChange,onSave,onClose}){
  return <Modal title="✏️ Editar hito" onClose={onClose}>
    <FL label="Nombre"><input style={CSS.inp} value={hF.nombre} onChange={e=>onChange("nombre",e.target.value)} autoFocus/></FL>
    <FL label="Estado"><select style={CSS.inp} value={hF.estado} onChange={e=>onChange("estado",e.target.value)}><option value="pendiente">⭕ Pendiente</option><option value="en-curso">→ En curso</option><option value="completado">✓ Completado</option><option value="retrasado">⚠ Retrasado</option></select></FL>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FL label="Fecha prevista"><input type="date" style={CSS.inp} value={hF.fechaPrevista} onChange={e=>onChange("fechaPrevista",e.target.value)}/></FL>
      <FL label="Fecha real"><input type="date" style={CSS.inp} value={hF.fechaReal} onChange={e=>onChange("fechaReal",e.target.value)}/></FL>
    </div>
    <FL label="Notas"><textarea style={{...CSS.inp,minHeight:70,resize:"vertical"}} value={hF.notas} onChange={e=>onChange("notas",e.target.value)}/></FL>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">Guardar</Btn></div>
  </Modal>;
});
const ModalTarea = memo(function ModalTarea({tF,onChange,onSave,onClose,isEdit}){
  return <Modal title={isEdit?"✏️ Editar tarea":"➕ Nueva tarea"} onClose={onClose}>
    <FL label="Descripción"><input style={CSS.inp} value={tF.texto} onChange={e=>onChange("texto",e.target.value)} autoFocus/></FL>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FL label="Responsable"><select style={CSS.inp} value={tF.responsable} onChange={e=>onChange("responsable",e.target.value)}><option value="">—</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
      <FL label="Prioridad"><select style={CSS.inp} value={tF.prioridad} onChange={e=>onChange("prioridad",e.target.value)}><option value="alta">🔴 Alta</option><option value="media">🟡 Media</option><option value="baja">🟢 Baja</option></select></FL>
    </div>
    <FL label="Fecha límite"><input type="date" style={CSS.inp} value={tF.vencimiento} onChange={e=>onChange("vencimiento",e.target.value)}/></FL>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">{isEdit?"Guardar":"Crear"}</Btn></div>
  </Modal>;
});
const ModalBlocker = memo(function ModalBlocker({bF,onChange,onSave,onClose}){
  return <Modal title="Alerta / Bloqueo" onClose={onClose}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FL label="Tipo"><select style={CSS.inp} value={bF.tipo} onChange={e=>onChange("tipo",e.target.value)}><option value="critico">🔴 Crítico</option><option value="aviso">⚠️ Aviso</option><option value="info">ℹ️ Info</option></select></FL>
      <FL label="Responsable"><select style={CSS.inp} value={bF.responsable} onChange={e=>onChange("responsable",e.target.value)}><option value="">—</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
    </div>
    <FL label="Título"><input style={CSS.inp} value={bF.titulo} onChange={e=>onChange("titulo",e.target.value)} autoFocus/></FL>
    <FL label="Descripción"><textarea style={{...CSS.inp,minHeight:75,resize:"vertical"}} value={bF.desc} onChange={e=>onChange("desc",e.target.value)}/></FL>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">Guardar</Btn></div>
  </Modal>;
});
const ModalVivienda = memo(function ModalVivienda({vF,onChange,onSave,onClose,isEdit}){
  return <Modal title={isEdit?"✏️ Editar vivienda":"➕ Nueva vivienda"} onClose={onClose}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FL label="Referencia"><input style={CSS.inp} value={vF.ref} onChange={e=>onChange("ref",e.target.value)} autoFocus/></FL>
      <FL label="Tipología"><input style={CSS.inp} value={vF.tipologia} onChange={e=>onChange("tipologia",e.target.value)}/></FL>
      <FL label="Tipo / Planta"><input style={CSS.inp} value={vF.planta} onChange={e=>onChange("planta",e.target.value)}/></FL>
      <FL label="Superficie m²"><input type="number" style={CSS.inp} value={vF.superficie} onChange={e=>onChange("superficie",e.target.value)}/></FL>
      <FL label="Precio PVP (€)"><input type="number" style={CSS.inp} value={vF.precio} onChange={e=>onChange("precio",e.target.value)}/></FL>
      <FL label="Estado"><select style={CSS.inp} value={vF.estado} onChange={e=>onChange("estado",e.target.value)}><option value="disponible">Disponible</option><option value="reservada">Reservada</option><option value="vendida">Vendida</option><option value="no-venta">No venta</option></select></FL>
    </div>
    <FL label="Notas"><input style={CSS.inp} value={vF.notas} onChange={e=>onChange("notas",e.target.value)}/></FL>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">{isEdit?"Guardar":"Añadir"}</Btn></div>
  </Modal>;
});

// ─── HITO ROW ─────────────────────────────────────────────────────────────────
const HitoRow = memo(function HitoRow({h,idx,onCycle,onEdit,onDelete,isDragging,isOver,onDragStart,onDragEnter,onDragEnd}){
  const hs=HITO_EST[h.estado]||HITO_EST.pendiente;
  return <div draggable="true" onDragStart={()=>onDragStart(idx)} onDragEnter={()=>onDragEnter(idx)} onDragOver={e=>e.preventDefault()} onDragEnd={onDragEnd}
    style={{display:"flex",alignItems:"center",gap:12,background:isDragging?"#252a3a":"#141720",borderRadius:11,border:isOver?"2px solid #4f8ef7":`1px solid ${h.estado==="retrasado"?"rgba(240,90,90,0.4)":h.estado==="en-curso"?"rgba(79,142,247,0.25)":"#252a3a"}`,padding:"12px 15px",marginBottom:7,opacity:isDragging?0.5:1,cursor:"grab",userSelect:"none"}}>
    <div style={{color:"#444",fontSize:"1.1rem",flexShrink:0}}>⠿</div>
    <div onClick={()=>onCycle(idx)} title="Click para cambiar estado"
      style={{width:32,height:32,borderRadius:"50%",background:hs.bg,border:`2.5px solid ${hs.color}`,display:"flex",alignItems:"center",justifyContent:"center",color:hs.color,fontWeight:800,fontSize:"0.9rem",flexShrink:0,cursor:"pointer",transition:"transform 0.12s"}}
      onMouseEnter={e=>e.currentTarget.style.transform="scale(1.18)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      {hs.icon}
    </div>
    <div style={{flex:1}}>
      <div style={{fontWeight:600,fontSize:"0.88rem"}}>{h.nombre}</div>
      {h.notas&&<div style={{fontSize:"0.72rem",color:"#6b7394",marginTop:2}}>{h.notas}</div>}
    </div>
    <div style={{display:"flex",gap:14,alignItems:"center"}}>
      {h.fechaPrevista&&<span style={{fontSize:"0.71rem",color:"#6b7394"}}>Prev: {fmt(h.fechaPrevista)}</span>}
      {h.fechaReal&&<span style={{fontSize:"0.71rem",color:"#22d3a0"}}>Real: {fmt(h.fechaReal)}</span>}
      <span style={{fontSize:"0.64rem",fontWeight:700,padding:"2px 8px",borderRadius:6,background:hs.bg,color:hs.color,textTransform:"uppercase"}}>{h.estado}</span>
    </div>
    <div style={{display:"flex",gap:5}}><Btn onClick={()=>onEdit(idx)} sm>✏️</Btn><Btn onClick={()=>onDelete(idx)} v="danger" sm>✕</Btn></div>
  </div>;
});

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
const KpiCard = ({label,val,sub,color,prev,trend}) => (
  <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"14px 16px"}}>
    <div style={{fontSize:"0.63rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:6}}>{label}</div>
    <div style={{fontSize:"1.3rem",fontWeight:800,color:color||"#e8eaf2",marginBottom:3}}>{val}</div>
    {sub&&<div style={{fontSize:"0.72rem",color:"#6b7394"}}>{sub}</div>}
    {prev&&<div style={{fontSize:"0.7rem",color:"#4a5070",marginTop:2}}>BP base: {prev}</div>}
  </div>
);

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Overview() {
  const [projects, setProjects] = useState(() => {
    try { const s=localStorage.getItem("ov8"); if(s){const p=JSON.parse(s);return p.map(x=>({...x,viviendas:x.viviendas||[],bp:x.bp||null}));} return DEFAULT_PROJECTS; } catch { return DEFAULT_PROJECTS; }
  });
  const [view, setView] = useState("dashboard");
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState("hitos");
  const [modal, setModal] = useState(null);

  const dragItem=useRef(null), dragOverItem=useRef(null);
  const [dragIdx,setDragIdx]=useState(null), [overIdx,setOverIdx]=useState(null);

  const [pF,setPF]=useState({name:"",zona:"Sur",estado:"planificacion",projectOwner:"",pmTecnico:"",responsableComercial:"",comercializadora:"",ubicacion:"",presupuesto:"",costeActual:"",fechaEntrega:""});
  const [hF,setHF]=useState({nombre:"",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""});
  const [tF,setTF]=useState({texto:"",responsable:"",prioridad:"media",vencimiento:""});
  const [bF,setBF]=useState({tipo:"aviso",titulo:"",desc:"",responsable:""});
  const [vF,setVF]=useState({ref:"",tipologia:"",planta:"",superficie:"",precio:"",estado:"disponible",notas:""});
  const [newHName,setNewHName]=useState("");
  const [resumenLocal,setResumenLocal]=useState("");
  const [bpImporting,setBpImporting]=useState(false);
  const [bpPreview,setBpPreview]=useState(null); // preview before confirm

  const editId=useRef(null), hitoIdx=useRef(null), projIsEdit=useRef(false), blockerIsEdit=useRef(false);

  const proj=projects.find(p=>p.id===activeId);

  useEffect(()=>{ try{localStorage.setItem("ov8",JSON.stringify(projects));}catch{} },[projects]);
  useEffect(()=>{ if(proj) setResumenLocal(proj.resumenSemanal||""); },[activeId]);

  const save=fn=>setProjects(prev=>fn(prev));
  const upd=useCallback((id,fn)=>setProjects(prev=>prev.map(p=>p.id!==id?p:fn(p))),[]);

  const chPF=useCallback((k,v)=>setPF(p=>({...p,[k]:v})),[]);
  const chHF=useCallback((k,v)=>setHF(p=>({...p,[k]:v})),[]);
  const chTF=useCallback((k,v)=>setTF(p=>({...p,[k]:v})),[]);
  const chBF=useCallback((k,v)=>setBF(p=>({...p,[k]:v})),[]);
  const chVF=useCallback((k,v)=>setVF(p=>({...p,[k]:v})),[]);

  // Project CRUD
  const openNewP=useCallback(()=>{ projIsEdit.current=false; setPF({name:"",zona:"Sur",estado:"planificacion",projectOwner:"",pmTecnico:"",responsableComercial:"",comercializadora:"",ubicacion:"",presupuesto:"",costeActual:"",fechaEntrega:""}); setModal("proj"); },[]);
  const openEditP=useCallback(()=>{ if(!proj) return; projIsEdit.current=true; editId.current=proj.id; setPF({name:proj.name,zona:proj.zona,estado:proj.estado,projectOwner:proj.projectOwner||"",pmTecnico:proj.pmTecnico||"",responsableComercial:proj.responsableComercial||"",comercializadora:proj.comercializadora||"",ubicacion:proj.ubicacion||"",presupuesto:proj.presupuesto||"",costeActual:proj.costeActual||"",fechaEntrega:proj.fechaEntrega||""}); setModal("proj"); },[proj]);
  const saveP=useCallback(()=>{ if(!pF.name.trim()) return; if(projIsEdit.current){upd(editId.current,p=>({...p,...pF}));}else{const np={...pF,id:Date.now(),hitos:DEFAULT_HITOS.map(n=>({nombre:n,estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""})),blockers:[],tareas:[],viviendas:[],bp:null,resumenSemanal:"",ultimaActualizacion:new Date().toISOString().split("T")[0]};save(prev=>[...prev,np]);setActiveId(np.id);setView("proyecto");} setModal(null); },[pF,upd]);
  const delP=useCallback(id=>{ if(!confirm("¿Eliminar esta promoción?")) return; save(prev=>prev.filter(p=>p.id!==id)); setView("dashboard"); setActiveId(null); },[]);

  // Hitos
  const cycleHito=useCallback(idx=>{ upd(activeId,p=>{ const h=[...p.hitos]; const cur=h[idx].estado; const next=HITO_CYCLE[(HITO_CYCLE.indexOf(cur)+1)%HITO_CYCLE.length]; h[idx]={...h[idx],estado:next,fechaReal:next==="completado"?new Date().toISOString().split("T")[0]:h[idx].fechaReal}; return {...p,hitos:h}; }); },[activeId,upd]);
  const handleDragStart=useCallback(idx=>{dragItem.current=idx;setDragIdx(idx);},[]);
  const handleDragEnter=useCallback(idx=>{dragOverItem.current=idx;setOverIdx(idx);},[]);
  const handleDragEnd=useCallback(()=>{ const from=dragItem.current,to=dragOverItem.current; if(from!==null&&to!==null&&from!==to){upd(activeId,p=>{const h=[...p.hitos];const el=h.splice(from,1)[0];h.splice(to,0,el);return {...p,hitos:h};});} dragItem.current=null;dragOverItem.current=null;setDragIdx(null);setOverIdx(null); },[activeId,upd]);
  const openEditH=useCallback(idx=>{ hitoIdx.current=idx; const h=proj?.hitos[idx]; if(h) setHF({...h}); setModal("hito"); },[proj]);
  const saveH=useCallback(()=>{ upd(activeId,p=>({...p,hitos:p.hitos.map((h,i)=>i!==hitoIdx.current?h:{...hF})})); setModal(null); },[activeId,hF,upd]);
  const addH=useCallback(()=>{ if(!newHName.trim()) return; upd(activeId,p=>({...p,hitos:[...p.hitos,{nombre:newHName,estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""}]})); setNewHName(""); },[activeId,newHName,upd]);
  const delH=useCallback(idx=>upd(activeId,p=>({...p,hitos:p.hitos.filter((_,i)=>i!==idx)})),[activeId,upd]);

  // Tareas
  const openNewT=useCallback(()=>{ editId.current=null; setTF({texto:"",responsable:proj?.projectOwner||"",prioridad:"media",vencimiento:""}); setModal("tarea"); },[proj]);
  const openEditT=useCallback(t=>{ editId.current=t.id; setTF({texto:t.texto,responsable:t.responsable,prioridad:t.prioridad,vencimiento:t.vencimiento}); setModal("tarea"); },[]);
  const saveT=useCallback(()=>{ if(!tF.texto.trim()) return; if(editId.current) upd(activeId,p=>({...p,tareas:p.tareas.map(t=>t.id!==editId.current?t:{...t,...tF})})); else upd(activeId,p=>({...p,tareas:[...p.tareas,{id:Date.now(),...tF,done:false}]})); setModal(null); },[activeId,tF,upd]);
  const togT=useCallback(tid=>upd(activeId,p=>({...p,tareas:p.tareas.map(t=>t.id===tid?{...t,done:!t.done}:t)})),[activeId,upd]);
  const delT=useCallback(tid=>upd(activeId,p=>({...p,tareas:p.tareas.filter(t=>t.id!==tid)})),[activeId,upd]);

  // Blockers
  const openNewB=useCallback(()=>{ blockerIsEdit.current=false; editId.current=null; setBF({tipo:"aviso",titulo:"",desc:"",responsable:proj?.projectOwner||""}); setModal("blocker"); },[proj]);
  const openEditB=useCallback((b,idx)=>{ blockerIsEdit.current=true; editId.current=idx; setBF({...b}); setModal("blocker"); },[]);
  const saveB=useCallback(()=>{ if(!bF.titulo.trim()) return; if(blockerIsEdit.current) upd(activeId,p=>({...p,blockers:p.blockers.map((b,i)=>i!==editId.current?b:{...bF})})); else upd(activeId,p=>({...p,blockers:[...p.blockers,{...bF}]})); setModal(null); },[activeId,bF,upd]);
  const delB=useCallback(idx=>upd(activeId,p=>({...p,blockers:p.blockers.filter((_,i)=>i!==idx)})),[activeId,upd]);

  // Viviendas
  const openNewV=useCallback(()=>{ editId.current=null; setVF({ref:"",tipologia:"",planta:"",superficie:"",precio:"",estado:"disponible",notas:""}); setModal("vivienda"); },[]);
  const openEditV=useCallback(v=>{ editId.current=v.id; setVF({ref:v.ref,tipologia:v.tipologia,planta:v.planta||"",superficie:String(v.superficie||""),precio:String(v.precio||""),estado:v.estado,notas:v.notas||""}); setModal("vivienda"); },[]);
  const saveV=useCallback(()=>{ if(!vF.ref.trim()) return; const clean={...vF,precio:parsePrice(vF.precio),superficie:parseFloat(String(vF.superficie).replace(",","."))||0}; if(editId.current) upd(activeId,p=>({...p,viviendas:p.viviendas.map(v=>v.id!==editId.current?v:{...v,...clean})})); else upd(activeId,p=>({...p,viviendas:[...(p.viviendas||[]),{id:Date.now(),...clean}]})); setModal(null); },[activeId,vF,upd]);
  const delV=useCallback(vid=>upd(activeId,p=>({...p,viviendas:p.viviendas.filter(v=>v.id!==vid)})),[activeId,upd]);
  const cycleViv=useCallback(vid=>{ const cyc=["disponible","reservada","vendida","no-venta"]; upd(activeId,p=>({...p,viviendas:p.viviendas.map(v=>v.id!==vid?v:{...v,estado:cyc[(cyc.indexOf(v.estado)+1)%cyc.length]})})); },[activeId,upd]);
  const clearViv=useCallback(()=>{ if(!confirm("¿Eliminar todas las viviendas?")) return; upd(activeId,p=>({...p,viviendas:[]})); },[activeId,upd]);

  // SheetJS loader
  useEffect(()=>{ if(!document.getElementById("sheetjs")){const sc=document.createElement("script");sc.id="sheetjs";sc.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";document.head.appendChild(sc);} },[]);

  // Vivienda file import (existing format)
  const handleVivFile=useCallback(e=>{ const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=ev=>{ if(!window.XLSX){alert("SheetJS cargando...");return;} try{ const wb=window.XLSX.read(ev.target.result,{type:"binary"}); const ws=wb.Sheets[wb.SheetNames[0]]; const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:true}); if(!rows.length) return; let hdrIdx=-1; for(let i=0;i<Math.min(rows.length,10);i++){const r=rows[i].map(c=>String(c||"").toLowerCase().trim());if(r.some(c=>c==="núm"||c==="num"||c==="ref"||c.includes("pvp")||c.includes("precio"))){hdrIdx=i;break;}} if(hdrIdx===-1){alert("No se encontró cabecera reconocible.");return;} const headers=rows[hdrIdx].map(c=>String(c||"").trim()); const idx={}; headers.forEach((h,i)=>{const hl=h.toLowerCase();if(hl==="núm"||hl==="num"||hl==="nº"||hl==="n"||hl==="ref"||hl==="referencia"||hl==="unidad") idx.ref=i;if((hl==="pvp"||hl==="pvp 2")&&idx.pvp===undefined) idx.pvp=i;if((hl==="precio"||hl==="precio venta")&&idx.precio===undefined) idx.precio=i;if(hl.includes("m2 útil")||hl.includes("util int")) idx.sup=i;if(hl==="dor"||hl==="dormitorios") idx.dor=i;if(hl.includes("orientac")) idx.ori=i;if(hl.includes("reserva")) idx.res=i;}); const vvs=[]; for(let i=hdrIdx+1;i<rows.length;i++){const r=rows[i]; const ref=String(idx.ref!==undefined?r[idx.ref]:"").trim(); if(!ref||isNaN(Number(ref))) continue; const priceRaw=idx.pvp!==undefined?r[idx.pvp]:(idx.precio!==undefined?r[idx.precio]:0); const precio=parsePrice(priceRaw||0); if(!precio) continue; const resVal=idx.res!==undefined?String(r[idx.res]||"").trim():""; const estado=resVal&&resVal!=="0"?"reservada":"disponible"; const dor=Number(idx.dor!==undefined?r[idx.dor]:0)||0; vvs.push({id:Date.now()+Math.random(),ref,tipologia:dor?`${dor} dorm.`:"—",planta:"—",superficie:parseFloat(String(idx.sup!==undefined?r[idx.sup]:"").replace(",","."))||0,precio,estado,notas:idx.ori!==undefined?String(r[idx.ori]||""):""}); } if(!vvs.length){alert("No se encontraron viviendas con precio.");return;} upd(activeId,p=>({...p,viviendas:[...(p.viviendas||[]),...vvs]})); alert(`✅ ${vvs.length} viviendas importadas`); }catch(err){alert("Error: "+err.message);} }; reader.readAsBinaryString(file); e.target.value=""; },[activeId,upd]);

  // ── BP FILE IMPORT ──
  const handleBPFile=useCallback(e=>{ const file=e.target.files[0]; if(!file) return; setBpImporting(true); const reader=new FileReader(); reader.onload=ev=>{ if(!window.XLSX){alert("SheetJS cargando, espera 2s e intenta de nuevo.");setBpImporting(false);return;} try{ const wb=window.XLSX.read(ev.target.result,{type:"binary",cellDates:true}); const result=parseBP(wb); if(!result.ok){alert("Error parseando BP: "+result.error);setBpImporting(false);return;} setBpPreview(result.data); setModal("bpPreview"); }catch(err){alert("Error: "+err.message);} setBpImporting(false); }; reader.readAsBinaryString(file); e.target.value=""; },[]);

  // Confirm BP import
  const confirmBP=useCallback(()=>{
    if(!bpPreview) return;
    const d=bpPreview;
    upd(activeId,p=>{
      const updated={...p};
      // Basic info
      if(d.localidad) updated.ubicacion=d.localidad;
      if(d.fechaEntrega) updated.fechaEntrega=d.fechaEntrega;
      if(d.ventasActual) updated.presupuesto=fmtEurM(d.ventasActual);
      if(d.totalGastosActual) updated.costeActual=fmtEurM(d.totalGastosActual);
      // BP data object
      updated.bp=d;
      // Viviendas from Lista_Precios
      if(d.viviendas&&d.viviendas.length>0) updated.viviendas=d.viviendas;
      updated.ultimaActualizacion=new Date().toISOString().split("T")[0];
      return updated;
    });
    setBpPreview(null);
    setModal(null);
  },[activeId,bpPreview,upd]);

  const saveResumen=useCallback(()=>{ upd(activeId,p=>({...p,resumenSemanal:resumenLocal,ultimaActualizacion:new Date().toISOString().split("T")[0]})); },[activeId,resumenLocal,upd]);

  const today=new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});

  // ─── COMPUTED ────────────────────────────────────────────────────────────────
  const allStats=projects.map(p=>calcStats(p.viviendas||[]));
  const totalU=allStats.reduce((a,s)=>a+s.total,0), totalV=allStats.reduce((a,s)=>a+s.vendidas,0);
  const bloq=projects.filter(p=>p.estado==="bloqueado").length, risk=projects.filter(p=>p.estado==="en-riesgo").length;
  const st=proj?calcStats(proj.viviendas||[]):{total:0,vendidas:0,reservadas:0,disponibles:0,precioMedio:0,ingresosTotal:0,ingresosVR:0};
  const pct=st.total?Math.round(st.vendidas/st.total*100):0;
  const projEst=proj?(ESTADOS[proj.estado]||ESTADOS.planificacion):null;

  return (
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#0d0f14",color:"#e8eaf2",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* HEADER */}
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

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* ── DASHBOARD ── */}
        {view==="dashboard"&&(
          <div style={{padding:"24px 32px",overflowY:"auto",flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div><div style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.03em",marginBottom:3}}>Panel de promociones</div><div style={{fontSize:"0.78rem",color:"#6b7394"}}>Vista consolidada</div></div>
              <Btn onClick={openNewP} v="primary">+ Nueva promoción</Btn>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:26}}>
              {[{label:"Promociones",val:projects.length,color:"#4f8ef7",sub:"activas"},{label:"Unidades en cartera",val:fmtNum(totalU),color:"#e8eaf2",sub:"total registradas"},{label:"Vendidas",val:`${fmtNum(totalV)} / ${fmtNum(totalU)}`,color:"#22d3a0",sub:totalU?`${Math.round(totalV/totalU*100)}% absorción`:"—"},{label:"Alertas",val:bloq+risk,color:bloq>0?"#f05a5a":risk>0?"#f5c842":"#22d3a0",sub:`${bloq} bloqueados · ${risk} en riesgo`}].map(k=>(
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
                const s=calcStats(p.viviendas||[]);
                const hOk=p.hitos.filter(h=>h.estado==="completado").length;
                const pct2=s.total?Math.round(s.vendidas/s.total*100):0;
                return <div key={p.id} onClick={()=>{setActiveId(p.id);setView("proyecto");setTab("hitos");}}
                  style={{display:"grid",gridTemplateColumns:"2fr 0.8fr 1fr 0.9fr 1.1fr 1.3fr 1fr 50px",padding:"13px 22px",borderBottom:idx<projects.length-1?"1px solid #1c2030":"none",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#1a1e2c"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div><div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:2}}>{p.name}</div><div style={{fontSize:"0.71rem",color:"#6b7394"}}>{p.ubicacion}</div></div>
                  <div style={{fontSize:"0.8rem",color:"#6b7394",alignSelf:"center"}}>{p.zona}</div>
                  <div style={{alignSelf:"center"}}><span style={{fontSize:"0.65rem",fontWeight:700,padding:"3px 8px",borderRadius:8,background:est.bg,color:est.color,textTransform:"uppercase"}}>{est.label}</span></div>
                  <div style={{alignSelf:"center"}}><div style={{fontSize:"0.82rem",fontWeight:600,marginBottom:4}}>{hOk}/{p.hitos.length}</div><div style={{height:3,background:"#252a3a",borderRadius:2,width:50,overflow:"hidden"}}><div style={{height:"100%",width:`${p.hitos.length?hOk/p.hitos.length*100:0}%`,background:"#4f8ef7",borderRadius:2}}/></div></div>
                  <div style={{alignSelf:"center"}}><div style={{fontSize:"0.82rem",fontWeight:600,color:pct2>70?"#22d3a0":pct2>40?"#f5c842":"#e8eaf2"}}>{pct2}%</div><div style={{fontSize:"0.7rem",color:"#6b7394"}}>{s.vendidas}/{s.total} uds</div></div>
                  <div style={{alignSelf:"center"}}><div style={{fontWeight:500,fontSize:"0.82rem"}}>{p.projectOwner||"—"}</div><div style={{fontSize:"0.7rem",color:"#6b7394"}}>{p.pmTecnico||"—"}</div></div>
                  <div style={{fontSize:"0.73rem",color:"#6b7394",alignSelf:"center"}}>{p.ultimaActualizacion?fmt(p.ultimaActualizacion):"—"}{p.blockers.length>0&&<div style={{color:"#f05a5a",fontSize:"0.67rem",marginTop:2}}>⚠ {p.blockers.length} alerta{p.blockers.length>1?"s":""}</div>}</div>
                  <div style={{alignSelf:"center",textAlign:"right",color:"#6b7394"}}>→</div>
                </div>;
              })}
            </div>
          </div>
        )}

        {/* ── PROYECTO ── */}
        {view==="proyecto"&&proj&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"18px 32px 0",background:"#0d0f14",borderBottom:"1px solid #252a3a",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                    <button onClick={()=>setView("dashboard")} style={{background:"none",border:"none",color:"#6b7394",cursor:"pointer",fontSize:"0.78rem",padding:0}}>← Volver</button>
                    <h1 style={{margin:0,fontSize:"1.5rem",fontWeight:800,letterSpacing:"-0.03em"}}>{proj.name}</h1>
                    <span style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 9px",borderRadius:8,background:projEst.bg,color:projEst.color,textTransform:"uppercase"}}>{projEst.label}</span>
                    {proj.bp&&<span style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 9px",borderRadius:8,background:"rgba(124,92,252,0.15)",color:"#a78bfa"}}>📊 BP cargado</span>}
                    <span style={{fontSize:"0.73rem",color:"#6b7394"}}>{proj.ubicacion} · {proj.zona}</span>
                  </div>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    {[`👤 ${proj.projectOwner||"—"}`,`🏗 ${proj.pmTecnico||"—"}`,`💼 ${proj.responsableComercial||"—"}`,`📅 ${fmt(proj.fechaEntrega)}`].map(m=><span key={m} style={{fontSize:"0.75rem",color:"#6b7394"}}>{m}</span>)}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <label style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.3)",color:"#a78bfa",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6}}>
                    {bpImporting?"⏳ Cargando...":"📊 Importar BP"}
                    <input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}} disabled={bpImporting}/>
                  </label>
                  <Btn onClick={openEditP} sm>✏️ Editar</Btn>
                  <Btn onClick={()=>delP(proj.id)} v="danger" sm>Eliminar</Btn>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
                {[{label:"Total uds",val:st.total||"—"},{label:"Vendidas",val:st.vendidas,color:"#22d3a0"},{label:"Reservadas",val:st.reservadas,color:"#f5c842"},{label:"Absorción",val:`${pct}%`,color:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a"},{label:"Precio medio",val:fmtEur(st.precioMedio)}].map(k=>(
                  <div key={k.label} style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"10px 14px"}}>
                    <div style={{fontSize:"0.6rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{k.label}</div>
                    <div style={{fontSize:"1.1rem",fontWeight:800,color:k.color||"#e8eaf2"}}>{k.val}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",overflowX:"auto"}}>
                {[{id:"hitos",l:"🏗 Hitos"},{id:"bp",l:`📊 Business Plan${proj.bp?" ✓":""}`},{id:"viviendas",l:`🏠 Viviendas${st.total>0?` (${st.total})`:""}`},{id:"comercial",l:"📈 Comercial"},{id:"equipo",l:"👥 Equipo"},{id:"blockers",l:`🚧 Alertas${proj.blockers.length>0?` (${proj.blockers.length})`:""}`},{id:"tareas",l:`✅ Tareas${proj.tareas.filter(t=>!t.done).length>0?` (${proj.tareas.filter(t=>!t.done).length})`:""}`},{id:"reporte",l:"📝 Reporte"}].map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?"#4f8ef7":"transparent"}`,color:tab===t.id?"#e8eaf2":"#6b7394",padding:"9px 14px",cursor:"pointer",fontSize:"0.79rem",fontWeight:tab===t.id?700:400,fontFamily:"inherit",whiteSpace:"nowrap"}}>{t.l}</button>
                ))}
              </div>
            </div>

            <div style={{flex:1,overflowY:"auto",padding:"22px 32px"}}>

              {/* HITOS */}
              {tab==="hitos"&&<div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div><div style={{fontWeight:700,fontSize:"0.92rem"}}>Hitos del proyecto</div><div style={{fontSize:"0.73rem",color:"#6b7394",marginTop:2}}>Arrastra ⠿ · Click en círculo para cambiar estado</div></div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <input value={newHName} onChange={e=>setNewHName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addH();}}} placeholder="Nombre del nuevo hito..." style={{...CSS.inp,width:210}}/>
                    <Btn onClick={addH} sm>+ Añadir</Btn>
                  </div>
                </div>
                {proj.hitos.map((h,idx)=><HitoRow key={idx} h={h} idx={idx} onCycle={cycleHito} onEdit={openEditH} onDelete={delH} onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} isDragging={dragIdx===idx} isOver={overIdx===idx&&dragIdx!==idx}/>)}
                <div style={{display:"flex",gap:14,marginTop:16,flexWrap:"wrap"}}>
                  {Object.entries(HITO_EST).map(([k,v])=><div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:"0.71rem",color:v.color}}><div style={{width:7,height:7,borderRadius:"50%",background:v.color}}/> {k}</div>)}
                </div>
              </div>}

              {/* BUSINESS PLAN */}
              {tab==="bp"&&<div>
                {!proj.bp?(
                  <div style={{textAlign:"center",padding:"60px 20px",color:"#6b7394",background:"#141720",borderRadius:12,border:"1px solid #252a3a"}}>
                    <div style={{fontSize:"3rem",marginBottom:12}}>📊</div>
                    <div style={{fontWeight:700,fontSize:"1.1rem",color:"#e8eaf2",marginBottom:8}}>Business Plan no cargado</div>
                    <div style={{fontSize:"0.84rem",marginBottom:24}}>Importa el archivo .xlsm de monitoring para ver todos los KPIs financieros automáticamente</div>
                    <label style={{background:"#a78bfa",color:"#fff",borderRadius:8,padding:"10px 22px",cursor:"pointer",fontSize:"0.88rem",fontWeight:700}}>
                      📊 Importar Business Plan (.xlsm)
                      <input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}}/>
                    </label>
                  </div>
                ):(()=>{
                  const d=proj.bp;
                  return <div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                      <div><div style={{fontWeight:800,fontSize:"0.95rem"}}>Business Plan — {proj.name}</div><div style={{fontSize:"0.73rem",color:"#6b7394",marginTop:2}}>Datos extraídos del modelo financiero · Actualizado: {fmt(proj.ultimaActualizacion)}</div></div>
                      <label style={{background:"transparent",border:"1px solid rgba(167,139,250,0.4)",color:"#a78bfa",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,display:"inline-flex",alignItems:"center",gap:5}}>
                        🔄 Actualizar BP
                        <input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}}/>
                      </label>
                    </div>

                    {/* Datos básicos */}
                    <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px 20px",marginBottom:16}}>
                      <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em"}}>📋 Datos del proyecto</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                        {[
                          {l:"Nº viviendas",v:d.numViviendas||"—"},
                          {l:"Edificabilidad",v:d.edificabilidad?`${fmtNum(d.edificabilidad)} m²`:"—"},
                          {l:"Duración obra",v:d.duracionObra?`${d.duracionObra} meses`:"—"},
                          {l:"Inicio obra",v:fmt(d.fechaInicioObra)},
                          {l:"Obtención licencia",v:fmt(d.fechaLicencia)},
                          {l:"Fecha escritura",v:fmt(d.fechaEntrega)},
                          {l:"Fondos propios",v:fmtEurM(d.fondosPropios)},
                          {l:"Duración total",v:d.duracionMeses?`${d.duracionMeses} meses`:"—"},
                        ].map(x=><div key={x.l}><div style={{fontSize:"0.62rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{x.l}</div><div style={{fontWeight:600,fontSize:"0.9rem"}}>{x.v}</div></div>)}
                      </div>
                    </div>

                    {/* P&L Comparativo */}
                    <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px 20px",marginBottom:16}}>
                      <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em"}}>💶 P&L — Base vs Actual (Monitoring)</div>
                      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:0,borderRadius:8,overflow:"hidden",border:"1px solid #252a3a"}}>
                        {["Concepto","BP Base","BP Actual","Diferencia"].map(h=><div key={h} style={{fontSize:"0.65rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",padding:"8px 12px",background:"#1c2030",borderBottom:"1px solid #252a3a"}}>{h}</div>)}
                        {[
                          {label:"Ventas (GDV)",prev:d.ventasPrev,actual:d.ventasActual,positive:true},
                          {label:"Compra suelo",prev:d.sueloPrev,actual:d.sueloActual},
                          {label:"Soft Cost",prev:d.softPrev,actual:d.softActual},
                          {label:"Hard Cost (construcción)",prev:d.hardPrev,actual:d.hardActual},
                          {label:"Gastos financieros",prev:d.financieroPrev,actual:d.financieroActual},
                          {label:"Comercialización",prev:d.comercialPrev,actual:d.comercialActual},
                          {label:"Total gastos",prev:d.totalGastosPrev,actual:d.totalGastosActual,bold:true},
                          {label:"Resultado / Beneficio",prev:d.beneficioPrev,actual:d.beneficioActual,bold:true,positive:true},
                        ].map((row,i)=>{
                          const diff=(row.actual||0)-(row.prev||0);
                          const diffColor=row.positive?(diff>=0?"#22d3a0":"#f05a5a"):(diff<=0?"#22d3a0":"#f05a5a");
                          return [
                            <div key={`${i}a`} style={{padding:"9px 12px",borderBottom:"1px solid #252a3a",fontSize:"0.82rem",fontWeight:row.bold?700:400}}>{row.label}</div>,
                            <div key={`${i}b`} style={{padding:"9px 12px",borderBottom:"1px solid #252a3a",fontSize:"0.82rem",color:"#6b7394"}}>{fmtEurM(row.prev)}</div>,
                            <div key={`${i}c`} style={{padding:"9px 12px",borderBottom:"1px solid #252a3a",fontSize:"0.82rem",fontWeight:row.bold?700:400,color:row.bold?"#e8eaf2":"inherit"}}>{fmtEurM(row.actual)}</div>,
                            <div key={`${i}d`} style={{padding:"9px 12px",borderBottom:"1px solid #252a3a",fontSize:"0.82rem",fontWeight:600,color:diff!==0?diffColor:"#6b7394"}}>{diff!==0?(diff>0?"+":"")+fmtEurM(diff):"—"}</div>,
                          ];
                        })}
                      </div>
                    </div>

                    {/* KPIs rentabilidad */}
                    <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px 20px",marginBottom:16}}>
                      <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em"}}>📈 KPIs de rentabilidad</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                        <KpiCard label="TIR (pretax)" val={fmtPct(d.tirActual||d.irr)} prev={fmtPct(d.tirPrev)} color={(d.tirActual||d.irr)>0.15?"#22d3a0":"#f5c842"}/>
                        <KpiCard label="Margen sobre ventas" val={fmtPct(d.mgvActual)} prev={fmtPct(d.mgvPrev)} color={(d.mgvActual)>0.12?"#22d3a0":"#f5c842"}/>
                        <KpiCard label="ROE (beneficio/FFPP)" val={d.roeActual?`${(d.roeActual*100).toFixed(1)}x`:"—"} prev={d.roePrev?`${(d.roePrev*100).toFixed(1)}x`:"—"} color="#4f8ef7"/>
                        <KpiCard label="Equity Multiple" val={d.equityMultiple?`${d.equityMultiple.toFixed(2)}x`:"—"} color="#4f8ef7"/>
                        <KpiCard label="Beneficio total" val={fmtEurM(d.beneficioActual||d.netProfit)} prev={fmtEurM(d.beneficioPrev)} color="#22d3a0"/>
                        <KpiCard label="GDV (ventas totales)" val={fmtEurM(d.ventasActual||d.gdv)} color="#e8eaf2"/>
                        <KpiCard label="Total costes" val={fmtEurM(d.totalGastosActual||d.gdc)} color="#e8eaf2"/>
                        <KpiCard label="Fondos propios" val={fmtEurM(d.fondosPropios||d.equityAmount)} color="#f5c842"/>
                      </div>
                    </div>

                    {/* Fuentes y usos */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 18px"}}>
                        <div style={{fontWeight:700,fontSize:"0.84rem",marginBottom:12,color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em"}}>💰 Fuentes de financiación</div>
                        {[{l:"Equity propio",v:d.fondosPropios||d.equityAmount,c:"#4f8ef7"},{l:"Préstamo promotor",v:d.prestamo,c:"#f5c842"},{l:"Dinero de compradores",v:d.dineroCO,c:"#22d3a0"}].map(x=>(
                          <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #252a3a"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:x.c,flexShrink:0}}/><span style={{fontSize:"0.82rem"}}>{x.l}</span></div>
                            <span style={{fontSize:"0.82rem",fontWeight:600,color:x.c}}>{fmtEurM(x.v)}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 18px"}}>
                        <div style={{fontWeight:700,fontSize:"0.84rem",marginBottom:12,color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em"}}>📤 Usos (costes por categoría)</div>
                        {[{l:"Adquisición suelo",v:d.sueloActual,c:"#f05a5a"},{l:"Hard Cost (construcción)",v:d.hardActual,c:"#f5924e"},{l:"Soft Cost",v:d.softActual,c:"#f5c842"},{l:"Comercialización",v:d.comercialActual,c:"#4f8ef7"},{l:"Gastos financieros",v:d.financieroActual,c:"#6b7394"}].map(x=>(
                          <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #252a3a"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:x.c,flexShrink:0}}/><span style={{fontSize:"0.82rem"}}>{x.l}</span></div>
                            <span style={{fontSize:"0.82rem",fontWeight:600}}>{fmtEurM(x.v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>;
                })()}
              </div>}

              {/* VIVIENDAS */}
              {tab==="viviendas"&&<div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div><div style={{fontWeight:700,fontSize:"0.92rem"}}>Tabla de viviendas</div><div style={{fontSize:"0.73rem",color:"#6b7394",marginTop:2}}>Click en estado para cambiarlo · Precio medio calculado automáticamente</div></div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                    {proj.viviendas.length>0&&<Btn onClick={clearViv} v="danger" sm>🗑 Limpiar</Btn>}
                    <label style={{background:"transparent",border:"1px solid rgba(167,139,250,0.4)",color:"#a78bfa",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5}}>
                      📊 Desde BP
                      <input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}}/>
                    </label>
                    <label style={{background:"transparent",border:"1px solid #4f8ef7",color:"#4f8ef7",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5}}>
                      📥 Lista precios
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={handleVivFile} style={{display:"none"}}/>
                    </label>
                    <Btn onClick={openNewV} sm>+ Añadir</Btn>
                  </div>
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
                    <div style={{fontWeight:600,marginBottom:4,color:"#e8eaf2"}}>No hay viviendas cargadas</div>
                    <div style={{fontSize:"0.8rem",marginBottom:20}}>Importa desde el BP, desde una lista de precios Excel, o añade manualmente</div>
                    <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
                      <label style={{background:"#a78bfa",color:"#fff",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontSize:"0.84rem",fontWeight:700}}>📊 Importar desde BP<input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}}/></label>
                      <label style={{background:"#4f8ef7",color:"#fff",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontSize:"0.84rem",fontWeight:700}}>📥 Lista de precios<input type="file" accept=".xlsx,.xls,.csv" onChange={handleVivFile} style={{display:"none"}}/></label>
                    </div>
                  </div>
                ):(
                  <>
                    <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",overflow:"hidden",marginBottom:12}}>
                      <div style={{display:"grid",gridTemplateColumns:"0.7fr 1fr 1fr 0.7fr 1.2fr 1.1fr 1.4fr 70px",padding:"8px 16px",borderBottom:"1px solid #252a3a"}}>
                        {["Ref","Tipología","Tipo","m²","Precio PVP","Estado","Notas",""].map(h=><div key={h} style={{fontSize:"0.62rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>)}
                      </div>
                      {proj.viviendas.map((v,i)=>{
                        const vs=VIV_ESTADOS[v.estado]||VIV_ESTADOS.disponible;
                        return <div key={v.id} style={{display:"grid",gridTemplateColumns:"0.7fr 1fr 1fr 0.7fr 1.2fr 1.1fr 1.4fr 70px",padding:"10px 16px",borderBottom:i<proj.viviendas.length-1?"1px solid #1c2030":"none",alignItems:"center"}}
                          onMouseEnter={e=>e.currentTarget.style.background="#1a1e2c"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{fontWeight:600,fontSize:"0.84rem"}}>{v.ref}</div>
                          <div style={{fontSize:"0.82rem"}}>{v.tipologia||"—"}</div>
                          <div style={{fontSize:"0.78rem",color:"#6b7394"}}>{v.planta||"—"}</div>
                          <div style={{fontSize:"0.78rem",color:"#6b7394"}}>{v.superficie?`${v.superficie}m²`:"—"}</div>
                          <div style={{fontSize:"0.88rem",fontWeight:700}}>{fmtEur(v.precio)}</div>
                          <div><span onClick={()=>cycleViv(v.id)} style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 8px",borderRadius:8,background:`${vs.color}18`,color:vs.color,cursor:"pointer",border:`1px solid ${vs.color}35`,textTransform:"uppercase"}}>{vs.label}</span></div>
                          <div style={{fontSize:"0.72rem",color:"#6b7394",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={v.notas}>{v.notas||"—"}</div>
                          <div style={{display:"flex",gap:4}}><Btn onClick={()=>openEditV(v)} sm>✏️</Btn><Btn onClick={()=>delV(v.id)} v="danger" sm>✕</Btn></div>
                        </div>;
                      })}
                    </div>
                    <div style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"14px 18px",display:"flex",gap:28,flexWrap:"wrap"}}>
                      {[{l:"Precio medio",v:fmtEur(st.precioMedio)},{l:"Ingresos potenciales",v:fmtEur(st.ingresosTotal)},{l:"Ingresos asegurados (v+r)",v:fmtEur(st.ingresosVR),c:"#22d3a0"}].map(x=>(
                        <div key={x.l}><div style={{fontSize:"0.62rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{x.l}</div><div style={{fontWeight:700,color:x.c||"#e8eaf2"}}>{x.v}</div></div>
                      ))}
                    </div>
                  </>
                )}
              </div>}

              {/* COMERCIAL */}
              {tab==="comercial"&&<div>
                <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:18}}>Métricas comerciales</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:18}}>
                  {[{label:"Total",val:st.total||0},{label:"Vendidas",val:st.vendidas,color:"#22d3a0"},{label:"Reservadas",val:st.reservadas,color:"#f5c842"},{label:"Disponibles",val:st.disponibles,color:"#4f8ef7"},{label:"Precio medio",val:fmtEur(st.precioMedio)},{label:"% Vendido",val:`${pct}%`,color:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a"}].map(k=>(
                    <div key={k.label} style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"15px 18px"}}>
                      <div style={{fontSize:"0.63rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:7}}>{k.label}</div>
                      <div style={{fontSize:"1.45rem",fontWeight:800,color:k.color||"#e8eaf2"}}>{k.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 20px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}><span style={{fontSize:"0.78rem",color:"#6b7394",fontWeight:500}}>Absorción</span><span style={{fontSize:"0.92rem",fontWeight:800,color:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a"}}>{pct}%</span></div>
                  <div style={{height:8,background:"#1c2030",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:pct>60?"#22d3a0":pct>30?"#f5c842":"#f05a5a",borderRadius:4}}/></div>
                </div>
              </div>}

              {/* EQUIPO */}
              {tab==="equipo"&&<div>
                <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:18}}>Estructura de equipo — {proj.name}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
                  {[{rol:"Project Owner (Overview)",persona:proj.projectOwner,desc:"Responsable global. Coordinación transversal, decisiones clave.",color:"#4f8ef7"},{rol:"PM Técnico (BSA)",persona:proj.pmTecnico,desc:"Proyecto, obra, licencias. Exclusivamente técnico.",color:"#22d3a0"},{rol:"Responsable Comercial",persona:proj.responsableComercial,desc:"Pricing, estrategia, posicionamiento, dirección comercializadora.",color:"#f5c842"},{rol:"Comercializadora",persona:proj.comercializadora||"Sin asignar",desc:"Ejecución ventas, atención leads, reporte semanal.",color:"#f5924e"}].map(r=>(
                    <div key={r.rol} style={{background:"#141720",borderRadius:12,border:`1px solid ${r.color}20`,padding:"17px 19px"}}>
                      <div style={{fontSize:"0.62rem",color:r.color,textTransform:"uppercase",letterSpacing:"0.09em",fontWeight:700,marginBottom:7}}>{r.rol}</div>
                      <div style={{fontWeight:700,fontSize:"0.98rem",marginBottom:7}}>{r.persona||"—"}</div>
                      <div style={{fontSize:"0.74rem",color:"#6b7394",lineHeight:1.55}}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>}

              {/* BLOCKERS */}
              {tab==="blockers"&&<div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontWeight:700,fontSize:"0.92rem"}}>Alertas y bloqueos</div><Btn onClick={openNewB} sm>+ Añadir</Btn></div>
                {proj.blockers.length===0?<div style={{padding:"18px",color:"#22d3a0",fontSize:"0.86rem",background:"rgba(34,211,160,0.05)",borderRadius:12,border:"1px solid rgba(34,211,160,0.2)"}}>✅ Sin bloqueos activos</div>:proj.blockers.map((b,i)=>{
                  const bs=BLOCK_ST[b.tipo]||BLOCK_ST.info;
                  return <div key={i} style={{display:"flex",alignItems:"flex-start",gap:13,background:bs.bg,borderRadius:12,border:`1px solid ${bs.border}`,padding:"15px 18px",marginBottom:9}}>
                    <div style={{fontSize:"1.15rem",flexShrink:0,marginTop:2}}>{bs.icon}</div>
                    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:4}}>{b.titulo}</div><div style={{fontSize:"0.77rem",color:"#6b7394",marginBottom:5}}>{b.desc}</div><div style={{fontSize:"0.71rem",color:"#6b7394"}}>Responsable: <span style={{color:"#e8eaf2"}}>{b.responsable}</span></div></div>
                    <div style={{display:"flex",gap:5}}><Btn onClick={()=>openEditB(b,i)} sm>✏️</Btn><Btn onClick={()=>delB(i)} v="danger" sm>✕</Btn></div>
                  </div>;
                })}
              </div>}

              {/* TAREAS */}
              {tab==="tareas"&&<div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontWeight:700,fontSize:"0.92rem"}}>Tareas</div><Btn onClick={openNewT} sm>+ Nueva</Btn></div>
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
              </div>}

              {/* REPORTE */}
              {tab==="reporte"&&<div>
                <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:4}}>Reporte semanal — {proj.name}</div>
                <div style={{fontSize:"0.77rem",color:"#f5c842",marginBottom:18,padding:"8px 12px",background:"rgba(245,200,66,0.06)",borderRadius:8,border:"1px solid rgba(245,200,66,0.2)"}}>⚠️ Debe completarse por el Project Owner antes de cada reunión semanal</div>
                <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px",marginBottom:14}}>
                  <div style={{fontSize:"0.7rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:9}}>Resumen ejecutivo de la semana</div>
                  <textarea value={resumenLocal} onChange={e=>setResumenLocal(e.target.value)} placeholder="¿Qué ha pasado esta semana? Avances, problemas, decisiones tomadas." style={{...CSS.inp,minHeight:100,resize:"vertical",lineHeight:1.6}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                    <div style={{fontSize:"0.7rem",color:"#6b7394"}}>Guardado: {proj.ultimaActualizacion?fmt(proj.ultimaActualizacion):"—"}</div>
                    <Btn onClick={saveResumen} v="primary" sm>💾 Guardar resumen</Btn>
                  </div>
                </div>
                <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px"}}>
                  <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:13}}>Checklist</div>
                  {[{label:"BP cargado",ok:!!proj.bp},{label:"Viviendas cargadas",ok:st.total>0},{label:"Hitos actualizados",ok:proj.hitos.some(h=>h.estado!=="pendiente")},{label:"Resumen guardado (mín. 20 caracteres)",ok:(proj.resumenSemanal||"").length>20},{label:"Tareas asignadas con responsable",ok:proj.tareas.length>0&&proj.tareas.every(t=>t.responsable)}].map((item,i,arr)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #252a3a":"none"}}>
                      <div style={{width:20,height:20,borderRadius:6,background:item.ok?"rgba(34,211,160,0.12)":"rgba(240,90,90,0.08)",border:`1px solid ${item.ok?"#22d3a0":"#f05a5a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.68rem",color:item.ok?"#22d3a0":"#f05a5a",flexShrink:0}}>{item.ok?"✓":"✕"}</div>
                      <div style={{fontSize:"0.83rem",color:item.ok?"#e8eaf2":"#6b7394"}}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modal==="proj"&&<ModalProj pF={pF} onChange={chPF} onSave={saveP} onClose={()=>setModal(null)} isEdit={projIsEdit.current}/>}
      {modal==="hito"&&<ModalHito hF={hF} onChange={chHF} onSave={saveH} onClose={()=>setModal(null)}/>}
      {modal==="tarea"&&<ModalTarea tF={tF} onChange={chTF} onSave={saveT} onClose={()=>setModal(null)} isEdit={!!editId.current}/>}
      {modal==="blocker"&&<ModalBlocker bF={bF} onChange={chBF} onSave={saveB} onClose={()=>setModal(null)}/>}
      {modal==="vivienda"&&<ModalVivienda vF={vF} onChange={chVF} onSave={saveV} onClose={()=>setModal(null)} isEdit={!!editId.current}/>}

      {/* BP PREVIEW MODAL */}
      {modal==="bpPreview"&&bpPreview&&(
        <Modal title="📊 Confirmar importación del Business Plan" onClose={()=>{setModal(null);setBpPreview(null);}} wide>
          <div style={{fontSize:"0.84rem",color:"#6b7394",marginBottom:18}}>Se importarán los siguientes datos a la promoción <strong style={{color:"#e8eaf2"}}>{proj?.name}</strong>:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            {[
              {l:"Nº viviendas",v:bpPreview.numViviendas},
              {l:"Localidad",v:bpPreview.localidad},
              {l:"GDV (ventas totales)",v:fmtEurM(bpPreview.ventasActual)},
              {l:"Total gastos",v:fmtEurM(bpPreview.totalGastosActual)},
              {l:"Beneficio estimado",v:fmtEurM(bpPreview.beneficioActual)},
              {l:"TIR (pretax)",v:fmtPct(bpPreview.tirActual)},
              {l:"Margen s/ventas",v:fmtPct(bpPreview.mgvActual)},
              {l:"Fecha escritura",v:fmt(bpPreview.fechaEntrega)},
              {l:"Viviendas en Lista Precios",v:`${bpPreview.viviendas?.length||0} unidades`},
              {l:"Fondos propios",v:fmtEurM(bpPreview.fondosPropios)},
            ].map(x=>(
              <div key={x.l} style={{background:"#1c2030",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:"0.65rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:3}}>{x.l}</div>
                <div style={{fontWeight:600,fontSize:"0.88rem"}}>{x.v||"—"}</div>
              </div>
            ))}
          </div>
          {bpPreview.viviendas?.length>0&&<div style={{background:"rgba(34,211,160,0.06)",border:"1px solid rgba(34,211,160,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:"0.8rem",color:"#22d3a0"}}>✅ Se cargarán {bpPreview.viviendas.length} viviendas desde la hoja Lista_Precios (reemplazará las existentes)</div>}
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <Btn onClick={()=>{setModal(null);setBpPreview(null);}}>Cancelar</Btn>
            <Btn onClick={confirmBP} v="primary">✅ Confirmar importación</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
