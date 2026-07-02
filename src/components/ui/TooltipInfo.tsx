"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icono } from "./Icono";

/**
 * Ícono "i" con explicación + consejo de venta. Se abre con hover o teclado
 * (foco + Enter/Espacio), se cierra con Escape o al tocar fuera.
 */
export function TooltipInfo({
  texto,
  consejo,
  className,
}: {
  texto: string;
  consejo?: string;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const id = useId();
  const contenedorRef = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={contenedorRef}
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <button
        type="button"
        aria-describedby={abierto ? id : undefined}
        aria-label="Más información"
        className="inline-flex size-5 items-center justify-center rounded-full text-texto-tenue hover:text-marca focus-visible:text-marca"
        onFocus={() => setAbierto(true)}
        onBlur={() => setAbierto(false)}
        onClick={() => setAbierto((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAbierto(false);
        }}
      >
        <Icono nombre="Info" className="size-4" />
      </button>
      {abierto && (
        <span
          role="tooltip"
          id={id}
          className="vidrio absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-[var(--radio-md)] p-3 text-sm text-texto shadow-[var(--sombra-flotante)]"
        >
          <span className="block">{texto}</span>
          {consejo && (
            <span className="mt-1.5 block border-t border-borde pt-1.5 text-marca-fuerte">
              💡 {consejo}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
