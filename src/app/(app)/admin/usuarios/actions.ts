"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

const COSTO_HASH = 12;

function slugDesdeNombre(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const usuarioSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre"),
  correo: z.string().trim().email("Correo no válido").transform((v) => v.toLowerCase()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(["ADMIN", "VENDEDOR", "LECTURA"]),
  metaMensual: z.coerce.number().min(0).default(0),
  comisionPct: z.coerce.number().min(0).max(100).optional(),
});

export async function crearUsuario(_estadoPrevio: string | undefined, formData: FormData) {
  await requerirAdmin();
  const datos = Object.fromEntries(formData.entries());
  const parseo = usuarioSchema.safeParse(datos);
  if (!parseo.success) return parseo.error.issues[0]?.message ?? "Revisa los datos.";

  const existente = await prisma.usuario.findUnique({ where: { correo: parseo.data.correo } });
  if (existente) return "Ya existe un usuario con ese correo.";

  let slug = slugDesdeNombre(parseo.data.nombre);
  const chocaSlug = await prisma.usuario.findUnique({ where: { slugAgenda: slug } });
  if (chocaSlug) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

  const passwordHash = await bcrypt.hash(parseo.data.password, COSTO_HASH);
  const usuario = await prisma.usuario.create({
    data: {
      nombre: parseo.data.nombre,
      correo: parseo.data.correo,
      passwordHash,
      rol: parseo.data.rol,
      metaMensual: parseo.data.metaMensual,
      comisionPct: parseo.data.comisionPct || null,
      slugAgenda: slug,
    },
  });

  const admin = await requerirAdmin();
  await registrarAuditoria({ usuarioId: admin.id, accion: "crear_usuario", entidadTipo: "usuario", entidadId: usuario.id });
  revalidatePath("/admin/usuarios");
  return "OK";
}

export async function actualizarUsuario(id: string, formData: FormData) {
  const admin = await requerirAdmin();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const rol = String(formData.get("rol") ?? "VENDEDOR");
  const metaMensual = Number(formData.get("metaMensual") ?? 0);
  const comisionPct = formData.get("comisionPct") ? Number(formData.get("comisionPct")) : null;
  if (!nombre) throw new Error("El nombre no puede quedar vacío");

  await prisma.usuario.update({ where: { id }, data: { nombre, rol, metaMensual, comisionPct } });
  await registrarAuditoria({ usuarioId: admin.id, accion: "editar_usuario", entidadTipo: "usuario", entidadId: id });
  revalidatePath("/admin/usuarios");
}

export async function alternarActivoUsuario(id: string) {
  const admin = await requerirAdmin();
  if (id === admin.id) throw new Error("No puedes desactivarte a ti mismo");
  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario) throw new Error("Usuario no encontrado");

  await prisma.usuario.update({ where: { id }, data: { activo: !usuario.activo } });
  await registrarAuditoria({
    usuarioId: admin.id,
    accion: usuario.activo ? "desactivar_usuario" : "activar_usuario",
    entidadTipo: "usuario",
    entidadId: id,
  });
  revalidatePath("/admin/usuarios");
}

export async function resetearPasswordUsuario(id: string, nuevaPassword: string) {
  const admin = await requerirAdmin();
  if (nuevaPassword.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres");

  const passwordHash = await bcrypt.hash(nuevaPassword, COSTO_HASH);
  await prisma.usuario.update({ where: { id }, data: { passwordHash, intentosFallidos: 0, bloqueadoHasta: null } });
  await registrarAuditoria({ usuarioId: admin.id, accion: "resetear_password", entidadTipo: "usuario", entidadId: id });
  revalidatePath("/admin/usuarios");
}
