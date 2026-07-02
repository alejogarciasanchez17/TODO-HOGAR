"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permisos";
import { registrarAuditoria } from "@/lib/auditoria";
import { registrarEvento } from "@/lib/eventos-timeline";
import { buscarClienteDuplicado } from "@/lib/duplicados";
import { clienteSchema, vacioANulo } from "@/lib/zod-schemas";

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

export async function crearCliente(_estadoPrevio: string | undefined, formData: FormData) {
  const usuario = await sesionOFalla();
  const datos = Object.fromEntries(formData.entries());
  const parseo = clienteSchema.safeParse(datos);
  if (!parseo.success) {
    return parseo.error.issues[0]?.message ?? "Revisa los datos del formulario.";
  }
  const campos = parseo.data;

  if (!puede(usuario, "crear_cliente")) return "No tienes permiso para crear clientes.";
  if (usuario.rol === "VENDEDOR" && campos.vendedorId !== usuario.id) {
    campos.vendedorId = usuario.id;
  }

  if (formData.get("omitirDuplicado") !== "1") {
    const duplicado = await buscarClienteDuplicado(campos.telefono || null, campos.correo || null);
    if (duplicado) {
      return `DUPLICADO:${duplicado.id}:${duplicado.nombre}`;
    }
  }

  const limpio = vacioANulo(campos);
  const cliente = await prisma.cliente.create({
    data: {
      ...limpio,
      nombre: campos.nombre,
      etapa: campos.etapa,
      vendedorId: campos.vendedorId,
      temperatura: campos.temperatura,
      proximaAccionFecha: aFecha(campos.proximaAccionFecha),
      proximaAccion: limpio.proximaAccion ?? "Contactar en menos de 24 h",
      ultimoContactoEn: null,
    },
  });

  await registrarEvento({
    clienteId: cliente.id,
    tipo: "nota",
    descripcion: `Cliente creado (${cliente.origen ?? "manual"}).`,
    autorId: usuario.id,
  });
  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: "crear_cliente",
    entidadTipo: "cliente",
    entidadId: cliente.id,
  });

  revalidatePath("/clientes");
  revalidatePath("/embudo");
  redirect(`/clientes/${cliente.id}`);
}

export async function actualizarCliente(id: string, formData: FormData) {
  const usuario = await sesionOFalla();
  const existente = await prisma.cliente.findUnique({ where: { id } });
  if (!existente || existente.eliminadoEn) throw new Error("Cliente no encontrado");
  if (!puede(usuario, "editar_cliente", existente)) throw new Error("No autorizado");

  const datos = Object.fromEntries(formData.entries());
  const parseo = clienteSchema.partial({ vendedorId: true }).safeParse(datos);
  if (!parseo.success) throw new Error(parseo.error.issues[0]?.message ?? "Datos inválidos");
  const campos = parseo.data;
  const limpio = vacioANulo(campos);

  const cambios: string[] = [];
  if (campos.etapa && campos.etapa !== existente.etapa) {
    cambios.push(`Etapa: ${existente.etapa} → ${campos.etapa}`);
  }
  if (campos.temperatura && campos.temperatura !== existente.temperatura) {
    cambios.push(`Temperatura actualizada a ${campos.temperatura}`);
  }
  if (campos.objecionPrincipal !== undefined && campos.objecionPrincipal !== existente.objecionPrincipal) {
    cambios.push(`Objeción registrada: ${campos.objecionPrincipal || "(ninguna)"}`);
  }

  await prisma.cliente.update({
    where: { id },
    data: {
      ...limpio,
      nombre: campos.nombre,
      etapa: campos.etapa,
      vendedorId: campos.vendedorId,
      temperatura: campos.temperatura,
      proximaAccionFecha:
        campos.proximaAccionFecha !== undefined ? aFecha(campos.proximaAccionFecha) : undefined,
      etapaEntradaEn: campos.etapa && campos.etapa !== existente.etapa ? new Date() : undefined,
    },
  });

  for (const c of cambios) {
    await registrarEvento({ clienteId: id, tipo: "cambio_etapa", descripcion: c, autorId: usuario.id });
  }
  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: "editar_cliente",
    entidadTipo: "cliente",
    entidadId: id,
  });

  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
  revalidatePath("/embudo");
}

/** Envoltura de `actualizarCliente` compatible con useActionState, para reusar el mismo formulario de creación/edición. */
export async function actualizarClienteFormAction(
  id: string,
  _estadoPrevio: string | undefined,
  formData: FormData
) {
  try {
    await actualizarCliente(id, formData);
    return "OK";
  } catch (error) {
    return error instanceof Error ? error.message : "No se pudo guardar. Intenta de nuevo.";
  }
}

