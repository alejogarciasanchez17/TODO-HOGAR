"use server";

import { auth, signOut, unstable_update } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Tema } from "@/lib/tema";
import { cookies } from "next/headers";

/** Cambia el tema del usuario actual: se guarda en su cuenta y en cookie (respaldo sin parpadeo). */
export async function cambiarTema(tema: Tema) {
  const sesion = await auth();
  if (!sesion?.user?.id) return;

  await prisma.usuario.update({
    where: { id: sesion.user.id },
    data: { tema },
  });

  const jarra = await cookies();
  jarra.set("tema", tema, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });

  await unstable_update({ user: { tema } });
}

export async function cambiarDensidad(densidad: "comoda" | "compacta") {
  const sesion = await auth();
  if (!sesion?.user?.id) return;

  await prisma.usuario.update({
    where: { id: sesion.user.id },
    data: { densidad },
  });
  await unstable_update({ user: { densidad } });
}

export async function completarOnboarding() {
  const sesion = await auth();
  if (!sesion?.user?.id) return;

  await prisma.usuario.update({
    where: { id: sesion.user.id },
    data: { onboardingCompletado: true },
  });
  await unstable_update({ user: { onboardingCompletado: true } });
}

/** Relanza el tour de bienvenida desde el paso 1 (botón "Ver el tutorial de nuevo"). */
export async function reiniciarOnboarding() {
  const sesion = await auth();
  if (!sesion?.user?.id) return;

  await prisma.usuario.update({
    where: { id: sesion.user.id },
    data: { onboardingCompletado: false },
  });
  await unstable_update({ user: { onboardingCompletado: false } });
}

export async function cerrarSesion() {
  await signOut({ redirectTo: "/login" });
}
