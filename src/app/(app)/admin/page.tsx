import type { Metadata } from "next";
import Link from "next/link";
import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { TooltipInfo } from "@/components/ui/TooltipInfo";

export const metadata: Metadata = { title: "Panel admin" };

const SECCIONES: { href: string; icono: NombreIcono; titulo: string; frase: string }[] = [
  { href: "/admin/usuarios", icono: "UserCog", titulo: "Usuarios", frase: "Alta, roles y contraseñas de tu equipo" },
  { href: "/admin/configuracion", icono: "Settings", titulo: "Configuración del negocio", frase: "Marca, etapas, horarios, moneda y metas" },
  { href: "/admin/etiquetas", icono: "Tag", titulo: "Etiquetas", frase: "Las etiquetas que le pones a tus clientes" },
  { href: "/admin/actividad", icono: "ListChecks", titulo: "Actividad del equipo", frase: "Bitácora de quién hizo qué y cuándo" },
  { href: "/admin/respaldo", icono: "Download", titulo: "Respaldar y exportar", frase: "Descarga toda tu base o restaura un respaldo" },
  { href: "/admin/papelera", icono: "Trash2", titulo: "Papelera", frase: "Lo eliminado en los últimos 30 días" },
];

export default async function PaginaAdmin() {
  await requerirAdmin();

  const [usuarios, clientes, registrosHoy] = await Promise.all([
    prisma.usuario.count({ where: { activo: true, eliminadoEn: null } }),
    prisma.cliente.count({ where: { eliminadoEn: null } }),
    prisma.registroAuditoria.count({ where: { creadoEn: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="ShieldCheck" className="size-7" style={{ color: "var(--color-acento-admin)" }} />
          <h1 className="text-3xl font-semibold text-texto">Panel admin</h1>
          <TooltipInfo texto="Todo lo que solo tú, como administrador, puedes ver y cambiar." consejo="Respalda seguido: tus datos de clientes son tu activo más valioso." />
        </div>
        <p className="mt-1 text-texto-suave">Tu equipo, tus datos, tu negocio</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Tarjeta><p className="text-sm text-texto-suave">Usuarios activos</p><p className="text-2xl font-semibold text-texto">{usuarios}</p></Tarjeta>
        <Tarjeta><p className="text-sm text-texto-suave">Clientes en la base</p><p className="text-2xl font-semibold text-texto">{clientes}</p></Tarjeta>
        <Tarjeta><p className="text-sm text-texto-suave">Acciones hoy</p><p className="text-2xl font-semibold text-texto">{registrosHoy}</p></Tarjeta>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SECCIONES.map((s) => (
          <Link key={s.href} href={s.href}>
            <Tarjeta interactiva className="flex items-center gap-3">
              <Icono nombre={s.icono} className="size-6 text-marca" />
              <div>
                <p className="font-semibold text-texto">{s.titulo}</p>
                <p className="text-sm text-texto-suave">{s.frase}</p>
              </div>
            </Tarjeta>
          </Link>
        ))}
      </div>
    </div>
  );
}
