"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function sesionOFalla() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error("No autorizado");
  return sesion.user;
}

export async function alternarAgendaActiva(usuarioId: string) {
  const sesion = await sesionOFalla();
  if (sesion.rol !== "ADMIN" && sesion.id !== usuarioId) throw new Error("No autorizado");

  const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario) throw new Error("Usuario no encontrado");

  await prisma.usuario.update({ where: { id: usuarioId }, data: { agendaActiva: !usuario.agendaActiva } });
  revalidatePath("/comparte");
}
