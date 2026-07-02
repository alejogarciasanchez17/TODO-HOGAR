import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { ReservaPublica } from "./ReservaPublica";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const vendedor = await prisma.usuario.findFirst({ where: { slugAgenda: slug, activo: true }, select: { nombre: true } });
  const config = await obtenerConfiguracionNegocio();
  const titulo = vendedor ? `Agenda una cita con ${vendedor.nombre} · ${config.nombreNegocio}` : config.nombreNegocio;
  return {
    title: titulo,
    description: `Agenda tu cita con ${vendedor?.nombre ?? "nuestro equipo"} en ${config.nombreNegocio}, sin compromiso.`,
    openGraph: { title: titulo },
  };
}

export default async function PaginaAgendaPublica({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendedor = await prisma.usuario.findFirst({
    where: { slugAgenda: slug, activo: true, agendaActiva: true, eliminadoEn: null },
    select: { id: true, nombre: true },
  });
  if (!vendedor) notFound();

  const config = await obtenerConfiguracionNegocio();

  return (
    <ReservaPublica
      slug={slug}
      nombreVendedor={vendedor.nombre}
      nombreNegocio={config.nombreNegocio}
      colorMarca={config.colorMarca}
      horarioInicio={config.horarioInicio}
      horarioFin={config.horarioFin}
    />
  );
}
