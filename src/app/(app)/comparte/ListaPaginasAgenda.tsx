"use client";

import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { avisos } from "@/lib/toast";
import { alternarAgendaActiva } from "./actions";

type Vendedor = { id: string; nombre: string; slugAgenda: string | null; agendaActiva: boolean; citas: number };

export function ListaPaginasAgenda({ baseUrl, vendedores, esAdmin }: { baseUrl: string; vendedores: Vendedor[]; esAdmin: boolean }) {
  return (
    <div className="space-y-3">
      {vendedores.map((v) => {
        const liga = v.slugAgenda ? `${baseUrl}/agenda/${v.slugAgenda}` : null;
        return (
          <Tarjeta key={v.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium text-texto">{v.nombre}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-texto-tenue">{v.citas} citas generadas</span>
                <Boton
                  tamano="sm"
                  variante={v.agendaActiva ? "secundario" : "fantasma"}
                  onClick={async () => {
                    await alternarAgendaActiva(v.id);
                    avisos.exito(v.agendaActiva ? "Página desactivada" : "Página activada");
                  }}
                >
                  {v.agendaActiva ? "Activa" : "Inactiva"}
                </Boton>
              </div>
            </div>
            {liga && v.agendaActiva && (
              <div className="flex items-center gap-2 rounded-[var(--radio-sm)] border border-borde bg-superficie-2 px-3 py-2 text-sm text-texto-suave">
                <span className="min-w-0 flex-1 truncate">{liga}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(liga);
                    avisos.exito("Liga copiada ✓");
                  }}
                >
                  <Icono nombre="Copy" className="size-4 text-marca-fuerte" />
                </button>
              </div>
            )}
          </Tarjeta>
        );
      })}
      {!esAdmin && <p className="text-xs text-texto-tenue">Solo ves tu propia página de agenda.</p>}
    </div>
  );
}
