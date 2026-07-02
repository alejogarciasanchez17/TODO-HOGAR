import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { obtenerConfiguracionNegocio, formatoMoneda } from "@/lib/config-negocio";
import { obtenerDatosDashboard } from "@/lib/dashboard";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { Badge } from "@/components/ui/Badge";
import { GraficaCrecimiento } from "./GraficaCrecimiento";
import { NumeroGrande } from "./NumeroGrande";

export const metadata: Metadata = { title: "Tablero" };

export default async function PaginaDashboard() {
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };
  const esAdmin = sesion!.user.rol === "ADMIN";
  const config = await obtenerConfiguracionNegocio();
  const d = await obtenerDatosDashboard(usuario);

  const metaMensual = config.metaMensualClientes;
  const pctMeta = metaMensual > 0 ? Math.min(100, Math.round((d.ganadosMes / metaMensual) * 100)) : 0;
  const diasRestantes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();

  const semaforo = pctMeta >= 90 ? "🟢" : pctMeta >= 60 ? "🟡" : "🔴";
  const faltanClientes = Math.max(0, metaMensual - d.ganadosMes);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="LayoutDashboard" className="size-7" style={{ color: "var(--color-acento-dashboard)" }} />
          <h1 className="text-3xl font-semibold text-texto">Tablero</h1>
          <TooltipInfo texto="El resumen de tu mes: metas, crecimiento y pronóstico." consejo="Revísalo cada mañana junto con Hoy te toca." />
        </div>
        <p className="mt-1 text-texto-suave">¿Vas a cerrar el mes?</p>
      </div>

      <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-texto">Meta del mes: {d.ganadosMes} de {metaMensual} clientes</p>
          <Badge tono={pctMeta >= 90 ? "exito" : pctMeta >= 60 ? "advertencia" : "peligro"}>{semaforo} {pctMeta}%</Badge>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-superficie-2">
          <div className="h-full rounded-full bg-marca transition-all" style={{ width: `${pctMeta}%` }} />
        </div>
        <p className="mt-2 text-sm text-texto-suave">
          {faltanClientes > 0
            ? `Necesitas cerrar ${faltanClientes} clientes más en ${diasRestantes} días.`
            : "¡Meta del mes cumplida! 🎉"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <NumeroGrande titulo="Nuevos interesados" valor={String(d.nuevosMes)} variacion={d.nuevosVariacion} />
        <NumeroGrande titulo="Citas agendadas" valor={String(d.citasMes)} variacion={d.citasVariacion} />
        <NumeroGrande titulo="Citas canceladas o eliminadas" valor={String(d.citasCanceladasMes)} tono="peligro" />
        <NumeroGrande titulo="Propuestas enviadas" valor={String(d.propuestasMes)} />
        <NumeroGrande titulo="Clientes ganados" valor={String(d.ganadosMes)} variacion={d.ganadosVariacion} />
        <NumeroGrande titulo="Ingresos cobrados" valor={formatoMoneda(d.ingresosMes, config.moneda)} variacion={d.ingresosVariacion} />
        <NumeroGrande titulo="Pagos vencidos" valor={formatoMoneda(d.vencidoMonto, config.moneda)} tono="peligro" />
      </div>

      <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-semibold text-texto">Crecimiento — últimos 6 meses</h2>
          <TooltipInfo texto="Ingresos cobrados (barras) y clientes ganados (línea) mes con mes." />
        </div>
        <GraficaCrecimiento datos={d.crecimiento6Meses} moneda={config.moneda} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5">
          <p className="text-sm text-texto-suave">Tasa de cierre histórica</p>
          <p className="text-2xl font-semibold text-texto">{d.tasaCierre}%</p>
        </div>
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5">
          <p className="text-sm text-texto-suave">Dinero vivo en el embudo</p>
          <p className="text-2xl font-semibold text-texto">{formatoMoneda(d.valorEmbudo, config.moneda)}</p>
        </div>
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5">
          <p className="flex items-center gap-1.5 text-sm text-texto-suave">
            Pronóstico de cierre
            <TooltipInfo texto="Suma el valor del embudo ponderado por la probabilidad de cada etapa." />
          </p>
          <p className="text-2xl font-semibold text-texto">{formatoMoneda(d.pronostico, config.moneda)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5">
          <h2 className="mb-3 font-semibold text-texto">De dónde llegan mis clientes</h2>
          {d.porOrigen.length === 0 ? (
            <p className="text-sm text-texto-suave">Aún juntando historial, esto se llena solo.</p>
          ) : (
            <div className="space-y-2">
              {d.porOrigen
                .sort((a, b) => b.valor - a.valor)
                .map((o) => (
                  <div key={o.origen} className="flex items-center justify-between text-sm">
                    <span className="text-texto">{o.origen}</span>
                    <span className="text-texto-suave">{o.clientes} · {formatoMoneda(o.valor, config.moneda)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5">
          <h2 className="mb-3 font-semibold text-texto">Por qué perdemos ventas</h2>
          {d.porQuePerdemos.length === 0 ? (
            <p className="text-sm text-texto-suave">Aún no hay clientes perdidos registrados.</p>
          ) : (
            <div className="space-y-2">
              {d.porQuePerdemos
                .sort((a, b) => b.cantidad - a.cantidad)
                .map((m) => (
                  <div key={m.motivo} className="flex items-center justify-between text-sm">
                    <span className="text-texto">{m.motivo}</span>
                    <span className="text-texto-suave">{m.cantidad}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {esAdmin && (
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5">
          <h2 className="mb-3 font-semibold text-texto">Ranking del equipo (este mes)</h2>
          <div className="space-y-2">
            {d.rankingEquipo.map((v, i) => {
              const medallas = ["🥇", "🥈", "🥉"];
              const pct = v.meta > 0 ? Math.round((v.ganados / v.meta) * 100) : 0;
              return (
                <div key={v.nombre} className="flex items-center justify-between text-sm">
                  <span className="text-texto">{medallas[i] ?? ""} {v.nombre}</span>
                  <span className="text-texto-suave">{v.ganados} cierres · {formatoMoneda(v.ingresos, config.moneda)} · {pct}% de meta</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
