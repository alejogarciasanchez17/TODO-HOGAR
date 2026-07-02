"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icono } from "./Icono";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  ancho?: "sm" | "md" | "lg";
};

const ANCHOS = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

export function Modal({ abierto, onCerrar, titulo, descripcion, children, ancho = "md" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  // Evita el mismatch de hidratación: en el servidor no existe `document`,
  // así que esperamos a montar en el cliente antes de crear el portal
  // (renderizar null en ambos lados en el primer paint del cliente).
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  if (!montado) return null;

  return createPortal(
    <dialog
      ref={ref}
      onClose={onCerrar}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCerrar();
      }}
      aria-labelledby="modal-titulo"
      className={cn(
        "m-0 w-full rounded-[var(--radio-lg)] border border-borde bg-superficie p-0 text-texto shadow-[var(--sombra-flotante)] backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto",
        ANCHOS[ancho]
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-borde p-5">
        <div>
          <h2 id="modal-titulo" className="text-xl font-semibold">
            {titulo}
          </h2>
          {descripcion && <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-2"
        >
          <Icono nombre="X" className="size-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>,
    document.body
  );
}
