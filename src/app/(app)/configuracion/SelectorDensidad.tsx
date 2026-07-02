"use client";

import { useState } from "react";
import { Icono } from "@/components/ui/Icono";
import { cn } from "@/lib/utils";
import { cambiarDensidad } from "@/app/(app)/actions-perfil";

const OPCIONES = [
  { valor: "comoda" as const, etiqueta: "Cómoda", icono: "Sun" as const },
  { valor: "compacta" as const, etiqueta: "Compacta", icono: "Filter" as const },
];

export function SelectorDensidad({ densidadActual }: { densidadActual: string }) {
  const [densidad, setDensidad] = useState(densidadActual);

  return (
    <div className="grid grid-cols-2 gap-3">
      {OPCIONES.map((o) => (
        <button
          key={o.valor}
          onClick={() => {
            setDensidad(o.valor);
            cambiarDensidad(o.valor);
          }}
          className={cn(
            "flex flex-col items-center gap-2 rounded-[var(--radio-md)] border-2 p-4 transition-colors",
            densidad === o.valor ? "border-marca bg-marca-suave" : "border-borde hover:bg-superficie-2"
          )}
        >
          <Icono nombre={o.icono} className="size-6" />
          <span className="text-sm font-medium">{o.etiqueta}</span>
        </button>
      ))}
    </div>
  );
}
