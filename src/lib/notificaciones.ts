import { prisma } from "@/lib/prisma";

/** Recordatorios y menciones pendientes de un usuario, para la campanita. */
export async function obtenerNotificaciones(usuarioId: string) {
  const ahora = new Date();

  const [recordatorios, menciones] = await Promise.all([
    prisma.recordatorio.findMany({
      where: { usuarioId, hecho: false },
      orderBy: { fecha: "asc" },
      take: 30,
      include: { cliente: { select: { id: true, nombre: true } } },
    }),
    prisma.mencion.findMany({
      where: { usuarioId, leido: false },
      orderBy: { fecha: "desc" },
      take: 30,
    }),
  ]);

  const vencidos = recordatorios.filter((r) => r.fecha <= ahora).length;
  const total = recordatorios.length + menciones.length;

  return { recordatorios, menciones, total, vencidos };
}

export async function marcarRecordatorioHecho(id: string, usuarioId: string) {
  await prisma.recordatorio.updateMany({
    where: { id, usuarioId },
    data: { hecho: true },
  });
}

export async function posponerRecordatorio(id: string, usuarioId: string) {
  const recordatorio = await prisma.recordatorio.findFirst({ where: { id, usuarioId } });
  if (!recordatorio) return;
  const nuevaFecha = new Date(recordatorio.fecha);
  nuevaFecha.setDate(nuevaFecha.getDate() + 1);
  await prisma.recordatorio.update({ where: { id }, data: { fecha: nuevaFecha } });
}

export async function marcarMencionLeida(id: string, usuarioId: string) {
  await prisma.mencion.updateMany({ where: { id, usuarioId }, data: { leido: true } });
}
