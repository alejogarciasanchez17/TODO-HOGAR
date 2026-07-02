import { prisma } from "@/lib/prisma";

/** Busca un cliente activo con el mismo teléfono o correo, para avisar antes de crear uno duplicado. */
export async function buscarClienteDuplicado(telefono?: string | null, correo?: string | null) {
  if (!telefono && !correo) return null;

  const or: Record<string, string>[] = [];
  if (telefono) or.push({ telefono });
  if (correo) or.push({ correo });

  return prisma.cliente.findFirst({
    where: { eliminadoEn: null, OR: or },
    select: { id: true, nombre: true, telefono: true, correo: true },
  });
}
