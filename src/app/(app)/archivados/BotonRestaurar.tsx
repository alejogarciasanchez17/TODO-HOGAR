"use client";

import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { avisos } from "@/lib/toast";
import { restaurarClienteArchivado } from "../clientes/actions";

export function BotonRestaurar({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  return (
    <Boton
      tamano="sm"
      icono="RotateCcw"
      variante="secundario"
      onClick={async () => {
        await restaurarClienteArchivado(id);
        avisos.exito(`${nombre} restaurado`);
        router.refresh();
      }}
    >
      Restaurar
    </Boton>
  );
}
