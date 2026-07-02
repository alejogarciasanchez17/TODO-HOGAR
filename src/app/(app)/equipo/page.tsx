import type { Metadata } from "next";
import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio, formatoMoneda } from "@/lib/config-negocio";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Equipo" };

const MEDALLAS = ["🥇", "🥈", "🥉"];

export default async function PaginaEquipo() {
  await requerirAdmin();
  const config = await obtenerConfiguracionNegocio();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const vendedores = await prisma.usuario.findMany({
    where: { activo: true, eliminadoEn: null },
    orderBy: { nombre: "asc" },
  });

  const filas = await Promise.all(
    vendedores.map(async (v) => {
      const [ganados, ingresos, enRiesgo, pagosVencidos] = await Promise.all([
        prisma.cliente.count({ where: { vendedorId: v.id, eliminadoEn: null, estadoCartera: "GANADO", ultimaCompra: { gte: inicioMes } } }),
        prisma.pago.aggregate({
          where: { registradoPorId: v.id, eliminadoEn: null, estatus: "pagado", fechaPago: { gte: inicioMes } },
          _sum: { monto: true },
        }),
        prisma.cliente.count({
          where: {
            vendedorId: v.id,
            eliminadoEn: null,
            estadoCartera: "ACTIVO",
            temperatura: { not: "FRIO" },
            OR: [{ proximaAccionFecha: null }, { proximaAccionFecha: { lt: new Date() } }],
          },
        }),
        prisma.pago.aggregate({
          where: { cliente: { vendedorId: v.id, eliminadoEn: null }, eliminadoEn: null, estatus: "vencido" },
          _sum: { monto: true },
        }),
      ]);

      const ingresosMes = ingresos._sum.monto ?? 0;
      const pctMeta = v.metaMensual > 0 ? Math.round((ganados / v.metaMensual) * 100) : 0;
      const comision = v.comisionPct ?? config.comisionGlobalPct;

      return {
        id: v.id,
        nombre: v.nombre,
        ganados,
        ingresosMes,
        enRiesgo,
        pagosVencidos: pagosVencidos._sum.monto ?? 0,
        pctMeta,
        comisionGanada: comision ? Math.round((ingresosMes * comision) / 100) : null,
      };
    })
  );

  filas.sort((a, b) => b.ingresosMes - a.ingresosMes);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="UserCog" className="size-7" style={{ color: "var(--color-acento-equipo)" }} />
          <h1 className="text-3xl font-semibold text-texto">Equipo</h1>
          <TooltipInfo texto="Cómo va cada quien contra su meta del mes." consejo="El semáforo rojo significa que necesita ayuda para cerrar." />
        </div>
        <p className="mt-1 text-texto-suave">Tu gente y sus metas</p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radio-lg)] border border-borde bg-superficie">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-borde text-left text-texto-suave">
            <tr>
              <th className="p-3">Vendedor</th>
              <th className="p-3">Cerrados</th>
              <th className="p-3">Ingresos del mes</th>
              <th className="p-3">% de meta</th>
              <th className="p-3">En riesgo</th>
              <th className="p-3">Vencido por cobrar</th>
              {filas.some((f) => f.comisionGanada !== null) && <th className="p-3">Comisión</th>}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={f.id} className="border-b border-borde last:border-0">
                <td className="p-3 font-medium text-texto">{MEDALLAS[i] ?? ""} {f.nombre}</td>
                <td className="p-3">{f.ganados}</td>
                <td className="p-3">{formatoMoneda(f.ingresosMes, config.moneda)}</td>
                <td className="p-3">
                  <span className={cn("inline-flex size-2.5 rounded-full", f.pctMeta >= 100 ? "bg-exito" : f.pctMeta >= 60 ? "bg-advertencia" : "bg-peligro")} />{" "}
                  {f.pctMeta}%
                </td>
                <td className="p-3">{f.enRiesgo > 0 ? <span className="font-medium text-advertencia">{f.enRiesgo}</span> : "0"}</td>
                <td className="p-3">{f.pagosVencidos > 0 ? <span className="font-medium text-peligro">{formatoMoneda(f.pagosVencidos, config.moneda)}</span> : "—"}</td>
                {filas.some((x) => x.comisionGanada !== null) && (
                  <td className="p-3">{f.comisionGanada !== null ? formatoMoneda(f.comisionGanada, config.moneda) : "—"}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
