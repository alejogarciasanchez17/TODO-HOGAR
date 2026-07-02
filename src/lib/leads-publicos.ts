import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/auditoria";

export type DatosLeadPublico = {
  nombre: string;
  telefono?: string;
  correo?: string;
  origen: string; // "Landing" | "Agenda [nombre]" | ...
  canalUTM?: string | null;
  vendedorId?: string; // si viene de una página de agenda de un vendedor específico
  proximaAccion?: string;
};

function telefonoInternacional(telefono: string): string {
  const soloDigitos = telefono.replace(/\D/g, "");
  if (soloDigitos.startsWith("52") && soloDigitos.length >= 12) return soloDigitos;
  if (soloDigitos.length === 10) return `52${soloDigitos}`;
  return soloDigitos;
}

/** Reparte leads sin vendedor asignado entre los vendedores activos (round-robin simple por menor carga actual). */
async function elegirVendedorPorCarga(): Promise<string> {
  const vendedores = await prisma.usuario.findMany({
    where: { activo: true, eliminadoEn: null },
    select: { id: true, rol: true, _count: { select: { clientes: { where: { eliminadoEn: null, estadoCartera: "ACTIVO" } } } } },
  });
  const candidatos = vendedores.filter((v) => v.rol !== "LECTURA");
  if (candidatos.length === 0) throw new Error("No hay vendedores activos para asignar el lead");
  candidatos.sort((a, b) => a._count.clientes - b._count.clientes);
  return candidatos[0].id;
}

/** Crea un cliente "Nuevo" desde un formulario público (landing o agenda de un vendedor). Nunca debe tronar en silencio. */
export async function crearLeadDesdeFormularioPublico(datos: DatosLeadPublico) {
  const vendedorId = datos.vendedorId ?? (await elegirVendedorPorCarga());

  const mañana = new Date();
  mañana.setDate(mañana.getDate() + 1);
  mañana.setHours(0, 0, 0, 0);

  const cliente = await prisma.$transaction(async (tx) => {
    const nuevo = await tx.cliente.create({
      data: {
        nombre: datos.nombre.trim(),
        telefono: datos.telefono?.trim() || null,
        telefonoIntl: datos.telefono ? telefonoInternacional(datos.telefono) : null,
        correo: datos.correo?.trim().toLowerCase() || null,
        origen: datos.origen,
        canalUTM: datos.canalUTM || null,
        etapa: "Nuevo",
        estadoCartera: "ACTIVO",
        temperatura: "TIBIO",
        proximaAccion: datos.proximaAccion ?? "Contactar en menos de 24 h",
        proximaAccionFecha: mañana,
        vendedorId,
      },
    });
    await tx.eventoTimeline.create({
      data: { clienteId: nuevo.id, tipo: "otro", descripcion: `Nuevo interesado llegó desde ${datos.origen}.` },
    });
    await tx.mencion.create({
      data: { usuarioId: vendedorId, texto: `Nuevo interesado: ${nuevo.nombre} (${datos.origen})`, entidad: "cliente", entidadId: nuevo.id },
    });
    return nuevo;
  });

  await registrarAuditoria({ usuarioId: null, accion: "lead_publico", entidadTipo: "cliente", entidadId: cliente.id, detalle: { origen: datos.origen } });
  return cliente;
}