export async function eliminarCliente(id: string) {
  const usuario = await sesionOFalla();
  const existente = await prisma.cliente.findUnique({ where: { id } });
  if (!existente) throw new Error("Cliente no encontrado");
  if (!puede(usuario, "eliminar_cliente", existente)) throw new Error("No autorizado");

  await prisma.cliente.update({ where: { id }, data: { eliminadoEn: new Date() } });
  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: "eliminar_cliente",
    entidadTipo: "cliente",
    entidadId: id,
  });
  revalidatePath("/clientes");
  revalidatePath("/embudo");
}

export async function restaurarClienteDesdePapelera(id: string) {
  const usuario = await sesionOFalla();
  if (usuario.rol !== "ADMIN") throw new Error("Solo el administrador puede restaurar desde la papelera");
  await prisma.cliente.update({ where: { id }, data: { eliminadoEn: null } });
  await registrarAuditoria({ usuarioId: usuario.id, accion: "restaurar_cliente", entidadTipo: "cliente", entidadId: id });
  revalidatePath("/clientes");
}

async function cambiarEstadoCartera(
  id: string,
  nuevoEstado: "ACTIVO" | "GANADO" | "PERDIDO" | "ARCHIVADO",
  extra?: { motivoPerdida?: string; motivoPerdidaOtro?: string; etapa?: string }
) {
  const usuario = await sesionOFalla();
  const existente = await prisma.cliente.findUnique({ where: { id } });
  if (!existente || existente.eliminadoEn) throw new Error("Cliente no encontrado");
  if (!puede(usuario, "editar_cliente", existente)) throw new Error("No autorizado");

  await prisma.cliente.update({
    where: { id },
    data: {
      estadoCartera: nuevoEstado,
      motivoPerdida: nuevoEstado === "PERDIDO" ? extra?.motivoPerdida ?? existente.motivoPerdida : existente.motivoPerdida,
      motivoPerdidaOtro:
        nuevoEstado === "PERDIDO" ? extra?.motivoPerdidaOtro ?? null : existente.motivoPerdidaOtro,
      etapa: extra?.etapa ?? existente.etapa,
      ultimaCompra: nuevoEstado === "GANADO" ? new Date() : existente.ultimaCompra,
    },
  });

  const etiquetaEvento: Record<string, string> = {
    ACTIVO: "Reactivado y movido a Activo",
    GANADO: "Marcado como Ganado 🎉",
    PERDIDO: `Marcado como Perdido${extra?.motivoPerdida ? ` (${extra.motivoPerdida})` : ""}`,
    ARCHIVADO: "Archivado",
  };
  await registrarEvento({
    clienteId: id,
    tipo: "cambio_estado",
    descripcion: etiquetaEvento[nuevoEstado],
    autorId: usuario.id,
  });
  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: `estado_${nuevoEstado.toLowerCase()}`,
    entidadTipo: "cliente",
    entidadId: id,
  });

  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
  revalidatePath("/embudo");
  revalidatePath("/completados");
  revalidatePath("/perdidos");
  revalidatePath("/archivados");
}

export async function marcarClienteGanado(id: string) {
  await cambiarEstadoCartera(id, "GANADO");
}

export async function marcarClientePerdido(id: string, motivo: string, motivoOtro?: string) {
  await cambiarEstadoCartera(id, "PERDIDO", { motivoPerdida: motivo, motivoPerdidaOtro: motivoOtro });
}

export async function archivarCliente(id: string) {
  await cambiarEstadoCartera(id, "ARCHIVADO");
}

export async function restaurarClienteArchivado(id: string) {
  await cambiarEstadoCartera(id, "ACTIVO");
}

export async function reactivarClientePerdido(id: string) {
  const usuario = await sesionOFalla();
  await cambiarEstadoCartera(id, "ACTIVO", { etapa: "Nuevo" });
  await prisma.cliente.update({
    where: { id },
    data: {
      proximaAccion: "Reenganchar: retomar la conversación",
      proximaAccionFecha: new Date(),
    },
  });
  await registrarEvento({
    clienteId: id,
    tipo: "cambio_estado",
    descripcion: "Reactivado desde Perdidos",
    autorId: usuario.id,
  });
}

