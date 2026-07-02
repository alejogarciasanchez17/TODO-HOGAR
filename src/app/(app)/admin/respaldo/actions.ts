"use server";

import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

function aCSV(filas: Record<string, unknown>[]) {
  if (filas.length === 0) return "";
  const columnas = Object.keys(filas[0]);
  const escapar = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lineas = [columnas.join(","), ...filas.map((f) => columnas.map((c) => escapar(f[c])).join(","))];
  return lineas.join("\n");
}

/** Exporta TODA la base (menos contraseñas y llaves) en un solo JSON, listo para restaurar. */
export async function generarRespaldoCompleto() {
  const admin = await requerirAdmin();

  const [usuarios, clientes, pagos, citas, eventos, etiquetas, clienteEtiquetas, plantillas, configuracion] = await Promise.all([
    prisma.usuario.findMany({
      select: { id: true, nombre: true, correo: true, rol: true, activo: true, metaMensual: true, comisionPct: true, slugAgenda: true },
    }),
    prisma.cliente.findMany({ where: { eliminadoEn: null } }),
    prisma.pago.findMany({ where: { eliminadoEn: null } }),
    prisma.cita.findMany({ where: { eliminadoEn: null } }),
    prisma.eventoTimeline.findMany(),
    prisma.etiqueta.findMany(),
    prisma.clienteEtiqueta.findMany(),
    prisma.plantilla.findMany(),
    prisma.configuracionNegocio.findMany(),
  ]);

  await registrarAuditoria({ usuarioId: admin.id, accion: "exportar_todo", entidadTipo: "sistema" });

  return JSON.stringify(
    { version: 1, generadoEn: new Date().toISOString(), usuarios, clientes, pagos, citas, eventos, etiquetas, clienteEtiquetas, plantillas, configuracion },
    null,
    2
  );
}

export async function generarCSVClientes() {
  await requerirAdmin();
  const clientes = await prisma.cliente.findMany({ where: { eliminadoEn: null }, include: { vendedor: { select: { nombre: true } } } });
  return aCSV(
    clientes.map((c) => ({
      nombre: c.nombre,
      telefono: c.telefono ?? "",
      correo: c.correo ?? "",
      etapa: c.etapa,
      estadoCartera: c.estadoCartera,
      valorEstimado: c.valorEstimado,
      temperatura: c.temperatura,
      vendedor: c.vendedor.nombre,
      origen: c.origen ?? "",
    }))
  );
}

export async function generarCSVPagos() {
  await requerirAdmin();
  const pagos = await prisma.pago.findMany({ where: { eliminadoEn: null }, include: { cliente: { select: { nombre: true } } } });
  return aCSV(
    pagos.map((p) => ({
      folio: p.folio,
      cliente: p.cliente.nombre,
      monto: p.monto,
      metodo: p.metodo,
      estatus: p.estatus,
      fechaPago: p.fechaPago?.toISOString().slice(0, 10) ?? "",
      concepto: p.concepto ?? "",
    }))
  );
}

export async function generarCSVCitas() {
  await requerirAdmin();
  const citas = await prisma.cita.findMany({ where: { eliminadoEn: null }, include: { cliente: { select: { nombre: true } }, vendedor: { select: { nombre: true } } } });
  return aCSV(
    citas.map((c) => ({
      cliente: c.cliente.nombre,
      vendedor: c.vendedor.nombre,
      fecha: c.fecha.toISOString(),
      duracionMin: c.duracionMin,
      estado: c.estado,
    }))
  );
}

type RespaldoJSON = {
  clientes?: Array<Record<string, unknown> & { id: string }>;
  pagos?: Array<Record<string, unknown> & { id: string; clienteId: string }>;
  citas?: Array<Record<string, unknown> & { id: string; clienteId: string }>;
};

const CAMPOS_FECHA: Record<string, string[]> = {
  cliente: ["proximaAccionFecha", "ultimaCompra", "etapaEntradaEn", "ultimoContactoEn", "eliminadoEn", "creadoEn", "actualizadoEn"],
  pago: ["fechaPago", "fechaVencimiento", "eliminadoEn", "creadoEn", "actualizadoEn"],
  cita: ["fecha", "eliminadoEn", "creadoEn", "actualizadoEn"],
};

/** JSON.parse deja las fechas como texto; Prisma necesita objetos Date reales. */
function normalizarFechas(registro: Record<string, unknown>, tipo: keyof typeof CAMPOS_FECHA) {
  const copia = { ...registro };
  for (const campo of CAMPOS_FECHA[tipo]) {
    const valor = copia[campo];
    copia[campo] = typeof valor === "string" ? new Date(valor) : valor ?? null;
  }
  return copia;
}

/** Restaura clientes/pagos/citas de un respaldo .json (agrega lo que no exista; nunca borra nada primero). */
export async function restaurarRespaldo(contenidoJSON: string) {
  const admin = await requerirAdmin();
  let datos: RespaldoJSON;
  try {
    datos = JSON.parse(contenidoJSON);
  } catch {
    return "El archivo no es un respaldo JSON válido.";
  }

  let clientesAgregados = 0;
  for (const c of datos.clientes ?? []) {
    const existe = await prisma.cliente.findUnique({ where: { id: c.id } });
    if (existe) continue;
    try {
      await prisma.cliente.create({ data: normalizarFechas(c, "cliente") as never });
      clientesAgregados++;
    } catch {
      // se omite un registro incompatible en vez de tronar todo el restauro
    }
  }

  let pagosAgregados = 0;
  for (const p of datos.pagos ?? []) {
    const existe = await prisma.pago.findUnique({ where: { id: p.id } });
    const clienteExiste = await prisma.cliente.findUnique({ where: { id: p.clienteId } });
    if (existe || !clienteExiste) continue;
    try {
      await prisma.pago.create({ data: normalizarFechas(p, "pago") as never });
      pagosAgregados++;
    } catch {}
  }

  let citasAgregadas = 0;
  for (const c of datos.citas ?? []) {
    const existe = await prisma.cita.findUnique({ where: { id: c.id } });
    const clienteExiste = await prisma.cliente.findUnique({ where: { id: c.clienteId } });
    if (existe || !clienteExiste) continue;
    try {
      await prisma.cita.create({ data: normalizarFechas(c, "cita") as never });
      citasAgregadas++;
    } catch {}
  }

  await registrarAuditoria({
    usuarioId: admin.id,
    accion: "restaurar_respaldo",
    entidadTipo: "sistema",
    detalle: { clientesAgregados, pagosAgregados, citasAgregadas },
  });

  return `OK:${clientesAgregados}:${pagosAgregados}:${citasAgregadas}`;
}
