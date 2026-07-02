import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { puede } from "@/lib/permisos";
import { obtenerConfiguracionNegocio, formatoMoneda } from "@/lib/config-negocio";
import { BotonImprimir } from "./BotonImprimir";

export const metadata: Metadata = { title: "Recibo" };

export default async function PaginaRecibo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };

  const pago = await prisma.pago.findFirst({
    where: { id, eliminadoEn: null },
    include: { cliente: true, registradoPor: { select: { nombre: true } } },
  });
  if (!pago || !puede(usuario, "editar_cliente", { vendedorId: pago.cliente.vendedorId })) notFound();

  const config = await obtenerConfiguracionNegocio();

  return (
    <div className="mx-auto max-w-lg space-y-6 print:max-w-full">
      <div className="print:hidden">
        <BotonImprimir />
      </div>
      <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-8 print:border-0 print:shadow-none">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xl font-bold text-texto">{config.nombreNegocio}</p>
            <p className="text-sm text-texto-suave">Recibo de pago</p>
          </div>
          <p className="text-sm text-texto-tenue">Folio #{pago.folio}</p>
        </div>
        <div className="space-y-2 border-t border-borde pt-4 text-sm">
          <p><span className="text-texto-suave">Cliente:</span> <span className="font-medium text-texto">{pago.cliente.nombre}</span></p>
          <p><span className="text-texto-suave">Concepto:</span> <span className="font-medium text-texto">{pago.concepto ?? "Pago"}</span></p>
          <p><span className="text-texto-suave">Método:</span> <span className="font-medium text-texto">{pago.metodo}</span></p>
          <p><span className="text-texto-suave">Fecha:</span> <span className="font-medium text-texto">{(pago.fechaPago ?? pago.creadoEn).toLocaleDateString("es-MX", { dateStyle: "long" })}</span></p>
          <p><span className="text-texto-suave">Atendió:</span> <span className="font-medium text-texto">{pago.registradoPor.nombre}</span></p>
        </div>
        <div className="mt-6 border-t border-borde pt-4 text-right">
          <p className="text-sm text-texto-suave">Monto</p>
          <p className="text-3xl font-bold text-texto">{formatoMoneda(pago.monto, config.moneda)}</p>
        </div>
        <p className="mt-8 text-center text-xs text-texto-tenue">Gracias por tu compra en {config.nombreNegocio} · Garantía directa post-venta</p>
      </div>
    </div>
  );
}
