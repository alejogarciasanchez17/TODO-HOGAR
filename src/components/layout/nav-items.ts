import type { SeccionId } from "@/lib/secciones";

export type ItemNav = { seccion: SeccionId; soloAdmin?: boolean };

export const NAV_PRINCIPAL: ItemNav[] = [
  { seccion: "dashboard" },
  { seccion: "clientes" },
  { seccion: "embudo" },
  { seccion: "agenda" },
  { seccion: "pagos" },
  { seccion: "tareas" },
];

export const NAV_SECUNDARIO: ItemNav[] = [
  { seccion: "completados" },
  { seccion: "perdidos" },
  { seccion: "archivados" },
  { seccion: "paginas-agenda" },
  { seccion: "comparte" },
  { seccion: "equipo", soloAdmin: true },
  { seccion: "admin", soloAdmin: true },
];

/** Los 4 accesos más usados en la barra inferior de celular (el 5º es "+ Nuevo"). */
export const NAV_MOVIL: ItemNav[] = [
  { seccion: "dashboard" },
  { seccion: "clientes" },
  { seccion: "embudo" },
  { seccion: "tareas" },
];
