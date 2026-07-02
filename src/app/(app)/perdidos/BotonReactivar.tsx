"use client";

import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { avisos } from "@/lib/toast";
import { reactivarClientePerdido } from "../clientes/actions";

export function BotonReactivar({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  return (
    <Boton
      tamano="sm"
      icono="RotateCcw"
      variante="secundario"
      onClick={async () => {
        await reactivarClientePerdido(id);
        avisos.exito(`${nombre} reactivado y de vuelta en el embudo`);
        router.refresh();
      }}
    >
      Reactivar
    </Boton>
  );
}
