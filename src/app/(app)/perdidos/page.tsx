import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { filtroPorRol } from "@/lib/permisos";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { BotonReactivar } from "./BotonReactivar";

export const metadata: Metadata = { title: "Perdidos" };

export default async function PaginaPerdidos() {
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };

  const clientes = await prisma.cliente.findMany({
    where: { eliminadoEn: null, estadoCartera: "PERDIDO", ...filtroPorRol(usuario, "vendedorId") },
    include: { vendedor: { select: { nombre: true } } },
    orderBy: { actualizadoEn: "desc" },
  });

  const motivos = clientes.reduce<Record<string, number>>((acc, c) => {
    const m = c.motivoPerdida ?? "Sin motivo";
    acc[m] = (acc[m] ?? 0) + 1;
    return acc;
  }, {});
  const motivosOrdenados = Object.entries(motivos).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="XCircle" className="size-7" style={{ color: "var(--color-acento-perdidos)" }} />
          <h1 className="text-3xl font-semibold text-texto">Perdidos</h1>
          <TooltipInfo texto="Clientes que no cerraron." consejo="Revisa el motivo más común y ataca esa objeción de raíz." />
        </div>
        <p className="mt-1 text-texto-suave">Aprende por qué y reactiva · {clientes.length} clientes</p>
      </div>

      {motivosOrdenados.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {motivosOrdenados.map(([motivo, n]) => (
            <span key={motivo} className="rounded-full bg-superficie-2 px-3 py-1.5 text-sm text-texto-suave">{motivo}: {n}</span>
          ))}
        </div>
      )}

      {clientes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radio-lg)] border border-borde bg-superficie py-16 text-center">
          <Icono nombre="XCircle" className="size-10 text-texto-tenue" />
          <p className="text-lg font-medium text-texto">No hay clientes perdidos.</p>
        </div>
      ) : (
        <div className="divide-y divide-borde rounded-[var(--radio-lg)] border border-borde bg-superficie">
          {clientes.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/clientes/${c.id}`} className="font-medium text-texto hover:text-marca-fuerte hover:underline">{c.nombre}</Link>
                <p className="text-sm text-texto-suave">{c.motivoPerdida ?? "Sin motivo"}{c.motivoPerdidaOtro ? `: ${c.motivoPerdidaOtro}` : ""} {usuario.rol === "ADMIN" && `· ${c.vendedor.nombre}`}</p>
              </div>
              <BotonReactivar id={c.id} nombre={c.nombre} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
