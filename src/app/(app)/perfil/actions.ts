"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

async function sesionOFalla() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error("No autorizado");
  return sesion.user;
}

export async function cambiarMiPassword(_estadoPrevio: string | undefined, formData: FormData) {
  const usuario = await sesionOFalla();
  const actual = String(formData.get("actual") ?? "");
  const nueva = String(formData.get("nueva") ?? "");
  const confirmacion = String(formData.get("confirmacion") ?? "");

  if (nueva.length < 8) return "La nueva contraseña debe tener al menos 8 caracteres.";
  if (nueva !== confirmacion) return "Las contraseñas no coinciden.";

  const registro = await prisma.usuario.findUnique({ where: { id: usuario.id } });
  if (!registro) return "Usuario no encontrado.";

  const valido = await bcrypt.compare(actual, registro.passwordHash);
  if (!valido) return "Tu contraseña actual no es correcta.";

  const passwordHash = await bcrypt.hash(nueva, 12);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { passwordHash } });
  await registrarAuditoria({ usuarioId: usuario.id, accion: "cambiar_password_propia", entidadTipo: "usuario", entidadId: usuario.id });

  return "OK";
}
