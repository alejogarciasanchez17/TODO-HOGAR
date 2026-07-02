// Identidad visual por sección: ícono Lucide + matiz de acento propio + frase
// guía. Todas comparten el color de marca; esto solo agrega variedad.
export type SeccionId =
  | "dashboard"
  | "clientes"
  | "embudo"
  | "agenda"
  | "pagos"
  | "tareas"
  | "completados"
  | "perdidos"
  | "archivados"
  | "paginas-agenda"
  | "equipo"
  | "comparte"
  | "buscador"
  | "ia"
  | "admin";

export type Seccion = {
  id: SeccionId;
  ruta: string;
  nombre: string;
  frase: string;
  icono: string; // nombre del componente en lucide-react
  acentoVar: string; // variable CSS --acento-*
};

export const SECCIONES: Record<SeccionId, Seccion> = {
  dashboard: {
    id: "dashboard",
    ruta: "/dashboard",
    nombre: "Tablero",
    frase: "¿Vas a cerrar el mes?",
    icono: "LayoutDashboard",
    acentoVar: "--acento-dashboard",
  },
  clientes: {
    id: "clientes",
    ruta: "/clientes",
    nombre: "Clientes",
    frase: "Todas tus personas en un solo lugar",
    icono: "Users",
    acentoVar: "--acento-clientes",
  },
  embudo: {
    id: "embudo",
    ruta: "/embudo",
    nombre: "Embudo",
    frase: "Mueve a cada cliente hacia la venta",
    icono: "KanbanSquare",
    acentoVar: "--acento-embudo",
  },
  agenda: {
    id: "agenda",
    ruta: "/agenda",
    nombre: "Agenda",
    frase: "Tus citas, organizadas solas",
    icono: "CalendarDays",
    acentoVar: "--acento-agenda",
  },
  pagos: {
    id: "pagos",
    ruta: "/pagos",
    nombre: "Pagos",
    frase: "Lo que cobraste y lo que falta",
    icono: "Wallet",
    acentoVar: "--acento-pagos",
  },
  tareas: {
    id: "tareas",
    ruta: "/seguimiento",
    nombre: "Seguimiento",
    frase: "A quién toca contactar hoy",
    icono: "ListChecks",
    acentoVar: "--acento-tareas",
  },
  completados: {
    id: "completados",
    ruta: "/completados",
    nombre: "Completados",
    frase: "Tu muro de victorias",
    icono: "Trophy",
    acentoVar: "--acento-completados",
  },
  perdidos: {
    id: "perdidos",
    ruta: "/perdidos",
    nombre: "Perdidos",
    frase: "Aprende por qué y reactiva",
    icono: "XCircle",
    acentoVar: "--acento-perdidos",
  },
  archivados: {
    id: "archivados",
    ruta: "/archivados",
    nombre: "Archivados",
    frase: "Guardados sin perder nada",
    icono: "Archive",
    acentoVar: "--acento-archivados",
  },
  "paginas-agenda": {
    id: "paginas-agenda",
    ruta: "/paginas-agenda",
    nombre: "Páginas de agenda",
    frase: "Tu liga para que te agenden solos",
    icono: "CalendarPlus",
    acentoVar: "--acento-paginas-agenda",
  },
  equipo: {
    id: "equipo",
    ruta: "/equipo",
    nombre: "Equipo",
    frase: "Tu gente y sus metas",
    icono: "UserCog",
    acentoVar: "--acento-equipo",
  },
  comparte: {
    id: "comparte",
    ruta: "/comparte",
    nombre: "Comparte y crece",
    frase: "Difunde tu landing y mide qué canal vende",
    icono: "Share2",
    acentoVar: "--acento-comparte",
  },
  buscador: {
    id: "buscador",
    ruta: "#",
    nombre: "Buscador global",
    frase: "Encuentra lo que sea, al instante",
    icono: "Search",
    acentoVar: "--acento-buscador",
  },
  ia: {
    id: "ia",
    ruta: "#",
    nombre: "Asistente IA",
    frase: "Tu copiloto para vender",
    icono: "Sparkles",
    acentoVar: "--acento-ia",
  },
  admin: {
    id: "admin",
    ruta: "/admin",
    nombre: "Panel admin",
    frase: "Tu equipo, tus datos, tu negocio",
    icono: "ShieldCheck",
    acentoVar: "--acento-admin",
  },
};
