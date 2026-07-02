"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permisos";
import { registrarAuditoria } from "@/lib/auditoria";
import { registrarEvento } from "@/lib/eventos-timeline";
import { pagoSchema } from "@/lib/zod-schemas";
import { formatoMoneda } from "@/lib/config-negocio";

async function sesionOFalla() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error("No autorizado");
  return sesion.user;
}

function aFecha(valor?: string | null) {
  if (!valor) return null;
  const f = new Date(valor);
  return Number.isNaN(f.getTime()) ? null : f;
}

export async function registrarPago(_estadoPrevio: string | undefined, formData: FormData) {
  const usuario = await sesionOFalla();
  const datos = Object.fromEntries(formData.entries());
  const parseo = pagoSchema.safeParse(datos);
  if (!parseo.success) return parseo.error.issues[0]?.message ?? "Revisa los datos del pago.";

  const cliente = await prisma.cliente.findUnique({ where: { id: parseo.data.clienteId } });
  if (!cliente || cliente.eliminadoEn) return "Cliente no encontrado.";
  if (!puede(usuario, "editar_cliente", cliente)) return "No autorizado.";

  const folio = (await prisma.pago.count()) + 1;

  const pago = await prisma.pago.create({
    data: {
      clienteId: parseo.data.clienteId,
      monto: parseo.data.monto,
      metodo: parseo.data.metodo,
      estatus: parseo.data.estatus,
      fechaPago: parseo.data.estatus === "pagado" ? aFecha(parseo.data.fechaPago) ?? new Date() : aFecha(parseo.data.fechaPago),
      fechaVencimiento: aFecha(parseo.data.fechaVencimiento),
      concepto: parseo.data.concepto || null,
      folio,
      registradoPorId: usuario.id,
    },
  });

  await registrarEvento({
    clienteId: parseo.data.clienteId,
    tipo: "pago",
    descripcion: `Pago registrado: ${formatoMoneda(parseo.data.monto)} (${parseo.data.metodo}, ${parseo.data.estatus})`,
    autorId: usuario.id,
  });
  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: "registrar_pago",
    entidadTipo: "pago",
    entidadId: pago.id,
  });

  revalidatePath(`/clientes/${parseo.data.clienteId}`);
  revalidatePath("/pagos");
  revalidatePath("/dashboard");
  return "OK";
}

export async function actualizarEstatusPago(id: string, estatus: "pendiente" | "pagado" | "vencido") {
  const usuario = await sesionOFalla();
  const pago = await prisma.pago.findUnique({ where: { id }, include: { cliente: true } });
  if (!pago) throw new Error("Pago no encontrado");
  if (!puede(usuario, "editar_cliente", pago.cliente)) throw new Error("No autorizado");

  await prisma.pago.update({
    where: { id },
    data: { estatus, fechaPago: estatus === "pagado" ? new Date() : pago.fechaPago },
  });
  await registrarEvento({
    clienteId: pago.clienteId,
    tipo: "pago",
    descripcion: `Pago #${pago.folio} marcado como ${estatus}`,
    autorId: usuario.id,
  });
  revalidatePath(`/clientes/${pago.clienteId}`);
  revalidatePath("/pagos");
}

export async function eliminarPago(id: string) {
  const usuario = await sesionOFalla();
  const pago = await prisma.pago.findUnique({ where: { id }, include: { cliente: true } });
  if (!pago) throw new Error("Pago no encontrado");
  if (!puede(usuario, "editar_cliente", pago.cliente)) throw new Error("No autorizado");

  await prisma.pago.update({ where: { id }, data: { eliminadoEn: new Date() } });
  await registrarAuditoria({ usuarioId: usuario.id, accion: "eliminar_pago", entidadTipo: "pago", entidadId: id });
  revalidatePath(`/clientes/${pago.clienteId}`);
  revalidatePath("/pagos");
}
