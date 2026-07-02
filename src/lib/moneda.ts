// Función pura (sin Prisma) para formatear moneda; segura de importar desde
// componentes de cliente. src/lib/config-negocio.ts trae la misma función
// pero también importa Prisma, así que ese archivo NO se debe usar desde "use client".
export function formatoMoneda(monto: number, moneda = "MXN") {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}
