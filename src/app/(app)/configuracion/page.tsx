import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Icono } from "@/components/ui/Icono";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { SelectorTemaGrande } from "@/components/layout/SelectorTema";
import { SelectorDensidad } from "./SelectorDensidad";
import type { Tema } from "@/lib/tema";

export const metadata: Metadata = { title: "Configuración" };

export default async function PaginaConfiguracion() {
  const sesion = await auth();
  const esAdmin = sesion!.user.rol === "ADMIN";

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="Settings" className="size-7 text-marca" />
          <h1 className="text-3xl font-semibold text-texto">Configuración</h1>
        </div>
        <p className="mt-1 text-texto-suave">Apariencia y preferencias personales</p>
      </div>

      <Tarjeta className="space-y-4">
        <h2 className="font-semibold text-texto">Apariencia</h2>
        <SelectorTemaGrande temaActual={(sesion!.user.tema as Tema) ?? "automatico"} />
      </Tarjeta>

      <Tarjeta className="space-y-4">
        <h2 className="font-semibold text-texto">Densidad</h2>
        <p className="text-sm text-texto-suave">Cómoda para celular, compacta para ver más de un vistazo en escritorio.</p>
        <SelectorDensidad densidadActual={sesion!.user.densidad ?? "comoda"} />
      </Tarjeta>

      {esAdmin && (
        <Link href="/admin/configuracion">
          <Tarjeta interactiva className="flex items-center gap-3">
            <Icono nombre="ShieldCheck" className="size-6 text-marca" />
            <div>
              <p className="font-semibold text-texto">Configuración del negocio</p>
              <p className="text-sm text-texto-suave">Marca, etapas, horarios, moneda y metas</p>
            </div>
          </Tarjeta>
        </Link>
      )}
    </div>
  );
}
