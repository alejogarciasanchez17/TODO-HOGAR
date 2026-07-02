"use client";

import { useActionState, useEffect, useState } from "react";
import { Icono } from "@/components/ui/Icono";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { proximosDiasHabiles } from "@/lib/utils-fecha";
import { obtenerSlotsDelDia, agendarCitaPublica } from "./actions";

export function ReservaPublica({
  slug,
  nombreVendedor,
  nombreNegocio,
  colorMarca,
  horarioInicio,
  horarioFin,
}: {
  slug: string;
  nombreVendedor: string;
  nombreNegocio: string;
  colorMarca: string;
  horarioInicio: string;
  horarioFin: string;
}) {
  const dias = proximosDiasHabiles(10);
  const [diaElegido, setDiaElegido] = useState(0);
  const [slots, setSlots] = useState<{ hora: string; fechaISO: string; disponible: boolean }[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(true);
  const [slotElegido, setSlotElegido] = useState<string | null>(null);
  const accionConSlug = agendarCitaPublica.bind(null, slug);
  const [estado, accion, enCurso] = useActionState(accionConSlug, undefined);

  useEffect(() => {
    setCargandoSlots(true);
    obtenerSlotsDelDia(slug, dias[diaElegido].toISOString()).then((s) => {
      setSlots(s);
      setCargandoSlots(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaElegido]);

  const confirmado = estado?.startsWith("OK|");
  const [, fechaConfirmada] = confirmado ? estado!.split("|") : [];

  if (confirmado) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-exito/15">
          <Icono nombre="CheckCircle2" className="size-9 text-exito" />
        </div>
        <h1 className="text-2xl font-semibold text-texto">¡Listo! Tu cita quedó agendada</h1>
        <p className="text-texto-suave">
          Con {nombreVendedor} el {new Date(fechaConfirmada).toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" })}.
        </p>
        <p className="text-sm text-texto-tenue">Te contactamos en menos de 24 horas para confirmar.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg space-y-6 px-4 py-10">
      <div className="text-center">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full text-marca-contraste" style={{ background: colorMarca }}>
          <span className="text-lg font-bold">{nombreVendedor.charAt(0)}</span>
        </div>
        <h1 className="text-2xl font-semibold text-texto">Agenda una llamada con {nombreVendedor}</h1>
        <p className="mt-1 text-texto-suave">{nombreNegocio} · sin compromiso</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {dias.map((d, i) => (
          <button
            key={i}
            onClick={() => { setDiaElegido(i); setSlotElegido(null); }}
            className={cn(
              "flex min-w-[4.5rem] shrink-0 flex-col items-center rounded-[var(--radio-md)] border border-borde px-3 py-2 text-sm",
              diaElegido === i ? "bg-marca text-marca-contraste" : "bg-superficie hover:bg-superficie-2"
            )}
          >
            <span className="font-medium">{d.toLocaleDateString("es-MX", { weekday: "short" })}</span>
            <span>{d.getDate()}</span>
          </button>
        ))}
      </div>

      {!slotElegido ? (
        <div className="space-y-2">
          <p className="text-sm text-texto-suave">Horario de {horarioInicio} a {horarioFin}</p>
          {cargandoSlots ? (
            <p className="py-8 text-center text-texto-suave">Cargando horarios…</p>
          ) : slots.every((s) => !s.disponible) ? (
            <p className="py-8 text-center text-texto-suave">No hay horarios libres este día. Elige otro.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <button
                  key={s.fechaISO}
                  disabled={!s.disponible}
                  onClick={() => setSlotElegido(s.fechaISO)}
                  className={cn(
                    "min-h-[44px] rounded-[var(--radio-sm)] border border-borde text-sm font-medium",
                    s.disponible ? "bg-superficie hover:bg-marca-suave" : "cursor-not-allowed bg-superficie-2 text-texto-tenue opacity-50"
                  )}
                >
                  {s.hora}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <form action={accion} className="space-y-4 rounded-[var(--radio-lg)] border border-borde bg-superficie p-5">
          <input type="hidden" name="fechaISO" value={slotElegido} />
          <p className="font-medium text-texto">
            {new Date(slotElegido).toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" })}
          </p>
          <Campo etiqueta="Tu nombre" nombre="nombre" requerido><Input name="nombre" required /></Campo>
          <Campo etiqueta="Tu WhatsApp" nombre="telefono" requerido ayuda="Con lada, ej. 442 123 4567"><Input name="telefono" required /></Campo>
          <Campo etiqueta="Tu correo (opcional)" nombre="correo"><Input name="correo" type="email" /></Campo>
          {estado === "REINTENTAR" && (
            <p className="rounded-[var(--radio-sm)] bg-advertencia/10 p-3 text-sm text-advertencia">
              Tuvimos un problema al guardar. Tus datos siguen aquí — pulsa &quot;Agendar&quot; otra vez.
            </p>
          )}
          {estado && estado !== "REINTENTAR" && !estado.startsWith("OK:") && (
            <p className="text-sm text-peligro">{estado}</p>
          )}
          <div className="flex gap-3">
            <Boton type="button" variante="secundario" onClick={() => setSlotElegido(null)}>Elegir otro horario</Boton>
            <Boton type="submit" cargando={enCurso} icono="Check">Agendar</Boton>
          </div>
        </form>
      )}
    </div>
  );
}
