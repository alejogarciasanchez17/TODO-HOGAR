// Sustituye variables de una plantilla con los datos reales de un cliente.
export type DatosMensaje = {
  nombre: string;
  empresa?: string | null;
  etapa: string;
  valor: number;
  vendedor: string;
  objecion?: string | null;
  moneda?: string;
};

export function rellenarPlantilla(texto: string, datos: DatosMensaje) {
  const valorFormateado = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: datos.moneda ?? "MXN",
    maximumFractionDigits: 0,
  }).format(datos.valor);

  return texto
    .replaceAll("{nombre}", datos.nombre)
    .replaceAll("{empresa}", datos.empresa ?? "tu empresa")
    .replaceAll("{etapa}", datos.etapa)
    .replaceAll("{valor}", valorFormateado)
    .replaceAll("{vendedor}", datos.vendedor)
    .replaceAll("{objecion}", datos.objecion ?? "tus dudas");
}

/** Mensaje de WhatsApp por defecto (el "mensaje tipo" del negocio) con el nombre ya puesto. */
export function mensajeTipoConNombre(mensajeTipo: string, nombre: string) {
  const primerNombre = nombre.trim().split(" ")[0];
  if (mensajeTipo.includes("{nombre}")) return mensajeTipo.replaceAll("{nombre}", primerNombre);
  // El mensaje tipo del negocio no usa variables: le anteponemos un saludo con el nombre.
  return `Hola ${primerNombre}, ${mensajeTipo}`;
}
