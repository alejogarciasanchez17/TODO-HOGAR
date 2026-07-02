"use client";

import { Boton } from "@/components/ui/Boton";

export function BotonImprimir() {
  return (
    <Boton icono="FileText" onClick={() => window.print()}>
      Imprimir / Guardar PDF
    </Boton>
  );
}
