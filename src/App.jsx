import React, { useState, useEffect, useRef, useCallback, memo } from "react";

// ─── CLOUD STORAGE ───────────────────────────────────────────────────────────
const JBKEY = "$2a$10$a6n7i3E/5IrfUHuOxXwrJ.vZTzL/7uOxSEt5laKErphDwS85ZETbW";
const JBURL = "https://api.jsonbin.io/v3/b";

const cloudSave = async (data) => {
  try {
    let binId = localStorage.getItem("ov_bin");
    const body = JSON.stringify({projects:data});
    const headers = {"Content-Type":"application/json","X-Master-Key":JBKEY};
    if(!binId){
      const r = await fetch(JBURL,{method:"POST",headers:{...headers,"X-Bin-Name":"overview-re","X-Bin-Private":"true"},body});
      const j = await r.json();
      if(j.metadata && j.metadata.id){ localStorage.setItem("ov_bin",j.metadata.id); }
    } else {
      await fetch(JBURL+"/"+binId,{method:"PUT",headers,body});
    }
  } catch(e){}
};

const cloudLoad = async () => {
  try {
    const binId = localStorage.getItem("ov_bin");
    if(!binId) return null;
    const r = await fetch(JBURL+"/"+binId+"/latest",{headers:{"X-Master-Key":JBKEY,"X-Bin-Meta":"false"}});
    const j = await r.json();
    return Array.isArray(j.projects) ? j.projects : null;
  } catch(e){ return null; }
};

const DEFAULT_HITOS = ["Demolicion","Licencia parcelacion","Licencia de obra","Proyecto ejecucion","Licitacion","Construccion excavacion","Construccion civil","Construccion edificacion","Licencia 1a ocupacion"];
const HITO_CYCLE = ["pendiente","en-curso","completado","retrasado"];
const ESTADOS = {"en-marcha":{label:"En marcha",color:"#22d3a0",bg:"rgba(34,211,160,0.12)"},"en-riesgo":{label:"En riesgo",color:"#f5c842",bg:"rgba(245,200,66,0.12)"},"bloqueado":{label:"Bloqueado",color:"#f05a5a",bg:"rgba(240,90,90,0.12)"},"planificacion":{label:"Planificacion",color:"#4f8ef7",bg:"rgba(79,142,247,0.12)"},"entregado":{label:"Entregado",color:"#a78bfa",bg:"rgba(167,139,250,0.12)"}};
const HITO_EST = {"completado":{color:"#22d3a0",bg:"rgba(34,211,160,0.15)",icon:"✓"},"en-curso":{color:"#4f8ef7",bg:"rgba(79,142,247,0.15)",icon:"->"},"pendiente":{color:"#4a5070",bg:"rgba(74,80,112,0.15)",icon:"o"},"retrasado":{color:"#f05a5a",bg:"rgba(240,90,90,0.15)",icon:"!"}};
const BLOCK_ST = {critico:{bg:"rgba(240,90,90,0.10)",border:"rgba(240,90,90,0.3)",icon:"[!]"},aviso:{bg:"rgba(245,200,66,0.10)",border:"rgba(245,200,66,0.3)",icon:"[?]"},info:{bg:"rgba(79,142,247,0.10)",border:"rgba(79,142,247,0.3)",icon:"[i]"}};
const VIV_ESTADOS = {"disponible":{label:"Disponible",color:"#4f8ef7"},"reservada":{label:"Reservada",color:"#f5c842"},"vendida":{label:"Vendida",color:"#22d3a0"},"no-venta":{label:"No venta",color:"#6b7394"}};
const PRIO_CLR = {alta:"#f05a5a",media:"#f5c842",baja:"#22d3a0"};
const TEAM = ["Sandra","Alberto","Pilar","Monica","Maria","Fran","Sara (BSA)","Dani (BSA)","Inma (BSA)"];
const CSS = {inp:{width:"100%",background:"#1c2030",border:"1px solid #252a3a",borderRadius:8,padding:"8px 11px",color:"#e8eaf2",fontFamily:"inherit",fontSize:"0.84rem",outline:"none",boxSizing:"border-box"}};

const DEFAULT_PROJECTS = [
  {id:1,name:"ATABAL",zona:"Sur",estado:"en-marcha",projectOwner:"Sandra",pmTecnico:"Sara (BSA)",responsableComercial:"Sandra",comercializadora:"",ubicacion:"Malaga",presupuesto:"EUR8.2M",costeActual:"EUR7.9M",fechaEntrega:"2026-06-01",hitos:DEFAULT_HITOS.map((n,i)=>({nombre:n,estado:i<3?"completado":i===3?"en-curso":"pendiente",fechaPrevista:"",fechaReal:"",notas:""})),blockers:[],tareas:[],viviendas:[],bp:null,marketing:null,master:null,resumenSemanal:"",ultimaActualizacion:"2025-06-02"},
  {id:2,name:"MEDHILLS",zona:"Sur",estado:"en-riesgo",projectOwner:"Sandra",pmTecnico:"Inma (BSA)",responsableComercial:"Sandra",comercializadora:"Engel & Volkers",ubicacion:"Fuengirola",presupuesto:"EUR5.1M",costeActual:"EUR4.8M",fechaEntrega:"2027-03-01",hitos:DEFAULT_HITOS.map((n,i)=>({nombre:n,estado:i<2?"completado":i===2?"en-curso":"pendiente",fechaPrevista:"",fechaReal:"",notas:""})),blockers:[],tareas:[],viviendas:[],bp:null,marketing:null,master:null,resumenSemanal:"",ultimaActualizacion:"2025-06-01"},
];

const fmt = d => { if(!d) return "-"; try { return new Date(d+"T00:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"}); } catch { return d; } };
const fmtEur = n => { const v=Number(n); if(!v&&v!==0) return "-"; return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(v); };
const fmtEurM = n => { const v=Number(n); if(!v) return "-"; if(Math.abs(v)>=1000000) return "EUR"+(v/1000000).toFixed(2)+"M"; if(Math.abs(v)>=1000) return "EUR"+(v/1000).toFixed(0)+"K"; return fmtEur(v); };
const fmtPct = n => { const v=Number(n); if(!v&&v!==0) return "-"; return (v*100).toFixed(1)+"%"; };
const fmtNum = n => new Intl.NumberFormat("es-ES").format(Number(n)||0);

const isViv = v => {
  const r=String(v.ref||"").toUpperCase();
  const t=String(v.tipologia||"").toUpperCase();
  return t.includes("VIVIENDA")||r.includes("-V")||(t==="VIV")||(!t.includes("PARCELA")&&!r.match(/-P\d/));
};
const calcStats = (vv=[]) => {
  const total=vv.length,vendidas=vv.filter(v=>v.estado==="vendida").length,reservadas=vv.filter(v=>v.estado==="reservada").length,disponibles=vv.filter(v=>v.estado==="disponible").length;
  const vivsOnly=vv.filter(v=>isViv(v)&&Number(v.precio)>0);
  const parcOnly=vv.filter(v=>!isViv(v)&&Number(v.precio)>0);
  const precioMedio=vivsOnly.length?Math.round(vivsOnly.reduce((a,v)=>a+Number(v.precio),0)/vivsOnly.length):0;
  const precioMedioParc=parcOnly.length?Math.round(parcOnly.reduce((a,v)=>a+Number(v.precio),0)/parcOnly.length):0;
  const ingresosTotal=vv.reduce((a,v)=>a+Number(v.precio||0),0);
  const ingresosVR=vv.filter(v=>v.estado==="vendida"||v.estado==="reservada").reduce((a,v)=>a+Number(v.precio||0),0);
  const totalViv=vv.filter(v=>isViv(v)).length;
  const totalParc=vv.filter(v=>!isViv(v)).length;
  return {total,vendidas,reservadas,disponibles,precioMedio,precioMedioParc,ingresosTotal,ingresosVR,totalViv,totalParc};
};

// Returns active viviendas - master.ventas if master loaded, else proj.viviendas
// Also converts master.ventas format to viviendas format on the fly
const masterToVivs = (master) => {
  if(!master||!master.ventas) return null;
  const estadoMap={"reservada":"reservada","disponible":"disponible","vendida":"vendida","rescindida":"no-venta"};
  return master.ventas.map(v=>({
    id:v.ref,
    ref:v.ref,
    tipologia:v.tipo==="VIVIENDA"||v.ref.toUpperCase().includes("-V")?"Vivienda":"Parcela",
    planta:"-",
    superficie:v.m2||0,
    precio:v.precio||0,
    estado:estadoMap[v.status]||"disponible",
    notas:[v.nombre?v.nombre:"",v.agencia?v.agencia:"",v.fCpcv?"CPCV: "+v.fCpcv:""].filter(Boolean).join(" - "),
    _fromMaster:true,
  }));
};

const parsePrice = raw => {
  if(!raw&&raw!==0) return 0;
  if(typeof raw==="number") return Math.round(raw);
  const s=String(raw).replace(/[EUR$PS\s]/g,"");
  if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return parseInt(s.replace(/\./g,""),10);
  if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return parseInt(s.replace(/,/g,""),10);
  return parseInt(s.replace(/[,.].*$/,""),10)||0;
};

const excelDateToISO = n => {
  if(!n) return "";
  if(typeof n==="string"&&n.includes("-")) return n.substring(0,10);
  if(n instanceof Date) return n.toISOString().substring(0,10);
  if(typeof n==="number"&&n>40000) { const d=new Date(Math.round((n-25569)*86400*1000)); return d.toISOString().substring(0,10); }
  return "";
};

const nv = (r,c) => { try { const v=r&&r[c]; return (v!==null&&v!==undefined&&!isNaN(Number(v)))?Number(v):0; } catch { return 0; } };
const tv = (r,c) => { try { return String(r&&r[c]||"").trim(); } catch { return ""; } };

const parseSheetFin = (rows, sheetName) => {
  const estatico=sheetName==="Estático"||sheetName==="Estatico";
  const f={};
  for(let i=0;i<rows.length;i++){
    const r=rows[i]; if(!r||r.length<5) continue;
    const t3=tv(r,3),t4=tv(r,4),t5=tv(r,5),t37=tv(r,37),t5u=t5.toUpperCase();
    if(t4==="Parcela"||t4==="Promocion") f.nombre=tv(r,15)||f.nombre;
    if(t4==="Localidad") f.localidad=tv(r,15)||f.localidad;
    if(t4==="Numero de Viviendas") f.numViviendas=nv(r,15)||f.numViviendas;
    if(t4==="Edificabilidad") f.edificabilidad=nv(r,15)||f.edificabilidad;
    if(t37.includes("inicio de obra")) f.fechaInicioObra=excelDateToISO(r[47]||r[46]);
    if(t37.includes("licencia")) f.fechaLicencia=excelDateToISO(r[47]||r[46]);
    if(t37.includes("escritura")) f.fechaEntrega=excelDateToISO(r[47]||r[46]);
    if(t37.includes("Duracion de obra")) f.duracionObra=nv(r,46);
    if(t37.includes("Meses ejecucion")) f.duracionMeses=nv(r,46);
    if(t5u==="VENTAS"||t5u==="A. VENTAS"){if(!f.ventasPrev){f.ventasPrev=nv(r,32);f.ventasActual=estatico?nv(r,32):nv(r,37);}}
    if(t5u.includes("COMPRA")){if(!f.sueloPrev){f.sueloPrev=nv(r,32);f.sueloActual=estatico?nv(r,32):nv(r,37);}}
    if(t5u.includes("CONTRATA")||t5u.includes("HARD")){if(!f.hardPrev){f.hardPrev=nv(r,32);f.hardActual=estatico?nv(r,32):nv(r,37);}}
    if(t5u.includes("HONORARIOS")||t5u==="SOFT COST"){if(!f.softPrev){f.softPrev=nv(r,32);f.softActual=estatico?nv(r,32):nv(r,37);}}
    if(t5u==="GASTOS FINANCIEROS"){if(!f.financieroPrev){f.financieroPrev=nv(r,32);f.financieroActual=estatico?nv(r,32):nv(r,37);}}
    if(t5u.includes("COMERCIALIZACI")){if(!f.comercialPrev){f.comercialPrev=nv(r,32);f.comercialActual=estatico?nv(r,32):nv(r,37);}}
    if(t5u==="TOTAL GASTOS"){f.totalGastosPrev=nv(r,32);f.totalGastosActual=estatico?nv(r,32):nv(r,37);}
    if(t5u==="RESULTADO PLAN VIABILIDAD"){f.beneficioPrev=nv(r,32);f.beneficioActual=estatico?nv(r,32):nv(r,37);}
    if(t3.includes("Fondos Propios aportados")){f.fondosPropiosPrev=nv(r,32);f.fondosPropios=estatico?nv(r,32):nv(r,37);}
    if(t3.includes("Beneficio de la p")){if(!f.beneficioActual||f.beneficioActual===0){f.beneficioPrev=nv(r,32);f.beneficioActual=estatico?nv(r,32):nv(r,37);}}
    if(t3.includes("Beneficio / Fondos")){f.roePrev=nv(r,32);f.roeActual=estatico?nv(r,32):nv(r,37);}
    if(t3.includes("MgV")){f.mgvPrev=nv(r,32);f.mgvActual=estatico?nv(r,32):nv(r,37);}
    if(t3==="TIR (pretax)"||t3==="TIR pretax"){f.tirPrev=nv(r,32);f.tirActual=estatico?nv(r,32):nv(r,37);}
    if(t3.includes("TIR (post-tax)")){f.tirPostPrev=nv(r,32);f.tirPostActual=nv(r,37);}
    if(t3.includes("Mom (pretax)")){f.momPrev=nv(r,32);f.momActual=estatico?nv(r,32):nv(r,37);}
    if(t3.includes("REI")){f.reiPrev=nv(r,32);f.reiActual=nv(r,37);}
    if(t3.includes("RRP")){f.rrpPrev=nv(r,32);f.rrpActual=nv(r,37);}
  }
  return f;
};

