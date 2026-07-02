"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { Select } from "@/components/ui/Input";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { avisos } from "@/lib/toast";
import { formatoFechaCorta } from "@/lib/utils-fecha";
import { subirArchivo, eliminarArchivo } from "../archivos-actions";

type Archivo = {
  id: string;
  nombreArchivo: string;
  tipoMime: string;
  tamanoBytes: number;
  etiqueta: string;
  url: string | null;
  creadoEn: string;
  subidoPor: { nombre: string };
};

function formatoTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconoPara(tipo: string): NombreIcono {
  if (tipo === "application/pdf") return "FileText";
  return "Image";
}

export function BloqueArchivos({ clienteId, archivos }: { clienteId: string; archivos: Archivo[] }) {
  const [etiqueta, setEtiqueta] = useState("Comprobante");
  const [aEliminar, setAEliminar] = useState<string | null>(null);
  const [mensaje, accion, enCurso] = useActionState(subirArchivo, undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (mensaje === "OK") {
      avisos.exito("Archivo guardado ✓");
      formRef.current?.reset();
      router.refresh();
    } else if (mensaje) {
      avisos.error(mensaje);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensaje]);

  async function confirmarEliminar() {
    if (!aEliminar) return;
    await eliminarArchivo(aEliminar);
    setAEliminar(null);
    avisos.exito("Archivo eliminado");
    router.refresh();
  }

  return (
    <Tarjeta className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-texto">
        <Icono nombre="Paperclip" className="size-5" /> Archivos y documentos
      </h2>

      <form ref={formRef} action={accion} className="flex flex-col gap-3 rounded-[var(--radio-md)] border border-dashed border-borde p-4 sm:flex-row sm:items-center">
        <input type="hidden" name="clienteId" value={clienteId} />
        <Select name="etiqueta" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} className="sm:w-48">
          <option value="Comprobante">Comprobante</option>
          <option value="Contrato">Contrato</option>
          <option value="Identificacion">Identificación</option>
          <option value="Cotizacion">Cotización</option>
          <option value="Otro">Otro</option>
        </Select>
        <input
          ref={inputRef}
          type="file"
          name="archivo"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          onChange={() => formRef.current?.requestSubmit()}
          className="hidden"
          id="input-archivo"
        />
        <Boton type="button" icono="Upload" cargando={enCurso} onClick={() => inputRef.current?.click()} variante="secundario">
          Subir archivo
        </Boton>
        <p className="text-xs text-texto-tenue">PDF, JPG o PNG · hasta 8 MB</p>
      </form>

      {archivos.length === 0 ? (
        <p className="py-4 text-center text-sm text-texto-suave">Aún no hay archivos de este cliente.</p>
      ) : (
        <div className="divide-y divide-borde">
          {archivos.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-3">
              <Icono nombre={iconoPara(a.tipoMime)} className="size-6 shrink-0 text-texto-tenue" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-texto">{a.nombreArchivo}</p>
                <p className="text-xs text-texto-tenue">
                  {a.etiqueta} · {formatoTamano(a.tamanoBytes)} · Subido por {a.subidoPor.nombre} el {formatoFechaCorta(a.creadoEn)}
                </p>
              </div>
              <a href={a.url ?? `/api/archivos/${a.id}`} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${a.nombreArchivo}`} className="text-texto-suave hover:text-marca">
                <Icono nombre="Download" className="size-5" />
              </a>
              <button onClick={() => setAEliminar(a.id)} aria-label={`Eliminar ${a.nombreArchivo}`} className="text-texto-suave hover:text-peligro">
                <Icono nombre="Trash2" className="size-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        abierto={aEliminar !== null}
        onCerrar={() => setAEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="¿Eliminar este archivo?"
        descripcion="Esta acción no se puede deshacer."
        textoConfirmar="Sí, eliminar"
        variantePeligro
      />
    </Tarjeta>
  );
}