export async function cambiarEtapaCliente(id: string, nuevaEtapa: string) {
  const usuario = await sesionOFalla();
  const existente = await prisma.cliente.findUnique({ where: { id } });
  if (!existente || existente.eliminadoEn) throw new Error("Cliente no encontrado");
  if (!puede(usuario, "editar_cliente", existente)) throw new Error("No autorizado");

  await prisma.cliente.update({
    where: { id },
    data: { etapa: nuevaEtapa, etapaEntradaEn: new Date() },
  });
  await registrarEvento({
    clienteId: id,
    tipo: "cambio_etapa",
    descripcion: `Etapa: ${existente.etapa} → ${nuevaEtapa}`,
    autorId: usuario.id,
  });
  revalidatePath("/embudo");
  revalidatePath(`/clientes/${id}`);
}

export async function alternarFavorito(clienteId: string) {
  const usuario = await sesionOFalla();
  const existente = await prisma.favorito.findUnique({
    where: { usuarioId_clienteId: { usuarioId: usuario.id, clienteId } },
  });
  if (existente) {
    await prisma.favorito.delete({ where: { id: existente.id } });
  } else {
    await prisma.favorito.create({ data: { usuarioId: usuario.id, clienteId } });
  }
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clienteId}`);
  return !existente;
}

export async function duplicarCliente(id: string) {
  const usuario = await sesionOFalla();
  const original = await prisma.cliente.findUnique({ where: { id } });
  if (!original) throw new Error("Cliente no encontrado");
  if (!puede(usuario, "ver_cliente", original)) throw new Error("No autorizado");

  const copia = await prisma.cliente.create({
    data: {
      nombre: `${original.nombre} (copia)`,
      telefono: original.telefono,
      telefonoIntl: original.telefonoIntl,
      correo: original.correo,
      origen: original.origen,
      canalUTM: original.canalUTM,
      etapa: "Nuevo",
      estadoCartera: "ACTIVO",
      valorEstimado: original.valorEstimado,
      temperatura: original.temperatura,
      zona: original.zona,
      empresaNombre: original.empresaNombre,
      empresaGiro: original.empresaGiro,
      vendedorId: original.vendedorId,
      proximaAccion: "Contactar en menos de 24 h",
      proximaAccionFecha: new Date(),
    },
  });
  await registrarEvento({
    clienteId: copia.id,
    tipo: "nota",
    descripcion: `Duplicado a partir de ${original.nombre}.`,
    autorId: usuario.id,
  });
  revalidatePath("/clientes");
  return copia.id;
}

export async function asignarEtiqueta(clienteId: string, etiquetaId: string) {
  const usuario = await sesionOFalla();
  await prisma.clienteEtiqueta.upsert({
    where: { clienteId_etiquetaId: { clienteId, etiquetaId } },
    create: { clienteId, etiquetaId },
    update: {},
  });
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
  void usuario;
}

export async function quitarEtiqueta(clienteId: string, etiquetaId: string) {
  await sesionOFalla();
  await prisma.clienteEtiqueta.delete({ where: { clienteId_etiquetaId: { clienteId, etiquetaId } } }).catch(() => {});
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
}

export async function reasignarVendedor(clienteId: string, nuevoVendedorId: string) {
  const usuario = await sesionOFalla();
  if (usuario.rol !== "ADMIN") throw new Error("Solo el administrador puede reasignar cartera");

  const existente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!existente) throw new Error("Cliente no encontrado");
  const nuevoVendedor = await prisma.usuario.findUnique({ where: { id: nuevoVendedorId } });
  if (!nuevoVendedor) throw new Error("Vendedor no encontrado");

  await prisma.cliente.update({ where: { id: clienteId }, data: { vendedorId: nuevoVendedorId } });
  await registrarEvento({
    clienteId,
    tipo: "reasignacion",
    descripcion: `Reasignado a ${nuevoVendedor.nombre}`,
    autorId: usuario.id,
  });
  await prisma.mencion.create({
    data: {
      usuarioId: nuevoVendedorId,
      texto: `Se te reasignó el cliente ${existente.nombre}`,
      entidad: "cliente",
      entidadId: clienteId,
    },
  });
  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: "reasignar_cartera",
    entidadTipo: "cliente",
    entidadId: clienteId,
    detalle: { nuevoVendedorId },
  });
  revalidatePath(`/clientes/${clienteId}`);
  revalidatePath("/clientes");
  revalidatePath("/embudo");
}

export async function buscarDuplicadoAccion(telefono: string, correo: string) {
  await sesionOFalla();
  return buscarClienteDuplicado(telefono || null, correo || null);
}
