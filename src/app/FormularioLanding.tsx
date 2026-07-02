"use client";

import { useEffect, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Input } from "@/components/ui/Input";
import { Icono } from "@/components/ui/Icono";
import { cn } from "@/lib/utils";
import { proximosDiasHabiles } from "@/lib/utils-fecha";
import { obtenerSlotsLanding, enviarLandingLead } from "./actions-landing";

const CLAVE_INTENTO = "todohogar_landing_intento_pendiente";

type DatosIntento = { nombre: string; telefono: string; correo: string; fechaISO: string; vendedorId: string; canalUTM: string };

export function FormularioLanding({
  vendedorId,
  vendedorNombre,
  horarioInicio,
  horarioFin,
  canalUTM,
  whatsappNegocio,
}: {
  vendedorId: string;
  vendedorNombre: string;
  horarioInicio: string;
  horarioFin: string;
  canalUTM: string;
  whatsappNegocio: string;
}) {
  const dias = proximosDiasHabiles(10);
  const [diaElegido, setDiaElegido] = useState(0);
  const [slots, setSlots] = useState<{ hora: string; fechaISO: string; disponible: boolean }[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(true);
  const [slotElegido, setSlotElegido] = useState<string | null>(null);
  const [enCurso, setEnCurso] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<string | null>(null);
  const [hayIntentoPendiente, setHayIntentoPendiente] = useState(false);

  useEffect(() => {
    setCargandoSlots(true);
    obtenerSlotsLanding(vendedorId, dias[diaElegido].toISOString()).then((s) => {
      setSlots(s);
      setCargandoSlots(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaElegido]);

  useEffect(() => {
    try {
      if (localStorage.getItem(CLAVE_INTENTO)) setHayIntentoPendiente(true);
    } catch {}
  }, []);

  async function enviar(datos: DatosIntento) {
    setEnCurso(true);
    setMensaje(null);
    try {
      const formData = new FormData();
      Object.entries(datos).forEach(([k, v]) => formData.set(k, v));
      const resultado = await enviarLandingLead(undefined, formData);
      if (resultado.startsWith("OK|")) {
        try {
          localStorage.removeItem(CLAVE_INTENTO);
        } catch {}
        setHayIntentoPendiente(false);
        setConfirmado(resultado.slice(3));
      } else if (resultado === "REINTENTAR") {
        guardarIntentoLocal(datos);
        setMensaje("Tuvimos un problema al guardar, pero no perdimos tus datos. Pulsa 'Reintentar' en un momento.");
      } else {
        setMensaje(resultado);
      }
    } catch {
      // Falla de red real (sin conexión): nunca perdemos el lead.
      guardarIntentoLocal(datos);
      setMensaje("Parece que no hay conexión. Guardamos tus datos y los enviaremos en cuanto vuelvas a tener internet.");
    } finally {
      setEnCurso(false);
    }
  }

  function guardarIntentoLocal(datos: DatosIntento) {
    try {
      localStorage.setItem(CLAVE_INTENTO, JSON.stringify(datos));
      setHayIntentoPendiente(true);
    } catch {}
  }

  function reintentarGuardado() {
    try {
      const guardado = localStorage.getItem(CLAVE_INTENTO);
      if (guardado) enviar(JSON.parse(guardado));
    } catch {}
  }

  function alEnviarFormulario(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slotElegido) return;
    const form = new FormData(e.currentTarget);
    enviar({
      nombre: String(form.get("nombre") ?? ""),
      telefono: String(form.get("telefono") ?? ""),
      correo: String(form.get("correo") ?? ""),
      fechaISO: slotElegido,
      vendedorId,
      canalUTM,
    });
  }

  const mensajeWhatsapp = encodeURIComponent("Hola, vengo de la página de todo hogar y quisiera más información 🙂");

  if (confirmado) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[var(--radio-xl)] border border-borde bg-superficie p-8 text-center shadow-[var(--sombra-suave)]">
        <div className="flex size-16 items-center justify-center rounded-full bg-exito/15">
          <Icono nombre="CheckCircle2" className="size-9 text-exito" />
        </div>
        <h3 className="text-2xl font-semibold text-texto">¡Listo! Te contactamos en menos de 24 horas</h3>
        <p className="text-texto-suave">
          Tu cita quedó para el {new Date(confirmado).toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" })}.
        </p>
        <a href={`https://wa.me/${whatsappNegocio}?text=${mensajeWhatsapp}`} target="_blank" rel="noopener noreferrer">
          <Boton icono="MessageCircle" variante="exito" tamano="lg">Escríbenos ya por WhatsApp</Boton>
        </a>
      </div>
    );
  }

  return (
    <div id="agenda" className="space-y-4 rounded-[var(--radio-xl)] border border-borde bg-superficie p-6 shadow-[var(--sombra-suave)] sm:p-8">
      <h3 className="text-xl font-semibold text-texto">Agenda tu cita, sin compromiso</h3>
      <p className="text-sm text-texto-suave">Con {vendedorNombre} · horario de {horarioInicio} a {horarioFin}</p>

      {hayIntentoPendiente && !confirmado && (
        <div className="flex items-center justify-between gap-2 rounded-[var(--radio-md)] bg-advertencia/10 p-3 text-sm text-advertencia">
          <span>Tienes una cita sin enviar guardada en este dispositivo.</span>
          <Boton tamano="sm" variante="secundario" onClick={reintentarGuardado} cargando={enCurso}>Reintentar</Boton>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {dias.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setDiaElegido(i); setSlotElegido(null); }}
            className={cn(
              "flex min-w-[4rem] shrink-0 flex-col items-center rounded-[var(--radio-md)] border border-borde px-3 py-2 text-sm",
              diaElegido === i ? "bg-marca text-marca-contraste" : "bg-superficie hover:bg-superficie-2"
            )}
          >
            <span className="font-medium">{d.toLocaleDateString("es-MX", { weekday: "short" })}</span>
            <span>{d.getDate()}</span>
          </button>
        ))}
      </div>

      {!slotElegido ? (
        cargandoSlots ? (
          <p className="py-6 text-center text-sm text-texto-suave">Cargando horarios…</p>
        ) : slots.every((s) => !s.disponible) ? (
          <p className="py-6 text-center text-sm text-texto-suave">No hay horarios libres este día. Elige otro.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((s) => (
              <button
                key={s.fechaISO}
                type="button"
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
        )
      ) : (
        <form onSubmit={alEnviarFormulario} className="space-y-3">
          <p className="text-sm font-medium text-texto">
            {new Date(slotElegido).toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" })}
          </p>
          <Campo etiqueta="Tu nombre" nombre="nombre" requerido>
            <Input name="nombre" required placeholder="Nombre completo" />
          </Campo>
          <Campo etiqueta="Tu WhatsApp" nombre="telefono" requerido ayuda="Con lada, ej. 442 123 4567">
            <Input name="telefono" required placeholder="442 123 4567" />
          </Campo>
          <Campo etiqueta="Correo (opcional)" nombre="correo">
            <Input name="correo" type="email" placeholder="tucorreo@ejemplo.com" />
          </Campo>
          {mensaje && <p className="rounded-[var(--radio-sm)] bg-advertencia/10 p-3 text-sm text-advertencia">{mensaje}</p>}
          <div className="flex gap-3">
            <Boton type="button" variante="secundario" onClick={() => setSlotElegido(null)}>Elegir otro horario</Boton>
            <Boton type="submit" cargando={enCurso} icono="CalendarDays" anchoCompleto>Agendar mi cita</Boton>
          </div>
        </form>
      )}
    </div>
  );
}
