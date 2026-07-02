"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Icono } from "@/components/ui/Icono";
import { avisos } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { crearCita, cancelarCita } from "./actions";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type Cita = {
  id: string;
  fecha: string;
  duracionMin: number;
  notas: string | null;
  googleMeetLink: string | null;
  cliente: { id: string; nombre: string };
  vendedor: { id: string; nombre: string };
};

function generarSlots(horarioInicio: string, horarioFin: string, duracionMin: number) {
  const [hIni, mIni] = horarioInicio.split(":").map(Number);
  const [hFin, mFin] = horarioFin.split(":").map(Number);
  const slots: string[] = [];
  let minutos = hIni * 60 + mIni;
  const limite = hFin * 60 + mFin;
  while (minutos < limite) {
    slots.push(`${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`);
    minutos += duracionMin;
  }
  return slots;
}

export function CalendarioAgenda({
  inicioSemana,
  citas,
  clientes,
  vendedores,
  esAdmin,
  usuarioId,
  horarioInicio,
  horarioFin,
  duracionMin,
  googleConectado,
}: {
  inicioSemana: string;
  citas: Cita[];
  clientes: { id: string; nombre: string }[];
  vendedores: { id: string; nombre: string }[];
  esAdmin: boolean;
  usuarioId: string;
  horarioInicio: string;
  horarioFin: string;
  duracionMin: number;
  googleConectado: boolean;
}) {
  const router = useRouter();
  const [slotElegido, setSlotElegido] = useState<Date | null>(null);
  const [citaVista, setCitaVista] = useState<Cita | null>(null);
  const [estado, accion, enCurso] = useActionState(crearCita, undefined);

  const inicio = new Date(inicioSemana);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(d.getDate() + i);
    return d;
  });
  const slots = useMemo(() => generarSlots(horarioInicio, horarioFin, duracionMin), [horarioInicio, horarioFin, duracionMin]);
  const hoy = new Date().toDateString();

  function citaEn(dia: Date, hora: string): Cita | undefined {
    const [h, m] = hora.split(":").map(Number);
    return citas.find((c) => {
      const f = new Date(c.fecha);
      return f.toDateString() === dia.toDateString() && f.getHours() === h && f.getMinutes() === m;
    });
  }

  useEffect(() => {
    if (estado === "OK") {
      avisos.exito("Cita guardada ✓ Se creó el evento y el Meet automático");
      setSlotElegido(null);
      router.refresh();
    } else if (estado === "OK_SIN_GOOGLE") {
      avisos.info("Cita guardada. Conecta Google Calendar para crear el evento y el Meet automático");
      setSlotElegido(null);
      router.refresh();
    } else if (estado) {
      avisos.error(estado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  function irASemana(offsetDias: number) {
    const nueva = new Date(inicio);
    nueva.setDate(nueva.getDate() + offsetDias);
    router.push(`/agenda?semana=${nueva.toISOString().slice(0, 10)}`);
  }

  return (
    <div className="space-y-4">
      {!googleConectado && (
        <div className="rounded-[var(--radio-md)] bg-info/10 p-3 text-sm text-info">
          Cita guardada. Conecta Google Calendar para crear el evento y el Meet automático. El CRM funciona igual sin esto.
        </div>
      )}

      <div className="flex items-center justify-between">
        <Boton variante="secundario" tamano="sm" icono="ChevronLeft" onClick={() => irASemana(-7)}>Semana anterior</Boton>
        <p className="text-sm font-medium text-texto">
          {dias[0].toLocaleDateString("es-MX", { day: "numeric", month: "short" })} – {dias[6].toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <Boton variante="secundario" tamano="sm" iconoDerecha="ChevronRight" onClick={() => irASemana(7)}>Semana siguiente</Boton>
      </div>

      <div className="overflow-x-auto rounded-[var(--radio-lg)] border border-borde bg-superficie">
        <div className="grid min-w-[800px] grid-cols-[4rem_repeat(7,1fr)]">
          <div className="border-b border-r border-borde" />
          {dias.map((d, i) => (
            <div
              key={i}
              className={cn(
                "border-b border-r border-borde p-2 text-center text-sm font-medium last:border-r-0",
                d.toDateString() === hoy && "bg-marca-suave text-marca-contraste"
              )}
            >
              {DIAS[i]} <span className="text-texto-tenue">{d.getDate()}</span>
            </div>
          ))}

          {slots.map((hora) => (
            <div key={hora} className="contents">
              <div className="border-b border-r border-borde p-1.5 text-right text-xs text-texto-tenue">{hora}</div>
              {dias.map((d, i) => {
                const cita = citaEn(d, hora);
                const [h, m] = hora.split(":").map(Number);
                const fechaSlot = new Date(d);
                fechaSlot.setHours(h, m, 0, 0);
                const pasado = fechaSlot < new Date();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => (cita ? setCitaVista(cita) : !pasado && setSlotElegido(fechaSlot))}
                    disabled={!cita && pasado}
                    className={cn(
                      "min-h-[44px] border-b border-r border-borde p-1 text-left text-xs last:border-r-0",
                      cita ? "bg-marca-suave hover:brightness-95" : pasado ? "bg-superficie-2 opacity-60" : "hover:bg-superficie-2"
                    )}
                  >
                    {cita && (
                      <span className="block truncate font-medium text-marca-contraste">{cita.cliente.nombre}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Modal abierto={slotElegido !== null} onCerrar={() => setSlotElegido(null)} titulo="Agendar cita" ancho="sm">
        <form action={accion} className="space-y-4">
          <input type="hidden" name="fecha" value={slotElegido?.toISOString() ?? ""} />
          <input type="hidden" name="duracionMin" value={duracionMin} />
          <p className="text-sm text-texto-suave">
            {slotElegido?.toLocaleString("es-MX", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}
          </p>
          <Campo etiqueta="Cliente" nombre="clienteId" requerido>
            <Select name="clienteId" required defaultValue="">
              <option value="" disabled>Elige un cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Campo>
          {esAdmin && (
            <Campo etiqueta="Vendedor" nombre="vendedorId">
              <Select name="vendedorId" defaultValue={usuarioId}>
                {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nombre}</option>)}
              </Select>
            </Campo>
          )}
          {!esAdmin && <input type="hidden" name="vendedorId" value={usuarioId} />}
          <Campo etiqueta="Notas" nombre="notas">
            <Textarea name="notas" placeholder="Detalles de la cita…" />
          </Campo>
          <div className="flex justify-end gap-3 border-t border-borde pt-4">
            <Boton type="button" variante="secundario" onClick={() => setSlotElegido(null)}>Cancelar</Boton>
            <Boton type="submit" cargando={enCurso} icono="Check">Agendar</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={citaVista !== null} onCerrar={() => setCitaVista(null)} titulo="Detalle de la cita" ancho="sm">
        {citaVista && (
          <div className="space-y-3">
            <p className="text-lg font-semibold text-texto">
              <Link href={`/clientes/${citaVista.cliente.id}`} className="hover:underline">{citaVista.cliente.nombre}</Link>
            </p>
            <p className="text-texto-suave">
              {new Date(citaVista.fecha).toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" })} · {citaVista.duracionMin} min
            </p>
            {esAdmin && <p className="text-sm text-texto-tenue">Vendedor: {citaVista.vendedor.nombre}</p>}
            {citaVista.notas && <p className="text-sm text-texto-suave">{citaVista.notas}</p>}
            {citaVista.googleMeetLink && (
              <a href={citaVista.googleMeetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-marca-fuerte hover:underline">
                <Icono nombre="Video" className="size-4" /> Unirse por Google Meet
              </a>
            )}
            <div className="flex justify-end gap-3 border-t border-borde pt-4">
              <Boton
                variante="peligro"
                icono="Trash2"
                onClick={async () => {
                  await cancelarCita(citaVista.id);
                  avisos.exito("Cita cancelada");
                  setCitaVista(null);
                  router.refresh();
                }}
              >
                Cancelar cita
              </Boton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
