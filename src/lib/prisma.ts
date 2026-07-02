import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

// Elige el adaptador según la URL de conexión: SQLite en desarrollo local
// (archivo), Postgres en producción (Neon u otro Postgres gratuito). Así el
// mismo código funciona igual en la compu y publicado, solo cambia la
// variable de entorno DATABASE_URL.
function crearAdaptador(url: string) {
  if (url.startsWith("file:")) {
    return new PrismaBetterSqlite3({ url: url.replace(/^file:/, "") });
  }
  return new PrismaPg(url);
}

function crearCliente() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  return new PrismaClient({ adapter: crearAdaptador(url) });
}

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

// Singleton para no abrir una conexión nueva en cada recarga de Next.js en desarrollo.
export const prisma = global.__prismaClient ?? crearCliente();

if (process.env.NODE_ENV !== "production") {
  global.__prismaClient = prisma;
}
