"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permisos";

async function sesionOFalla() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error("No autorizado");
  return sesion.user;
}

export async function agregarNotaTimeline(clienteId: string, texto: string, fecha?: string) {
  const usuario = await sesionOFalla();
  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, eliminadoEn: null } });
  if (!cliente || !puede(usuario, "editar_cliente", cliente)) return { ok: false };
  if (!texto.trim()) return { ok: false };

  await prisma.$transaction([
    prisma.eventoTimeline.create({
      data: { clienteId, tipo: "nota", descripcion: texto.trim(), autorId: usuario.id, fecha: fecha ? new Date(fecha) : new Date() },
    }),
    prisma.cliente.update({ where: { id: clienteId }, data: { ultimoContactoEn: new Date() } }),
  ]);
  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}

export async function registrarContacto(clienteId: string, canal: "llamada" | "whatsapp" | "correo") {
  const usuario = await sesionOFalla();
  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, eliminadoEn: null } });
  if (!cliente) return { ok: false };

  const textos = { llamada: "Se registró una llamada.", whatsapp: "Se envió un WhatsApp.", correo: "Se envió un correo." };
  await prisma.$transaction([
    prisma.eventoTimeline.create({ data: { clienteId, tipo: canal, descripcion: textos[canal], autorId: usuario.id } }),
    prisma.cliente.update({ where: { id: clienteId }, data: { ultimoContactoEn: new Date() } }),
  ]);
  revalidatePath(`/clientes/${clienteId}`);
  return { ok: true };
}

export async function establecerProximaAccion(clienteId: string, texto: string, fecha: string) {
  const usuario = await sesionOFalla();
  const cliente = await prisma.cliente.findFirst({ where: { id: clienteId, eliminadoEn: null } });
  if (!cliente || !puede(usuario, "editar_cliente", cliente)) return { ok: false };

  await prisma.cliente.update({ where: { id: clienteId }, data: { proximaAccion: texto, proximaAccionFecha: new Date(fecha) } });
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/seguimiento");
  return { ok: true };
}
