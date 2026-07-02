import type { Metadata } from "next";
import { requerirAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { formatoHumano } from "@/lib/utils-fecha";

export const metadata: Metadata = { title: "Actividad del equipo" };

const TEXTO_ACCION: Record<string, string> = {
  crear_cliente: "creó al cliente",
  editar_cliente: "editó al cliente",
  eliminar_cliente: "eliminó al cliente",
  mover_etapa: "movió de etapa a",
  estado_ganado: "marcó como Ganado a",
  estado_perdido: "marcó como Perdido a",
  estado_archivado: "archivó a",
  reasignar_cartera: "reasignó al cliente",
  subir_archivo: "subió un archivo de",
  eliminar_archivo: "eliminó un archivo de",
  registrar_pago: "registró un pago de",
  crear_cita: "agendó una cita para",
  crear_usuario: "creó al usuario",
  editar_usuario: "editó al usuario",
  desactivar_usuario: "desactivó al usuario",
  activar_usuario: "activó al usuario",
  resetear_password: "reseteó la contraseña de",
  editar_configuracion_negocio: "editó la configuración del negocio",
  exportar_todo: "exportó un respaldo completo",
  restaurar_respaldo: "restauró un respaldo",
  vaciar_papelera: "vació la papelera",
};

export default async function PaginaActividad() {
  await requerirAdmin();

  const registros = await prisma.registroAuditoria.findMany({
    orderBy: { creadoEn: "desc" },
    take: 200,
    include: { usuario: { select: { nombre: true } } },
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="ListChecks" className="size-7" style={{ color: "var(--color-acento-admin)" }} />
          <h1 className="text-3xl font-semibold text-texto">Actividad del equipo</h1>
          <TooltipInfo texto="Bitácora de todo lo importante que pasa en el CRM." consejo="Solo de lectura: nadie puede borrarla desde aquí." />
        </div>
        <p className="mt-1 text-texto-suave">Quién hizo qué y cuándo</p>
      </div>

      {registros.length === 0 ? (
        <p className="py-10 text-center text-texto-suave">Aún no hay actividad registrada.</p>
      ) : (
        <div className="divide-y divide-borde rounded-[var(--radio-lg)] border border-borde bg-superficie">
          {registros.map((r) => (
            <div key={r.id} className="p-3.5 text-sm">
              <p className="text-texto">
                <span className="font-medium">{r.usuario?.nombre ?? "Sistema"}</span> {TEXTO_ACCION[r.accion] ?? r.accion} ({r.entidadTipo})
              </p>
              <p className="text-xs text-texto-tenue">{formatoHumano(r.creadoEn)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
