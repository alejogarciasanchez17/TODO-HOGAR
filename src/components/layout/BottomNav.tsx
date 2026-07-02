"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { SECCIONES } from "@/lib/secciones";
import { NAV_MOVIL, NAV_SECUNDARIO } from "./nav-items";
import { Icono } from "@/components/ui/Icono";
import { cn } from "@/lib/utils";
import { cerrarSesion } from "@/app/(app)/actions-perfil";

export function BottomNav({ esAdmin }: { esAdmin: boolean }) {
  const pathname = usePathname();
  const [masAbierto, setMasAbierto] = useState(false);
  const esActivo = (ruta: string) => pathname === ruta || pathname.startsWith(ruta + "/");

  return (
    <>
      <nav
        className="vidrio fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-borde px-1 pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegación principal"
      >
        {NAV_MOVIL.map((item) => {
          const seccion = SECCIONES[item.seccion];
          const activo = esActivo(seccion.ruta);
          return (
            <Link
              key={item.seccion}
              href={seccion.ruta}
              className="flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium"
            >
              <Icono
                nombre={seccion.icono as never}
                className="size-5"
                style={{ color: activo ? `var(${seccion.acentoVar})` : "var(--color-texto-suave)" }}
              />
              <span className={activo ? "text-texto" : "text-texto-suave"}>{seccion.nombre}</span>
            </Link>
          );
        })}
        <Link
          href="/clientes/nuevo"
          className="flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-marca text-marca-contraste">
            <Icono nombre="Plus" className="size-5" />
          </span>
          <span className="text-texto-suave">Nuevo</span>
        </Link>
        <button
          type="button"
          onClick={() => setMasAbierto(true)}
          className="flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium"
        >
          <Icono nombre="Menu" className="size-5 text-texto-suave" />
          <span className="text-texto-suave">Más</span>
        </button>
      </nav>

      {masAbierto &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
            <button
              aria-label="Cerrar"
              className="absolute inset-0 bg-black/40"
              onClick={() => setMasAbierto(false)}
            />
            <div className="relative rounded-t-[var(--radio-xl)] border-t border-borde bg-superficie p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[var(--sombra-flotante)]">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-borde" />
              <div className="grid grid-cols-3 gap-2">
                {NAV_SECUNDARIO.filter((item) => !item.soloAdmin || esAdmin).map((item) => {
                  const seccion = SECCIONES[item.seccion];
                  return (
                    <Link
                      key={item.seccion}
                      href={seccion.ruta}
                      onClick={() => setMasAbierto(false)}
                      className="flex flex-col items-center gap-1.5 rounded-[var(--radio-md)] p-3 text-center hover:bg-superficie-2"
                    >
                      <Icono
                        nombre={seccion.icono as never}
                        className="size-5"
                        style={{ color: `var(${seccion.acentoVar})` }}
                      />
                      <span className="text-xs font-medium text-texto">{seccion.nombre}</span>
                    </Link>
                  );
                })}
                <Link
                  href="/perfil"
                  onClick={() => setMasAbierto(false)}
                  className="flex flex-col items-center gap-1.5 rounded-[var(--radio-md)] p-3 text-center hover:bg-superficie-2"
                >
                  <Icono nombre="User" className="size-5 text-texto-suave" />
                  <span className="text-xs font-medium text-texto">Mi perfil</span>
                </Link>
                <button
                  onClick={() => {
                    setMasAbierto(false);
                    document.dispatchEvent(new CustomEvent("abrir-ayuda"));
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-[var(--radio-md)] p-3 text-center hover:bg-superficie-2"
                >
                  <Icono nombre="LifeBuoy" className="size-5 text-texto-suave" />
                  <span className="text-xs font-medium text-texto">Ayuda</span>
                </button>
                <button
                  onClick={() => cerrarSesion()}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-[var(--radio-md)] p-3 text-center hover:bg-superficie-2"
                  )}
                >
                  <Icono nombre="LogOut" className="size-5 text-peligro" />
                  <span className="text-xs font-medium text-peligro">Salir</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
