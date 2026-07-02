"use server";

import { revalidatePath } from "next/cache";
import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export async function restaurarDesdePapelera(tipo: "cliente" | "pago" | "cita" | "archivo", id: string) {
  const admin = await requerirAdmin();
  if (tipo === "cliente") await prisma.cliente.update({ where: { id }, data: { eliminadoEn: null } });
  if (tipo === "pago") await prisma.pago.update({ where: { id }, data: { eliminadoEn: null } });
  if (tipo === "cita") await prisma.cita.update({ where: { id }, data: { eliminadoEn: null } });
  if (tipo === "archivo") await prisma.archivo.update({ where: { id }, data: { eliminadoEn: null } });

  await registrarAuditoria({ usuarioId: admin.id, accion: "restaurar_papelera", entidadTipo: tipo, entidadId: id });
  revalidatePath("/admin/papelera");
}

export async function vaciarPapelera() {
  const admin = await requerirAdmin();
  const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const clientes = await prisma.cliente.findMany({ where: { eliminadoEn: { not: null, lt: hace30Dias } }, select: { id: true } });
  await prisma.$transaction([
    prisma.pago.deleteMany({ where: { eliminadoEn: { not: null, lt: hace30Dias } } }),
    prisma.cita.deleteMany({ where: { eliminadoEn: { not: null, lt: hace30Dias } } }),
    prisma.archivo.deleteMany({ where: { eliminadoEn: { not: null, lt: hace30Dias } } }),
    prisma.cliente.deleteMany({ where: { id: { in: clientes.map((c) => c.id) } } }),
  ]);

  await registrarAuditoria({ usuarioId: admin.id, accion: "vaciar_papelera", entidadTipo: "sistema" });
  revalidatePath("/admin/papelera");
}
