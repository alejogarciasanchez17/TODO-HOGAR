import { prisma } from "@/lib/prisma";
import { filtroPorRol, type UsuarioSesion } from "@/lib/permisos";

const PROBABILIDAD_POR_ETAPA: Record<string, number> = {
  Nuevo: 0.05,
  Contactado: 0.2,
  "Cliente de pagares": 0.5,
  "Cliente activo": 0.6,
  "Cita agendada": 0.35,
  "Propuesta enviada": 0.6,
};

function inicioMes(offsetMeses = 0) {
  const f = new Date();
  f.setMonth(f.getMonth() - offsetMeses, 1);
  f.setHours(0, 0, 0, 0);
  return f;
}

function finMes(offsetMeses = 0) {
  const f = inicioMes(offsetMeses);
  f.setMonth(f.getMonth() + 1);
  return f;
}

function variacionPct(actual: number, anterior: number) {
  if (anterior === 0) return actual > 0 ? 100 : 0;
  return Math.round(((actual - anterior) / anterior) * 100);
}

export async function obtenerDatosDashboard(usuario: UsuarioSesion) {
  const dondeMios = filtroPorRol(usuario, "vendedorId");
  const iMes = inicioMes(0);
  const fMes = finMes(0);
  const iMesPasado = inicioMes(1);
  const fMesPasado = finMes(1);

  const [
    nuevosMes,
    nuevosMesPasado,
    citasMes,
    citasMesPasado,
    propuestasMes,
    ganadosMes,
    ganadosMesPasado,
    ingresosMesAgg,
    ingresosMesPasadoAgg,
    pendienteAgg,
    vencidoAgg,
    perdidosMes,
    totalGanadosHistorico,
    totalPerdidosHistorico,
    embudoActivo,
    porOrigenRaw,
    perdidosMotivos,
    vendedores,
  ] = await Promise.all([
    prisma.cliente.count({ where: { eliminadoEn: null, creadoEn: { gte: iMes, lt: fMes }, ...dondeMios } }),
    prisma.cliente.count({ where: { eliminadoEn: null, creadoEn: { gte: iMesPasado, lt: fMesPasado }, ...dondeMios } }),
    prisma.cita.count({ where: { eliminadoEn: null, creadoEn: { gte: iMes, lt: fMes }, ...filtroPorRol(usuario, "vendedorId") } }),
    prisma.cita.count({ where: { eliminadoEn: null, creadoEn: { gte: iMesPasado, lt: fMesPasado }, ...filtroPorRol(usuario, "vendedorId") } }),
    prisma.cliente.count({ where: { eliminadoEn: null, etapa: "Propuesta enviada", actualizadoEn: { gte: iMes, lt: fMes }, ...dondeMios } }),
    prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "GANADO", ultimaCompra: { gte: iMes, lt: fMes }, ...dondeMios } }),
    prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "GANADO", ultimaCompra: { gte: iMesPasado, lt: fMesPasado }, ...dondeMios } }),
    prisma.pago.aggregate({ where: { eliminadoEn: null, estatus: "pagado", fechaPago: { gte: iMes, lt: fMes }, cliente: { eliminadoEn: null, ...dondeMios } }, _sum: { monto: true } }),
    prisma.pago.aggregate({ where: { eliminadoEn: null, estatus: "pagado", fechaPago: { gte: iMesPasado, lt: fMesPasado }, cliente: { eliminadoEn: null, ...dondeMios } }, _sum: { monto: true } }),
    prisma.pago.aggregate({ where: { eliminadoEn: null, estatus: "pendiente", cliente: { eliminadoEn: null, ...dondeMios } }, _sum: { monto: true }, _count: true }),
    prisma.pago.aggregate({ where: { eliminadoEn: null, estatus: "vencido", cliente: { eliminadoEn: null, ...dondeMios } }, _sum: { monto: true }, _count: true }),
    prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "PERDIDO", actualizadoEn: { gte: iMes, lt: fMes }, ...dondeMios } }),
    prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "GANADO", ...dondeMios } }),
    prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "PERDIDO", ...dondeMios } }),
    prisma.cliente.findMany({ where: { eliminadoEn: null, estadoCartera: "ACTIVO", ...dondeMios }, select: { etapa: true, valorEstimado: true } }),
    prisma.cliente.groupBy({ by: ["origen"], where: { eliminadoEn: null, estadoCartera: { not: "ARCHIVADO" }, ...dondeMios }, _count: true, _sum: { valorEstimado: true } }),
    prisma.cliente.groupBy({ by: ["motivoPerdida"], where: { eliminadoEn: null, estadoCartera: "PERDIDO", ...dondeMios }, _count: true }),
    prisma.usuario.findMany({ where: { activo: true, eliminadoEn: null }, select: { id: true, nombre: true, metaMensual: true } }),
  ]);

  // Crecimiento de los últimos 6 meses
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const ini = inicioMes(i);
    const fin = finMes(i);
    const [ingresos, ganados] = await Promise.all([
      prisma.pago.aggregate({ where: { eliminadoEn: null, estatus: "pagado", fechaPago: { gte: ini, lt: fin }, cliente: { eliminadoEn: null, ...dondeMios } }, _sum: { monto: true } }),
      prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "GANADO", ultimaCompra: { gte: ini, lt: fin }, ...dondeMios } }),
    ]);
    meses.push({
      mes: ini.toLocaleDateString("es-MX", { month: "short" }),
      ingresos: ingresos._sum.monto ?? 0,
      clientes: ganados,
    });
  }

  const valorEmbudo = embudoActivo.reduce((acc, c) => acc + c.valorEstimado, 0);
  const pronostico = embudoActivo.reduce((acc, c) => {
    const prob = PROBABILIDAD_POR_ETAPA[c.etapa] ?? 0.15;
    return acc + c.valorEstimado * prob;
  }, 0);

  const tasaCierre = totalGanadosHistorico + totalPerdidosHistorico > 0
    ? Math.round((totalGanadosHistorico / (totalGanadosHistorico + totalPerdidosHistorico)) * 100)
    : 0;

  const rankingEquipo = await Promise.all(
    vendedores.map(async (v) => {
      const [ganados, ingresos] = await Promise.all([
        prisma.cliente.count({ where: { vendedorId: v.id, eliminadoEn: null, estadoCartera: "GANADO", ultimaCompra: { gte: iMes, lt: fMes } } }),
        prisma.pago.aggregate({ where: { registradoPorId: v.id, eliminadoEn: null, estatus: "pagado", fechaPago: { gte: iMes, lt: fMes }, cliente: { eliminadoEn: null } }, _sum: { monto: true } }),
      ]);
      return { nombre: v.nombre, ganados, ingresos: ingresos._sum.monto ?? 0, meta: v.metaMensual };
    })
  );
  rankingEquipo.sort((a, b) => b.ingresos - a.ingresos);

  return {
    nuevosMes,
    nuevosVariacion: variacionPct(nuevosMes, nuevosMesPasado),
    citasMes,
    citasVariacion: variacionPct(citasMes, citasMesPasado),
    propuestasMes,
    ganadosMes,
    ganadosVariacion: variacionPct(ganadosMes, ganadosMesPasado),
    ingresosMes: ingresosMesAgg._sum.monto ?? 0,
    ingresosVariacion: variacionPct(ingresosMesAgg._sum.monto ?? 0, ingresosMesPasadoAgg._sum.monto ?? 0),
    pendienteMonto: pendienteAgg._sum.monto ?? 0,
    pendienteCount: pendienteAgg._count,
    vencidoMonto: vencidoAgg._sum.monto ?? 0,
    vencidoCount: vencidoAgg._count,
    perdidosMes,
    tasaCierre,
    valorEmbudo,
    pronostico,
    crecimiento6Meses: meses,
    porOrigen: porOrigenRaw.map((o) => ({ origen: o.origen ?? "Sin origen", clientes: o._count, valor: o._sum.valorEstimado ?? 0 })),
    porQuePerdemos: perdidosMotivos.map((m) => ({ motivo: m.motivoPerdida ?? "Sin motivo", cantidad: m._count })),
    rankingEquipo,
  };
}
