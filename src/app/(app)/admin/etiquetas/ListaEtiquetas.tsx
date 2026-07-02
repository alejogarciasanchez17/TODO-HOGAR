"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icono } from "@/components/ui/Icono";
import { avisos } from "@/lib/toast";
import { crearEtiqueta, eliminarEtiqueta } from "./actions";

type Etiqueta = { id: string; nombre: string; color: string; clientes: number };

export function ListaEtiquetas({ etiquetas }: { etiquetas: Etiqueta[] }) {
  const router = useRouter();
  const [modalNuevo, setModalNuevo] = useState(false);
  const [aEliminar, setAEliminar] = useState<Etiqueta | null>(null);
  const [estado, accion, enCurso] = useActionState(crearEtiqueta, undefined);

  useEffect(() => {
    if (estado === "OK") {
      setModalNuevo(false);
      avisos.exito("Etiqueta creada ✓");
      router.refresh();
    } else if (estado) {
      avisos.error(estado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  async function confirmarEliminar() {
    if (!aEliminar) return;
    await eliminarEtiqueta(aEliminar.id);
    avisos.exito("Etiqueta eliminada");
    setAEliminar(null);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Boton icono="Plus" onClick={() => setModalNuevo(true)}>Nueva etiqueta</Boton>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {etiquetas.length === 0 && (
          <Tarjeta className="col-span-full text-center text-texto-suave">Todavía no hay etiquetas.</Tarjeta>
        )}
        {etiquetas.map((e) => (
          <Tarjeta key={e.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="size-4 rounded-full" style={{ background: e.color }} />
              <div>
                <p className="font-medium text-texto">{e.nombre}</p>
                <p className="text-xs text-texto-tenue">{e.clientes} {e.clientes === 1 ? "cliente" : "clientes"}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Eliminar etiqueta"
              onClick={() => setAEliminar(e)}
              className="text-texto-suave hover:text-peligro"
            >
              <Icono nombre="Trash2" className="size-5" />
            </button>
          </Tarjeta>
        ))}
      </div>

      <Modal abierto={modalNuevo} onCerrar={() => setModalNuevo(false)} titulo="Nueva etiqueta" ancho="sm">
        <form action={accion} className="space-y-4">
          <Campo etiqueta="Nombre" nombre="nombre" requerido>
            <Input name="nombre" required placeholder="Ej. Página contado" maxLength={40} />
          </Campo>
          <Campo etiqueta="Color" nombre="color">
            <Input name="color" type="color" defaultValue="#e8b763" className="h-10 w-20 p-1" />
          </Campo>
          <div className="flex justify-end gap-3 border-t border-borde pt-4">
            <Boton type="button" variante="secundario" onClick={() => setModalNuevo(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={enCurso} icono="Check">Guardar</Boton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={aEliminar !== null}
        onCerrar={() => setAEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="¿Eliminar esta etiqueta?"
        descripcion={aEliminar && aEliminar.clientes > 0 ? `Se quitará de ${aEliminar.clientes} ${aEliminar.clientes === 1 ? "cliente" : "clientes"} que la tienen.` : "Esta acción no se puede deshacer."}
        textoConfirmar="Sí, eliminar"
        variantePeligro
      />
    </div>
  );
}
