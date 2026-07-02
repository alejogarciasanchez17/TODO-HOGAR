"use client";

import { useEffect } from "react";
import { Icono } from "@/components/ui/Icono";
import { Boton } from "@/components/ui/Boton";

export default function ErrorGeneral({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Error inesperado en el CRM:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-fondo px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-peligro/15">
        <Icono nombre="AlertTriangle" className="size-8 text-peligro" />
      </div>
      <h1 className="text-2xl font-semibold text-texto">Algo salió mal</h1>
      <p className="max-w-sm text-texto-suave">No es tu culpa, tuvimos un problema técnico. Intenta de nuevo; si sigue pasando, avísale al administrador.</p>
      <div className="flex gap-3">
        <Boton variante="secundario" onClick={() => reset()} icono="RefreshCw">Reintentar</Boton>
        <a href="/dashboard">
          <Boton icono="Home">Volver al inicio</Boton>
        </a>
      </div>
    </div>
  );
}
