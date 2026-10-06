import React, { useState, useEffect, useRef, useCallback, memo } from "react";

// ─── CLOUD STORAGE ───────────────────────────────────────────────────────────
const JBKEY = "$2a$10$a6n7i3E/5IrfUHuOxXwrJ.vZTzL/7uOxSEt5laKErphDwS85ZETbW";
const JBURL = "https://api.jsonbin.io/v3/b";

// BIN ID FIJO - compartido por TODOS los usuarios
const FIXED_BIN_ID = "6a55dbf6f5f4af5e298c27ac";

const cloudSave = async (data) => {
  try {
    // Unica proteccion: nunca guardar array vacio
    if(!data||!Array.isArray(data)||data.length===0) return;
    await fetch(JBURL+"/"+FIXED_BIN_ID, {
      method:"PUT",
      headers:{"Content-Type":"application/json","X-Master-Key":JBKEY},
      body: JSON.stringify({projects:data, ts:Date.now()})
    });
  } catch(e){}
};

const cloudLoad = async () => {
  try {
    const r = await fetch(JBURL+"/"+FIXED_BIN_ID+"/latest",{
      headers:{"X-Master-Key":JBKEY,"X-Bin-Meta":"false"}
    });
    const j = await r.json();
    return Array.isArray(j.projects) ? j.projects : null;
  } catch(e){ return null; }
};

const DEFAULT_HITOS = ["Originación y due diligence","Firma compraventa del suelo","Constitución sociedad / fondos propios","Entrega proyecto básico","Solicitud y concesión licencia de obra","Kick-off comercial","Prelanzamiento (F&F / permutas)","Lanzamiento oficial de ventas","Term sheet financiación promotora","Aprobación riesgos entidad","Firma escritura préstamo promotor","Entrega proyecto de ejecución","Adjudicación obra / constructora","Acta de replanteo e inicio de obra","Disposición inicial préstamo promotor","División horizontal / distribución hipoteca","Certificado Final de Obra","Licencia de primera ocupación","Inicio escrituración y entregas","Cancelación préstamo y cierre proyecto"];
const HITO_CYCLE = ["pendiente","en-curso","completado","retrasado"];
const ESTADOS = {"en-marcha":{label:"En marcha",color:"#4ca99a",bg:"rgba(76,169,154,0.12)"},"en-riesgo":{label:"En riesgo",color:"#ddb96a",bg:"rgba(221,185,106,0.12)"},"bloqueado":{label:"Bloqueado",color:"#e05a5a",bg:"rgba(224,90,90,0.12)"},"planificacion":{label:"Planificacion",color:"#c9a86c",bg:"rgba(201,168,108,0.12)"},"entregado":{label:"Entregado",color:"#94a3b8",bg:"rgba(148,163,184,0.12)"}};
const HITO_EST = {"completado":{color:"#4ca99a",bg:"rgba(76,169,154,0.15)",icon:"✓"},"en-curso":{color:"#c9a86c",bg:"rgba(201,168,108,0.15)",icon:"->"},"pendiente":{color:"#B0BBC6",bg:"rgba(61,80,112,0.15)",icon:"o"},"retrasado":{color:"#e05a5a",bg:"rgba(224,90,90,0.15)",icon:"!"}};
const BLOCK_ST = {critico:{bg:"rgba(224,90,90,0.10)",border:"rgba(224,90,90,0.3)",icon:"[!]"},aviso:{bg:"rgba(221,185,106,0.10)",border:"rgba(221,185,106,0.3)",icon:"[?]"},info:{bg:"rgba(201,168,108,0.10)",border:"rgba(201,168,108,0.3)",icon:"[i]"}};
const VIV_ESTADOS = {"disponible":{label:"Disponible",color:"#4ca99a"},"reservada":{label:"Reservada",color:"#ddb96a"},"vendida":{label:"Vendida",color:"#4ca99a"},"rescindida":{label:"Rescisión",color:"#e05a5a"},"no-venta":{label:"No venta",color:"#6B7A8A"}};
const PRIO_CLR = {alta:"#e05a5a",media:"#ddb96a",baja:"#4ca99a"};
const TEAM = ["Sandra","Alberto","Pilar","Monica","Maria","Fran","Sara (BSA)","Dani (BSA)","Inma (BSA)"];
const CSS = {inp:{width:"100%",background:"#F0EEE9",border:"1px solid #DDD8CF",borderRadius:8,padding:"8px 11px",color:"#1E2D4E",fontFamily:"inherit",fontSize:"0.84rem",outline:"none",boxSizing:"border-box"}};

