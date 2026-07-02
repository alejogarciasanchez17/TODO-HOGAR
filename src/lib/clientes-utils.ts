// Funciones puras (sin Prisma) para usarse tanto en el servidor como en
// componentes de cliente. Mantenerlas separadas de src/lib/clientes.ts evita
// que el cliente de Prisma (y sus dependencias de Node) se cuelen al navegador.

/** Convierte un teléfono capturado a formato internacional simple para WhatsApp (MX por defecto). */
export function telefonoInternacional(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, "");
  if (soloDigitos.startsWith("52") && soloDigitos.length >= 12) return soloDigitos;
  if (soloDigitos.length === 10) return `52${soloDigitos}`;
  return soloDigitos;
}

export function construirLinkWhatsapp(telefonoIntl: string, texto: string) {
  return `https://wa.me/${telefonoIntl}?text=${encodeURIComponent(texto)}`;
}

export function construirMailto(correo: string, asunto: string, cuerpo: string) {
  return `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

export function totalPagadoYFaltante(pagos: { estatus: string; monto: number }[], valorEstimado: number) {
  const pagado = pagos.filter((p) => p.estatus === "pagado").reduce((acc, p) => acc + p.monto, 0);
  const falta = Math.max(0, valorEstimado - pagado);
  const porcentaje = valorEstimado > 0 ? Math.min(100, Math.round((pagado / valorEstimado) * 100)) : 0;
  return { pagado, falta, porcentaje };
}
