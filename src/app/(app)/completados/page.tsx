import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio, formatoMoneda } from "@/lib/config-negocio";
import { filtroPorRol } from "@/lib/permisos";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { ListaCompletados } from "./ListaCompletados";

export const metadata: Metadata = { title: "Completados" };

export default async function PaginaCompletados({ searchParams }: { searchParams: Promise<{ orden?: string }> }) {
  const sp = await searchParams;
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };
  const config = await obtenerConfiguracionNegocio();

  const clientes = await prisma.cliente.findMany({
    where: { eliminadoEn: null, estadoCartera: "GANADO", ...filtroPorRol(usuario, "vendedorId") },
    include: { vendedor: { select: { nombre: true } } },
    orderBy: sp.orden === "monto" ? { valorEstimado: "desc" } : { ultimaCompra: "desc" },
  });

  const total = clientes.reduce((acc, c) => acc + c.valorEstimado, 0);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="Trophy" className="size-7" style={{ color: "var(--color-acento-completados)" }} />
          <h1 className="text-3xl font-semibold text-texto">Completados</h1>
          <TooltipInfo texto="Los clientes que ya cerraste y terminaron de pagar." consejo="Pídeles referidos: es el momento perfecto." />
        </div>
        <p className="mt-1 text-texto-suave">
          Tu muro de victorias · {clientes.length} clientes · {formatoMoneda(total, config.moneda)} ganados
        </p>
      </div>

      {clientes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radio-lg)] border border-borde bg-superficie py-16 text-center">
          <Icono nombre="Trophy" className="size-10 text-texto-tenue" />
          <p className="text-lg font-medium text-texto">Aún no tienes clientes completados.</p>
          <p className="text-texto-suave">Cierra tu primera venta y aparecerá aquí 🎉</p>
        </div>
      ) : (
        <ListaCompletados clientes={JSON.parse(JSON.stringify(clientes))} moneda={config.moneda} esAdmin={usuario.rol === "ADMIN"} orden={sp.orden ?? ""} />
      )}
    </div>
  );
}
