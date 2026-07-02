"use client";

import { useEffect, useRef, useState } from "react";
import { Icono } from "@/components/ui/Icono";
import { reiniciarOnboarding } from "@/app/(app)/actions-perfil";

const ATAJOS = [
  { tecla: "/ o Ctrl/Cmd + K", accion: "Abrir el buscador" },
  { tecla: "N", accion: "Crear un cliente nuevo" },
  { tecla: "G luego H", accion: "Ir a “Hoy te toca”" },
  { tecla: "Esc", accion: "Cerrar ventanas y el buscador" },
  { tecla: "?", accion: "Ver esta lista de atajos" },
];

export function BotonAyuda() {
  const [vista, setVista] = useState<"cerrado" | "menu" | "atajos" | "ritual">("cerrado");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alHacerClicFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setVista("cerrado");
    }
    function abrirDesdeOtroLado() {
      setVista("menu");
    }
    document.addEventListener("mousedown", alHacerClicFuera);
    document.addEventListener("abrir-ayuda", abrirDesdeOtroLado);
    return () => {
      document.removeEventListener("mousedown", alHacerClicFuera);
      document.removeEventListener("abrir-ayuda", abrirDesdeOtroLado);
    };
  }, []);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setVista((v) => (v === "cerrado" ? "menu" : "cerrado"))}
        aria-label="Ayuda"
        className="flex size-11 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-2 hover:text-texto"
      >
        <Icono nombre="LifeBuoy" className="size-5" />
      </button>

      {vista !== "cerrado" && (
        <div className="vidrio absolute right-0 top-full z-50 mt-2 w-80 rounded-[var(--radio-md)] bg-superficie p-2 shadow-[var(--sombra-flotante)]">
          {vista === "menu" && (
            <div className="space-y-1">
              <p className="px-3 py-1.5 text-sm font-semibold text-texto">Ayuda</p>
              <button
                onClick={() => {
                  reiniciarOnboarding();
                  window.location.reload();
                }}
                className="flex w-full items-center gap-2.5 rounded-[var(--radio-sm)] px-3 py-2.5 text-left text-sm hover:bg-superficie-2"
              >
                <Icono nombre="Sparkles" className="size-4 text-marca" />
                Ver el tutorial de nuevo
              </button>
              <button
                onClick={() => setVista("atajos")}
                className="flex w-full items-center gap-2.5 rounded-[var(--radio-sm)] px-3 py-2.5 text-left text-sm hover:bg-superficie-2"
              >
                <Icono nombre="ListChecks" className="size-4 text-texto-suave" />
                Atajos de teclado
              </button>
              <button
                onClick={() => setVista("ritual")}
                className="flex w-full items-center gap-2.5 rounded-[var(--radio-sm)] px-3 py-2.5 text-left text-sm hover:bg-superficie-2"
              >
                <Icono nombre="ListChecks" className="size-4 text-texto-suave" />
                ¿Cómo uso esto cada mañana?
              </button>
            </div>
          )}
          {vista === "atajos" && (
            <div className="p-2">
              <button onClick={() => setVista("menu")} className="mb-2 text-xs text-texto-tenue hover:text-texto">
                ← Atrás
              </button>
              <ul className="space-y-2">
                {ATAJOS.map((a) => (
                  <li key={a.tecla} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-texto-suave">{a.accion}</span>
                    <kbd className="rounded border border-borde bg-superficie-2 px-2 py-0.5 text-xs">{a.tecla}</kbd>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {vista === "ritual" && (
            <div className="p-3">
              <button onClick={() => setVista("menu")} className="mb-2 text-xs text-texto-tenue hover:text-texto">
                ← Atrás
              </button>
              <ol className="list-decimal space-y-2 pl-4 text-sm text-texto-suave">
                <li>Abre <strong className="text-texto">Hoy te toca</strong> y revisa a quién contactar.</li>
                <li>Contacta primero a los 🔥 calientes con un clic de WhatsApp o correo.</li>
                <li>Registra qué pasó y deja lista la próxima acción con fecha.</li>
                <li>Revisa tu campanita 🔔 por recordatorios vencidos.</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
