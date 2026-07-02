"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { horariosDisponibles } from "@/lib/disponibilidad";
import { crearLeadDesdeFormularioPublico } from "@/lib/leads-publicos";
import { crearEventoConMeet } from "@/lib/google-calendar";
import { registrarEvento } from "@/lib/eventos-timeline";

export async function obtenerSlotsDelDia(slug: string, fechaISO: string) {
  const vendedor = await prisma.usuario.findFirst({ where: { slugAgenda: slug, activo: true, agendaActiva: true, eliminadoEn: null } });
  if (!vendedor) return [];
  const config = await obtenerConfiguracionNegocio();
  return horariosDisponibles({
    vendedorId: vendedor.id,
    fecha: new Date(fechaISO),
    horarioInicio: config.horarioInicio,
    horarioFin: config.horarioFin,
    duracionMin: config.duracionCitaMin,
  });
}

const esquemaReserva = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre completo"),
  telefono: z.string().trim().min(8, "Escribe tu WhatsApp con lada"),
  correo: z.string().trim().email("Correo no válido").optional().or(z.literal("")),
  fechaISO: z.string().min(1, "Elige un horario"),
});

export async function agendarCitaPublica(slug: string, _estadoPrevio: string | undefined, formData: FormData) {
  const vendedor = await prisma.usuario.findFirst({ where: { slugAgenda: slug, activo: true, agendaActiva: true, eliminadoEn: null } });
  if (!vendedor) return "Esta página de agenda ya no está disponible.";

  const parseo = esquemaReserva.safeParse(Object.fromEntries(formData.entries()));
  if (!parseo.success) return parseo.error.issues[0]?.message ?? "Revisa tus datos.";

  const config = await obtenerConfiguracionNegocio();
  const fecha = new Date(parseo.data.fechaISO);
  if (Number.isNaN(fecha.getTime())) return "Ese horario ya no es válido, elige otro.";

  let cliente;
  try {
    cliente = await crearLeadDesdeFormularioPublico({
      nombre: parseo.data.nombre,
      telefono: parseo.data.telefono,
      correo: parseo.data.correo || undefined,
      origen: `Agenda ${vendedor.nombre}`,
      vendedorId: vendedor.id,
      proximaAccion: "Confirmar cita",
    });
  } catch {
    return "REINTENTAR";
  }

  const finCita = new Date(fecha.getTime() + config.duracionCitaMin * 60000);
  const evento = await crearEventoConMeet({
    resumen: `Cita todo hogar con ${cliente.nombre}`,
    descripcion: "Cita agendada desde la página pública de agenda.",
    inicio: fecha,
    fin: finCita,
    invitados: [cliente.correo, vendedor.correo].filter((c): c is string => Boolean(c)).map((email) => ({ email })),
  });

  await prisma.cita.create({
    data: {
      clienteId: cliente.id,
      vendedorId: vendedor.id,
      fecha,
      duracionMin: config.duracionCitaMin,
      googleEventId: evento?.eventId ?? null,
      googleMeetLink: evento?.meetLink ?? null,
    },
  });
  await registrarEvento({ clienteId: cliente.id, tipo: "cita", descripcion: `Agendó su propia cita para ${fecha.toLocaleString("es-MX")}.` });

  return `OK|${fecha.toISOString()}|${vendedor.nombre}`;
}
