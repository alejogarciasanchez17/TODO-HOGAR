"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECCIONES } from "@/lib/secciones";
import { NAV_PRINCIPAL, NAV_SECUNDARIO, type ItemNav } from "./nav-items";
import { Icono } from "@/components/ui/Icono";
import { cn } from "@/lib/utils";

function EnlaceNav({ item, activo }: { item: ItemNav; activo: boolean }) {
  const seccion = SECCIONES[item.seccion];
  return (
    <Link
      href={seccion.ruta}
      className={cn(
        "flex min-h-[44px] items-center gap-3 rounded-[var(--radio-sm)] px-3 py-2.5 text-[15px] font-medium transition-colors",
        activo ? "bg-superficie-2 text-texto" : "text-texto-suave hover:bg-superficie-2 hover:text-texto"
      )}
      style={activo ? { boxShadow: `inset 3px 0 0 var(${seccion.acentoVar})` } : undefined}
    >
      <Icono
        nombre={seccion.icono as never}
        className="size-5 shrink-0"
        style={{ color: activo ? `var(${seccion.acentoVar})` : undefined }}
      />
      {seccion.nombre}
    </Link>
  );
}

export function Sidebar({ esAdmin }: { esAdmin: boolean }) {
  const pathname = usePathname();

  const esActivo = (ruta: string) => pathname === ruta || pathname.startsWith(ruta + "/");

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-borde bg-superficie md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-todo-hogar.png" alt="todo hogar" className="size-9 rounded-[var(--radio-sm)]" />
        <span className="text-lg font-semibold">todo hogar</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV_PRINCIPAL.map((item) => (
          <EnlaceNav key={item.seccion} item={item} activo={esActivo(SECCIONES[item.seccion].ruta)} />
        ))}
        <div className="my-3 border-t border-borde" />
        {NAV_SECUNDARIO.filter((item) => !item.soloAdmin || esAdmin).map((item) => (
          <EnlaceNav key={item.seccion} item={item} activo={esActivo(SECCIONES[item.seccion].ruta)} />
        ))}
      </nav>
    </aside>
  );
}
