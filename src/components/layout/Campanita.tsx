"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icono } from "@/components/ui/Icono";
import { Boton } from "@/components/ui/Boton";
import { formatoHumano } from "@/lib/utils-fecha";
import { cn } from "@/lib/utils";

type Recordatorio = {
  id: string;
  texto: string;
  fecha: string;
  clienteId: string | null;
  clienteNombre: string | null;
};
type Mencion = { id: string; texto: string; fecha: string; entidad: string; entidadId: string | null };

export function Campanita({
  recordatoriosIniciales,
  mencionesIniciales,
  vencidosIniciales,
}: {
  recordatoriosIniciales: Recordatorio[];
  mencionesIniciales: Mencion[];
  vencidosIniciales: number;
}) {
  const [abierto, setAbierto] = useState(false);
  const [recordatorios, setRecordatorios] = useState(recordatoriosIniciales);
  const [menciones, setMenciones] = useState(mencionesIniciales);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function alHacerClicFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", alHacerClicFuera);
    return () => document.removeEventListener("mousedown", alHacerClicFuera);
  }, []);

  async function marcarHecho(id: string) {
    setRecordatorios((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/recordatorios/${id}`, { method: "PATCH", body: JSON.stringify({ accion: "hecho" }) });
    router.refresh();
  }

  async function posponer(id: string) {
    setRecordatorios((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/recordatorios/${id}`, { method: "PATCH", body: JSON.stringify({ accion: "posponer" }) });
    router.refresh();
  }

  async function marcarMencionLeida(id: string) {
    setMenciones((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/menciones/${id}`, { method: "PATCH" });
  }

  const total = recordatorios.length + menciones.length;
  const vencidos = recordatorios.filter((r) => new Date(r.fecha) <= new Date()).length || vencidosIniciales;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={`Recordatorios y menciones (${total})`}
        className="relative flex size-11 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-2 hover:text-texto"
      >
        <Icono nombre="Bell" className="size-5" />
        {total > 0 && (
          <span
            className={cn(
              "absolute right-1.5 top-1.5 flex size-4.5 items-center justify-center rounded-full text-[10px] font-semibold text-white",
              vencidos > 0 ? "bg-peligro" : "bg-marca"
            )}
          >
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {abierto && (
        <div className="vidrio absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-[22rem] overflow-y-auto rounded-[var(--radio-md)] p-2 shadow-[var(--sombra-flotante)] bg-superficie">
          <p className="px-3 py-2 text-sm font-semibold text-texto">Recordatorios y menciones</p>
          {total === 0 && (
            <p className="px-3 py-6 text-center text-sm text-texto-suave">
              No tienes pendientes. ¡Vas al día! 🎉
            </p>
          )}
          {recordatorios.map((r) => {
            const vencido = new Date(r.fecha) <= new Date();
            return (
              <div key={r.id} className="rounded-[var(--radio-sm)] px-3 py-2.5 hover:bg-superficie-2">
                <p className={cn("text-sm", vencido ? "text-peligro font-medium" : "text-texto")}>{r.texto}</p>
                <p className="mt-0.5 text-xs text-texto-tenue">{formatoHumano(r.fecha)}</p>
                <div className="mt-2 flex gap-2">
                  <Boton tamano="sm" variante="secundario" onClick={() => marcarHecho(r.id)} icono="Check">
                    Hecho
                  </Boton>
                  <Boton tamano="sm" variante="fantasma" onClick={() => posponer(r.id)} icono="Clock">
                    Posponer 1 día
                  </Boton>
                </div>
              </div>
            );
          })}
          {menciones.map((m) => (
            <button
              key={m.id}
              onClick={() => marcarMencionLeida(m.id)}
              className="flex w-full items-start gap-2 rounded-[var(--radio-sm)] px-3 py-2.5 text-left hover:bg-superficie-2"
            >
              <Icono nombre="User" className="mt-0.5 size-4 shrink-0 text-texto-tenue" />
              <span>
                <span className="block text-sm text-texto">{m.texto}</span>
                <span className="block text-xs text-texto-tenue">{formatoHumano(m.fecha)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
