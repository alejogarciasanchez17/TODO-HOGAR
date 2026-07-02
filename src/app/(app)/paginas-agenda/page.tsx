import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { ListaPaginasAgenda } from "../comparte/ListaPaginasAgenda";

export const metadata: Metadata = { title: "Páginas de agenda" };

async function obtenerBaseUrl() {
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function PaginaPaginasAgenda() {
  const sesion = await auth();
  const esAdmin = sesion!.user.rol === "ADMIN";
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
          <Icono nombre="CalendarPlus" className="size-7" style={{ color: "var(--color-acento-paginas-agenda)" }} />
          <h1 className="text-3xl font-semibold text-texto">Páginas de agenda</h1>
          <TooltipInfo texto="Tu liga personal para que te agenden solos." consejo="Pégala en tu Instagram o WhatsApp de estado." />
        </div>
        <p className="mt-1 text-texto-suave">Tu liga para que te agenden solos</p>
      </div>

      <ListaPaginasAgenda baseUrl={baseUrl} vendedores={vendedores.map((v) => ({ ...v, citas: v._count.citas }))} esAdmin={esAdmin} />
    </div>
  );
}
