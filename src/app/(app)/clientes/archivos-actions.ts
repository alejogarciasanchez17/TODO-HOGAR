"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permisos";
import { registrarAuditoria } from "@/lib/auditoria";
import { registrarEvento } from "@/lib/eventos-timeline";
import { archivoValido, guardarArchivo, eliminarArchivoAlmacenamiento } from "@/lib/almacenamiento";

async function sesionOFalla() {
  const sesion = await auth();
  if (!sesion?.user) throw new Error("No autorizado");
  return sesion.user;
}

export async function subirArchivo(_estadoPrevio: string | undefined, formData: FormData) {
  const usuario = await sesionOFalla();
  const clienteId = String(formData.get("clienteId") ?? "");
  const etiqueta = String(formData.get("etiqueta") ?? "Otro");
  const archivo = formData.get("archivo");

  if (!(archivo instanceof File) || archivo.size === 0) return "Elige un archivo para subir.";

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente || cliente.eliminadoEn) return "Cliente no encontrado.";
  if (!puede(usuario, "editar_cliente", cliente)) return "No autorizado.";

  const error = archivoValido(archivo.type, archivo.size);
  if (error) return error;

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const { url, datos } = await guardarArchivo(archivo.name, buffer, archivo.type);

  const registro = await prisma.archivo.create({
    data: {
      clienteId,
      nombreArchivo: archivo.name,
      tipoMime: archivo.type,
      tamanoBytes: archivo.size,
      etiqueta,
      datos: datos ? new Uint8Array(datos) : null,
      url,
      subidoPorId: usuario.id,
    },
  });

  await registrarEvento({
    clienteId,
    tipo: "archivo",
    descripcion: `Subió "${archivo.name}" (${etiqueta})`,
    autorId: usuario.id,
  });
  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: "subir_archivo",
    entidadTipo: "archivo",
    entidadId: registro.id,
  });

  revalidatePath(`/clientes/${clienteId}`);
  return "OK";
}

export async function eliminarArchivo(id: string) {
  const usuario = await sesionOFalla();
  const archivo = await prisma.archivo.findUnique({ where: { id }, include: { cliente: true } });
  if (!archivo) throw new Error("Archivo no encontrado");
  if (!puede(usuario, "editar_cliente", archivo.cliente)) throw new Error("No autorizado");

  await prisma.archivo.update({ where: { id }, data: { eliminadoEn: new Date() } });
  await eliminarArchivoAlmacenamiento(archivo.url);
  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: "eliminar_archivo",
    entidadTipo: "archivo",
    entidadId: id,
  });
  revalidatePath(`/clientes/${archivo.clienteId}`);
}
