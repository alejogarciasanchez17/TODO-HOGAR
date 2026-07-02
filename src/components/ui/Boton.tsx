"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Icono, type NombreIcono } from "./Icono";

type Variante = "primario" | "secundario" | "fantasma" | "peligro" | "exito";
type Tamano = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  icono?: NombreIcono;
  iconoDerecha?: NombreIcono;
  anchoCompleto?: boolean;
};

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-marca text-marca-contraste hover:bg-marca-fuerte active:scale-[0.98] shadow-sm",
  secundario:
    "bg-superficie text-texto border border-borde hover:bg-superficie-2 active:scale-[0.98]",
  fantasma: "bg-transparent text-texto hover:bg-superficie-2 active:scale-[0.98]",
  peligro: "bg-peligro text-white hover:brightness-110 active:scale-[0.98]",
  exito: "bg-exito text-white hover:brightness-110 active:scale-[0.98]",
};

const TAMANOS: Record<Tamano, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-[var(--radio-sm)]",
  md: "h-11 px-4 text-base gap-2 rounded-[var(--radio-md)]",
  lg: "h-13 px-6 text-lg gap-2.5 rounded-[var(--radio-md)]",
};

export const Boton = forwardRef<HTMLButtonElement, Props>(function Boton(
  {
    variante = "primario",
    tamano = "md",
    cargando = false,
    icono,
    iconoDerecha,
    anchoCompleto,
    disabled,
    className,
    children,
    ...resto
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || cargando}
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center font-medium transition-all duration-150",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        "min-h-[44px]",
        VARIANTES[variante],
        TAMANOS[tamano],
        anchoCompleto && "w-full",
        className
      )}
      {...resto}
    >
      {cargando ? (
        <Icono nombre="Loader2" className="size-4 animate-spin" aria-hidden />
      ) : (
        icono && <Icono nombre={icono} className="size-4 shrink-0" aria-hidden />
      )}
      <span>{cargando ? "Guardando…" : children}</span>
      {!cargando && iconoDerecha && (
        <Icono nombre={iconoDerecha} className="size-4 shrink-0" aria-hidden />
      )}
    </button>
  );
});
