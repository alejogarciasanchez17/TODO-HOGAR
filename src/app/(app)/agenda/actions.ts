"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permisos";
import { registrarAuditoria } from "@/lib/auditoria";
import { registrarEvento } from "@/lib/eventos-timeline";
import { citaSchema } from "@/lib/zod-schemas";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { crearEventoConMeet, eliminarEventoGoogle } from "@/lib/google-calendar";

async function sesionOFalla() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error("No autorizado");
  return sesion.user;
}

export async function crearCita(_estadoPrevio: string | undefined, formData: FormData) {
  const usuario = await sesionOFalla();
  const datos = Object.fromEntries(formData.entries());
  const parseo = citaSchema.safeParse(datos);
  if (!parseo.success) return parseo.error.issues[0]?.message ?? "Revisa los datos de la cita.";

  const vendedorId = usuario.rol === "ADMIN" ? parseo.data.vendedorId : usuario.id;

  const cliente = await prisma.cliente.findUnique({ where: { id: parseo.data.clienteId } });
  if (!cliente || cliente.eliminadoEn) return "Cliente no encontrado.";
  if (!puede(usuario, "editar_cliente", cliente)) return "No autorizado.";

  const fecha = new Date(parseo.data.fecha);
  if (Number.isNaN(fecha.getTime())) return "La fecha no es válida.";

  const finNueva = new Date(fecha.getTime() + parseo.data.duracionMin * 60000);
  const choque = await prisma.cita.findFirst({
    where: { vendedorId, eliminadoEn: null, estado: { not: "cancelada" }, fecha: { gte: new Date(fecha.getTime() - 4 * 60 * 60000), lt: finNueva } },
  });
  if (choque) {
    const finChoque = new Date(choque.fecha.getTime() + choque.duracionMin * 60000);
    if (fecha < finChoque && finNueva > choque.fecha) {
      return "Ese horario ya está ocupado. Elige otro.";
    }
  }

  const vendedor = await prisma.usuario.findUnique({ where: { id: vendedorId } });

  let googleEventId: string | null = null;
  let googleMeetLink: string | null = null;
  const invitados = [cliente.correo, vendedor?.correo].filter((c): c is string => Boolean(c)).map((email) => ({ email }));
  const evento = await crearEventoConMeet({
    resumen: `Cita todo hogar con ${cliente.nombre}`,
    descripcion: parseo.data.notas || "Cita agendada desde el CRM de todo hogar.",
    inicio: fecha,
    fin: finNueva,
    invitados,
  });
  if (evento) {
    googleEventId = evento.eventId;
    googleMeetLink = evento.meetLink;
  }

  const cita = await prisma.cita.create({
    data: {
      clienteId: parseo.data.clienteId,
      vendedorId,
      fecha,
      duracionMin: parseo.data.duracionMin,
      notas: parseo.data.notas || null,
      googleEventId,
      googleMeetLink,
    },
  });

  await registrarEvento({
    clienteId: parseo.data.clienteId,
    tipo: "cita",
    descripcion: `Cita agendada para ${fecha.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}${googleMeetLink ? " (con Google Meet)" : ""}.`,
    autorId: usuario.id,
  });
  await registrarAuditoria({ usuarioId: usuario.id, accion: "crear_cita", entidadTipo: "cita", entidadId: cita.id });

  revalidatePath("/agenda");
  revalidatePath(`/clientes/${parseo.data.clienteId}`);
  return evento ? "OK" : "OK_SIN_GOOGLE";
}

export async function cancelarCita(id: string) {
  const usuario = await sesionOFalla();
  const cita = await prisma.cita.findUnique({ where: { id }, include: { cliente: true } });
  if (!cita) throw new Error("Cita no encontrada");
  if (!puede(usuario, "editar_cliente", cita.cliente)) throw new Error("No autorizado");

  await prisma.cita.update({ where: { id }, data: { estado: "cancelada" } });
  await eliminarEventoGoogle(cita.googleEventId);
  await registrarEvento({ clienteId: cita.clienteId, tipo: "cita", descripcion: "Cita cancelada.", autorId: usuario.id });
  revalidatePath("/agenda");
  revalidatePath(`/clientes/${cita.clienteId}`);
}

export async function obtenerHorarioNegocio() {
  const config = await obtenerConfiguracionNegocio();
  return { horarioInicio: config.horarioInicio, horarioFin: config.horarioFin, duracionCitaMin: config.duracionCitaMin };
}
