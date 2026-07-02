import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { FormularioCliente } from "../FormularioCliente";
import { Icono } from "@/components/ui/Icono";

export const metadata: Metadata = { title: "Nuevo cliente" };

export default async function PaginaNuevoCliente() {
  const sesion = await auth();
  const esAdmin = sesion!.user.rol === "ADMIN";
  const [vendedores, config] = await Promise.all([
    esAdmin
      ? prisma.usuario.findMany({ where: { activo: true, eliminadoEn: null }, select: { id: true, nombre: true } })
      : Promise.resolve([]),
    obtenerConfiguracionNegocio(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/clientes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-texto-suave hover:text-texto">
        <Icono nombre="ChevronLeft" className="size-4" /> Volver a clientes
      </Link>
      <h1 className="text-2xl font-semibold text-texto">Agregar cliente</h1>
      <p className="mt-1 text-texto-suave">Captura lo esencial; puedes completar el resto después.</p>
      <div className="mt-6 rounded-[var(--radio-lg)] border border-borde bg-superficie p-5 sm:p-7">
        <FormularioCliente
          modo="crear"
          vendedores={vendedores}
          etapas={config.etapasEmbudo}
          esAdmin={esAdmin}
          usuarioId={sesion!.user.id}
        />
      </div>
    </div>
  );
}
