"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { Badge, BadgeTemperatura } from "@/components/ui/Badge";
import { Campo } from "@/components/ui/Campo";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Icono } from "@/components/ui/Icono";
import { avisos } from "@/lib/toast";
import { formatoMoneda } from "@/lib/moneda";
import { formatoFechaCorta, formatoHumano, estaVencida } from "@/lib/utils-fecha";
import { telefonoInternacional, construirLinkWhatsapp } from "@/lib/clientes-utils";
import { cn } from "@/lib/utils";
import { crearRecordatorio } from "./actions";
import { registrarContacto } from "../clientes/[id]/actions-timeline";

type ClienteFila = {
  id: string;
  nombre: string;
  telefono: string | null;
  telefonoIntl: string | null;
  temperatura: string;
  valorEstimado: number;
  proximaAccion: string | null;
  proximaAccionFecha: string | null;
  vendedor: { nombre: string };
};

type Recordatorio = { id: string; texto: string; fecha: string; cliente: { id: string; nombre: string } | null };
type Cita = { id: string; fecha: string; cliente: { id: string; nombre: string } };

export function PanelSeguimiento({
  nombreUsuario,
  porContactar,
  sinSeguimiento,
  leadsFrios,
  recordatorios,
  citasHoy,
  metaMensual,
  ganadosMes,
  enRiesgo,
  moneda,
  esAdmin,
  tiempoPromedioHoras,
}: {
  nombreUsuario: string;
  porContactar: ClienteFila[];
  sinSeguimiento: number;
  leadsFrios: { id: string; nombre: string; creadoEn: string }[];
  recordatorios: Recordatorio[];
  citasHoy: Cita[];
  metaMensual: number;
  ganadosMes: number;
  enRiesgo: number;
  moneda: string;
  esAdmin: boolean;
  tiempoPromedioHoras: number | null;
}) {
  const router = useRouter();
  const [modalRecordatorio, setModalRecordatorio] = useState(false);
  const [estado, accion, enCurso] = useActionState(crearRecordatorio, undefined);

  useEffect(() => {
    if (estado === "OK") {
      setModalRecordatorio(false);
      avisos.exito("Recordatorio creado");
      router.refresh();
    } else if (estado) {
      avisos.error(estado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const vencidos = porContactar.filter((c) => c.proximaAccionFecha && estaVencida(c.proximaAccionFecha));
  const progreso = metaMensual > 0 ? Math.min(100, Math.round((ganadosMes / metaMensual) * 100)) : 0;

  async function contactarWhatsapp(c: ClienteFila) {
    const tel = c.telefonoIntl || (c.telefono ? telefonoInternacional(c.telefono) : "");
    if (!tel) return avisos.error("Este cliente no tiene WhatsApp registrado");
    window.open(construirLinkWhatsapp(tel, `Hola ${c.nombre.split(" ")[0]}, `), "_blank");
    await registrarContacto(c.id, "whatsapp");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {vencidos.length > 0 && (
        <div className="flex items-center gap-2 rounded-[var(--radio-md)] bg-peligro/10 p-4 text-peligro">
          <Icono nombre="AlertTriangle" className="size-5 shrink-0" />
          <p className="font-medium">Tienes {vencidos.length} acciones vencidas. Atiéndelas primero.</p>
        </div>
      )}

      {leadsFrios.length > 0 && (
        <div className="space-y-2 rounded-[var(--radio-md)] bg-advertencia/10 p-4">
          <p className="flex items-center gap-2 font-medium text-advertencia">
            <Icono nombre="AlertTriangle" className="size-4" /> Leads fríos por demora (más de 24 h sin primer contacto)
          </p>
          {leadsFrios.map((l) => (
            <p key={l.id} className="text-sm text-texto-suave">
              <Link href={`/clientes/${l.id}`} className="font-medium text-texto hover:underline">{l.nombre}</Link> · llegó {formatoHumano(l.creadoEn)}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-4">
          <p className="text-sm text-texto-suave">Mi meta del mes</p>
          <p className="text-2xl font-semibold text-texto">{ganadosMes} / {metaMensual}</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-superficie-2">
            <div className="h-full rounded-full bg-marca" style={{ width: `${progreso}%` }} />
          </div>
        </div>
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-4">
          <p className="text-sm text-texto-suave">Citas de hoy</p>
          <p className="text-2xl font-semibold text-texto">{citasHoy.length}</p>
        </div>
        <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-4">
          <p className="text-sm text-texto-suave">En riesgo de enfriarse</p>
          <p className="text-2xl font-semibold text-advertencia">{enRiesgo}</p>
        </div>
        {esAdmin && tiempoPromedioHoras !== null && (
          <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-4">
            <p className="text-sm text-texto-suave">Tiempo promedio de 1er contacto</p>
            <p className="text-2xl font-semibold text-texto">{tiempoPromedioHoras} h</p>
          </div>
        )}
      </div>

      <Tarjeta className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-texto">Mi día, {nombreUsuario}</h2>
          <Boton tamano="sm" icono="Plus" onClick={() => setModalRecordatorio(true)}>Recordatorio</Boton>
        </div>
        {citasHoy.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-texto-tenue">Citas de hoy</p>
            {citasHoy.map((c) => (
              <p key={c.id} className="text-sm text-texto">
                {formatoHumano(c.fecha)} · <Link href={`/clientes/${c.cliente.id}`} className="font-medium hover:underline">{c.cliente.nombre}</Link>
              </p>
            ))}
          </div>
        )}
        {recordatorios.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-texto-tenue">Recordatorios</p>
            {recordatorios.map((r) => (
              <p key={r.id} className={cn("text-sm", estaVencida(r.fecha) ? "font-medium text-peligro" : "text-texto")}>
                {r.texto} {r.cliente && <>· <Link href={`/clientes/${r.cliente.id}`} className="hover:underline">{r.cliente.nombre}</Link></>} · {formatoHumano(r.fecha)}
              </p>
            ))}
          </div>
        )}
        {citasHoy.length === 0 && recordatorios.length === 0 && (
          <p className="text-sm text-texto-suave">Hoy no tienes pendientes 🎉</p>
        )}
      </Tarjeta>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-texto">Hoy te toca</h2>
          {sinSeguimiento > 0 && <Badge tono="advertencia">🟠 {sinSeguimiento} sin próxima acción</Badge>}
        </div>
        {porContactar.length === 0 ? (
          <Tarjeta className="flex flex-col items-center gap-2 py-12 text-center">
            <Icono nombre="ListChecks" className="size-8 text-texto-tenue" />
            <p className="font-medium text-texto">Hoy no tienes pendientes 🎉</p>
          </Tarjeta>
        ) : (
          <div className="space-y-2">
            {porContactar.map((c) => {
              const vencida = c.proximaAccionFecha ? estaVencida(c.proximaAccionFecha) : false;
              return (
                <Tarjeta key={c.id} className="flex flex-wrap items-center gap-3">
                  <BadgeTemperatura temperatura={c.temperatura} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/clientes/${c.id}`} className="font-medium text-texto hover:text-marca-fuerte hover:underline">{c.nombre}</Link>
                    <p className={cn("text-sm", vencida ? "font-medium text-peligro" : "text-texto-suave")}>
                      {c.proximaAccion} {c.proximaAccionFecha && `· ${formatoFechaCorta(c.proximaAccionFecha)}`}
                    </p>
                  </div>
                  <p className="font-semibold text-texto">{formatoMoneda(c.valorEstimado, moneda)}</p>
                  {esAdmin && <p className="text-xs text-texto-tenue">{c.vendedor.nombre}</p>}
                  <Boton tamano="sm" variante="exito" icono="MessageCircle" onClick={() => contactarWhatsapp(c)}>WhatsApp</Boton>
                </Tarjeta>
              );
            })}
          </div>
        )}
      </div>

      <Modal abierto={modalRecordatorio} onCerrar={() => setModalRecordatorio(false)} titulo="Nuevo recordatorio" ancho="sm">
        <form action={accion} className="space-y-4">
          <Campo etiqueta="Texto" nombre="texto" requerido>
            <Textarea name="texto" required placeholder="Ej. Llamar para confirmar entrega" />
          </Campo>
          <Campo etiqueta="Fecha y hora" nombre="fecha" requerido>
            <Input name="fecha" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
          </Campo>
          <div className="flex justify-end gap-3 border-t border-borde pt-4">
            <Boton type="button" variante="secundario" onClick={() => setModalRecordatorio(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={enCurso} icono="Check">Guardar</Boton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
