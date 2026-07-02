export type PasoTour = { selector: string | null; titulo: string; texto: string };

export const PASOS_VENDEDOR: PasoTour[] = [
  { selector: "nav", titulo: "Tu menú", texto: "Este es tu menú, aquí está todo lo que necesitas para vender." },
  { selector: 'a[href="/seguimiento"]', titulo: "Hoy te toca", texto: "Aquí ves a quién te toca contactar hoy. Ábrelo cada mañana antes que nada." },
  { selector: "#boton-buscador-global", titulo: "Buscador", texto: "Este buscador encuentra cualquier cliente, teléfono, correo o nota al instante. Atajo: Ctrl/Cmd + K." },
  { selector: 'a[aria-label="Agregar cliente nuevo"]', titulo: "+ Nuevo", texto: "Con este botón agregas un cliente nuevo en segundos." },
  { selector: null, titulo: "Expediente del cliente", texto: "Al hacer clic en el nombre de cualquier cliente, en cualquier lista, ves todo su expediente completo." },
  { selector: 'button[aria-label="Ayuda"]', titulo: "Tema y ayuda", texto: "Aquí cambias el tema (claro, oscuro o automático), y aquí puedes volver a ver este tutorial cuando quieras." },
];

export const PASOS_ADMIN: PasoTour[] = [
  ...PASOS_VENDEDOR,
  { selector: 'a[href="/admin"]', titulo: "Panel admin", texto: "Aquí administras tu equipo, la configuración del negocio, respaldos y la papelera." },
  { selector: 'a[href="/comparte"]', titulo: "Comparte y crece", texto: "Aquí obtienes la liga de tu landing para compartirla y medir de dónde llegan tus clientes." },
];
