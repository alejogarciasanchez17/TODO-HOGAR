import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { filtroPorRol } from "@/lib/permisos";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { TableroEmbudo } from "./TableroEmbudo";

export const metadata: Metadata = { title: "Embudo" };

export default async function PaginaEmbudo() {
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };
  const config = await obtenerConfiguracionNegocio();

  const [clientes, completados, perdidos, archivados] = await Promise.all([
    prisma.cliente.findMany({
      where: { eliminadoEn: null, estadoCartera: "ACTIVO", ...filtroPorRol(usuario, "vendedorId") },
      orderBy: { actualizadoEn: "desc" },
      include: { vendedor: { select: { nombre: true } } },
    }),
    prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "GANADO", ...filtroPorRol(usuario, "vendedorId") } }),
    prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "PERDIDO", ...filtroPorRol(usuario, "vendedorId") } }),
    prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "ARCHIVADO", ...filtroPorRol(usuario, "vendedorId") } }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="KanbanSquare" className="size-7" style={{ color: "var(--color-acento-embudo)" }} />
          <h1 className="text-3xl font-semibold text-texto">Embudo</h1>
          <TooltipInfo
            texto="Arrastra cada cliente a la etapa en la que va."
            consejo="Abajo de cada columna ves cuánto dinero hay ahí."
          />
        </div>
        <p className="mt-1 text-texto-suave">Mueve a cada cliente hacia la venta · solo se muestran clientes activos</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href="/completados" className="flex items-center gap-1.5 rounded-full bg-superficie-2 px-3 py-1.5 text-sm font-medium text-texto-suave hover:bg-superficie">
          <Icono nombre="Trophy" className="size-4 text-exito" /> Completados ({completados})
        </a>
        <a href="/perdidos" className="flex items-center gap-1.5 rounded-full bg-superficie-2 px-3 py-1.5 text-sm font-medium text-texto-suave hover:bg-superficie">
          <Icono nombre="XCircle" className="size-4" /> Perdidos ({perdidos})
        </a>
        <a href="/archivados" className="flex items-center gap-1.5 rounded-full bg-superficie-2 px-3 py-1.5 text-sm font-medium text-texto-suave hover:bg-superficie">
          <Icono nombre="Archive" className="size-4" /> Archivados ({archivados})
        </a>
      </div>

      <TableroEmbudo
        etapas={config.etapasEmbudo}
        clientes={JSON.parse(JSON.stringify(clientes))}
        moneda={config.moneda}
        umbralDias={config.umbralEstancamientoDias}
        esAdmin={sesion!.user.rol === "ADMIN"}
      />
    </div>
  );
}
