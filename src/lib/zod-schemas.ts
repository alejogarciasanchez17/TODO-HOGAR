import { z } from "zod";

export const TEMPERATURAS = ["CALIENTE", "TIBIO", "FRIO"] as const;
export const ESTADOS_CARTERA = ["ACTIVO", "GANADO", "PERDIDO", "ARCHIVADO"] as const;

export const clienteSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre completo").max(150),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  correo: z.union([z.literal(""), z.string().trim().email("Correo no válido")]).optional(),
  origen: z.string().trim().max(60).optional().or(z.literal("")),
  canalUTM: z.string().trim().max(60).optional().or(z.literal("")),
  etapa: z.string().trim().min(1).max(60),
  valorEstimado: z.coerce.number().min(0, "El valor no puede ser negativo").default(0),
  temperatura: z.enum(TEMPERATURAS).default("TIBIO"),
  objecionPrincipal: z.string().trim().max(120).optional().or(z.literal("")),
  notas: z.string().trim().max(4000).optional().or(z.literal("")),
  proximaAccion: z.string().trim().max(200).optional().or(z.literal("")),
  proximaAccionFecha: z.string().trim().optional().or(z.literal("")),
  zona: z.string().trim().max(150).optional().or(z.literal("")),
  vendedorId: z.string().trim().min(1, "Elige a qué vendedor pertenece"),
  empresaNombre: z.string().trim().max(150).optional().or(z.literal("")),
  empresaGiro: z.string().trim().max(120).optional().or(z.literal("")),
  empresaPuesto: z.string().trim().max(120).optional().or(z.literal("")),
  empresaRFC: z.string().trim().max(20).optional().or(z.literal("")),
  empresaSitioWeb: z.string().trim().max(200).optional().or(z.literal("")),
  empresaDireccion: z.string().trim().max(300).optional().or(z.literal("")),
  empresaTamano: z.string().trim().max(60).optional().or(z.literal("")),
  empresaNotas: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ClienteInput = z.infer<typeof clienteSchema>;

export const pagoSchema = z.object({
  clienteId: z.string().min(1),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  metodo: z.string().trim().min(1, "Elige un método de pago"),
  estatus: z.enum(["pendiente", "pagado", "vencido"]).default("pendiente"),
  fechaPago: z.string().trim().optional().or(z.literal("")),
  fechaVencimiento: z.string().trim().optional().or(z.literal("")),
  concepto: z.string().trim().max(200).optional().or(z.literal("")),
});

export const citaSchema = z.object({
  clienteId: z.string().min(1),
  vendedorId: z.string().min(1),
  fecha: z.string().min(1, "Elige fecha y hora"),
  duracionMin: z.coerce.number().int().positive().default(15),
  notas: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const recordatorioSchema = z.object({
  texto: z.string().trim().min(2).max(300),
  fecha: z.string().min(1),
  clienteId: z.string().optional().or(z.literal("")),
});

/**
 * Limpia campos opcionales tipo "" a `null` para que Prisma los guarde como null.
 * Solo ensancha el tipo a `| null` en campos de texto libre (string exacto),
 * nunca en literales/enums (ej. "CALIENTE" | "TIBIO" | "FRIO"), para no romper
 * los campos requeridos que Prisma espera como no-nulos.
 */
export function vacioANulo<T extends Record<string, unknown>>(obj: T) {
  const limpio: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    limpio[k] = v === "" ? null : v;
  }
  return limpio as {
    [K in keyof T]: string extends T[K] ? T[K] | null : T[K];
  };
}
