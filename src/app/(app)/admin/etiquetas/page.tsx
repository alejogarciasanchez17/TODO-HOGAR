import type { Metadata } from "next";
import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { ListaEtiquetas } from "./ListaEtiquetas";

export const metadata: Metadata = { title: "Etiquetas" };

export default async function PaginaEtiquetas() {
  await requerirAdmin();
  const etiquetas = await prisma.etiqueta.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, color: true, _count: { select: { clientes: true } } },
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="Tag" className="size-7" style={{ color: "var(--color-acento-admin)" }} />
          <h1 className="text-3xl font-semibold text-texto">Etiquetas</h1>
          <TooltipInfo texto="Las etiquetas que puedes ponerle a un cliente desde su ficha." consejo="Úsalas para lo que necesites filtrar rápido: forma de pago, cómo llegó, tipo de cliente." />
        </div>
        <p className="mt-1 text-texto-suave">Personaliza las etiquetas de tus clientes</p>
      </div>

      <ListaEtiquetas
        etiquetas={etiquetas.map((e) => ({ id: e.id, nombre: e.nombre, color: e.color, clientes: e._count.clientes }))}
      />
    </div>
  );
}
