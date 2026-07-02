import { prisma } from "@/lib/prisma";

type ParametrosEvento = {
  clienteId: string;
  tipo: string;
  descripcion: string;
  autorId?: string | null;
  metadata?: Record<string, unknown>;
  fecha?: Date;
};

export async function registrarEvento(params: ParametrosEvento) {
  return prisma.eventoTimeline.create({
    data: {
      clienteId: params.clienteId,
      tipo: params.tipo,
      descripcion: params.descripcion,
      autorId: params.autorId ?? null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      fecha: params.fecha ?? new Date(),
    },
  });
}
