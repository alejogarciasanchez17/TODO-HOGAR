"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Boton } from "./Boton";

type Props = {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: () => Promise<void> | void;
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  variantePeligro?: boolean;
};

/** Confirmación clara antes de cualquier acción destructiva o de cambio de estado importante. */
export function ConfirmDialog({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  variantePeligro = false,
}: Props) {
  const [cargando, setCargando] = useState(false);

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo} descripcion={descripcion} ancho="sm">
      <div className="flex justify-end gap-3">
        <Boton variante="secundario" onClick={onCerrar} disabled={cargando}>
          Cancelar
        </Boton>
        <Boton
          variante={variantePeligro ? "peligro" : "primario"}
          cargando={cargando}
          onClick={async () => {
            setCargando(true);
            try {
              await onConfirmar();
            } finally {
              setCargando(false);
            }
          }}
        >
          {textoConfirmar}
        </Boton>
      </div>
    </Modal>
  );
}
