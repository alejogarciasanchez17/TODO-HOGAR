import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { marcarMencionLeida } from "@/lib/notificaciones";

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await auth();
  if (!sesion?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  await marcarMencionLeida(id, sesion.user.id);
  return NextResponse.json({ ok: true });
}
