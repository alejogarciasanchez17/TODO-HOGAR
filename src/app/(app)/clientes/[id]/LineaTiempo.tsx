"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { Textarea } from "@/components/ui/Input";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { formatoHumano } from "@/lib/utils-fecha";
import { agregarNotaTimeline } from "./actions-timeline";

type Evento = {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  autor: { nombre: string } | null;
};

const ICONO_TIPO: Record<string, NombreIcono> = {
  nota: "FileText",
  llamada: "Phone",
  whatsapp: "MessageCircle",
  correo: "Mail",
  cita: "CalendarDays",
  pago: "Wallet",
  cambio_etapa: "KanbanSquare",
  cambio_estado: "Trophy",
  objecion: "AlertTriangle",
  archivo: "Paperclip",
  reasignacion: "UserCog",
  otro: "Info",
};

export function LineaTiempo({ clienteId, eventos }: { clienteId: string; eventos: Evento[] }) {
  const [texto, setTexto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 16));
  const [guardando, setGuardando] = useState(false);
  const router = useRouter();

  async function agregar() {
    if (!texto.trim()) return;
    setGuardando(true);
    await agregarNotaTimeline(clienteId, texto, fecha);
    setTexto("");
    setGuardando(false);
    router.refresh();
  }

  return (
    <Tarjeta className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-texto">
        <Icono nombre="ListChecks" className="size-5" /> Historial de contacto
      </h2>

      <div className="space-y-2 rounded-[var(--radio-md)] bg-superficie-2 p-3">
        <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe qué pasó (llamada, visita, acuerdo…)" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-texto-suave">
            Fecha
            <input
              type="datetime-local"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-[var(--radio-sm)] border border-borde bg-superficie px-2 py-1 text-sm"
            />
          </label>
          <Boton tamano="sm" icono="Plus" cargando={guardando} onClick={agregar}>Agregar nota</Boton>
        </div>
      </div>

      {eventos.length === 0 ? (
        <p className="py-3 text-center text-sm text-texto-suave">Sin actividad todavía.</p>
      ) : (
        <ol className="space-y-4">
          {eventos.map((ev) => (
            <li key={ev.id} className="flex gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-superficie-2 text-texto-suave">
                <Icono nombre={ICONO_TIPO[ev.tipo] ?? "Info"} className="size-4" />
              </div>
              <div>
                <p className="text-sm text-texto">{ev.descripcion}</p>
                <p className="text-xs text-texto-tenue">
                  {formatoHumano(ev.fecha)} {ev.autor && `· ${ev.autor.nombre}`}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Tarjeta>
  );
}