const parseBP = wb => {
  const result={ok:false,error:"",data:{}};
  try {
    const X=window.XLSX;
    const sheetRows=name=>{ const ws=wb.Sheets[name]; if(!ws) return []; return X.utils.sheet_to_json(ws,{header:1,defval:null,raw:true}); };
    const sheetPriority=["Monitoring","RESUMEN","Resumen Consolidado","Estático","Estatico"];
    const mainSheetName=sheetPriority.find(s=>wb.Sheets[s])||null;
    if(!mainSheetName){result.error="No se encontro hoja financiera";return result;}
    const fin=parseSheetFin(sheetRows(mainSheetName),mainSheetName);
    fin.mainSheet=mainSheetName;
    const bizSheets=wb.SheetNames.filter(s=>s.startsWith("Resumen ")&&s!=="Resumen Consolidado"&&s!=="Resumen Consolidado (desc)");
    if(bizSheets.length>0){fin.negocios=bizSheets.map(sn=>{const f=parseSheetFin(sheetRows(sn),sn);f.nombre=sn.replace("Resumen ","");return f;});}
    if(wb.Sheets["PL and KPIs"]){
      const plRows=sheetRows("PL and KPIs");
      for(let i=0;i<plRows.length;i++){
        const r=plRows[i];if(!r) continue;
        const t1=tv(r,1);
        if(t1==="Net Profit (pre tax)") fin.netProfit=nv(r,5);
        if(t1==="Total GDV") fin.gdv=nv(r,5);
        if(t1==="Total GDC") fin.gdc=nv(r,5);
        if(t1.includes("Project Level IRR")) fin.irr=nv(r,4)||nv(r,3);
        if(t1==="Project Equity multiple"||t1==="Equity multiple") fin.equityMultiple=nv(r,4)||nv(r,3);
        if(t1==="Duration (months)") fin.duracionMeses=fin.duracionMeses||nv(r,3);
        if(t1==="Equity") fin.equityAmount=nv(r,3);
        if(t1==="Construction Loan Draws") fin.prestamo=nv(r,3);
        if(t1.includes("Hard Costs")) fin.hardCostPL=nv(r,5);
        if(t1.includes("Soft Costs")) fin.softCostPL=nv(r,5);
      }
      if(!fin.ventasActual&&fin.gdv) fin.ventasActual=fin.gdv;
      if(!fin.totalGastosActual&&fin.gdc) fin.totalGastosActual=fin.gdc;
      if(!fin.beneficioActual&&fin.netProfit) fin.beneficioActual=fin.netProfit;
      if(!fin.tirActual&&fin.irr) fin.tirActual=fin.irr;
      if(!fin.hardActual&&fin.hardCostPL) fin.hardActual=fin.hardCostPL;
      if(!fin.softActual&&fin.softCostPL) fin.softActual=fin.softCostPL;
    }
    const viviendas=[];
    if(wb.Sheets["Lista_Precios"]){
      const lp=sheetRows("Lista_Precios");
      const estadoMap={"reservado":"reservada","reservada":"reservada","vendido":"vendida","vendida":"vendida","libre":"disponible","disponible":"disponible","bloqueado":"no-venta","bloqueado promotor":"no-venta","bloqueado promotor ":"no-venta"};
      for(let i=0;i<lp.length;i++){
        const r=lp[i];if(!r||r[0]==null) continue;
        const tipo=String(r[0]||"").trim().toUpperCase();
        if(tipo!=="VIV"&&tipo!=="PA") continue;
        const ref=String(r[1]||"").trim();
        if(!ref||isNaN(Number(ref))) continue;
        const precioOrigen=Number(r[3])||0;if(!precioOrigen) continue;
        let precioActual=precioOrigen;
        for(let c=4;c<r.length;c++){if(r[c]!=null&&Number(r[c])>10000) precioActual=Number(r[c]);}
        const status=String(r[2]||"").trim().toLowerCase();
        viviendas.push({id:Date.now()+Math.random(),ref:tipo+"-"+ref,tipologia:tipo==="VIV"?"Vivienda":"Parcela",planta:tipo==="VIV"?"-":"Parcela",superficie:0,precio:precioActual,precioOrigen,estado:estadoMap[status]||"disponible",notas:precioActual!==precioOrigen?"Origen: "+new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(precioOrigen):""});
      }
    }
    // Extract Marketing and Sales Mgmt from Cash Flow consolidado (separate from total comercializacion)
    const cfSheets=["Cash Flow consolidado","Cash Flow Living","Cash Flow Suites","Cash Flow Wellness"];
    for(const cfName of cfSheets){
      if(!wb.Sheets[cfName]) continue;
      const cfRows=sheetRows(cfName);
      for(let i=0;i<cfRows.length;i++){
        const r=cfRows[i];if(!r) continue;
        const t1=tv(r,1);
        if(t1.includes("Marketing and Sales Mgmt")||t1.includes("Marketing and Sales Coord")){
          fin.mktSalesMgmt=Math.abs(nv(r,4))||Math.abs(nv(r,32))||0;
        }
        if(t1.includes("Master Broker")){fin.masterBroker=Math.abs(nv(r,4))||0;}
        if(t1.includes("Structuring fee")){fin.structuringFee=Math.abs(nv(r,4))||0;}
      }
      if(fin.mktSalesMgmt) break;
    }
    // Priority 1: Fees sheet "Presupuesto M&C" = pure marketing budget (most accurate)
    let feesFound=false;
    const feesSheets=["Fees","Fees_1","fees"];
    for(const fsName of feesSheets){
      if(!wb.Sheets[fsName]) continue;
      const feesRows=sheetRows(fsName);
      for(let i=0;i<feesRows.length;i++){
        const r=feesRows[i];if(!r) continue;
        const t1=tv(r,1);const t0=tv(r,0);
        if(t1==="Presupuesto M&C"||t0==="Presupuesto M&C"){
          const v=nv(r,5)||nv(r,6)||nv(r,2);
          if(v>0){ fin.mktBudget=v; feesFound=true; break; }
        }
        if(t1==="% lanzamiento") fin.mktLanzamiento=nv(r,5)||nv(r,6);
        if(t1==="% durante proyecto") fin.mktDurante=nv(r,5)||nv(r,6);
        if(t1.includes("allowance")) fin.mktAllowance=nv(r,5)||nv(r,6);
      }
      if(feesFound) break;
    }
    // Priority 2: Cash Flow "Marketing and Sales Mgmt." (Elviria multi-negocio)
    if(!feesFound){
      if(fin.mktSalesMgmt) fin.mktBudget=fin.mktSalesMgmt;
      // Priority 3: Total COMERCIALIZACION as last resort
      else fin.mktBudget=fin.comercialActual||0;
    }

    fin.viviendas=viviendas;
    result.ok=true;result.data=fin;
  } catch(e){result.error=e.message;}
  return result;
};

