import { prisma } from "@/lib/prisma";

export type ConfiguracionNegocioParsed = {
  id: string;
  nombreNegocio: string;
  colorMarca: string;
  moneda: string;
  husoHorario: string;
  horarioInicio: string;
  horarioFin: string;
  duracionCitaMin: number;
  etapasEmbudo: string[];
  metodosPago: string[];
  motivosPerdida: string[];
  mensajeWhatsappTipo: string;
  metaMensualClientes: number;
  umbralEstancamientoDias: number;
  comisionGlobalPct: number | null;
};

function seguro<T>(json: string, porDefecto: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return porDefecto;
  }
}

/** Trae (y crea si hace falta) la configuración única del negocio, ya parseada. */
export async function obtenerConfiguracionNegocio(): Promise<ConfiguracionNegocioParsed> {
  const config =
    (await prisma.configuracionNegocio.findUnique({ where: { id: "default" } })) ??
    (await prisma.configuracionNegocio.create({ data: { id: "default" } }));

  return {
    id: config.id,
    nombreNegocio: config.nombreNegocio,
    colorMarca: config.colorMarca,
    moneda: config.moneda,
    husoHorario: config.husoHorario,
    horarioInicio: config.horarioInicio,
    horarioFin: config.horarioFin,
    duracionCitaMin: config.duracionCitaMin,
    etapasEmbudo: seguro(config.etapasEmbudo, []),
    metodosPago: seguro(config.metodosPago, []),
    motivosPerdida: seguro(config.motivosPerdida, []),
    mensajeWhatsappTipo: config.mensajeWhatsappTipo,
    metaMensualClientes: config.metaMensualClientes,
    umbralEstancamientoDias: config.umbralEstancamientoDias,
    comisionGlobalPct: config.comisionGlobalPct,
  };
}

export function formatoMoneda(monto: number, moneda = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}
