import type { Metadata } from "next";
import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { ListaUsuarios } from "./ListaUsuarios";

export const metadata: Metadata = { title: "Usuarios" };

export default async function PaginaUsuarios() {
  const admin = await requerirAdmin();
  const usuarios = await prisma.usuario.findMany({
    where: { eliminadoEn: null },
    orderBy: { creadoEn: "asc" },
    select: { id: true, nombre: true, correo: true, rol: true, activo: true, metaMensual: true, comisionPct: true, slugAgenda: true },
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="UserCog" className="size-7" style={{ color: "var(--color-acento-equipo)" }} />
          <h1 className="text-3xl font-semibold text-texto">Usuarios</h1>
          <TooltipInfo texto="Da de alta a tu equipo de ventas." consejo="Cada vendedor solo ve su propia cartera; tú lo ves todo." />
        </div>
        <p className="mt-1 text-texto-suave">Tu gente y sus metas</p>
      </div>

      <ListaUsuarios usuarios={usuarios} idPropio={admin.id} />
    </div>
  );
}
