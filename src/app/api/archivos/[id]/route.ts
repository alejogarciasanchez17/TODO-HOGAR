import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permisos";

// Los archivos son privados: solo el admin o el vendedor dueño del cliente
// pueden verlos (nunca por URL adivinable sin sesión).
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sesion = await auth();
  if (!sesion?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const archivo = await prisma.archivo.findFirst({
    where: { id, eliminadoEn: null },
    include: { cliente: { select: { vendedorId: true } } },
  });
  if (!archivo) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  if (!puede({ id: sesion.user.id, rol: sesion.user.rol }, "editar_cliente", { vendedorId: archivo.cliente.vendedorId })) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (!archivo.datos) return NextResponse.json({ error: "Este archivo no tiene contenido guardado" }, { status: 404 });

  return new NextResponse(new Uint8Array(archivo.datos), {
    headers: {
      "Content-Type": archivo.tipoMime,
      "Content-Disposition": `inline; filename="${encodeURIComponent(archivo.nombreArchivo)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
