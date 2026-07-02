import type { Metadata } from "next";
import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { formatoFechaCorta } from "@/lib/utils-fecha";
import { PanelPapelera } from "./PanelPapelera";

export const metadata: Metadata = { title: "Papelera" };

export default async function PaginaPapelera() {
  await requerirAdmin();
  const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [clientes, pagos, citas] = await Promise.all([
    prisma.cliente.findMany({ where: { eliminadoEn: { not: null, gte: hace30Dias } }, orderBy: { eliminadoEn: "desc" } }),
    prisma.pago.findMany({ where: { eliminadoEn: { not: null, gte: hace30Dias } }, include: { cliente: { select: { nombre: true } } }, orderBy: { eliminadoEn: "desc" } }),
    prisma.cita.findMany({ where: { eliminadoEn: { not: null, gte: hace30Dias } }, include: { cliente: { select: { nombre: true } } }, orderBy: { eliminadoEn: "desc" } }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="Trash2" className="size-7" style={{ color: "var(--color-acento-admin)" }} />
          <h1 className="text-3xl font-semibold text-texto">Papelera</h1>
          <TooltipInfo texto="Lo que se eliminó en los últimos 30 días." consejo="Nada se pierde para siempre hasta que vacíes la papelera." />
        </div>
        <p className="mt-1 text-texto-suave">Recuperable hasta por 30 días</p>
      </div>

      <PanelPapelera
        clientes={JSON.parse(JSON.stringify(clientes)).map((c: { id: string; nombre: string; eliminadoEn: string }) => ({
          id: c.id,
          nombre: c.nombre,
          eliminadoEn: c.eliminadoEn,
        }))}
        pagos={JSON.parse(JSON.stringify(pagos)).map((p: { id: string; monto: number; cliente: { nombre: string }; eliminadoEn: string }) => ({
          id: p.id,
          monto: p.monto,
          cliente: p.cliente.nombre,
          eliminadoEn: p.eliminadoEn,
        }))}
        citas={JSON.parse(JSON.stringify(citas)).map((c: { id: string; fecha: string; cliente: { nombre: string }; eliminadoEn: string }) => ({
          id: c.id,
          fecha: c.fecha,
          cliente: c.cliente.nombre,
          eliminadoEn: c.eliminadoEn,
        }))}
      />

      <p className="text-xs text-texto-tenue">
        Última revisión: {formatoFechaCorta(new Date())}
      </p>
    </div>
  );
}
