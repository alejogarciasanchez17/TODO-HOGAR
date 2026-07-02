export const TIPOS_PERMITIDOS = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
export const TAMANO_MAXIMO_BYTES = 8 * 1024 * 1024; // 8 MB

export function archivoValido(tipoMime: string, tamanoBytes: number) {
  if (!TIPOS_PERMITIDOS.includes(tipoMime)) {
    return "Solo se aceptan archivos PDF, JPG o PNG.";
  }
  if (tamanoBytes > TAMANO_MAXIMO_BYTES) {
    return "El archivo pesa más de 8 MB. Sube uno más ligero.";
  }
  return null;
}

/**
 * Guarda el archivo: si hay BLOB_READ_WRITE_TOKEN configurado lo sube a
 * Vercel Blob (para archivos grandes) y regresa solo la URL; si no, lo
 * guarda directo en la base de datos (degradación elegante, funciona desde
 * el minuto cero sin configurar nada).
 */
export async function guardarArchivo(nombre: string, buffer: Buffer, tipoMime: string) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const { put } = await import("@vercel/blob");
    const resultado = await put(`archivos/${Date.now()}-${nombre}`, buffer, {
      access: "public",
      contentType: tipoMime,
      token,
    });
    return { url: resultado.url, datos: null as Buffer | null };
  }
  return { url: null as string | null, datos: buffer };
}

export async function eliminarArchivoAlmacenamiento(url: string | null) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !url) return;
  try {
    const { del } = await import("@vercel/blob");
    await del(url, { token });
  } catch (error) {
    console.error("No se pudo borrar el archivo del almacenamiento externo:", error);
  }
}