const Btn = ({onClick,children,v="ghost",sm}) => {
  const S={primary:{background:"#4f8ef7",color:"#fff",border:"none"},danger:{background:"transparent",color:"#f05a5a",border:"1px solid rgba(240,90,90,0.3)"},ghost:{background:"transparent",color:"#6b7394",border:"1px solid #252a3a"}};
  return <button onClick={onClick} style={{...S[v],borderRadius:8,padding:sm?"4px 10px":"7px 16px",cursor:"pointer",fontSize:sm?"0.73rem":"0.84rem",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>{children}</button>;
};
const FL = ({label,children}) => (
  <div style={{marginBottom:12}}>
    <div style={{fontSize:"0.7rem",color:"#6b7394",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
    {children}
  </div>
);
const Modal = ({title,onClose,children,wide}) => (
  <div onMouseDown={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:"#141720",border:"1px solid #252a3a",borderRadius:16,padding:28,width:wide?700:500,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontWeight:800,fontSize:"1rem"}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7394",fontSize:"1.3rem",cursor:"pointer",lineHeight:1}}>x</button>
      </div>
      {children}
    </div>
  </div>
);

const ModalProj = memo(function ModalProj({pF,onChange,onSave,onClose,isEdit}){
  return (<Modal title={isEdit?"Editar promocion":"Nueva promocion"} onClose={onClose} wide>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <div style={{gridColumn:"span 2"}}><FL label="Nombre"><input style={CSS.inp} value={pF.name} onChange={e=>onChange("name",e.target.value)} autoFocus/></FL></div>
      <FL label="Ubicacion"><input style={CSS.inp} value={pF.ubicacion} onChange={e=>onChange("ubicacion",e.target.value)}/></FL>
      <FL label="Zona"><select style={CSS.inp} value={pF.zona} onChange={e=>onChange("zona",e.target.value)}>{["Sur","Norte","Canarias","Centro","Este","Oeste"].map(z=><option key={z}>{z}</option>)}</select></FL>
      <FL label="Estado"><select style={CSS.inp} value={pF.estado} onChange={e=>onChange("estado",e.target.value)}>{Object.entries(ESTADOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></FL>
      <FL label="Fecha entrega"><input type="date" style={CSS.inp} value={pF.fechaEntrega} onChange={e=>onChange("fechaEntrega",e.target.value)}/></FL>
      <FL label="Project Owner"><select style={CSS.inp} value={pF.projectOwner} onChange={e=>onChange("projectOwner",e.target.value)}><option value="">-</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
      <FL label="PM Tecnico (BSA)"><select style={CSS.inp} value={pF.pmTecnico} onChange={e=>onChange("pmTecnico",e.target.value)}><option value="">-</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
      <FL label="Responsable Comercial"><select style={CSS.inp} value={pF.responsableComercial} onChange={e=>onChange("responsableComercial",e.target.value)}><option value="">-</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
      <FL label="Comercializadora"><input style={CSS.inp} value={pF.comercializadora} onChange={e=>onChange("comercializadora",e.target.value)}/></FL>
      <FL label="Presupuesto"><input style={CSS.inp} value={pF.presupuesto} onChange={e=>onChange("presupuesto",e.target.value)}/></FL>
      <FL label="Coste actual"><input style={CSS.inp} value={pF.costeActual} onChange={e=>onChange("costeActual",e.target.value)}/></FL>
    </div>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">{isEdit?"Guardar":"Crear"}</Btn></div>
  </Modal>);
});
const ModalHito = memo(function ModalHito({hF,onChange,onSave,onClose}){
  return (<Modal title="Editar hito" onClose={onClose}>
    <FL label="Nombre"><input style={CSS.inp} value={hF.nombre} onChange={e=>onChange("nombre",e.target.value)} autoFocus/></FL>
    <FL label="Estado"><select style={CSS.inp} value={hF.estado} onChange={e=>onChange("estado",e.target.value)}><option value="pendiente">Pendiente</option><option value="en-curso">En curso</option><option value="completado">Completado</option><option value="retrasado">Retrasado</option></select></FL>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FL label="Fecha prevista"><input type="date" style={CSS.inp} value={hF.fechaPrevista} onChange={e=>onChange("fechaPrevista",e.target.value)}/></FL>
      <FL label="Fecha real"><input type="date" style={CSS.inp} value={hF.fechaReal} onChange={e=>onChange("fechaReal",e.target.value)}/></FL>
    </div>
    <FL label="Notas"><textarea style={{...CSS.inp,minHeight:70,resize:"vertical"}} value={hF.notas} onChange={e=>onChange("notas",e.target.value)}/></FL>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">Guardar</Btn></div>
  </Modal>);
});
const ModalTarea = memo(function ModalTarea({tF,onChange,onSave,onClose,isEdit}){
  return (<Modal title={isEdit?"Editar tarea":"Nueva tarea"} onClose={onClose}>
    <FL label="Descripcion"><input style={CSS.inp} value={tF.texto} onChange={e=>onChange("texto",e.target.value)} autoFocus/></FL>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FL label="Responsable"><select style={CSS.inp} value={tF.responsable} onChange={e=>onChange("responsable",e.target.value)}><option value="">-</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
      <FL label="Prioridad"><select style={CSS.inp} value={tF.prioridad} onChange={e=>onChange("prioridad",e.target.value)}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></FL>
    </div>
    <FL label="Fecha limite"><input type="date" style={CSS.inp} value={tF.vencimiento} onChange={e=>onChange("vencimiento",e.target.value)}/></FL>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">{isEdit?"Guardar":"Crear"}</Btn></div>
  </Modal>);
});
const ModalBlocker = memo(function ModalBlocker({bF,onChange,onSave,onClose}){
  return (<Modal title="Alerta / Bloqueo" onClose={onClose}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FL label="Tipo"><select style={CSS.inp} value={bF.tipo} onChange={e=>onChange("tipo",e.target.value)}><option value="critico">Critico</option><option value="aviso">Aviso</option><option value="info">Info</option></select></FL>
      <FL label="Responsable"><select style={CSS.inp} value={bF.responsable} onChange={e=>onChange("responsable",e.target.value)}><option value="">-</option>{TEAM.map(t=><option key={t}>{t}</option>)}</select></FL>
    </div>
    <FL label="Titulo"><input style={CSS.inp} value={bF.titulo} onChange={e=>onChange("titulo",e.target.value)} autoFocus/></FL>
    <FL label="Descripcion"><textarea style={{...CSS.inp,minHeight:75,resize:"vertical"}} value={bF.desc} onChange={e=>onChange("desc",e.target.value)}/></FL>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">Guardar</Btn></div>
  </Modal>);
});
const ModalVivienda = memo(function ModalVivienda({vF,onChange,onSave,onClose,isEdit}){
  return (<Modal title={isEdit?"Editar vivienda":"Nueva vivienda"} onClose={onClose}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FL label="Referencia"><input style={CSS.inp} value={vF.ref} onChange={e=>onChange("ref",e.target.value)} autoFocus/></FL>
      <FL label="Tipologia"><input style={CSS.inp} value={vF.tipologia} onChange={e=>onChange("tipologia",e.target.value)}/></FL>
      <FL label="Tipo / Planta"><input style={CSS.inp} value={vF.planta} onChange={e=>onChange("planta",e.target.value)}/></FL>
      <FL label="Superficie m2"><input type="number" style={CSS.inp} value={vF.superficie} onChange={e=>onChange("superficie",e.target.value)}/></FL>
      <FL label="Precio PVP (EUR)"><input type="number" style={CSS.inp} value={vF.precio} onChange={e=>onChange("precio",e.target.value)}/></FL>
      <FL label="Estado"><select style={CSS.inp} value={vF.estado} onChange={e=>onChange("estado",e.target.value)}><option value="disponible">Disponible</option><option value="reservada">Reservada</option><option value="vendida">Vendida</option><option value="no-venta">No venta</option></select></FL>
    </div>
    <FL label="Notas"><input style={CSS.inp} value={vF.notas} onChange={e=>onChange("notas",e.target.value)}/></FL>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">{isEdit?"Guardar":"Anadir"}</Btn></div>
  </Modal>);
});

const HitoRow = memo(function HitoRow({h,idx,onCycle,onEdit,onDelete,isDragging,isOver,onDragStart,onDragEnter,onDragEnd}){
  const hs=HITO_EST[h.estado]||HITO_EST.pendiente;
  const borderColor=isOver?"2px solid #4f8ef7":(h.estado==="retrasado"?"1px solid rgba(240,90,90,0.4)":h.estado==="en-curso"?"1px solid rgba(79,142,247,0.25)":"1px solid #252a3a");
  return (
    <div draggable="true" onDragStart={()=>onDragStart(idx)} onDragEnter={()=>onDragEnter(idx)} onDragOver={e=>e.preventDefault()} onDragEnd={onDragEnd}
      style={{display:"flex",alignItems:"center",gap:12,background:isDragging?"#252a3a":"#141720",borderRadius:11,border:borderColor,padding:"12px 15px",marginBottom:7,opacity:isDragging?0.5:1,cursor:"grab",userSelect:"none"}}>
      <div style={{color:"#444",fontSize:"1.1rem",flexShrink:0}}>::::</div>
      <div onClick={()=>onCycle(idx)} style={{width:32,height:32,borderRadius:"50%",background:hs.bg,border:"2px solid "+hs.color,display:"flex",alignItems:"center",justifyContent:"center",color:hs.color,fontWeight:800,fontSize:"0.9rem",flexShrink:0,cursor:"pointer"}}>
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
      <div style={{display:"flex",gap:5}}><Btn onClick={()=>onEdit(idx)} sm>edit</Btn><Btn onClick={()=>onDelete(idx)} v="danger" sm>x</Btn></div>
    </div>
  );
});

const KpiCard = ({label,val,sub,color,prev}) => (
  <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"14px 16px"}}>
    <div style={{fontSize:"0.63rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:6}}>{label}</div>
    <div style={{fontSize:"1.3rem",fontWeight:800,color:color||"#e8eaf2",marginBottom:3}}>{val}</div>
    {sub&&<div style={{fontSize:"0.72rem",color:"#6b7394"}}>{sub}</div>}
    {prev&&<div style={{fontSize:"0.7rem",color:"#4a5070",marginTop:2}}>BP base: {prev}</div>}
  </div>
);

const CREDS = {user:"overviewre",pass:"ige84610e"};

function LoginScreen({onLogin}){
  const [user,setUser]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState(false);
  const [show,setShow]=useState(false);
  const doLogin=()=>{
    if(user.trim()===CREDS.user&&pass===CREDS.pass){onLogin();}
    else{setErr(true);setTimeout(()=>setErr(false),2500);}
  };
  return (
    <div style={{height:"100vh",background:"#0d0f14",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{width:380,padding:"40px 36px",background:"#141720",borderRadius:20,border:"1px solid #252a3a",boxShadow:"0 24px 60px rgba(0,0,0,0.5)"}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontWeight:800,fontSize:"1.6rem",letterSpacing:"-0.03em",marginBottom:6,color:"#4f8ef7"}}>Overview</div>
          <div style={{fontSize:"0.78rem",color:"#6b7394"}}>Gestion de promociones inmobiliarias</div>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:"0.72rem",color:"#6b7394",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Usuario</div>
          <input value={user} onChange={e=>{setUser(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="Usuario" autoFocus style={{...CSS.inp,padding:"10px 14px",fontSize:"0.9rem",border:err?"1px solid #f05a5a":"1px solid #252a3a"}}/>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:"0.72rem",color:"#6b7394",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Contrasena</div>
          <div style={{position:"relative"}}>
            <input value={pass} onChange={e=>{setPass(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&doLogin()} type={show?"text":"password"} placeholder="Contrasena" style={{...CSS.inp,padding:"10px 14px",fontSize:"0.9rem",border:err?"1px solid #f05a5a":"1px solid #252a3a",paddingRight:40}}/>
            <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#6b7394",cursor:"pointer",fontSize:"0.85rem",padding:0}}>{show?"[H]":"[V]"}</button>
          </div>
        </div>
        {err&&<div style={{background:"rgba(240,90,90,0.1)",border:"1px solid rgba(240,90,90,0.3)",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:"0.82rem",color:"#f05a5a",textAlign:"center"}}>Usuario o contrasena incorrectos</div>}
        <button onClick={doLogin} style={{width:"100%",background:"#4f8ef7",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontWeight:700,fontSize:"0.95rem",cursor:"pointer",fontFamily:"inherit"}}>Entrar</button>
        <div style={{textAlign:"center",marginTop:20,fontSize:"0.72rem",color:"#3a4060"}}>Overview Real Estate 2026</div>
      </div>
    </div>
  );
}


const MasterTab = ({proj, activeId, upd, handleMasterFile, fmt, fmtEur, VIV_ESTADOS}) => {
  if(!proj.master) return (
    <div style={{textAlign:"center",padding:"50px 20px",color:"#6b7394",background:"#141720",borderRadius:12,border:"1px solid #252a3a"}}>
      <div style={{fontSize:"2rem",marginBottom:10}}>MC</div>
      <div style={{fontWeight:700,fontSize:"1rem",color:"#e8eaf2",marginBottom:6}}>Master Comercial no cargado</div>
      <div style={{fontSize:"0.8rem",marginBottom:20}}>Importa el master comercial para ver ventas, repricings y rescisiones</div>
      <label style={{background:"#4f8ef7",color:"#fff",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:"0.85rem",fontWeight:700}}>
        Importar Master Comercial (.xlsx)
        <input type="file" accept=".xlsx,.xls" onChange={handleMasterFile} style={{display:"none"}}/>
      </label>
    </div>
  );
  const m=proj.master||{};
  const ventas=Array.isArray(m.ventas)?m.ventas.filter(Boolean):[];
  const rescisiones=Array.isArray(m.rescisiones)?m.rescisiones.filter(Boolean):[];
  const vendidas=ventas.filter(v=>v.status==="vendida"||v.status==="reservada");
  const libres=ventas.filter(v=>v.status==="disponible");
  const totalVentas=vendidas.reduce((a,v)=>a+(Number(v.precio)||0),0);
  const comisionTotal=vendidas.reduce((a,v)=>a+(Number(v.comision)||0),0);
  const conRepricing=ventas.filter(v=>(Number(v.incremento)||0)>0);
  const incrementoMedio=conRepricing.length?Math.round(conRepricing.reduce((a,v)=>a+(Number(v.incremento)||0),0)/conRepricing.length):0;
  const vivsV=vendidas.filter(v=>(v.tipo||"")==="VIVIENDA"||(v.ref||"").includes("-V"));
  const parcV=vendidas.filter(v=>(v.tipo||"")!=="VIVIENDA"&&!(v.ref||"").includes("-V"));
  const precioMedioViv=vivsV.length?Math.round(vivsV.reduce((a,v)=>a+(Number(v.precio)||0),0)/vivsV.length):0;
  const precioMedioParc=parcV.length?Math.round(parcV.reduce((a,v)=>a+(Number(v.precio)||0),0)/parcV.length):0;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontWeight:800,fontSize:"0.95rem"}}>Master Comercial - {proj.name}</div>
          <div style={{fontSize:"0.73rem",color:"#6b7394",marginTop:2}}>Importado: {fmt(m.importado||"")} - {ventas.length} unidades</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <label style={{background:"transparent",border:"1px solid #4f8ef7",color:"#4f8ef7",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700}}>
            Actualizar<input type="file" accept=".xlsx,.xls" onChange={handleMasterFile} style={{display:"none"}}/>
          </label>
          <button onClick={()=>upd(activeId,p=>({...p,master:null}))} style={{background:"transparent",border:"1px solid rgba(240,90,90,0.3)",color:"#f05a5a",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:600,fontFamily:"inherit"}}>Borrar</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[
          {l:"Total unidades",v:ventas.length,c:"#e8eaf2"},
          {l:"Vendidas/Reservadas",v:vendidas.length,c:"#22d3a0"},
          {l:"Disponibles",v:libres.length,c:"#4f8ef7"},
          {l:"Rescisiones",v:rescisiones.length,c:"#f05a5a"},
          {l:"Ingresos comprometidos",v:fmtEur(totalVentas),c:"#22d3a0"},
          {l:"Precio medio VIV",v:fmtEur(precioMedioViv)},
          {l:"Precio medio PARC",v:fmtEur(precioMedioParc)},
          {l:"Incremento medio repricing",v:fmtEur(incrementoMedio),c:"#f5c842"},
          {l:"Comisiones totales",v:fmtEur(comisionTotal),c:"#f5924e"},
        ].map(k=>(
          <div key={k.l} style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"12px 14px"}}>
            <div style={{fontSize:"0.61rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{k.l}</div>
            <div style={{fontSize:"1rem",fontWeight:800,color:k.c||"#e8eaf2"}}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #252a3a",fontWeight:700,fontSize:"0.86rem",display:"flex",justifyContent:"space-between"}}>
          <span>Tabla de ventas</span>
          <span style={{fontSize:"0.72rem",color:"#6b7394",fontWeight:400}}>{vendidas.length} comprometidas</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 0.7fr 0.9fr 1fr 1fr 1fr 0.8fr 1fr",padding:"8px 16px",borderBottom:"1px solid #252a3a"}}>
          {["Ref","Tipo","Status","Precio origen","Precio actual","Incremento","m2","F. Reserva"].map(h=>(
            <div key={h} style={{fontSize:"0.61rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>
          ))}
        </div>
        <div style={{maxHeight:400,overflowY:"auto"}}>
          {ventas.map((v,i)=>{
            const sKey=v.status==="rescindida"?"no-venta":(v.status||"disponible");
            const vs=VIV_ESTADOS[sKey]||VIV_ESTADOS.disponible;
            const inc=Number(v.incremento)||0;
            return (
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 0.7fr 0.9fr 1fr 1fr 1fr 0.8fr 1fr",padding:"9px 16px",borderBottom:i<ventas.length-1?"1px solid #1c2030":"none",alignItems:"center"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1a1e2c"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontWeight:600,fontSize:"0.82rem"}}>{v.ref||"-"}</div>
                <div style={{fontSize:"0.78rem",color:"#6b7394"}}>{(v.tipo||"")==="VIVIENDA"?"VIV":"PA"}</div>
                <div><span style={{fontSize:"0.65rem",fontWeight:700,padding:"2px 6px",borderRadius:6,background:vs.color+"18",color:vs.color,textTransform:"uppercase"}}>{vs.label}</span></div>
                <div style={{fontSize:"0.82rem",color:"#6b7394"}}>{fmtEur(v.precioOrigen)}</div>
                <div style={{fontSize:"0.84rem",fontWeight:700}}>{fmtEur(v.precio)}</div>
                <div style={{fontSize:"0.82rem",color:inc>0?"#22d3a0":"#6b7394",fontWeight:inc>0?600:400}}>{inc>0?"+"+fmtEur(inc):"-"}</div>
                <div style={{fontSize:"0.78rem",color:"#6b7394"}}>{v.m2?v.m2+" m2":"-"}</div>
                <div style={{fontSize:"0.75rem",color:"#6b7394"}}>{v.fReserva?fmt(v.fReserva):"-"}</div>
              </div>
            );
          })}
        </div>
      </div>
      {rescisiones.length>0&&(
        <div style={{background:"rgba(240,90,90,0.06)",border:"1px solid rgba(240,90,90,0.2)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"12px 18px",borderBottom:"1px solid rgba(240,90,90,0.15)",fontWeight:700,fontSize:"0.86rem",color:"#f05a5a"}}>Rescisiones ({rescisiones.length})</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"8px 16px",borderBottom:"1px solid rgba(240,90,90,0.1)"}}>
            {["Ref","Fecha","Precio","Comprador"].map(h=><div key={h} style={{fontSize:"0.61rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>)}
          </div>
          {rescisiones.map((r,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"9px 16px",borderBottom:i<rescisiones.length-1?"1px solid rgba(240,90,90,0.08)":"none",alignItems:"center"}}>
              <div style={{fontWeight:600,fontSize:"0.82rem"}}>{r.ref||"-"}</div>
              <div style={{fontSize:"0.78rem",color:"#f05a5a"}}>{r.fecha?fmt(r.fecha):"-"}</div>
              <div style={{fontSize:"0.82rem"}}>{fmtEur(r.precio)}</div>
              <div style={{fontSize:"0.78rem",color:"#6b7394"}}>{r.nombre||"-"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){return {hasError:true,error};}
  render(){
    if(this.state.hasError){
      return <div style={{padding:40,fontFamily:"sans-serif",background:"#0d0f14",color:"#e8eaf2",minHeight:"100vh"}}>
        <div style={{maxWidth:600,margin:"0 auto",paddingTop:80}}>
          <div style={{fontSize:"1.2rem",fontWeight:700,color:"#f05a5a",marginBottom:16}}>Error al cargar la aplicacion</div>
          <div style={{fontSize:"0.85rem",color:"#6b7394",fontFamily:"monospace",background:"#141720",padding:16,borderRadius:8,marginBottom:20}}>{String(this.state.error)}</div>
          <div style={{fontSize:"0.82rem",color:"#6b7394",marginBottom:16}}>Puede que haya datos incompatibles guardados. Prueba a limpiar el cache:</div>
          <button onClick={()=>{localStorage.clear();sessionStorage.clear();window.location.reload();}} style={{background:"#4f8ef7",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:"0.88rem",fontWeight:600}}>Limpiar cache y recargar</button>
        </div>
      </div>;
    }
    return this.props.children;
  }
}

export default function Overview(){
  const [loggedIn,setLoggedIn]=useState(()=>sessionStorage.getItem("ov_auth")==="1");
  const doLogin=()=>{sessionStorage.setItem("ov_auth","1");setLoggedIn(true);};

  const [projects,setProjects]=useState(()=>{
    // Load from localStorage first (fast), then sync from cloud
    const keys=["ov11","ov10","ov9","ov8","ov7"];
    for(const key of keys){
      try{
        const s=localStorage.getItem(key);
        if(s){
          const p=JSON.parse(s);
          if(Array.isArray(p)&&p.length>0){
            if(key!=="ov11"){try{localStorage.setItem("ov11",s);}catch{}}
            return p.map(x=>({...x,viviendas:x.viviendas||[],bp:x.bp||null,marketing:x.marketing||null,master:x.master||null}));
          }
        }
      }catch{}
    }
    return DEFAULT_PROJECTS;
  });
  const [cloudSynced,setCloudSynced]=useState(false);
  const [view,setView]=useState("dashboard");
  const [activeId,setActiveId]=useState(null);
  const [tab,setTab]=useState("hitos");
  const [modal,setModal]=useState(null);
  const dragItem=useRef(null),dragOverItem=useRef(null);
  const [dragIdx,setDragIdx]=useState(null),[overIdx,setOverIdx]=useState(null);
  const [pF,setPF]=useState({name:"",zona:"Sur",estado:"planificacion",projectOwner:"",pmTecnico:"",responsableComercial:"",comercializadora:"",ubicacion:"",presupuesto:"",costeActual:"",fechaEntrega:""});
  const [hF,setHF]=useState({nombre:"",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""});
  const [tF,setTF]=useState({texto:"",responsable:"",prioridad:"media",vencimiento:""});
  const [bF,setBF]=useState({tipo:"aviso",titulo:"",desc:"",responsable:""});
  const [vF,setVF]=useState({ref:"",tipologia:"",planta:"",superficie:"",precio:"",estado:"disponible",notas:""});
  const [newHName,setNewHName]=useState("");
  const [resumenLocal,setResumenLocal]=useState("");
  const [bpImporting,setBpImporting]=useState(false);
  const [bpPreview,setBpPreview]=useState(null);
  const editId=useRef(null),hitoIdx=useRef(null),projIsEdit=useRef(false),blockerIsEdit=useRef(false);

  const proj=projects.find(p=>p.id===activeId);
  useEffect(()=>{
    // Sync from cloud on first load (for shared access)
    if(!cloudSynced){
      setCloudSynced(true);
      cloudLoad().then(data=>{
        if(data&&Array.isArray(data)&&data.length>0){
          const migrated=data.map(x=>({...x,viviendas:x.viviendas||[],bp:x.bp||null,marketing:x.marketing||null,master:x.master||null}));
          setProjects(migrated);
          try{localStorage.setItem("ov11",JSON.stringify(migrated));}catch{}
        }
      });
    }
  },[]);

  useEffect(()=>{
    try{localStorage.setItem("ov11",JSON.stringify(projects));}catch(e){}
    if(cloudSynced) cloudSave(projects);
  },[projects]);
  useEffect(()=>{if(proj) setResumenLocal(proj.resumenSemanal||"");},[activeId]);
  const save=fn=>setProjects(prev=>fn(prev));
  const upd=useCallback((id,fn)=>setProjects(prev=>prev.map(p=>p.id!==id?p:fn(p))),[]);
  const chPF=useCallback((k,v)=>setPF(p=>({...p,[k]:v})),[]);
  const chHF=useCallback((k,v)=>setHF(p=>({...p,[k]:v})),[]);
  const chTF=useCallback((k,v)=>setTF(p=>({...p,[k]:v})),[]);
  const chBF=useCallback((k,v)=>setBF(p=>({...p,[k]:v})),[]);
  const chVF=useCallback((k,v)=>setVF(p=>({...p,[k]:v})),[]);

  const openNewP=useCallback(()=>{projIsEdit.current=false;setPF({name:"",zona:"Sur",estado:"planificacion",projectOwner:"",pmTecnico:"",responsableComercial:"",comercializadora:"",ubicacion:"",presupuesto:"",costeActual:"",fechaEntrega:""});setModal("proj");},[]);
  const openEditP=useCallback(()=>{if(!proj) return;projIsEdit.current=true;editId.current=proj.id;setPF({name:proj.name,zona:proj.zona,estado:proj.estado,projectOwner:proj.projectOwner||"",pmTecnico:proj.pmTecnico||"",responsableComercial:proj.responsableComercial||"",comercializadora:proj.comercializadora||"",ubicacion:proj.ubicacion||"",presupuesto:proj.presupuesto||"",costeActual:proj.costeActual||"",fechaEntrega:proj.fechaEntrega||""});setModal("proj");},[proj]);
  const saveP=useCallback(()=>{if(!pF.name.trim()) return;if(projIsEdit.current){upd(editId.current,p=>({...p,...pF}));}else{const np={...pF,id:Date.now(),hitos:DEFAULT_HITOS.map(n=>({nombre:n,estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""})),blockers:[],tareas:[],viviendas:[],bp:null,marketing:null,master:null,resumenSemanal:"",ultimaActualizacion:new Date().toISOString().split("T")[0]};save(prev=>[...prev,np]);setActiveId(np.id);setView("proyecto");}setModal(null);},[pF,upd]);
  const delP=useCallback(id=>{if(!confirm("Eliminar esta promocion?")) return;save(prev=>prev.filter(p=>p.id!==id));setView("dashboard");setActiveId(null);},[]);

  const cycleHito=useCallback(idx=>{upd(activeId,p=>{const h=[...p.hitos];const cur=h[idx].estado;const next=HITO_CYCLE[(HITO_CYCLE.indexOf(cur)+1)%HITO_CYCLE.length];h[idx]={...h[idx],estado:next,fechaReal:next==="completado"?new Date().toISOString().split("T")[0]:h[idx].fechaReal};return {...p,hitos:h};});},[activeId,upd]);
  const handleDragStart=useCallback(idx=>{dragItem.current=idx;setDragIdx(idx);},[]);
  const handleDragEnter=useCallback(idx=>{dragOverItem.current=idx;setOverIdx(idx);},[]);
  const handleDragEnd=useCallback(()=>{const from=dragItem.current,to=dragOverItem.current;if(from!==null&&to!==null&&from!==to){upd(activeId,p=>{const h=[...p.hitos];const el=h.splice(from,1)[0];h.splice(to,0,el);return {...p,hitos:h};});}dragItem.current=null;dragOverItem.current=null;setDragIdx(null);setOverIdx(null);},[activeId,upd]);
  const openEditH=useCallback(idx=>{hitoIdx.current=idx;const h=proj&&proj.hitos[idx];if(h) setHF({...h});setModal("hito");},[proj]);
  const saveH=useCallback(()=>{upd(activeId,p=>({...p,hitos:p.hitos.map((h,i)=>i!==hitoIdx.current?h:{...hF})}));setModal(null);},[activeId,hF,upd]);
  const addH=useCallback(()=>{if(!newHName.trim()) return;upd(activeId,p=>({...p,hitos:[...p.hitos,{nombre:newHName,estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""}]}));setNewHName("");},[activeId,newHName,upd]);
  const delH=useCallback(idx=>upd(activeId,p=>({...p,hitos:p.hitos.filter((_,i)=>i!==idx)})),[activeId,upd]);

  const openNewT=useCallback(()=>{editId.current=null;setTF({texto:"",responsable:(proj&&proj.projectOwner)||"",prioridad:"media",vencimiento:""});setModal("tarea");},[proj]);
  const openEditT=useCallback(t=>{editId.current=t.id;setTF({texto:t.texto,responsable:t.responsable,prioridad:t.prioridad,vencimiento:t.vencimiento});setModal("tarea");},[]);
  const saveT=useCallback(()=>{if(!tF.texto.trim()) return;if(editId.current) upd(activeId,p=>({...p,tareas:p.tareas.map(t=>t.id!==editId.current?t:{...t,...tF})}));else upd(activeId,p=>({...p,tareas:[...p.tareas,{id:Date.now(),...tF,done:false}]}));setModal(null);},[activeId,tF,upd]);
  const togT=useCallback(tid=>upd(activeId,p=>({...p,tareas:p.tareas.map(t=>t.id===tid?{...t,done:!t.done}:t)})),[activeId,upd]);
  const delT=useCallback(tid=>upd(activeId,p=>({...p,tareas:p.tareas.filter(t=>t.id!==tid)})),[activeId,upd]);

  const openNewB=useCallback(()=>{blockerIsEdit.current=false;editId.current=null;setBF({tipo:"aviso",titulo:"",desc:"",responsable:(proj&&proj.projectOwner)||""});setModal("blocker");},[proj]);
  const openEditB=useCallback((b,idx)=>{blockerIsEdit.current=true;editId.current=idx;setBF({...b});setModal("blocker");},[]);
  const saveB=useCallback(()=>{if(!bF.titulo.trim()) return;if(blockerIsEdit.current) upd(activeId,p=>({...p,blockers:p.blockers.map((b,i)=>i!==editId.current?b:{...bF})}));else upd(activeId,p=>({...p,blockers:[...p.blockers,{...bF}]}));setModal(null);},[activeId,bF,upd]);
  const delB=useCallback(idx=>upd(activeId,p=>({...p,blockers:p.blockers.filter((_,i)=>i!==idx)})),[activeId,upd]);

  const openNewV=useCallback(()=>{editId.current=null;setVF({ref:"",tipologia:"",planta:"",superficie:"",precio:"",estado:"disponible",notas:""});setModal("vivienda");},[]);
  const openEditV=useCallback(v=>{editId.current=v.id;setVF({ref:v.ref,tipologia:v.tipologia,planta:v.planta||"",superficie:String(v.superficie||""),precio:String(v.precio||""),estado:v.estado,notas:v.notas||""});setModal("vivienda");},[]);
  const saveV=useCallback(()=>{if(!vF.ref.trim()) return;const clean={...vF,precio:parsePrice(vF.precio),superficie:parseFloat(String(vF.superficie).replace(",","."))||0};if(editId.current) upd(activeId,p=>({...p,viviendas:p.viviendas.map(v=>v.id!==editId.current?v:{...v,...clean})}));else upd(activeId,p=>({...p,viviendas:[...(p.viviendas||[]),{id:Date.now(),...clean}]}));setModal(null);},[activeId,vF,upd]);
  const delV=useCallback(vid=>upd(activeId,p=>({...p,viviendas:p.viviendas.filter(v=>v.id!==vid)})),[activeId,upd]);
  const cycleViv=useCallback(vid=>{
    const cyc=["disponible","reservada","vendida","no-venta"];
    const estadoToStatus={"disponible":"disponible","reservada":"reservada","vendida":"vendida","no-venta":"rescindida"};
    upd(activeId,p=>{
      if(p.master){
        // Update master.ventas
        const newVentas=p.master.ventas.map(v=>{
          if(v.ref!==vid) return v;
          const curEstado={"reservada":"reservada","disponible":"disponible","vendida":"vendida","rescindida":"no-venta"}[v.status]||"disponible";
          const nextEstado=cyc[(cyc.indexOf(curEstado)+1)%cyc.length];
          return {...v,status:estadoToStatus[nextEstado]||nextEstado};
        });
        return {...p,master:{...p.master,ventas:newVentas}};
      }
      return {...p,viviendas:p.viviendas.map(v=>v.id!==vid?v:{...v,estado:cyc[(cyc.indexOf(v.estado)+1)%cyc.length]})};
    });
  },[activeId,upd]);
  const clearViv=useCallback(()=>{if(!confirm("Eliminar todas las viviendas?")) return;upd(activeId,p=>({...p,viviendas:[]}));},[activeId,upd]);

  useEffect(()=>{if(!document.getElementById("sheetjs")){const sc=document.createElement("script");sc.id="sheetjs";sc.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";document.head.appendChild(sc);}},[]);

  const handleVivFile=useCallback(e=>{
    const file=e.target.files[0];if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      if(!window.XLSX){alert("SheetJS cargando, espera 2s.");return;}
      try{
        const wb=window.XLSX.read(ev.target.result,{type:"binary"});
        const allVvs=[];
        const multi=wb.SheetNames.length>1;
        const estadoMap={"reservado":"reservada","reservada":"reservada","vendido":"vendida","vendida":"vendida","libre":"disponible","disponible":"disponible","bloqueado":"no-venta","bloqueado promotor":"no-venta"};
        const norm=s=>String(s||"").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 .]/g,"").trim();
        wb.SheetNames.forEach(sheetName=>{
          const ws=wb.Sheets[sheetName];if(!ws) return;
          const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});
          if(!rows||rows.length<2) return;
          let isNvoga=false,hdrIdx=-1;
          for(let i=0;i<Math.min(rows.length,25);i++){
            const r=(rows[i]||[]).map(c=>norm(c));
            if(r.some(c=>c==="bloque")&&(r.some(c=>c.includes("apto"))||r.some(c=>c==="tipologia"))){isNvoga=true;hdrIdx=i;break;}
            if(r.some(c=>c==="num"||c==="ref"||c==="pvp"||c.includes("pvp")||c.includes("precio venta")||c.includes("precio esc")||c.includes("vivend"))){hdrIdx=i;break;}
          }
          if(hdrIdx===-1) return;
          if(isNvoga){
            const headers=(rows[hdrIdx]||[]).map(c=>norm(c));
            const iBloque=headers.findIndex(h=>h==="bloque");
            const iApto=headers.findIndex(h=>h.includes("apto"));
            const iTipo=headers.findIndex(h=>h==="tipologia");
            const iPlanta=headers.findIndex(h=>h==="planta");
            const iSup=headers.findIndex(h=>h.includes("total")&&h.includes("m2"));
            const iTerraza=headers.findIndex(h=>h.includes("terraza"));
            const iPrecio=headers.findIndex(h=>h.includes("esc. 1")||h.includes("esc.1")||h.includes("pricing esc"));
            const priceCol=iPrecio!==-1?iPrecio:18;
            for(let i=hdrIdx+1;i<rows.length;i++){
              const r=rows[i];if(!r) continue;
              const apto=String(r[iApto!==-1?iApto:1]||"").trim();
              if(!apto||isNaN(Number(apto))) continue;
              const precio=Number(r[priceCol])||0;if(!precio||precio<1000) continue;
              const bloque=String(r[iBloque!==-1?iBloque:0]||"").trim();
              const tipo=String(r[iTipo!==-1?iTipo:2]||"").trim();
              const planta=String(r[iPlanta!==-1?iPlanta:3]||"").trim();
              const sup=parseFloat(String(r[iSup!==-1?iSup:10]||"").replace(",","."))||0;
              const terraza=parseFloat(String(r[iTerraza!==-1?iTerraza:11]||"").replace(",","."))||0;
              allVvs.push({id:Date.now()+Math.random(),ref:"B"+bloque+"-"+apto,tipologia:tipo||"-",planta:planta?"Planta "+planta:"-",superficie:sup,precio,estado:"disponible",notas:terraza?"Terraza: "+terraza+"m2":""});
            }
          } else {
            const headers=(rows[hdrIdx]||[]).map(c=>String(c||"").trim().toLowerCase());
            const idx={};
            headers.forEach((h,i)=>{
              if((h.includes("vivend")||h==="num"||h==="ref"||h==="referencia"||norm(h)==="num")&&idx.ref===undefined) idx.ref=i;
              if((h.includes("pvp")||h==="precio venta"||h==="precio")&&idx.pvp===undefined) idx.pvp=i;
              if((h.includes("util")||h.includes("m2"))&&idx.sup===undefined) idx.sup=i;
              if((h==="dor"||h==="dormitorios"||h==="hab")&&idx.dor===undefined) idx.dor=i;
              if(h==="estado"&&idx.estado===undefined) idx.estado=i;
              if(h.includes("reserva")&&idx.reserva===undefined) idx.reserva=i;
              if(h.includes("terraza")&&idx.terraza===undefined) idx.terraza=i;
              if(h.includes("orientac")&&idx.ori===undefined) idx.ori=i;
            });
            if(idx.ref===undefined||idx.pvp===undefined) return;
            for(let i=hdrIdx+1;i<rows.length;i++){
              const r=rows[i];if(!r) continue;
              const ref=String(r[idx.ref]||"").trim();
              if(!ref||ref.toLowerCase().includes("total")) continue;
              const precio=parsePrice(r[idx.pvp]||0);
              if(!precio||precio<1000) continue;
              let estado="disponible";
              if(idx.estado!==undefined&&r[idx.estado]!=null){estado=estadoMap[String(r[idx.estado]||"").toLowerCase().trim()]||"disponible";}
              else if(idx.reserva!==undefined&&r[idx.reserva]!=null){const rv=String(r[idx.reserva]||"").trim();if(rv&&rv!=="0") estado="reservada";}
              const sup=idx.sup!==undefined?parseFloat(String(r[idx.sup]||"").replace(",","."))||0:0;
              const dor=idx.dor!==undefined?Number(r[idx.dor]||0)||0:0;
              const terraza=idx.terraza!==undefined?parseFloat(String(r[idx.terraza]||"").replace(",","."))||0:0;
              const ori=idx.ori!==undefined?String(r[idx.ori]||"").trim():"";
              const notas=[ori?"Orient: "+ori:"",terraza?"Terraza: "+terraza+"m2":""].filter(Boolean).join(" - ");
              allVvs.push({id:Date.now()+Math.random(),ref:multi?sheetName+"-"+ref:ref,tipologia:dor?dor+" dorm.":"-",planta:"-",superficie:sup,precio,estado,notas});
            }
          }
        });
        if(!allVvs.length){alert("No se encontraron viviendas con precio. Revisa columnas de referencia y PVP.");return;}
        upd(activeId,p=>({...p,viviendas:[...(p.viviendas||[]),...allVvs]}));
        alert("OK: "+allVvs.length+" viviendas importadas");
      }catch(err){alert("Error: "+err.message);}
    };
    reader.readAsBinaryString(file);
    e.target.value="";
  },[activeId,upd]);

  const handleMasterFile=useCallback(e=>{
    const file=e.target.files[0];if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      if(!window.XLSX){alert("SheetJS cargando.");return;}
      try{
        const wb=window.XLSX.read(ev.target.result,{type:"binary"});
        const result={ventas:[],rescisiones:[]};
        const toISO=v=>{if(!v) return "";if(v instanceof Date) return v.toISOString().substring(0,10);const s=String(v).trim();if(s.includes("/")){ const p=s.split("/");if(p.length===3) return p[2].substring(0,4)+"-"+p[1].padStart(2,"0")+"-"+p[0].padStart(2,"0");}if(s.length>=10&&s.includes("-")) return s.substring(0,10);return "";};
        const toN=v=>{const n=Number(v);return isNaN(n)?0:n;};
        const ws=wb.Sheets[wb.SheetNames[0]];
        if(ws){
          const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});
          let hdrIdx=-1;
          for(let i=0;i<Math.min(rows.length,8);i++){
            const r=(rows[i]||[]).map(c=>String(c||"").toUpperCase().trim());
            if(r.some(c=>c==="VVDA"||c==="VIVIENDA")&&r.some(c=>c.includes("STATUS")||c.includes("PRECIO"))){hdrIdx=i;break;}
          }
          if(hdrIdx>=0){
            const hdr=(rows[hdrIdx]||[]).map(c=>String(c||"").toUpperCase().trim());
            const iRef=hdr.findIndex(h=>h==="VVDA"||h==="VIVIENDA"||h==="REF");
            const iTipo=hdr.findIndex(h=>h==="TIPOLOGIA");
            const iStatus=hdr.findIndex(h=>h.includes("STATUS COMERCIAL"));
            const iPrecio=hdr.findIndex(h=>h==="PRECIO DE VENTA");
            const iPrecioOrigen=hdr.findIndex(h=>h.includes("PRECIO ORIGEN"));
            const iM2=hdr.findIndex(h=>h==="M2 UTIL INT"||h==="M2 UTIL");
            const iNombre=hdr.findIndex(h=>h==="NOMBRE 1"||h==="NOMBRE");
            const iAgencia=hdr.findIndex(h=>h==="AGENCIA");
            const iFReserva=hdr.findIndex(h=>h==="F. RESERVA");
            const iFCpcv=hdr.findIndex(h=>h==="F. CPCV");
            const iComision=hdr.findIndex(h=>h.includes("TOTAL COMISION"));
            const iPctCom=hdr.findIndex(h=>h.includes("% COMISION"));
            const rpCols=[];hdr.forEach((h,i)=>{if(h.startsWith("REPRICING")) rpCols.push(i);});
            for(let i=hdrIdx+1;i<rows.length;i++){
              const r=rows[i];if(!r) continue;
              const ref=String(r[iRef>=0?iRef:2]||"").trim();
              if(!ref||ref.toUpperCase().includes("TOTAL")) continue;
              const precio=toN(r[iPrecio>=0?iPrecio:6]);
              if(!precio) continue;
              const statusRaw=String(r[iStatus>=0?iStatus:16]||"").trim().toUpperCase();
              const statusMap={"RESERVA":"reservada","LIBRE":"disponible","DISPONIBLE":"disponible","ESCRITURA":"vendida","ESCRITURADO":"vendida","VENDIDA":"vendida","BAJA":"rescindida","RESCISION":"rescindida","RESCINDIDA":"rescindida"};
              const status=statusMap[statusRaw]||"disponible";
              const rps=rpCols.map(c=>toN(r[c])).filter(v=>v>0);
              result.ventas.push({
                ref,tipo:String(r[iTipo>=0?iTipo:1]||"").trim(),status,precio,
                precioOrigen:toN(r[iPrecioOrigen>=0?iPrecioOrigen:17]),
                m2:toN(r[iM2>=0?iM2:8]),
                nombre:String(r[iNombre>=0?iNombre:35]||"").trim(),
                agencia:String(r[iAgencia>=0?iAgencia:55]||"").trim(),
                fReserva:toISO(r[iFReserva>=0?iFReserva:64]),
                fCpcv:toISO(r[iFCpcv>=0?iFCpcv:65]),
                comision:toN(r[iComision>=0?iComision:59]),
                pctComision:toN(r[iPctCom>=0?iPctCom:58]),
                repricings:rps,
                incremento:precio-(toN(r[iPrecioOrigen>=0?iPrecioOrigen:17])||precio),
              });
            }
          }
        }
        const wsR=wb.Sheets["Rescisiones"];
        if(wsR){
          const rowsR=window.XLSX.utils.sheet_to_json(wsR,{header:1,defval:null,raw:true});
          const hdrR=(rowsR[0]||[]).map(c=>String(c||"").toUpperCase().trim());
          const iRef=hdrR.findIndex(h=>h==="VVDA");
          const iFecha=hdrR.findIndex(h=>h==="FECHA RESCISION");
          const iPrecio=hdrR.findIndex(h=>h==="PRECIO DE VENTA");
          const iNombre=hdrR.findIndex(h=>h==="NOMBRE 1");
          for(let i=1;i<rowsR.length;i++){
            const r=rowsR[i];if(!r) continue;
            const ref=String(r[iRef>=0?iRef:2]||"").trim();
            if(!ref) continue;
            result.rescisiones.push({ref,fecha:toISO(r[iFecha>=0?iFecha:15]),precio:toN(r[iPrecio>=0?iPrecio:6]),nombre:String(r[iNombre>=0?iNombre:32]||"").trim()});
          }
        }
        if(!result.ventas.length){alert("No se encontraron datos en el master comercial.");return;}
        // Sync with viviendas
        const estadoMap2={"reservada":"reservada","disponible":"disponible","vendida":"vendida","rescindida":"no-venta"};
        const viviendasFromMaster=result.ventas.map(v=>({
          id:Date.now()+Math.random(),ref:v.ref,
          tipologia:v.tipo==="VIVIENDA"||v.ref.toUpperCase().includes("-V")?"Vivienda":"Parcela",
          planta:"-",superficie:v.m2||0,precio:v.precio||0,
          estado:estadoMap2[v.status]||"disponible",
          notas:[v.nombre,v.agencia,v.fCpcv?"CPCV: "+v.fCpcv:""].filter(Boolean).join(" - "),
        }));
        upd(activeId,p=>({...p,master:{...result,importado:new Date().toISOString().split("T")[0]},viviendas:viviendasFromMaster}));
        alert("OK: "+result.ventas.length+" unidades cargadas");
      }catch(err){alert("Error: "+err.message);}
    };
    reader.readAsBinaryString(file);e.target.value="";
  },[activeId,upd]);

    const handleBPFile=useCallback(e=>{
    const file=e.target.files[0];if(!file) return;setBpImporting(true);
    const reader=new FileReader();
    reader.onload=ev=>{
      if(!window.XLSX){alert("SheetJS cargando.");setBpImporting(false);return;}
      try{const wb=window.XLSX.read(ev.target.result,{type:"binary",cellDates:true});const result=parseBP(wb);if(!result.ok){alert("Error BP: "+result.error);setBpImporting(false);return;}setBpPreview(result.data);setModal("bpPreview");}
      catch(err){alert("Error: "+err.message);}
      setBpImporting(false);
    };
    reader.readAsBinaryString(file);e.target.value="";
  },[]);

  const handleMktFile=useCallback(e=>{
    const file=e.target.files[0];if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      if(!window.XLSX){alert("SheetJS cargando.");return;}
      try{
        const wb2=window.XLSX.read(ev.target.result,{type:"binary",cellDates:true});
        const partidas=[];
        const sheets=[];

        const toISOMkt=v=>{
          if(!v) return "";
          if(v instanceof Date||Object.prototype.toString.call(v)==="[object Date]") return v.toISOString().substring(0,10);
          const s=String(v).trim();
          if(s.match(/^\d{4}-\d{2}-\d{2}/)) return s.substring(0,10);
          if(s.includes("/")){const p=s.split("/");if(p.length===3) return p[2].substring(0,4)+"-"+p[1].padStart(2,"0")+"-"+p[0].padStart(2,"0");}
          return "";
        };

        const monthLabel=v=>{
          if(!v) return null;
          if(v instanceof Date||Object.prototype.toString.call(v)==="[object Date]"){
            const ms=["ene","feb","mar","abr","may","jun","jul","ago","sept","oct","nov","dic"];
            return ms[v.getMonth()]+"-"+(v.getFullYear()+"").substring(2);
          }
          const s=String(v).trim().toLowerCase();
          if(/^[a-z]{2,4}-\d{2}$/.test(s)) return s;
          return null;
        };

        wb2.SheetNames.forEach(sheetName=>{
          const ws2=wb2.Sheets[sheetName];if(!ws2) return;
          const rows=window.XLSX.utils.sheet_to_json(ws2,{header:1,defval:null,raw:true,cellDates:true});
          if(!rows||rows.length<3) return;

          // Detect PPTO monthly format: find header row with month cols
          let hdrIdx=-1;
          let monthCols=[];

          for(let i=0;i<Math.min(rows.length,5);i++){
            const r=rows[i]||[];
            const mcs=[];
            r.forEach((c,ci)=>{
              const lbl=monthLabel(c);
              if(lbl) mcs.push({col:ci,label:lbl,val:c});
            });
            if(mcs.length>=3){hdrIdx=i;monthCols=mcs;break;}
          }

          if(hdrIdx>=0&&monthCols.length>0){
            // PPTO monthly format
            sheets.push(sheetName);
            const hdr=(rows[hdrIdx]||[]);
            // Fixed column positions based on actual file:
            // col1=Tipo Campaña, col2=Acción, col3=PAGADOR, col4=Proveedor, col36=Total
            const iTipo=1,iAccion=2,iPagador=3,iProv=4;
            let iTotalCol=hdr.findIndex((c,i)=>i>5&&String(c||"").toLowerCase().includes("total"));
            if(iTotalCol===-1) iTotalCol=36;

            // Build ISO dates for month cols
            const mColsWithISO=monthCols.map(mc=>{
              const lbl=mc.label;
              const mNames={ene:"01",feb:"02",mar:"03",abr:"04",may:"05",jun:"06",jul:"07",ago:"08",sept:"09",sep:"09",oct:"10",nov:"11",dic:"12"};
              const parts=lbl.split("-");
              const m=mNames[parts[0]]||"01";
              const y=parts[1]&&parts[1].length===2?"20"+parts[1]:parts[1]||"2025";
              return {...mc,iso:y+"-"+m+"-01"};
            });

            const toNum=v=>{if(!v&&v!==0) return 0;if(typeof v==="number") return v;const s=String(v).replace(/^'+/,"").replace(/[^0-9.-]/g,"");return parseFloat(s)||0;};
            const cleanStr=v=>String(v||"").replace(/^'+/,"").trim();
            for(let i=hdrIdx+1;i<rows.length;i++){
              const r=rows[i];if(!r) continue;
              const tipo=cleanStr(r[iTipo]);
              const accion=cleanStr(r[iAccion]);
              if(!tipo&&!accion) continue;
              if(["total","totales","subtotal"].includes(accion.toLowerCase())) continue;
              let total=toNum(r[iTotalCol]);
              if(!total) total=mColsWithISO.reduce((a,mc)=>a+toNum(r[mc.col]),0);
              const monthly=mColsWithISO.map(mc=>({label:mc.label,iso:mc.iso,amount:toNum(r[mc.col])}));
              const activeMeses=monthly.filter(m=>m.amount>0);
              const inicio=activeMeses.length>0?activeMeses[0].iso:"";
              const fin=activeMeses.length>0?activeMeses[activeMeses.length-1].iso:"";
              partidas.push({
                categoria:tipo||"Sin categoria",
                proveedor:cleanStr(r[iProv]),
                accion,detalle:cleanStr(r[iPagador]),
                inicio,fin,total,monthly,
              });
            }
          } else {
            // Lanzamiento format: col0=Proveedor,col1=Tipo,col2=Accion,col3=Detalle,col4=Inicio,col5=Fin,col6=Total
            let hdrL=-1;
            for(let i=0;i<Math.min(rows.length,5);i++){
              const r=(rows[i]||[]).map(c=>String(c||"").toLowerCase().trim());
              if(r.some(c=>c==="proveedor"||c==="tipo campaña"||c==="tipo campana")) {hdrL=i;break;}
            }
            if(hdrL===-1) return;
            sheets.push(sheetName);
            const hdrL2=(rows[hdrL]||[]).map(c=>String(c||"").toLowerCase().trim());
            const fi=(k)=>hdrL2.findIndex(h=>h.includes(k));
            const iP=fi("proveedor"),iT=fi("tipo"),iA=fi("acci"),iD=fi("detall"),iI=fi("inicio"),iF=fi("fin");
            const iTL=hdrL2.findIndex(h=>h.includes("presupuesto total")||h==="total");
            if(iTL===-1) return;
            for(let i=hdrL+1;i<rows.length;i++){
              const r=rows[i];if(!r) continue;
              const ac=String(r[iA>=0?iA:2]||"").trim();
              if(!ac) continue;
              const total=Number(r[iTL])||0;
              partidas.push({
                categoria:String(r[iT>=0?iT:1]||"").trim()||"Sin categoria",
                proveedor:String(r[iP>=0?iP:0]||"").trim(),
                accion:ac,
                detalle:String(r[iD>=0?iD:3]||"").trim(),
                inicio:toISOMkt(r[iI>=0?iI:4]),
                fin:toISOMkt(r[iF>=0?iF:5]),
                total,monthly:[],
              });
            }
          }
        });

        if(!partidas.length){alert("No se encontraron partidas de marketing.");return;}
        upd(activeId,p=>({...p,marketing:{partidas,sheets,importado:new Date().toISOString().split("T")[0]}}));
        alert("OK: "+partidas.length+" partidas importadas");
      }catch(err){alert("Error: "+err.message);}
    };
    reader.readAsBinaryString(file);e.target.value="";
  },[activeId,upd]);

  const confirmBP=useCallback(()=>{
    if(!bpPreview) return;
    const d=bpPreview;
    upd(activeId,p=>{
      const updated={...p};
      if(d.localidad) updated.ubicacion=d.localidad;
      if(d.fechaEntrega) updated.fechaEntrega=d.fechaEntrega;
      if(d.ventasActual) updated.presupuesto=fmtEurM(d.ventasActual);
      if(d.totalGastosActual) updated.costeActual=fmtEurM(d.totalGastosActual);
      updated.bp=d;
      if(d.viviendas&&d.viviendas.length>0) updated.viviendas=d.viviendas;
      updated.ultimaActualizacion=new Date().toISOString().split("T")[0];
      return updated;
    });
    setBpPreview(null);setModal(null);
  },[activeId,bpPreview,upd]);

  const saveResumen=useCallback(()=>{upd(activeId,p=>({...p,resumenSemanal:resumenLocal,ultimaActualizacion:new Date().toISOString().split("T")[0]}));},[activeId,resumenLocal,upd]);

  const today=new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
  const allStats=projects.map(p=>calcStats(p.viviendas||[]));
  const totalU=allStats.reduce((a,s)=>a+s.total,0),totalV=allStats.reduce((a,s)=>a+s.vendidas,0);
  const bloq=projects.filter(p=>p.estado==="bloqueado").length,risk=projects.filter(p=>p.estado==="en-riesgo").length;
  // Master es fuente de verdad cuando existe; si no, usa viviendas standalone
  const activeVivs=proj?(proj.master?masterToVivs(proj.master):(proj.viviendas||[])):[];
  const st=proj?calcStats(activeVivs):{total:0,vendidas:0,reservadas:0,disponibles:0,precioMedio:0,precioMedioParc:0,ingresosTotal:0,ingresosVR:0,totalViv:0,totalParc:0};
  const pct=st.total?Math.round(st.vendidas/st.total*100):0;
  const projEst=proj?(ESTADOS[proj.estado]||ESTADOS.planificacion):null;

  const TABS=[
    {id:"hitos",l:"Hitos"},
    {id:"bp",l:"Business Plan"+(proj&&proj.bp?" OK":"")},
    {id:"viviendas",l:"Viviendas"+(st.total>0?" ("+st.total+")":"")},
    {id:"master",l:"Master Comercial"+(proj&&proj.master?" OK":"")},
    {id:"marketing",l:"Marketing"+(proj&&proj.marketing?" OK":"")},
    {id:"comercial",l:"Comercial"},
    {id:"equipo",l:"Equipo"},
    {id:"blockers",l:"Alertas"+(proj&&proj.blockers.length>0?" ("+proj.blockers.length+")":"")},
    {id:"tareas",l:"Tareas"+(proj&&proj.tareas.filter(t=>!t.done).length>0?" ("+proj.tareas.filter(t=>!t.done).length+")":"")},
    {id:"reporte",l:"Reporte"},
  ];

  if(!loggedIn) return <LoginScreen onLogin={doLogin}/>;

  return (
    <ErrorBoundary>
    <div style={{fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#0d0f14",color:"#e8eaf2",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 32px",borderBottom:"1px solid #252a3a",background:"#141720",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>setView("dashboard")}>
          <span style={{fontWeight:800,fontSize:"1.05rem",color:"#4f8ef7"}}>Overview</span>
          <div style={{width:1,height:16,background:"#252a3a"}}/>
          <span style={{fontSize:"0.73rem",color:"#6b7394"}}>Gestion de promociones inmobiliarias</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(34,211,160,0.08)",border:"1px solid rgba(34,211,160,0.25)",color:"#22d3a0",fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",padding:"4px 10px",borderRadius:20}}>
            <div style={{width:5,height:5,background:"#22d3a0",borderRadius:"50%"}}/>En vivo
          </div>
          <div style={{fontSize:"0.76rem",color:"#6b7394",textTransform:"capitalize"}}>{today}</div>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {view==="dashboard"&&(
          <div style={{padding:"24px 32px",overflowY:"auto",flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div><div style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.03em",marginBottom:3}}>Panel de promociones</div><div style={{fontSize:"0.78rem",color:"#6b7394"}}>Vista consolidada</div></div>
              <Btn onClick={openNewP} v="primary">+ Nueva promocion</Btn>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:26}}>
              {[{label:"Promociones",val:projects.length,color:"#4f8ef7",sub:"activas"},{label:"Unidades en cartera",val:fmtNum(totalU),color:"#e8eaf2",sub:"total registradas"},{label:"Vendidas",val:fmtNum(totalV)+" / "+fmtNum(totalU),color:"#22d3a0",sub:totalU?Math.round(totalV/totalU*100)+"% absorcion":"-"},{label:"Alertas",val:bloq+risk,color:bloq>0?"#f05a5a":risk>0?"#f5c842":"#22d3a0",sub:bloq+" bloqueados / "+risk+" en riesgo"}].map(k=>(
                <div key={k.label} style={{background:"#141720",borderRadius:14,border:"1px solid #252a3a",padding:"18px 22px"}}>
                  <div style={{fontSize:"0.65rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.09em",fontWeight:700,marginBottom:8}}>{k.label}</div>
                  <div style={{fontSize:"1.7rem",fontWeight:800,color:k.color,letterSpacing:"-0.03em",marginBottom:3}}>{k.val}</div>
                  <div style={{fontSize:"0.72rem",color:"#6b7394"}}>{k.sub}</div>
                </div>
              ))}
            </div>
            <div style={{background:"#141720",borderRadius:14,border:"1px solid #252a3a",overflow:"hidden"}}>
              <div style={{padding:"15px 22px",borderBottom:"1px solid #252a3a",fontWeight:800,fontSize:"0.92rem"}}>Todas las promociones</div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 0.8fr 1fr 0.9fr 1.1fr 1.3fr 1fr 50px",padding:"9px 22px",borderBottom:"1px solid #1c2030"}}>
                {["Promocion","Zona","Estado","Hitos","Ventas","Project Owner","Ultima act.",""].map(h=><div key={h} style={{fontSize:"0.62rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em"}}>{h}</div>)}
              </div>
              {projects.map((p,idx)=>{
                const est=ESTADOS[p.estado]||ESTADOS.planificacion;
                const s=calcStats(p.viviendas||[]);
                const hOk=p.hitos.filter(h=>h.estado==="completado").length;
                const pct2=s.total?Math.round(s.vendidas/s.total*100):0;
                const pctW=(p.hitos.length?hOk/p.hitos.length*100:0)+"%";
                return (
                  <div key={p.id} onClick={()=>{setActiveId(p.id);setView("proyecto");setTab("hitos");}} style={{display:"grid",gridTemplateColumns:"2fr 0.8fr 1fr 0.9fr 1.1fr 1.3fr 1fr 50px",padding:"13px 22px",borderBottom:idx<projects.length-1?"1px solid #1c2030":"none",cursor:"pointer"}}
                    onMouseEnter={e=>e.currentTarget.style.background="#1a1e2c"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div><div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:2}}>{p.name}</div><div style={{fontSize:"0.71rem",color:"#6b7394"}}>{p.ubicacion}</div></div>
                    <div style={{fontSize:"0.8rem",color:"#6b7394",alignSelf:"center"}}>{p.zona}</div>
                    <div style={{alignSelf:"center"}}><span style={{fontSize:"0.65rem",fontWeight:700,padding:"3px 8px",borderRadius:8,background:est.bg,color:est.color,textTransform:"uppercase"}}>{est.label}</span></div>
                    <div style={{alignSelf:"center"}}>
                      <div style={{fontSize:"0.82rem",fontWeight:600,marginBottom:4}}>{hOk}/{p.hitos.length}</div>
                      <div style={{height:3,background:"#252a3a",borderRadius:2,width:50,overflow:"hidden"}}><div style={{height:"100%",width:pctW,background:"#4f8ef7",borderRadius:2}}/></div>
                    </div>
                    <div style={{alignSelf:"center"}}><div style={{fontSize:"0.82rem",fontWeight:600,color:pct2>70?"#22d3a0":pct2>40?"#f5c842":"#e8eaf2"}}>{pct2}%</div><div style={{fontSize:"0.7rem",color:"#6b7394"}}>{s.vendidas}/{s.total} uds</div></div>
                    <div style={{alignSelf:"center"}}><div style={{fontWeight:500,fontSize:"0.82rem"}}>{p.projectOwner||"-"}</div><div style={{fontSize:"0.7rem",color:"#6b7394"}}>{p.pmTecnico||"-"}</div></div>
                    <div style={{fontSize:"0.73rem",color:"#6b7394",alignSelf:"center"}}>{p.ultimaActualizacion?fmt(p.ultimaActualizacion):"-"}{p.blockers.length>0&&<div style={{color:"#f05a5a",fontSize:"0.67rem",marginTop:2}}>! {p.blockers.length} alerta</div>}</div>
                    <div style={{alignSelf:"center",textAlign:"right",color:"#6b7394"}}>-&gt;</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view==="proyecto"&&proj&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"18px 32px 0",background:"#0d0f14",borderBottom:"1px solid #252a3a",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                    <button onClick={()=>setView("dashboard")} style={{background:"none",border:"none",color:"#6b7394",cursor:"pointer",fontSize:"0.78rem",padding:0}}>&lt;- Volver</button>
                    <h1 style={{margin:0,fontSize:"1.5rem",fontWeight:800,letterSpacing:"-0.03em"}}>{proj.name}</h1>
                    <span style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 9px",borderRadius:8,background:projEst.bg,color:projEst.color,textTransform:"uppercase"}}>{projEst.label}</span>
                    {proj.bp&&<span style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 9px",borderRadius:8,background:"rgba(124,92,252,0.15)",color:"#a78bfa"}}>BP cargado</span>}
                    <span style={{fontSize:"0.73rem",color:"#6b7394"}}>{proj.ubicacion} - {proj.zona}</span>
                  </div>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    {["PO: "+proj.projectOwner,"PM: "+proj.pmTecnico,"Comercial: "+proj.responsableComercial,"Entrega: "+fmt(proj.fechaEntrega)].map(m=><span key={m} style={{fontSize:"0.75rem",color:"#6b7394"}}>{m}</span>)}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <label style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.3)",color:"#a78bfa",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6}}>
                    {bpImporting?"Cargando...":"Importar BP"}
                    <input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}} disabled={bpImporting}/>
                  </label>
                  <Btn onClick={openEditP} sm>Editar</Btn>
                  <Btn onClick={()=>delP(proj.id)} v="danger" sm>Eliminar</Btn>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
                {[{label:"Total uds",val:st.total?st.numViviendas+"V / "+st.numParcelas+"P":"-"},{label:"Vendidas",val:st.vendidas,color:"#22d3a0"},{label:"Reservadas",val:st.reservadas,color:"#f5c842"},{label:"Absorcion",val:(st.total?Math.round((st.vendidas+st.reservadas)/st.total*100):0)+"%",color:(st.total&&(st.vendidas+st.reservadas)/st.total>0.6)?"#22d3a0":(st.total&&(st.vendidas+st.reservadas)/st.total>0.3)?"#f5c842":"#f05a5a"},{label:"Precio medio VIV",val:fmtEur(st.precioMedio)}].map(k=>(
                  <div key={k.label} style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"10px 14px"}}>
                    <div style={{fontSize:"0.6rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{k.label}</div>
                    <div style={{fontSize:"1.1rem",fontWeight:800,color:k.color||"#e8eaf2"}}>{k.val}</div>
                    {k.sub&&<div style={{fontSize:"0.65rem",color:"#6b7394",marginTop:2}}>{k.sub}</div>}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",overflowX:"auto"}}>
                {TABS.map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:"2px solid "+(tab===t.id?"#4f8ef7":"transparent"),color:tab===t.id?"#e8eaf2":"#6b7394",padding:"9px 14px",cursor:"pointer",fontSize:"0.79rem",fontWeight:tab===t.id?700:400,fontFamily:"inherit",whiteSpace:"nowrap"}}>{t.l}</button>
                ))}
              </div>
            </div>

            <div style={{flex:1,overflowY:"auto",padding:"22px 32px"}}>

              {tab==="hitos"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div><div style={{fontWeight:700,fontSize:"0.92rem"}}>Hitos del proyecto</div><div style={{fontSize:"0.73rem",color:"#6b7394",marginTop:2}}>Arrastra para reordenar - Click en circulo para cambiar estado</div></div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <input value={newHName} onChange={e=>setNewHName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addH();}}} placeholder="Nombre del nuevo hito..." style={{...CSS.inp,width:210}}/>
                      <Btn onClick={addH} sm>+ Anadir</Btn>
                    </div>
                  </div>
                  {proj.hitos.map((h,idx)=>(
                    <HitoRow key={idx} h={h} idx={idx} onCycle={cycleHito} onEdit={openEditH} onDelete={delH} onDragStart={handleDragStart} onDragEnter={handleDragEnter} onDragEnd={handleDragEnd} isDragging={dragIdx===idx} isOver={overIdx===idx&&dragIdx!==idx}/>
                  ))}
                  <div style={{display:"flex",gap:14,marginTop:16,flexWrap:"wrap"}}>
                    {Object.entries(HITO_EST).map(([k,v])=>(
                      <div key={k} style={{display:"flex",alignItems:"center",gap:5,fontSize:"0.71rem",color:v.color}}><div style={{width:7,height:7,borderRadius:"50%",background:v.color}}/>{k}</div>
                    ))}
                  </div>
                </div>
              )}

              {tab==="bp"&&(
                <div>
                  {!proj.bp?(
                    <div style={{textAlign:"center",padding:"60px 20px",color:"#6b7394",background:"#141720",borderRadius:12,border:"1px solid #252a3a"}}>
                      <div style={{fontSize:"3rem",marginBottom:12}}>BP</div>
                      <div style={{fontWeight:700,fontSize:"1.1rem",color:"#e8eaf2",marginBottom:8}}>Business Plan no cargado</div>
                      <div style={{fontSize:"0.84rem",marginBottom:24}}>Importa el archivo .xlsm de monitoring para ver todos los KPIs financieros</div>
                      <label style={{background:"#a78bfa",color:"#fff",borderRadius:8,padding:"10px 22px",cursor:"pointer",fontSize:"0.88rem",fontWeight:700}}>
                        Importar Business Plan (.xlsm)
                        <input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}}/>
                      </label>
                    </div>
                  ):(()=>{
                    const d=proj.bp;
                    return (
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                          <div><div style={{fontWeight:800,fontSize:"0.95rem"}}>Business Plan - {proj.name}</div><div style={{fontSize:"0.73rem",color:"#6b7394",marginTop:2}}>Actualizado: {fmt(proj.ultimaActualizacion)}</div></div>
                          <label style={{background:"transparent",border:"1px solid rgba(167,139,250,0.4)",color:"#a78bfa",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,display:"inline-flex",alignItems:"center",gap:5}}>
                            Actualizar BP<input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}}/>
                          </label>
                        </div>
                        {d.negocios&&d.negocios.length>0&&(
                          <div style={{background:"rgba(167,139,250,0.08)",border:"1px solid rgba(167,139,250,0.2)",borderRadius:12,padding:"14px 18px",marginBottom:16}}>
                            <div style={{fontSize:"0.72rem",color:"#a78bfa",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Proyecto multi-negocio - {d.negocios.length} lineas de negocio</div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat("+d.negocios.length+",1fr)",gap:10}}>
                              {d.negocios.map((neg,ni)=>(
                                <div key={ni} style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"12px 14px"}}>
                                  <div style={{fontWeight:700,fontSize:"0.88rem",color:"#a78bfa",marginBottom:8}}>{neg.nombre}</div>
                                  {[{l:"Unidades",v:neg.numViviendas||"-"},{l:"Ventas",v:fmtEurM(neg.ventasActual)},{l:"Beneficio",v:fmtEurM(neg.beneficioActual),c:neg.beneficioActual>0?"#22d3a0":"#f05a5a"},{l:"TIR",v:fmtPct(neg.tirActual),c:neg.tirActual>0.15?"#22d3a0":"#f5c842"},{l:"MgV",v:fmtPct(neg.mgvActual)},{l:"Fondos propios",v:fmtEurM(neg.fondosPropios)},{l:"Comercializacion",v:fmtEurM(neg.comercialActual)}].map(x=>(
                                    <div key={x.l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",marginBottom:4}}>
                                      <span style={{color:"#6b7394"}}>{x.l}</span>
                                      <span style={{fontWeight:600,color:x.c||"#e8eaf2"}}>{x.v}</span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px 20px",marginBottom:16}}>
                          <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em"}}>Datos del proyecto</div>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                            {[{l:"Viviendas",v:d.numViviendas||"-"},{l:"Edificabilidad",v:d.edificabilidad?fmtNum(d.edificabilidad)+" m2":"-"},{l:"Duracion obra",v:d.duracionObra?d.duracionObra+" meses":"-"},{l:"Inicio obra",v:fmt(d.fechaInicioObra)},{l:"Licencia",v:fmt(d.fechaLicencia)},{l:"Escritura",v:fmt(d.fechaEntrega)},{l:"Fondos propios",v:fmtEurM(d.fondosPropios)},{l:"Duracion total",v:d.duracionMeses?d.duracionMeses+" meses":"-"}].map(x=>(
                              <div key={x.l}><div style={{fontSize:"0.62rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{x.l}</div><div style={{fontWeight:600,fontSize:"0.9rem"}}>{x.v}</div></div>
                            ))}
                          </div>
                        </div>
                        <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px 20px",marginBottom:16}}>
                          <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em"}}>P&amp;L - Base vs Actual</div>
                          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:0,borderRadius:8,overflow:"hidden",border:"1px solid #252a3a"}}>
                            {["Concepto","BP Base","BP Actual","Diferencia"].map(h=><div key={h} style={{fontSize:"0.65rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",padding:"8px 12px",background:"#1c2030",borderBottom:"1px solid #252a3a"}}>{h}</div>)}
                            {[{label:"Ventas (GDV)",prev:d.ventasPrev,actual:d.ventasActual,pos:true},{label:"Compra suelo",prev:d.sueloPrev,actual:d.sueloActual},{label:"Hard Cost (construccion)",prev:d.hardPrev,actual:d.hardActual},{label:"Soft Cost (honorarios)",prev:d.softPrev,actual:d.softActual},{label:"Gastos financieros",prev:d.financieroPrev,actual:d.financieroActual},{label:"Comercializacion",prev:d.comercialPrev,actual:d.comercialActual},{label:"Total gastos",prev:d.totalGastosPrev,actual:d.totalGastosActual,bold:true},{label:"Resultado / Beneficio",prev:d.beneficioPrev,actual:d.beneficioActual,bold:true,pos:true}].map((row,i)=>{
                              const diff=(row.actual||0)-(row.prev||0);
                              const dc=row.pos?(diff>=0?"#22d3a0":"#f05a5a"):(diff<=0?"#22d3a0":"#f05a5a");
                              const bg=row.bold?"#1a1e2c":"transparent";
                              return [
                                <div key={i+"a"} style={{padding:"9px 12px",borderBottom:"1px solid #1c2030",fontSize:"0.82rem",fontWeight:row.bold?700:400,background:bg}}>{row.label}</div>,
                                <div key={i+"b"} style={{padding:"9px 12px",borderBottom:"1px solid #1c2030",fontSize:"0.82rem",color:"#6b7394",background:bg}}>{fmtEurM(row.prev)}</div>,
                                <div key={i+"c"} style={{padding:"9px 12px",borderBottom:"1px solid #1c2030",fontSize:"0.82rem",fontWeight:row.bold?700:400,background:bg}}>{fmtEurM(row.actual)}</div>,
                                <div key={i+"d"} style={{padding:"9px 12px",borderBottom:"1px solid #1c2030",fontSize:"0.82rem",fontWeight:600,color:diff!==0?dc:"#6b7394",background:bg}}>{diff!==0?(diff>0?"+":"")+fmtEurM(diff):"-"}</div>,
                              ];
                            })}
                          </div>
                        </div>
                        <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px 20px",marginBottom:16}}>
                          <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em"}}>KPIs de rentabilidad</div>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                            <KpiCard label="TIR pretax" val={fmtPct(d.tirActual||d.irr)} prev={fmtPct(d.tirPrev)} color={(d.tirActual||d.irr)>0.15?"#22d3a0":"#f5c842"}/>
                            <KpiCard label="TIR post-tax" val={fmtPct(d.tirPostActual)} color={d.tirPostActual>0.12?"#22d3a0":"#f5c842"}/>
                            <KpiCard label="Margen sobre ventas" val={fmtPct(d.mgvActual)} prev={fmtPct(d.mgvPrev)} color={d.mgvActual>0.12?"#22d3a0":"#f5c842"}/>
                            <KpiCard label="Mom (pretax)" val={d.momActual?d.momActual.toFixed(2)+"x":"-"} color="#4f8ef7"/>
                            <KpiCard label="Beneficio total" val={fmtEurM(d.beneficioActual||d.netProfit)} prev={fmtEurM(d.beneficioPrev)} color="#22d3a0"/>
                            <KpiCard label="ROE (Bfcio/FFPP)" val={d.roeActual?d.roeActual.toFixed(2)+"x":"-"} color="#4f8ef7"/>
                            <KpiCard label="REI" val={d.reiActual?fmtPct(d.reiActual):"-"} color="#f5c842"/>
                            <KpiCard label="Fondos propios" val={fmtEurM(d.fondosPropios||d.equityAmount)} color="#f5c842"/>
                            <KpiCard label="GDV (ventas totales)" val={fmtEurM(d.ventasActual||d.gdv)} color="#e8eaf2"/>
                            <KpiCard label="Total costes" val={fmtEurM(d.totalGastosActual||d.gdc)} color="#e8eaf2"/>
                            <KpiCard label="Hard Cost" val={fmtEurM(d.hardActual)} color="#e8eaf2"/>
                            <KpiCard label="Comercializacion" val={fmtEurM(d.comercialActual)} color="#4f8ef7"/>
                          </div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                          <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 18px"}}>
                            <div style={{fontWeight:700,fontSize:"0.84rem",marginBottom:12,color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em"}}>Fuentes de financiacion</div>
                            {[{l:"Equity / Fondos propios",v:d.fondosPropios||d.equityAmount,c:"#4f8ef7"},{l:"Prestamo promotor",v:d.prestamo,c:"#f5c842"},{l:"Ingresos compradores",v:d.dineroCO,c:"#22d3a0"}].map(x=>(
                              <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #252a3a"}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:x.c,flexShrink:0}}/><span style={{fontSize:"0.82rem"}}>{x.l}</span></div>
                                <span style={{fontSize:"0.82rem",fontWeight:600,color:x.c}}>{fmtEurM(x.v)}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 18px"}}>
                            <div style={{fontWeight:700,fontSize:"0.84rem",marginBottom:12,color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em"}}>Usos (costes)</div>
                            {[{l:"Adquisicion suelo",v:d.sueloActual,c:"#f05a5a"},{l:"Hard Cost (construccion)",v:d.hardActual,c:"#f5924e"},{l:"Soft Cost (honorarios)",v:d.softActual,c:"#f5c842"},{l:"Comercializacion",v:d.comercialActual,c:"#4f8ef7"},{l:"Gastos financieros",v:d.financieroActual,c:"#6b7394"}].map(x=>(
                              <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #252a3a"}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:x.c,flexShrink:0}}/><span style={{fontSize:"0.82rem"}}>{x.l}</span></div>
                                <span style={{fontSize:"0.82rem",fontWeight:600}}>{fmtEurM(x.v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {tab==="viviendas"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div><div style={{fontWeight:700,fontSize:"0.92rem"}}>Tabla de viviendas</div><div style={{fontSize:"0.73rem",color:"#6b7394",marginTop:2}}>Click en estado para cambiarlo</div></div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      {activeVivs.length>0&&!proj.master&&<Btn onClick={clearViv} v="danger" sm>Limpiar</Btn>}
                      <label style={{background:"transparent",border:"1px solid rgba(167,139,250,0.4)",color:"#a78bfa",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5}}>
                        Desde BP<input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}}/>
                      </label>
                      <label style={{background:"transparent",border:"1px solid #4f8ef7",color:"#4f8ef7",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5}}>
                        Lista precios<input type="file" accept=".xlsx,.xls,.csv" onChange={handleVivFile} style={{display:"none"}}/>
                      </label>
                      <Btn onClick={openNewV} sm>+ Anadir</Btn>
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
                  {activeVivs.length===0?(
                    <div style={{textAlign:"center",padding:"50px 20px",color:"#6b7394",background:"#141720",borderRadius:12,border:"1px solid #252a3a"}}>
                      <div style={{fontSize:"2.5rem",marginBottom:10}}>[]</div>
                      <div style={{fontWeight:600,marginBottom:4,color:"#e8eaf2"}}>No hay viviendas cargadas</div>
                      <div style={{fontSize:"0.8rem",marginBottom:20}}>Importa desde el BP o desde una lista de precios Excel</div>
                    </div>
                  ):(
                    <div>
                      <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",overflow:"hidden",marginBottom:12}}>
                        <div style={{display:"grid",gridTemplateColumns:"0.7fr 1fr 1fr 0.7fr 1.2fr 1.1fr 1.4fr 70px",padding:"8px 16px",borderBottom:"1px solid #252a3a"}}>
                          {["Ref","Tipologia","Tipo","m2","Precio PVP","Estado","Notas",""].map(h=><div key={h} style={{fontSize:"0.62rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>)}
                        </div>
                        {activeVivs.map((v,i)=>{
                          const vs=VIV_ESTADOS[v.estado]||VIV_ESTADOS.disponible;
                          return (
                            <div key={v.id} style={{display:"grid",gridTemplateColumns:"0.7fr 1fr 1fr 0.7fr 1.2fr 1.1fr 1.4fr 70px",padding:"10px 16px",borderBottom:i<activeVivs.length-1?"1px solid #1c2030":"none",alignItems:"center"}}
                              onMouseEnter={e=>e.currentTarget.style.background="#1a1e2c"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <div style={{fontWeight:600,fontSize:"0.84rem"}}>{v.ref}</div>
                              <div style={{fontSize:"0.82rem"}}>{v.tipologia||"-"}</div>
                              <div style={{fontSize:"0.78rem",color:"#6b7394"}}>{v.planta||"-"}</div>
                              <div style={{fontSize:"0.78rem",color:"#6b7394"}}>{v.superficie?v.superficie+"m2":"-"}</div>
                              <div style={{fontSize:"0.88rem",fontWeight:700}}>{fmtEur(v.precio)}</div>
                              <div><span onClick={()=>cycleViv(v.id)} style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 8px",borderRadius:8,background:vs.color+"18",color:vs.color,cursor:"pointer",border:"1px solid "+vs.color+"35",textTransform:"uppercase"}}>{vs.label}</span></div>
                              <div style={{fontSize:"0.72rem",color:"#6b7394",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={v.notas}>{v.notas||"-"}</div>
                              <div style={{display:"flex",gap:4}}><Btn onClick={()=>openEditV(v)} sm>edit</Btn><Btn onClick={()=>delV(v.id)} v="danger" sm>x</Btn></div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"14px 18px",display:"flex",gap:28,flexWrap:"wrap"}}>
                        {[{l:"Precio medio viviendas",v:fmtEur(st.precioMedio)},{l:"Precio medio parcelas",v:fmtEur(st.precioMedioParcela)},{l:"Ingresos potenciales",v:fmtEur(st.ingresosTotal)},{l:"Ingresos asegurados",v:fmtEur(st.ingresosVR),c:"#22d3a0"}].map(x=>(
                          <div key={x.l}><div style={{fontSize:"0.62rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{x.l}</div><div style={{fontWeight:700,color:x.c||"#e8eaf2"}}>{x.v}</div></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab==="master"&&(
                <div>
                  <MasterTab
                    proj={proj}
                    activeId={activeId}
                    upd={upd}
                    handleMasterFile={handleMasterFile}
                    fmt={fmt}
                    fmtEur={fmtEur}
                    VIV_ESTADOS={VIV_ESTADOS}
                  />
                </div>
              )}

              {tab==="marketing"&&(
                <div>
                  {!proj.marketing?(
                    <div style={{textAlign:"center",padding:"50px 20px",color:"#6b7394",background:"#141720",borderRadius:12,border:"1px solid #252a3a"}}>
                      <div style={{fontSize:"2.5rem",marginBottom:10}}>MK</div>
                      <div style={{fontWeight:700,fontSize:"1rem",color:"#e8eaf2",marginBottom:6}}>Sin planificacion de marketing</div>
                      <div style={{fontSize:"0.8rem",marginBottom:20}}>
                        {proj.bp&&proj.bp.comercialActual?(
                          <span>Presupuesto del BP disponible: <strong style={{color:"#22d3a0"}}>{fmtEur(proj.bp.comercialActual)}</strong></span>
                        ):"Importa primero el BP para ver el presupuesto disponible."}
                      </div>
                      <label style={{background:"#4f8ef7",color:"#fff",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:"0.85rem",fontWeight:700}}>
                        Importar planificacion de marketing (.xlsx)
                        <input type="file" accept=".xlsx,.xls" onChange={handleMktFile} style={{display:"none"}}/>
                      </label>
                    </div>
                  ):(()=>{
                    const mkt=proj.marketing;
                    const presupuestoBP=(proj.bp&&(proj.bp.mktBudget||proj.bp.comercialActual))||0;
                    const totalPlanificado=mkt.partidas.reduce((a,p)=>a+p.total,0);
                    const pctUsado=presupuestoBP>0?Math.min(100,Math.round(totalPlanificado/presupuestoBP*100)):0;
                    const restante=presupuestoBP-totalPlanificado;
                    const byCat={};
                    mkt.partidas.forEach(p=>{if(!byCat[p.categoria]) byCat[p.categoria]={total:0,items:[]};byCat[p.categoria].total+=p.total;byCat[p.categoria].items.push(p);});
                    return (
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                          <div><div style={{fontWeight:700,fontSize:"0.95rem"}}>Planificacion de Marketing - {proj.name}</div><div style={{fontSize:"0.73rem",color:"#6b7394",marginTop:2}}>{mkt.partidas.length} partidas</div></div>
                          <div style={{display:"flex",gap:8}}>
                            <label style={{background:"transparent",border:"1px solid #4f8ef7",color:"#4f8ef7",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700}}>
                              Actualizar<input type="file" accept=".xlsx,.xls" onChange={handleMktFile} style={{display:"none"}}/>
                            </label>
                            <button onClick={()=>upd(activeId,p=>({...p,marketing:null}))} style={{background:"transparent",border:"1px solid rgba(240,90,90,0.3)",color:"#f05a5a",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:600,fontFamily:"inherit"}}>Borrar</button>
                          </div>
                        </div>
                        <div style={{background:presupuestoBP>0?"rgba(34,211,160,0.07)":"rgba(79,142,247,0.07)",border:"1px solid "+(presupuestoBP>0?"rgba(34,211,160,0.25)":"rgba(79,142,247,0.2)"),borderRadius:12,padding:"14px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{fontSize:"1.5rem"}}>EUR</div>
                            <div>
                              <div style={{fontSize:"0.7rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Presupuesto destinado a Marketing (Comercializacion BP)</div>
                              <div style={{fontSize:"1.6rem",fontWeight:800,color:presupuestoBP>0?"#22d3a0":"#6b7394",letterSpacing:"-0.02em"}}>{presupuestoBP>0?fmtEur(presupuestoBP):"Sin BP cargado"}</div>
                              {presupuestoBP>0&&<div style={{fontSize:"0.75rem",color:"#6b7394",marginTop:2}}>Extraido automaticamente del Business Plan</div>}
                            </div>
                          </div>
                          {!presupuestoBP&&<div style={{fontSize:"0.78rem",color:"#4f8ef7"}}>Importa el BP para ver el presupuesto</div>}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
                          <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"14px 16px"}}>
                            <div style={{fontSize:"0.62rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>Total planificado</div>
                            <div style={{fontSize:"1.3rem",fontWeight:800,color:"#4f8ef7"}}>{fmtEur(totalPlanificado)}</div>
                            <div style={{fontSize:"0.7rem",color:"#6b7394",marginTop:2}}>{mkt.partidas.length} partidas</div>
                          </div>
                          <div style={{background:"#141720",borderRadius:12,border:"1px solid "+(restante<0?"rgba(240,90,90,0.3)":"#252a3a"),padding:"14px 16px"}}>
                            <div style={{fontSize:"0.62rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>Restante disponible</div>
                            <div style={{fontSize:"1.3rem",fontWeight:800,color:presupuestoBP===0?"#6b7394":restante<0?"#f05a5a":"#22d3a0"}}>{presupuestoBP>0?fmtEur(restante):"-"}</div>
                            {presupuestoBP>0&&<div style={{fontSize:"0.7rem",color:restante<0?"#f05a5a":"#6b7394",marginTop:2}}>{restante<0?"Excedido":"Disponible"}</div>}
                          </div>
                          <div style={{background:"#141720",borderRadius:12,border:"1px solid "+(pctUsado>100?"rgba(240,90,90,0.3)":pctUsado>80?"rgba(245,200,66,0.3)":"#252a3a"),padding:"14px 16px"}}>
                            <div style={{fontSize:"0.62rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>% del presupuesto usado</div>
                            <div style={{fontSize:"1.3rem",fontWeight:800,color:pctUsado>100?"#f05a5a":pctUsado>80?"#f5c842":"#22d3a0"}}>{presupuestoBP>0?pctUsado+"%":"-"}</div>
                            {presupuestoBP>0&&<div style={{fontSize:"0.7rem",color:"#6b7394",marginTop:2}}>{fmtEur(totalPlanificado)} de {fmtEur(presupuestoBP)}</div>}
                          </div>
                        </div>
                        {presupuestoBP>0&&(
                          <div style={{background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"14px 18px",marginBottom:16}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:"0.78rem",color:"#6b7394"}}>Gasto vs presupuesto BP</span><span style={{fontSize:"0.82rem",fontWeight:700,color:pctUsado>100?"#f05a5a":pctUsado>80?"#f5c842":"#22d3a0"}}>{fmtEur(totalPlanificado)} / {fmtEur(presupuestoBP)}</span></div>
                            <div style={{height:10,background:"#1c2030",borderRadius:5,overflow:"hidden"}}><div style={{height:"100%",width:Math.min(pctUsado,100)+"%",background:pctUsado>100?"#f05a5a":pctUsado>80?"#f5c842":"#4f8ef7",borderRadius:5}}/></div>
                          </div>
                        )}
                        {/* Monthly timeline view if PPTO data available */}
                        {(()=>{
                          const hasMensual=mkt.partidas.some(p=>p.monthly&&p.monthly.length>0);
                          if(hasMensual){
                            // Build sorted unique month list
                            const allMeses={};
                            mkt.partidas.forEach(p=>(p.monthly||[]).forEach(m=>{if(m.amount>0) allMeses[m.iso]=m.label;}));
                            const mesesSorted=Object.keys(allMeses).sort().map(iso=>({iso,label:allMeses[iso]}));
                            return (
                              <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",overflow:"hidden"}}>
                                <div style={{padding:"12px 18px",borderBottom:"1px solid #252a3a",fontWeight:700,fontSize:"0.86rem",display:"flex",justifyContent:"space-between"}}>
                                  <span>Planificacion mensual</span>
                                  <span style={{fontSize:"0.72rem",color:"#6b7394",fontWeight:400}}>{mesesSorted.length} meses activos</span>
                                </div>
                                <div style={{overflowX:"auto"}}>
                                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.75rem",minWidth:800}}>
                                    <thead>
                                      <tr style={{background:"#1c2030"}}>
                                        <th style={{textAlign:"left",padding:"8px 14px",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",position:"sticky",left:0,background:"#1c2030",minWidth:180}}>Tipo Campana</th>
                                        <th style={{textAlign:"left",padding:"8px 10px",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",minWidth:160}}>Accion / Proveedor</th>
                                        <th style={{textAlign:"right",padding:"8px 10px",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",minWidth:80}}>Total</th>
                                        {mesesSorted.map(m=>(
                                          <th key={m.iso} style={{textAlign:"right",padding:"8px 8px",color:"#4f8ef7",fontWeight:700,minWidth:70,whiteSpace:"nowrap"}}>{m.label}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(byCat).map(([cat,data])=>{
                                        const catTotal=data.items.reduce((a,it)=>a+(it.total||0),0);
                                        const catByMes={};
                                        data.items.forEach(it=>(it.monthly||[]).forEach(m=>{catByMes[m.iso]=(catByMes[m.iso]||0)+m.amount;}));
                                        return [
                                          // Categoria header row con totales
                                          <tr key={cat+"_hdr"} style={{background:"#1a1e2c",borderBottom:"2px solid #252a3a"}}>
                                            <td style={{padding:"8px 14px",fontWeight:700,color:"#a78bfa",fontSize:"0.8rem"}}>{cat}</td>
                                            <td style={{padding:"8px 10px",fontSize:"0.72rem",color:"#6b7394"}}>{data.items.length} partidas</td>
                                            <td style={{textAlign:"right",padding:"8px 10px",fontWeight:700,color:"#a78bfa"}}>{fmtEur(catTotal)}</td>
                                            {mesesSorted.map(m=>(
                                              <td key={m.iso} style={{textAlign:"right",padding:"8px 8px",color:catByMes[m.iso]?"#a78bfa":"#252a3a",fontWeight:600,fontSize:"0.72rem"}}>
                                                {catByMes[m.iso]?fmtEur(catByMes[m.iso]):"-"}
                                              </td>
                                            ))}
                                          </tr>,
                                          // Filas de detalle
                                          ...data.items.map((item,ii)=>{
                                            const byMes={};(item.monthly||[]).forEach(m=>{byMes[m.iso]=m.amount;});
                                            return (
                                              <tr key={cat+ii} style={{borderBottom:"1px solid #1c2030"}}
                                                onMouseEnter={e=>e.currentTarget.style.background="#1c2030"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                                <td style={{padding:"6px 14px 6px 24px",color:"#6b7394",fontSize:"0.72rem"}}>
                                                  {cat}
                                                </td>
                                                <td style={{padding:"6px 10px"}}>
                                                  <div style={{fontWeight:500,fontSize:"0.78rem"}}>{item.accion}</div>
                                                  {item.proveedor&&<div style={{fontSize:"0.67rem",color:"#6b7394",marginTop:1}}>{item.proveedor}</div>}
                                                </td>
                                                <td style={{textAlign:"right",padding:"6px 10px",fontWeight:600,color:"#4f8ef7",whiteSpace:"nowrap",fontSize:"0.78rem"}}>{fmtEur(item.total)}</td>
                                                {mesesSorted.map(m=>(
                                                  <td key={m.iso} style={{textAlign:"right",padding:"6px 8px",color:byMes[m.iso]?"#22d3a0":"#252a3a",fontWeight:byMes[m.iso]?600:400,fontSize:"0.75rem"}}>
                                                    {byMes[m.iso]?fmtEur(byMes[m.iso]):"-"}
                                                  </td>
                                                ))}
                                              </tr>
                                            );
                                          })
                                        ];
                                      })}
                                      <tr style={{background:"#1c2030",fontWeight:700,borderTop:"2px solid #252a3a"}}>
                                        <td colSpan={2} style={{padding:"8px 14px",color:"#e8eaf2"}}>TOTAL</td>
                                        <td style={{textAlign:"right",padding:"8px 10px",color:"#4f8ef7"}}>{fmtEur(totalPlanificado)}</td>
                                        {mesesSorted.map(m=>{
                                          const tot=mkt.partidas.reduce((a,p)=>a+((p.monthly||[]).find(mm=>mm.iso===m.iso)?((p.monthly||[]).find(mm=>mm.iso===m.iso).amount):0),0);
                                          return <td key={m.iso} style={{textAlign:"right",padding:"8px 8px",color:tot>0?"#f5c842":"#252a3a",fontWeight:600}}>{tot>0?fmtEur(tot):"-"}</td>;
                                        })}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          }
                          // Fallback: simple list view (Lanzamiento format)
                          return (
                            <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",overflow:"hidden"}}>
                              <div style={{padding:"12px 18px",borderBottom:"1px solid #252a3a",fontWeight:700,fontSize:"0.86rem"}}>Por categoria</div>
                              {Object.entries(byCat).map(([cat,data],ci)=>(
                                <div key={cat} style={{borderBottom:ci<Object.keys(byCat).length-1?"1px solid #1c2030":"none"}}>
                                  <div style={{display:"grid",gridTemplateColumns:"1.8fr 0.8fr 1.2fr",padding:"10px 18px",background:"#1a1e2c",alignItems:"center"}}>
                                    <div style={{fontWeight:600,fontSize:"0.84rem"}}>{cat}</div>
                                    <div style={{fontSize:"0.82rem",fontWeight:700,color:"#4f8ef7"}}>{fmtEur(data.total)}</div>
                                    <div style={{fontSize:"0.75rem",color:"#6b7394"}}>{data.items.length} partidas</div>
                                  </div>
                                  {data.items.map((item,ii)=>(
                                    <div key={ii} style={{display:"grid",gridTemplateColumns:"1.8fr 0.8fr 1.2fr",padding:"7px 18px 7px 32px",borderTop:"1px solid #1c2030",alignItems:"center"}}
                                      onMouseEnter={e=>e.currentTarget.style.background="#1c2030"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                      <div>
                                        <div style={{fontSize:"0.8rem"}}>{item.accion}{item.detalle?" - "+item.detalle:""}</div>
                                        {item.proveedor&&<div style={{fontSize:"0.7rem",color:"#6b7394",marginTop:1}}>{item.proveedor}</div>}
                                      </div>
                                      <div style={{fontSize:"0.8rem",fontWeight:600}}>{fmtEur(item.total)}</div>
                                      <div style={{fontSize:"0.72rem",color:"#6b7394"}}>{item.inicio||item.fin?((!item.inicio||!item.fin)?fmt(item.inicio||item.fin):(fmt(item.inicio)+" - "+fmt(item.fin))):"-"}</div>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>
              )}

              {tab==="comercial"&&(()=>{
                const m=proj.master;
                const absorcionPct=st.total?Math.round((st.vendidas+st.reservadas)/st.total*100):0;
                const absorcionColor=absorcionPct>60?"#22d3a0":absorcionPct>30?"#f5c842":"#f05a5a";
                // Master-derived metrics
                const ingresosCom=m?m.ventas.filter(v=>v.status==="reservada"||v.status==="vendida").reduce((a,v)=>a+v.precio,0):st.ingresosVR;
                const comisionTotal=m?m.ventas.reduce((a,v)=>a+(v.comision||0),0):0;
                const rescisiones=m?m.rescisiones.length:0;
                const conRepricing=m?m.ventas.filter(v=>v.incremento>0):[];
                const incrementoMedio=conRepricing.length?Math.round(conRepricing.reduce((a,v)=>a+v.incremento,0)/conRepricing.length):0;
                // Agencias breakdown
                const agencias={};
                if(m) m.ventas.filter(v=>v.agencia&&(v.status==="reservada"||v.status==="vendida")).forEach(v=>{agencias[v.agencia]=(agencias[v.agencia]||0)+1;});
                const agList=Object.entries(agencias).sort((a,b)=>b[1]-a[1]);
                return (
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:18}}>Metricas comerciales{m?" - datos del Master Comercial":""}</div>

                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
                      {[
                        {label:"Total unidades",val:st.total||0},
                        {label:"Reservadas",val:st.reservadas,color:"#f5c842"},
                        {label:"Escrituradas/Vendidas",val:st.vendidas,color:"#22d3a0"},
                        {label:"Disponibles",val:st.disponibles,color:"#4f8ef7"},
                        {label:"Precio medio VIV",val:fmtEur(st.precioMedio),sub:st.precioMedioParc?"Parcelas: "+fmtEur(st.precioMedioParc):""},
                        {label:"Ingresos comprometidos",val:fmtEur(ingresosCom),color:"#22d3a0"},
                        {label:"Rescisiones",val:rescisiones,color:rescisiones>0?"#f05a5a":"#6b7394"},
                        {label:"Incremento medio repricing",val:incrementoMedio>0?fmtEur(incrementoMedio):"-",color:"#f5c842"},
                      ].map(k=>(
                        <div key={k.label} style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"14px 16px"}}>
                          <div style={{fontSize:"0.62rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:6}}>{k.label}</div>
                          <div style={{fontSize:"1.25rem",fontWeight:800,color:k.color||"#e8eaf2"}}>{k.val}</div>
                          {k.sub&&<div style={{fontSize:"0.68rem",color:"#6b7394",marginTop:3}}>{k.sub}</div>}
                        </div>
                      ))}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                      <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 20px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
                          <span style={{fontSize:"0.78rem",color:"#6b7394",fontWeight:500}}>Absorcion (reservadas + vendidas)</span>
                          <span style={{fontSize:"0.92rem",fontWeight:800,color:absorcionColor}}>{absorcionPct}%</span>
                        </div>
                        <div style={{height:10,background:"#1c2030",borderRadius:5,overflow:"hidden",marginBottom:10}}>
                          <div style={{height:"100%",width:absorcionPct+"%",background:absorcionColor,borderRadius:5}}/>
                        </div>
                        <div style={{display:"flex",gap:16,fontSize:"0.75rem",color:"#6b7394"}}>
                          <span style={{color:"#f5c842"}}>{st.reservadas} reservadas</span>
                          <span style={{color:"#22d3a0"}}>{st.vendidas} escrituradas</span>
                          <span style={{color:"#4f8ef7"}}>{st.disponibles} disponibles</span>
                        </div>
                      </div>

                      <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 20px"}}>
                        <div style={{fontSize:"0.72rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>Financiero</div>
                        {[
                          {l:"Ingresos potenciales totales",v:fmtEur(st.ingresosTotal)},
                          {l:"Ingresos comprometidos",v:fmtEur(ingresosCom),c:"#22d3a0"},
                          {l:"Comisiones totales",v:fmtEur(comisionTotal),c:"#f5924e"},
                          {l:"Presupuesto proyecto",v:proj.presupuesto||"-"},
                          {l:"Comercializadora",v:proj.comercializadora||"-"},
                          {l:"Entrega prevista",v:fmt(proj.fechaEntrega)},
                        ].map(f=>(
                          <div key={f.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #1c2030",fontSize:"0.8rem"}}>
                            <span style={{color:"#6b7394"}}>{f.l}</span>
                            <span style={{fontWeight:600,color:f.c||"#e8eaf2"}}>{f.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {agList.length>0&&(
                      <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"16px 20px"}}>
                        <div style={{fontSize:"0.72rem",color:"#6b7394",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Ventas por agencia</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                          {agList.map(([ag,n])=>{
                            const pctAg=st.reservadas+st.vendidas>0?Math.round(n/(st.reservadas+st.vendidas)*100):0;
                            return (
                              <div key={ag} style={{background:"#1c2030",borderRadius:8,padding:"10px 12px"}}>
                                <div style={{fontSize:"0.78rem",fontWeight:600,marginBottom:4}}>{ag||"Directa"}</div>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <span style={{fontSize:"1rem",fontWeight:800,color:"#4f8ef7"}}>{n}</span>
                                  <span style={{fontSize:"0.72rem",color:"#6b7394"}}>{pctAg}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {tab==="equipo"&&(
                <div>
                  <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:18}}>Estructura de equipo - {proj.name}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
                    {[{rol:"Project Owner (Overview)",persona:proj.projectOwner,desc:"Responsable global. Coordinacion transversal, decisiones clave.",color:"#4f8ef7"},{rol:"PM Tecnico (BSA)",persona:proj.pmTecnico,desc:"Proyecto, obra, licencias. Exclusivamente tecnico.",color:"#22d3a0"},{rol:"Responsable Comercial",persona:proj.responsableComercial,desc:"Pricing, estrategia, posicionamiento, direccion comercializadora.",color:"#f5c842"},{rol:"Comercializadora",persona:proj.comercializadora||"Sin asignar",desc:"Ejecucion ventas, atencion leads, reporte semanal.",color:"#f5924e"}].map(r=>(
                      <div key={r.rol} style={{background:"#141720",borderRadius:12,border:"1px solid "+r.color+"20",padding:"17px 19px"}}>
                        <div style={{fontSize:"0.62rem",color:r.color,textTransform:"uppercase",letterSpacing:"0.09em",fontWeight:700,marginBottom:7}}>{r.rol}</div>
                        <div style={{fontWeight:700,fontSize:"0.98rem",marginBottom:7}}>{r.persona||"-"}</div>
                        <div style={{fontSize:"0.74rem",color:"#6b7394",lineHeight:1.55}}>{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab==="blockers"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontWeight:700,fontSize:"0.92rem"}}>Alertas y bloqueos</div><Btn onClick={openNewB} sm>+ Anadir</Btn></div>
                  {proj.blockers.length===0&&(
                    <div style={{padding:"18px",color:"#22d3a0",fontSize:"0.86rem",background:"rgba(34,211,160,0.05)",borderRadius:12,border:"1px solid rgba(34,211,160,0.2)"}}>Sin bloqueos activos</div>
                  )}
                  {proj.blockers.map((b,i)=>{
                    const bs=BLOCK_ST[b.tipo]||BLOCK_ST.info;
                    return (
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:13,background:bs.bg,borderRadius:12,border:"1px solid "+bs.border,padding:"15px 18px",marginBottom:9}}>
                        <div style={{fontSize:"1.15rem",flexShrink:0,marginTop:2}}>{bs.icon}</div>
                        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:4}}>{b.titulo}</div><div style={{fontSize:"0.77rem",color:"#6b7394",marginBottom:5}}>{b.desc}</div><div style={{fontSize:"0.71rem",color:"#6b7394"}}>Responsable: <span style={{color:"#e8eaf2"}}>{b.responsable}</span></div></div>
                        <div style={{display:"flex",gap:5}}><Btn onClick={()=>openEditB(b,i)} sm>edit</Btn><Btn onClick={()=>delB(i)} v="danger" sm>x</Btn></div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab==="tareas"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontWeight:700,fontSize:"0.92rem"}}>Tareas</div><Btn onClick={openNewT} sm>+ Nueva</Btn></div>
                  {proj.tareas.length===0&&<div style={{color:"#6b7394",fontSize:"0.84rem"}}>No hay tareas aun.</div>}
                  {proj.tareas.map(t=>(
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:11,background:"#141720",borderRadius:10,border:"1px solid #252a3a",padding:"11px 15px",marginBottom:7}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:PRIO_CLR[t.prioridad]||"#f5c842",flexShrink:0}}/>
                      <div onClick={()=>togT(t.id)} style={{width:17,height:17,borderRadius:5,border:"2px solid "+(t.done?"#22d3a0":"#252a3a"),background:t.done?"#22d3a0":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.62rem",color:"#0d0f14",fontWeight:900,flexShrink:0}}>{t.done?"v":""}</div>
                      <div style={{flex:1,fontSize:"0.83rem",textDecoration:t.done?"line-through":"none",color:t.done?"#6b7394":"#e8eaf2"}}>{t.texto}</div>
                      <div style={{fontSize:"0.71rem",padding:"2px 7px",borderRadius:8,background:"#1c2030",border:"1px solid #252a3a",color:"#6b7394",whiteSpace:"nowrap"}}>{t.responsable}</div>
                      <div style={{fontSize:"0.71rem",color:"#6b7394",whiteSpace:"nowrap"}}>{fmt(t.vencimiento)}</div>
                      <div style={{display:"flex",gap:5}}><Btn onClick={()=>openEditT(t)} sm>edit</Btn><Btn onClick={()=>delT(t.id)} v="danger" sm>x</Btn></div>
                    </div>
                  ))}
                </div>
              )}

              {tab==="reporte"&&(
                <div>
                  <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:4}}>Reporte semanal - {proj.name}</div>
                  <div style={{fontSize:"0.77rem",color:"#f5c842",marginBottom:18,padding:"8px 12px",background:"rgba(245,200,66,0.06)",borderRadius:8,border:"1px solid rgba(245,200,66,0.2)"}}>Debe completarse por el Project Owner antes de cada reunion semanal</div>
                  <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px",marginBottom:14}}>
                    <div style={{fontSize:"0.7rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:9}}>Resumen ejecutivo de la semana</div>
                    <textarea value={resumenLocal} onChange={e=>setResumenLocal(e.target.value)} placeholder="Que ha pasado esta semana? Avances, problemas, decisiones tomadas." style={{...CSS.inp,minHeight:100,resize:"vertical",lineHeight:1.6}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                      <div style={{fontSize:"0.7rem",color:"#6b7394"}}>Guardado: {proj.ultimaActualizacion?fmt(proj.ultimaActualizacion):"-"}</div>
                      <Btn onClick={saveResumen} v="primary" sm>Guardar resumen</Btn>
                    </div>
                  </div>
                  <div style={{background:"#141720",borderRadius:12,border:"1px solid #252a3a",padding:"18px"}}>
                    <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:13}}>Checklist</div>
                    {[{label:"BP cargado",ok:!!proj.bp},{label:"Marketing planificado",ok:!!proj.marketing},{label:"Viviendas cargadas",ok:st.total>0},{label:"Hitos actualizados",ok:proj.hitos.some(h=>h.estado!=="pendiente")},{label:"Resumen guardado (min 20 chars)",ok:(proj.resumenSemanal||"").length>20},{label:"Tareas asignadas",ok:proj.tareas.length>0&&proj.tareas.every(t=>t.responsable)}].map((item,i,arr)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #252a3a":"none"}}>
                        <div style={{width:20,height:20,borderRadius:6,background:item.ok?"rgba(34,211,160,0.12)":"rgba(240,90,90,0.08)",border:"1px solid "+(item.ok?"#22d3a0":"#f05a5a"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.68rem",color:item.ok?"#22d3a0":"#f05a5a",flexShrink:0}}>{item.ok?"v":"x"}</div>
                        <div style={{fontSize:"0.83rem",color:item.ok?"#e8eaf2":"#6b7394"}}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {modal==="proj"&&<ModalProj pF={pF} onChange={chPF} onSave={saveP} onClose={()=>setModal(null)} isEdit={projIsEdit.current}/>}
      {modal==="hito"&&<ModalHito hF={hF} onChange={chHF} onSave={saveH} onClose={()=>setModal(null)}/>}
      {modal==="tarea"&&<ModalTarea tF={tF} onChange={chTF} onSave={saveT} onClose={()=>setModal(null)} isEdit={!!editId.current}/>}
      {modal==="blocker"&&<ModalBlocker bF={bF} onChange={chBF} onSave={saveB} onClose={()=>setModal(null)}/>}
      {modal==="vivienda"&&<ModalVivienda vF={vF} onChange={chVF} onSave={saveV} onClose={()=>setModal(null)} isEdit={!!editId.current}/>}

      {modal==="bpPreview"&&bpPreview&&(
        <Modal title="Confirmar importacion del Business Plan" onClose={()=>{setModal(null);setBpPreview(null);}} wide>
          <div style={{fontSize:"0.84rem",color:"#6b7394",marginBottom:18}}>Se importaran los siguientes datos a la promocion <strong style={{color:"#e8eaf2"}}>{proj&&proj.name}</strong>:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            {[{l:"Viviendas",v:bpPreview.numViviendas},{l:"Localidad",v:bpPreview.localidad},{l:"GDV (ventas totales)",v:fmtEurM(bpPreview.ventasActual)},{l:"Total gastos",v:fmtEurM(bpPreview.totalGastosActual)},{l:"Beneficio estimado",v:fmtEurM(bpPreview.beneficioActual)},{l:"TIR (pretax)",v:fmtPct(bpPreview.tirActual)},{l:"Margen s/ventas",v:fmtPct(bpPreview.mgvActual)},{l:"Fecha escritura",v:fmt(bpPreview.fechaEntrega)},{l:"Viviendas Lista Precios",v:((bpPreview.viviendas&&bpPreview.viviendas.length)||0)+" unidades"},{l:"Fondos propios",v:fmtEurM(bpPreview.fondosPropios)}].map(x=>(
              <div key={x.l} style={{background:"#1c2030",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:"0.65rem",color:"#6b7394",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:3}}>{x.l}</div>
                <div style={{fontWeight:600,fontSize:"0.88rem"}}>{x.v||"-"}</div>
              </div>
            ))}
          </div>
          {bpPreview.viviendas&&bpPreview.viviendas.length>0&&(
            <div style={{background:"rgba(34,211,160,0.06)",border:"1px solid rgba(34,211,160,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:"0.8rem",color:"#22d3a0"}}>
              Se cargaran {bpPreview.viviendas.length} viviendas desde Lista_Precios
            </div>
          )}
          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <Btn onClick={()=>{setModal(null);setBpPreview(null);}}>Cancelar</Btn>
            <Btn onClick={confirmBP} v="primary">Confirmar importacion</Btn>
          </div>
        </Modal>
      )}
    </div>
    </ErrorBoundary>
  );
}
