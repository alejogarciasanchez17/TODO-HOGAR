"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { avisos } from "@/lib/toast";
import { establecerProximaAccion } from "./actions-timeline";

type AccionIA = "redactar" | "temperatura" | "proxima_accion" | "resumen" | "objecion";

const ACCIONES: { id: AccionIA; icono: NombreIcono; texto: string }[] = [
  { id: "redactar", icono: "MessageCircle", texto: "Redactar mensaje" },
  { id: "temperatura", icono: "ThermometerSun", texto: "Clasificar temperatura" },
  { id: "proxima_accion", icono: "Target", texto: "Sugerir próxima acción" },
  { id: "resumen", icono: "FileText", texto: "Resumir expediente" },
  { id: "objecion", icono: "Handshake", texto: "Manejar objeción" },
];

export function PanelIA({ clienteId }: { clienteId: string }) {
  const [cargando, setCargando] = useState<AccionIA | null>(null);
  const [resultado, setResultado] = useState<{ accion: AccionIA; texto: string; local: boolean } | null>(null);
  const router = useRouter();

  async function ejecutar(accion: AccionIA) {
    setCargando(accion);
    setResultado(null);
    try {
      const respuesta = await fetch("/api/ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId, accion }),
      });
      const datos = await respuesta.json();
      setResultado({ accion, texto: datos.texto, local: datos.local });
      if (accion === "proxima_accion" && datos.fechaSugerida && datos.accionSugerida) {
        setResultado({ accion, texto: `${datos.accionSugerida} (sugerido para ${datos.fechaSugerida})`, local: datos.local });
      }
    } catch {
      avisos.error("El asistente no respondió. Intenta de nuevo en un momento");
    } finally {
      setCargando(null);
    }
  }

  async function aprobarProximaAccion() {
    if (!resultado) return;
    const [texto, resto] = resultado.texto.split(" (sugerido para ");
    const fecha = resto ? resto.replace(")", "") : new Date().toISOString().slice(0, 10);
    await establecerProximaAccion(clienteId, texto, fecha);
    avisos.exito("Próxima acción guardada");
    router.refresh();
  }

  return (
    <Tarjeta className="space-y-4 vidrio">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-texto">
        <Icono nombre="Sparkles" className="size-5" style={{ color: "var(--color-acento-ia)" }} /> Tu copiloto para vender
      </h2>
      <div className="flex flex-wrap gap-2">
        {ACCIONES.map((a) => (
          <Boton key={a.id} tamano="sm" variante="secundario" icono={a.icono} cargando={cargando === a.id} onClick={() => ejecutar(a.id)}>
            {a.texto}
          </Boton>
        ))}
      </div>
      {resultado && (
        <div className="rounded-[var(--radio-md)] bg-superficie-2 p-4">
          <p className="whitespace-pre-line text-sm text-texto">{resultado.texto}</p>
          {resultado.local && (
            <p className="mt-2 text-xs text-texto-tenue">
              💡 Esta respuesta usa una plantilla local. Activa el asistente de IA poniendo tu llave para respuestas más personalizadas.
            </p>
          )}
          {resultado.accion === "proxima_accion" && (
            <Boton tamano="sm" icono="Check" className="mt-3" onClick={aprobarProximaAccion}>
              Usar como próxima acción
            </Boton>
          )}
        </div>
      )}
    </Tarjeta>
  );
}
