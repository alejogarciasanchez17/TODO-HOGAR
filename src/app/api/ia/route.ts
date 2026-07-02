import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permisos";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { formatoRelativo } from "@/lib/utils-fecha";
import { ejecutarAccionIA, type AccionIA } from "@/lib/ia";

export async function POST(request: NextRequest) {
  const sesion = await auth();
  if (!sesion?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { clienteId, accion } = (await request.json().catch(() => ({}))) as {
    clienteId?: string;
    accion?: AccionIA;
  };
  if (!clienteId || !accion) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const cliente = await prisma.cliente.findFirst({
    where: { id: clienteId, eliminadoEn: null },
    include: { eventosTimeline: { orderBy: { fecha: "desc" }, take: 5 } },
  });
  if (!cliente || !puede({ id: sesion.user.id, rol: sesion.user.rol }, "editar_cliente", { vendedorId: cliente.vendedorId })) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const config = await obtenerConfiguracionNegocio();

  const resultado = await ejecutarAccionIA(accion, {
    nombre: cliente.nombre,
    etapa: cliente.etapa,
    temperatura: cliente.temperatura,
    objecionPrincipal: cliente.objecionPrincipal,
    valorEstimado: cliente.valorEstimado,
    notas: cliente.notas,
    ultimoContactoTexto: cliente.ultimoContactoEn ? formatoRelativo(cliente.ultimoContactoEn) : "sin contacto previo",
    mensajeTipo: config.mensajeWhatsappTipo,
    eventosRecientes: cliente.eventosTimeline.map((e) => e.descripcion),
  });

  return NextResponse.json({ texto: resultado.texto, local: resultado.local, accionSugerida: "accionSugerida" in resultado ? resultado.accionSugerida : undefined, fechaSugerida: "fechaSugerida" in resultado ? resultado.fechaSugerida : undefined });
}
