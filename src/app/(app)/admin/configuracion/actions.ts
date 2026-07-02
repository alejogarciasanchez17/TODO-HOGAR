"use server";

import { revalidatePath } from "next/cache";
import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export async function actualizarConfiguracion(_estadoPrevio: string | undefined, formData: FormData) {
  const admin = await requerirAdmin();

  const etapas = String(formData.get("etapasEmbudo") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const metodos = String(formData.get("metodosPago") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const motivos = String(formData.get("motivosPerdida") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (etapas.length === 0) return "Debes tener al menos una etapa en el embudo.";

  await prisma.configuracionNegocio.update({
    where: { id: "default" },
    data: {
      nombreNegocio: String(formData.get("nombreNegocio") ?? "todo hogar"),
      colorMarca: String(formData.get("colorMarca") ?? "#e8b763"),
      moneda: String(formData.get("moneda") ?? "MXN"),
      husoHorario: String(formData.get("husoHorario") ?? "America/Mexico_City"),
      horarioInicio: String(formData.get("horarioInicio") ?? "15:00"),
      horarioFin: String(formData.get("horarioFin") ?? "20:00"),
      duracionCitaMin: Number(formData.get("duracionCitaMin") ?? 15),
      etapasEmbudo: JSON.stringify(etapas),
      metodosPago: JSON.stringify(metodos),
      motivosPerdida: JSON.stringify(motivos),
      mensajeWhatsappTipo: String(formData.get("mensajeWhatsappTipo") ?? ""),
      metaMensualClientes: Number(formData.get("metaMensualClientes") ?? 20),
      umbralEstancamientoDias: Number(formData.get("umbralEstancamientoDias") ?? 7),
      comisionGlobalPct: formData.get("comisionGlobalPct") ? Number(formData.get("comisionGlobalPct")) : null,
    },
  });

  await registrarAuditoria({ usuarioId: admin.id, accion: "editar_configuracion_negocio", entidadTipo: "configuracion", entidadId: "default" });
  revalidatePath("/admin/configuracion");
  revalidatePath("/dashboard");
  return "OK";
}
