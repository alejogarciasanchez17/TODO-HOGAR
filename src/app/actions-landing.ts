"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { horariosDisponibles } from "@/lib/disponibilidad";
import { crearLeadDesdeFormularioPublico } from "@/lib/leads-publicos";
import { crearEventoConMeet } from "@/lib/google-calendar";
import { registrarEvento } from "@/lib/eventos-timeline";

/** Elige al vendedor con menos clientes activos, para repartir los leads de la landing. */
export async function obtenerVendedorDeTurno() {
  const vendedores = await prisma.usuario.findMany({
    where: { activo: true, eliminadoEn: null, rol: { not: "LECTURA" } },
    select: { id: true, nombre: true, _count: { select: { clientes: { where: { eliminadoEn: null, estadoCartera: "ACTIVO" } } } } },
  });
  if (vendedores.length === 0) return null;
  vendedores.sort((a, b) => a._count.clientes - b._count.clientes);
  return { id: vendedores[0].id, nombre: vendedores[0].nombre };
}

export async function obtenerSlotsLanding(vendedorId: string, fechaISO: string) {
  const config = await obtenerConfiguracionNegocio();
  return horariosDisponibles({
    vendedorId,
    fecha: new Date(fechaISO),
    horarioInicio: config.horarioInicio,
    horarioFin: config.horarioFin,
    duracionMin: config.duracionCitaMin,
    husoHorario: config.husoHorario,
  });
}

const esquemaLead = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre completo"),
  telefono: z.string().trim().min(8, "Escribe tu WhatsApp con lada"),
  correo: z.string().trim().email("Correo no válido").optional().or(z.literal("")),
  fechaISO: z.string().min(1),
  vendedorId: z.string().min(1),
  canalUTM: z.string().optional().or(z.literal("")),
});

export async function enviarLandingLead(_estadoPrevio: string | undefined, formData: FormData) {
  const parseo = esquemaLead.safeParse(Object.fromEntries(formData.entries()));
  if (!parseo.success) return parseo.error.issues[0]?.message ?? "Revisa tus datos.";

  const vendedor = await prisma.usuario.findFirst({ where: { id: parseo.data.vendedorId, activo: true, eliminadoEn: null } });
  if (!vendedor) return "REINTENTAR";

  const fecha = new Date(parseo.data.fechaISO);
  if (Number.isNaN(fecha.getTime())) return "Ese horario ya no es válido, elige otro.";

  let cliente;
  try {
    cliente = await crearLeadDesdeFormularioPublico({
      nombre: parseo.data.nombre,
      telefono: parseo.data.telefono,
      correo: parseo.data.correo || undefined,
      origen: "Landing",
      canalUTM: parseo.data.canalUTM || null,
      vendedorId: vendedor.id,
      proximaAccion: "Contactar en menos de 24 h",
    });
  } catch {
    return "REINTENTAR";
  }

  try {
    const config = await obtenerConfiguracionNegocio();
    const finCita = new Date(fecha.getTime() + config.duracionCitaMin * 60000);
    const evento = await crearEventoConMeet({
      resumen: `Cita todo hogar con ${cliente.nombre}`,
      descripcion: "Cita agendada desde la landing pública.",
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
    await registrarEvento({ clienteId: cliente.id, tipo: "cita", descripcion: `Agendó cita desde la landing para ${fecha.toLocaleString("es-MX")}.` });
  } catch (error) {
    // El lead ya se guardó (lo más importante); si la cita falla, no perdemos el contacto.
    console.error("No se pudo crear la cita desde la landing, pero el lead sí se guardó:", error);
  }

  return `OK|${fecha.toISOString()}`;
}
