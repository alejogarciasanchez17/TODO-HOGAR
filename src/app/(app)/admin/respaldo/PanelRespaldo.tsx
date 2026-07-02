"use client";

import { useRef, useState } from "react";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { avisos } from "@/lib/toast";
import { generarRespaldoCompleto, generarCSVClientes, generarCSVPagos, generarCSVCitas, restaurarRespaldo } from "./actions";

function descargar(nombre: string, contenido: string, tipo: string) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export function PanelRespaldo() {
  const [cargando, setCargando] = useState<string | null>(null);
  const [confirmarRestaurar, setConfirmarRestaurar] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fecha = new Date().toISOString().slice(0, 10);

  async function accion(nombre: string, fn: () => Promise<string>, archivo: string, tipo: string) {
    setCargando(nombre);
    try {
      const contenido = await fn();
      descargar(archivo, contenido, tipo);
      avisos.exito("Descarga lista ✓");
    } catch {
      avisos.error("No se pudo generar el archivo");
    } finally {
      setCargando(null);
    }
  }

  async function alElegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const texto = await archivo.text();
    setConfirmarRestaurar(texto);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function confirmarRestauracion() {
    if (!confirmarRestaurar) return;
    const resultado = await restaurarRespaldo(confirmarRestaurar);
    setConfirmarRestaurar(null);
    if (resultado.startsWith("OK:")) {
      const [, clientes, pagos, citas] = resultado.split(":");
      avisos.exito(`Restaurado: ${clientes} clientes, ${pagos} pagos, ${citas} citas agregados`);
    } else {
      avisos.error(resultado);
    }
  }

  return (
    <div className="space-y-4">
      <Tarjeta className="space-y-3">
        <h2 className="font-semibold text-texto">Respaldar todo</h2>
        <p className="text-sm text-texto-suave">Un solo archivo .json con todo (clientes, pagos, citas, notas, plantillas). Sirve para restaurar.</p>
        <Boton icono="Download" cargando={cargando === "json"} onClick={() => accion("json", generarRespaldoCompleto, `respaldo-todo-hogar-${fecha}.json`, "application/json")}>
          Descargar respaldo completo (.json)
        </Boton>
      </Tarjeta>

      <Tarjeta className="space-y-3">
        <h2 className="font-semibold text-texto">Exportar a Excel (.csv)</h2>
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" icono="Download" cargando={cargando === "clientes"} onClick={() => accion("clientes", generarCSVClientes, `clientes-${fecha}.csv`, "text/csv")}>Clientes</Boton>
          <Boton variante="secundario" icono="Download" cargando={cargando === "pagos"} onClick={() => accion("pagos", generarCSVPagos, `pagos-${fecha}.csv`, "text/csv")}>Pagos</Boton>
          <Boton variante="secundario" icono="Download" cargando={cargando === "citas"} onClick={() => accion("citas", generarCSVCitas, `citas-${fecha}.csv`, "text/csv")}>Citas</Boton>
        </div>
      </Tarjeta>

      <Tarjeta className="space-y-3">
        <h2 className="font-semibold text-texto">Restaurar desde respaldo</h2>
        <p className="text-sm text-texto-suave">Sube un archivo .json de respaldo. Solo AGREGA lo que falte; nunca borra ni duplica lo que ya existe.</p>
        <input ref={inputRef} type="file" accept="application/json" onChange={alElegirArchivo} className="hidden" id="input-respaldo" />
        <Boton variante="secundario" icono="Upload" onClick={() => inputRef.current?.click()}>Elegir archivo de respaldo</Boton>
      </Tarjeta>

      <ConfirmDialog
        abierto={confirmarRestaurar !== null}
        onCerrar={() => setConfirmarRestaurar(null)}
        onConfirmar={confirmarRestauracion}
        titulo="¿Restaurar este respaldo?"
        descripcion="Se van a AGREGAR los clientes, pagos y citas que falten. Lo que ya existe no se toca ni se duplica. ¿Seguro?"
        textoConfirmar="Sí, restaurar"
      />
    </div>
  );
}
