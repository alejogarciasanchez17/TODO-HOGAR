import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { filtroPorRol } from "@/lib/permisos";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { CalendarioAgenda } from "./CalendarioAgenda";

export const metadata: Metadata = { title: "Agenda" };

function inicioDeSemana(fecha: Date) {
  const f = new Date(fecha);
  const dia = f.getDay();
  const diff = dia === 0 ? -6 : 1 - dia; // lunes como inicio de semana
  f.setDate(f.getDate() + diff);
  f.setHours(0, 0, 0, 0);
  return f;
}

export default async function PaginaAgenda({ searchParams }: { searchParams: Promise<{ semana?: string }> }) {
  const sp = await searchParams;
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };
  const esAdmin = sesion!.user.rol === "ADMIN";

  const base = sp.semana ? new Date(sp.semana) : new Date();
  const inicio = inicioDeSemana(base);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 7);

  const [config, citas, clientes, vendedores] = await Promise.all([
    obtenerConfiguracionNegocio(),
    prisma.cita.findMany({
      where: { eliminadoEn: null, estado: { not: "cancelada" }, fecha: { gte: inicio, lt: fin }, ...filtroPorRol(usuario, "vendedorId") },
      include: { cliente: { select: { id: true, nombre: true } }, vendedor: { select: { id: true, nombre: true } } },
      orderBy: { fecha: "asc" },
    }),
    prisma.cliente.findMany({
      where: { eliminadoEn: null, estadoCartera: "ACTIVO", ...filtroPorRol(usuario, "vendedorId") },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
      take: 300,
    }),
    esAdmin
      ? prisma.usuario.findMany({ where: { activo: true, eliminadoEn: null }, select: { id: true, nombre: true } })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="CalendarDays" className="size-7" style={{ color: "var(--color-acento-agenda)" }} />
          <h1 className="text-3xl font-semibold text-texto">Agenda</h1>
          <TooltipInfo texto="Tus citas de la semana." consejo="Haz clic en un hueco libre para agendar ahí mismo." />
        </div>
        <p className="mt-1 text-texto-suave">
          Tus citas, organizadas solas · horario de {config.horarioInicio} a {config.horarioFin}
        </p>
      </div>

      <CalendarioAgenda
        inicioSemana={inicio.toISOString()}
        citas={JSON.parse(JSON.stringify(citas))}
        clientes={clientes}
        vendedores={vendedores}
        esAdmin={esAdmin}
        usuarioId={sesion!.user.id}
        horarioInicio={config.horarioInicio}
        horarioFin={config.horarioFin}
        duracionMin={config.duracionCitaMin}
        googleConectado={Boolean(process.env.GOOGLE_CLIENT_ID)}
      />
    </div>
  );
}
