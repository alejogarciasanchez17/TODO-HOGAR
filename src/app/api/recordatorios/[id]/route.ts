import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { marcarRecordatorioHecho, posponerRecordatorio } from "@/lib/notificaciones";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await auth();
  if (!sesion?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const cuerpo = await request.json().catch(() => ({}));

  if (cuerpo.accion === "posponer") {
    await posponerRecordatorio(id, sesion.user.id);
  } else {
    await marcarRecordatorioHecho(id, sesion.user.id);
  }

  return NextResponse.json({ ok: true });
}
