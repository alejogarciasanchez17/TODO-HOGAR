import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { filtroPorRol } from "@/lib/permisos";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { BotonRestaurar } from "./BotonRestaurar";

export const metadata: Metadata = { title: "Archivados" };

export default async function PaginaArchivados() {
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };

  const clientes = await prisma.cliente.findMany({
    where: { eliminadoEn: null, estadoCartera: "ARCHIVADO", ...filtroPorRol(usuario, "vendedorId") },
    include: { vendedor: { select: { nombre: true } } },
    orderBy: { actualizadoEn: "desc" },
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="Archive" className="size-7" style={{ color: "var(--color-acento-archivados)" }} />
          <h1 className="text-3xl font-semibold text-texto">Archivados</h1>
          <TooltipInfo texto="Clientes guardados sin borrar nada." consejo="Restáuralos cuando quieras retomar el contacto." />
        </div>
        <p className="mt-1 text-texto-suave">Guardados sin perder nada · {clientes.length} clientes</p>
      </div>

      {clientes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radio-lg)] border border-borde bg-superficie py-16 text-center">
          <Icono nombre="Archive" className="size-10 text-texto-tenue" />
          <p className="text-lg font-medium text-texto">No hay nada archivado.</p>
        </div>
      ) : (
        <div className="divide-y divide-borde rounded-[var(--radio-lg)] border border-borde bg-superficie">
          {clientes.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/clientes/${c.id}`} className="font-medium text-texto hover:text-marca-fuerte hover:underline">{c.nombre}</Link>
                <p className="text-sm text-texto-suave">{usuario.rol === "ADMIN" && c.vendedor.nombre}</p>
              </div>
              <BotonRestaurar id={c.id} nombre={c.nombre} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
