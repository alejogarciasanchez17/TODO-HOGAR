"use client";

import { useEffect, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { PASOS_ADMIN, PASOS_VENDEDOR } from "./pasos-tour";
import { completarOnboarding } from "@/app/(app)/actions-perfil";

export function Tour({ onboardingCompletado, esAdmin }: { onboardingCompletado: boolean; esAdmin: boolean }) {
  const [activo, setActivo] = useState(false);
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const pasos = esAdmin ? PASOS_ADMIN : PASOS_VENDEDOR;

  useEffect(() => {
    if (!onboardingCompletado) setActivo(true);
  }, [onboardingCompletado]);

  useEffect(() => {
    function relanzar() {
      setPaso(0);
      setActivo(true);
    }
    window.addEventListener("todohogar:relanzar-tour", relanzar);
    document.addEventListener("relanzar-tour", relanzar);
    return () => {
      window.removeEventListener("todohogar:relanzar-tour", relanzar);
      document.removeEventListener("relanzar-tour", relanzar);
    };
  }, []);

  useEffect(() => {
    if (!activo) return;
    const selector = pasos[paso]?.selector;
    if (!selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(selector);
    if (el) {
      setRect(el.getBoundingClientRect());
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
      setRect(null);
    }
  }, [activo, paso, pasos]);

  async function terminar() {
    await completarOnboarding();
    setActivo(false);
  }

  if (!activo) return null;

  const info = pasos[paso];
  const esUltimo = paso === pasos.length - 1;

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal aria-label="Tutorial de bienvenida">
      <div className="absolute inset-0 bg-black/60" onClick={terminar} />
      {rect && (
        <div
          className="pointer-events-none absolute rounded-[var(--radio-md)] ring-4 ring-marca transition-all duration-300"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
        />
      )}
      <div
        className="absolute w-[90vw] max-w-sm rounded-[var(--radio-lg)] bg-superficie p-5 shadow-[var(--sombra-flotante)]"
        style={
          rect
            ? { top: Math.min(rect.bottom + 16, window.innerHeight - 220), left: Math.min(Math.max(rect.left, 16), window.innerWidth - 340) }
            : { top: "40%", left: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        <p className="text-xs font-medium uppercase tracking-wide text-texto-tenue">Paso {paso + 1} de {pasos.length}</p>
        <h3 className="mt-1 text-lg font-semibold text-texto">{info.titulo}</h3>
        <p className="mt-1.5 text-sm text-texto-suave">{info.texto}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button onClick={terminar} className="text-sm font-medium text-texto-tenue hover:text-texto">
            Saltar tour
          </button>
          <div className="flex gap-2">
            {paso > 0 && (
              <Boton tamano="sm" variante="secundario" onClick={() => setPaso((p) => p - 1)}>
                Atrás
              </Boton>
            )}
            <Boton tamano="sm" onClick={() => (esUltimo ? terminar() : setPaso((p) => p + 1))}>
              {esUltimo ? "Terminar" : "Siguiente"}
            </Boton>
          </div>
        </div>
      </div>
    </div>
  );
}
