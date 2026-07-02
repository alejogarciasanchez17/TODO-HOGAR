import { prisma } from "@/lib/prisma";

type ParametrosAuditoria = {
  usuarioId: string | null | undefined;
  accion: string;
  entidadTipo: string;
  entidadId?: string | null;
  detalle?: Record<string, unknown>;
  ip?: string | null;
};

/** Registra una acción en la bitácora. Nunca debe tronar el flujo principal. */
export async function registrarAuditoria(params: ParametrosAuditoria) {
  try {
    await prisma.registroAuditoria.create({
      data: {
        usuarioId: params.usuarioId ?? null,
        accion: params.accion,
        entidadTipo: params.entidadTipo,
        entidadId: params.entidadId ?? null,
        detalle: params.detalle ? JSON.stringify(params.detalle) : null,
        ip: params.ip ?? null,
      },
    });
  } catch (error) {
    console.error("No se pudo registrar en la bitácora de auditoría:", error);
  }
}
