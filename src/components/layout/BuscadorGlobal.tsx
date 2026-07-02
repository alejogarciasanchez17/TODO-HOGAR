"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { cn } from "@/lib/utils";
import type { ResultadoBusqueda } from "@/app/api/buscar/route";

const ICONO_TIPO: Record<ResultadoBusqueda["tipo"], NombreIcono> = {
  cliente: "Users",
  cita: "CalendarDays",
  pago: "Wallet",
};

const NOMBRE_TIPO: Record<ResultadoBusqueda["tipo"], string> = {
  cliente: "Clientes",
  cita: "Citas",
  pago: "Pagos",
};

const CLAVE_RECIENTES = "todohogar_busquedas_recientes";

export function BuscadorGlobal() {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [cargando, setCargando] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);
  const [recientes, setRecientes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const guardado = localStorage.getItem(CLAVE_RECIENTES);
      if (guardado) setRecientes(JSON.parse(guardado));
    } catch {
      // sin acceso a localStorage: no pasa nada, simplemente no hay recientes
    }
  }, []);

  const cerrar = useCallback(() => {
    setAbierto(false);
    setTexto("");
    setResultados([]);
  }, []);

  useEffect(() => {
    function alTeclado(e: KeyboardEvent) {
      const escribiendoEnCampo =
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);

      if ((e.key === "/" && !escribiendoEnCampo) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setAbierto(true);
      }
      if (e.key === "Escape") cerrar();
    }
    document.addEventListener("keydown", alTeclado);
    return () => document.removeEventListener("keydown", alTeclado);
  }, [cerrar]);

  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 50);
  }, [abierto]);

  useEffect(() => {
    if (texto.trim().length < 2) {
      setResultados([]);
      return;
    }
    setCargando(true);
    const espera = setTimeout(async () => {
      try {
        const respuesta = await fetch(`/api/buscar?q=${encodeURIComponent(texto)}`);
        const datos = await respuesta.json();
        setResultados(datos.resultados ?? []);
        setIndiceActivo(0);
      } finally {
        setCargando(false);
      }
    }, 250);
    return () => clearTimeout(espera);
  }, [texto]);

  function irAResultado(resultado: ResultadoBusqueda) {
    const nuevos = [texto, ...recientes.filter((r) => r !== texto)].slice(0, 5);
    setRecientes(nuevos);
    try {
      localStorage.setItem(CLAVE_RECIENTES, JSON.stringify(nuevos));
    } catch {}
    cerrar();
    router.push(resultado.href);
  }

  function alTecladoLista(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && resultados[indiceActivo]) {
      irAResultado(resultados[indiceActivo]);
    }
  }

  const grupos = resultados.reduce<Record<string, ResultadoBusqueda[]>>((acc, r) => {
    (acc[r.tipo] ??= []).push(r);
    return acc;
  }, {});

  return (
    <>
      <button
        id="boton-buscador-global"
        type="button"
        onClick={() => setAbierto(true)}
        className="flex h-11 w-full max-w-sm items-center gap-2.5 rounded-full border border-borde bg-superficie-2 px-4 text-texto-tenue hover:bg-superficie transition-colors"
        aria-label="Buscar clientes, citas, pagos y más"
      >
        <Icono nombre="Search" className="size-4.5 shrink-0" />
        <span className="text-sm">Buscar…</span>
        <kbd className="ml-auto hidden rounded border border-borde px-1.5 py-0.5 text-xs sm:inline">Ctrl K</kbd>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm px-4 pt-[10vh]"
          onClick={cerrar}
        >
          <div
            className="vidrio w-full max-w-xl rounded-[var(--radio-lg)] shadow-[var(--sombra-flotante)] bg-superficie"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
            aria-label="Buscador global"
          >
            <div className="flex items-center gap-3 border-b border-borde px-4 py-3.5">
              <Icono nombre="Search" className="size-5 text-texto-tenue shrink-0" />
              <input
                ref={inputRef}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={alTecladoLista}
                placeholder="Busca un cliente, teléfono, correo, empresa, nota, cita o pago…"
                className="min-h-[44px] w-full bg-transparent text-base text-texto outline-none placeholder:text-texto-tenue"
              />
              <button onClick={cerrar} aria-label="Cerrar buscador" className="text-texto-tenue hover:text-texto">
                <Icono nombre="X" className="size-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {texto.trim().length < 2 && recientes.length > 0 && (
                <div className="p-2">
                  <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-texto-tenue">
                    Búsquedas recientes
                  </p>
                  {recientes.map((r) => (
                    <button
                      key={r}
                      onClick={() => setTexto(r)}
                      className="flex w-full items-center gap-2.5 rounded-[var(--radio-sm)] px-3 py-2.5 text-left text-sm hover:bg-superficie-2"
                    >
                      <Icono nombre="Clock" className="size-4 text-texto-tenue" />
                      {r}
                    </button>
                  ))}
                </div>
              )}

              {cargando && <p className="p-4 text-center text-sm text-texto-tenue">Buscando…</p>}

              {!cargando && texto.trim().length >= 2 && resultados.length === 0 && (
                <div className="flex flex-col items-center gap-3 p-8 text-center">
                  <Icono nombre="Search" className="size-8 text-texto-tenue" />
                  <p className="text-texto-suave">
                    No encontré nada con &quot;{texto}&quot;. Revisa cómo lo escribiste o crea un cliente nuevo.
                  </p>
                  <a
                    href="/clientes?nuevo=1"
                    className="text-sm font-medium text-marca-fuerte hover:underline"
                  >
                    + Nuevo cliente
                  </a>
                </div>
              )}

              {(Object.keys(grupos) as ResultadoBusqueda["tipo"][]).map((tipo) => (
                <div key={tipo} className="p-2">
                  <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-texto-tenue">
                    {NOMBRE_TIPO[tipo]}
                  </p>
                  {grupos[tipo].map((r) => {
                    const indiceGlobal = resultados.indexOf(r);
                    return (
                      <button
                        key={`${r.tipo}-${r.id}`}
                        onClick={() => irAResultado(r)}
                        onMouseEnter={() => setIndiceActivo(indiceGlobal)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-[var(--radio-sm)] px-3 py-2.5 text-left",
                          indiceGlobal === indiceActivo ? "bg-marca-suave" : "hover:bg-superficie-2"
                        )}
                      >
                        <Icono nombre={ICONO_TIPO[r.tipo]} className="size-4.5 text-texto-suave shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-texto">{r.titulo}</span>
                          <span className="block truncate text-xs text-texto-suave">{r.subtitulo}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
