import { prisma } from "@/lib/prisma";
import { filtroPorRol, type UsuarioSesion } from "@/lib/permisos";
import { contieneTexto } from "@/lib/busqueda";

export * from "@/lib/clientes-utils";

export const POR_PAGINA = 24;

export type FiltrosClientes = {
  q?: string;
  etapa?: string;
  temperatura?: string;
  origen?: string;
  vendedorId?: string;
  etiquetaId?: string;
  favoritos?: string;
  proximaVencida?: string;
  ordenar?: "nombre" | "valor" | "proxima" | "reciente";
  pagina?: number;
  estadoCartera?: string;
};

export async function obtenerClientesLista(usuario: UsuarioSesion, filtros: FiltrosClientes) {
  const pagina = Math.max(1, filtros.pagina ?? 1);

  const where = {
    eliminadoEn: null,
    ...filtroPorRol(usuario, "vendedorId"),
    estadoCartera: filtros.estadoCartera ?? "ACTIVO",
    ...(filtros.etapa ? { etapa: filtros.etapa } : {}),
    ...(filtros.temperatura ? { temperatura: filtros.temperatura } : {}),
    ...(filtros.origen ? { origen: filtros.origen } : {}),
    ...(filtros.vendedorId ? { vendedorId: filtros.vendedorId } : {}),
    ...(filtros.proximaVencida === "1" ? { proximaAccionFecha: { lt: new Date() } } : {}),
    ...(filtros.etiquetaId ? { etiquetas: { some: { etiquetaId: filtros.etiquetaId } } } : {}),
    ...(filtros.favoritos === "1" ? { favoritos: { some: { usuarioId: usuario.id } } } : {}),
    ...(filtros.q
      ? {
          OR: [
            { nombre: contieneTexto(filtros.q) },
            { telefono: contieneTexto(filtros.q) },
            { correo: contieneTexto(filtros.q) },
            { empresaNombre: contieneTexto(filtros.q) },
          ],
        }
      : {}),
  };

  const ordenarPor =
    filtros.ordenar === "valor"
      ? [{ valorEstimado: "desc" as const }]
      : filtros.ordenar === "nombre"
        ? [{ nombre: "asc" as const }]
        : filtros.ordenar === "proxima"
          ? [{ proximaAccionFecha: "asc" as const }]
          : [{ actualizadoEn: "desc" as const }];

  const [total, clientes] = await Promise.all([
    prisma.cliente.count({ where }),
    prisma.cliente.findMany({
      where,
      orderBy: ordenarPor,
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        vendedor: { select: { id: true, nombre: true } },
        etiquetas: { include: { etiqueta: true } },
        favoritos: { where: { usuarioId: usuario.id }, select: { id: true } },
        pagos: { where: { eliminadoEn: null }, select: { estatus: true, monto: true } },
      },
    }),
  ]);

  return {
    clientes,
    total,
    paginaActual: pagina,
    totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
  };
}

export async function obtenerClientePorId(usuario: UsuarioSesion, id: string) {
  const cliente = await prisma.cliente.findFirst({
    where: { id, eliminadoEn: null, ...filtroPorRol(usuario, "vendedorId") },
    include: {
      vendedor: { select: { id: true, nombre: true } },
      etiquetas: { include: { etiqueta: true } },
      favoritos: { where: { usuarioId: usuario.id }, select: { id: true } },
      archivos: {
        where: { eliminadoEn: null },
        orderBy: { creadoEn: "desc" },
        select: {
          id: true,
          nombreArchivo: true,
          tipoMime: true,
          tamanoBytes: true,
          etiqueta: true,
          url: true,
          creadoEn: true,
          subidoPor: { select: { nombre: true } },
        },
      },
      pagos: { where: { eliminadoEn: null }, orderBy: { creadoEn: "desc" } },
      citas: { where: { eliminadoEn: null }, orderBy: { fecha: "desc" } },
      eventosTimeline: { orderBy: { fecha: "desc" }, take: 100, include: { autor: { select: { nombre: true } } } },
    },
  });
  return cliente;
}
