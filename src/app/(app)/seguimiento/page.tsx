import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio, formatoMoneda } from "@/lib/config-negocio";
import { filtroPorRol } from "@/lib/permisos";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { PanelSeguimiento } from "./PanelSeguimiento";

export const metadata: Metadata = { title: "Hoy te toca" };

const ORDEN_TEMP: Record<string, number> = { CALIENTE: 0, TIBIO: 1, FRIO: 2 };

export default async function PaginaSeguimiento() {
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };
  const config = await obtenerConfiguracionNegocio();

  const finHoy = new Date();
  finHoy.setHours(23, 59, 59, 999);
  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const dondeMios = filtroPorRol(usuario, "vendedorId");

  const [porContactar, sinSeguimiento, leadsFrios, recordatorios, citasHoy, ganadosMes, usuarioActual] = await Promise.all([
    prisma.cliente.findMany({
      where: { eliminadoEn: null, estadoCartera: "ACTIVO", proximaAccionFecha: { lte: finHoy, not: null }, ...dondeMios },
      include: { vendedor: { select: { nombre: true } } },
      take: 100,
    }),
    prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "ACTIVO", proximaAccionFecha: null, ...dondeMios } }),
    prisma.cliente.findMany({
      where: { eliminadoEn: null, estadoCartera: "ACTIVO", etapa: "Nuevo", ultimoContactoEn: null, creadoEn: { lt: hace24h }, ...dondeMios },
      select: { id: true, nombre: true, creadoEn: true },
      take: 20,
    }),
    prisma.recordatorio.findMany({
      where: { usuarioId: usuario.id, hecho: false },
      orderBy: { fecha: "asc" },
      include: { cliente: { select: { id: true, nombre: true } } },
    }),
    prisma.cita.findMany({
      where: { eliminadoEn: null, estado: { not: "cancelada" }, fecha: { gte: inicioHoy, lte: finHoy }, ...dondeMios },
      include: { cliente: { select: { id: true, nombre: true } } },
      orderBy: { fecha: "asc" },
    }),
    prisma.cliente.aggregate({
      where: { eliminadoEn: null, estadoCartera: "GANADO", ultimaCompra: { gte: inicioMes }, ...dondeMios },
      _count: true,
    }),
    prisma.usuario.findUnique({ where: { id: usuario.id }, select: { metaMensual: true, nombre: true } }),
  ]);

  const enRiesgo = porContactar.filter((c) => c.temperatura !== "FRIO").length;

  let tiempoPromedioHoras: number | null = null;
  if (usuario.rol === "ADMIN") {
    const contactados = await prisma.cliente.findMany({
      where: { eliminadoEn: null, ultimoContactoEn: { not: null } },
      select: { creadoEn: true, ultimoContactoEn: true },
      take: 200,
      orderBy: { creadoEn: "desc" },
    });
    if (contactados.length > 0) {
      const totalHoras = contactados.reduce((acc, c) => acc + (c.ultimoContactoEn!.getTime() - c.creadoEn.getTime()) / 3600000, 0);
      tiempoPromedioHoras = Math.round(totalHoras / contactados.length);
    }
  }

  const ordenados = [...porContactar].sort((a, b) => {
    const t = ORDEN_TEMP[a.temperatura] - ORDEN_TEMP[b.temperatura];
    return t !== 0 ? t : b.valorEstimado - a.valorEstimado;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="ListChecks" className="size-7" style={{ color: "var(--color-acento-tareas)" }} />
          <h1 className="text-3xl font-semibold text-texto">Seguimiento</h1>
          <TooltipInfo texto="A quién toca contactar hoy." consejo="Ábrelo cada mañana antes que nada." />
        </div>
        <p className="mt-1 text-texto-suave">A quién toca contactar hoy</p>
      </div>

      <PanelSeguimiento
        nombreUsuario={usuarioActual?.nombre ?? ""}
        porContactar={JSON.parse(JSON.stringify(ordenados))}
        sinSeguimiento={sinSeguimiento}
        leadsFrios={JSON.parse(JSON.stringify(leadsFrios))}
        recordatorios={JSON.parse(JSON.stringify(recordatorios))}
        citasHoy={JSON.parse(JSON.stringify(citasHoy))}
        metaMensual={usuarioActual?.metaMensual ?? 0}
        ganadosMes={ganadosMes._count}
        enRiesgo={enRiesgo}
        moneda={config.moneda}
        esAdmin={usuario.rol === "ADMIN"}
        tiempoPromedioHoras={tiempoPromedioHoras}
      />
    </div>
  );
}
