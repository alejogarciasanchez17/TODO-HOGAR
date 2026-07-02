// Control de acceso central. TODA ruta de API y toda acción de servidor debe
// llamar a `puede()` antes de leer o escribir datos. Nunca confiar en que el
// navegador "escondió" un botón: la autorización se valida aquí, siempre.

export type Rol = "ADMIN" | "VENDEDOR" | "LECTURA";

export type UsuarioSesion = {
  id: string;
  rol: string;
};

export type Accion =
  | "ver_cliente"
  | "crear_cliente"
  | "editar_cliente"
  | "eliminar_cliente"
  | "ver_todos_los_clientes" // filtrar sin restringir a "propios"
  | "gestionar_usuarios"
  | "ver_panel_admin"
  | "ver_actividad_equipo"
  | "exportar_todo"
  | "respaldar_restaurar"
  | "vaciar_papelera"
  | "reasignar_cartera"
  | "editar_configuracion_negocio"
  | "editar_dato_propio";

export type RecursoConDueno = { vendedorId?: string | null; usuarioId?: string | null };

const SOLO_ADMIN: Accion[] = [
  "gestionar_usuarios",
  "ver_panel_admin",
  "ver_actividad_equipo",
  "exportar_todo",
  "respaldar_restaurar",
  "vaciar_papelera",
  "reasignar_cartera",
  "editar_configuracion_negocio",
  "ver_todos_los_clientes",
];

const SOLO_LECTURA_PERMITE: Accion[] = ["ver_cliente", "ver_todos_los_clientes"];

/**
 * Decide si `usuario` puede ejecutar `accion` sobre `recurso`.
 * Si el recurso tiene dueño (vendedorId/usuarioId), un VENDEDOR solo puede
 * actuar sobre lo suyo. El ADMIN siempre puede todo.
 */
export function puede(
  usuario: UsuarioSesion,
  accion: Accion,
  recurso?: RecursoConDueno
): boolean {
  const rol = usuario.rol as Rol;

  if (rol === "ADMIN") return true;

  if (rol === "LECTURA") {
    return SOLO_LECTURA_PERMITE.includes(accion);
  }

  // VENDEDOR
  if (SOLO_ADMIN.includes(accion)) return false;

  if (accion === "editar_dato_propio") return true;
  if (accion === "crear_cliente") return true;

  const dueno = recurso?.vendedorId ?? recurso?.usuarioId;
  if (dueno === undefined) return true; // acciones sin dueño explícito (ya filtradas arriba)
  return dueno === usuario.id;
}

/** Construye el filtro Prisma "where" que restringe por vendedor según el rol. */
export function filtroPorRol(usuario: UsuarioSesion, campoVendedor = "vendedorId") {
  if (usuario.rol === "ADMIN" || usuario.rol === "LECTURA") return {};
  return { [campoVendedor]: usuario.id };
}