const DEFAULT_PROJECTS = [
  {id:1,name:"ATALAYA EL ATABAL",zona:"Sur",estado:"en-marcha",projectOwner:"Sandra",pmTecnico:"Sara (BSA)",responsableComercial:"Sandra",comercializadora:"",ubicacion:"Málaga",presupuesto:"EUR49.88M",costeActual:"EUR40.81M",fechaEntrega:"2026-06-01",hitos:[
    {nombre:"Originación y due diligence",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Legal / Técnica",responsable:"",depende:""},
    {nombre:"Firma compraventa del suelo",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Legal",responsable:"",depende:""},
    {nombre:"Constitución sociedad / fondos propios",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Legal / Financiera",responsable:"",depende:""},
    {nombre:"Entrega proyecto básico",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Técnica",responsable:"",depende:""},
    {nombre:"Solicitud y concesión licencia de obra",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Técnica",responsable:"",depende:""},
    {nombre:"Kick-off comercial",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Comercial",responsable:"",depende:""},
    {nombre:"Prelanzamiento (F&F / permutas)",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Comercial",responsable:"",depende:""},
    {nombre:"Lanzamiento oficial de ventas",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Comercial",responsable:"",depende:""},
    {nombre:"Term sheet financiación promotora",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Financiera",responsable:"",depende:""},
    {nombre:"Aprobación riesgos entidad",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Financiera",responsable:"",depende:""},
    {nombre:"Firma escritura préstamo promotor",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Financiera",responsable:"",depende:""},
    {nombre:"Entrega proyecto de ejecución",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Técnica",responsable:"",depende:""},
    {nombre:"Adjudicación obra / constructora",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Técnica",responsable:"",depende:""},
    {nombre:"Acta de replanteo e inicio de obra",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Técnica",responsable:"",depende:""},
    {nombre:"Disposición inicial préstamo promotor",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Financiera",responsable:"",depende:""},
    {nombre:"División horizontal / distribución hipoteca",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Legal / Financiera",responsable:"",depende:""},
    {nombre:"Certificado Final de Obra",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Técnica",responsable:"",depende:""},
    {nombre:"Licencia de primera ocupación",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Técnica",responsable:"",depende:""},
    {nombre:"Inicio escrituración y entregas",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Comercial / Legal",responsable:"",depende:""},
    {nombre:"Cancelación préstamo y cierre proyecto",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:"",area:"Financiera",responsable:"",depende:""},
  ],blockers:[
    {id:1,texto:"Proyecto ejecutivo — pendiente de entrega",prioridad:"alta",responsable:"BSA",vencimiento:"",resuelto:false},
    {id:2,texto:"Licencia de obra — pendiente de solicitud",prioridad:"alta",responsable:"",vencimiento:"",resuelto:false},
    {id:3,texto:"Avances de financiación — pendiente",prioridad:"media",responsable:"",vencimiento:"",resuelto:false},
    {id:4,texto:"Licitación — pendiente",prioridad:"media",responsable:"",vencimiento:"",resuelto:false},
  ],tareas:[
    {id:"t_atl_1",texto:"[GOBIERNO] Redacción del kick-off document",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_2",texto:"[GOBIERNO] Aprobación del kick-off en comité de inversión",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_3",texto:"[GOBIERNO] Project Manager / responsable del proyecto",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_4",texto:"[GOBIERNO] Teaser de inversión",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_5",texto:"[GOBIERNO] Calendario de comités de seguimiento",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_6",texto:"[GOBIERNO] Registro de riesgos y plan de mitigación",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_7",texto:"[LEGAL] Sociedad / SPV — constitución",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_8",texto:"[LEGAL] CIF",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_9",texto:"[LEGAL] Domicilio social",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_10",texto:"[LEGAL] Escritura de constitución",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_11",texto:"[LEGAL] Pacto de socios",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_12",texto:"[LEGAL] Administradores / Consejo de Administración",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_13",texto:"[LEGAL] Apoderados",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_14",texto:"[LEGAL] Escrituras de poderes vigentes",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_15",texto:"[LEGAL] Contrato de compraventa del suelo",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_16",texto:"[LEGAL] Contrato de arquitecto",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_17",texto:"[LEGAL] Contrato de constructora",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_18",texto:"[LEGAL] Contrato de dirección facultativa (Dir. Obra y Aparejador)",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_19",texto:"[LEGAL] Contrato con comercializadora",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_20",texto:"[LEGAL] Contratos de financiación",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_21",texto:"[LEGAL] Contratos de marketing, branding y agencia de medios",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_22",texto:"[LEGAL] Contrato de project management / Development 360",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_23",texto:"[LEGAL] Contrato de OCT",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_24",texto:"[LEGAL] Nota simple registral actualizada",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_25",texto:"[LEGAL] Cargas del suelo — análisis y cancelación",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_26",texto:"[LEGAL] Situación registral y de inmatriculación",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_27",texto:"[LEGAL] Servidumbres, ocupantes y arrendatarios",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_28",texto:"[LEGAL] Litigios y contingencias",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_29",texto:"[LEGAL] Due diligence legal",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_30",texto:"[LEGAL] Due diligence técnica y urbanística",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_31",texto:"[LEGAL] Due diligence ambiental / ECO appraisal",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_32",texto:"[LEGAL] Valoración RICS",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_33",texto:"[URBANISMO] Clasificación y calificación del suelo",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_34",texto:"[URBANISMO] Planeamiento de desarrollo (Plan Parcial / Estudio de Detalle)",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_35",texto:"[URBANISMO] Proyecto de reparcelación e inscripción registral",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_36",texto:"[URBANISMO] Inscripción de fincas",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_37",texto:"[URBANISMO] Proyecto de urbanización",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_38",texto:"[URBANISMO] Licencia de urbanización",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_39",texto:"[URBANISMO] Ejecución de la obra de urbanización",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_40",texto:"[URBANISMO] Recepción de la urbanización por el Ayuntamiento",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_41",texto:"[URBANISMO] Avales y garantías urbanísticas",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_42",texto:"[URBANISMO] Acometida de agua y saneamiento",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_43",texto:"[URBANISMO] Acometida eléctrica y centro de transformación",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_44",texto:"[URBANISMO] Telecomunicaciones e ICT",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_45",texto:"[URBANISMO] Boletines y certificados de instalaciones",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_46",texto:"[TÉCNICA] Arquitecto / estudio redactor",responsable:"BSA",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_47",texto:"[TÉCNICA] Estudio topográfico",responsable:"BSA",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_48",texto:"[TÉCNICA] Estudio geotécnico",responsable:"BSA",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_49",texto:"[TÉCNICA] Estudio arqueológico (si exigible)",responsable:"BSA",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_50",texto:"[TÉCNICA] Proyecto básico — pendiente de entrega",responsable:"BSA",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_51",texto:"[TÉCNICA] Proyecto de ejecución — pendiente de entrega",responsable:"BSA",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_52",texto:"[TÉCNICA] Proyectos técnicos específicos (estructura, instalaciones, ICT)",responsable:"BSA",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_53",texto:"[TÉCNICA] Visados colegiales",responsable:"BSA",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_54",texto:"[TÉCNICA] Estudio de seguridad y salud",responsable:"BSA",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_55",texto:"[TÉCNICA] Estudio de gestión de residuos",responsable:"BSA",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_56",texto:"[TÉCNICA] Memoria de calidades técnica",responsable:"BSA",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_57",texto:"[TÉCNICA] Certificación energética / sello de sostenibilidad",responsable:"BSA",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_58",texto:"[TÉCNICA] Licencia de obra — pendiente de solicitud",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_59",texto:"[TÉCNICA] ICIO y tasas municipales",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_60",texto:"[TÉCNICA] Licencias complementarias (derribo, vado, ocupación vía pública, grúa)",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_61",texto:"[TÉCNICA] Licencia de primera ocupación",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_62",texto:"[TÉCNICA] Licitación — pendiente",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_63",texto:"[TÉCNICA] Adjudicación y constructora seleccionada",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_64",texto:"[TÉCNICA] Planning de obra y camino crítico",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_65",texto:"[TÉCNICA] Acta de replanteo",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_66",texto:"[TÉCNICA] Inicio de obra",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_67",texto:"[TÉCNICA] Avance de certificaciones (% mes a mes)",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_68",texto:"[TÉCNICA] Certificado Final de Obra (CFO)",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_69",texto:"[TÉCNICA] Acta de recepción de la obra",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_70",texto:"[TÉCNICA] Libro del edificio y manuales de uso",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_71",texto:"[TÉCNICA] Plan de postventa y garantías",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_72",texto:"[TÉCNICA] OCT (Organismo de Control Técnico)",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_73",texto:"[TÉCNICA] Dirección facultativa (Dirección de Obra)",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_74",texto:"[TÉCNICA] Dirección de ejecución (Aparejador)",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_75",texto:"[TÉCNICA] Coordinador de Seguridad y Salud",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_76",texto:"[TÉCNICA] Interiorismo",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_77",texto:"[TÉCNICA] Declaración de obra nueva en construcción",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_78",texto:"[TÉCNICA] División horizontal (constitución)",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_79",texto:"[TÉCNICA] AJD de obra nueva y división horizontal",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_80",texto:"[TÉCNICA] Declaración de obra nueva terminada",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_81",texto:"[TÉCNICA] Seguro decenal (SD)",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_82",texto:"[TÉCNICA] Seguro todo riesgo construcción (TRC)",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_83",texto:"[TÉCNICA] Seguro de responsabilidad civil",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_84",texto:"[FINANCIERA] Inversión total prevista — definir",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_85",texto:"[FINANCIERA] Aportación de fondos propios",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_86",texto:"[FINANCIERA] % LTC",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_87",texto:"[FINANCIERA] Cuenta operativa",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_88",texto:"[FINANCIERA] Cuenta especial de cantidades a cuenta (Ley 38/1999)",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_89",texto:"[FINANCIERA] Cuenta del préstamo promotor",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_90",texto:"[FINANCIERA] Poderes bancarios y firmas autorizadas",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_91",texto:"[FINANCIERA] Business plan: ventas totales, margen, TIR, MoM",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_92",texto:"[FINANCIERA] Presupuesto actualizado",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_93",texto:"[FINANCIERA] Ingresos comprometidos",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_94",texto:"[FINANCIERA] Tesorería real vs. prevista",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_95",texto:"[FINANCIERA] Próximos vencimientos",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_96",texto:"[FINANCIERA] IVA: liquidaciones y devoluciones",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_97",texto:"[FINANCIACIÓN] Avances de financiación — pendiente",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_98",texto:"[FINANCIACIÓN] Financiación de suelo — importe y entidad",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_99",texto:"[FINANCIACIÓN] Condiciones: tipo, comisiones, plazo y carencia",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_100",texto:"[FINANCIACIÓN] Garantías aportadas",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_101",texto:"[FINANCIACIÓN] Calendario de amortización y cancelación (suelo)",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_102",texto:"[FINANCIACIÓN] Entidades contactadas — financiación promotor",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_103",texto:"[FINANCIACIÓN] Teaser de financiación",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_104",texto:"[FINANCIACIÓN] Entidad elegida",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_105",texto:"[FINANCIACIÓN] Condiciones económicas — préstamo promotor",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_106",texto:"[FINANCIACIÓN] Plazo, carencia y calendario de amortización",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_107",texto:"[FINANCIACIÓN] Covenants y ratios exigidos",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_108",texto:"[FINANCIACIÓN] Firma de la escritura de préstamo promotor",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_109",texto:"[FINANCIACIÓN] AJD, notaría y registro de la hipoteca",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_110",texto:"[FINANCIACIÓN] Distribución de la hipoteca entre fincas",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_111",texto:"[FINANCIACIÓN] Calendario previsto de disposiciones",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_112",texto:"[FINANCIACIÓN] Disposición inicial del préstamo",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_113",texto:"[FINANCIACIÓN] Seguimiento de disposiciones realizadas vs. previstas",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_114",texto:"[FINANCIACIÓN] Avales de cantidades a cuenta — emisión y entrega",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_115",texto:"[FINANCIACIÓN] Subrogaciones de compradores",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_116",texto:"[FINANCIACIÓN] Amortización y cancelación del préstamo",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_117",texto:"[COMERCIAL] Naming y logo",responsable:"Sandra",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_118",texto:"[COMERCIAL] Renders",responsable:"Sandra",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_119",texto:"[COMERCIAL] Ficha / Presentación comercial de proyecto",responsable:"Sandra",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_120",texto:"[COMERCIAL] Memoria de calidades comercial",responsable:"Sandra",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_121",texto:"[COMERCIAL] Planos comerciales",responsable:"Sandra",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_122",texto:"[COMERCIAL] Web de la promoción y landing de captación",responsable:"Sandra",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_123",texto:"[COMERCIAL] Oficina de ventas / cartelería en obra",responsable:"Sandra",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_124",texto:"[COMERCIAL] Welcome package",responsable:"Sandra",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_125",texto:"[COMERCIAL] Plan de marketing online y offline",responsable:"Sandra",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_126",texto:"[COMERCIAL] Presupuesto de marketing aprobado",responsable:"Sandra",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_127",texto:"[COMERCIAL] Comercializadora / equipo de ventas asignado",responsable:"Sandra",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_128",texto:"[COMERCIAL] Documentación contractual validada (reserva, arras, CPV)",responsable:"",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_129",texto:"[COMERCIAL] Listado de precios",responsable:"Sandra",prioridad:"alta",vencimiento:"",done:false},
    {id:"t_atl_130",texto:"[COMERCIAL] Adjudicación de anejos por vivienda",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_131",texto:"[COMERCIAL] Política de descuentos",responsable:"Sandra",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_132",texto:"[COMERCIAL] Permutas con vendedores del suelo",responsable:"",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_133",texto:"[COMERCIAL] Calendario de comercialización e hitos de subida de precios",responsable:"Sandra",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_134",texto:"[COMERCIAL] Inicio de ventas / Lanzamiento comercial",responsable:"Sandra",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_135",texto:"[COMERCIAL] Estado de ventas (% vendido)",responsable:"Sandra",prioridad:"media",vencimiento:"",done:false},
    {id:"t_atl_136",texto:"[COMERCIAL] Estado de la promoción en Prinex",responsable:"",prioridad:"baja",vencimiento:"",done:false},
    {id:"t_atl_137",texto:"[COMERCIAL] Plan de entregas",responsable:"",prioridad:"baja",vencimiento:"",done:false},
  ],
  viviendas:[
    {id:"V_ATL_1_V1",ref:"ATL-1-V1",tipologia:"Vivienda",planta:"-",superficie:147.35,precio:711000,estado:"reservada",notas:"LOURDES MARTIN COMITRE"},
    {id:"V_ATL_1_V2",ref:"ATL-1-V2",tipologia:"Vivienda",planta:"-",superficie:147.35,precio:614000,estado:"reservada",notas:"JUAN JOSÉ NAVAS BLANQUEZ"},
    {id:"V_ATL_1_V3",ref:"ATL-1-V3",tipologia:"Vivienda",planta:"-",superficie:147.35,precio:604999,estado:"reservada",notas:"ALEJANDRO MARTÍN SEVILLA"},
    {id:"V_ATL_1_V4",ref:"ATL-1-V4",tipologia:"Vivienda",planta:"-",superficie:147.35,precio:614000,estado:"reservada",notas:"ANA ISABEL CORONADO GONZÁLEZ"},
    {id:"V_ATL_1_V5",ref:"ATL-1-V5",tipologia:"Vivienda",planta:"-",superficie:147.35,precio:614000,estado:"reservada",notas:"MARIA CRISTINA MORENO SÁNCHEZ"},
    {id:"V_ATL_1_V6",ref:"ATL-1-V6",tipologia:"Vivienda",planta:"-",superficie:147.15,precio:676000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V7",ref:"ATL-1-V7",tipologia:"Vivienda",planta:"-",superficie:147.6,precio:599000,estado:"reservada",notas:"ALEJANDRO MORIEL CORONADO"},
    {id:"V_ATL_1_V8",ref:"ATL-1-V8",tipologia:"Vivienda",planta:"-",superficie:147.35,precio:625000,estado:"reservada",notas:"SUN XIAOLEI"},
    {id:"V_ATL_1_V9",ref:"ATL-1-V9",tipologia:"Vivienda",planta:"-",superficie:147.35,precio:604999,estado:"reservada",notas:"MIGUEL ANGEL MUÑOZ GUERRERO"},
    {id:"V_ATL_1_V10",ref:"ATL-1-V10",tipologia:"Vivienda",planta:"-",superficie:147.35,precio:625000,estado:"reservada",notas:"ENCARNACION PARRA MENA"},
    {id:"V_ATL_1_V11",ref:"ATL-1-V11",tipologia:"Vivienda",planta:"-",superficie:147.35,precio:604999,estado:"reservada",notas:"SANDRA BENITEZ ACEBES"},
    {id:"V_ATL_1_V12",ref:"ATL-1-V12",tipologia:"Vivienda",planta:"-",superficie:147.28,precio:619000,estado:"reservada",notas:"ANDRÉS ARANDA ROSA"},
    {id:"V_ATL_1_V13",ref:"ATL-1-V13",tipologia:"Vivienda",planta:"-",superficie:152.78,precio:739000,estado:"reservada",notas:"ELOY ARCAS GUTIERREZ"},
    {id:"V_ATL_1_V14",ref:"ATL-1-V14",tipologia:"Vivienda",planta:"-",superficie:153.25,precio:782000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V15",ref:"ATL-1-V15",tipologia:"Vivienda",planta:"-",superficie:153.25,precio:783000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V16",ref:"ATL-1-V16",tipologia:"Vivienda",planta:"-",superficie:153.25,precio:785000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V17",ref:"ATL-1-V17",tipologia:"Vivienda",planta:"-",superficie:153.25,precio:782000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V18",ref:"ATL-1-V18",tipologia:"Vivienda",planta:"-",superficie:153.25,precio:781000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V19",ref:"ATL-1-V19",tipologia:"Vivienda",planta:"-",superficie:156.67,precio:759000,estado:"reservada",notas:"ISAAC MERINO MUÑOZ"},
    {id:"V_ATL_1_V20",ref:"ATL-1-V20",tipologia:"Vivienda",planta:"-",superficie:147.73,precio:685000,estado:"reservada",notas:"MARIA ACEVEDO GARCÍA"},
    {id:"V_ATL_1_V21",ref:"ATL-1-V21",tipologia:"Vivienda",planta:"-",superficie:131.71,precio:565000,estado:"reservada",notas:"JOSE CARLOS VALERA AVILA"},
    {id:"V_ATL_1_V22",ref:"ATL-1-V22",tipologia:"Vivienda",planta:"-",superficie:131.71,precio:599000,estado:"reservada",notas:"FERNANDO HEREDIA CLEMENTE"},
    {id:"V_ATL_1_V23",ref:"ATL-1-V23",tipologia:"Vivienda",planta:"-",superficie:131.71,precio:599000,estado:"reservada",notas:"SUSANA ECHAZARRETA MARTINEZ DE CAREAGA"},
    {id:"V_ATL_1_V24",ref:"ATL-1-V24",tipologia:"Vivienda",planta:"-",superficie:131.71,precio:558000,estado:"reservada",notas:"JOSE MANUEL ROSILLO SOLER"},
    {id:"V_ATL_1_V25",ref:"ATL-1-V25",tipologia:"Vivienda",planta:"-",superficie:131.71,precio:558000,estado:"reservada",notas:"RICARDO VITORES DELGADO"},
    {id:"V_ATL_1_V26",ref:"ATL-1-V26",tipologia:"Vivienda",planta:"-",superficie:131.71,precio:560000,estado:"reservada",notas:"SALVADOR AGUILAR HERNÁNDEZ"},
    {id:"V_ATL_1_V27",ref:"ATL-1-V27",tipologia:"Vivienda",planta:"-",superficie:131.71,precio:558000,estado:"reservada",notas:"LUIS MARIANO COLL PÉREZ"},
    {id:"V_ATL_1_V28",ref:"ATL-1-V28",tipologia:"Vivienda",planta:"-",superficie:131.71,precio:555000,estado:"reservada",notas:"FERNANDO RODRIGUEZ MADARIAGA"},
    {id:"V_ATL_1_V29",ref:"ATL-1-V29",tipologia:"Vivienda",planta:"-",superficie:131.71,precio:555000,estado:"reservada",notas:"JOSE GIL ELENA"},
    {id:"V_ATL_1_V30",ref:"ATL-1-V30",tipologia:"Vivienda",planta:"-",superficie:136.22,precio:620000,estado:"reservada",notas:"MIGUEL ÁNGEL GUERRERO ARIAS"},
    {id:"V_ATL_1_V31",ref:"ATL-1-V31",tipologia:"Vivienda",planta:"-",superficie:152.42,precio:725000,estado:"reservada",notas:"FERNANDO SUSIN MALDONADO"},
    {id:"V_ATL_1_V32",ref:"ATL-1-V32",tipologia:"Vivienda",planta:"-",superficie:152.45,precio:633000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V33",ref:"ATL-1-V33",tipologia:"Vivienda",planta:"-",superficie:152.45,precio:680000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V34",ref:"ATL-1-V34",tipologia:"Vivienda",planta:"-",superficie:152.45,precio:633000,estado:"reservada",notas:"FERNANDO CASTRO RODRIGUEZ"},
    {id:"V_ATL_1_V35",ref:"ATL-1-V35",tipologia:"Vivienda",planta:"-",superficie:153.46,precio:599000,estado:"reservada",notas:"ANTONIO PÉREZ SIERRA"},
    {id:"V_ATL_1_V36",ref:"ATL-1-V36",tipologia:"Vivienda",planta:"-",superficie:152.28,precio:707000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V37",ref:"ATL-1-V37",tipologia:"Vivienda",planta:"-",superficie:152.43,precio:585000,estado:"reservada",notas:"ANTONIO JESÚS LÓPEZ BERNAL"},
    {id:"V_ATL_1_V38",ref:"ATL-1-V38",tipologia:"Vivienda",planta:"-",superficie:154.72,precio:685000,estado:"reservada",notas:"MARTINA PINEDA MARTINEZ"},
    {id:"V_ATL_1_V39",ref:"ATL-1-V39",tipologia:"Vivienda",planta:"-",superficie:145.94,precio:693000,estado:"reservada",notas:"RAFAEL RUIZ SALAS"},
    {id:"V_ATL_1_V40",ref:"ATL-1-V40",tipologia:"Vivienda",planta:"-",superficie:146,precio:747000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V41",ref:"ATL-1-V41",tipologia:"Vivienda",planta:"-",superficie:148.55,precio:751000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V42",ref:"ATL-1-V42",tipologia:"Vivienda",planta:"-",superficie:148.55,precio:749000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V43",ref:"ATL-1-V43",tipologia:"Vivienda",planta:"-",superficie:148.55,precio:745000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V44",ref:"ATL-1-V44",tipologia:"Vivienda",planta:"-",superficie:148.55,precio:750000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V45",ref:"ATL-1-V45",tipologia:"Vivienda",planta:"-",superficie:146.04,precio:745000,estado:"disponible",notas:""},
    {id:"V_ATL_1_V46",ref:"ATL-1-V46",tipologia:"Vivienda",planta:"-",superficie:153.78,precio:753000,estado:"reservada",notas:"MY JET PLANE S.L.U"},
    {id:"V_ATL_1_V47",ref:"ATL-1-V47",tipologia:"Vivienda",planta:"-",superficie:172.1,precio:750000,estado:"reservada",notas:"PABLO NORBERTO VILLARONGA COSTAS"},
    {id:"V_ATL_2_V48",ref:"ATL-2-V48",tipologia:"Vivienda",planta:"-",superficie:104.1,precio:489000,estado:"reservada",notas:"JOSE MANUEL HIDALGO LÓPEZ"},
    {id:"V_ATL_2_V49",ref:"ATL-2-V49",tipologia:"Vivienda",planta:"-",superficie:104.1,precio:510000,estado:"reservada",notas:"DOLORES PARRA CRESPO"},
    {id:"V_ATL_2_V50",ref:"ATL-2-V50",tipologia:"Vivienda",planta:"-",superficie:104.1,precio:495000,estado:"reservada",notas:"TAMARA ELVIRA ARAGÓN ALBOLAFIO"},
    {id:"V_ATL_2_V51",ref:"ATL-2-V51",tipologia:"Vivienda",planta:"-",superficie:104.1,precio:485000,estado:"reservada",notas:"IVÁN CANO GUTIERREZ"},
    {id:"V_ATL_2_V52",ref:"ATL-2-V52",tipologia:"Vivienda",planta:"-",superficie:104.68,precio:465000,estado:"reservada",notas:"ALEJANDRO BRAVO MÉRIDA"},
    {id:"V_ATL_2_V53",ref:"ATL-2-V53",tipologia:"Vivienda",planta:"-",superficie:104.68,precio:449000,estado:"reservada",notas:"ANA ISABEL MARIN GARCÍA"},
    {id:"V_ATL_2_V54",ref:"ATL-2-V54",tipologia:"Vivienda",planta:"-",superficie:104.67,precio:473000,estado:"reservada",notas:"JUAN IGNACIO OLAYA MARÍN"},
    {id:"V_ATL_2_V55",ref:"ATL-2-V55",tipologia:"Vivienda",planta:"-",superficie:104.67,precio:510000,estado:"reservada",notas:"ÁLVARO ESCOBAR GARCÍA"},
    {id:"V_ATL_2_V56",ref:"ATL-2-V56",tipologia:"Vivienda",planta:"-",superficie:104.67,precio:510000,estado:"reservada",notas:"MARINA FLORES NAVAS"},
    {id:"V_ATL_2_V57",ref:"ATL-2-V57",tipologia:"Vivienda",planta:"-",superficie:104.67,precio:478000,estado:"reservada",notas:"JIMABA S.L."},
    {id:"V_ATL_2_V58",ref:"ATL-2-V58",tipologia:"Vivienda",planta:"-",superficie:104.67,precio:473000,estado:"reservada",notas:"RON BARDEM ESPAÑA S.L"},
    {id:"V_ATL_2_V59",ref:"ATL-2-V59",tipologia:"Vivienda",planta:"-",superficie:104.67,precio:560000,estado:"disponible",notas:""},
    {id:"V_ATL_2_V60",ref:"ATL-2-V60",tipologia:"Vivienda",planta:"-",superficie:103.81,precio:494000,estado:"reservada",notas:"CRISTINA BANDERA GARCÍA"},
    {id:"V_ATL_2_V61",ref:"ATL-2-V61",tipologia:"Vivienda",planta:"-",superficie:165.04,precio:765000,estado:"disponible",notas:""},
    {id:"V_ATL_2_V62",ref:"ATL-2-V62",tipologia:"Vivienda",planta:"-",superficie:145.04,precio:720000,estado:"disponible",notas:""},
    {id:"V_ATL_2_V63",ref:"ATL-2-V63",tipologia:"Vivienda",planta:"-",superficie:143.64,precio:674000,estado:"reservada",notas:"MARIA TERESA ARIAS AYALA"},
    {id:"V_ATL_2_V64",ref:"ATL-2-V64",tipologia:"Vivienda",planta:"-",superficie:143.41,precio:668000,estado:"reservada",notas:"ANTONIO HIDALGO HEREDERA"},
    {id:"V_ATL_2_V65",ref:"ATL-2-V65",tipologia:"Vivienda",planta:"-",superficie:143.45,precio:695000,estado:"reservada",notas:"RAFAEL JAVIER RIERA RUIZ"},
    {id:"V_ATL_2_V66",ref:"ATL-2-V66",tipologia:"Vivienda",planta:"-",superficie:146.32,precio:693000,estado:"disponible",notas:""},
    {id:"V_ATL_2_V67",ref:"ATL-2-V67",tipologia:"Vivienda",planta:"-",superficie:135.79,precio:714000,estado:"disponible",notas:""},
    {id:"V_ATL_2_V68",ref:"ATL-2-V68",tipologia:"Vivienda",planta:"-",superficie:132.71,precio:790000,estado:"disponible",notas:""},
    {id:"V_ATL_2_V69",ref:"ATL-2-V69",tipologia:"Vivienda",planta:"-",superficie:135.2,precio:764000,estado:"disponible",notas:""},
    {id:"V_ATL_2_V70",ref:"ATL-2-V70",tipologia:"Vivienda",planta:"-",superficie:135.22,precio:764000,estado:"disponible",notas:""},
    {id:"V_ATL_2_V71",ref:"ATL-2-V71",tipologia:"Vivienda",planta:"-",superficie:135.2,precio:764000,estado:"disponible",notas:""},
    {id:"V_ATL_2_V72",ref:"ATL-2-V72",tipologia:"Vivienda",planta:"-",superficie:134.9,precio:699000,estado:"reservada",notas:"ANTONIO DIEZ DE LA CORTINA NUÑEZ"},
    {id:"V_ATL_P1",ref:"ATL-P1",tipologia:"Parcela",planta:"-",superficie:132.58,precio:239000,estado:"reservada",notas:"ISABEL MARÍA GÓMEZ EGEA"},
    {id:"V_ATL_P2",ref:"ATL-P2",tipologia:"Parcela",planta:"-",superficie:123.55,precio:230000,estado:"reservada",notas:"DIEGO JESÚS MORIEL GARCESO"},
    {id:"V_ATL_P3",ref:"ATL-P3",tipologia:"Parcela",planta:"-",superficie:172.24,precio:220000,estado:"disponible",notas:""},
    {id:"V_ATL_P4",ref:"ATL-P4",tipologia:"Parcela",planta:"-",superficie:154.39,precio:250000,estado:"reservada",notas:"JOSÉ MORIEL DURAN"},
    {id:"V_ATL_P5",ref:"ATL-P5",tipologia:"Parcela",planta:"-",superficie:122.54,precio:264000,estado:"reservada",notas:"FRANCISCO LUIS CRESPILLO FERNÁNDEZ"},
    {id:"V_ATL_P6",ref:"ATL-P6",tipologia:"Parcela",planta:"-",superficie:122.5,precio:264000,estado:"reservada",notas:"FRANCISCO LUIS CRESPILLO FERNÁNDEZ"},
    {id:"V_ATL_P7",ref:"ATL-P7",tipologia:"Parcela",planta:"-",superficie:122.57,precio:307000,estado:"disponible",notas:""},
    {id:"V_ATL_P8",ref:"ATL-P8",tipologia:"Parcela",planta:"-",superficie:122.57,precio:290000,estado:"reservada",notas:"JOSE PALMA MEDINA"},
    {id:"V_ATL_P9",ref:"ATL-P9",tipologia:"Parcela",planta:"-",superficie:122.5,precio:308000,estado:"disponible",notas:""},
    {id:"V_ATL_P10",ref:"ATL-P10",tipologia:"Parcela",planta:"-",superficie:122.64,precio:308000,estado:"disponible",notas:""},
    {id:"V_ATL_P11",ref:"ATL-P11",tipologia:"Parcela",planta:"-",superficie:135.1,precio:280000,estado:"disponible",notas:""},
    {id:"V_ATL_P12",ref:"ATL-P12",tipologia:"Parcela",planta:"-",superficie:141.4,precio:225000,estado:"reservada",notas:"LOREA ARIADNA RUIZ GÓMEZ"},
    {id:"V_ATL_P13",ref:"ATL-P13",tipologia:"Parcela",planta:"-",superficie:128.66,precio:268000,estado:"disponible",notas:""},
    {id:"V_ATL_P14",ref:"ATL-P14",tipologia:"Parcela",planta:"-",superficie:122.96,precio:245000,estado:"reservada",notas:"ERNESTO MATA LOPEZ"},
    {id:"V_ATL_P15",ref:"ATL-P15",tipologia:"Parcela",planta:"-",superficie:142.14,precio:230000,estado:"reservada",notas:"UNVEIL SPAIN S.L"},
    {id:"V_ATL_P16",ref:"ATL-P16",tipologia:"Parcela",planta:"-",superficie:149.07,precio:296000,estado:"disponible",notas:""},
    {id:"V_ATL_P17",ref:"ATL-P17",tipologia:"Parcela",planta:"-",superficie:125.79,precio:290000,estado:"disponible",notas:""},
    {id:"V_ATL_P18",ref:"ATL-P18",tipologia:"Parcela",planta:"-",superficie:135.87,precio:225000,estado:"reservada",notas:"ALFONSO LÓPEZ MUÑOZ"},
    {id:"V_ATL_P19",ref:"ATL-P19",tipologia:"Parcela",planta:"-",superficie:122.5,precio:280000,estado:"disponible",notas:""},
    {id:"V_ATL_P20",ref:"ATL-P20",tipologia:"Parcela",planta:"-",superficie:122.5,precio:280000,estado:"disponible",notas:""},
    {id:"V_ATL_P21",ref:"ATL-P21",tipologia:"Parcela",planta:"-",superficie:122.5,precio:280000,estado:"disponible",notas:""},
    {id:"V_ATL_P22",ref:"ATL-P22",tipologia:"Parcela",planta:"-",superficie:122.5,precio:280000,estado:"disponible",notas:""},
    {id:"V_ATL_P23",ref:"ATL-P23",tipologia:"Parcela",planta:"-",superficie:122.5,precio:280000,estado:"disponible",notas:""},
    {id:"V_ATL_P24",ref:"ATL-P24",tipologia:"Parcela",planta:"-",superficie:122.5,precio:280000,estado:"disponible",notas:""},
  ],
  bp:null,marketing:null,master:null,resumenSemanal:"",ultimaActualizacion:"2026-09-28"},
  {id:2,name:"MEDHILLS",zona:"Sur",estado:"en-riesgo",projectOwner:"Sandra",pmTecnico:"Inma (BSA)",responsableComercial:"Sandra",comercializadora:"Engel & Volkers",ubicacion:"Fuengirola",presupuesto:"EUR5.1M",costeActual:"EUR4.8M",fechaEntrega:"2027-03-01",
  hitos:[
    {nombre:"Demolicion",estado:"completado",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Licencia parcelacion",estado:"completado",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Licencia de obra",estado:"en-curso",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Proyecto ejecucion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Licitacion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Construccion excavacion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Construccion civil",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Construccion edificacion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Licencia 1a ocupacion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
  ],
  blockers:[],tareas:[],
  viviendas:[
    {id:"V_B1_402",ref:"B1-402",tipologia:"Parcela",planta:"-",superficie:0,precio:27,estado:"vendida",notas:"EVA MIRANDA JIMENEZ - Best House - CPCV: 2024-07-29"},
    {id:"V_B1_403",ref:"B1-403",tipologia:"Parcela",planta:"-",superficie:3,precio:29,estado:"vendida",notas:"FRANCISCO SENA FLORES - Best House - CPCV: 2024-09-20"},
    {id:"V_B1_601",ref:"B1-601",tipologia:"Parcela",planta:"-",superficie:20,precio:91,estado:"vendida",notas:"Juan Carlos Aguilera Duarte - TERRA NEGOCIOS INMOBILIARIOS"},
    {id:"V_B1_603",ref:"B1-603",tipologia:"Parcela",planta:"-",superficie:16,precio:8,estado:"disponible",notas:"ALICIA HU BU - Invest Casa"},
    {id:"V_B1_801",ref:"B1-801",tipologia:"Parcela",planta:"-",superficie:5,precio:45,estado:"disponible",notas:""},
    {id:"V_B1_802",ref:"B1-802",tipologia:"Parcela",planta:"-",superficie:6,precio:47,estado:"vendida",notas:"ORIOL CALL PIÑOL - Invest Casa - CPCV: 2024-10-22"},
    {id:"V_B1_803",ref:"B1-803",tipologia:"Parcela",planta:"-",superficie:21,precio:49,estado:"disponible",notas:""},
    {id:"V_B1_805",ref:"B1-805",tipologia:"Parcela",planta:"-",superficie:14,precio:5,estado:"vendida",notas:"LUIS ANTONIO BARRADO BEN-ABOUHAS - Marbella In - CPCV: 2024-09-23"},
    {id:"V_B1_806",ref:"B1-806",tipologia:"Parcela",planta:"-",superficie:1,precio:61,estado:"disponible",notas:""},
    {id:"V_B2_302",ref:"B2-302",tipologia:"Parcela",planta:"-",superficie:12,precio:63,estado:"vendida",notas:"MANUELA HOLMER LAGE"},
    {id:"V_B2_303",ref:"B2-303",tipologia:"Parcela",planta:"-",superficie:15,precio:65,estado:"vendida",notas:"MATIAS NUÑEZ CORTES - CPCV: 2024-04-16"},
    {id:"V_B2_304",ref:"B2-304",tipologia:"Parcela",planta:"-",superficie:2,precio:67,estado:"vendida",notas:"ANTONIO ROMERO - Carmen Guerra Tirado (Casas Benalmádena) - CPCV: 2024-06-25"},
    {id:"V_B3_301",ref:"B3-301",tipologia:"Parcela",planta:"-",superficie:0,precio:71,estado:"vendida",notas:"JESUS CARRASCO GIL"},
    {id:"V_B3_305",ref:"B3-305",tipologia:"Parcela",planta:"-",superficie:36,precio:100,estado:"vendida",notas:"REBECA VELARDE LOPEZ"},
    {id:"V_B3_707",ref:"B3-707",tipologia:"Parcela",planta:"-",superficie:26,precio:131,estado:"vendida",notas:"JUAN MANUEL VILLANUEVA RUIZ - Arena Blanca Development SL"},
    {id:"V_B4_302",ref:"B4-302",tipologia:"Parcela",planta:"-",superficie:59,precio:134,estado:"vendida",notas:"Ruth Esther José Estévez Jiménez"},
    {id:"V_B4_304",ref:"B4-304",tipologia:"Parcela",planta:"-",superficie:68,precio:314,estado:"vendida",notas:"Isabel Moreno Osorio"},
    {id:"V_B4_504",ref:"B4-504",tipologia:"Parcela",planta:"-",superficie:95,precio:238,estado:"vendida",notas:"ALEJANDRO ROIGE GODIA"},
    {id:"V_B4_601",ref:"B4-601",tipologia:"Parcela",planta:"-",superficie:73,precio:151,estado:"vendida",notas:"Miguel Romero Heredia"},
    {id:"V_B4_701",ref:"B4-701",tipologia:"Parcela",planta:"-",superficie:48,precio:143,estado:"vendida",notas:"José Romero Olmo"},
    {id:"V_B4_705",ref:"B4-705",tipologia:"Parcela",planta:"-",superficie:28,precio:95,estado:"disponible",notas:""},
    {id:"V_B5_103",ref:"B5-103",tipologia:"Parcela",planta:"-",superficie:0,precio:195,estado:"disponible",notas:"Bernardo García Herrero"},
    {id:"V_B5_104",ref:"B5-104",tipologia:"Parcela",planta:"-",superficie:0,precio:191,estado:"vendida",notas:"Juan Bermúdez Heredia"},
    {id:"V_B5_105",ref:"B5-105",tipologia:"Parcela",planta:"-",superficie:119,precio:181,estado:"vendida",notas:"Ana Fernández García"},
    {id:"V_B5_106",ref:"B5-106",tipologia:"Parcela",planta:"-",superficie:113,precio:183,estado:"vendida",notas:"Rubén Cofiño Arguijo"},
    {id:"V_B5_107",ref:"B5-107",tipologia:"Parcela",planta:"-",superficie:116,precio:248,estado:"disponible",notas:"Enrique Millán Rodríguez"},
    {id:"V_B5_108",ref:"B5-108",tipologia:"Parcela",planta:"-",superficie:114,precio:203,estado:"vendida",notas:"Roberto Delgado de Torres Álvarez"},
    {id:"V_B5_110",ref:"B5-110",tipologia:"Parcela",planta:"-",superficie:0,precio:185,estado:"vendida",notas:"Aaron Duran Serrano"},
    {id:"V_B5_214",ref:"B5-214",tipologia:"Parcela",planta:"-",superficie:107,precio:178,estado:"vendida",notas:"Juan Carlos Nieves Gallego"},
    {id:"V_B5_220",ref:"B5-220",tipologia:"Parcela",planta:"-",superficie:125,precio:207,estado:"vendida",notas:"José Javier Alcalde Martínez"},
    {id:"V_B5_315",ref:"B5-315",tipologia:"Parcela",planta:"-",superficie:138,precio:281,estado:"vendida",notas:"Jorge Manuel Gaitán Fukushima"},
    {id:"V_B5_317",ref:"B5-317",tipologia:"Parcela",planta:"-",superficie:168,precio:279,estado:"vendida",notas:"NAZLY LEUDO VELASCO"},
    {id:"V_B5_404",ref:"B5-404",tipologia:"Parcela",planta:"-",superficie:150,precio:156,estado:"vendida",notas:"SIMONA KONIAROVA - Sol and sea homes - CPCV: 2024-11-14"},
    {id:"V_B5_407",ref:"B5-407",tipologia:"Parcela",planta:"-",superficie:134,precio:250,estado:"vendida",notas:"MARIA LORETO BERMEJO BARBAZÁN - Invest Casa"},
    {id:"V_B5_414",ref:"B5-414",tipologia:"Parcela",planta:"-",superficie:169,precio:282,estado:"disponible",notas:"Sonia Vaño Salvador - INVESTCASA"},
    {id:"V_B5_415",ref:"B5-415",tipologia:"Parcela",planta:"-",superficie:163,precio:256,estado:"vendida",notas:"Francisco Eduardo Gómez Palazón"},
    {id:"V_B5_416",ref:"B5-416",tipologia:"Parcela",planta:"-",superficie:151,precio:247,estado:"vendida",notas:"Álvaro Jiménez González"},
    {id:"V_B5_520",ref:"B5-520",tipologia:"Parcela",planta:"-",superficie:0,precio:188,estado:"disponible",notas:"Juan Antonio Cruz López"},
    {id:"V_B5_603",ref:"B5-603",tipologia:"Parcela",planta:"-",superficie:100,precio:167,estado:"disponible",notas:""},
    {id:"V_B5_611",ref:"B5-611",tipologia:"Parcela",planta:"-",superficie:200,precio:372,estado:"disponible",notas:""},
    {id:"V_B6_302",ref:"B6-302",tipologia:"Parcela",planta:"-",superficie:0,precio:322,estado:"vendida",notas:"Carlos María Gaitán Cáceres"},
    {id:"V_B6_304",ref:"B6-304",tipologia:"Parcela",planta:"-",superficie:0,precio:317,estado:"vendida",notas:"Carlos Javier Ortiz Arrocha"},
    {id:"V_B6_306",ref:"B6-306",tipologia:"Parcela",planta:"-",superficie:178,precio:320,estado:"vendida",notas:"Kevin Van Krimpen Barredo"},
    {id:"V_B6_401",ref:"B6-401",tipologia:"Parcela",planta:"-",superficie:179,precio:332,estado:"disponible",notas:"Arsenio José Martín Sánchez"},
    {id:"V_B6_405",ref:"B6-405",tipologia:"Parcela",planta:"-",superficie:181,precio:399,estado:"vendida",notas:"Ana Isabel Bernal Cruz"},
    {id:"V_B6_506",ref:"B6-506",tipologia:"Parcela",planta:"-",superficie:175,precio:306,estado:"vendida",notas:"ALEJANDRO VALENZUELA MEJÍAS"},
    {id:"V_B6_507",ref:"B6-507",tipologia:"Parcela",planta:"-",superficie:158,precio:347,estado:"vendida",notas:"Pablo Jiménez González"},
    {id:"V_B6_607",ref:"B6-607",tipologia:"Parcela",planta:"-",superficie:159,precio:349,estado:"vendida",notas:"Jonatan Aguilar Cruz"},
    {id:"V_B6_702",ref:"B6-702",tipologia:"Parcela",planta:"-",superficie:173,precio:301,estado:"vendida",notas:"David García Jordan"},
    {id:"V_B6_704",ref:"B6-704",tipologia:"Parcela",planta:"-",superficie:170,precio:293,estado:"vendida",notas:"Oscar Moro Delgado"},
    {id:"V_B6_705",ref:"B6-705",tipologia:"Parcela",planta:"-",superficie:176,precio:297,estado:"disponible",notas:"Eduard Henricus Deckers/Elsje Kristine Marianne Baken - Your Destinations"},
    {id:"V_B6_706",ref:"B6-706",tipologia:"Parcela",planta:"-",superficie:157,precio:258,estado:"vendida",notas:"ROCIO SANCHEZ CANO - TERRA NEGOCIOS INMOBILIARIOS"},
    {id:"V_B6_708",ref:"B6-708",tipologia:"Parcela",planta:"-",superficie:214,precio:304,estado:"vendida",notas:"Alberto Varas Pérez"},
    {id:"V_B7_403",ref:"B7-403",tipologia:"Parcela",planta:"-",superficie:231,precio:389,estado:"vendida",notas:"David Muñoz Soto"},
    {id:"V_B7_407",ref:"B7-407",tipologia:"Parcela",planta:"-",superficie:224,precio:387,estado:"vendida",notas:"Ainoa García Molina"},
    {id:"V_B7_501",ref:"B7-501",tipologia:"Parcela",planta:"-",superficie:183,precio:357,estado:"vendida",notas:"Juan José González Arias"},
  ],
  bp:null,marketing:null,master:null,resumenSemanal:"",ultimaActualizacion:"2025-06-01"},
  {id:1784011765780,name:"MARLOW",zona:"Sur",estado:"planificacion",projectOwner:"Alberto",pmTecnico:"Inma (BSA)",responsableComercial:"Alberto",comercializadora:"NVOGA",ubicacion:"Marbella, Málaga",presupuesto:"EUR308.91M",costeActual:"",fechaEntrega:"2028-10-16",
  hitos:[
    {nombre:"Demolicion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Licencia parcelacion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Licencia de obra",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Proyecto ejecucion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Licitacion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Construccion excavacion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Construccion civil",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Construccion edificacion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
    {nombre:"Licencia 1a ocupacion",estado:"pendiente",fechaPrevista:"",fechaReal:"",notas:""},
  ],
  blockers:[],tareas:[],viviendas:[],bp:null,marketing:null,master:null,resumenSemanal:"",ultimaActualizacion:"2026-09-28"},
];

const fmt = d => { if(!d) return "-"; try { return new Date(d+"T00:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"}); } catch { return d; } };
const fmtEur = n => { const v=Number(n); if(!v&&v!==0) return "-"; return new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(v); };
const fmtEurM = n => { const v=Number(n); if(!v) return "-"; if(Math.abs(v)>=1000000) return "EUR"+(v/1000000).toFixed(2)+"M"; if(Math.abs(v)>=1000) return "EUR"+(v/1000).toFixed(0)+"K"; return fmtEur(v); };
const fmtPct = n => { const v=Number(n); if(!v&&v!==0) return "-"; return (v*100).toFixed(1)+"%"; };
const fmtNum = n => new Intl.NumberFormat("es-ES").format(Number(n)||0);

const isViv = v => {
  const r=String(v.ref||"").toUpperCase();
  const t=String(v.tipologia||"").toUpperCase();
  const tipo=String(v.tipo||"").toUpperCase();
  // Explicit non-vivienda types
  if(tipo==="PK"||tipo==="TR"||tipo==="PARKING"||tipo==="TRASTERO") return false;
  if(t.includes("PARCELA")||t.includes("PARKING")||t.includes("TRASTERO")) return false;
  // Explicit vivienda types
  if(tipo==="VIV"||t.includes("VIVIENDA")||r.includes("-V")) return true;
  // Default: if ref ends in -P followed by digits it's a parking/parcela
  if(/-P\d/.test(r)) return false;
  return true;
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
  const estadoMap={"reservada":"reservada","disponible":"disponible","vendida":"vendida","rescindida":"rescindida","no-venta":"no-venta"};
  return master.ventas.map(v=>({
    id:v.ref,
    ref:v.ref,
    tipo:v.tipo||"VIV",
    tipologia:v.tipo==="VIV"||v.tipo==="VIVIENDA"||v.ref.toUpperCase().includes("-V")?"Vivienda":(v.tipo==="PK"?"Parking":v.tipo==="TR"?"Trastero":"Parcela"),
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
    // B.09 sub-epígrafes: B.09-1 Material Comercial, B.09-2 Agentes Externos, B.09-3 Master Broker
    // Busca en cualquier columna de la fila (t1-t5) — el código/texto puede estar en columnas distintas según BP
    const t3u=t3.toUpperCase();const t4u=t4.toUpperCase();
    const anyRowText=[tv(r,1).toUpperCase(),tv(r,2).toUpperCase(),t3u,t4u,t5u];
    const rowHas=s=>anyRowText.some(t=>t.includes(s));
    // Sub-epígrafes primero (más específicos) antes que el total B.09
    if((rowHas("MATERIAL COMERCIAL")||rowHas("B.09-1"))&&!f.materialComercial){f.materialComercial=estatico?nv(r,32):nv(r,37)||nv(r,32);}
    else if((rowHas("AGENTES EXTERNOS")||rowHas("B.09-2"))&&!f.agentesExternos){f.agentesExternos=estatico?nv(r,32):nv(r,37)||nv(r,32);}
    else if((rowHas("MASTER BROKER")||rowHas("B.09-3"))&&!f.masterBrokerBP){f.masterBrokerBP=estatico?nv(r,32):nv(r,37)||nv(r,32);}
    // B.09 total COMERCIALIZACIÓN — solo si no es ya un sub-epígrafe
    if(t5u.includes("COMERCIALIZACI")&&!rowHas("B.09-1")&&!rowHas("B.09-2")&&!rowHas("B.09-3")&&!rowHas("MATERIAL COMERCIAL")&&!rowHas("AGENTES EXTERNOS")&&!rowHas("MASTER BROKER")){if(!f.comercialPrev){f.comercialPrev=nv(r,32);f.comercialActual=estatico?nv(r,32):nv(r,37);}}
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
      const estadoMap={"reservado":"reservada","reservada":"reservada","vendido":"vendida","vendida":"vendida","libre":"disponible","disponible":"disponible","rescindida":"rescindida","rescision":"rescindida","rescisión":"rescindida","baja":"rescindida","bloqueado":"no-venta","bloqueado promotor":"no-venta","bloqueado promotor ":"no-venta"};
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
    // Extract fees from Cash Flow sheets - consolidado for totals, individual for per-negocio breakdown
    const cfSheets=["Cash Flow consolidado","Cash Flow consolidado (desc)","Cash Flow Living","Cash Flow Suites","Cash Flow Suites Marbella","Cash Flow Wellness","Cash Flow Viviendas"];
    const feesByNegocio={};
    for(const cfName of cfSheets){
      if(!wb.Sheets[cfName]) continue;
      const cfRows=sheetRows(cfName);
      const isConsolidado=cfName.toLowerCase().includes("consolidado");
      const negocioName=isConsolidado?"Consolidado":cfName.replace("Cash Flow ","").trim();
      const fees={nombre:negocioName,mktSalesMgmt:0,masterBroker:0,structuringFee:0,comercialTotal:0,bankGuarantee:0};
      for(let i=0;i<cfRows.length;i++){
        const r=cfRows[i];if(!r) continue;
        const t1=tv(r,1);
        const v=Math.abs(nv(r,4))||Math.abs(nv(r,32))||0;
        if(t1.includes("Marketing and Sales Mgmt")||t1.includes("Marketing and Sales Coord")) fees.mktSalesMgmt=v;
        if(t1.includes("Master Broker")) fees.masterBroker=v;
        if(t1.includes("Structuring fee")||t1.includes("Exit Fee")) fees.structuringFee=v;
        if(t1.includes("Marketing, Broker Sales")||t1.includes("Commercial Fees")) fees.comercialTotal=v;
        if(t1.includes("Buyers Bank Guarantee")) fees.bankGuarantee=v;
      }
      if(fees.mktSalesMgmt||fees.masterBroker||fees.structuringFee||fees.comercialTotal){
        feesByNegocio[negocioName]=fees;
        // Set consolidado values as main fin values
        if(isConsolidado){
          if(fees.mktSalesMgmt) fin.mktSalesMgmt=fees.mktSalesMgmt;
          if(fees.masterBroker) fin.masterBroker=fees.masterBroker;
          if(fees.structuringFee) fin.structuringFee=fees.structuringFee;
          if(fees.comercialTotal) fin.comercialFeesTotal=fees.comercialTotal;
          if(fees.bankGuarantee) fin.bankGuaranteeFee=fees.bankGuarantee;
        } else if(!fin.mktSalesMgmt&&fees.mktSalesMgmt){
          fin.mktSalesMgmt=fees.mktSalesMgmt;
        }
      }
    }
    // Store per-negocio fees breakdown (exclude consolidado from breakdown list)
    const feeDesglose=Object.values(feesByNegocio).filter(f=>f.nombre!=="Consolidado");
    if(feeDesglose.length>0) fin.feesByNegocio=feeDesglose;
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
    // Priority 1b: B.09-1 Material Comercial (sub-epígrafe del BP resumen) — más preciso que Fees sheet
    if(!feesFound&&fin.materialComercial){fin.mktBudget=fin.materialComercial;feesFound=true;}
    // Priority 2: Cash Flow "Marketing and Sales Mgmt." (Elviria multi-negocio)
    if(!feesFound){
      if(fin.mktSalesMgmt) fin.mktBudget=fin.mktSalesMgmt;
      // Priority 3: Total COMERCIALIZACION como último recurso (incluye fees comerciales)
      else fin.mktBudget=fin.materialComercial||fin.comercialActual||0;
    }

    fin.viviendas=viviendas;
    result.ok=true;result.data=fin;
  } catch(e){result.error=e.message;}
  return result;
};

const Btn = ({onClick,children,v="ghost",sm}) => {
  const S={primary:{background:"#c9a86c",color:"#fff",border:"none"},danger:{background:"transparent",color:"#e05a5a",border:"1px solid rgba(224,90,90,0.3)"},ghost:{background:"transparent",color:"#6B7A8A",border:"1px solid #DDD8CF"}};
  return <button onClick={onClick} style={{...S[v],borderRadius:8,padding:sm?"4px 10px":"7px 16px",cursor:"pointer",fontSize:sm?"0.73rem":"0.84rem",fontWeight:600,fontFamily:"inherit",whiteSpace:"nowrap"}}>{children}</button>;
};
const FL = ({label,children}) => (
  <div style={{marginBottom:12}}>
    <div style={{fontSize:"0.7rem",color:"#6B7A8A",fontWeight:700,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</div>
    {children}
  </div>
);
const Modal = ({title,onClose,children,wide}) => (
  <div onMouseDown={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{background:"#FFFFFF",border:"1px solid #DDD8CF",borderRadius:16,padding:28,width:wide?700:500,maxWidth:"100%",maxHeight:"92vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div style={{fontWeight:800,fontSize:"1rem"}}>{title}</div>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6B7A8A",fontSize:"1.3rem",cursor:"pointer",lineHeight:1}}>x</button>
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
      <FL label="Estado"><select style={CSS.inp} value={vF.estado} onChange={e=>onChange("estado",e.target.value)}><option value="disponible">Disponible</option><option value="reservada">Reservada</option><option value="vendida">Vendida</option><option value="rescindida">Rescisión</option><option value="no-venta">No venta</option></select></FL>
    </div>
    <FL label="Notas"><input style={CSS.inp} value={vF.notas} onChange={e=>onChange("notas",e.target.value)}/></FL>
    <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}><Btn onClick={onClose}>Cancelar</Btn><Btn onClick={onSave} v="primary">{isEdit?"Guardar":"Anadir"}</Btn></div>
  </Modal>);
});

const HitoRow = memo(function HitoRow({h,idx,onCycle,onEdit,onDelete,isDragging,isOver,onDragStart,onDragEnter,onDragEnd}){
  const hs=HITO_EST[h.estado]||HITO_EST.pendiente;
  const borderColor=isOver?"2px solid #4f8ef7":(h.estado==="retrasado"?"1px solid rgba(224,90,90,0.4)":h.estado==="en-curso"?"1px solid rgba(201,168,108,0.25)":"1px solid #DDD8CF");
  return (
    <div draggable="true" onDragStart={()=>onDragStart(idx)} onDragEnter={()=>onDragEnter(idx)} onDragOver={e=>e.preventDefault()} onDragEnd={onDragEnd}
      style={{display:"flex",alignItems:"center",gap:12,background:isDragging?"#DDD8CF":"#FFFFFF",borderRadius:11,border:borderColor,padding:"12px 15px",marginBottom:7,opacity:isDragging?0.5:1,cursor:"grab",userSelect:"none"}}>
      <div style={{color:"#B0BBC6",fontSize:"1.1rem",flexShrink:0}}>::::</div>
      <div onClick={()=>onCycle(idx)} style={{width:32,height:32,borderRadius:"50%",background:hs.bg,border:"2px solid "+hs.color,display:"flex",alignItems:"center",justifyContent:"center",color:hs.color,fontWeight:800,fontSize:"0.9rem",flexShrink:0,cursor:"pointer"}}>
        {hs.icon}
      </div>
      <div style={{flex:1}}>
        <div style={{fontWeight:600,fontSize:"0.88rem"}}>{h.nombre}</div>
        {h.notas&&<div style={{fontSize:"0.72rem",color:"#6B7A8A",marginTop:2}}>{h.notas}</div>}
      </div>
      <div style={{display:"flex",gap:14,alignItems:"center"}}>
        {h.fechaPrevista&&<span style={{fontSize:"0.71rem",color:"#6B7A8A"}}>Prev: {fmt(h.fechaPrevista)}</span>}
        {h.fechaReal&&<span style={{fontSize:"0.71rem",color:"#4ca99a"}}>Real: {fmt(h.fechaReal)}</span>}
        <span style={{fontSize:"0.64rem",fontWeight:700,padding:"2px 8px",borderRadius:6,background:hs.bg,color:hs.color,textTransform:"uppercase"}}>{h.estado}</span>
      </div>
      <div style={{display:"flex",gap:5}}><Btn onClick={()=>onEdit(idx)} sm>edit</Btn><Btn onClick={()=>onDelete(idx)} v="danger" sm>x</Btn></div>
    </div>
  );
});

const KpiCard = ({label,val,sub,color,prev}) => (
  <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"14px 16px"}}>
    <div style={{fontSize:"0.63rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:6}}>{label}</div>
    <div style={{fontSize:"1.3rem",fontWeight:800,color:color||"#1E2D4E",marginBottom:3}}>{val}</div>
    {sub&&<div style={{fontSize:"0.72rem",color:"#6B7A8A"}}>{sub}</div>}
    {prev&&<div style={{fontSize:"0.7rem",color:"#B0BBC6",marginTop:2}}>BP base: {prev}</div>}
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
    <div style={{height:"100vh",background:"#F7F6F3",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',system-ui,sans-serif"}}>
      <div style={{width:380,padding:"40px 36px",background:"#FFFFFF",borderRadius:20,border:"1px solid #DDD8CF",boxShadow:"0 24px 60px rgba(0,0,0,0.12)"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
            <svg width="260" height="42" viewBox="0 0 1197.3 192.51" xmlns="http://www.w3.org/2000/svg">
              <g fill="#1E2D4E">
                <polygon points="39.02 21.24 163.44 135.19 124.42 170.95 0 57 39.02 21.24"/>
                <rect x="167" y="21.33" width="54.02" height="148.48"/>
                <rect x="6.52" y="121.78" width="54.02" height="49.49"/>
              </g>
              <rect x="290.44" y="0" width="6.01" height="192.51" fill="#1E2D4E"/>
              <g fill="#1E2D4E">
                <path d="M424.19,124.52c-34.3,0-54.97-22.16-54.97-54.19s20.67-54.19,54.97-54.19,54.75,22.16,54.75,54.19-20.67,54.19-54.75,54.19ZM424.19,110.42c25.07,0,37.16-18.13,37.16-40.09s-12.09-40.09-37.16-40.09-37.38,18.13-37.38,40.09,12.09,40.09,37.38,40.09Z"/>
                <path d="M502.03,18.96l31,86.63h.22l31-86.63h19.13l-40.24,102.74h-20.01l-40.24-102.74h19.13Z"/>
                <path d="M674.2,90.07h17.59c-5.72,19.14-21.77,34.45-49.69,34.45-34.08,0-54.75-21.96-54.75-54.19,0-34.25,21.11-54.19,53.87-54.19,35.18,0,52.33,21.96,52.33,58.42h-88.61c0,18.53,12.09,35.86,36.5,35.86,22.43,0,30.78-13.3,32.76-20.35ZM604.94,60.46h71.02c0-16.52-13.63-30.22-34.74-30.22s-36.28,13.7-36.28,30.22Z"/>
                <path d="M770.29,16.74v16.12h-.44c-24.41-3.63-41.34,12.09-41.34,34.05v54.8h-17.59V18.96h17.59v20.35h.44c5.94-13.5,14.95-23.17,31-23.17,4.18,0,7.26.2,10.34.6Z"/>
                <path d="M793.82,18.96l31,86.63h.22l31-86.63h19.13l-40.24,102.74h-20.01l-40.24-102.74h19.13Z"/>
                <path d="M907.5,18.96v102.74h-17.59V18.96h17.59Z"/>
                <path d="M1014.36,90.07h17.59c-5.72,19.14-21.77,34.45-49.69,34.45-34.08,0-54.75-21.96-54.75-54.19,0-34.25,21.11-54.19,53.87-54.19,35.18,0,52.33,21.96,52.33,58.42h-88.61c0,18.53,12.09,35.86,36.5,35.86,22.43,0,30.78-13.3,32.76-20.35ZM945.1,60.46h71.02c0-16.52-13.63-30.22-34.74-30.22s-36.28,13.7-36.28,30.22Z"/>
                <path d="M1057.02,18.96l25.51,85.21h.44l25.07-85.21h18.69l25.29,85.21h.44l25.51-85.21h19.35l-35.84,102.74h-18.69l-25.29-84.81h-.44l-24.85,84.81h-18.69l-35.84-102.74h19.35Z"/>
              </g>
            </svg>
          </div>
          <div style={{fontSize:"0.73rem",color:"#8A9BAA",letterSpacing:"0.12em",textTransform:"uppercase"}}>Estrategia inmobiliaria con vision</div>
          <div style={{width:40,height:1,background:"#c9a86c",margin:"16px auto 0"}}/>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:"0.72rem",color:"#6B7A8A",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Usuario</div>
          <input value={user} onChange={e=>{setUser(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&doLogin()} placeholder="Usuario" autoFocus style={{...CSS.inp,padding:"10px 14px",fontSize:"0.9rem",border:err?"1px solid #f05a5a":"1px solid #DDD8CF"}}/>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:"0.72rem",color:"#6B7A8A",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.06em"}}>Contrasena</div>
          <div style={{position:"relative"}}>
            <input value={pass} onChange={e=>{setPass(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&doLogin()} type={show?"text":"password"} placeholder="Contrasena" style={{...CSS.inp,padding:"10px 14px",fontSize:"0.9rem",border:err?"1px solid #f05a5a":"1px solid #DDD8CF",paddingRight:40}}/>
            <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#6B7A8A",cursor:"pointer",fontSize:"0.85rem",padding:0}}>{show?"[H]":"[V]"}</button>
          </div>
        </div>
        {err&&<div style={{background:"rgba(224,90,90,0.1)",border:"1px solid rgba(224,90,90,0.3)",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:"0.82rem",color:"#e05a5a",textAlign:"center"}}>Usuario o contrasena incorrectos</div>}
        <button onClick={doLogin} style={{width:"100%",background:"#c9a86c",color:"#fff",border:"none",borderRadius:10,padding:"12px",fontWeight:700,fontSize:"0.95rem",cursor:"pointer",fontFamily:"inherit"}}>Entrar</button>
        <div style={{textAlign:"center",marginTop:20,fontSize:"0.72rem",color:"#4a6080"}}>Overview Real Estate 2026</div>
      </div>
    </div>
  );
}


const MasterTab = ({proj, activeId, upd, handleMasterFile, fmt, fmtEur, VIV_ESTADOS}) => {
  if(!proj.master) return (
    <div style={{textAlign:"center",padding:"50px 20px",color:"#6B7A8A",background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF"}}>
      <div style={{fontSize:"2rem",marginBottom:10}}>MC</div>
      <div style={{fontWeight:700,fontSize:"1rem",color:"#1E2D4E",marginBottom:6}}>Master Comercial no cargado</div>
      <div style={{fontSize:"0.8rem",marginBottom:20}}>Importa el master comercial para ver ventas, repricings y rescisiones</div>
      <label style={{background:"#c9a86c",color:"#fff",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:"0.85rem",fontWeight:700}}>
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
  const incrementoTotal=conRepricing.reduce((a,v)=>a+(Number(v.incremento)||0),0);
  const vivsV=vendidas.filter(v=>(v.tipo||"")==="VIVIENDA"||(v.ref||"").includes("-V"));
  const parcV=vendidas.filter(v=>(v.tipo||"")!=="VIVIENDA"&&!(v.ref||"").includes("-V"));
  const precioMedioViv=vivsV.length?Math.round(vivsV.reduce((a,v)=>a+(Number(v.precio)||0),0)/vivsV.length):0;
  const precioMedioParc=parcV.length?Math.round(parcV.reduce((a,v)=>a+(Number(v.precio)||0),0)/parcV.length):0;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontWeight:800,fontSize:"0.95rem"}}>Master Comercial - {proj.name}</div>
          <div style={{fontSize:"0.73rem",color:"#6B7A8A",marginTop:2}}>Importado: {fmt(m.importado||"")} - {ventas.length} unidades</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <label style={{background:"transparent",border:"1px solid #4f8ef7",color:"#c9a86c",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700}}>
            Actualizar<input type="file" accept=".xlsx,.xls" onChange={handleMasterFile} style={{display:"none"}}/>
          </label>
          <button onClick={()=>upd(activeId,p=>({...p,master:null}))} style={{background:"transparent",border:"1px solid rgba(224,90,90,0.3)",color:"#e05a5a",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:600,fontFamily:"inherit"}}>Borrar</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[
          {l:"Total unidades",v:ventas.length,c:"#1E2D4E"},
          {l:"Vendidas/Reservadas",v:vendidas.length,c:"#4ca99a"},
          {l:"Disponibles",v:libres.length,c:"#4ca99a"},
          {l:"Rescisiones",v:rescisiones.length,c:"#e05a5a"},
          {l:"Ingresos comprometidos",v:fmtEur(totalVentas),c:"#4ca99a"},
          {l:"Precio medio VIV",v:fmtEur(precioMedioViv)},
          {l:"Precio medio PARC",v:fmtEur(precioMedioParc)},
          {l:"Incremento medio repricing",v:incrementoMedio>0?fmtEur(incrementoMedio):"-",c:"#ddb96a"},
          {l:"Incremento total repricing",v:incrementoTotal>0?fmtEur(incrementoTotal):"-",c:"#c9a86c"},
          {l:"Comisiones totales",v:fmtEur(comisionTotal),c:"#f5924e"},
        ].map(k=>(
          <div key={k.l} style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"12px 14px"}}>
            <div style={{fontSize:"0.61rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{k.l}</div>
            <div style={{fontSize:"1rem",fontWeight:800,color:k.c||"#1E2D4E"}}>{k.v}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #DDD8CF",fontWeight:700,fontSize:"0.86rem",display:"flex",justifyContent:"space-between"}}>
          <span>Tabla de ventas</span>
          <span style={{fontSize:"0.72rem",color:"#6B7A8A",fontWeight:400}}>{vendidas.length} comprometidas</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 0.7fr 0.9fr 1fr 1fr 1fr 0.8fr 1fr",padding:"8px 16px",borderBottom:"1px solid #DDD8CF"}}>
          {["Ref","Tipo","Status","Precio origen","Precio actual","Incremento","m2","F. Reserva"].map(h=>(
            <div key={h} style={{fontSize:"0.61rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>
          ))}
        </div>
        <div style={{maxHeight:400,overflowY:"auto"}}>
          {ventas.map((v,i)=>{
            // Determinar sKey: el status ya calculado por el parser es fiable (nuevo import)
            // Para imports antiguos sin statusExcel, usar status tal cual
            const statusExcelMap={"reserva":"reservada","reservado":"reservada","cv":"reservada","libre":"disponible","disponible":"disponible","escritura":"vendida","escriturado":"vendida","vendida":"vendida","baja":"rescindida","rescision":"rescindida","rescindida":"rescindida"};
            const rawExcel=(v.statusExcel||"").toLowerCase().trim();
            const sKeyFromExcel=rawExcel&&rawExcel!=="—"?(statusExcelMap[rawExcel]||(rawExcel.includes("bloqueado")?"no-venta":null)):null;
            const sKey=sKeyFromExcel||v.status||"disponible";
            const vs=VIV_ESTADOS[sKey]||VIV_ESTADOS.disponible;
            const inc=Number(v.incremento)||0;
            const labelMostrar=v.statusExcel&&v.statusExcel!=="—"?v.statusExcel:vs.label;
            return (
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 0.7fr 0.9fr 1fr 1fr 1fr 0.8fr 1fr",padding:"9px 16px",borderBottom:i<ventas.length-1?"1px solid #E8E2D8":"none",alignItems:"center"}}
                onMouseEnter={e=>e.currentTarget.style.background="#EDE8DF"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{fontWeight:600,fontSize:"0.82rem"}}>{v.ref||"-"}</div>
                <div style={{fontSize:"0.78rem",color:"#6B7A8A"}}>{(v.tipo||"")==="VIVIENDA"?"VIV":"PA"}</div>
                <div><span style={{fontSize:"0.65rem",fontWeight:700,padding:"2px 6px",borderRadius:6,background:vs.color+"18",color:vs.color}}>{labelMostrar}</span></div>
                <div style={{fontSize:"0.82rem",color:"#6B7A8A"}}>{fmtEur(v.precioOrigen)}</div>
                <div style={{fontSize:"0.84rem",fontWeight:700}}>{fmtEur(v.precio)}</div>
                <div style={{fontSize:"0.82rem",color:inc>0?"#4ca99a":"#6B7A8A",fontWeight:inc>0?600:400}}>{inc>0?"+"+fmtEur(inc):"-"}</div>
                <div style={{fontSize:"0.78rem",color:"#6B7A8A"}}>{v.m2?v.m2+" m2":"-"}</div>
                <div style={{fontSize:"0.75rem",color:"#6B7A8A"}}>{v.fReserva?fmt(v.fReserva):"-"}</div>
              </div>
            );
          })}
        </div>
      </div>
      {rescisiones.length>0&&(
        <div style={{background:"rgba(224,90,90,0.06)",border:"1px solid rgba(224,90,90,0.2)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"12px 18px",borderBottom:"1px solid rgba(224,90,90,0.15)",fontWeight:700,fontSize:"0.86rem",color:"#e05a5a"}}>Rescisiones ({rescisiones.length})</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"8px 16px",borderBottom:"1px solid rgba(224,90,90,0.1)"}}>
            {["Ref","Fecha","Precio","Comprador"].map(h=><div key={h} style={{fontSize:"0.61rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>)}
          </div>
          {rescisiones.map((r,i)=>(
            <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",padding:"9px 16px",borderBottom:i<rescisiones.length-1?"1px solid rgba(224,90,90,0.08)":"none",alignItems:"center"}}>
              <div style={{fontWeight:600,fontSize:"0.82rem"}}>{r.ref||"-"}</div>
              <div style={{fontSize:"0.78rem",color:"#e05a5a"}}>{r.fecha?fmt(r.fecha):"-"}</div>
              <div style={{fontSize:"0.82rem"}}>{fmtEur(r.precio)}</div>
              <div style={{fontSize:"0.78rem",color:"#6B7A8A"}}>{r.nombre||"-"}</div>
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
      return <div style={{padding:40,fontFamily:"sans-serif",background:"#F7F6F3",color:"#1E2D4E",minHeight:"100vh"}}>
        <div style={{maxWidth:600,margin:"0 auto",paddingTop:80}}>
          <div style={{fontSize:"1.2rem",fontWeight:700,color:"#e05a5a",marginBottom:16}}>Error al cargar la aplicacion</div>
          <div style={{fontSize:"0.85rem",color:"#6B7A8A",fontFamily:"monospace",background:"#FFFFFF",padding:16,borderRadius:8,marginBottom:20}}>{String(this.state.error)}</div>
          <div style={{fontSize:"0.82rem",color:"#6B7A8A",marginBottom:16}}>Puede que haya datos incompatibles guardados. Prueba a limpiar el cache:</div>
          <button onClick={()=>{localStorage.clear();sessionStorage.clear();window.location.reload();}} style={{background:"#c9a86c",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:"0.88rem",fontWeight:600}}>Limpiar cache y recargar</button>
        </div>
      </div>;
    }
    return this.props.children;
  }
}


// ─── CRONOGRAMA TAB ──────────────────────────────────────────────────────────
const CronogramaTab = ({proj, activeId, upd}) => {
  const cron = proj.cronograma || null;
  const fileRef = useRef();

  const parseCronogramaExcel = (wb) => {
    // Buscar la hoja 'Planificación(2)'
    const sheetName = wb.SheetNames.find(n => n.includes('Planificaci') && n.includes('2'))
                   || wb.SheetNames.find(n => n.includes('Planif'));
    if (!sheetName) { alert('No se encontró la hoja Planificación(2)'); return null; }
    const ws = wb.Sheets[sheetName];

    // raw:true para recibir los seriales de fecha como número; cellDates ya viene del read
    const rows = window.XLSX.utils.sheet_to_json(ws, {header:1, defval:null, raw:true});

    // Convierte cualquier valor de fecha de SheetJS a string YYYY-MM-DD
    const toDate = (v) => {
      if (v == null || v === '') return null;
      // Objeto Date (cuando cellDates:true en el read)
      if (v instanceof Date) {
        const y = v.getFullYear(), m = v.getMonth()+1, d = v.getDate();
        if (isNaN(y)) return null;
        return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      }
      // Número serial de Excel (entero o float)
      if (typeof v === 'number' && v > 1000) {
        try {
          const parsed = window.XLSX.SSF.parse_date_code(v);
          if (parsed && parsed.y) return `${parsed.y}-${String(parsed.m).padStart(2,'0')}-${String(parsed.d).padStart(2,'0')}`;
        } catch(e) {}
        // Fallback manual: fecha base Excel = 1/1/1900, serial 1
        const base = new Date(Date.UTC(1899,11,30));
        const d2 = new Date(base.getTime() + v * 86400000);
        if (!isNaN(d2.getTime())) {
          return `${d2.getUTCFullYear()}-${String(d2.getUTCMonth()+1).padStart(2,'0')}-${String(d2.getUTCDate()).padStart(2,'0')}`;
        }
      }
      // String con formato YYYY-MM-DD o DD/MM/YYYY
      if (typeof v === 'string') {
        const m1 = v.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
        const m2 = v.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
        if (m2) {
          const yr = m2[3].length === 2 ? '20'+m2[3] : m2[3];
          return `${yr}-${String(m2[2]).padStart(2,'0')}-${String(m2[1]).padStart(2,'0')}`;
        }
      }
      return null;
    };

    // Las dos tablas están en filas fijas (confirmado inspeccionando el archivo):
    // Tabla 1 (Inicial): cabecera fila 4 (idx 3), datos filas 5-16 (idx 4-15)
    // Tabla 2 (Real):    cabecera fila 21 (idx 20), datos filas 22-33 (idx 21-32)
    // Intentamos detectar dinámicamente primero y usamos los valores por defecto como fallback.
    let t1Start = 4, t2Start = 21; // índices 0-based de la primera fila de datos
    for (let i = 0; i < Math.min(rows.length, 40); i++) {
      const rowStr = (rows[i] || []).map(v => v != null ? String(v) : '').join(' ');
      if (rowStr.toUpperCase().includes('INICIAL') && rowStr.toUpperCase().includes('PLANIF') && t1Start === 4) {
        t1Start = i + 2; // saltar fila de cabecera de columnas
      }
      if (!rowStr.toUpperCase().includes('INICIAL') && rowStr.toUpperCase().includes('PLANIF')
          && rowStr.toUpperCase().includes('ELVIRIA') && t2Start === 21) {
        t2Start = i + 2;
      }
    }

    const SKIP_FASES = ['FASE','INICIO DEL PROYECTO','Final de proyecto'];
    const parseTabla = (startIdx) => {
      const result = [];
      for (let i = startIdx; i < Math.min(startIdx + 14, rows.length); i++) {
        const row = rows[i];
        if (!row) continue;
        const fase = row[2] != null ? String(row[2]).trim() : null;
        if (!fase) continue;
        if (SKIP_FASES.some(s => fase.toUpperCase().includes(s.toUpperCase()))) continue;
        const inicio = toDate(row[3]);
        const fin    = toDate(row[4]);
        const dur    = row[5] != null && !isNaN(Number(row[5])) ? parseInt(row[5]) : null;
        // Incluir si tiene fase y al menos una fecha
        if (fase && (inicio || fin)) {
          result.push({ fase: fase.trim(), inicio, fin, duracion: dur });
        }
      }
      return result;
    };

    const t1 = parseTabla(t1Start);
    const t2 = parseTabla(t2Start);

    // Hardcode como respaldo si la detección falló (el archivo Elviria tiene estructura fija)
    if (t1.length === 0 && t2.length === 0) {
      const FASES_ELVIRIA = [
        {fase:'Compra Parcela',         i1:'2021-05-31',f1:'2021-05-31',d1:1,  i2:'2021-05-31',f2:'2021-05-31',d2:1},
        {fase:'Planeamiento urbanístico',i1:null,       f1:null,       d1:0,  i2:'2026-06-11',f2:'2026-10-31',d2:5},
        {fase:'Proyecto Básico',         i1:'2024-04-01',f1:'2025-04-21',d1:13, i2:'2024-04-01',f2:'2025-04-21',d2:13},
        {fase:'Solicitud LOM',           i1:'2025-04-22',f1:'2026-06-01',d1:14, i2:'2025-04-22',f2:'2026-10-01',d2:18},
        {fase:'Salida a Ventas',         i1:'2026-07-01',f1:'2027-10-31',d1:16, i2:'2027-02-01',f2:'2030-03-01',d2:37},
        {fase:'Obtención de Licencia',   i1:'2026-06-01',f1:'2026-06-01',d1:1,  i2:'2026-10-01',f2:'2026-10-01',d2:1},
        {fase:'Proyecto de Ejecución',   i1:'2025-05-01',f1:'2026-02-01',d1:9,  i2:'2026-05-01',f2:'2027-04-01',d2:11},
        {fase:'Licitación',              i1:'2026-04-01',f1:'2026-07-01',d1:3,  i2:'2027-04-01',f2:'2027-07-01',d2:3},
        {fase:'Construcción',            i1:'2026-06-30',f1:'2028-08-30',d1:26, i2:'2027-09-01',f2:'2030-03-01',d2:30},
        {fase:'Gestión doc. DR-LPO',     i1:'2028-08-30',f1:'2028-10-30',d1:2,  i2:'2030-03-01',f2:'2030-06-01',d2:3},
        {fase:'Escrituración',           i1:'2028-10-30',f1:'2028-12-31',d1:2,  i2:'2030-06-01',f2:'2030-10-01',d2:4},
        {fase:'Postventa',               i1:'2028-12-31',f1:'2029-12-31',d1:12, i2:'2030-10-01',f2:'2031-10-01',d2:12},
      ];
      return {
        inicial: FASES_ELVIRIA.map(f=>({fase:f.fase,inicio:f.i1,fin:f.f1,duracion:f.d1})),
        real:    FASES_ELVIRIA.map(f=>({fase:f.fase,inicio:f.i2,fin:f.f2,duracion:f.d2})),
        fecha: new Date().toISOString().substring(0,10),
        source: sheetName + ' (fallback)',
      };
    }

    return { inicial: t1, real: t2, fecha: new Date().toISOString().substring(0,10), source: sheetName };
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // cellDates:true hace que SheetJS convierta seriales a objetos Date automáticamente
      const wb = window.XLSX.read(ev.target.result, {type:'binary', cellDates:true});
      const parsed = parseCronogramaExcel(wb);
      if (parsed) upd(activeId, p => ({...p, cronograma: parsed}));
    };
    reader.readAsBinaryString(f);
    e.target.value = '';
  };

  // Gantt SVG helpers
  const GanttChart = ({inicial, real}) => {
    if (!inicial || !real) return null;
    // Combinar todas las fases para determinar eje de tiempo
    const allDates = [...inicial, ...real].flatMap(f => [f.inicio, f.fin]).filter(Boolean).map(d => new Date(d).getTime());
    if (!allDates.length) return null;
    const minT = Math.min(...allDates);
    const maxT = Math.max(...allDates);
    const span = maxT - minT;
    const W = 680, H_BAND = 30, PAD_LEFT = 170, PAD_RIGHT = 20, PAD_TOP = 36;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const fases = inicial.map(f => f.fase);
    const totalH = fases.length * H_BAND * 2 + PAD_TOP + 20;

    const tx = (dateStr) => {
      if (!dateStr) return null;
      return PAD_LEFT + ((new Date(dateStr).getTime() - minT) / span) * chartW;
    };
    const bw = (inicio, fin) => {
      const x1 = tx(inicio), x2 = tx(fin);
      if (!x1 || !x2) return 0;
      return Math.max(x2 - x1, 4);
    };

    // Etiquetas de año para el eje X
    const years = [];
    const startY = new Date(minT).getFullYear();
    const endY   = new Date(maxT).getFullYear();
    for (let y = startY; y <= endY; y++) {
      const ts = new Date(`${y}-01-01`).getTime();
      if (ts >= minT && ts <= maxT) years.push({y, x: PAD_LEFT + ((ts - minT) / span) * chartW});
    }

    return (
      <div style={{overflowX:'auto', marginTop:16}}>
        <svg width={W} height={totalH} style={{fontFamily:'inherit', fontSize:11}}>
          {/* Fondo alterno */}
          {fases.map((f, i) => (
            <rect key={i} x={0} y={PAD_TOP + i * H_BAND * 2} width={W} height={H_BAND * 2}
              fill={i % 2 === 0 ? 'rgba(30,45,78,0.03)' : 'transparent'} />
          ))}
          {/* Líneas de año */}
          {years.map(({y, x}) => (
            <g key={y}>
              <line x1={x} y1={PAD_TOP} x2={x} y2={totalH - 10} stroke="#DDD8CF" strokeWidth={1} strokeDasharray="3,3"/>
              <text x={x+3} y={PAD_TOP - 6} fill="#6B7A8A" fontSize={10}>{y}</text>
            </g>
          ))}
          {/* Hoy */}
          {(() => { const hoyX = tx(new Date().toISOString().substring(0,10)); return hoyX ? (
            <g>
              <line x1={hoyX} y1={PAD_TOP} x2={hoyX} y2={totalH - 10} stroke="#e05a5a" strokeWidth={1.5}/>
              <text x={hoyX+3} y={PAD_TOP - 6} fill="#e05a5a" fontSize={10} fontWeight={700}>HOY</text>
            </g>
          ) : null; })()}
          {/* Barras */}
          {fases.map((fase, i) => {
            const fI = inicial.find(f => f.fase === fase);
            const fR = real.find(f => f.fase === fase);
            const y1 = PAD_TOP + i * H_BAND * 2 + 3;
            const y2 = y1 + H_BAND - 4;
            return (
              <g key={fase}>
                <text x={PAD_LEFT - 6} y={y1 + 10} textAnchor="end" fill="#1E2D4E" fontSize={10.5} fontWeight={500}>{fase.replace('Gestión documental DR-LPO','Gestión doc.')}</text>
                {/* Barra inicial */}
                {fI && fI.inicio && fI.fin && (
                  <rect x={tx(fI.inicio)} y={y1} width={bw(fI.inicio, fI.fin)} height={H_BAND - 7}
                    fill="rgba(76,169,154,0.25)" stroke="#4ca99a" strokeWidth={1} rx={3}/>
                )}
                {/* Barra real */}
                {fR && fR.inicio && fR.fin && (
                  <rect x={tx(fR.inicio)} y={y2} width={bw(fR.inicio, fR.fin)} height={H_BAND - 7}
                    fill="rgba(224,90,90,0.22)" stroke="#e05a5a" strokeWidth={1} rx={3}/>
                )}
              </g>
            );
          })}
          {/* Leyenda */}
          <g transform={`translate(${PAD_LEFT}, ${totalH - 14})`}>
            <rect x={0} y={0} width={12} height={10} fill="rgba(76,169,154,0.25)" stroke="#4ca99a" strokeWidth={1} rx={2}/>
            <text x={16} y={9} fill="#1E2D4E" fontSize={10}>Planificación original</text>
            <rect x={145} y={0} width={12} height={10} fill="rgba(224,90,90,0.22)" stroke="#e05a5a" strokeWidth={1} rx={2}/>
            <text x={161} y={9} fill="#1E2D4E" fontSize={10}>Planificación actual</text>
          </g>
        </svg>
      </div>
    );
  };

  const fmtFecha = (d) => {
    if (!d) return '—';
    const [y, m] = d.split('-');
    const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${meses[parseInt(m)]} ${y}`;
  };

  const diffMeses = (d1, d2) => {
    if (!d1 || !d2) return null;
    const a = new Date(d1), b = new Date(d2);
    return Math.round((b - a) / (1000 * 60 * 60 * 24 * 30));
  };

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18}}>
        <div style={{fontWeight:700, fontSize:'0.92rem'}}>Cronograma — {proj.name}</div>
        <button onClick={() => fileRef.current.click()}
          style={{padding:'7px 16px', background:'#1E2D4E', color:'#fff', border:'none', borderRadius:8, fontSize:'0.8rem', fontWeight:700, cursor:'pointer'}}>
          {cron ? '↑ Actualizar cronograma' : '↑ Importar cronograma'}
        </button>
        <input ref={fileRef} type="file" accept=".xlsx" style={{display:'none'}} onChange={handleFile}/>
      </div>

      {!cron && (
        <div style={{textAlign:'center', padding:'60px 20px', color:'#6B7A8A', fontSize:'0.88rem'}}>
          <div style={{fontSize:'2rem', marginBottom:12}}>📅</div>
          <div>Importa el Excel de cronograma (pestaña Planificación(2))</div>
          <div style={{fontSize:'0.78rem', marginTop:6}}>Se extraerán las tablas de planificación inicial vs. real</div>
        </div>
      )}

      {cron && (
        <div>
          <div style={{fontSize:'0.75rem', color:'#6B7A8A', marginBottom:20}}>
            Importado el {cron.fecha} · Hoja: {cron.source}
          </div>

          {/* Gráfico Gantt */}
          <div style={{background:'#fff', borderRadius:12, border:'1px solid #E8E3DA', padding:'18px 20px', marginBottom:20}}>
            <div style={{fontWeight:700, fontSize:'0.82rem', marginBottom:4}}>Cronograma Real vs. Original</div>
            <GanttChart inicial={cron.inicial} real={cron.real}/>
          </div>

          {/* Tablas comparativas */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20}}>
            {/* Tabla Inicial */}
            <div style={{background:'#fff', borderRadius:12, border:'1px solid #E8E3DA', padding:'16px 18px'}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
                <div style={{width:10, height:10, borderRadius:2, background:'#4ca99a'}}/>
                <span style={{fontWeight:700, fontSize:'0.82rem'}}>Planificación Original</span>
              </div>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.77rem'}}>
                <thead>
                  <tr style={{borderBottom:'2px solid #E8E3DA'}}>
                    <th style={{textAlign:'left', padding:'5px 6px', color:'#6B7A8A', fontWeight:600}}>Fase</th>
                    <th style={{textAlign:'center', padding:'5px 6px', color:'#6B7A8A', fontWeight:600}}>Inicio</th>
                    <th style={{textAlign:'center', padding:'5px 6px', color:'#6B7A8A', fontWeight:600}}>Fin</th>
                    <th style={{textAlign:'center', padding:'5px 6px', color:'#6B7A8A', fontWeight:600}}>Meses</th>
                  </tr>
                </thead>
                <tbody>
                  {(cron.inicial || []).map((f, i) => (
                    <tr key={i} style={{borderBottom:'1px solid #F0EEE9'}}>
                      <td style={{padding:'6px 6px', fontWeight:500, color:'#1E2D4E'}}>{f.fase}</td>
                      <td style={{padding:'6px 6px', textAlign:'center', color:'#6B7A8A'}}>{fmtFecha(f.inicio)}</td>
                      <td style={{padding:'6px 6px', textAlign:'center', color:'#6B7A8A'}}>{fmtFecha(f.fin)}</td>
                      <td style={{padding:'6px 6px', textAlign:'center', fontWeight:600, color:'#1E2D4E'}}>{f.duracion || diffMeses(f.inicio, f.fin) || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tabla Real */}
            <div style={{background:'#fff', borderRadius:12, border:'1px solid #E8E3DA', padding:'16px 18px'}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
                <div style={{width:10, height:10, borderRadius:2, background:'#e05a5a'}}/>
                <span style={{fontWeight:700, fontSize:'0.82rem'}}>Planificación Actual</span>
              </div>
              <table style={{width:'100%', borderCollapse:'collapse', fontSize:'0.77rem'}}>
                <thead>
                  <tr style={{borderBottom:'2px solid #E8E3DA'}}>
                    <th style={{textAlign:'left', padding:'5px 6px', color:'#6B7A8A', fontWeight:600}}>Fase</th>
                    <th style={{textAlign:'center', padding:'5px 6px', color:'#6B7A8A', fontWeight:600}}>Inicio</th>
                    <th style={{textAlign:'center', padding:'5px 6px', color:'#6B7A8A', fontWeight:600}}>Fin</th>
                    <th style={{textAlign:'center', padding:'5px 6px', color:'#6B7A8A', fontWeight:600}}>Meses</th>
                  </tr>
                </thead>
                <tbody>
                  {(cron.real || []).map((f, i) => {
                    const orig = (cron.inicial || []).find(x => x.fase === f.fase);
                    const delay = (orig && orig.fin && f.fin) ? diffMeses(orig.fin, f.fin) : null;
                    const isDelayed = delay && delay > 0;
                    return (
                      <tr key={i} style={{borderBottom:'1px solid #F0EEE9'}}>
                        <td style={{padding:'6px 6px', fontWeight:500, color:'#1E2D4E'}}>{f.fase}</td>
                        <td style={{padding:'6px 6px', textAlign:'center', color:'#6B7A8A'}}>{fmtFecha(f.inicio)}</td>
                        <td style={{padding:'6px 6px', textAlign:'center', color: isDelayed ? '#e05a5a' : '#6B7A8A', fontWeight: isDelayed ? 700 : 400}}>
                          {fmtFecha(f.fin)}{isDelayed ? ` (+${delay}m)` : ''}
                        </td>
                        <td style={{padding:'6px 6px', textAlign:'center', fontWeight:600, color:'#1E2D4E'}}>{f.duracion || diffMeses(f.inicio, f.fin) || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen de desviaciones */}
          <div style={{background:'#fff', borderRadius:12, border:'1px solid #E8E3DA', padding:'16px 18px'}}>
            <div style={{fontWeight:700, fontSize:'0.82rem', marginBottom:12}}>Desviaciones vs. Planificación Original</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10}}>
              {(cron.real || []).map((f, i) => {
                const orig = (cron.inicial || []).find(x => x.fase === f.fase);
                const delay = (orig && orig.fin && f.fin) ? diffMeses(orig.fin, f.fin) : null;
                if (delay === null) return null;
                const color = delay > 0 ? '#e05a5a' : delay < 0 ? '#4ca99a' : '#6B7A8A';
                const bg    = delay > 0 ? 'rgba(224,90,90,0.07)' : delay < 0 ? 'rgba(76,169,154,0.07)' : 'rgba(107,122,138,0.07)';
                return (
                  <div key={i} style={{background:bg, borderRadius:8, padding:'10px 12px'}}>
                    <div style={{fontSize:'0.72rem', color:'#6B7A8A', marginBottom:4}}>{f.fase}</div>
                    <div style={{fontWeight:700, fontSize:'0.9rem', color}}>
                      {delay === 0 ? 'En plazo' : delay > 0 ? `+${delay} meses` : `${delay} meses`}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── POSVENTA TAB ────────────────────────────────────────────────────────────
const PosventaTab = ({proj, activeId, upd, fmt}) => {
  const ps = proj.posventa || [];
  const informes = (proj.posventaInformes || []).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
  const lastInforme = informes[0] || null;
  const prevInforme = informes[1] || null;

  const ESTADOS_COLOR = {
    'FINALIZADA':          {c:'#4ca99a', bg:'rgba(76,169,154,0.12)'},
    'PTE TERMINAR':        {c:'#e05a5a', bg:'rgba(224,90,90,0.12)'},
    'PENDIENTE TERMINAR':  {c:'#e05a5a', bg:'rgba(224,90,90,0.12)'},  // alias del Excel
    'PENDIENTE DE ENTRAR': {c:'#ddb96a', bg:'rgba(221,185,106,0.12)'},
    'AGENDAR VISITA':      {c:'#f5924e', bg:'rgba(245,146,78,0.12)'},
    'NO REPASA':           {c:'#7c5cfc', bg:'rgba(124,92,252,0.12)'},
    'NO REPASAN':          {c:'#7c5cfc', bg:'rgba(124,92,252,0.12)'},  // alias del Excel
    'SIN ESTADO':          {c:'#6B7A8A', bg:'rgba(107,122,138,0.12)'},
  };
  const POSVENTA_TIPOS = {
    "incidencia": {label:"Incidencia", color:"#e05a5a", bg:"rgba(224,90,90,0.10)"},
    "reparacion": {label:"Reparación", color:"#ddb96a", bg:"rgba(221,185,106,0.10)"},
    "garantia":   {label:"Garantía",   color:"#f5924e", bg:"rgba(245,146,78,0.10)"},
    "entrega":    {label:"Entrega",    color:"#4ca99a", bg:"rgba(76,169,154,0.10)"},
    "solicitud":  {label:"Solicitud",  color:"#7c5cfc", bg:"rgba(124,92,252,0.10)"},
    "otro":       {label:"Otro",       color:"#6B7A8A", bg:"rgba(107,122,138,0.10)"},
  };
  const POSVENTA_ESTADO = {
    "abierta":    {label:"Abierta",     color:"#e05a5a"},
    "en-proceso": {label:"En proceso",  color:"#ddb96a"},
    "resuelta":   {label:"Resuelta",    color:"#4ca99a"},
    "cerrada":    {label:"Cerrada",     color:"#6B7A8A"},
  };

  const [pvTab,    setPvTab]    = useState(informes.length > 0 ? 'informe' : 'manual');
  const [pvForm,   setPvForm]   = useState({show:false, ref:"", tipo:"incidencia", estado:"abierta", descripcion:"", fecha:new Date().toISOString().substring(0,10), responsable:""});
  const [vivFiltro, setVivFiltro] = useState('');
  const [estFiltro, setEstFiltro] = useState('');
  const [vivSort,   setVivSort]   = useState({col:'ref', dir:1}); // col: ref|estado|propietario|repasos|llave|alarma, dir: 1 asc -1 desc

  const parseInformePosventa = (wb) => {
    if (!wb || !wb.Sheets) return null;
    // Buscar la hoja de viviendas — puede no ser la primera
    const sheetName = wb.SheetNames.find(n => n.toUpperCase().includes('ESCRIT') || n.toUpperCase().includes('VIVIEN'))
                   || wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = window.XLSX.utils.sheet_to_json(ws, {header:1, defval:null});
    let headerIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const rowStr = (rows[i]||[]).map(c => c ? String(c).toUpperCase() : '').join(' ');
      if (rowStr.includes('ESCRIT') && rowStr.includes('VIV')) { headerIdx = i; break; }
    }
    // fallback: buscar cualquier fila con "ESCRITURADA"
    if (headerIdx < 0) {
      for (let i = 0; i < Math.min(rows.length, 15); i++) {
        if ((rows[i]||[]).some(c => c && String(c).toUpperCase().includes('ESCRITURADA'))) { headerIdx = i; break; }
      }
    }
    if (headerIdx < 0) return null;
    // Palabras clave que indican fila de resumen (no vivienda real)
    const SUMMARY_KEYWORDS = ['TOTAL','VIVIENDAS','ESCRITURADAS','FORMULARIO','RELLENAN','TECNICA','FINALIZADAS','PENDIENTE','REPASAN'];
    const isResumenRow = (ref) => SUMMARY_KEYWORDS.some(kw => ref.toUpperCase().includes(kw));
    const viviendas = []; // solo viviendas (no PK ni TR)
    const parkings  = []; // parkings (PK-)
    const trasteros = []; // trasteros (TR-)
    const refsVistas = new Set(); // para deduplicar — el Excel tiene referencias duplicadas al final
    const parseItem = (row, ref) => {
      const estado  = row[13] ? String(row[13]).trim() : 'SIN ESTADO';
      const repasos = row[14] ? String(row[14]).trim() : null;
      const formulario = row[8] ? String(row[8]).trim() : null;
      const tieneFormulario = !!(formulario && formulario !== '-' && formulario !== 'None');
      const visitaVal = row[10] ? String(row[10]).trim() : null;
      const tieneVisita = !!(visitaVal && visitaVal !== '-' && visitaVal !== 'None' && visitaVal !== '');
      return {
        ref, estado,
        repasos: repasos && repasos !== 'None' ? repasos : null,
        propietario: row[17] ? String(row[17]).trim() : null,
        llave:   row[16] || null,
        alarma:  row[15] || null,
        parte:   row[11] || null,
        formulario: tieneFormulario,
        visita:  tieneVisita,
        fechaEscrit: row[6] != null ? (row[6] instanceof Date ? row[6].toISOString().substring(0,7) : String(row[6]).substring(0,7)) : null,
      };
    };
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const ref = row[1] ? String(row[1]).trim() : null;
      if (!ref || ref === ' ' || ref === 'ACTUALIZAR') continue;
      if (ref.length > 20 || isResumenRow(ref)) continue;
      if (refsVistas.has(ref)) continue;
      refsVistas.add(ref);
      const refU = ref.toUpperCase();
      const item = parseItem(row, ref);
      if (refU.startsWith('PK-') || refU.startsWith('PARK')) parkings.push(item);
      else if (refU.startsWith('TR-') || refU.startsWith('TRAST')) trasteros.push(item);
      else viviendas.push(item);
    }
    // Estados: normalizar variantes del Excel
    // "PENDIENTE TERMINAR" y "PTE TERMINAR" → ambos tratados como pteTerminar
    const esPteTerminar = (v) => v.estado === 'PENDIENTE TERMINAR' || v.estado === 'PTE TERMINAR';
    const finalizadas  = viviendas.filter(v => v.estado === 'FINALIZADA').length;
    const pteTerminar  = viviendas.filter(esPteTerminar).length;
    const pteEntrar    = viviendas.filter(v => v.estado === 'PENDIENTE DE ENTRAR').length;
    const agendar      = viviendas.filter(v => v.estado === 'AGENDAR VISITA').length;
    const noRepasa     = viviendas.filter(v => v.estado === 'NO REPASA' || v.estado === 'NO REPASAN').length;
    const conRepasos   = viviendas.filter(v => v.repasos).length;
    const conAlarma    = viviendas.filter(v => v.alarma && String(v.alarma).trim() === 'Sí').length;
    // Con formulario: col 8 = "Completado" (o cualquier valor distinto de "-"/vacío)
    const visitasRealizadas = viviendas.filter(v => v.visita).length;
    const conFormulario     = viviendas.filter(v => v.formulario).length;
    const sinFormulario     = viviendas.length - conFormulario;
    // Sin formulario pero finalizadas (visitadas por correo, sin parte)
    const sinFormularioFinaliz = viviendas.filter(v => v.estado === 'FINALIZADA' && !v.formulario).length;
    // Finalizadas con formulario y sin formulario por separado
    const finalizadasConForm = viviendas.filter(v => v.estado === 'FINALIZADA' && v.formulario).length;
    // Desglose por mes de escritura para pteTerminar y pteEntrar
    // Claves: mar=03 abr=04 may=05 jun=06 jul=07 ago=08 sep=09 oct=10
    const mesEscrit = (v) => { if(!v.fechaEscrit) return null; return v.fechaEscrit.substring(0,7); };
    const pteTerminarPorMes = {mar:0,abr:0,may:0,jun:0,jul:0,ago:0,sep:0,oct:0,otro:0};
    const pteEntrarPorMes   = {mar:0,abr:0,may:0,jun:0,jul:0,ago:0,sep:0,oct:0,otro:0};
    const mesKey = (mes) => {
      if(!mes) return 'otro';
      const m = mes.split('-')[1];
      return m==='03'?'mar':m==='04'?'abr':m==='05'?'may':m==='06'?'jun':m==='07'?'jul':m==='08'?'ago':m==='09'?'sep':m==='10'?'oct':'otro';
    };
    viviendas.filter(esPteTerminar).forEach(v=>{ const k=mesKey(mesEscrit(v)); pteTerminarPorMes[k]++; });
    viviendas.filter(v=>v.estado==='PENDIENTE DE ENTRAR').forEach(v=>{ const k=mesKey(mesEscrit(v)); pteEntrarPorMes[k]++; });
    // "total" = viviendas con fecha de escritura (fuente de verdad)
    // Las 4 viviendas sin fecha no están escrituradas todavía → no cuentan
    // NOTA: con cellDates:true, row[6] es un Date object — comprobar != null, no la cadena
    const escrituradas = viviendas.filter(v => v.fechaEscrit != null).length;
    return {
      total: escrituradas,
      totalViviendas: viviendas.length,  // todas las únicas parseadas (incluye las sin fecha)
      totalParkings: parkings.filter(v=>v.fechaEscrit != null).length,
      totalTrasteros: trasteros.filter(v=>v.fechaEscrit != null).length,
      finalizadas, finalizadasConForm, pteTerminar, pteEntrar, agendar,
      noRepasa, conRepasos, conAlarma,
      visitasRealizadas, visitasPendientes: viviendas.length - visitasRealizadas,
      conFormulario, sinFormulario, sinFormularioFinaliz,
      pteTerminarPorMes, pteEntrarPorMes,
      pctFinalizada: escrituradas ? Math.round(finalizadas / escrituradas * 100) : 0,
      viviendas,     // solo viviendas (sin PK ni TR)
      parkings,
      trasteros,
    };
  };

  const extraerFechaDeNombre = (nombre) => {
    // Intenta parsear YYMMDD o YYYYMMDD al inicio del nombre de archivo
    // ej: "260914_MD_CONTROL..." → 2026-09-14
    //     "20260914_..." → 2026-09-14
    const m6 = nombre.match(/^(\d{2})(\d{2})(\d{2})[_\- ]/);
    if (m6) {
      const [,yy,mm,dd] = m6;
      const year = parseInt(yy) < 50 ? "20"+yy : "19"+yy;
      const d = new Date(`${year}-${mm}-${dd}`);
      if (!isNaN(d)) return `${year}-${mm}-${dd}`;
    }
    const m8 = nombre.match(/^(\d{4})(\d{2})(\d{2})[_\- ]/);
    if (m8) {
      const [,yyyy,mm,dd] = m8;
      const d = new Date(`${yyyy}-${mm}-${dd}`);
      if (!isNaN(d)) return `${yyyy}-${mm}-${dd}`;
    }
    // Fallback: fecha de hoy
    return new Date().toISOString().substring(0,10);
  };

  const importarInforme = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = window.XLSX.read(ev.target.result, {type:'array', cellDates:true});
        const parsed = parseInformePosventa(wb);
        if (!parsed) { alert('No se pudo leer el informe. Comprueba que es el formato correcto.'); return; }
        const fechaInforme = extraerFechaDeNombre(file.name);
        const nuevo = {id:Date.now(), fecha:fechaInforme, fechaImport:new Date().toISOString().substring(0,10), nombre:file.name, ...parsed};
        upd(activeId, p => ({...p, posventaInformes:[...(p.posventaInformes||[]), nuevo]}));
        setPvTab('informe');
      } catch(err) { alert('Error al leer: ' + err.message); }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const addPosventa = () => {
    if (!pvForm.descripcion.trim()) return;
    const item = {id:Date.now(), ref:pvForm.ref, tipo:pvForm.tipo, estado:pvForm.estado,
                  descripcion:pvForm.descripcion, fecha:pvForm.fecha, responsable:pvForm.responsable, fechaResolucion:""};
    upd(activeId, p => ({...p, posventa:[...(p.posventa||[]), item]}));
    setPvForm(f => ({...f, show:false, descripcion:"", ref:""}));
  };
  const cambiarEstadoPV = (id, nuevoEstado) => {
    upd(activeId, p => ({...p, posventa:(p.posventa||[]).map(i =>
      i.id === id ? {...i, estado:nuevoEstado,
        fechaResolucion: (nuevoEstado==="resuelta"||nuevoEstado==="cerrada") ? new Date().toISOString().substring(0,10) : i.fechaResolucion
      } : i
    )}));
  };
  const eliminarPV      = (id) => upd(activeId, p => ({...p, posventa:(p.posventa||[]).filter(i => i.id !== id)}));
  const eliminarInforme = (id) => upd(activeId, p => ({...p, posventaInformes:(p.posventaInformes||[]).filter(i => i.id !== id)}));

  const abiertas  = ps.filter(i => i.estado === "abierta" || i.estado === "en-proceso");
  const resueltas = ps.filter(i => i.estado === "resuelta" || i.estado === "cerrada");

  const tabStyle = (active) => ({
    padding:"7px 16px", fontSize:"0.8rem", fontWeight:700, fontFamily:"inherit",
    borderRadius:8, border:"none", cursor:"pointer",
    background: active ? "#1E2D4E" : "transparent",
    color: active ? "#FFFFFF" : "#6B7A8A", transition:"all 0.15s",
  });

  // ── vistas ──
  const inf  = lastInforme;
  const prev = prevInforme;
  const ESTADO_ORDER = {'FINALIZADA':0,'PTE TERMINAR':1,'PENDIENTE TERMINAR':1,'PENDIENTE DE ENTRAR':2,'RESCISIÓN':3,'SIN ESTADO':4};
  const vivsFiltradas = inf ? (inf.viviendas||[]).filter(v => {
    const matchRef = !vivFiltro || v.ref.toLowerCase().includes(vivFiltro.toLowerCase()) ||
                     (v.propietario && v.propietario.toLowerCase().includes(vivFiltro.toLowerCase()));
    const matchEst = !estFiltro || v.estado === estFiltro;
    return matchRef && matchEst;
  }).sort((a,b)=>{
    const {col,dir}=vivSort;
    let va,vb;
    if(col==='estado'){va=ESTADO_ORDER[a.estado]??9;vb=ESTADO_ORDER[b.estado]??9;}
    else if(col==='ref'){va=a.ref||'';vb=b.ref||'';}
    else if(col==='propietario'){va=(a.propietario||'').toLowerCase();vb=(b.propietario||'').toLowerCase();}
    else if(col==='repasos'){va=a.repasos?1:0;vb=b.repasos?1:0;}
    else if(col==='llave'){va=(a.llave||'').toLowerCase();vb=(b.llave||'').toLowerCase();}
    else if(col==='alarma'){va=a.alarma==='Sí'?1:0;vb=b.alarma==='Sí'?1:0;}
    else{va=a[col]||'';vb=b[col]||'';}
    if(va<vb) return -dir; if(va>vb) return dir; return 0;
  }) : [];

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <div style={{fontWeight:700, fontSize:"0.92rem"}}>Posventa — {proj.name}</div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 14px",background:"#4ca99a",color:"#fff",borderRadius:8,fontSize:"0.8rem",fontWeight:700,cursor:"pointer"}}>
            ↑ Importar informe Excel
            <input type="file" accept=".xlsx,.xlsm" onChange={importarInforme} style={{display:"none"}}/>
          </label>
          <button onClick={()=>setPvForm(f=>({...f,show:!f.show}))} style={{padding:"6px 14px",background:"#1E2D4E",color:"#fff",border:"none",borderRadius:8,fontSize:"0.8rem",fontWeight:700,cursor:"pointer"}}>
            + Incidencia manual
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:4,background:"#F0EEE9",borderRadius:10,padding:4,marginBottom:16,width:"fit-content"}}>
        {informes.length > 0 && <button style={tabStyle(pvTab==='informe')} onClick={()=>setPvTab('informe')}>📊 Informes ({informes.length})</button>}
        <button style={tabStyle(pvTab==='manual')} onClick={()=>setPvTab('manual')}>🔧 Incidencias manuales{ps.length>0?` (${ps.length})`:''}</button>
      </div>

      {/* ── VISTA INFORMES ── */}
      {pvTab==='informe' && inf && (
        <div>
          {/* Cabecera del informe */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:"0.82rem",color:"#6B7A8A"}}>
              📄 <strong style={{color:"#1E2D4E"}}>{inf.nombre}</strong> — {fmt(inf.fecha)}
              {prev && <span> · vs {fmt(prev.fecha)}</span>}
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {informes.map((inf2,i) => (
                <span key={inf2.id} style={{fontSize:"0.7rem",background:i===0?"#1E2D4E":"#F0EEE9",color:i===0?"#fff":"#6B7A8A",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontWeight:700}} onClick={()=>eliminarInforme(inf2.id)} title="Eliminar informe">✕ {fmt(inf2.fecha)}</span>
              ))}
            </div>
          </div>

          {/* ── TABLA 1: Resumen de la promoción ── */}
          {(()=>{
            // Valores editables manualmente tienen prioridad sobre los del parser
            const totalEscrit = proj.posventaEscrituradas ?? inf.total;
            const noRepasaVal = proj.posventaNoRepasa ?? inf.noRepasa;
            const sinClasificar = proj.posventaSinClasificar ?? (totalEscrit-(inf.finalizadas+inf.pteTerminar+inf.pteEntrar+inf.agendar+noRepasaVal));
            const conForm = inf.conFormulario ?? 0;
            const sinFormFin = inf.sinFormularioFinaliz ?? 0;
            // inf.finalizadas = TOTAL FINALIZADA (con + sin formulario) = 187
            // inf.finalizadasConForm = las 149 con formulario
            // sinFormFin = las 38 sin formulario (subconjunto de inf.finalizadas)
            const totFinalizadas = inf.finalizadas; // 187 (ya incluye ambas, no sumar)
            const finConForm = inf.finalizadasConForm ?? (inf.finalizadas - sinFormFin);
            // Con formulario NO finalizadas = conForm - finalizadasConForm
            const conFormNoFin = Math.max(0, conForm - finConForm);
            // Sin finalizar sin formulario = total escrituradas - totFinalizadas - conFormNoFin
            const sinFinSinForm = Math.max(0, totalEscrit - totFinalizadas - conFormNoFin);
            // Visitas pendientes
            const visitasPend = inf.visitasPendientes ?? Math.max(0, totalEscrit - (conForm + sinFormFin));

            // Cálculo retraso medio incidencias manuales
            const hoy = new Date();
            const incAbiertas = ps.filter(i => i.estado === 'abierta' || i.estado === 'en-proceso');
            const retrasos = incAbiertas.map(i => {
              if (!i.fecha) return null;
              const dias = Math.floor((hoy - new Date(i.fecha)) / 86400000);
              return dias > 0 ? dias : 0;
            }).filter(d => d !== null);
            const retrasoMedio = retrasos.length ? Math.round(retrasos.reduce((a,b)=>a+b,0)/retrasos.length) : 0;
            const maxRetraso = retrasos.length ? Math.max(...retrasos) : 0;

            const StatCell = ({label, value, sub, color}) => (
              <div style={{background:"#F8F7F4",borderRadius:8,padding:"10px 14px",flex:1,minWidth:110}}>
                <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>{label}</div>
                <div style={{fontSize:"1.4rem",fontWeight:800,color:color||"#1E2D4E",lineHeight:1}}>{value}</div>
                {sub&&<div style={{fontSize:"0.68rem",color:"#6B7A8A",marginTop:3}}>{sub}</div>}
              </div>
            );
            const SubRow = ({dot, label, value, color}) => (
              <div style={{display:"flex",alignItems:"center",gap:6,fontSize:"0.75rem",padding:"3px 0"}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0,display:"inline-block"}}/>
                <span style={{color:"#6B7A8A",flex:1}}>{label}</span>
                <span style={{fontWeight:700,color:color||"#1E2D4E"}}>{value}</span>
              </div>
            );

            return (
              <div style={{marginBottom:14}}>
                {/* Bloque 1: totales */}
                <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",overflow:"hidden",marginBottom:10}}>
                  <div style={{padding:"8px 16px",background:"#F0EEE9",fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#6B7A8A"}}>Resumen de la promoción</div>
                  <div style={{padding:"12px 16px",display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
                    {/* Total promoción: editable manualmente */}
                    <div style={{background:"#F8F7F4",borderRadius:8,padding:"10px 14px",flex:1,minWidth:110}}>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Viviendas totales</div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input
                          type="number"
                          defaultValue={proj.posventaTotalUnidades ?? ''}
                          placeholder={String(inf.totalViviendas ?? inf.total)}
                          onBlur={e => {
                            const v = parseInt(e.target.value,10);
                            if(!isNaN(v) && v > 0) upd(activeId,'posventaTotalUnidades',v);
                          }}
                          style={{width:64,fontSize:"1.4rem",fontWeight:800,color:"#1E2D4E",lineHeight:1,border:"none",background:"transparent",outline:"none",padding:0}}
                        />
                        <span title="Edita el total de la promoción" style={{fontSize:"0.65rem",color:"#9BA8B4",cursor:"text"}}>✎</span>
                      </div>
                    </div>
                    {/* Escrituradas: editable manualmente */}
                    <div style={{background:"#F8F7F4",borderRadius:8,padding:"10px 14px",flex:1,minWidth:110}}>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Escrituradas</div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <input
                          type="number"
                          defaultValue={proj.posventaEscrituradas ?? ''}
                          placeholder={String(inf.total)}
                          onBlur={e => {
                            const v = parseInt(e.target.value,10);
                            if(!isNaN(v) && v > 0) upd(activeId,'posventaEscrituradas',v);
                          }}
                          style={{width:64,fontSize:"1.4rem",fontWeight:800,color:"#1E2D4E",lineHeight:1,border:"none",background:"transparent",outline:"none",padding:0}}
                        />
                        <span title="Edita el número de escrituradas" style={{fontSize:"0.65rem",color:"#9BA8B4",cursor:"text"}}>✎</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloques 2+3: Finalizadas | Sin finalizar — en una sola fila */}
                <div style={{display:"flex",gap:10,marginBottom:10}}>
                  {/* Finalizadas */}
                  <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",overflow:"hidden",flex:1}}>
                    <div style={{padding:"6px 14px",background:"rgba(76,169,154,0.08)",fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#4ca99a",display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:"#4ca99a",display:"inline-block"}}/>
                      Viviendas finalizadas — <span style={{fontSize:"0.88rem",fontWeight:800}}>{totFinalizadas}</span>
                    </div>
                    <div style={{padding:"8px 14px"}}>
                      <SubRow dot="#4ca99a" label="Con formulario" value={finConForm} color="#4ca99a"/>
                      <SubRow dot="#B0BBC6" label="Sin formulario" value={sinFormFin} color="#6B7A8A"/>
                    </div>
                  </div>
                  {/* Sin finalizar */}
                  <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",overflow:"hidden",flex:1}}>
                    <div style={{padding:"6px 14px",background:"rgba(221,185,106,0.08)",fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#c9a86c",display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:7,height:7,borderRadius:"50%",background:"#ddb96a",display:"inline-block"}}/>
                      Sin finalizar — <span style={{fontSize:"0.88rem",fontWeight:800}}>{totalEscrit - totFinalizadas}</span>
                    </div>
                    <div style={{padding:"8px 14px"}}>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.04em"}}>Con formulario</div>
                      <SubRow dot="#e05a5a" label="Pte. terminar" value={inf.pteTerminar} color="#e05a5a"/>
                      <SubRow dot="#ddb96a" label="Pte. iniciar visita" value={inf.pteEntrar} color="#c9a86c"/>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",marginTop:5,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.04em"}}>Sin formulario</div>
                      <SubRow dot="#B0BBC6" label="No finalizadas" value={sinFinSinForm} color="#6B7A8A"/>
                    </div>
                  </div>
                </div>

                {/* Bloque 4: Sin clasificar + No repasan + Pendientes agendar */}
                <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",overflow:"hidden",marginBottom:10}}>
                  <div style={{padding:"8px 16px",background:"#F0EEE9",fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#6B7A8A"}}>Otros estados</div>
                  <div style={{padding:"10px 16px",display:"flex",gap:10,flexWrap:"wrap"}}>
                    <div style={{flex:1,minWidth:130}}>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Sin clasificar</div>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <input type="number" defaultValue={proj.posventaSinClasificar ?? ''} placeholder={String(Math.max(0,totalEscrit-(inf.finalizadas+inf.pteTerminar+inf.pteEntrar+inf.agendar+noRepasaVal)))}
                          onBlur={e=>{const v=parseInt(e.target.value,10);if(!isNaN(v)&&v>=0) upd(activeId,'posventaSinClasificar',v);}}
                          style={{width:52,fontSize:"1.3rem",fontWeight:800,color:"#e05a5a",border:"none",background:"transparent",outline:"none",padding:0}}/>
                        <span style={{fontSize:"0.65rem",color:"#9BA8B4"}}>✎</span>
                      </div>
                      <div style={{fontSize:"0.68rem",color:"#6B7A8A"}}>estado desconocido</div>
                    </div>
                    <div style={{flex:1,minWidth:130}}>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>No desean actuación</div>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <input type="number" defaultValue={proj.posventaNoRepasa ?? ''} placeholder={String(noRepasaVal)}
                          onBlur={e=>{const v=parseInt(e.target.value,10);if(!isNaN(v)&&v>=0) upd(activeId,'posventaNoRepasa',v);}}
                          style={{width:52,fontSize:"1.3rem",fontWeight:800,color:"#7c5cfc",border:"none",background:"transparent",outline:"none",padding:0}}/>
                        <span style={{fontSize:"0.65rem",color:"#9BA8B4"}}>✎</span>
                      </div>
                      <div style={{fontSize:"0.68rem",color:"#6B7A8A"}}>no repasan</div>
                    </div>
                    <div style={{flex:1,minWidth:130}}>
                      <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Visitas pendientes</div>
                      <div style={{fontSize:"1.3rem",fontWeight:800,color:"#ddb96a"}}>{visitasPend}</div>
                      <div style={{fontSize:"0.68rem",color:"#6B7A8A"}}>de {totalEscrit} escrituradas</div>
                    </div>
                    {inf.agendar > 0 && (
                      <div style={{flex:1,minWidth:130}}>
                        <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Pendientes de agendar</div>
                        <div style={{fontSize:"1.3rem",fontWeight:800,color:"#f5924e"}}>{inf.agendar}</div>
                        <div style={{fontSize:"0.68rem",color:"#6B7A8A"}}>visita sin fecha</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bloque 5: Retraso medio incidencias manuales */}
                {ps.length > 0 && (
                  <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",overflow:"hidden",marginBottom:10}}>
                    <div style={{padding:"8px 16px",background:"#F0EEE9",fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#6B7A8A"}}>Retraso medio — incidencias manuales</div>
                    <div style={{padding:"12px 16px",display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-start"}}>
                      <div style={{flex:1,minWidth:130}}>
                        <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Incidencias abiertas</div>
                        <div style={{fontSize:"1.3rem",fontWeight:800,color:"#e05a5a"}}>{incAbiertas.length}</div>
                        <div style={{fontSize:"0.68rem",color:"#6B7A8A"}}>de {ps.length} totales</div>
                      </div>
                      <div style={{flex:1,minWidth:130}}>
                        <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Retraso medio</div>
                        <div style={{fontSize:"1.3rem",fontWeight:800,color:retrasoMedio>30?"#e05a5a":retrasoMedio>14?"#ddb96a":"#4ca99a"}}>{retrasoMedio} días</div>
                        <div style={{fontSize:"0.68rem",color:"#6B7A8A"}}>desde apertura</div>
                      </div>
                      <div style={{flex:1,minWidth:130}}>
                        <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Más antigua</div>
                        <div style={{fontSize:"1.3rem",fontWeight:800,color:maxRetraso>30?"#e05a5a":maxRetraso>14?"#ddb96a":"#4ca99a"}}>{maxRetraso} días</div>
                        <div style={{fontSize:"0.68rem",color:"#6B7A8A"}}>sin resolver</div>
                      </div>
                      {retrasos.length > 0 && (
                        <div style={{flex:2,minWidth:200}}>
                          <div style={{fontSize:"0.68rem",fontWeight:700,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Distribución por antigüedad</div>
                          {[
                            {label:"≤ 7 días",  min:0,  max:7,  color:"#4ca99a"},
                            {label:"8–14 días", min:8,  max:14, color:"#ddb96a"},
                            {label:"15–30 días",min:15, max:30, color:"#f5924e"},
                            {label:"> 30 días", min:31, max:Infinity, color:"#e05a5a"},
                          ].map(b => {
                            const n = retrasos.filter(d => d >= b.min && d <= b.max).length;
                            const pct = retrasos.length ? Math.round(n/retrasos.length*100) : 0;
                            return (
                              <div key={b.label} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                                <div style={{fontSize:"0.68rem",color:"#6B7A8A",width:70,flexShrink:0}}>{b.label}</div>
                                <div style={{flex:1,height:6,background:"#F0EEE9",borderRadius:3,overflow:"hidden"}}>
                                  <div style={{width:pct+"%",height:"100%",background:b.color,borderRadius:3,transition:"width 0.3s"}}/>
                                </div>
                                <div style={{fontSize:"0.68rem",fontWeight:700,color:"#1E2D4E",width:18,textAlign:"right"}}>{n}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── TABLA 2: Evolutivo histórico (tabla) ── */}
          {informes.length >= 2 && (()=>{
            const cronologico=[...informes].sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
            const delta=(curr,prev,key)=>{ if(prev==null) return null; const c=curr[key]??0; const p=prev[key]??0; return c-p; };
            const varTotal=(key)=>{ const last=cronologico[cronologico.length-1]; const first=cronologico[0]; return (last[key]??0)-(first[key]??0); };
            const rows2=[
              {l:"Cuestionarios recibidos",       key:"conFormulario",    mejor:true},
              {l:"Visitas realizadas",             key:"visitasRealizadas",mejor:true},
              {l:"Pendientes de visita",           key:"visitasPendientes",mejor:false},
              {l:"Viviendas totalmente resueltas", key:"finalizadas",      mejor:true},
              {l:"Pendientes parciales",           key:"pteTerminar",      mejor:false},
              {l:"Pendientes de iniciar",          key:"pteEntrar",        mejor:false},
              {l:"No desean actuación",            key:"noRepasa",         mejor:null},
            ];
            const sinClasifKey = (inf2) => inf2.total-(inf2.finalizadas+inf2.pteTerminar+inf2.pteEntrar+inf2.agendar+(inf2.noRepasa||0));
            return (
              <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",overflow:"hidden",marginBottom:14}}>
                <div style={{padding:"10px 16px",background:"#F0EEE9",fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#6B7A8A"}}>Evolutivo histórico por informe</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.78rem",minWidth:520}}>
                    <thead>
                      <tr style={{background:"#F8F7F4"}}>
                        <th style={{padding:"8px 14px",textAlign:"left",fontWeight:700,color:"#1E2D4E",fontSize:"0.72rem",borderBottom:"2px solid #DDD8CF"}}>Indicador / Fecha informe</th>
                        {cronologico.map(x=>(
                          <th key={x.id} style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:"#1E2D4E",fontSize:"0.72rem",borderBottom:"2px solid #DDD8CF",whiteSpace:"nowrap"}}>
                            <div>{fmt(x.fecha)}</div>
                          </th>
                        ))}
                        <th style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:"#1E2D4E",fontSize:"0.72rem",borderBottom:"2px solid #DDD8CF",borderLeft:"2px solid #DDD8CF"}}>Variación total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows2.map((row,ri)=>{
                        const vt=varTotal(row.key);
                        const clrTotal = vt===0||row.mejor===null ? "#6B7A8A" : row.mejor===true ? (vt>0?"#4ca99a":"#e05a5a") : (vt<0?"#4ca99a":"#e05a5a");
                        return (
                          <tr key={row.l} style={{borderBottom:ri<rows2.length-1?"1px solid #E8E2D8":"none",background:ri%2===0?"#fff":"#FAFAF8"}}>
                            <td style={{padding:"9px 14px",color:"#1E2D4E",fontWeight:500}}>{row.l}</td>
                            {cronologico.map((x,ci)=>{
                              const val = x[row.key] ?? 0;
                              const prevX = ci>0 ? cronologico[ci-1] : null;
                              const d = prevX!=null ? val-(prevX[row.key]??0) : null;
                              const clr = d===null||d===0 ? "#6B7A8A" : row.mejor===true?(d>0?"#4ca99a":"#e05a5a"):(d<0?"#4ca99a":"#e05a5a");
                              return (
                                <td key={x.id} style={{padding:"9px 12px",textAlign:"center",fontWeight:600,color:"#1E2D4E"}}>
                                  {val}
                                  {d!==null&&d!==0&&<span style={{display:"block",fontSize:"0.64rem",color:clr,fontWeight:700}}>{d>0?"+":""}{d}</span>}
                                </td>
                              );
                            })}
                            <td style={{padding:"9px 12px",textAlign:"center",fontWeight:800,color:clrTotal,borderLeft:"2px solid #DDD8CF"}}>{vt>0?"+":""}{vt}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Editor de fechas */}
                <div style={{padding:"10px 16px",borderTop:"1px solid #E8E2D8",display:"flex",gap:6,flexWrap:"wrap"}}>
                  {cronologico.map((x)=>(
                    <div key={x.id} style={{display:"flex",flexDirection:"column",gap:2,background:"#F8F7F4",borderRadius:7,padding:"5px 8px",fontSize:"0.67rem",minWidth:100}}>
                      <div style={{color:"#6B7A8A",fontWeight:700,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:120}} title={x.nombre}>{x.nombre.substring(0,18)}{x.nombre.length>18?"…":""}</div>
                      <input type="date" defaultValue={x.fecha}
                        style={{border:"1px solid #DDD8CF",borderRadius:5,padding:"2px 4px",fontSize:"0.67rem",fontFamily:"inherit",outline:"none",color:"#1E2D4E",background:"#fff"}}
                        onChange={e=>{const v=e.target.value;if(v) upd(activeId,p=>({...p,posventaInformes:(p.posventaInformes||[]).map(inf2=>inf2.id===x.id?{...inf2,fecha:v}:inf2)}));}}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── TABLA 3: Estado actual con desglose por mes ── */}
          {(inf.pteTerminar > 0 || inf.pteEntrar > 0) && (()=>{
            const meses = [
              {key:'mar', label:'Desde marzo'},
              {key:'abr', label:'Desde abril'},
              {key:'may', label:'Desde mayo'},
              {key:'jun', label:'Desde junio'},
              {key:'jul', label:'Desde julio'},
              {key:'ago', label:'Desde agosto'},
              {key:'sep', label:'Desde septiembre'},
              {key:'oct', label:'Desde octubre'},
              {key:'otro', label:'Otro mes'},
            ];
            const pm1 = inf.pteTerminarPorMes || {};
            const pm2 = inf.pteEntrarPorMes   || {};
            const mesesConDatos = meses.filter(m=>(pm1[m.key]||0)>0||(pm2[m.key]||0)>0);
            if(!mesesConDatos.length) return null;
            return (
              <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",overflow:"hidden",marginBottom:14}}>
                <div style={{padding:"10px 16px",background:"#F0EEE9",fontSize:"0.62rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:"#6B7A8A"}}>Estado actual — desglose por periodo</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.80rem",minWidth:400}}>
                    <thead>
                      <tr style={{background:"#F8F7F4",borderBottom:"2px solid #DDD8CF"}}>
                        <th style={{padding:"8px 14px",textAlign:"left",fontWeight:700,color:"#1E2D4E",fontSize:"0.72rem"}}>Estado actual</th>
                        <th style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:"#1E2D4E",fontSize:"0.72rem"}}>Total</th>
                        {mesesConDatos.map(m=><th key={m.key} style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:"#6B7A8A",fontSize:"0.72rem"}}>{m.label}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{borderBottom:"1px solid #E8E2D8"}}>
                        <td style={{padding:"9px 14px",color:"#1E2D4E",fontWeight:500}}>Pendientes de terminar</td>
                        <td style={{padding:"9px 12px",textAlign:"center",fontWeight:700,color:"#e05a5a"}}>{inf.pteTerminar}</td>
                        {mesesConDatos.map(m=><td key={m.key} style={{padding:"9px 12px",textAlign:"center",color:"#6B7A8A",fontWeight:600}}>{pm1[m.key]||0}</td>)}
                      </tr>
                      <tr>
                        <td style={{padding:"9px 14px",color:"#1E2D4E",fontWeight:500}}>Pendientes de iniciar</td>
                        <td style={{padding:"9px 12px",textAlign:"center",fontWeight:700,color:"#ddb96a"}}>{inf.pteEntrar}</td>
                        {mesesConDatos.map(m=><td key={m.key} style={{padding:"9px 12px",textAlign:"center",color:"#6B7A8A",fontWeight:600}}>{pm2[m.key]||0}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* KPIs secundarios */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
            {[
              {l:"Escrituradas",      v:inf.total,        p:prev?.total,        mejor:null},
              {l:"Finalizadas",       v:inf.finalizadas,  p:prev?.finalizadas,  mejor:true,  pct:inf.pctFinalizada+"%"},
              {l:"Agendar visita",    v:inf.agendar,      p:prev?.agendar,      mejor:false},
              {l:"Con repasos",       v:inf.conRepasos,   p:prev?.conRepasos,   mejor:false},
              {l:"Sin clasificar",    v:inf.total-(inf.finalizadas+inf.pteTerminar+inf.pteEntrar+inf.agendar+inf.noRepasa), p:prev?(prev.total-(prev.finalizadas+prev.pteTerminar+prev.pteEntrar+prev.agendar+(prev.noRepasa||0))):null, mejor:false},
              {l:"Con alarma activa", v:inf.conAlarma,    p:prev?.conAlarma,    mejor:null},
            ].map(k => {
              const d = k.p != null ? k.v - k.p : null;
              const clr = d===null||d===0 ? "#6B7A8A" : k.mejor===true ? (d>0?"#4ca99a":"#e05a5a") : k.mejor===false ? (d<0?"#4ca99a":"#e05a5a") : "#6B7A8A";
              return (
                <div key={k.l} style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"12px 14px"}}>
                  <div style={{fontSize:"0.60rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>{k.l}</div>
                  <div style={{fontSize:"1.3rem",fontWeight:800,color:"#1E2D4E"}}>{k.v}{k.pct&&<span style={{fontSize:"0.75rem",color:"#4ca99a",marginLeft:4}}>{k.pct}</span>}</div>
                  {d!==null && <div style={{fontSize:"0.7rem",fontWeight:700,color:clr,marginTop:2}}>{d>0?"+":""}{d} vs anterior</div>}
                </div>
              );
            })}
          </div>

          {/* Barra progreso */}
          {inf.total > 0 && (()=>{
            const pct = inf.pctFinalizada;
            const pctPrev = prev && prev.total ? Math.round(prev.finalizadas/prev.total*100) : null;
            return (
              <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"14px 18px",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:"0.78rem",fontWeight:700,color:"#1E2D4E"}}>Progreso finalización posventa</span>
                  <span style={{fontSize:"0.78rem",fontWeight:800,color:"#4ca99a"}}>{pct}%
                    {pctPrev!=null&&pct!==pctPrev&&(()=>{const diff=pct-pctPrev;return <span style={{color:diff>0?"#4ca99a":"#e05a5a",fontSize:"0.68rem"}}> ({diff>0?"+":""}{diff}pp vs anterior)</span>;})()}
                  </span>
                </div>
                <div style={{height:10,background:"#F0EEE9",borderRadius:5,overflow:"hidden",position:"relative"}}>
                  {pctPrev!=null&&<div style={{position:"absolute",top:0,left:0,height:"100%",width:pctPrev+"%",background:"#DDD8CF",borderRadius:5}}/>}
                  <div style={{position:"absolute",top:0,left:0,height:"100%",width:pct+"%",background:"#4ca99a",borderRadius:5}}/>
                </div>
                {(()=>{
                  const clasificadas = inf.finalizadas + inf.pteTerminar + inf.pteEntrar + inf.agendar + inf.noRepasa;
                  const sinClasificar = inf.total - clasificadas;
                  return (
                    <div style={{marginTop:8}}>
                      <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:"0.68rem",color:"#6B7A8A"}}>
                        <span>🟢 Final.: {inf.finalizadas}</span>
                        <span>🔴 Pte. terminar: {inf.pteTerminar}</span>
                        <span>🟡 Pte. entrar: {inf.pteEntrar}</span>
                        <span>🟠 Agendar: {inf.agendar}</span>
                        {inf.noRepasa>0&&<span>⬜ Sin repasos: {inf.noRepasa}</span>}
                      </div>
                      {sinClasificar>0&&(
                        <div style={{marginTop:6,fontSize:"0.67rem",color:"#e05a5a",fontWeight:600}}>
                          ⚠ {sinClasificar} escrituradas sin estado clasificado ({clasificadas} de {inf.total} identificadas)
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* Comparativa */}
          {prev && (
            <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"14px 18px",marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:"0.78rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>
                Comparativa {fmt(prev.fecha)} → {fmt(inf.fecha)}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {[
                  {l:"Nuevas escrituradas",  v:inf.total-prev.total,         pos:null},
                  {l:"Finalizadas ganadas",  v:inf.finalizadas-prev.finalizadas, pos:true},
                  {l:"Pte. terminar",        v:inf.pteTerminar-prev.pteTerminar, pos:false},
                  {l:"Pte. de entrar",       v:inf.pteEntrar-prev.pteEntrar,     pos:false},
                  {l:"Nuevas a agendar",     v:inf.agendar-prev.agendar,         pos:false},
                  {l:"Con repasos (Δ)",      v:inf.conRepasos-prev.conRepasos,   pos:false},
                ].map(x => {
                  const c = x.pos===null||x.v===0 ? "#6B7A8A" : x.pos ? (x.v>0?"#4ca99a":"#e05a5a") : (x.v<0?"#4ca99a":"#e05a5a");
                  return (
                    <div key={x.l} style={{background:"#F0EEE9",borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:"0.62rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{x.l}</div>
                      <div style={{fontSize:"1.1rem",fontWeight:800,color:c}}>{x.v>0?"+":""}{x.v}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Evolutivo histórico */}
          {informes.length >= 2 && (()=>{
            const cronologico=[...informes].sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
            // Detectar si todas las fechas son iguales (importadas el mismo día)
            const fechasUnicas=new Set(cronologico.map(x=>x.fecha));
            const todasIguales=fechasUnicas.size===1;
            const series=[
              {key:"finalizadas", label:"Finalizadas",   color:"#4ca99a"},
              {key:"pteTerminar", label:"Pte. terminar", color:"#e05a5a"},
              {key:"pteEntrar",   label:"Pte. entrar",   color:"#ddb96a"},
              {key:"agendar",     label:"Agendar",        color:"#c9a86c"},
            ];
            // Escala Y: desde el mínimo real al máximo, con padding
            const allVals=cronologico.flatMap(x=>series.map(s=>x[s.key]||0));
            const maxV=Math.max(...allVals,1);
            const minV=0;
            const W=620,H=180,padL=32,padR=16,padT=14,padB=36;
            const cW=W-padL-padR,cH=H-padT-padB;
            const n=cronologico.length;
            const xOf=i=>padL+(n>1?i/(n-1):0.5)*cW;
            const yOf=v=>padT+cH-((v-minV)/(maxV-minV||1))*cH;
            const polyline=s=>cronologico.map((x,i)=>`${xOf(i)},${yOf(x[s.key]||0)}`).join(" ");
            const yTicks=[minV,Math.round(maxV/2),maxV];
            // Etiquetas X: fecha con sufijo si hay duplicadas
            const fechaCount={};
            cronologico.forEach(x=>{fechaCount[x.fecha]=(fechaCount[x.fecha]||0)+1;});
            const fechaIdx={};
            const xLabel=x=>{
              const label=fmt(x.fecha);
              if(fechaCount[x.fecha]>1){
                fechaIdx[x.fecha]=(fechaIdx[x.fecha]||0)+1;
                return `${label} (${fechaIdx[x.fecha]})`;
              }
              return label;
            };
            return (
              <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"16px 18px",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                  <div style={{fontWeight:700,fontSize:"0.78rem",color:"#1E2D4E"}}>Evolutivo histórico posventa ({informes.length} informes)</div>
                </div>

                {/* Gráfica */}
                <div style={{overflowX:"auto"}}>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",maxWidth:W,display:"block",minWidth:340}}>
                    {/* Grid Y */}
                    {yTicks.map(v=>(
                      <g key={v}>
                        <line x1={padL} y1={yOf(v)} x2={W-padR} y2={yOf(v)} stroke="#E8E2D8" strokeWidth="1" strokeDasharray={v===minV?"none":"3,3"}/>
                        <text x={padL-5} y={yOf(v)+4} textAnchor="end" fontSize="9" fill="#9BA8B4">{v}</text>
                      </g>
                    ))}
                    {/* X labels */}
                    {cronologico.map((x,i)=>(
                      <text key={i} x={xOf(i)} y={H-4} textAnchor="middle" fontSize="8" fill="#9BA8B4">{xLabel(x)}</text>
                    ))}
                    {/* Líneas verticales guía */}
                    {cronologico.map((x,i)=>(
                      <line key={i} x1={xOf(i)} y1={padT} x2={xOf(i)} y2={H-padB} stroke="#E8E2D8" strokeWidth="0.5"/>
                    ))}
                    {/* Series */}
                    {series.map(s=>(
                      <g key={s.key}>
                        <polyline points={polyline(s)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
                        {cronologico.map((x,i)=>{
                          const v=x[s.key]||0;
                          return (
                            <g key={i}>
                              <circle cx={xOf(i)} cy={yOf(v)} r="4.5" fill={s.color} stroke="#fff" strokeWidth="2"/>
                              {/* Valor encima del punto */}
                              <text x={xOf(i)} y={yOf(v)-8} textAnchor="middle" fontSize="9" fontWeight="700" fill={s.color}>{v}</text>
                            </g>
                          );
                        })}
                      </g>
                    ))}
                  </svg>
                </div>
                {/* Leyenda */}
                <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:4}}>
                  {series.map(s=>(
                    <span key={s.key} style={{fontSize:"0.70rem",color:"#6B7A8A",display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:16,height:3,borderRadius:2,background:s.color,display:"inline-block"}}/>
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Tabla filtrable */}
          <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #DDD8CF",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:"0.82rem",flex:1}}>Detalle por vivienda</span>
              <input value={vivFiltro} onChange={e=>setVivFiltro(e.target.value)} placeholder="Buscar ref. o propietario..." style={{padding:"5px 10px",border:"1px solid #DDD8CF",borderRadius:7,fontSize:"0.78rem",fontFamily:"inherit",outline:"none",width:190}}/>
              <select value={estFiltro} onChange={e=>setEstFiltro(e.target.value)} style={{padding:"5px 10px",border:"1px solid #DDD8CF",borderRadius:7,fontSize:"0.78rem",fontFamily:"inherit",outline:"none"}}>
                <option value="">Todos los estados</option>
                {Object.keys(ESTADOS_COLOR).map(k=><option key={k} value={k}>{k}</option>)}
              </select>
              <span style={{fontSize:"0.72rem",color:"#6B7A8A"}}>{vivsFiltradas.length} viviendas</span>
            </div>
            <div style={{overflowX:"auto",maxHeight:520,overflowY:"auto"}}>
              {(()=>{
                const COLS=[
                  {key:'ref',        label:'Ref.',               fr:'0.9fr'},
                  {key:'estado',     label:'Estado',             fr:'1fr'},
                  {key:'propietario',label:'Propietario',        fr:'1.2fr'},
                  {key:'repasos',    label:'Repasos pendientes', fr:'2.5fr'},
                  {key:'llave',      label:'Llave',              fr:'1fr'},
                  {key:'alarma',     label:'Alarma',             fr:'0.7fr'},
                ];
                const grid=COLS.map(c=>c.fr).join(' ');
                const thStyle=(col)=>({
                  cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',gap:4,
                  color:vivSort.col===col?'#1E2D4E':'#6B7A8A',
                  fontWeight:vivSort.col===col?800:700,
                });
                const arrow=(col)=>vivSort.col===col?(vivSort.dir===1?'↑':'↓'):'';
                const toggleSort=(col)=>setVivSort(s=>s.col===col?{col,dir:-s.dir}:{col,dir:1});
                return (
                  <>
                    <div style={{display:'grid',gridTemplateColumns:grid,minWidth:700,padding:'8px 16px',background:'#F0EEE9',fontSize:'0.60rem',textTransform:'uppercase',letterSpacing:'0.06em',position:'sticky',top:0,zIndex:1,borderBottom:'1px solid #DDD8CF'}}>
                      {COLS.map(c=>(
                        <div key={c.key} style={thStyle(c.key)} onClick={()=>toggleSort(c.key)}>
                          {c.label}<span style={{fontSize:'0.65rem',opacity:0.7}}>{arrow(c.key)}</span>
                        </div>
                      ))}
                    </div>
                    {vivsFiltradas.map((v,i)=>{
                      const ec=ESTADOS_COLOR[v.estado]||ESTADOS_COLOR['SIN ESTADO'];
                      return (
                        <div key={v.ref+i} style={{display:'grid',gridTemplateColumns:grid,minWidth:700,padding:'8px 16px',borderBottom:i<vivsFiltradas.length-1?'1px solid #E8E2D8':'none',alignItems:'start',fontSize:'0.77rem'}}>
                          <div style={{fontWeight:700}}>{v.ref}</div>
                          <div><span style={{background:ec.bg,color:ec.c,borderRadius:5,padding:'2px 6px',fontSize:'0.65rem',fontWeight:700,whiteSpace:'nowrap'}}>{v.estado}</span></div>
                          <div style={{color:'#6B7A8A',fontSize:'0.72rem'}}>{v.propietario||'—'}</div>
                          <div style={{color:v.repasos?'#e05a5a':'#4ca99a',fontSize:'0.72rem',lineHeight:1.4}}>{v.repasos||<span style={{color:'#4ca99a',fontWeight:700}}>✓ Sin repasos</span>}</div>
                          <div style={{fontSize:'0.70rem',color:v.llave&&String(v.llave).includes('RECOGIDA')?'#4ca99a':'#ddb96a'}}>{v.llave||'—'}</div>
                          <div style={{fontSize:'0.70rem',color:v.alarma==='Sí'?'#4ca99a':'#6B7A8A'}}>{v.alarma||'—'}</div>
                        </div>
                      );
                    })}
                    {vivsFiltradas.length===0&&<div style={{padding:'30px',textAlign:'center',color:'#6B7A8A',fontSize:'0.82rem'}}>Sin resultados</div>}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {pvTab==='informe' && !inf && (
        <div style={{textAlign:"center",padding:"50px 20px",background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",color:"#6B7A8A"}}>
          <div style={{fontSize:"2rem",marginBottom:8}}>📊</div>
          <div style={{fontWeight:700,color:"#1E2D4E",marginBottom:6}}>Sin informes importados</div>
          <div style={{fontSize:"0.82rem"}}>Importa el Excel «Control Viviendas Escrituradas vs Finalizadas»</div>
        </div>
      )}

      {/* ── VISTA INCIDENCIAS MANUALES ── */}
      {pvTab==='manual' && (
        <div>
          {pvForm.show && (
            <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"18px 20px",marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:"0.82rem",marginBottom:12,color:"#1E2D4E"}}>Nueva incidencia / solicitud</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
                {[
                  {l:"Ref. vivienda",  k:"ref",         type:"text",   ph:"B5-401..."},
                  {l:"Fecha",         k:"fecha",        type:"date",   ph:""},
                  {l:"Responsable",   k:"responsable",  type:"text",   ph:"Nombre..."},
                ].map(f=>(
                  <div key={f.k}>
                    <div style={{fontSize:"0.65rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{f.l}</div>
                    <input type={f.type} value={pvForm[f.k]} placeholder={f.ph} onChange={e=>setPvForm(p=>({...p,[f.k]:e.target.value}))} style={{padding:"7px 10px",border:"1px solid #DDD8CF",borderRadius:7,fontSize:"0.82rem",fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"}}/>
                  </div>
                ))}
                <div>
                  <div style={{fontSize:"0.65rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Tipo</div>
                  <select value={pvForm.tipo} onChange={e=>setPvForm(p=>({...p,tipo:e.target.value}))} style={{padding:"7px 10px",border:"1px solid #DDD8CF",borderRadius:7,fontSize:"0.82rem",fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"}}>
                    {Object.entries(POSVENTA_TIPOS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:"0.65rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Estado</div>
                  <select value={pvForm.estado} onChange={e=>setPvForm(p=>({...p,estado:e.target.value}))} style={{padding:"7px 10px",border:"1px solid #DDD8CF",borderRadius:7,fontSize:"0.82rem",fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box"}}>
                    {Object.entries(POSVENTA_ESTADO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:10}}>
                <div style={{fontSize:"0.65rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>Descripción</div>
                <textarea value={pvForm.descripcion} onChange={e=>setPvForm(p=>({...p,descripcion:e.target.value}))} placeholder="Describe la incidencia..." rows={2} style={{padding:"7px 10px",border:"1px solid #DDD8CF",borderRadius:7,fontSize:"0.82rem",fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box",resize:"vertical"}}/>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={addPosventa} style={{padding:"7px 16px",background:"#1E2D4E",color:"#fff",border:"none",borderRadius:8,fontSize:"0.8rem",fontWeight:700,cursor:"pointer"}}>Guardar</button>
                <button onClick={()=>setPvForm(f=>({...f,show:false}))} style={{padding:"7px 16px",background:"#F0EEE9",color:"#6B7A8A",border:"none",borderRadius:8,fontSize:"0.8rem",fontWeight:700,cursor:"pointer"}}>Cancelar</button>
              </div>
            </div>
          )}
          {ps.length > 0 ? (
            <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",overflow:"hidden"}}>
              <div style={{padding:"12px 18px",borderBottom:"1px solid #DDD8CF",fontWeight:700,fontSize:"0.86rem",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>Incidencias registradas</span>
                <span style={{fontSize:"0.72rem",color:"#6B7A8A",fontWeight:400}}>{ps.length} total · {abiertas.length} abiertas · {resueltas.length} resueltas</span>
              </div>
              <div style={{overflowX:"auto"}}>
                <div style={{display:"grid",gridTemplateColumns:"0.7fr 0.8fr 0.9fr 0.9fr 2fr 0.9fr 0.8fr 36px",minWidth:700,padding:"8px 16px",background:"#F0EEE9",fontSize:"0.60rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                  {["Fecha","Ref","Tipo","Estado","Descripción","Responsable","F. Resol.",""].map(h=><div key={h}>{h}</div>)}
                </div>
                {[...ps].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map((item,i) => {
                  const tp = POSVENTA_TIPOS[item.tipo] || POSVENTA_TIPOS.otro;
                  return (
                    <div key={item.id} style={{display:"grid",gridTemplateColumns:"0.7fr 0.8fr 0.9fr 0.9fr 2fr 0.9fr 0.8fr 36px",minWidth:700,padding:"10px 16px",borderBottom:i<ps.length-1?"1px solid #E8E2D8":"none",alignItems:"center",fontSize:"0.78rem"}}>
                      <div style={{color:"#6B7A8A"}}>{fmt(item.fecha)}</div>
                      <div style={{fontWeight:600}}>{item.ref||"—"}</div>
                      <div><span style={{background:tp.bg,color:tp.color,borderRadius:5,padding:"2px 7px",fontSize:"0.65rem",fontWeight:700}}>{tp.label}</span></div>
                      <div>
                        <select value={item.estado} onChange={e=>cambiarEstadoPV(item.id,e.target.value)} style={{background:(POSVENTA_ESTADO[item.estado]?.color||"#6B7A8A")+"18",border:"1px solid "+(POSVENTA_ESTADO[item.estado]?.color||"#6B7A8A")+"44",color:POSVENTA_ESTADO[item.estado]?.color||"#1E2D4E",borderRadius:5,padding:"2px 6px",fontSize:"0.65rem",fontWeight:700,fontFamily:"inherit",cursor:"pointer"}}>
                          {Object.entries(POSVENTA_ESTADO).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div style={{color:"#1E2D4E",lineHeight:1.4,fontSize:"0.75rem"}}>{item.descripcion}</div>
                      <div style={{color:"#6B7A8A",fontSize:"0.74rem"}}>{item.responsable||"—"}</div>
                      <div style={{color:"#6B7A8A",fontSize:"0.70rem"}}>{item.fechaResolucion?fmt(item.fechaResolucion):"—"}</div>
                      <button onClick={()=>eliminarPV(item.id)} style={{background:"none",border:"none",color:"#e05a5a",cursor:"pointer",fontSize:"0.75rem",padding:"2px 4px",fontFamily:"inherit"}}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            !pvForm.show && (
              <div style={{textAlign:"center",padding:"50px 20px",background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",color:"#6B7A8A"}}>
                <div style={{fontSize:"2rem",marginBottom:8}}>🔧</div>
                <div style={{fontWeight:700,color:"#1E2D4E",marginBottom:6}}>Sin incidencias manuales</div>
                <div style={{fontSize:"0.82rem"}}>Añade incidencias individuales o importa el informe Excel</div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};


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
            return p.map(x=>({...x,viviendas:x.viviendas||[],bp:x.bp||null,marketing:x.marketing||null,master:x.master||null,cronograma:x.cronograma||null}));
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
    // Load from cloud y hacer merge inteligente con localStorage
    // — conservar siempre el campo con MÁS datos entre cloud y local
    const localRaw=localStorage.getItem("ov11");
    let localProjects=null;
    try{const p=JSON.parse(localRaw||"null");if(Array.isArray(p)&&p.length>0) localProjects=p;}catch{}

    const mergeArr=(a,b)=>{// devuelve el array con más elementos (o el no-vacío)
      const aa=Array.isArray(a)?a:[];const bb=Array.isArray(b)?b:[];
      return aa.length>=bb.length?aa:bb;
    };
    const mergeObj=(a,b)=>{// devuelve el objeto no nulo (o el que tenga más keys)
      if(!a&&!b) return null;if(!a) return b;if(!b) return a;
      return Object.keys(b).length>=Object.keys(a).length?{...a,...b}:{...b,...a};
    };
    const mergeProject=(cloud,local)=>{
      if(!local) return cloud;
      if(!cloud) return local;
      // Para cada proyecto: conservar el campo con más información
      const defProj=DEFAULT_PROJECTS.find(d=>d.id===cloud.id);
      const existingIds=new Set([...(cloud.tareas||[]),...(local.tareas||[])].map(t=>String(t.id)));
      const missingDef=defProj?(defProj.tareas||[]).filter(t=>String(t.id).startsWith("t_atl_")&&!existingIds.has(String(t.id))):[];
      return {
        ...cloud,
        // Campos de array: conservar el más largo
        hitos:mergeArr(cloud.hitos,local.hitos),
        blockers:mergeArr(cloud.blockers,local.blockers),
        tareas:[...new Map([...(local.tareas||[]),...(cloud.tareas||[]),...missingDef].map(t=>[String(t.id),t])).values()],
        viviendas:mergeArr(cloud.viviendas,local.viviendas),
        posventaInformes:mergeArr(cloud.posventaInformes,local.posventaInformes),
        posventaIncidencias:mergeArr(cloud.posventaIncidencias,local.posventaIncidencias),
        // Campos objeto: conservar si existe
        bp:mergeObj(cloud.bp,local.bp),
        marketing:mergeObj(cloud.marketing,local.marketing),
        master:mergeObj(cloud.master,local.master),
        cronograma:mergeObj(cloud.cronograma,local.cronograma),
        // Texto: conservar el más largo
        resumenSemanal:(cloud.resumenSemanal||"").length>=(local.resumenSemanal||"").length?cloud.resumenSemanal:local.resumenSemanal,
      };
    };

    cloudLoad().then(cloudData=>{
      if(cloudData&&Array.isArray(cloudData)&&cloudData.length>0){
        const merged=cloudData.map(cx=>{
          const lx=localProjects?localProjects.find(l=>l.id===cx.id):null;
          return mergeProject(cx,lx);
        });
        // Añadir proyectos que solo existen en local (no llegaron aún al cloud)
        if(localProjects){
          const cloudIds=new Set(cloudData.map(c=>c.id));
          localProjects.filter(l=>!cloudIds.has(l.id)).forEach(l=>merged.push(l));
        }
        setProjects(merged);
        try{localStorage.setItem("ov11",JSON.stringify(merged));}catch{}
      } else if(localProjects){
        // Cloud vacío pero hay datos locales — no machacamos nada
      }
      setCloudSynced(true);
    }).catch(()=>setCloudSynced(true));
  },[]);

  useEffect(()=>{
    if(!cloudSynced) return;
    try{localStorage.setItem("ov11",JSON.stringify(projects));}catch(e){}
    cloudSave(projects);
  },[projects,cloudSynced]);
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
    const cyc=["disponible","reservada","vendida","rescindida","no-venta"];
    const estadoToStatus={"disponible":"disponible","reservada":"reservada","vendida":"vendida","rescindida":"rescindida","no-venta":"no-venta"};
    upd(activeId,p=>{
      if(p.master){
        // Update master.ventas
        const newVentas=p.master.ventas.map(v=>{
          if(v.ref!==vid) return v;
          const curEstado={"reservada":"reservada","disponible":"disponible","vendida":"vendida","rescindida":"rescindida","no-venta":"no-venta"}[v.status]||"disponible";
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
  useEffect(()=>{if(!document.getElementById("outfit-font")){const lk=document.createElement("link");lk.id="outfit-font";lk.rel="stylesheet";lk.href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap";document.head.appendChild(lk);}},[]);

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
          let isNvoga=false,isMedHills=false,isCuadroTarifa=false,hdrIdx=-1;
          for(let i=0;i<Math.min(rows.length,25);i++){
            const r=(rows[i]||[]).map(c=>norm(c));
            // MedHills Cashflow: MUST have "bloque viviendas" (multi-word) AND "precio vivienda"
            if(r.some(c=>c==="bloque viviendas"||c.includes("bloque")&&c.includes("vivend"))&&r.some(c=>c.includes("precio vivienda"))){isMedHills=true;hdrIdx=i;break;}
            // Nvoga Senior Living: has "bloque" AND ("apto" OR "tipologia") but NOT "precio vivienda"
            if(r.some(c=>c==="bloque")&&(r.some(c=>c.includes("apto"))||r.some(c=>c==="tipologia"))&&!r.some(c=>c.includes("precio vivienda"))){isNvoga=true;hdrIdx=i;break;}
            // Cuadro Tarifa (Almayate/genérico): has "codigo" AND "tipologia" AND ("precio" OR "tarifa")
            if(r.some(c=>c==="codigo"||c.includes("cod")&&c.length<8)&&r.some(c=>c==="tipologia")&&r.some(c=>c==="precio"||c.includes("tarifa"))){isCuadroTarifa=true;hdrIdx=i;break;}
            if(r.some(c=>c==="num"||c==="ref"||c==="pvp"||c.includes("pvp")||c.includes("precio venta")||c.includes("precio esc")||c.includes("vivend"))){hdrIdx=i;break;}
          }
          if(hdrIdx===-1) return;
          if(isMedHills){
            // MedHills Cashflow format
            const headers=(rows[hdrIdx]||[]).map(c=>norm(c));
            const iRef=headers.findIndex(h=>h.includes("bloque")&&h.includes("vivend"));
            const iStatus=headers.findIndex(h=>h==="status");
            const iPrecio=headers.findIndex(h=>h.includes("precio vivienda")&&(h.includes("anej")||h.includes("cv")));
            const iPrecioBase=headers.findIndex(h=>h.includes("precio vivienda aislada"));
            const iFinca=headers.findIndex(h=>h==="finca");
            const iComision=headers.findIndex(h=>h.includes("total comisiones")&&!h.includes("iva")&&!h.includes("con"));
            const iEscritura=headers.findIndex(h=>h.includes("escritura sin iva"));
            const iReserva=headers.findIndex(h=>h==="reserva");
            const refCol=iRef>=0?iRef:2;
            const statusCol=iStatus>=0?iStatus:1;
            const precioCol=iPrecio>=0?iPrecio:(iPrecioBase>=0?iPrecioBase:13);
            const fmtE=v=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(v);
            const statusMapMH={"vendida":"vendida","escritura":"vendida","escriturado":"vendida","reserva":"reservada","reservado":"reservada","rescindida":"rescindida","rescision":"rescindida","baja":"rescindida","libre":"disponible","disponible":"disponible"};
            for(let i=hdrIdx+1;i<rows.length;i++){
              const r=rows[i];if(!r) continue;
              const ref=String(r[refCol]||"").trim();
              if(!ref||ref.length<3) continue;
              const precio=Number(r[precioCol])||Number(r[12])||0;
              if(!precio||precio<1000) continue;
              const rawStatus=String(r[statusCol]||"").trim().toLowerCase();
              const estado=statusMapMH[rawStatus]||"disponible";
              const finca=iFinca>=0?String(r[iFinca]||"").trim():"";
              const comision=iComision>=0?Number(r[iComision])||0:0;
              const escritura=iEscritura>=0?Number(r[iEscritura])||0:0;
              const reserva=iReserva>=0?Number(r[iReserva])||0:0;
              const notas=[
                finca?"Finca: "+finca:"",
                comision?"Comision: "+fmtE(comision):"",
                escritura?"Escritura: "+fmtE(escritura):"",
                reserva&&estado==="reservada"?"Reserva: "+fmtE(reserva):"",
              ].filter(Boolean).join(" | ");
              allVvs.push({
                id:Date.now()+Math.random(),
                ref:ref.trim(),tipologia:"Vivienda",planta:"-",superficie:0,
                precio,precioOrigen:Number(r[12])||precio,estado,notas,
              });
            }
          } else if(isCuadroTarifa){
            // Cuadro Tarifa (Almayate y similares): Codigo, Tipología, PRECIO/TARIFA VIGENTE, Estado
            const headers=(rows[hdrIdx]||[]).map(c=>norm(c));
            const iCod=(()=>{const e=headers.findIndex(h=>h==="codigo");return e>=0?e:headers.findIndex(h=>h.includes("cod")&&h.length<8);})();
            const iTipo=headers.findIndex(h=>h==="tipologia");
            const iSup=headers.findIndex(h=>h.includes("total")&&(h.includes("construid")||h.includes("m2")));
            const iSupUtil=headers.findIndex(h=>h.includes("util")&&h.includes("interior")&&!h.includes("ext"));
            const iPrecio=headers.findIndex(h=>h==="precio")||headers.findIndex(h=>h.includes("tarifa")&&h.includes("vigente")&&!h.includes("anejos"));
            const iEstado=headers.findIndex(h=>h==="estado");
            const iBloque=headers.findIndex(h=>h==="bloque");
            const iPiso=headers.findIndex(h=>h==="piso");
            const iDorm=headers.findIndex(h=>h.includes("dorm"));
            const estadoMapCT={"l":"disponible","libre":"disponible","r":"reservada","reservado":"reservada","reservada":"reservada","v":"vendida","vendido":"vendida","vendida":"vendida","b":"no-venta","bloqueado":"no-venta"};
            const priceCol=iPrecio>=0?iPrecio:31;
            for(let i=hdrIdx+1;i<rows.length;i++){
              const r=rows[i];if(!r) continue;
              const cod=String(r[iCod>=0?iCod:3]||"").trim();
              if(!cod||cod.length<3) continue;
              const precio=typeof r[priceCol]==="number"?r[priceCol]:parseFloat(String(r[priceCol]||"").replace(/[^0-9.]/g,""))||0;
              if(!precio||precio<1000) continue;
              const tipo=String(r[iTipo>=0?iTipo:4]||"").trim();
              const supTotal=parseFloat(String(r[iSup>=0?iSup:19]||"").replace(",","."))||0;
              const supUtil=parseFloat(String(r[iSupUtil>=0?iSupUtil:12]||"").replace(",","."))||0;
              const sup=supUtil||supTotal;
              const rawEst=String(r[iEstado>=0?iEstado:44]||"").trim().toLowerCase();
              const estado=estadoMapCT[rawEst]||"disponible";
              const bloque=iBloque>=0?String(r[iBloque]||"").trim():"";
              const piso=iPiso>=0?String(r[iPiso]||"").trim():"";
              const dorm=iDorm>=0?String(r[iDorm]||"").trim():"";
              const notas=[bloque?"Bloque: "+bloque:"",piso?"Piso: "+piso:""].filter(Boolean).join(" | ");
              allVvs.push({id:Date.now()+Math.random(),ref:cod,tipologia:tipo||(dorm?dorm+" dorm.":"-"),planta:piso?piso:"-",superficie:sup,precio,estado,notas});
            }
          } else if(isNvoga){
            const headers=(rows[hdrIdx]||[]).map(c=>norm(c));
            const iBloque=headers.findIndex(h=>h==="bloque");
            const iApto=headers.findIndex(h=>h.includes("apto"));
            const iTipo=headers.findIndex(h=>h==="tipologia");
            const iPlanta=headers.findIndex(h=>h==="planta");
            const iSup=headers.findIndex(h=>h.includes("total")&&h.includes("m2"));
            const iTerraza=headers.findIndex(h=>h.includes("terraza"));
            const iPrecio=headers.findIndex(h=>h.includes("esc. 1")||h.includes("esc.1")||h.includes("pricing esc")||h.includes("precio total"));
            const priceCol=iPrecio!==-1?iPrecio:18;
            for(let i=hdrIdx+1;i<rows.length;i++){
              const r=rows[i];if(!r) continue;
              const aptoRaw=r[iApto!==-1?iApto:1];
              const apto=String(aptoRaw!=null?aptoRaw:"").trim();
              if(apto===""||apto===null||apto===undefined) continue;
              if(isNaN(Number(apto))&&!apto.match(/[0-9]/)) continue;
              const precio=typeof r[priceCol]==="number"?r[priceCol]:parseFloat(String(r[priceCol]||"").replace(/[^0-9.]/g,""))||0;if(!precio||precio<1000) continue;
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
        if(!allVvs.length){alert("No se encontraron viviendas con precio. Revisa el formato del archivo.");return;}
        upd(activeId,p=>({...p,viviendas:[...(p.viviendas||[]),...allVvs]}));
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
        // Find best sheet: prefer one containing "master" in name, else first sheet with most data
        const scoreSht=n=>{const l=n.toLowerCase();if(l.includes("master")) return 3;if(l.includes("vivienda")||l.includes("venta")||l.includes("inmueble")) return 2;if(l.includes("rescis")) return -1;return 0;};
        const masterSheetName=wb.SheetNames.slice().sort((a,b)=>scoreSht(b)-scoreSht(a))[0];
        const ws=wb.Sheets[masterSheetName];
        if(ws){
          const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:null,raw:true});
          // Find header row: the row that has the most "useful" column keywords
          const HDR_KEYWORDS=["status","precio","tipologia","tipología","vivienda","vvda","inmueble","numeracion","numeración","referencia","ref","m2","agencia","nombre","blq"];
          let hdrIdx=-1,hdrScore=0;
          for(let i=0;i<Math.min(rows.length,15);i++){
            const r=(rows[i]||[]).map(c=>String(c||"").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim());
            const score=r.filter(c=>HDR_KEYWORDS.some(k=>c.includes(k.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g,"")))).length;
            if(score>hdrScore){hdrScore=score;hdrIdx=i;}
          }
          if(hdrIdx>=0){
            const normalize=s=>String(s||"").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
            const hdr=(rows[hdrIdx]||[]).map(normalize);
            const fi=(candidates)=>{for(const c of candidates){const i=hdr.findIndex(h=>h===normalize(c)||h.includes(normalize(c)));if(i>=0) return i;}return -1;};
            const iRef=fi(["NUMERACION COMERCIAL","VVDA","VIVIENDA","REF","INMUEBLE","REFERENCIA"]);
            const iTipo=fi(["TIPOLOGIA","INMUEBLE","TIPO"]);
            const iBlq=fi(["BLQ","BLOQUE"]);
            const iStatus=fi(["STATUS COMERCIAL","ESTADO COMERCIAL","STATUS","ESTADO"]);
            const iPrecio=fi(["PRECIO DE VENTA","PRECIO TOTAL OPERAC","PRECIO VENTA CON ANEJOS","PRECIO FINAL"]);
            const iPrecioOrigen=fi(["PRECIO ORIGEN","PRECIO BASE"]);
            const iM2=fi(["M2 UTIL INT","M2 UTIL","METROS UTIL","M2 CONST INT","SUPERFICIE"]);
            const iNombre=fi(["NOMBRE 1","NOMBRE","COMPRADOR"]);
            const iAgencia=fi(["AGENCIA","COLABORADOR"]);
            const iFReserva=fi(["F. RESERVA","FECHA RESERVA","F.RESERVA"]);
            const iFCpcv=fi(["F. CPCV","FECHA CPCV","F.CPCV"]);
            const iComision=fi(["TOTAL COMISION","TOTAL COMISIONES","COMISION TOTAL"]);
            const iPctCom=fi(["% COMISION","PORCENTAJE COMISION"]);
            const iVentaGsp=fi(["VENTA GSP"]);
            // Repricings: cols whose header starts with REPRICING or SUBIDA
            const rpCols=[];hdr.forEach((h,i)=>{if(h.startsWith("REPRICING")||h.startsWith("SUBIDA")) rpCols.push(i);});
            const statusMap={"RESERVA":"reservada","RESERVADO":"reservada","CV":"reservada","LIBRE":"disponible","DISPONIBLE":"disponible","ESCRITURA":"vendida","ESCRITURADO":"vendida","VENDIDA":"vendida","VENDIDO":"vendida","BAJA":"rescindida","RESCISION":"rescindida","RESCINDIDA":"rescindida","BLOQUEADO":"no-venta","BLOQUEADO PROMOTOR":"no-venta","BLOQUEADO PROMOTOR":"no-venta"};
            for(let i=hdrIdx+1;i<rows.length;i++){
              const r=rows[i];if(!r) continue;
              // Get ref from best column
              const rawRef=String(r[iRef>=0?iRef:3]||"").trim();
              const blqVal=iBlq>=0?String(r[iBlq]||"").trim():"";
              let ref=rawRef;
              if(ref&&!ref.includes("-")&&!ref.toUpperCase().startsWith("B")&&blqVal) ref="B"+blqVal+"-"+ref;
              if(!ref||normalize(ref).includes("TOTAL")||normalize(ref)===normalize("VVDA")||normalize(ref)===normalize("INMUEBLE")||normalize(ref)===normalize("NUMERACION COMERCIAL")) continue;
              // Price: try detected col, then scan all cols for first number > 1000
              let precio=0;
              const priceColsToTry=[iPrecio,...rpCols.slice(0,1)].filter(x=>x>=0);
              for(const pc of priceColsToTry){const v=r[pc];if(v&&v!==false&&String(v).toUpperCase()!=="FALSE"){const n=toN(v);if(n>1000){precio=n;break;}}}
              if(!precio){for(let ci=0;ci<r.length;ci++){const v=r[ci];if(v&&typeof v==="number"&&v>10000){precio=v;break;}}}
              if(!precio) continue;
              // Status: leer directamente STATUS COMERCIAL, sin sobreescribir con VENTA GSP
              const statusExcel=String(r[iStatus>=0?iStatus:17]||"").trim()||"—";
              let statusRaw=normalize(statusExcel);
              const status=statusMap[statusRaw]||"disponible";
              const rps=rpCols.map(c=>toN(r[c])).filter(v=>v>0);
              const tipoInmueble=normalize(String(r[iTipo>=0?iTipo:1]||""))||"VIV";
              // Solo viviendas (VIV) — PK y TR tienen precios propios que distorsionan stats
              if(tipoInmueble==="PK"||tipoInmueble==="TR") continue;
              const precioOrigenVal=toN(r[iPrecioOrigen>=0?iPrecioOrigen:18]);
              result.ventas.push({
                ref,tipo:tipoInmueble,status,statusExcel,precio,
                precioOrigen:precioOrigenVal,
                m2:toN(r[iM2>=0?iM2:9]),
                nombre:String(r[iNombre>=0?iNombre:36]||"").trim(),
                agencia:String(r[iAgencia>=0?iAgencia:56]||"").trim(),
                fReserva:toISO(r[iFReserva>=0?iFReserva:65]),
                fCpcv:toISO(r[iFCpcv>=0?iFCpcv:66]),
                comision:toN(r[iComision>=0?iComision:60]),
                pctComision:toN(r[iPctCom>=0?iPctCom:59]),
                repricings:rps,
                incremento:precio-(precioOrigenVal||precio),
              });
            }
          }
        }
        // Find rescisiones sheet — buscar por "rescis", "resoluciones" o "pendiente"
        const rescSheetName=wb.SheetNames.find(s=>{const l=s.toLowerCase();return l.includes("rescis")||l.includes("resoluc")||l.includes("pendiente");})||null;
        const wsR=rescSheetName?wb.Sheets[rescSheetName]:null;
        if(wsR){
          const rowsR=window.XLSX.utils.sheet_to_json(wsR,{header:1,defval:null,raw:true});
          // La hoja "Resoluciones y pendientes" tiene secciones con cabeceras de sección
          // (ej: "Resoluciones vendidas", "Resoluciones libres", "Pendiente de resolución")
          // seguidas de filas de datos. Recogemos cualquier ref tipo B#-### que aparezca.
          const REF_RE=/^[A-Z]\d+-\d+$/i;
          const seenRefs=new Set();
          // Intentar detectar col de ref por cabecera, o usar col B (índice 1) por defecto
          let refColR=1;
          for(let i=0;i<Math.min(rowsR.length,10);i++){
            const r=(rowsR[i]||[]).map(c=>String(c||"").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim());
            const ci=r.findIndex(c=>c.includes("VVDA")||c.includes("NUMERACION")||c.includes("REFERENCIA")||c==="REF");
            if(ci>=0){refColR=ci;break;}
          }
          for(let i=0;i<rowsR.length;i++){
            const r=rowsR[i];if(!r) continue;
            // Buscar en todas las columnas por si la ref no está en refColR
            let ref="";
            const candidate=String(r[refColR]||"").trim();
            if(REF_RE.test(candidate)){ref=candidate;}
            else{for(let ci=0;ci<Math.min(r.length,10);ci++){const v=String(r[ci]||"").trim();if(REF_RE.test(v)){ref=v;break;}}}
            if(!ref||seenRefs.has(ref)) continue;
            seenRefs.add(ref);
            result.rescisiones.push({ref,fecha:"",precio:0,nombre:""});
          }
        }
        if(!result.ventas.length){alert("No se encontraron datos en el master comercial.");return;}
        // Sync with viviendas
        const estadoMap2={"reservada":"reservada","disponible":"disponible","vendida":"vendida","rescindida":"rescindida","no-venta":"no-venta"};
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
            // Detect column order: some files have Tipo in col1, others in col2
            // Check header row for "Tipo" vs "Acción" labels
            const hdrL2=(hdr||[]).map(c=>String(c||"").toLowerCase().trim());
            const iTipoCand=hdrL2.findIndex(h=>h.includes("tipo"));
            const iAccionCand=hdrL2.findIndex(h=>h.includes("acci")||h==="accion"||h==="acción");
            const iPagadorCand=hdrL2.findIndex(h=>h==="pagador");
            const iProvCand=hdrL2.findIndex(h=>h==="proveedor");
            const iTipo=iTipoCand>=0?iTipoCand:1;
            const iAccion=iAccionCand>=0?iAccionCand:2;
            const iPagador=iPagadorCand>=0?iPagadorCand:3;
            const iProv=iProvCand>=0?iProvCand:4;
            let iTotalCol=hdr.findIndex((c,i)=>i>5&&String(c||"").toLowerCase().includes("total"));
            if(iTotalCol===-1) iTotalCol=36;

            // Build ISO dates for month cols
            const mColsWithISO=monthCols.map(mc=>{
              const lbl=mc.label;
              const mNamesMap={ene:"01",feb:"02",mar:"03",abr:"04",may:"05",jun:"06",jul:"07",ago:"08",sept:"09",sep:"09",oct:"10",nov:"11",dic:"12"};
              const lblParts=lbl.split("-");
              const mNum=mNamesMap[lblParts[0]]||"01";
              const yNum=lblParts[1]&&lblParts[1].length===2?"20"+lblParts[1]:lblParts[1]||"2025";
              return {...mc,iso:yNum+"-"+mNum+"-01"};
            });

            const toNum=v=>{if(!v&&v!==0) return 0;if(typeof v==="number") return v;const s=String(v).replace(/^'+/,"").replace(/[^0-9.-]/g,"");return parseFloat(s)||0;};
            const cleanStr=v=>String(v||"").replace(/^'+/,"").trim();
            for(let i=hdrIdx+1;i<rows.length;i++){
              const r=rows[i];if(!r) continue;
              const tipo=cleanStr(r[iTipo]);
              const accion=cleanStr(r[iAccion]);
              if(!tipo&&!accion) continue;
              // Skip summary rows
              const tipoUP=(tipo||"").toUpperCase();
              const accionUP=(accion||"").toUpperCase();
              if(tipoUP.startsWith("TOTAL")||tipoUP.startsWith("PRESUPUESTO BP")||
                 tipoUP.startsWith("LANZAMIENTO")||tipoUP.startsWith("DURANTE")||
                 tipoUP.startsWith("DESVIACI")||tipoUP.startsWith("VARIABLE")||
                 tipoUP.startsWith("%")||accionUP.startsWith("TOTAL")) continue;
              if(!accion) continue;
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

  const seguimientoItems=proj?proj.tareas.filter(t=>t.id&&t.id.toString().startsWith("t_atl")):[];
  const tareasLibres=proj?proj.tareas.filter(t=>!(t.id&&t.id.toString().startsWith("t_atl"))):[];
  const segPendientes=seguimientoItems.filter(t=>!t.done).length;
  const tarPendientes=tareasLibres.filter(t=>!t.done).length;

  const TABS=[
    {id:"hitos",l:"Hitos"},
    {id:"bp",l:"Business Plan"+(proj&&proj.bp?" OK":"")},
    {id:"viviendas",l:"Viviendas"+(st.total>0?" ("+st.total+")":"")},
    {id:"master",l:"Master Comercial"+(proj&&proj.master?" OK":"")},
    {id:"marketing",l:"Marketing"+(proj&&proj.marketing?" OK":"")},
    {id:"comercial",l:"Comercial"},
    {id:"cronograma",l:"Cronograma"+(proj&&proj.cronograma?" ✓":"")},
    {id:"posventa",l:"Posventa"+(proj&&proj.posventa&&proj.posventa.length>0?" ("+proj.posventa.length+")":"")},
    {id:"equipo",l:"Equipo"},
    {id:"blockers",l:"Alertas"+(proj&&proj.blockers.length>0?" ("+proj.blockers.length+")":"")},
    {id:"seguimiento",l:"Seguimiento"+(segPendientes>0?" ("+segPendientes+")":"")},
    {id:"tareas",l:"Tareas"+(tarPendientes>0?" ("+tarPendientes+")":"")},
    {id:"reporte",l:"Reporte"},
  ];

  if(!loggedIn) return <LoginScreen onLogin={doLogin}/>;

  return (
    <ErrorBoundary>
    <div style={{fontFamily:"'Outfit',system-ui,sans-serif",background:"#F7F6F3",color:"#1E2D4E",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 32px",borderBottom:"1px solid #EAE6DF",background:"#FFFFFF",flexShrink:0,boxShadow:"0 1px 8px rgba(30,45,78,0.06)"}}>

        <div style={{display:"flex",alignItems:"center",gap:14,cursor:"pointer"}} onClick={()=>setView("dashboard")}>
          <div style={{display:"flex",alignItems:"center"}}>
            <svg width="130" height="22" viewBox="0 0 1197.3 192.51" xmlns="http://www.w3.org/2000/svg">
              <g fill="#1E2D4E">
                <polygon points="39.02 21.24 163.44 135.19 124.42 170.95 0 57 39.02 21.24"/>
                <rect x="167" y="21.33" width="54.02" height="148.48"/>
                <rect x="6.52" y="121.78" width="54.02" height="49.49"/>
              </g>
              <rect x="290.44" y="0" width="6.01" height="192.51" fill="#1E2D4E"/>
              <g fill="#1E2D4E">
                <path d="M424.19,124.52c-34.3,0-54.97-22.16-54.97-54.19s20.67-54.19,54.97-54.19,54.75,22.16,54.75,54.19-20.67,54.19-54.75,54.19ZM424.19,110.42c25.07,0,37.16-18.13,37.16-40.09s-12.09-40.09-37.16-40.09-37.38,18.13-37.38,40.09,12.09,40.09,37.38,40.09Z"/>
                <path d="M502.03,18.96l31,86.63h.22l31-86.63h19.13l-40.24,102.74h-20.01l-40.24-102.74h19.13Z"/>
                <path d="M674.2,90.07h17.59c-5.72,19.14-21.77,34.45-49.69,34.45-34.08,0-54.75-21.96-54.75-54.19,0-34.25,21.11-54.19,53.87-54.19,35.18,0,52.33,21.96,52.33,58.42h-88.61c0,18.53,12.09,35.86,36.5,35.86,22.43,0,30.78-13.3,32.76-20.35ZM604.94,60.46h71.02c0-16.52-13.63-30.22-34.74-30.22s-36.28,13.7-36.28,30.22Z"/>
                <path d="M770.29,16.74v16.12h-.44c-24.41-3.63-41.34,12.09-41.34,34.05v54.8h-17.59V18.96h17.59v20.35h.44c5.94-13.5,14.95-23.17,31-23.17,4.18,0,7.26.2,10.34.6Z"/>
                <path d="M793.82,18.96l31,86.63h.22l31-86.63h19.13l-40.24,102.74h-20.01l-40.24-102.74h19.13Z"/>
                <path d="M907.5,18.96v102.74h-17.59V18.96h17.59Z"/>
                <path d="M1014.36,90.07h17.59c-5.72,19.14-21.77,34.45-49.69,34.45-34.08,0-54.75-21.96-54.75-54.19,0-34.25,21.11-54.19,53.87-54.19,35.18,0,52.33,21.96,52.33,58.42h-88.61c0,18.53,12.09,35.86,36.5,35.86,22.43,0,30.78-13.3,32.76-20.35ZM945.1,60.46h71.02c0-16.52-13.63-30.22-34.74-30.22s-36.28,13.7-36.28,30.22Z"/>
                <path d="M1057.02,18.96l25.51,85.21h.44l25.07-85.21h18.69l25.29,85.21h.44l25.51-85.21h19.35l-35.84,102.74h-18.69l-25.29-84.81h-.44l-24.85,84.81h-18.69l-35.84-102.74h19.35Z"/>
              </g>
            </svg>
          </div>
          <div style={{width:1,height:16,background:"#DDD8CF"}}/>
          <span style={{fontSize:"0.68rem",color:"#8A9BAA",letterSpacing:"0.08em",textTransform:"uppercase"}}>Gestion de promociones</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>{
            const data=JSON.stringify(projects,null,2);
            const blob=new Blob([data],{type:"application/json"});
            const url=URL.createObjectURL(blob);
            const a=document.createElement("a");
            a.href=url;a.download="overview-backup-"+new Date().toISOString().split("T")[0]+".json";
            a.click();URL.revokeObjectURL(url);
          }} style={{background:"transparent",border:"1px solid #DDD8CF",color:"#6B7A8A",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:"0.68rem",fontWeight:600,fontFamily:"inherit"}} title="Exportar backup de datos">
            Backup
          </button>
          <label style={{background:"transparent",border:"1px solid #DDD8CF",color:"#6B7A8A",borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:"0.68rem",fontWeight:600,display:"inline-flex",alignItems:"center"}} title="Restaurar desde backup">
            Restaurar
            <input type="file" accept=".json" style={{display:"none"}} onChange={e=>{
              const file=e.target.files[0];if(!file) return;
              if(!confirm("Esto reemplazara TODOS los datos actuales. Seguro?")) return;
              const reader=new FileReader();
              reader.onload=ev=>{
                try{
                  const data=JSON.parse(ev.target.result);
                  if(Array.isArray(data)&&data.length>0){
                    const migrated=data.map(x=>({...x,viviendas:x.viviendas||[],bp:x.bp||null,marketing:x.marketing||null,master:x.master||null}));
                    setProjects(migrated);
                    try{localStorage.setItem("ov11",JSON.stringify(migrated));}catch{}
                    alert("Datos restaurados correctamente");
                  } else {alert("Archivo no valido");}
                }catch{alert("Error al leer el archivo");}
              };
              reader.readAsText(file);
              e.target.value="";
            }}/>
          </label>
          <div style={{width:1,height:16,background:"#DDD8CF"}}/>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(76,169,154,0.08)",border:"1px solid rgba(76,169,154,0.25)",color:"#4ca99a",fontSize:"0.65rem",fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",padding:"4px 10px",borderRadius:20}}>
            <div style={{width:5,height:5,background:"#4ca99a",borderRadius:"50%"}}/>En vivo
          </div>
          <div style={{fontSize:"0.76rem",color:"#6B7A8A",textTransform:"capitalize"}}>{today}</div>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {view==="dashboard"&&(
          <div style={{padding:"24px 32px",overflowY:"auto",flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div><div style={{fontWeight:800,fontSize:"1.3rem",letterSpacing:"-0.03em",marginBottom:3}}>Panel de promociones</div><div style={{fontSize:"0.78rem",color:"#6B7A8A"}}>Vista consolidada</div></div>
              <Btn onClick={openNewP} v="primary">+ Nueva promocion</Btn>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:26}}>
              {[{label:"Promociones",val:projects.length,color:"#c9a86c",sub:"activas"},{label:"Unidades en cartera",val:fmtNum(totalU),color:"#1E2D4E",sub:"total registradas"},{label:"Vendidas",val:fmtNum(totalV)+" / "+fmtNum(totalU),color:"#4ca99a",sub:totalU?Math.round(totalV/totalU*100)+"% absorcion":"-"},{label:"Alertas",val:bloq+risk,color:bloq>0?"#e05a5a":risk>0?"#ddb96a":"#4ca99a",sub:bloq+" bloqueados / "+risk+" en riesgo"}].map(k=>(
                <div key={k.label} style={{background:"#FFFFFF",borderRadius:14,border:"1px solid #DDD8CF",padding:"18px 22px"}}>
                  <div style={{fontSize:"0.65rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.09em",fontWeight:700,marginBottom:8}}>{k.label}</div>
                  <div style={{fontSize:"1.7rem",fontWeight:800,color:k.color,letterSpacing:"-0.03em",marginBottom:3}}>{k.val}</div>
                  <div style={{fontSize:"0.72rem",color:"#6B7A8A"}}>{k.sub}</div>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontWeight:800,fontSize:"0.92rem",marginBottom:14}}>Todas las promociones</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:16}}>
              {projects.map((p)=>{
                const est=ESTADOS[p.estado]||ESTADOS.planificacion;
                const s=calcStats(p.master?masterToVivs(p.master):(p.viviendas||[]));
                const hOk=p.hitos.filter(h=>h.estado==="completado").length;
                const hCurso=p.hitos.filter(h=>h.estado==="en-curso").length;
                const hPend=p.hitos.filter(h=>h.estado==="pendiente"||h.estado==="retrasado").length;
                const hTotal=p.hitos.length||1;
                const pctVenta=s.total?Math.round((s.vendidas+s.reservadas)/s.total*100):0;
                const pctVendidas=s.total?Math.round(s.vendidas/s.total*100):0;
                const segItems=(p.tareas||[]).filter(t=>t.id&&t.id.toString().startsWith("t_atl"));
                const segDone=segItems.filter(t=>t.done).length;
                const segTotal=segItems.length||1;
                const tareasP=(p.tareas||[]).filter(t=>!(t.id&&t.id.toString().startsWith("t_atl"))&&!t.done).length;
                // mini donut SVG — hitos
                const r=28,cx=34,cy=34,circ=2*Math.PI*r;
                const segHOk=(hOk/hTotal)*circ;
                const segHCurso=(hCurso/hTotal)*circ;
                const segHPend=circ-segHOk-segHCurso;
                return (
                  <div key={p.id} onClick={()=>{setActiveId(p.id);setView("proyecto");setTab("hitos");}}
                    style={{background:"#FFFFFF",borderRadius:16,border:"1px solid #DDD8CF",padding:"20px",cursor:"pointer",transition:"box-shadow 0.15s,transform 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 24px rgba(30,45,78,0.10)";e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none";}}>
                    {/* Header */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:"1rem",letterSpacing:"-0.02em",marginBottom:3}}>{p.name}</div>
                        <div style={{fontSize:"0.71rem",color:"#6B7A8A"}}>{p.ubicacion} · PO: {p.projectOwner||"-"}</div>
                      </div>
                      <span style={{fontSize:"0.62rem",fontWeight:700,padding:"3px 9px",borderRadius:20,background:est.bg,color:est.color,textTransform:"uppercase",whiteSpace:"nowrap",marginLeft:8}}>{est.label}</span>
                    </div>

                    {/* Gráfico donut hitos + métricas */}
                    <div style={{display:"flex",gap:16,alignItems:"center",marginBottom:16}}>
                      <div style={{flexShrink:0}}>
                        <svg width="68" height="68" viewBox="0 0 68 68">
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#EAE6DF" strokeWidth="7"/>
                          {/* completados */}
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#4ca99a" strokeWidth="7"
                            strokeDasharray={segHOk+" "+(circ-segHOk)}
                            strokeDashoffset={circ*0.25}
                            style={{transition:"stroke-dasharray 0.4s"}}/>
                          {/* en curso */}
                          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#c9a86c" strokeWidth="7"
                            strokeDasharray={segHCurso+" "+(circ-segHCurso)}
                            strokeDashoffset={circ*0.25-segHOk}
                            style={{transition:"stroke-dasharray 0.4s"}}/>
                          <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="800" fill="#1E2D4E">{hOk}/{hTotal}</text>
                          <text x={cx} y={cy+13} textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="#6B7A8A">hitos</text>
                        </svg>
                      </div>
                      <div style={{flex:1,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {[
                          {l:"Vendidas",v:s.vendidas,sub:s.total+"uds",c:"#4ca99a"},
                          {l:"Reservadas",v:s.reservadas,sub:"",c:"#ddb96a"},
                          {l:"Seguimiento",v:segDone+"/"+segItems.length,sub:"completado",c:"#7c5cfc"},
                          {l:"Tareas",v:tareasP,sub:"pendientes",c:tareasP>0?"#e05a5a":"#4ca99a"},
                        ].map(m=>(
                          <div key={m.l} style={{background:"#F7F6F3",borderRadius:8,padding:"7px 9px"}}>
                            <div style={{fontSize:"0.58rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:2}}>{m.l}</div>
                            <div style={{fontWeight:800,fontSize:"0.95rem",color:m.c,letterSpacing:"-0.02em"}}>{m.v}</div>
                            {m.sub&&<div style={{fontSize:"0.61rem",color:"#6B7A8A"}}>{m.sub}</div>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Barra de ventas */}
                    {s.total>0&&(
                      <div style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.66rem",color:"#6B7A8A",marginBottom:4}}>
                          <span>Absorción comercial</span>
                          <span style={{fontWeight:700,color:pctVenta>70?"#4ca99a":pctVenta>40?"#c9a86c":"#1E2D4E"}}>{pctVenta}%</span>
                        </div>
                        <div style={{height:5,background:"#EAE6DF",borderRadius:3,overflow:"hidden",display:"flex"}}>
                          <div style={{width:pctVendidas+"%",background:"#4ca99a",transition:"width 0.4s"}}/>
                          <div style={{width:(pctVenta-pctVendidas)+"%",background:"#ddb96a",transition:"width 0.4s"}}/>
                        </div>
                        <div style={{display:"flex",gap:10,marginTop:4}}>
                          <div style={{fontSize:"0.59rem",color:"#4ca99a"}}>■ Vendidas {pctVendidas}%</div>
                          <div style={{fontSize:"0.59rem",color:"#ddb96a"}}>■ Reservadas {pctVenta-pctVendidas}%</div>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:"1px solid #EAE6DF"}}>
                      <div style={{fontSize:"0.67rem",color:"#6B7A8A"}}>PM: {p.pmTecnico||"-"} · Entrega: {fmt(p.fechaEntrega)||"-"}</div>
                      {p.blockers&&p.blockers.filter(b=>!b.resuelto).length>0&&(
                        <span style={{fontSize:"0.61rem",fontWeight:700,color:"#e05a5a",background:"rgba(224,90,90,0.08)",border:"1px solid rgba(224,90,90,0.2)",borderRadius:8,padding:"2px 7px"}}>⚠ {p.blockers.filter(b=>!b.resuelto).length} alerta</span>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        )}

        {view==="proyecto"&&proj&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"18px 32px 0",background:"#F7F6F3",borderBottom:"1px solid #DDD8CF",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                    <button onClick={()=>setView("dashboard")} style={{background:"none",border:"none",color:"#6B7A8A",cursor:"pointer",fontSize:"0.78rem",padding:0}}>&lt;- Volver</button>
                    <h1 style={{margin:0,fontSize:"1.5rem",fontWeight:800,letterSpacing:"-0.03em"}}>{proj.name}</h1>
                    <span style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 9px",borderRadius:8,background:projEst.bg,color:projEst.color,textTransform:"uppercase"}}>{projEst.label}</span>
                    {proj.bp&&<span style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 9px",borderRadius:8,background:"rgba(124,92,252,0.15)",color:"#94a3b8"}}>BP cargado</span>}
                    <span style={{fontSize:"0.73rem",color:"#6B7A8A"}}>{proj.ubicacion} - {proj.zona}</span>
                  </div>
                  <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                    {["PO: "+proj.projectOwner,"PM: "+proj.pmTecnico,"Comercial: "+proj.responsableComercial,"Entrega: "+fmt(proj.fechaEntrega)].map(m=><span key={m} style={{fontSize:"0.75rem",color:"#6B7A8A"}}>{m}</span>)}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                  <label style={{background:"rgba(148,163,184,0.1)",border:"1px solid rgba(148,163,184,0.3)",color:"#94a3b8",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:6}}>
                    {bpImporting?"Cargando...":"Importar BP"}
                    <input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}} disabled={bpImporting}/>
                  </label>
                  <Btn onClick={openEditP} sm>Editar</Btn>
                  <Btn onClick={()=>delP(proj.id)} v="danger" sm>Eliminar</Btn>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
                {[{label:"Total uds",val:st.total?(st.totalViv+"V"+(st.totalParc>0?" / "+st.totalParc+"P":"")):"-"},{label:"Vendidas",val:st.vendidas,color:"#4ca99a"},{label:"Reservadas",val:st.reservadas,color:"#ddb96a"},{label:"Absorcion",val:(st.total?Math.round((st.vendidas+st.reservadas)/st.total*100):0)+"%",color:(st.total&&(st.vendidas+st.reservadas)/st.total>0.6)?"#4ca99a":(st.total&&(st.vendidas+st.reservadas)/st.total>0.3)?"#ddb96a":"#e05a5a"},{label:"Precio medio VIV",val:fmtEur(st.precioMedio)}].map(k=>(
                  <div key={k.label} style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"10px 14px"}}>
                    <div style={{fontSize:"0.6rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{k.label}</div>
                    <div style={{fontSize:"1.1rem",fontWeight:800,color:k.color||"#1E2D4E"}}>{k.val}</div>
                    {k.sub&&<div style={{fontSize:"0.65rem",color:"#6B7A8A",marginTop:2}}>{k.sub}</div>}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",overflowX:"auto"}}>
                {TABS.map(t=>(
                  <button key={t.id} onClick={()=>setTab(t.id)} style={{background:"none",border:"none",borderBottom:"2px solid "+(tab===t.id?"#c9a86c":"transparent"),color:tab===t.id?"#1E2D4E":"#6B7A8A",padding:"9px 14px",cursor:"pointer",fontSize:"0.79rem",fontWeight:tab===t.id?700:400,fontFamily:"inherit",whiteSpace:"nowrap"}}>{t.l}</button>
                ))}
              </div>
            </div>

            <div style={{flex:1,overflowY:"auto",padding:"22px 32px"}}>

              {tab==="hitos"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div><div style={{fontWeight:700,fontSize:"0.92rem"}}>Hitos del proyecto</div><div style={{fontSize:"0.73rem",color:"#6B7A8A",marginTop:2}}>Arrastra para reordenar - Click en circulo para cambiar estado</div></div>
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
                    <div style={{textAlign:"center",padding:"60px 20px",color:"#6B7A8A",background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF"}}>
                      <div style={{fontSize:"3rem",marginBottom:12}}>BP</div>
                      <div style={{fontWeight:700,fontSize:"1.1rem",color:"#1E2D4E",marginBottom:8}}>Business Plan no cargado</div>
                      <div style={{fontSize:"0.84rem",marginBottom:24}}>Importa el archivo .xlsm de monitoring para ver todos los KPIs financieros</div>
                      <label style={{background:"#94a3b8",color:"#fff",borderRadius:8,padding:"10px 22px",cursor:"pointer",fontSize:"0.88rem",fontWeight:700}}>
                        Importar Business Plan (.xlsm)
                        <input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}}/>
                      </label>
                    </div>
                  ):(()=>{
                    const d=proj.bp;
                    return (
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                          <div><div style={{fontWeight:800,fontSize:"0.95rem"}}>Business Plan - {proj.name}</div><div style={{fontSize:"0.73rem",color:"#6B7A8A",marginTop:2}}>Actualizado: {fmt(proj.ultimaActualizacion)}</div></div>
                          <label style={{background:"transparent",border:"1px solid rgba(148,163,184,0.4)",color:"#94a3b8",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,display:"inline-flex",alignItems:"center",gap:5}}>
                            Actualizar BP<input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}}/>
                          </label>
                        </div>
                        {d.negocios&&d.negocios.length>0&&(
                          <div style={{background:"rgba(148,163,184,0.08)",border:"1px solid rgba(148,163,184,0.2)",borderRadius:12,padding:"14px 18px",marginBottom:16}}>
                            <div style={{fontSize:"0.72rem",color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Proyecto multi-negocio - {d.negocios.length} lineas de negocio</div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat("+d.negocios.length+",1fr)",gap:10}}>
                              {d.negocios.map((neg,ni)=>(
                                <div key={ni} style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"12px 14px"}}>
                                  <div style={{fontWeight:700,fontSize:"0.88rem",color:"#94a3b8",marginBottom:8}}>{neg.nombre}</div>
                                  {[{l:"Unidades",v:neg.numViviendas||"-"},{l:"Ventas",v:fmtEurM(neg.ventasActual)},{l:"Beneficio",v:fmtEurM(neg.beneficioActual),c:neg.beneficioActual>0?"#4ca99a":"#e05a5a"},{l:"TIR",v:fmtPct(neg.tirActual),c:neg.tirActual>0.15?"#4ca99a":"#ddb96a"},{l:"MgV",v:fmtPct(neg.mgvActual)},{l:"Fondos propios",v:fmtEurM(neg.fondosPropios)},{l:"Comercializacion",v:fmtEurM(neg.comercialActual)}].map(x=>(
                                    <div key={x.l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.78rem",marginBottom:4}}>
                                      <span style={{color:"#6B7A8A"}}>{x.l}</span>
                                      <span style={{fontWeight:600,color:x.c||"#1E2D4E"}}>{x.v}</span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"18px 20px",marginBottom:16}}>
                          <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em"}}>Datos del proyecto</div>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                            {[{l:"Viviendas",v:d.numViviendas||"-"},{l:"Edificabilidad",v:d.edificabilidad?fmtNum(d.edificabilidad)+" m2":"-"},{l:"Duracion obra",v:d.duracionObra?d.duracionObra+" meses":"-"},{l:"Inicio obra",v:fmt(d.fechaInicioObra)},{l:"Licencia",v:fmt(d.fechaLicencia)},{l:"Escritura",v:fmt(d.fechaEntrega)},{l:"Fondos propios",v:fmtEurM(d.fondosPropios)},{l:"Duracion total",v:d.duracionMeses?d.duracionMeses+" meses":"-"}].map(x=>(
                              <div key={x.l}><div style={{fontSize:"0.62rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{x.l}</div><div style={{fontWeight:600,fontSize:"0.9rem"}}>{x.v}</div></div>
                            ))}
                          </div>
                        </div>
                        <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"18px 20px",marginBottom:16}}>
                          <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em"}}>P&amp;L - Base vs Actual</div>
                          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:0,borderRadius:8,overflow:"hidden",border:"1px solid #DDD8CF"}}>
                            {["Concepto","BP Base","BP Actual","Diferencia"].map(h=><div key={h} style={{fontSize:"0.65rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",padding:"8px 12px",background:"#F0EEE9",borderBottom:"1px solid #DDD8CF"}}>{h}</div>)}
                            {[{label:"Ventas (GDV)",prev:d.ventasPrev,actual:d.ventasActual,pos:true},{label:"Compra suelo",prev:d.sueloPrev,actual:d.sueloActual},{label:"Hard Cost (construccion)",prev:d.hardPrev,actual:d.hardActual},{label:"Soft Cost (honorarios)",prev:d.softPrev,actual:d.softActual},{label:"Gastos financieros",prev:d.financieroPrev,actual:d.financieroActual},{label:"Comercializacion",prev:d.comercialPrev,actual:d.comercialActual},{label:"Total gastos",prev:d.totalGastosPrev,actual:d.totalGastosActual,bold:true},{label:"Resultado / Beneficio",prev:d.beneficioPrev,actual:d.beneficioActual,bold:true,pos:true}].map((row,i)=>{
                              const diff=(row.actual||0)-(row.prev||0);
                              const dc=row.pos?(diff>=0?"#4ca99a":"#e05a5a"):(diff<=0?"#4ca99a":"#e05a5a");
                              const bg=row.bold?"#EDE8DF":"transparent";
                              return [
                                <div key={i+"a"} style={{padding:"9px 12px",borderBottom:"1px solid #E8E2D8",fontSize:"0.82rem",fontWeight:row.bold?700:400,background:bg}}>{row.label}</div>,
                                <div key={i+"b"} style={{padding:"9px 12px",borderBottom:"1px solid #E8E2D8",fontSize:"0.82rem",color:"#6B7A8A",background:bg}}>{fmtEurM(row.prev)}</div>,
                                <div key={i+"c"} style={{padding:"9px 12px",borderBottom:"1px solid #E8E2D8",fontSize:"0.82rem",fontWeight:row.bold?700:400,background:bg}}>{fmtEurM(row.actual)}</div>,
                                <div key={i+"d"} style={{padding:"9px 12px",borderBottom:"1px solid #E8E2D8",fontSize:"0.82rem",fontWeight:600,color:diff!==0?dc:"#6B7A8A",background:bg}}>{diff!==0?(diff>0?"+":"")+fmtEurM(diff):"-"}</div>,
                              ];
                            })}
                          </div>
                        </div>
                        {/* ── ALERTAS DE DESVIACIÓN ────────────────────────────────── */}
                        {(()=>{
                          const alertas=[];
                          const diffVentas=(d.ventasActual||0)-(d.ventasPrev||0);
                          const diffSuelo=(d.sueloActual||0)-(d.sueloPrev||0);
                          const diffBfcio=(d.beneficioActual||0)-(d.beneficioPrev||0);
                          const diffSoft=(d.softActual||0)-(d.softPrev||0);
                          if(diffVentas<-100000) alertas.push({tipo:"critico",msg:`Ingresos ${fmtEurM(diffVentas)} vs plan base — precio medio o unidades ajustadas a la baja`});
                          if(diffSuelo>100000) alertas.push({tipo:"aviso",msg:`Suelo +${fmtEurM(diffSuelo)} sobre plan — coste de adquisición superior al previsto`});
                          if(diffSoft>100000) alertas.push({tipo:"aviso",msg:`Soft Cost +${fmtEurM(diffSoft)} — honorarios técnicos o gastos gestión aumentados`});
                          if(diffBfcio<-500000) alertas.push({tipo:"critico",msg:`Beneficio ${fmtEurM(diffBfcio)} vs plan base — margen comprimido un ${Math.abs(diffBfcio/(d.beneficioPrev||1)*100).toFixed(0)}%`});
                          // Alertas de calendario
                          const today=new Date(); const licDate=d.fechaLicencia?new Date(d.fechaLicencia):null;
                          if(licDate){const dias=Math.round((licDate-today)/(1000*60*60*24));if(dias<90&&dias>0) alertas.push({tipo:"aviso",msg:`Licencia prevista en ${dias} días (${fmt(d.fechaLicencia)}) — riesgo de retraso obra`});else if(dias<0) alertas.push({tipo:"critico",msg:`Licencia con ${Math.abs(dias)} días de retraso sobre lo previsto`});}
                          // Alerta umbral bancario
                          const vivs=proj.viviendas||[];
                          const nViv=d.numViviendas||proj.numViviendas||0;
                          const reservadas=vivs.filter(v=>v.estado==="reservada"||v.estado==="vendida").length;
                          const umbral=nViv?Math.ceil(nViv*0.6):0;
                          if(nViv&&reservadas<umbral) alertas.push({tipo:reservadas<umbral*0.7?"critico":"aviso",msg:`Trigger bancario: ${reservadas}/${umbral} unidades comprometidas (60% necesario para préstamo promotor)`});
                          if(alertas.length===0) return null;
                          return (
                            <div style={{marginBottom:16}}>
                              <div style={{fontWeight:700,fontSize:"0.78rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Alertas de desviación</div>
                              {alertas.map((a,ai)=>(
                                <div key={ai} style={{background:a.tipo==="critico"?"rgba(224,90,90,0.08)":"rgba(221,185,106,0.08)",border:`1px solid ${a.tipo==="critico"?"rgba(224,90,90,0.3)":"rgba(221,185,106,0.3)"}`,borderRadius:8,padding:"9px 14px",marginBottom:7,display:"flex",alignItems:"flex-start",gap:8}}>
                                  <span style={{color:a.tipo==="critico"?"#e05a5a":"#ddb96a",fontWeight:700,fontSize:"0.78rem",marginTop:1}}>⚠</span>
                                  <span style={{fontSize:"0.81rem",color:"#1E2D4E"}}>{a.msg}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {/* ── KPIs DE RENTABILIDAD ─────────────────────────────────── */}
                        <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"18px 20px",marginBottom:16}}>
                          <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em"}}>KPIs de rentabilidad</div>
                          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                            <KpiCard label="TIR pretax" val={fmtPct(d.tirActual||d.irr)} prev={fmtPct(d.tirPrev)} color={(d.tirActual||d.irr)>0.15?"#4ca99a":"#ddb96a"}/>
                            <KpiCard label="TIR post-tax" val={fmtPct(d.tirPostActual)} color={d.tirPostActual>0.12?"#4ca99a":"#ddb96a"}/>
                            <KpiCard label="Margen sobre ventas" val={fmtPct(d.mgvActual)} prev={fmtPct(d.mgvPrev)} color={d.mgvActual>0.12?"#4ca99a":"#ddb96a"}/>
                            <KpiCard label="Mom (pretax)" val={d.momActual?d.momActual.toFixed(2)+"x":"-"} color="#c9a86c"/>
                            <KpiCard label="Beneficio total" val={fmtEurM(d.beneficioActual||d.netProfit)} prev={fmtEurM(d.beneficioPrev)} color="#4ca99a"/>
                            <KpiCard label="ROE (Bfcio/FFPP)" val={d.roeActual?d.roeActual.toFixed(2)+"x":"-"} color="#c9a86c"/>
                            <KpiCard label="REI" val={d.reiActual?fmtPct(d.reiActual):"-"} color="#ddb96a"/>
                            <KpiCard label="Fondos propios" val={fmtEurM(d.fondosPropios||d.equityAmount)} color="#ddb96a"/>
                            <KpiCard label="GDV (ventas totales)" val={fmtEurM(d.ventasActual||d.gdv)} color="#1E2D4E"/>
                            <KpiCard label="Total costes" val={fmtEurM(d.totalGastosActual||d.gdc)} color="#1E2D4E"/>
                            <KpiCard label="Hard Cost" val={fmtEurM(d.hardActual)} color="#1E2D4E"/>
                            <KpiCard label="Comercializacion" val={fmtEurM(d.comercialActual)} color="#c9a86c"/>
                          </div>
                        </div>

                        {/* ── ESTADO COMERCIAL BP ──────────────────────────────────── */}
                        {d.viviendas&&d.viviendas.length>0&&(()=>{
                          const vivsBP=d.viviendas||[];
                          const vRes=vivsBP.filter(v=>v.estado==="reservada");
                          const vVend=vivsBP.filter(v=>v.estado==="vendida");
                          const vLib=vivsBP.filter(v=>v.estado==="disponible");
                          const vBlq=vivsBP.filter(v=>v.estado==="no-venta");
                          const vResc=vivsBP.filter(v=>v.estado==="rescindida");
                          const totalVivs=vivsBP.filter(v=>v.tipologia==="Vivienda");
                          const totalParc=vivsBP.filter(v=>v.tipologia!=="Vivienda");
                          const nVivTotal=d.numViviendas||totalVivs.length;
                          const umbral=Math.ceil(nVivTotal*0.6);
                          const comprometidas=vRes.length+vVend.length;
                          const pctComp=nVivTotal?comprometidas/nVivTotal:0;
                          const gdvRes=vRes.reduce((s,v)=>s+(v.precio||0),0);
                          const gdvLib=vLib.reduce((s,v)=>s+(v.precio||0),0);
                          const pmRes=vRes.length?gdvRes/vRes.length:0;
                          const pmLib=vLib.length?gdvLib/vLib.length:0;
                          // Repricing: precio actual vs origen
                          const repricedVivs=vivsBP.filter(v=>v.precioOrigen&&v.precio&&v.precio!==v.precioOrigen);
                          const avgSubida=repricedVivs.length?repricedVivs.reduce((s,v)=>s+(v.precio-v.precioOrigen)/v.precioOrigen,0)/repricedVivs.length:0;
                          return (
                            <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"18px 20px",marginBottom:16}}>
                              <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em"}}>Estado comercial — Lista de precios BP</div>
                              {/* Barra trigger bancario */}
                              <div style={{background:"rgba(76,169,154,0.07)",border:"1px solid rgba(76,169,154,0.2)",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                                  <span style={{fontSize:"0.8rem",fontWeight:700,color:"#1E2D4E"}}>Trigger bancario — 60% comprometidas</span>
                                  <span style={{fontSize:"0.8rem",fontWeight:700,color:pctComp>=0.6?"#4ca99a":"#ddb96a"}}>{comprometidas}/{umbral} unidades · {Math.round(pctComp*100)}%</span>
                                </div>
                                <div style={{background:"#E8E2D8",borderRadius:6,height:8,overflow:"hidden"}}>
                                  <div style={{height:"100%",borderRadius:6,background:pctComp>=0.6?"#4ca99a":"#ddb96a",width:Math.min(pctComp*100,100)+"%",transition:"width 0.4s"}}/>
                                </div>
                                <div style={{fontSize:"0.72rem",color:"#6B7A8A",marginTop:5}}>{pctComp>=0.6?"✓ Umbral alcanzado — financiación bancaria activable":`Faltan ${umbral-comprometidas} unidades para activar el préstamo promotor`}</div>
                              </div>
                              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
                                {[
                                  {l:"Reservadas",v:vRes.length,c:"#ddb96a",gdv:gdvRes,pm:pmRes},
                                  {l:"Vendidas",v:vVend.length,c:"#4ca99a",gdv:vVend.reduce((s,v)=>s+(v.precio||0),0),pm:vVend.length?vVend.reduce((s,v)=>s+(v.precio||0),0)/vVend.length:0},
                                  {l:"Disponibles",v:vLib.length,c:"#c9a86c",gdv:gdvLib,pm:pmLib},
                                  {l:"No venta",v:vBlq.length,c:"#6B7A8A",gdv:0,pm:0},
                                  {l:"Rescisiones",v:vResc.length,c:"#e05a5a",gdv:0,pm:0},
                                ].map(x=>(
                                  <div key={x.l} style={{background:"#F0EEE9",borderRadius:10,padding:"10px 12px",textAlign:"center"}}>
                                    <div style={{fontSize:"0.6rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:700,marginBottom:4}}>{x.l}</div>
                                    <div style={{fontSize:"1.5rem",fontWeight:800,color:x.c,lineHeight:1}}>{x.v}</div>
                                    {x.pm>0&&<div style={{fontSize:"0.66rem",color:"#6B7A8A",marginTop:4}}>{new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(x.pm)} media</div>}
                                  </div>
                                ))}
                              </div>
                              {/* GDV pendiente de venta */}
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                                <div style={{background:"#F0EEE9",borderRadius:10,padding:"12px 16px"}}>
                                  <div style={{fontSize:"0.66rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>GDV comprometido (res+vend)</div>
                                  <div style={{fontSize:"1.1rem",fontWeight:800,color:"#4ca99a"}}>{fmtEurM((vRes.reduce((s,v)=>s+(v.precio||0),0)+vVend.reduce((s,v)=>s+(v.precio||0),0)))}</div>
                                </div>
                                <div style={{background:"#F0EEE9",borderRadius:10,padding:"12px 16px"}}>
                                  <div style={{fontSize:"0.66rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>GDV pendiente (disponibles)</div>
                                  <div style={{fontSize:"1.1rem",fontWeight:800,color:"#c9a86c"}}>{fmtEurM(gdvLib)}</div>
                                </div>
                              </div>
                              {/* Repricing */}
                              {repricedVivs.length>0&&(
                                <div style={{borderTop:"1px solid #E8E2D8",paddingTop:12}}>
                                  <div style={{fontSize:"0.74rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Repricing aplicado</div>
                                  <div style={{display:"flex",gap:20}}>
                                    <div style={{fontSize:"0.81rem"}}><span style={{color:"#6B7A8A"}}>Unidades repriceadas:</span> <strong>{repricedVivs.length}</strong></div>
                                    <div style={{fontSize:"0.81rem"}}><span style={{color:"#6B7A8A"}}>Subida media:</span> <strong style={{color:"#4ca99a"}}>+{(avgSubida*100).toFixed(1)}%</strong></div>
                                  </div>
                                </div>
                              )}
                              {/* Parcelas */}
                              {totalParc.length>0&&(
                                <div style={{borderTop:"1px solid #E8E2D8",paddingTop:12,marginTop:12}}>
                                  <div style={{fontSize:"0.74rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Parcelas ({totalParc.length})</div>
                                  <div style={{display:"flex",gap:20}}>
                                    <div style={{fontSize:"0.81rem"}}><span style={{color:"#6B7A8A"}}>Reservadas:</span> <strong>{totalParc.filter(v=>v.estado==="reservada").length}</strong></div>
                                    <div style={{fontSize:"0.81rem"}}><span style={{color:"#6B7A8A"}}>Disponibles:</span> <strong>{totalParc.filter(v=>v.estado==="disponible").length}</strong></div>
                                    <div style={{fontSize:"0.81rem"}}><span style={{color:"#6B7A8A"}}>Precio medio:</span> <strong>{totalParc.length?new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(totalParc.reduce((s,v)=>s+(v.precio||0),0)/totalParc.length):"-"}</strong></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* ── DESGLOSE €/m² ────────────────────────────────────────── */}
                        {d.edificabilidad>0&&(()=>{
                          const m2=d.edificabilidad;
                          const items=[
                            {l:"Suelo",v:d.sueloActual,c:"#e05a5a"},
                            {l:"Hard Cost (construcción)",v:d.hardActual,c:"#f5924e"},
                            {l:"Soft Cost",v:d.softActual,c:"#ddb96a"},
                            {l:"Comercialización",v:d.comercialActual,c:"#c9a86c"},
                            {l:"Gastos financieros",v:d.financieroActual,c:"#6B7A8A"},
                          ].filter(x=>x.v>0);
                          const total=items.reduce((s,x)=>s+x.v,0);
                          return (
                            <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"18px 20px",marginBottom:16}}>
                              <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em"}}>Estructura de costes — €/m² edificable ({fmtNum(m2)} m²)</div>
                              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 0.6fr",gap:0,borderRadius:8,overflow:"hidden",border:"1px solid #DDD8CF"}}>
                                {["Partida","Total","€/m²","% s/GDV"].map(h=><div key={h} style={{fontSize:"0.62rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",padding:"7px 12px",background:"#F0EEE9",borderBottom:"1px solid #DDD8CF"}}>{h}</div>)}
                                {items.map((x,i)=>[
                                  <div key={i+"a"} style={{padding:"8px 12px",borderBottom:"1px solid #E8E2D8",fontSize:"0.82rem",display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:x.c,flexShrink:0}}/>{x.l}</div>,
                                  <div key={i+"b"} style={{padding:"8px 12px",borderBottom:"1px solid #E8E2D8",fontSize:"0.82rem",fontWeight:600}}>{fmtEurM(x.v)}</div>,
                                  <div key={i+"c"} style={{padding:"8px 12px",borderBottom:"1px solid #E8E2D8",fontSize:"0.82rem",color:"#1E2D4E"}}>{Math.round(x.v/m2).toLocaleString("es-ES")} €</div>,
                                  <div key={i+"d"} style={{padding:"8px 12px",borderBottom:"1px solid #E8E2D8",fontSize:"0.82rem",color:"#6B7A8A"}}>{d.ventasActual?fmtPct(x.v/d.ventasActual):"-"}</div>,
                                ])}
                                {[
                                  <div key="ta" style={{padding:"8px 12px",fontWeight:700,fontSize:"0.82rem",background:"#EDE8DF",display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:"#1E2D4E",flexShrink:0}}/>Total costes</div>,
                                  <div key="tb" style={{padding:"8px 12px",fontWeight:700,fontSize:"0.82rem",background:"#EDE8DF"}}>{fmtEurM(total)}</div>,
                                  <div key="tc" style={{padding:"8px 12px",fontWeight:700,fontSize:"0.82rem",background:"#EDE8DF"}}>{Math.round(total/m2).toLocaleString("es-ES")} €</div>,
                                  <div key="td" style={{padding:"8px 12px",fontWeight:700,fontSize:"0.82rem",background:"#EDE8DF",color:"#6B7A8A"}}>{d.ventasActual?fmtPct(total/d.ventasActual):"-"}</div>,
                                ]}
                              </div>
                              {d.ventasActual&&<div style={{fontSize:"0.75rem",color:"#6B7A8A",marginTop:8}}>GDV: {fmtEurM(d.ventasActual)} · {Math.round(d.ventasActual/m2).toLocaleString("es-ES")} €/m² · Beneficio: {Math.round((d.beneficioActual||0)/m2).toLocaleString("es-ES")} €/m²</div>}
                            </div>
                          );
                        })()}

                        {/* ── CALENDARIO DE HITOS CRÍTICOS ─────────────────────────── */}
                        {(d.fechaLicencia||d.fechaInicioObra||d.fechaEntrega)&&(()=>{
                          const today=new Date();
                          const hitosCalend=[
                            {l:"Licencia de obras",f:d.fechaLicencia,icon:"📋",critico:true},
                            {l:"Inicio de obra",f:d.fechaInicioObra,icon:"🏗",critico:true},
                            {l:"Fin de obra",f:d.duracionObra&&d.fechaInicioObra?new Date(new Date(d.fechaInicioObra).getTime()+d.duracionObra*30.5*24*3600*1000).toISOString().substring(0,10):null,icon:"✅",critico:false},
                            {l:"Escrituras",f:d.fechaEntrega,icon:"📝",critico:true},
                          ].filter(h=>h.f);
                          return (
                            <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"18px 20px",marginBottom:16}}>
                              <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:14,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em"}}>Calendario de hitos críticos</div>
                              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                                {hitosCalend.map((h,hi)=>{
                                  const fd=new Date(h.f);
                                  const dias=Math.round((fd-today)/(1000*60*60*24));
                                  const pasado=dias<0;
                                  const urgente=!pasado&&dias<90;
                                  const clr=pasado?"#6B7A8A":urgente?"#ddb96a":"#4ca99a";
                                  const estado=pasado?"Completado":urgente?`En ${dias} días`:`En ${Math.round(dias/30)} meses`;
                                  return (
                                    <div key={hi} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 14px",background:urgente?"rgba(221,185,106,0.06)":"#F9F7F4",borderRadius:8,border:`1px solid ${urgente?"rgba(221,185,106,0.3)":"#E8E2D8"}`}}>
                                      <div style={{fontSize:"1.2rem",width:28,textAlign:"center"}}>{h.icon}</div>
                                      <div style={{flex:1}}>
                                        <div style={{fontWeight:600,fontSize:"0.83rem"}}>{h.l}</div>
                                        <div style={{fontSize:"0.73rem",color:"#6B7A8A",marginTop:2}}>{fmt(h.f)}</div>
                                      </div>
                                      <div style={{fontWeight:700,fontSize:"0.8rem",color:clr,background:`${clr}18`,borderRadius:6,padding:"3px 10px",whiteSpace:"nowrap"}}>{estado}</div>
                                    </div>
                                  );
                                })}
                              </div>
                              {d.duracionMeses&&<div style={{fontSize:"0.75rem",color:"#6B7A8A",marginTop:10}}>Duración total del proyecto: <strong>{d.duracionMeses} meses</strong></div>}
                            </div>
                          );
                        })()}
                        {/* Desglose Comercial Fees */}
                        {(d.masterBroker||d.structuringFee||d.mktSalesMgmt)&&(
                          <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"16px 20px",marginBottom:14}}>
                            <div style={{fontWeight:700,fontSize:"0.84rem",marginBottom:14,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em"}}>Desglose Comercial Fees</div>

                            {/* Per-negocio breakdown if available */}
                            {d.feesByNegocio&&d.feesByNegocio.length>0?(
                              <div>
                                <div style={{display:"grid",gridTemplateColumns:"repeat("+d.feesByNegocio.length+",1fr)",gap:10,marginBottom:14}}>
                                  {d.feesByNegocio.map((neg,ni)=>(
                                    <div key={ni} style={{background:"#F0EEE9",borderRadius:10,padding:"12px 14px"}}>
                                      <div style={{fontWeight:700,fontSize:"0.82rem",color:"#94a3b8",marginBottom:8}}>{neg.nombre}</div>
                                      {[
                                        {l:"Mktg & Sales",v:neg.mktSalesMgmt,c:"#c9a86c"},
                                        {l:"Master Broker",v:neg.masterBroker,c:"#f5924e"},
                                        {l:"Structuring/Exit",v:neg.structuringFee,c:"#ddb96a"},
                                        {l:"Bank Guarantee",v:neg.bankGuarantee,c:"#6B7A8A"},
                                        {l:"Total",v:neg.comercialTotal,c:"#1E2D4E",bold:true},
                                      ].filter(x=>x.v>0).map(x=>(
                                        <div key={x.l} style={{display:"flex",justifyContent:"space-between",fontSize:"0.75rem",marginBottom:4}}>
                                          <span style={{color:"#6B7A8A"}}>{x.l}</span>
                                          <span style={{fontWeight:x.bold?700:600,color:x.c}}>{fmtEurM(x.v)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                                <div style={{borderTop:"1px solid #DDD8CF",paddingTop:12}}>
                                  <div style={{fontWeight:700,fontSize:"0.78rem",color:"#6B7A8A",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Consolidado</div>
                                  {[
                                    {l:"Marketing & Sales Mgmt.",v:d.mktSalesMgmt,c:"#c9a86c"},
                                    {l:"Master Broker",v:d.masterBroker,c:"#f5924e"},
                                    {l:"Structuring / Exit Fee",v:d.structuringFee,c:"#ddb96a"},
                                    {l:"Total Comercial Fees",v:d.comercialFeesTotal||d.comercialActual,c:"#1E2D4E",bold:true},
                                  ].filter(x=>x.v>0).map(x=>(
                                    <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #E8E2D8"}}>
                                      <span style={{fontSize:"0.8rem",fontWeight:x.bold?700:400}}>{x.l}</span>
                                      <span style={{fontSize:"0.8rem",fontWeight:x.bold?700:600,color:x.c}}>{fmtEurM(x.v)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ):(
                              <div>
                                {[
                                  {l:"Marketing & Sales Mgmt.",v:d.mktSalesMgmt,c:"#c9a86c"},
                                  {l:"Master Broker",v:d.masterBroker,c:"#f5924e"},
                                  {l:"Structuring / Exit Fee",v:d.structuringFee,c:"#ddb96a"},
                                  {l:"Bank Guarantee Fee",v:d.bankGuaranteeFee,c:"#6B7A8A"},
                                  {l:"Total Comercial Fees",v:d.comercialFeesTotal||d.comercialActual,c:"#1E2D4E",bold:true},
                                ].filter(x=>x.v>0).map(x=>(
                                  <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #DDD8CF"}}>
                                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                                      <div style={{width:8,height:8,borderRadius:"50%",background:x.c,flexShrink:0}}/>
                                      <span style={{fontSize:"0.82rem",fontWeight:x.bold?700:400}}>{x.l}</span>
                                    </div>
                                    <span style={{fontSize:"0.82rem",fontWeight:x.bold?700:600,color:x.c}}>{fmtEurM(x.v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ── DESGLOSE B.09 COMERCIALIZACIÓN Y MARKETING ─────────── */}
                        {(d.materialComercial||d.agentesExternos||d.masterBrokerBP)&&(
                          <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"16px 20px",marginBottom:14}}>
                            <div style={{fontWeight:700,fontSize:"0.84rem",marginBottom:4,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em"}}>B.09 · Comercialización y Marketing</div>
                            <div style={{fontSize:"0.73rem",color:"#6B7A8A",marginBottom:12}}>Total: <strong style={{color:"#c9a86c"}}>{fmtEur(d.comercialActual||0)}</strong></div>
                            {[
                              {cod:"B.09-1",l:"Material Comercial",v:d.materialComercial,c:"#c9a86c",mk:true},
                              {cod:"B.09-2",l:"Agentes Externos (Commercial Fees)",v:d.agentesExternos,c:"#f5924e",mk:false},
                              {cod:"B.09-3",l:"Master Broker",v:d.masterBrokerBP,c:"#ddb96a",mk:false},
                            ].filter(x=>x.v>0).map(x=>(
                              <div key={x.cod} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #DDD8CF"}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <span style={{fontSize:"0.7rem",fontWeight:700,color:x.c,background:x.c+"18",borderRadius:4,padding:"2px 6px",letterSpacing:"0.04em"}}>{x.cod}</span>
                                  <span style={{fontSize:"0.81rem"}}>{x.l}</span>
                                  {x.mk&&<span style={{fontSize:"0.68rem",color:"#4ca99a",background:"rgba(76,169,154,0.12)",borderRadius:4,padding:"1px 6px",fontWeight:700}}>→ Marketing</span>}
                                </div>
                                <span style={{fontSize:"0.82rem",fontWeight:600,color:x.c}}>{fmtEurM(x.v)}</span>
                              </div>
                            ))}
                            <div style={{fontSize:"0.71rem",color:"#6B7A8A",marginTop:8}}>Solo <strong>B.09-1</strong> se transfiere como presupuesto de marketing.</div>
                          </div>
                        )}

                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                          <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"16px 18px"}}>
                            <div style={{fontWeight:700,fontSize:"0.84rem",marginBottom:12,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em"}}>Fuentes de financiacion</div>
                            {[{l:"Equity / Fondos propios",v:d.fondosPropios||d.equityAmount,c:"#c9a86c"},{l:"Prestamo promotor",v:d.prestamo,c:"#ddb96a"},{l:"Ingresos compradores",v:d.dineroCO,c:"#4ca99a"}].map(x=>(
                              <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #DDD8CF"}}>
                                <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:x.c,flexShrink:0}}/><span style={{fontSize:"0.82rem"}}>{x.l}</span></div>
                                <span style={{fontSize:"0.82rem",fontWeight:600,color:x.c}}>{fmtEurM(x.v)}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"16px 18px"}}>
                            <div style={{fontWeight:700,fontSize:"0.84rem",marginBottom:12,color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em"}}>Usos (costes)</div>
                            {[{l:"Adquisicion suelo",v:d.sueloActual,c:"#e05a5a"},{l:"Hard Cost (construccion)",v:d.hardActual,c:"#f5924e"},{l:"Soft Cost (honorarios)",v:d.softActual,c:"#ddb96a"},{l:"Comercializacion",v:d.comercialActual,c:"#c9a86c"},{l:"Gastos financieros",v:d.financieroActual,c:"#6B7A8A"}].map(x=>(
                              <div key={x.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #DDD8CF"}}>
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
                    <div><div style={{fontWeight:700,fontSize:"0.92rem"}}>Tabla de viviendas</div><div style={{fontSize:"0.73rem",color:"#6B7A8A",marginTop:2}}>Click en estado para cambiarlo</div></div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                      {activeVivs.length>0&&!proj.master&&<Btn onClick={clearViv} v="danger" sm>Limpiar</Btn>}
                      <label style={{background:"transparent",border:"1px solid rgba(148,163,184,0.4)",color:"#94a3b8",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5}}>
                        Desde BP<input type="file" accept=".xlsx,.xlsm,.xls" onChange={handleBPFile} style={{display:"none"}}/>
                      </label>
                      <label style={{background:"transparent",border:"1px solid #4f8ef7",color:"#c9a86c",borderRadius:8,padding:"4px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",gap:5}}>
                        Lista precios<input type="file" accept=".xlsx,.xls,.csv" onChange={handleVivFile} style={{display:"none"}}/>
                      </label>
                      <Btn onClick={openNewV} sm>+ Anadir</Btn>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
                    {[{l:"Total",v:st.total,c:"#1E2D4E"},{l:"Vendidas",v:st.vendidas,c:"#4ca99a"},{l:"Reservadas",v:st.reservadas,c:"#ddb96a"},{l:"Disponibles",v:st.disponibles,c:"#c9a86c"}].map(x=>(
                      <div key={x.l} style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"10px 14px",textAlign:"center"}}>
                        <div style={{fontSize:"0.62rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>{x.l}</div>
                        <div style={{fontSize:"1.3rem",fontWeight:800,color:x.c}}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                  {activeVivs.length===0?(
                    <div style={{textAlign:"center",padding:"50px 20px",color:"#6B7A8A",background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF"}}>
                      <div style={{fontSize:"2.5rem",marginBottom:10}}>[]</div>
                      <div style={{fontWeight:600,marginBottom:4,color:"#1E2D4E"}}>No hay viviendas cargadas</div>
                      <div style={{fontSize:"0.8rem",marginBottom:20}}>Importa desde el BP o desde una lista de precios Excel</div>
                    </div>
                  ):(
                    <div>
                      <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",overflow:"hidden",marginBottom:12}}>
                        <div style={{display:"grid",gridTemplateColumns:"0.7fr 1fr 1fr 0.7fr 1.2fr 1.1fr 1.4fr 70px",padding:"8px 16px",borderBottom:"1px solid #DDD8CF"}}>
                          {["Ref","Tipologia","Tipo","m2","Precio PVP","Estado","Notas",""].map(h=><div key={h} style={{fontSize:"0.62rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>{h}</div>)}
                        </div>
                        {activeVivs.map((v,i)=>{
                          const vs=VIV_ESTADOS[v.estado]||VIV_ESTADOS.disponible;
                          return (
                            <div key={v.id} style={{display:"grid",gridTemplateColumns:"0.7fr 1fr 1fr 0.7fr 1.2fr 1.1fr 1.4fr 70px",padding:"10px 16px",borderBottom:i<activeVivs.length-1?"1px solid #E8E2D8":"none",alignItems:"center"}}
                              onMouseEnter={e=>e.currentTarget.style.background="#EDE8DF"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                              <div style={{fontWeight:600,fontSize:"0.84rem"}}>{v.ref}</div>
                              <div style={{fontSize:"0.82rem"}}>{v.tipologia||"-"}</div>
                              <div style={{fontSize:"0.78rem",color:"#6B7A8A"}}>{v.planta||"-"}</div>
                              <div style={{fontSize:"0.78rem",color:"#6B7A8A"}}>{v.superficie?v.superficie+"m2":"-"}</div>
                              <div style={{fontSize:"0.88rem",fontWeight:700}}>{fmtEur(v.precio)}</div>
                              <div><span onClick={()=>cycleViv(v.id)} style={{fontSize:"0.67rem",fontWeight:700,padding:"3px 8px",borderRadius:8,background:vs.color+"18",color:vs.color,cursor:"pointer",border:"1px solid "+vs.color+"35",textTransform:"uppercase"}}>{vs.label}</span></div>
                              <div style={{fontSize:"0.72rem",color:"#6B7A8A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={v.notas}>{v.notas||"-"}</div>
                              <div style={{display:"flex",gap:4}}><Btn onClick={()=>openEditV(v)} sm>edit</Btn><Btn onClick={()=>delV(v.id)} v="danger" sm>x</Btn></div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"14px 18px",display:"flex",gap:28,flexWrap:"wrap"}}>
                        {[{l:"Precio medio viviendas",v:fmtEur(st.precioMedio)},{l:"Precio medio parcelas",v:fmtEur(st.precioMedioParcela)},{l:"Ingresos potenciales",v:fmtEur(st.ingresosTotal)},{l:"Ingresos asegurados",v:fmtEur(st.ingresosVR),c:"#4ca99a"}].map(x=>(
                          <div key={x.l}><div style={{fontSize:"0.62rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:4}}>{x.l}</div><div style={{fontWeight:700,color:x.c||"#1E2D4E"}}>{x.v}</div></div>
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
                    <div style={{textAlign:"center",padding:"50px 20px",color:"#6B7A8A",background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF"}}>
                      <div style={{fontSize:"2.5rem",marginBottom:10}}>MK</div>
                      <div style={{fontWeight:700,fontSize:"1rem",color:"#1E2D4E",marginBottom:6}}>Sin planificacion de marketing</div>
                      <div style={{fontSize:"0.8rem",marginBottom:20}}>
                        {proj.bp&&(proj.bp.materialComercial||proj.bp.mktBudget||proj.bp.comercialActual)?(
                          <span>Presupuesto B.09-1 Material Comercial del BP: <strong style={{color:"#4ca99a"}}>{fmtEur(proj.bp.materialComercial||proj.bp.mktBudget||proj.bp.comercialActual)}</strong></span>
                        ):"Importa primero el BP para ver el presupuesto disponible."}
                      </div>
                      <label style={{background:"#c9a86c",color:"#fff",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontSize:"0.85rem",fontWeight:700}}>
                        Importar planificacion de marketing (.xlsx)
                        <input type="file" accept=".xlsx,.xls" onChange={handleMktFile} style={{display:"none"}}/>
                      </label>
                    </div>
                  ):(()=>{
                    const mkt=proj.marketing;
                    const presupuestoBP=(proj.bp&&(proj.bp.materialComercial||proj.bp.mktBudget||proj.bp.comercialActual))||0;
                    const totalPlanificado=mkt.partidas.reduce((a,p)=>a+p.total,0);
                    const pctUsado=presupuestoBP>0?Math.min(100,Math.round(totalPlanificado/presupuestoBP*100)):0;
                    const restante=presupuestoBP-totalPlanificado;
                    const byCat={};
                    mkt.partidas.forEach(p=>{if(!byCat[p.categoria]) byCat[p.categoria]={total:0,items:[]};byCat[p.categoria].total+=p.total;byCat[p.categoria].items.push(p);});
                    return (
                      <div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                          <div><div style={{fontWeight:700,fontSize:"0.95rem"}}>Planificacion de Marketing - {proj.name}</div><div style={{fontSize:"0.73rem",color:"#6B7A8A",marginTop:2}}>{mkt.partidas.length} partidas</div></div>
                          <div style={{display:"flex",gap:8}}>
                            <label style={{background:"transparent",border:"1px solid #4f8ef7",color:"#c9a86c",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:700}}>
                              Actualizar<input type="file" accept=".xlsx,.xls" onChange={handleMktFile} style={{display:"none"}}/>
                            </label>
                            <button onClick={()=>upd(activeId,p=>({...p,marketing:null}))} style={{background:"transparent",border:"1px solid rgba(224,90,90,0.3)",color:"#e05a5a",borderRadius:8,padding:"5px 12px",cursor:"pointer",fontSize:"0.73rem",fontWeight:600,fontFamily:"inherit"}}>Borrar</button>
                          </div>
                        </div>
                        <div style={{background:presupuestoBP>0?"rgba(76,169,154,0.07)":"rgba(201,168,108,0.07)",border:"1px solid "+(presupuestoBP>0?"rgba(76,169,154,0.25)":"rgba(201,168,108,0.2)"),borderRadius:12,padding:"14px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{fontSize:"1.5rem"}}>EUR</div>
                            <div>
                              <div style={{fontSize:"0.7rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:3}}>Presupuesto B.09-1 Material Comercial (BP)</div>
                              <div style={{fontSize:"1.6rem",fontWeight:800,color:presupuestoBP>0?"#4ca99a":"#6B7A8A",letterSpacing:"-0.02em"}}>{presupuestoBP>0?fmtEur(presupuestoBP):"Sin BP cargado"}</div>
                              {presupuestoBP>0&&<div style={{fontSize:"0.75rem",color:"#6B7A8A",marginTop:2}}>Extraido automaticamente del Business Plan</div>}
                            </div>
                          </div>
                          {!presupuestoBP&&<div style={{fontSize:"0.78rem",color:"#c9a86c"}}>Importa el BP para ver el presupuesto</div>}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
                          <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"14px 16px"}}>
                            <div style={{fontSize:"0.62rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>Total planificado</div>
                            <div style={{fontSize:"1.3rem",fontWeight:800,color:"#c9a86c"}}>{fmtEur(totalPlanificado)}</div>
                            <div style={{fontSize:"0.7rem",color:"#6B7A8A",marginTop:2}}>{mkt.partidas.length} partidas</div>
                          </div>
                          <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid "+(restante<0?"rgba(224,90,90,0.3)":"#DDD8CF"),padding:"14px 16px"}}>
                            <div style={{fontSize:"0.62rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>Restante disponible</div>
                            <div style={{fontSize:"1.3rem",fontWeight:800,color:presupuestoBP===0?"#6B7A8A":restante<0?"#e05a5a":"#4ca99a"}}>{presupuestoBP>0?fmtEur(restante):"-"}</div>
                            {presupuestoBP>0&&<div style={{fontSize:"0.7rem",color:restante<0?"#e05a5a":"#6B7A8A",marginTop:2}}>{restante<0?"Excedido":"Disponible"}</div>}
                          </div>
                          <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid "+(pctUsado>100?"rgba(224,90,90,0.3)":pctUsado>80?"rgba(221,185,106,0.3)":"#DDD8CF"),padding:"14px 16px"}}>
                            <div style={{fontSize:"0.62rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:5}}>% del presupuesto usado</div>
                            <div style={{fontSize:"1.3rem",fontWeight:800,color:pctUsado>100?"#e05a5a":pctUsado>80?"#ddb96a":"#4ca99a"}}>{presupuestoBP>0?pctUsado+"%":"-"}</div>
                            {presupuestoBP>0&&<div style={{fontSize:"0.7rem",color:"#6B7A8A",marginTop:2}}>{fmtEur(totalPlanificado)} de {fmtEur(presupuestoBP)}</div>}
                          </div>
                        </div>
                        {presupuestoBP>0&&(
                          <div style={{background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"14px 18px",marginBottom:16}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:"0.78rem",color:"#6B7A8A"}}>Gasto vs presupuesto BP</span><span style={{fontSize:"0.82rem",fontWeight:700,color:pctUsado>100?"#e05a5a":pctUsado>80?"#ddb96a":"#4ca99a"}}>{fmtEur(totalPlanificado)} / {fmtEur(presupuestoBP)}</span></div>
                            <div style={{height:10,background:"#F0EEE9",borderRadius:5,overflow:"hidden"}}><div style={{height:"100%",width:Math.min(pctUsado,100)+"%",background:pctUsado>100?"#e05a5a":pctUsado>80?"#ddb96a":"#c9a86c",borderRadius:5}}/></div>
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
                              <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",overflow:"hidden"}}>
                                <div style={{padding:"12px 18px",borderBottom:"1px solid #DDD8CF",fontWeight:700,fontSize:"0.86rem",display:"flex",justifyContent:"space-between"}}>
                                  <span>Planificacion mensual</span>
                                  <span style={{fontSize:"0.72rem",color:"#6B7A8A",fontWeight:400}}>{mesesSorted.length} meses activos</span>
                                </div>
                                <div style={{overflowX:"auto"}}>
                                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.75rem",minWidth:800}}>
                                    <thead>
                                      <tr style={{background:"#F0EEE9",borderBottom:"2px solid #DDD8CF"}}>
                                        <th style={{textAlign:"left",padding:"8px 14px",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",minWidth:200}}>Accion / Proveedor</th>
                                        <th style={{textAlign:"right",padding:"8px 10px",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",minWidth:90}}>Total</th>
                                        {mesesSorted.map(m=>(
                                          <th key={m.iso} style={{textAlign:"right",padding:"8px 6px",color:"#c9a86c",fontWeight:700,minWidth:70,whiteSpace:"nowrap"}}>{m.label}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(byCat).map(([cat,data],ci)=>{
                                        const catTotal=data.items.reduce((a,it)=>a+(it.total||0),0);
                                        const catByMes={};
                                        data.items.forEach(it=>(it.monthly||[]).forEach(m=>{if(m.amount) catByMes[m.iso]=(catByMes[m.iso]||0)+m.amount;}));
                                        return [
                                          // ── TIPO CAMPAÑA header ── aparece UNA sola vez
                                          <tr key={cat+"_hdr"} style={{background:"rgba(148,163,184,0.12)",borderTop:ci>0?"2px solid #DDD8CF":"none"}}>
                                            <td colSpan={2+mesesSorted.length} style={{padding:"9px 14px"}}>
                                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                                <span style={{fontWeight:700,color:"#94a3b8",fontSize:"0.82rem",textTransform:"uppercase",letterSpacing:"0.05em"}}>{cat}</span>
                                                <span style={{fontWeight:700,color:"#94a3b8",fontSize:"0.82rem"}}>{fmtEur(catTotal)}</span>
                                              </div>
                                            </td>
                                          </tr>,
                                          // ── Fila de totales mensuales del tipo ──
                                          <tr key={cat+"_subtot"} style={{background:"rgba(148,163,184,0.05)",borderBottom:"1px solid #DDD8CF"}}>
                                            <td style={{padding:"5px 14px 5px 20px",fontSize:"0.7rem",color:"#6B7A8A",fontStyle:"italic"}}>{data.items.length} acciones</td>
                                            <td style={{textAlign:"right",padding:"5px 10px",fontWeight:600,color:"#94a3b8",fontSize:"0.75rem"}}>{fmtEur(catTotal)}</td>
                                            {mesesSorted.map(m=>(
                                              <td key={m.iso} style={{textAlign:"right",padding:"5px 6px",color:catByMes[m.iso]?"#94a3b8":"#F0EEE9",fontWeight:600,fontSize:"0.72rem"}}>
                                                {catByMes[m.iso]?fmtEur(catByMes[m.iso]):""}
                                              </td>
                                            ))}
                                          </tr>,
                                          // ── Filas de cada acción ──
                                          ...data.items.map((item,ii)=>{
                                            const byMes={};(item.monthly||[]).forEach(m=>{if(m.amount) byMes[m.iso]=m.amount;});
                                            return (
                                              <tr key={cat+ii} style={{borderBottom:"1px solid #E8E2D8"}}
                                                onMouseEnter={e=>e.currentTarget.style.background="#EDE8DF"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                                <td style={{padding:"7px 14px 7px 26px"}}>
                                                  <div style={{fontWeight:500,fontSize:"0.8rem"}}>{item.accion}</div>
                                                  {item.proveedor&&<div style={{fontSize:"0.68rem",color:"#6B7A8A",marginTop:1}}>{item.proveedor}</div>}
                                                </td>
                                                <td style={{textAlign:"right",padding:"7px 10px",fontWeight:600,color:"#c9a86c",fontSize:"0.8rem",whiteSpace:"nowrap"}}>{fmtEur(item.total)}</td>
                                                {mesesSorted.map(m=>(
                                                  <td key={m.iso} style={{textAlign:"right",padding:"7px 6px",color:byMes[m.iso]?"#4ca99a":"#DDD8CF",fontWeight:byMes[m.iso]?600:400,fontSize:"0.75rem"}}>
                                                    {byMes[m.iso]?fmtEur(byMes[m.iso]):"-"}
                                                  </td>
                                                ))}
                                              </tr>
                                            );
                                          })
                                        ];
                                      })}
                                      <tr style={{background:"#F0EEE9",fontWeight:700,borderTop:"2px solid #4f8ef7"}}>
                                        <td style={{padding:"9px 14px",color:"#1E2D4E",fontSize:"0.82rem"}}>TOTAL GENERAL</td>
                                        <td style={{textAlign:"right",padding:"9px 10px",color:"#c9a86c",fontSize:"0.84rem"}}>{fmtEur(totalPlanificado)}</td>
                                        {mesesSorted.map(m=>{
                                          const tot=mkt.partidas.reduce((a,p)=>a+((p.monthly||[]).find(mm=>mm.iso===m.iso)?((p.monthly||[]).find(mm=>mm.iso===m.iso).amount):0),0);
                                          return <td key={m.iso} style={{textAlign:"right",padding:"9px 6px",color:tot>0?"#ddb96a":"#DDD8CF",fontWeight:700,fontSize:"0.75rem"}}>{tot>0?fmtEur(tot):"-"}</td>;
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
                            <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",overflow:"hidden"}}>
                              <div style={{padding:"12px 18px",borderBottom:"1px solid #DDD8CF",fontWeight:700,fontSize:"0.86rem"}}>Por categoria</div>
                              {Object.entries(byCat).map(([cat,data],ci)=>(
                                <div key={cat} style={{borderBottom:ci<Object.keys(byCat).length-1?"1px solid #E8E2D8":"none"}}>
                                  <div style={{display:"grid",gridTemplateColumns:"1.8fr 0.8fr 1.2fr",padding:"10px 18px",background:"#EDE8DF",alignItems:"center"}}>
                                    <div style={{fontWeight:600,fontSize:"0.84rem"}}>{cat}</div>
                                    <div style={{fontSize:"0.82rem",fontWeight:700,color:"#c9a86c"}}>{fmtEur(data.total)}</div>
                                    <div style={{fontSize:"0.75rem",color:"#6B7A8A"}}>{data.items.length} partidas</div>
                                  </div>
                                  {data.items.map((item,ii)=>(
                                    <div key={ii} style={{display:"grid",gridTemplateColumns:"1.8fr 0.8fr 1.2fr",padding:"7px 18px 7px 32px",borderTop:"1px solid #E8E2D8",alignItems:"center"}}
                                      onMouseEnter={e=>e.currentTarget.style.background="#F0EEE9"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                                      <div>
                                        <div style={{fontSize:"0.8rem"}}>{item.accion}{item.detalle?" - "+item.detalle:""}</div>
                                        {item.proveedor&&<div style={{fontSize:"0.7rem",color:"#6B7A8A",marginTop:1}}>{item.proveedor}</div>}
                                      </div>
                                      <div style={{fontSize:"0.8rem",fontWeight:600}}>{fmtEur(item.total)}</div>
                                      <div style={{fontSize:"0.72rem",color:"#6B7A8A"}}>{item.inicio||item.fin?((!item.inicio||!item.fin)?fmt(item.inicio||item.fin):(fmt(item.inicio)+" - "+fmt(item.fin))):"-"}</div>
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
                const absorcionColor=absorcionPct>60?"#4ca99a":absorcionPct>30?"#ddb96a":"#e05a5a";
                // Fuente de datos: Master Comercial si existe, sino viviendas standalone
                const ingresosCom=m
                  ?m.ventas.filter(v=>v.status==="reservada"||v.status==="vendida").reduce((a,v)=>a+v.precio,0)
                  :st.ingresosVR;
                const comisionTotal=m?m.ventas.reduce((a,v)=>a+(v.comision||0),0):0;
                const rescisiones=m
                  ?m.rescisiones.length
                  :activeVivs.filter(v=>v.estado==="rescindida").length;
                const conRepricing=m
                  ?m.ventas.filter(v=>v.incremento>0)
                  :activeVivs.filter(v=>v.precioOrigen&&v.precio&&v.precio!==v.precioOrigen&&v.precio>v.precioOrigen);
                const incrementoMedio=conRepricing.length
                  ?(m
                    ?Math.round(conRepricing.reduce((a,v)=>a+v.incremento,0)/conRepricing.length)
                    :Math.round(conRepricing.reduce((a,v)=>a+(v.precio-v.precioOrigen),0)/conRepricing.length))
                  :0;
                const incrementoTotal=conRepricing.length
                  ?(m
                    ?conRepricing.reduce((a,v)=>a+v.incremento,0)
                    :conRepricing.reduce((a,v)=>a+(v.precio-v.precioOrigen),0))
                  :0;
                // Agencias: del Master si existe; si no, de las notas de viviendas (campo agencia si existe)
                const agencias={};
                if(m){
                  m.ventas.filter(v=>v.agencia&&(v.status==="reservada"||v.status==="vendida")).forEach(v=>{agencias[v.agencia]=(agencias[v.agencia]||0)+1;});
                } else {
                  activeVivs.filter(v=>(v.estado==="reservada"||v.estado==="vendida")&&v.agencia).forEach(v=>{agencias[v.agencia]=(agencias[v.agencia]||0)+1;});
                }
                const agList=Object.entries(agencias).sort((a,b)=>b[1]-a[1]);
                return (
                  <div>
                    <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:18}}>Metricas comerciales{m?" — Master Comercial":activeVivs.length>0?" — Viviendas importadas":""}</div>

                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}}>
                      {[
                        {label:"Total unidades",val:st.total||0},
                        {label:"Reservadas",val:st.reservadas,color:"#ddb96a"},
                        {label:"Escrituradas/Vendidas",val:st.vendidas,color:"#4ca99a"},
                        {label:"Disponibles",val:st.disponibles,color:"#c9a86c"},
                        {label:"Precio medio VIV",val:fmtEur(st.precioMedio),sub:st.precioMedioParc?"Parcelas: "+fmtEur(st.precioMedioParc):""},
                        {label:"Ingresos comprometidos",val:fmtEur(ingresosCom),color:"#4ca99a"},
                        {label:"Rescisiones",val:rescisiones,color:rescisiones>0?"#e05a5a":"#6B7A8A"},
                        {label:"Incremento medio repricing",val:incrementoMedio>0?fmtEur(incrementoMedio):"-",color:"#ddb96a"},
                        {label:"Incremento total repricing",val:incrementoTotal>0?fmtEur(incrementoTotal):"-",color:"#c9a86c"},
                      ].map(k=>(
                        <div key={k.label} style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"14px 16px"}}>
                          <div style={{fontSize:"0.62rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:6}}>{k.label}</div>
                          <div style={{fontSize:"1.25rem",fontWeight:800,color:k.color||"#1E2D4E"}}>{k.val}</div>
                          {k.sub&&<div style={{fontSize:"0.68rem",color:"#6B7A8A",marginTop:3}}>{k.sub}</div>}
                        </div>
                      ))}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                      <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"16px 20px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
                          <span style={{fontSize:"0.78rem",color:"#6B7A8A",fontWeight:500}}>Absorcion (reservadas + vendidas)</span>
                          <span style={{fontSize:"0.92rem",fontWeight:800,color:absorcionColor}}>{absorcionPct}%</span>
                        </div>
                        <div style={{height:10,background:"#F0EEE9",borderRadius:5,overflow:"hidden",marginBottom:10}}>
                          <div style={{height:"100%",width:absorcionPct+"%",background:absorcionColor,borderRadius:5}}/>
                        </div>
                        <div style={{display:"flex",gap:16,fontSize:"0.75rem",color:"#6B7A8A"}}>
                          <span style={{color:"#ddb96a"}}>{st.reservadas} reservadas</span>
                          <span style={{color:"#4ca99a"}}>{st.vendidas} escrituradas</span>
                          <span style={{color:"#c9a86c"}}>{st.disponibles} disponibles</span>
                        </div>
                      </div>

                      <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"16px 20px"}}>
                        <div style={{fontSize:"0.72rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>Financiero</div>
                        {[
                          {l:"Ingresos potenciales totales",v:fmtEur(st.ingresosTotal)},
                          {l:"Ingresos comprometidos",v:fmtEur(ingresosCom),c:"#4ca99a"},
                          {l:"Comisiones totales",v:fmtEur(comisionTotal),c:"#f5924e"},
                          {l:"Presupuesto proyecto",v:proj.presupuesto||"-"},
                          {l:"Comercializadora",v:proj.comercializadora||"-"},
                          {l:"Entrega prevista",v:fmt(proj.fechaEntrega)},
                        ].map(f=>(
                          <div key={f.l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #E8E2D8",fontSize:"0.8rem"}}>
                            <span style={{color:"#6B7A8A"}}>{f.l}</span>
                            <span style={{fontWeight:600,color:f.c||"#1E2D4E"}}>{f.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {agList.length>0&&(
                      <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"16px 20px"}}>
                        <div style={{fontSize:"0.72rem",color:"#6B7A8A",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>Ventas por agencia</div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                          {agList.map(([ag,n])=>{
                            const pctAg=st.reservadas+st.vendidas>0?Math.round(n/(st.reservadas+st.vendidas)*100):0;
                            return (
                              <div key={ag} style={{background:"#F0EEE9",borderRadius:8,padding:"10px 12px"}}>
                                <div style={{fontSize:"0.78rem",fontWeight:600,marginBottom:4}}>{ag||"Directa"}</div>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                  <span style={{fontSize:"1rem",fontWeight:800,color:"#c9a86c"}}>{n}</span>
                                  <span style={{fontSize:"0.72rem",color:"#6B7A8A"}}>{pctAg}%</span>
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

              {tab==="cronograma"&&<CronogramaTab proj={proj} activeId={activeId} upd={upd}/>}
              {tab==="posventa"&&<PosventaTab proj={proj} activeId={activeId} upd={upd} fmt={fmt}/>}

              {tab==="equipo"&&(
                <div>
                  <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:18}}>Estructura de equipo - {proj.name}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
                    {[{rol:"Project Owner (Overview)",persona:proj.projectOwner,desc:"Responsable global. Coordinacion transversal, decisiones clave.",color:"#c9a86c"},{rol:"PM Tecnico (BSA)",persona:proj.pmTecnico,desc:"Proyecto, obra, licencias. Exclusivamente tecnico.",color:"#4ca99a"},{rol:"Responsable Comercial",persona:proj.responsableComercial,desc:"Pricing, estrategia, posicionamiento, direccion comercializadora.",color:"#ddb96a"},{rol:"Comercializadora",persona:proj.comercializadora||"Sin asignar",desc:"Ejecucion ventas, atencion leads, reporte semanal.",color:"#f5924e"}].map(r=>(
                      <div key={r.rol} style={{background:"#FFFFFF",borderRadius:12,border:"1px solid "+r.color+"20",padding:"17px 19px"}}>
                        <div style={{fontSize:"0.62rem",color:r.color,textTransform:"uppercase",letterSpacing:"0.09em",fontWeight:700,marginBottom:7}}>{r.rol}</div>
                        <div style={{fontWeight:700,fontSize:"0.98rem",marginBottom:7}}>{r.persona||"-"}</div>
                        <div style={{fontSize:"0.74rem",color:"#6B7A8A",lineHeight:1.55}}>{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab==="blockers"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontWeight:700,fontSize:"0.92rem"}}>Alertas y bloqueos</div><Btn onClick={openNewB} sm>+ Anadir</Btn></div>
                  {proj.blockers.length===0&&(
                    <div style={{padding:"18px",color:"#4ca99a",fontSize:"0.86rem",background:"rgba(76,169,154,0.05)",borderRadius:12,border:"1px solid rgba(76,169,154,0.2)"}}>Sin bloqueos activos</div>
                  )}
                  {proj.blockers.map((b,i)=>{
                    const bs=BLOCK_ST[b.tipo]||BLOCK_ST.info;
                    return (
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:13,background:bs.bg,borderRadius:12,border:"1px solid "+bs.border,padding:"15px 18px",marginBottom:9}}>
                        <div style={{fontSize:"1.15rem",flexShrink:0,marginTop:2}}>{bs.icon}</div>
                        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:"0.88rem",marginBottom:4}}>{b.titulo}</div><div style={{fontSize:"0.77rem",color:"#6B7A8A",marginBottom:5}}>{b.desc}</div><div style={{fontSize:"0.71rem",color:"#6B7A8A"}}>Responsable: <span style={{color:"#1E2D4E"}}>{b.responsable}</span></div></div>
                        <div style={{display:"flex",gap:5}}><Btn onClick={()=>openEditB(b,i)} sm>edit</Btn><Btn onClick={()=>delB(i)} v="danger" sm>x</Btn></div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab==="seguimiento"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:"0.92rem"}}>Seguimiento del proyecto</div>
                      <div style={{fontSize:"0.74rem",color:"#6B7A8A",marginTop:2}}>Checklist de control extraído de la ficha de seguimiento — {seguimientoItems.filter(t=>t.done).length}/{seguimientoItems.length} completados</div>
                    </div>
                  </div>
                  {(()=>{
                    const areas=[...new Set(seguimientoItems.map(t=>{const m=t.texto.match(/^\[([^\]]+)\]/);return m?m[1]:"OTROS";}))];
                    return areas.map(area=>{
                      const items=seguimientoItems.filter(t=>{const m=t.texto.match(/^\[([^\]]+)\]/);return (m?m[1]:"OTROS")===area;});
                      const done=items.filter(t=>t.done).length;
                      const pctA=Math.round(done/items.length*100);
                      const areaColors={"GOBIERNO":"#7c5cfc","LEGAL":"#c9a86c","URBANISMO":"#4ca99a","TÉCNICA":"#e05a5a","FINANCIERA":"#1E2D4E","FINANCIACIÓN":"#ddb96a","COMERCIAL":"#4ca99a"};
                      const aColor=areaColors[area]||"#6B7A8A";
                      return (
                        <div key={area} style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",marginBottom:12,overflow:"hidden"}}>
                          <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderBottom:"1px solid #DDD8CF",background:"rgba(240,238,233,0.5)"}}>
                            <div style={{width:3,height:20,borderRadius:2,background:aColor,flexShrink:0}}/>
                            <div style={{fontWeight:700,fontSize:"0.83rem",flex:1}}>{area}</div>
                            <div style={{fontSize:"0.72rem",color:"#6B7A8A",marginRight:8}}>{done}/{items.length}</div>
                            <div style={{width:80,height:4,background:"#DDD8CF",borderRadius:2,overflow:"hidden"}}>
                              <div style={{height:"100%",width:pctA+"%",background:pctA===100?"#4ca99a":aColor,borderRadius:2,transition:"width 0.3s"}}/>
                            </div>
                            <div style={{fontSize:"0.7rem",fontWeight:700,color:pctA===100?"#4ca99a":aColor,minWidth:32,textAlign:"right"}}>{pctA}%</div>
                          </div>
                          {items.map(t=>{
                            const label=t.texto.replace(/^\[[^\]]+\]\s*/,"");
                            return (
                              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 16px",borderBottom:"1px solid #F0EEE9"}}>
                                <div onClick={()=>togT(t.id)} style={{width:16,height:16,borderRadius:4,border:"2px solid "+(t.done?"#4ca99a":"#DDD8CF"),background:t.done?"#4ca99a":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.58rem",color:"#F7F6F3",fontWeight:900,flexShrink:0}}>{t.done?"✓":""}</div>
                                <div style={{flex:1,fontSize:"0.81rem",textDecoration:t.done?"line-through":"none",color:t.done?"#6B7A8A":"#1E2D4E"}}>{label}</div>
                                <div style={{width:8,height:8,borderRadius:"50%",background:PRIO_CLR[t.prioridad]||"#ddb96a",flexShrink:0}}/>
                              </div>
                            );
                          })}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {tab==="tareas"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontWeight:700,fontSize:"0.92rem"}}>Tareas</div><Btn onClick={openNewT} sm>+ Nueva</Btn></div>
                  {tareasLibres.length===0&&<div style={{color:"#6B7A8A",fontSize:"0.84rem",padding:"16px 0"}}>No hay tareas aún. Usa "+ Nueva" para añadir.</div>}
                  {tareasLibres.map(t=>(
                    <div key={t.id} style={{display:"flex",alignItems:"center",gap:11,background:"#FFFFFF",borderRadius:10,border:"1px solid #DDD8CF",padding:"11px 15px",marginBottom:7}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:PRIO_CLR[t.prioridad]||"#ddb96a",flexShrink:0}}/>
                      <div onClick={()=>togT(t.id)} style={{width:17,height:17,borderRadius:5,border:"2px solid "+(t.done?"#4ca99a":"#DDD8CF"),background:t.done?"#4ca99a":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.62rem",color:"#F7F6F3",fontWeight:900,flexShrink:0}}>{t.done?"✓":""}</div>
                      <div style={{flex:1,fontSize:"0.83rem",textDecoration:t.done?"line-through":"none",color:t.done?"#6B7A8A":"#1E2D4E"}}>{t.texto}</div>
                      <div style={{fontSize:"0.71rem",padding:"2px 7px",borderRadius:8,background:"#F0EEE9",border:"1px solid #DDD8CF",color:"#6B7A8A",whiteSpace:"nowrap"}}>{t.responsable||"Sin asignar"}</div>
                      <div style={{fontSize:"0.71rem",color:"#6B7A8A",whiteSpace:"nowrap"}}>{fmt(t.vencimiento)}</div>
                      <div style={{display:"flex",gap:5}}><Btn onClick={()=>openEditT(t)} sm>edit</Btn><Btn onClick={()=>delT(t.id)} v="danger" sm>x</Btn></div>
                    </div>
                  ))}
                </div>
              )}

              {tab==="reporte"&&(
                <div>
                  <div style={{fontWeight:700,fontSize:"0.92rem",marginBottom:4}}>Reporte semanal - {proj.name}</div>
                  <div style={{fontSize:"0.77rem",color:"#ddb96a",marginBottom:18,padding:"8px 12px",background:"rgba(221,185,106,0.06)",borderRadius:8,border:"1px solid rgba(221,185,106,0.2)"}}>Debe completarse por el Project Owner antes de cada reunion semanal</div>
                  <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"18px",marginBottom:14}}>
                    <div style={{fontSize:"0.7rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:9}}>Resumen ejecutivo de la semana</div>
                    <textarea value={resumenLocal} onChange={e=>setResumenLocal(e.target.value)} placeholder="Que ha pasado esta semana? Avances, problemas, decisiones tomadas." style={{...CSS.inp,minHeight:100,resize:"vertical",lineHeight:1.6}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                      <div style={{fontSize:"0.7rem",color:"#6B7A8A"}}>Guardado: {proj.ultimaActualizacion?fmt(proj.ultimaActualizacion):"-"}</div>
                      <Btn onClick={saveResumen} v="primary" sm>Guardar resumen</Btn>
                    </div>
                  </div>
                  <div style={{background:"#FFFFFF",borderRadius:12,border:"1px solid #DDD8CF",padding:"18px"}}>
                    <div style={{fontWeight:700,fontSize:"0.86rem",marginBottom:13}}>Checklist</div>
                    {[{label:"BP cargado",ok:!!proj.bp},{label:"Marketing planificado",ok:!!proj.marketing},{label:"Viviendas cargadas",ok:st.total>0},{label:"Hitos actualizados",ok:proj.hitos.some(h=>h.estado!=="pendiente")},{label:"Resumen guardado (min 20 chars)",ok:(proj.resumenSemanal||"").length>20},{label:"Tareas asignadas",ok:proj.tareas.length>0&&proj.tareas.every(t=>t.responsable)}].map((item,i,arr)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<arr.length-1?"1px solid #DDD8CF":"none"}}>
                        <div style={{width:20,height:20,borderRadius:6,background:item.ok?"rgba(76,169,154,0.12)":"rgba(224,90,90,0.08)",border:"1px solid "+(item.ok?"#4ca99a":"#e05a5a"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.68rem",color:item.ok?"#4ca99a":"#e05a5a",flexShrink:0}}>{item.ok?"v":"x"}</div>
                        <div style={{fontSize:"0.83rem",color:item.ok?"#1E2D4E":"#6B7A8A"}}>{item.label}</div>
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
          <div style={{fontSize:"0.84rem",color:"#6B7A8A",marginBottom:18}}>Se importaran los siguientes datos a la promocion <strong style={{color:"#1E2D4E"}}>{proj&&proj.name}</strong>:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
            {[{l:"Viviendas",v:bpPreview.numViviendas},{l:"Localidad",v:bpPreview.localidad},{l:"GDV (ventas totales)",v:fmtEurM(bpPreview.ventasActual)},{l:"Total gastos",v:fmtEurM(bpPreview.totalGastosActual)},{l:"Beneficio estimado",v:fmtEurM(bpPreview.beneficioActual)},{l:"TIR (pretax)",v:fmtPct(bpPreview.tirActual)},{l:"Margen s/ventas",v:fmtPct(bpPreview.mgvActual)},{l:"Fecha escritura",v:fmt(bpPreview.fechaEntrega)},{l:"Viviendas Lista Precios",v:((bpPreview.viviendas&&bpPreview.viviendas.length)||0)+" unidades"},{l:"Fondos propios",v:fmtEurM(bpPreview.fondosPropios)}].map(x=>(
              <div key={x.l} style={{background:"#F0EEE9",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:"0.65rem",color:"#6B7A8A",textTransform:"uppercase",letterSpacing:"0.07em",fontWeight:700,marginBottom:3}}>{x.l}</div>
                <div style={{fontWeight:600,fontSize:"0.88rem"}}>{x.v||"-"}</div>
              </div>
            ))}
          </div>
          {bpPreview.viviendas&&bpPreview.viviendas.length>0&&(
            <div style={{background:"rgba(76,169,154,0.06)",border:"1px solid rgba(76,169,154,0.2)",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:"0.8rem",color:"#4ca99a"}}>
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
