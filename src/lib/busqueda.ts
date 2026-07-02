const ES_SQLITE = (process.env.DATABASE_URL ?? "").startsWith("file:");

/**
 * Filtro "contiene" case-insensitive. Postgres soporta `mode: "insensitive"`;
 * SQLite no (y ya es insensible a mayúsculas para ASCII por sí solo), así
 * que solo lo agregamos cuando el proveedor lo admite. Se tipa como `any`
 * a propósito: los tipos generados de Prisma dependen del proveedor activo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function contieneTexto(termino: string): any {
  return ES_SQLITE ? { contains: termino } : { contains: termino, mode: "insensitive" };
}
