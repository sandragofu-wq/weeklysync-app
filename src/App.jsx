import { useState } from "react";

const PROJECTS = [
  {
    id: 1, name: "OVERVIEW", status: "on-track", statusLabel: "En marcha",
    progress: 68, tag: "DEV", deadline: "15 Jun", owner: "Carlos M.", budget: "€42K / €60K",
    phases: [
      { name: "Discovery", done: true }, { name: "Diseño UI", done: true },
      { name: "Backend", done: true }, { name: "Frontend", done: false, active: true },
      { name: "QA", done: false }, { name: "Launch", done: false },
    ],
    blockers: [
      { type: "warn", icon: "⚠️", title: "API de pagos pendiente de certificación", desc: "PCI DSS requiere 2-3 semanas adicionales. Bloquea el módulo de checkout.", owner: "Carlos M." },
      { type: "info", icon: "ℹ️", title: "Assets de diseño sin entregar (8 pantallas)", desc: "Flows de onboarding pendientes. Objetivo: viernes.", owner: "Ana G." },
    ],
    tasks: [
      { id: 1, text: "Revisar PR #142 — autenticación biométrica", done: false, assignee: "Carlos M.", due: "05 Jun", priority: "#f05a5a" },
      { id: 2, text: "Corregir crash en iOS 16 — pantalla perfil", done: false, assignee: "Lucía F.", due: "03 Jun", priority: "#f05a5a" },
      { id: 3, text: "Integrar analytics SDK", done: true, assignee: "David R.", due: "30 May", priority: "#f5c842" },
      { id: 4, text: "Tests módulo notificaciones", done: false, assignee: "Carlos M.", due: "07 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 2, name: "MEDHILLS", status: "at-risk", statusLabel: "En riesgo",
    progress: 41, tag: "DESIGN", deadline: "28 May", owner: "Ana García", budget: "€18K / €20K",
    phases: [
      { name: "Auditoría", done: true }, { name: "Wireframes", done: true },
      { name: "Prototipos", done: false, active: true }, { name: "Desarrollo", done: false },
      { name: "Go-Live", done: false },
    ],
    blockers: [
      { type: "critical", icon: "🔴", title: "Deadline en riesgo — retraso 9 días", desc: "El proveedor CMS retrasó la migración. Decidir si extendemos o recortamos alcance.", owner: "Ana G." },
    ],
    tasks: [
      { id: 5, text: "Aprobar prototipo homepage con cliente", done: false, assignee: "Ana García", due: "28 May", priority: "#f05a5a" },
      { id: 6, text: "Componentes formularios Figma → código", done: false, assignee: "Sara P.", due: "01 Jun", priority: "#f5c842" },
      { id: 7, text: "Optimizar imágenes WebP mobile", done: true, assignee: "David R.", due: "25 May", priority: "#22d3a0" },
    ],
  },
  {
    id: 3, name: "MERAL", status: "on-track", statusLabel: "En marcha",
    progress: 85, tag: "DATA", deadline: "10 Jun", owner: "David R.", budget: "€28K / €30K",
    phases: [
      { name: "ETL Pipeline", done: true }, { name: "Data Model", done: true },
      { name: "Visualizaciones", done: true }, { name: "UAT", done: false, active: true },
      { name: "Producción", done: false },
    ],
    blockers: [
      { type: "info", icon: "ℹ️", title: "Datasets Q4 2024 pendientes de limpieza", desc: "3 datasets deben validarse antes del UAT final.", owner: "David R." },
    ],
    tasks: [
      { id: 8, text: "UAT con stakeholders comerciales", done: false, assignee: "David R.", due: "03 Jun", priority: "#f5c842" },
      { id: 9, text: "Documentar queries SQL críticas", done: false, assignee: "Lucía F.", due: "05 Jun", priority: "#22d3a0" },
      { id: 10, text: "Performance test — 10k usuarios", done: true, assignee: "Carlos M.", due: "29 May", priority: "#f5c842" },
    ],
  },
  {
    id: 4, name: "ATABAL", status: "blocked", statusLabel: "Bloqueado",
    progress: 22, tag: "INFRA", deadline: "31 Jul", owner: "Carlos M.", budget: "€75K / €80K",
    phases: [
      { name: "Inventario", done: true }, { name: "Arquitectura", done: true },
      { name: "Piloto", done: false, active: true }, { name: "Migración", done: false },
      { name: "Cutover", done: false },
    ],
    blockers: [
      { type: "critical", icon: "🔴", title: "Aprobación de Seguridad pendiente — 3 semanas", desc: "Sin sign-off del CISO no podemos avanzar en producción. URGENTE.", owner: "Carlos M." },
      { type: "critical", icon: "🔴", title: "Contrato Azure sin firmar", desc: "Procurement lleva 2 semanas sin respuesta. Bloquea el aprovisionamiento.", owner: "Sara P." },
    ],
    tasks: [
      { id: 11, text: "Escalada al CISO — reunión urgente", done: false, assignee: "Carlos M.", due: "27 May", priority: "#f05a5a" },
      { id: 12, text: "Seguimiento Procurement contrato Azure", done: false, assignee: "Sara P.", due: "27 May", priority: "#f05a5a" },
      { id: 13, text: "Diagrama arquitectura v2", done: false, assignee: "David R.", due: "02 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 5, name: "ALMAYATE", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 14, text: "Entrevistas con equipo de ventas", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
      { id: 15, text: "Mapa de integración con ERP actual", done: false, assignee: "Ana García", due: "14 Jun", priority: "#22d3a0" },
    ],
  },
  {
    id: 6, name: "ELVIRIA-MARLOW", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 16, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 7, name: "PLAZA DEL MAR", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 17, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 8, name: "ALTOS DE LOS MONTEROS", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 18, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 9, name: "LOMAS DEL TENIS", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 19, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 10, name: "SAN ROQUE", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 20, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 11, name: "PINTOR LOSADA - SANTUTXU TERRAZAS", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 21, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 12, name: "ISASI - MOZART PLAZA", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 22, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 13, name: "MONCADA", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 23, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 14, name: "FUENTEOVEJUNA", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 24, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 15, name: "SALAMANCA - OASIS VISTAHERMOSA", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 25, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 16, name: "COTILLO ARENA", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 26, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 17, name: "COTILLO OASIS", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 27, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
  {
    id: 18, name: "BOTÁNICO", status: "planning", statusLabel: "Planificación",
    progress: 8, tag: "CRM", deadline: "15 Sep", owner: "Sara P.", budget: "€12K / €35K",
    phases: [
      { name: "Kickoff", done: true }, { name: "Req. Analysis", done: false, active: true },
      { name: "Diseño", done: false }, { name: "Desarrollo", done: false },
      { name: "Testing", done: false }, { name: "Go-Live", done: false },
    ],
    blockers: [],
    tasks: [
      { id: 28, text: "Pendiente", done: false, assignee: "Sara P.", due: "10 Jun", priority: "#f5c842" },
    ],
  },
];

const STATUS_STYLES = {
  "on-track": { bg: "rgba(34,211,160,0.12)", color: "#22d3a0", dot: "#22d3a0" },
  "at-risk":  { bg: "rgba(245,200,66,0.12)",  color: "#f5c842", dot: "#f5c842" },
  "blocked":  { bg: "rgba(240,90,90,0.12)",   color: "#f05a5a", dot: "#f05a5a" },
  "planning": { bg: "rgba(79,142,247,0.12)",  color: "#4f8ef7", dot: "#4f8ef7" },
};

const BLOCKER_COLORS = {
  critical: { bg: "rgba(240,90,90,0.12)", border: "rgba(240,90,90,0.3)" },
  warn:     { bg: "rgba(245,200,66,0.12)", border: "rgba(245,200,66,0.3)" },
  info:     { bg: "rgba(79,142,247,0.12)",  border: "rgba(79,142,247,0.3)" },
};

export default function WeeklySync() {
  const [projects, setProjects] = useState(PROJECTS);
  const [activeId, setActiveId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ text: "", assignee: "Carlos M.", priority: "medium", due: "" });

  const project = projects.find(p => p.id === activeId);

  const toggleTask = (taskId) => {
    setProjects(prev => prev.map(p =>
      p.id !== activeId ? p : {
        ...p,
        tasks: p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
      }
    ));
  };

  const addTask = () => {
    if (!newTask.text.trim() || !activeId) return;
    const color = newTask.priority === "high" ? "#f05a5a" : newTask.priority === "medium" ? "#f5c842" : "#22d3a0";
    setProjects(prev => prev.map(p =>
      p.id !== activeId ? p : {
        ...p,
        tasks: [...p.tasks, { id: Date.now(), text: newTask.text, done: false, assignee: newTask.assignee, due: newTask.due || "—", priority: color }]
      }
    ));
    setNewTask({ text: "", assignee: "Carlos M.", priority: "medium", due: "" });
    setShowModal(false);
  };

  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#0d0f14", color: "#e8eaf2", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #252a3a", background: "#141720", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
          Weekly<span style={{ color: "#4f8ef7" }}>Sync</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,211,160,0.1)", border: "1px solid rgba(34,211,160,0.3)", color: "#22d3a0", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20 }}>
            <div style={{ width: 6, height: 6, background: "#22d3a0", borderRadius: "50%" }} />
            En vivo
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6b7394", textTransform: "capitalize" }}>{today}</div>
          {activeId && (
            <button onClick={() => setShowModal(true)} style={{ background: "#4f8ef7", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
              + Nueva Tarea
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: 240, background: "#141720", borderRight: "1px solid #252a3a", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ margin: "16px 14px", padding: "14px", background: "#1c2030", borderRadius: 12, border: "1px solid #252a3a" }}>
            {[
              { label: "Proyectos", val: projects.length, color: "#4f8ef7" },
              { label: "Bloqueados", val: projects.filter(p => p.status === "blocked").length, color: "#f05a5a" },
              { label: "Tareas pendientes", val: projects.flatMap(p => p.tasks).filter(t => !t.done).length, color: "#f5c842" },
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "0.76rem", color: "#6b7394" }}>{s.label}</span>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, color: s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "0 14px 8px", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7394" }}>Proyectos</div>
          {projects.map(p => {
            const s = STATUS_STYLES[p.status];
            return (
              <div key={p.id} onClick={() => setActiveId(p.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderLeft: `3px solid ${activeId === p.id ? "#4f8ef7" : "transparent"}`, background: activeId === p.id ? "rgba(79,142,247,0.07)" : "transparent" }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: "0.84rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: "0.63rem", fontWeight: 700, padding: "2px 6px", borderRadius: 8, background: s.bg, color: s.color, textTransform: "uppercase", whiteSpace: "nowrap" }}>{p.statusLabel}</div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", background: "#0d0f14" }}>
          {!project ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#6b7394", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>👈</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e8eaf2", marginBottom: 6 }}>Selecciona un proyecto</div>
              <div style={{ fontSize: "0.85rem" }}>Elige un proyecto de la izquierda para ver su estado</div>
            </div>
          ) : (() => {
            const s = STATUS_STYLES[project.status];
            const doneTasks = project.tasks.filter(t => t.done).length;
            return (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>{project.name}</h1>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, padding: "3px 9px", borderRadius: 8, background: s.bg, color: s.color, textTransform: "uppercase" }}>{project.statusLabel}</div>
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, padding: "3px 9px", borderRadius: 8, background: "rgba(124,92,252,0.12)", color: "#7c5cfc", textTransform: "uppercase" }}>{project.tag}</div>
                  </div>
                  <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                    {[`📅 ${project.deadline}`, `👤 ${project.owner}`, `💶 ${project.budget}`].map(m => (
                      <span key={m} style={{ fontSize: "0.8rem", color: "#6b7394" }}>{m}</span>
                    ))}
                  </div>
                </div>

                <div style={{ background: "#141720", borderRadius: 12, border: "1px solid #252a3a", padding: "18px 20px", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: "0.78rem", color: "#6b7394", fontWeight: 500 }}>Progreso general</span>
                    <span style={{ fontWeight: 800, fontSize: "1rem", color: s.color }}>{project.progress}%</span>
                  </div>
                  <div style={{ height: 7, background: "#1c2030", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${project.progress}%`, background: s.color, borderRadius: 4 }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                    {project.phases.map(ph => (
                      <div key={ph.name} style={{ fontSize: "0.73rem", padding: "3px 9px", borderRadius: 6, fontWeight: 500, background: ph.done ? "rgba(34,211,160,0.1)" : ph.active ? "rgba(79,142,247,0.1)" : "transparent", border: `1px solid ${ph.done ? "rgba(34,211,160,0.3)" : ph.active ? "rgba(79,142,247,0.3)" : "#252a3a"}`, color: ph.done ? "#22d3a0" : ph.active ? "#4f8ef7" : "#6b7394" }}>
                        {ph.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Tareas", val: project.tasks.length, sub: `${doneTasks} completadas` },
                    { label: "Bloqueos", val: project.blockers.length, sub: project.blockers.length === 0 ? "Todo despejado" : "Requieren atención", col: project.blockers.length > 0 ? "#f05a5a" : "#22d3a0" },
                    { label: "Completadas", val: `${doneTasks}/${project.tasks.length}`, sub: `${Math.round(doneTasks / Math.max(project.tasks.length, 1) * 100)}%` },
                  ].map(c => (
                    <div key={c.label} style={{ background: "#141720", borderRadius: 12, border: "1px solid #252a3a", padding: "16px" }}>
                      <div style={{ fontSize: "0.7rem", color: "#6b7394", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, fontWeight: 600 }}>{c.label}</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c.col || "#e8eaf2" }}>{c.val}</div>
                      <div style={{ fontSize: "0.75rem", color: "#6b7394", marginTop: 2 }}>{c.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#141720", borderRadius: 12, border: "1px solid #252a3a", marginBottom: 16, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #252a3a" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>🚧 Bloqueos & Riesgos</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7394" }}>{project.blockers.length} activo{project.blockers.length !== 1 ? "s" : ""}</div>
                  </div>
                  {project.blockers.length === 0 ? (
                    <div style={{ padding: "16px 18px", color: "#22d3a0", fontSize: "0.84rem" }}>✅ Sin bloqueos activos — ¡buen trabajo!</div>
                  ) : project.blockers.map((b, i) => {
                    const bc = BLOCKER_COLORS[b.type];
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 18px", borderBottom: i < project.blockers.length - 1 ? "1px solid #252a3a" : "none" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: bc.bg, border: `1px solid ${bc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>{b.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.84rem", fontWeight: 600, marginBottom: 3 }}>{b.title}</div>
                          <div style={{ fontSize: "0.77rem", color: "#6b7394" }}>{b.desc}</div>
                        </div>
                        <div style={{ fontSize: "0.72rem", padding: "3px 8px", borderRadius: 8, border: "1px solid #252a3a", color: "#6b7394", whiteSpace: "nowrap", alignSelf: "center" }}>{b.owner}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: "#141720", borderRadius: 12, border: "1px solid #252a3a", overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #252a3a" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem" }}>✅ Tareas</div>
                    <button onClick={() => setShowModal(true)} style={{ background: "transparent", border: "1px solid #252a3a", color: "#6b7394", borderRadius: 7, padding: "4px 12px", fontSize: "0.78rem", cursor: "pointer", fontWeight: 500 }}>+ Añadir</button>
                  </div>
                  {project.tasks.map((t, i) => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: i < project.tasks.length - 1 ? "1px solid #252a3a" : "none" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: t.priority, flexShrink: 0 }} />
                      <div onClick={() => toggleTask(t.id)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${t.done ? "#22d3a0" : "#252a3a"}`, background: t.done ? "#22d3a0" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "#0d0f14", fontWeight: 800, flexShrink: 0 }}>
                        {t.done ? "✓" : ""}
                      </div>
                      <div style={{ flex: 1, fontSize: "0.84rem", textDecoration: t.done ? "line-through" : "none", color: t.done ? "#6b7394" : "#e8eaf2" }}>{t.text}</div>
                      <div style={{ fontSize: "0.73rem", padding: "2px 8px", borderRadius: 8, background: "#1c2030", border: "1px solid #252a3a", color: "#6b7394", whiteSpace: "nowrap" }}>{t.assignee}</div>
                      <div style={{ fontSize: "0.73rem", color: "#6b7394", whiteSpace: "nowrap" }}>{t.due}</div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {showModal && (
        <div onClick={(e) => e.target === e.currentTarget && setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#141720", border: "1px solid #252a3a", borderRadius: 16, padding: 28, width: 440, maxWidth: "95vw" }}>
            <div style={{ fontWeight: 800, fontSize: "1.05rem", marginBottom: 20 }}>+ Nueva Tarea</div>
            {[
              { label: "Descripción", el: <input value={newTask.text} onChange={e => setNewTask(p => ({ ...p, text: e.target.value }))} placeholder="¿Qué hay que hacer?" style={{ width: "100%", background: "#1c2030", border: "1px solid #252a3a", borderRadius: 8, padding: "8px 11px", color: "#e8eaf2", fontFamily: "inherit", fontSize: "0.84rem", outline: "none", boxSizing: "border-box" }} /> },
              { label: "Asignar a", el: <select value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))} style={{ width: "100%", background: "#1c2030", border: "1px solid #252a3a", borderRadius: 8, padding: "8px 11px", color: "#e8eaf2", fontFamily: "inherit", fontSize: "0.84rem", outline: "none" }}>
                {["Carlos M.", "Ana García", "Lucía F.", "David R.", "Sara P."].map(n => <option key={n}>{n}</option>)}
              </select> },
              { label: "Prioridad", el: <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))} style={{ width: "100%", background: "#1c2030", border: "1px solid #252a3a", borderRadius: 8, padding: "8px 11px", color: "#e8eaf2", fontFamily: "inherit", fontSize: "0.84rem", outline: "none" }}>
                <option value="high">🔴 Alta</option>
                <option value="medium">🟡 Media</option>
                <option value="low">🟢 Baja</option>
              </select> },
              { label: "Fecha límite", el: <input type="date" value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))} style={{ width: "100%", background: "#1c2030", border: "1px solid #252a3a", borderRadius: 8, padding: "8px 11px", color: "#e8eaf2", fontFamily: "inherit", fontSize: "0.84rem", outline: "none", boxSizing: "border-box" }} /> },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 13 }}>
                <div style={{ fontSize: "0.75rem", color: "#6b7394", fontWeight: 500, marginBottom: 5 }}>{f.label}</div>
                {f.el}
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "1px solid #252a3a", color: "#6b7394", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: "0.84rem", fontWeight: 500 }}>Cancelar</button>
              <button onClick={addTask} style={{ background: "#4f8ef7", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: "0.84rem", fontWeight: 600 }}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
