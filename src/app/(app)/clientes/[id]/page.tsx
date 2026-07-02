import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerClientePorId, totalPagadoYFaltante } from "@/lib/clientes";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { Icono } from "@/components/ui/Icono";
import { PanelPrincipal } from "./PanelPrincipal";
import { EdicionColapsable } from "./EdicionColapsable";
import { BloqueArchivos } from "./BloqueArchivos";
import { BloquePagos } from "./BloquePagos";
import { LineaTiempo } from "./LineaTiempo";
import { PanelIA } from "./PanelIA";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cliente = await prisma.cliente.findUnique({ where: { id }, select: { nombre: true } });
  return { title: cliente?.nombre ?? "Cliente" };
}

export default async function PaginaExpediente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };

  const [cliente, config, vendedores, etiquetas, plantillas] = await Promise.all([
    obtenerClientePorId(usuario, id),
    obtenerConfiguracionNegocio(),
    sesion!.user.rol === "ADMIN"
      ? prisma.usuario.findMany({ where: { activo: true, eliminadoEn: null }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } })
      : Promise.resolve([]),
    prisma.etiqueta.findMany({ orderBy: { nombre: "asc" } }),
    prisma.plantilla.findMany({
      where: { OR: [{ usuarioId: null }, { usuarioId: sesion!.user.id }] },
      orderBy: [{ favorita: "desc" }, { nombre: "asc" }],
    }),
  ]);

  if (!cliente) notFound();

  const { pagado, falta, porcentaje } = totalPagadoYFaltante(cliente.pagos, cliente.valorEstimado);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm font-medium text-texto-suave hover:text-texto">
        <Icono nombre="ChevronLeft" className="size-4" /> Volver a clientes
      </Link>

      <PanelPrincipal
        cliente={JSON.parse(JSON.stringify(cliente))}
        moneda={config.moneda}
        mensajeTipo={config.mensajeWhatsappTipo}
        nombreVendedor={cliente.vendedor.nombre}
        esFavorito={cliente.favoritos.length > 0}
        etiquetasDisponibles={etiquetas}
        etiquetasCliente={cliente.etiquetas.map((e) => e.etiqueta)}
        plantillas={JSON.parse(JSON.stringify(plantillas))}
      />

      <EdicionColapsable
        valores={{
          id: cliente.id,
          nombre: cliente.nombre,
          telefono: cliente.telefono ?? undefined,
          correo: cliente.correo ?? undefined,
          origen: cliente.origen ?? undefined,
          etapa: cliente.etapa,
          valorEstimado: cliente.valorEstimado,
          temperatura: cliente.temperatura,
          objecionPrincipal: cliente.objecionPrincipal ?? undefined,
          notas: cliente.notas ?? undefined,
          proximaAccion: cliente.proximaAccion ?? undefined,
          proximaAccionFecha: cliente.proximaAccionFecha ? cliente.proximaAccionFecha.toISOString().slice(0, 10) : undefined,
          zona: cliente.zona ?? undefined,
          vendedorId: cliente.vendedorId,
          empresaNombre: cliente.empresaNombre ?? undefined,
          empresaGiro: cliente.empresaGiro ?? undefined,
          empresaPuesto: cliente.empresaPuesto ?? undefined,
          empresaRFC: cliente.empresaRFC ?? undefined,
          empresaSitioWeb: cliente.empresaSitioWeb ?? undefined,
          empresaDireccion: cliente.empresaDireccion ?? undefined,
          empresaTamano: cliente.empresaTamano ?? undefined,
          empresaNotas: cliente.empresaNotas ?? undefined,
        }}
        etapas={config.etapasEmbudo}
        vendedores={vendedores}
        esAdmin={sesion!.user.rol === "ADMIN"}
        usuarioId={sesion!.user.id}
      />

      <PanelIA clienteId={cliente.id} />

      <BloquePagos
        clienteId={cliente.id}
        pagos={JSON.parse(JSON.stringify(cliente.pagos))}
        metodosPago={config.metodosPago}
        moneda={config.moneda}
        valorEstimado={cliente.valorEstimado}
        pagado={pagado}
        falta={falta}
        porcentaje={porcentaje}
      />

      <BloqueArchivos clienteId={cliente.id} archivos={JSON.parse(JSON.stringify(cliente.archivos))} />

      <LineaTiempo clienteId={cliente.id} eventos={JSON.parse(JSON.stringify(cliente.eventosTimeline))} />
    </div>
  );
}
