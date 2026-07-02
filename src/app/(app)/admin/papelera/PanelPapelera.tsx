"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatoHumano } from "@/lib/utils-fecha";
import { formatoMoneda } from "@/lib/moneda";
import { avisos } from "@/lib/toast";
import { restaurarDesdePapelera, vaciarPapelera } from "./actions";

type Cliente = { id: string; nombre: string; eliminadoEn: string };
type Pago = { id: string; monto: number; cliente: string; eliminadoEn: string };
type Cita = { id: string; fecha: string; cliente: string; eliminadoEn: string };

export function PanelPapelera({ clientes, pagos, citas }: { clientes: Cliente[]; pagos: Pago[]; citas: Cita[] }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const total = clientes.length + pagos.length + citas.length;

  async function restaurar(tipo: "cliente" | "pago" | "cita", id: string) {
    await restaurarDesdePapelera(tipo, id);
    avisos.exito("Restaurado ✓");
    router.refresh();
  }

  if (total === 0) {
    return (
      <Tarjeta className="flex flex-col items-center gap-2 py-14 text-center">
        <p className="font-medium text-texto">La papelera está vacía.</p>
      </Tarjeta>
    );
  }

  return (
    <div className="space-y-4">
      {clientes.length > 0 && (
        <Tarjeta className="space-y-2">
          <h2 className="font-semibold text-texto">Clientes ({clientes.length})</h2>
          {clientes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{c.nombre} · eliminado {formatoHumano(c.eliminadoEn)}</span>
              <Boton tamano="sm" variante="secundario" icono="RotateCcw" onClick={() => restaurar("cliente", c.id)}>Restaurar</Boton>
            </div>
          ))}
        </Tarjeta>
      )}
      {pagos.length > 0 && (
        <Tarjeta className="space-y-2">
          <h2 className="font-semibold text-texto">Pagos ({pagos.length})</h2>
          {pagos.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{formatoMoneda(p.monto)} · {p.cliente} · eliminado {formatoHumano(p.eliminadoEn)}</span>
              <Boton tamano="sm" variante="secundario" icono="RotateCcw" onClick={() => restaurar("pago", p.id)}>Restaurar</Boton>
            </div>
          ))}
        </Tarjeta>
      )}
      {citas.length > 0 && (
        <Tarjeta className="space-y-2">
          <h2 className="font-semibold text-texto">Citas ({citas.length})</h2>
          {citas.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{c.cliente} · {formatoHumano(c.fecha)}</span>
              <Boton tamano="sm" variante="secundario" icono="RotateCcw" onClick={() => restaurar("cita", c.id)}>Restaurar</Boton>
            </div>
          ))}
        </Tarjeta>
      )}

      <Boton variante="peligro" icono="Trash2" onClick={() => setConfirmando(true)}>Vaciar papelera</Boton>

      <ConfirmDialog
        abierto={confirmando}
        onCerrar={() => setConfirmando(false)}
        onConfirmar={async () => {
          await vaciarPapelera();
          avisos.exito("Papelera vaciada");
          setConfirmando(false);
          router.refresh();
        }}
        titulo="¿Vaciar la papelera?"
        descripcion="Esto borra PARA SIEMPRE todo lo que está aquí. Esta acción no se puede deshacer."
        textoConfirmar="Sí, vaciar para siempre"
        variantePeligro
      />
    </div>
  );
}
