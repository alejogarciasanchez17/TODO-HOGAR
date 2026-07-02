"use client";

import { Boton } from "@/components/ui/Boton";
import { reiniciarOnboarding } from "@/app/(app)/actions-perfil";

export function BotonRelanzarTour() {
  return (
    <Boton
      tamano="sm"
      variante="secundario"
      icono="Sparkles"
      onClick={async () => {
        await reiniciarOnboarding();
        window.location.reload();
      }}
    >
      Ver tutorial de nuevo
    </Boton>
  );
}
