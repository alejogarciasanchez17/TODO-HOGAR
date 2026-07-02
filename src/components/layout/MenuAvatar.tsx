"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icono } from "@/components/ui/Icono";
import { cerrarSesion } from "@/app/(app)/actions-perfil";

export function MenuAvatar({ nombre, rol }: { nombre: string; rol: string }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    function alHacerClicFuera(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", alHacerClicFuera);
    return () => document.removeEventListener("mousedown", alHacerClicFuera);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={`Menú de ${nombre}`}
        aria-expanded={abierto}
        className="flex size-11 items-center justify-center rounded-full bg-marca text-marca-contraste font-semibold"
      >
        {inicial}
      </button>
      {abierto && (
        <div className="vidrio absolute right-0 top-full z-50 mt-2 w-56 rounded-[var(--radio-md)] p-1.5 shadow-[var(--sombra-flotante)] bg-superficie">
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-texto">{nombre}</p>
            <p className="text-xs text-texto-tenue">{rol === "ADMIN" ? "Administrador" : rol === "VENDEDOR" ? "Vendedor" : "Solo lectura"}</p>
          </div>
          <div className="my-1 border-t border-borde" />
          <Link href="/perfil" className="flex items-center gap-2.5 rounded-[var(--radio-sm)] px-3 py-2.5 text-sm hover:bg-superficie-2" onClick={() => setAbierto(false)}>
            <Icono nombre="User" className="size-4" /> Mi perfil
          </Link>
          <Link href="/configuracion" className="flex items-center gap-2.5 rounded-[var(--radio-sm)] px-3 py-2.5 text-sm hover:bg-superficie-2" onClick={() => setAbierto(false)}>
            <Icono nombre="Settings" className="size-4" /> Configuración
          </Link>
          <div className="my-1 border-t border-borde" />
          <button
            onClick={() => cerrarSesion()}
            className="flex w-full items-center gap-2.5 rounded-[var(--radio-sm)] px-3 py-2.5 text-left text-sm text-peligro hover:bg-peligro/10"
          >
            <Icono nombre="LogOut" className="size-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
