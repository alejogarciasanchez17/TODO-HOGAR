import Link from "next/link";
import { auth } from "@/lib/auth";
import { obtenerNotificaciones } from "@/lib/notificaciones";
import { BuscadorGlobal } from "./BuscadorGlobal";
import { Campanita } from "./Campanita";
import { SelectorTema } from "./SelectorTema";
import { MenuAvatar } from "./MenuAvatar";
import { BotonAyuda } from "./BotonAyuda";
import type { Tema } from "@/lib/tema";

export async function Topbar() {
  const sesion = await auth();
  if (!sesion?.user) return null;

  const { recordatorios, menciones, vencidos } = await obtenerNotificaciones(sesion.user.id);

  return (
    <header className="vidrio sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-borde px-4 md:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
        <div className="flex size-8 items-center justify-center rounded-[var(--radio-sm)] bg-marca text-marca-contraste">
          <span className="text-sm font-bold">th</span>
        </div>
      </Link>
      <div className="flex-1 md:max-w-sm">
        <BuscadorGlobal />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <BotonAyuda />
        <Campanita
          recordatoriosIniciales={recordatorios.map((r) => ({
            id: r.id,
            texto: r.texto,
            fecha: r.fecha.toISOString(),
            clienteId: r.cliente?.id ?? null,
            clienteNombre: r.cliente?.nombre ?? null,
          }))}
          mencionesIniciales={menciones.map((m) => ({
            id: m.id,
            texto: m.texto,
            fecha: m.fecha.toISOString(),
            entidad: m.entidad,
            entidadId: m.entidadId,
          }))}
          vencidosIniciales={vencidos}
        />
        <SelectorTema temaActual={(sesion.user.tema as Tema) ?? "automatico"} />
        <MenuAvatar nombre={sesion.user.name ?? ""} rol={sesion.user.rol} />
      </div>
    </header>
  );
}
