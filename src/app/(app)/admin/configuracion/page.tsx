import type { Metadata } from "next";
import { requerirAdmin } from "@/lib/admin-guard";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { FormularioConfiguracion } from "./FormularioConfiguracion";

export const metadata: Metadata = { title: "Configuración del negocio" };

export default async function PaginaConfiguracion() {
  await requerirAdmin();
  const config = await obtenerConfiguracionNegocio();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="Settings" className="size-7" style={{ color: "var(--color-acento-admin)" }} />
          <h1 className="text-3xl font-semibold text-texto">Configuración del negocio</h1>
          <TooltipInfo texto="Todo lo editable sin tocar código, en un solo lugar." consejo="Cambia aquí tu color de marca y se actualiza todo el sistema." />
        </div>
        <p className="mt-1 text-texto-suave">Marca, etapas, horarios, moneda y metas</p>
      </div>

      <FormularioConfiguracion config={config} />
    </div>
  );
}
