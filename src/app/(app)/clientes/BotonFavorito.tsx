"use client";

import { useState, useTransition } from "react";
import { alternarFavorito } from "./actions";
import { Icono } from "@/components/ui/Icono";
import { cn } from "@/lib/utils";

export function BotonFavorito({ clienteId, esFavorito }: { clienteId: string; esFavorito: boolean }) {
  const [favorito, setFavorito] = useState(esFavorito);
  const [, iniciarTransicion] = useTransition();

  return (
    <button
      type="button"
      aria-label={favorito ? "Quitar de favoritos" : "Agregar a favoritos"}
      aria-pressed={favorito}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorito((v) => !v);
        iniciarTransicion(() => {
          alternarFavorito(clienteId);
        });
      }}
      className="flex size-9 items-center justify-center rounded-full text-texto-tenue hover:bg-superficie-2 hover:text-marca"
    >
      <Icono
        nombre="Star"
        className={cn("size-5", favorito && "fill-marca text-marca")}
      />
    </button>
  );
}
