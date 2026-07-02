import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { PanelComparte } from "./PanelComparte";

export const metadata: Metadata = { title: "Comparte y crece" };

async function obtenerBaseUrl() {
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function PaginaComparte() {
  const sesion = await auth();
  const esAdmin = sesion!.user.rol === "ADMIN";
  const config = await obtenerConfiguracionNegocio();
  const baseUrl = await obtenerBaseUrl();

  const vendedores = await prisma.usuario.findMany({
    where: { activo: true, eliminadoEn: null, ...(esAdmin ? {} : { id: sesion!.user.id }) },
    select: {
      id: true,
      nombre: true,
      slugAgenda: true,
      agendaActiva: true,
      _count: { select: { citas: { where: { eliminadoEn: null } } } },
    },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="Share2" className="size-7" style={{ color: "var(--color-acento-comparte)" }} />
          <h1 className="text-3xl font-semibold text-texto">Comparte y crece</h1>
          <TooltipInfo texto="Difunde tu landing y mide qué canal vende." consejo="Usa las ligas marcadas por canal para saber qué red te trae más clientes." />
        </div>
        <p className="mt-1 text-texto-suave">Difunde tu landing y mide qué canal vende</p>
      </div>

      <PanelComparte
        baseUrl={baseUrl}
        nombreNegocio={config.nombreNegocio}
        vendedores={vendedores.map((v) => ({ ...v, citas: v._count.citas }))}
        esAdmin={esAdmin}
      />
    </div>
  );
}
