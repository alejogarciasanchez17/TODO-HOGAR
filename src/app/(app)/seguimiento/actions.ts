"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordatorioSchema } from "@/lib/zod-schemas";

async function sesionOFalla() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error("No autorizado");
  return sesion.user;
}

export async function crearRecordatorio(_estadoPrevio: string | undefined, formData: FormData) {
  const usuario = await sesionOFalla();
  const datos = Object.fromEntries(formData.entries());
  const parseo = recordatorioSchema.safeParse(datos);
  if (!parseo.success) return parseo.error.issues[0]?.message ?? "Revisa el recordatorio.";

  await prisma.recordatorio.create({
    data: {
      usuarioId: usuario.id,
      texto: parseo.data.texto,
      fecha: new Date(parseo.data.fecha),
      clienteId: parseo.data.clienteId || null,
    },
  });

  revalidatePath("/seguimiento");
  return "OK";
}
