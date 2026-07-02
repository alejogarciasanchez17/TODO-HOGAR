"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cambiarTema } from "@/app/(app)/actions-perfil";
import { TEMAS, type Tema } from "@/lib/tema";
import { Icono } from "@/components/ui/Icono";
import { cn } from "@/lib/utils";

function aplicarTemaEnDom(tema: Tema) {
  const raiz = document.documentElement;
  raiz.setAttribute("data-tema-pref", tema);
  if (tema === "automatico") {
    const oscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    raiz.setAttribute("data-tema", oscuro ? "oscuro" : "claro");
  } else {
    raiz.setAttribute("data-tema", tema);
  }
}

export function SelectorTema({ temaActual }: { temaActual: Tema }) {
  const [abierto, setAbierto] = useState(false);
  const [tema, setTema] = useState<Tema>(temaActual);
  const [, iniciarTransicion] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alHacerClicFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", alHacerClicFuera);
    return () => document.removeEventListener("mousedown", alHacerClicFuera);
  }, []);

  function elegir(nuevo: Tema) {
    setTema(nuevo);
    aplicarTemaEnDom(nuevo);
    setAbierto(false);
    iniciarTransicion(() => {
      cambiarTema(nuevo);
    });
  }

  const iconoActual = TEMAS.find((t) => t.valor === tema)?.icono ?? "Monitor";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Cambiar tema"
        aria-expanded={abierto}
        className="flex size-11 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-2 hover:text-texto"
      >
        <Icono nombre={iconoActual} className="size-5" />
      </button>
      {abierto && (
        <div className="vidrio absolute right-0 top-full z-50 mt-2 w-48 rounded-[var(--radio-md)] p-1.5 shadow-[var(--sombra-flotante)]">
          {TEMAS.map((t) => (
            <button
              key={t.valor}
              onClick={() => elegir(t.valor)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[var(--radio-sm)] px-3 py-2.5 text-left text-sm hover:bg-superficie-2",
                tema === t.valor && "bg-marca-suave text-marca-contraste font-medium"
              )}
            >
              <Icono nombre={t.icono} className="size-4" />
              {t.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Variante de botones grandes para Configuración → Apariencia. */
export function SelectorTemaGrande({ temaActual }: { temaActual: Tema }) {
  const [tema, setTema] = useState<Tema>(temaActual);

  return (
    <div className="grid grid-cols-3 gap-3">
      {TEMAS.map((t) => (
        <button
          key={t.valor}
          onClick={() => {
            setTema(t.valor);
            aplicarTemaEnDom(t.valor);
            cambiarTema(t.valor);
          }}
          className={cn(
            "flex flex-col items-center gap-2 rounded-[var(--radio-md)] border-2 p-4 transition-colors",
            tema === t.valor ? "border-marca bg-marca-suave" : "border-borde hover:bg-superficie-2"
          )}
        >
          <Icono nombre={t.icono} className="size-6" />
          <span className="text-sm font-medium">{t.etiqueta}</span>
        </button>
      ))}
    </div>
  );
}
