import type { Metadata } from "next";
import { requerirAdmin } from "@/lib/admin-guard";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { PanelRespaldo } from "./PanelRespaldo";

export const metadata: Metadata = { title: "Respaldar y exportar" };

export default async function PaginaRespaldo() {
  await requerirAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="Download" className="size-7" style={{ color: "var(--color-acento-admin)" }} />
          <h1 className="text-3xl font-semibold text-texto">Respaldar y exportar</h1>
          <TooltipInfo texto="Descarga toda tu información de clientes." consejo="Hazlo seguido: es tu copia de seguridad si algo saliera mal." />
        </div>
        <p className="mt-1 text-texto-suave">Nunca incluye contraseñas ni llaves</p>
      </div>

      <PanelRespaldo />
    </div>
  );
}
