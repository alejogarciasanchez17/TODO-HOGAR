import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { filtroPorRol } from "@/lib/permisos";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { formatoMoneda } from "@/lib/config-negocio";
import { ListaPagos } from "./ListaPagos";

export const metadata: Metadata = { title: "Pagos" };

export default async function PaginaPagos({ searchParams }: { searchParams: Promise<{ estatus?: string; metodo?: string }> }) {
  const sp = await searchParams;
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };
  const config = await obtenerConfiguracionNegocio();

  const dondeCliente = filtroPorRol(usuario, "vendedorId");
  const where = {
    eliminadoEn: null,
    cliente: { eliminadoEn: null, ...dondeCliente },
    ...(sp.estatus ? { estatus: sp.estatus } : {}),
    ...(sp.metodo ? { metodo: sp.metodo } : {}),
  };

  const [pagos, clientesActivos] = await Promise.all([
    prisma.pago.findMany({
      where,
      include: { cliente: { select: { id: true, nombre: true } } },
      orderBy: { creadoEn: "desc" },
      take: 300,
    }),
    prisma.cliente.findMany({
      where: { eliminadoEn: null, estadoCartera: "ACTIVO", ...dondeCliente },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const cobradoMes = pagos
    .filter((p) => p.estatus === "pagado" && p.fechaPago && p.fechaPago >= inicioMes)
    .reduce((acc, p) => acc + p.monto, 0);
  const pendiente = pagos.filter((p) => p.estatus === "pendiente").reduce((acc, p) => acc + p.monto, 0);
  const vencido = pagos.filter((p) => p.estatus === "vencido").reduce((acc, p) => acc + p.monto, 0);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="Wallet" className="size-7" style={{ color: "var(--color-acento-pagos)" }} />
          <h1 className="text-3xl font-semibold text-texto">Pagos</h1>
          <TooltipInfo texto="Pagos vencidos: ya te dijeron que sí pero no han pagado." consejo="Cobrar esto es la venta más fácil." />
        </div>
        <p className="mt-1 text-texto-suave">Lo que cobraste y lo que falta</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-4">
          <p className="text-sm text-texto-suave">Cobrado este mes</p>
          <p className="text-2xl font-semibold text-exito">{formatoMoneda(cobradoMes, config.moneda)}</p>
        </div>
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-4">
          <p className="text-sm text-texto-suave">Pendiente de cobrar</p>
          <p className="text-2xl font-semibold text-advertencia">{formatoMoneda(pendiente, config.moneda)}</p>
        </div>
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-4">
          <p className="text-sm text-texto-suave">Vencido (cóbralo ya)</p>
          <p className="text-2xl font-semibold text-peligro">{formatoMoneda(vencido, config.moneda)}</p>
        </div>
      </div>

      <ListaPagos
        pagos={JSON.parse(JSON.stringify(pagos))}
        moneda={config.moneda}
        metodosPago={config.metodosPago}
        clientes={clientesActivos}
        filtrosActuales={{ estatus: sp.estatus ?? "", metodo: sp.metodo ?? "" }}
      />
    </div>
  );
}
