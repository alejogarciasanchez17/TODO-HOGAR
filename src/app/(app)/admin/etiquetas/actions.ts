"use server";

import { revalidatePath } from "next/cache";
import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";
import { etiquetaSchema } from "@/lib/zod-schemas";

export async function crearEtiqueta(_estadoPrevio: string | undefined, formData: FormData) {
  const admin = await requerirAdmin();
  const datos = Object.fromEntries(formData.entries());
  const parseo = etiquetaSchema.safeParse(datos);
  if (!parseo.success) return parseo.error.issues[0]?.message ?? "Revisa los datos.";

  const existe = await prisma.etiqueta.findUnique({ where: { nombre: parseo.data.nombre } });
  if (existe) return "Ya existe una etiqueta con ese nombre.";

  const etiqueta = await prisma.etiqueta.create({ data: parseo.data });
  await registrarAuditoria({ usuarioId: admin.id, accion: "crear_etiqueta", entidadTipo: "etiqueta", entidadId: etiqueta.id });
  revalidatePath("/admin/etiquetas");
  return "OK";
}

export async function eliminarEtiqueta(id: string) {
  const admin = await requerirAdmin();
  await prisma.etiqueta.delete({ where: { id } });
  await registrarAuditoria({ usuarioId: admin.id, accion: "eliminar_etiqueta", entidadTipo: "etiqueta", entidadId: id });
  revalidatePath("/admin/etiquetas");
}
