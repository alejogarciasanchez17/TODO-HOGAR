import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { filtroPorRol } from "@/lib/permisos";

// Quita acentos y pasa a minúsculas para que "jose" encuentre "José".
function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export type ResultadoBusqueda = {
  tipo: "cliente" | "cita" | "pago";
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
};

export async function GET(request: NextRequest) {
  const sesion = await auth();
  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ resultados: [] });

  const usuario = { id: sesion.user.id, rol: sesion.user.rol };
  const filtroVendedor = filtroPorRol(usuario, "vendedorId");
  const qNorm = normalizar(q);

  // Trae un conjunto acotado (nunca "todo de golpe") y refina en memoria para
  // tolerar acentos, que SQLite no maneja de forma nativa.
  const [clientes, citas, pagos] = await Promise.all([
    prisma.cliente.findMany({
      where: { eliminadoEn: null, ...filtroVendedor },
      select: {
        id: true,
        nombre: true,
        telefono: true,
        correo: true,
        empresaNombre: true,
        notas: true,
        zona: true,
        etapa: true,
      },
      take: 300,
      orderBy: { actualizadoEn: "desc" },
    }),
    prisma.cita.findMany({
      where: { eliminadoEn: null, ...filtroPorRol(usuario, "vendedorId") },
      select: { id: true, fecha: true, cliente: { select: { id: true, nombre: true } } },
      take: 200,
      orderBy: { fecha: "desc" },
    }),
    prisma.pago.findMany({
      where: { eliminadoEn: null, cliente: { eliminadoEn: null, ...filtroVendedor } },
      select: {
        id: true,
        monto: true,
        concepto: true,
        estatus: true,
        cliente: { select: { id: true, nombre: true } },
      },
      take: 200,
      orderBy: { creadoEn: "desc" },
    }),
  ]);

  const resultados: ResultadoBusqueda[] = [];

  for (const c of clientes) {
    const campos = [c.nombre, c.telefono, c.correo, c.empresaNombre, c.notas, c.zona]
      .filter(Boolean)
      .map((v) => normalizar(String(v)));
    if (campos.some((campo) => campo.includes(qNorm))) {
      resultados.push({
        tipo: "cliente",
        id: c.id,
        titulo: c.nombre,
        subtitulo: c.empresaNombre ? `${c.empresaNombre} · ${c.etapa}` : c.etapa,
        href: `/clientes/${c.id}`,
      });
    }
  }

  for (const cita of citas) {
    if (!cita.cliente) continue;
    if (normalizar(cita.cliente.nombre).includes(qNorm)) {
      resultados.push({
        tipo: "cita",
        id: cita.id,
        titulo: `Cita con ${cita.cliente.nombre}`,
        subtitulo: new Date(cita.fecha).toLocaleString("es-MX", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        href: `/agenda?cliente=${cita.cliente.id}`,
      });
    }
  }

  for (const pago of pagos) {
    if (!pago.cliente) continue;
    const campos = [pago.cliente.nombre, pago.concepto].filter(Boolean).map((v) => normalizar(String(v)));
    if (campos.some((campo) => campo.includes(qNorm))) {
      resultados.push({
        tipo: "pago",
        id: pago.id,
        titulo: `Pago de ${pago.cliente.nombre}`,
        subtitulo: `${pago.estatus} · $${pago.monto.toLocaleString("es-MX")}`,
        href: `/clientes/${pago.cliente.id}#pagos`,
      });
    }
  }

  return NextResponse.json({ resultados: resultados.slice(0, 30) });
}
