"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Campo } from "@/components/ui/Campo";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Boton } from "@/components/ui/Boton";
import { SelectorTemaGrande } from "@/components/layout/SelectorTema";
import { avisos } from "@/lib/toast";
import { actualizarConfiguracion } from "./actions";
import type { ConfiguracionNegocioParsed } from "@/lib/config-negocio";

const MONEDAS = ["MXN", "USD", "EUR", "COP", "ARS"];

export function FormularioConfiguracion({ config }: { config: ConfiguracionNegocioParsed }) {
  const [estado, accion, enCurso] = useActionState(actualizarConfiguracion, undefined);
  const router = useRouter();

  useEffect(() => {
    if (estado === "OK") {
      avisos.exito("Configuración guardada ✓");
      router.refresh();
    } else if (estado) {
      avisos.error(estado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  return (
    <form action={accion} className="space-y-6">
      <Tarjeta className="space-y-4">
        <h2 className="font-semibold text-texto">Apariencia</h2>
        <SelectorTemaGrande temaActual="automatico" />
        <Campo etiqueta="Color de marca" nombre="colorMarca" ayuda="Se actualiza en todo el sistema">
          <Input name="colorMarca" type="color" defaultValue={config.colorMarca} className="h-11 w-24 p-1" />
        </Campo>
      </Tarjeta>

      <Tarjeta className="space-y-4">
        <h2 className="font-semibold text-texto">Datos del negocio</h2>
        <Campo etiqueta="Nombre del negocio" nombre="nombreNegocio"><Input name="nombreNegocio" defaultValue={config.nombreNegocio} /></Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Moneda" nombre="moneda">
            <Select name="moneda" defaultValue={config.moneda}>
              {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Huso horario" nombre="husoHorario">
            <Input name="husoHorario" defaultValue={config.husoHorario} />
          </Campo>
        </div>
      </Tarjeta>

      <Tarjeta className="space-y-4">
        <h2 className="font-semibold text-texto">Horario de citas</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Hora inicio" nombre="horarioInicio"><Input name="horarioInicio" type="time" defaultValue={config.horarioInicio} /></Campo>
          <Campo etiqueta="Hora fin" nombre="horarioFin"><Input name="horarioFin" type="time" defaultValue={config.horarioFin} /></Campo>
          <Campo etiqueta="Duración (min)" nombre="duracionCitaMin"><Input name="duracionCitaMin" type="number" min={5} step={5} defaultValue={config.duracionCitaMin} /></Campo>
        </div>
      </Tarjeta>

      <Tarjeta className="space-y-4">
        <h2 className="font-semibold text-texto">Embudo, pagos y pérdidas</h2>
        <Campo etiqueta="Etapas del embudo" nombre="etapasEmbudo" ayuda="Una por línea, en orden">
          <Textarea name="etapasEmbudo" defaultValue={config.etapasEmbudo.join("\n")} className="min-h-[160px]" />
        </Campo>
        <Campo etiqueta="Métodos de pago" nombre="metodosPago" ayuda="Uno por línea">
          <Textarea name="metodosPago" defaultValue={config.metodosPago.join("\n")} />
        </Campo>
        <Campo etiqueta="Motivos de pérdida" nombre="motivosPerdida" ayuda="Uno por línea">
          <Textarea name="motivosPerdida" defaultValue={config.motivosPerdida.join("\n")} />
        </Campo>
      </Tarjeta>

      <Tarjeta className="space-y-4">
        <h2 className="font-semibold text-texto">Ventas y equipo</h2>
        <Campo etiqueta="Mensaje tipo de WhatsApp" nombre="mensajeWhatsappTipo">
          <Textarea name="mensajeWhatsappTipo" defaultValue={config.mensajeWhatsappTipo} className="min-h-[100px]" />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Meta mensual (clientes)" nombre="metaMensualClientes"><Input name="metaMensualClientes" type="number" min={0} defaultValue={config.metaMensualClientes} /></Campo>
          <Campo etiqueta="Días para estancado" nombre="umbralEstancamientoDias"><Input name="umbralEstancamientoDias" type="number" min={1} defaultValue={config.umbralEstancamientoDias} /></Campo>
          <Campo etiqueta="Comisión global % (opcional)" nombre="comisionGlobalPct"><Input name="comisionGlobalPct" type="number" min={0} max={100} defaultValue={config.comisionGlobalPct ?? ""} /></Campo>
        </div>
      </Tarjeta>

      <div className="flex justify-end">
        <Boton type="submit" cargando={enCurso} icono="Check">Guardar configuración</Boton>
      </div>
    </form>
  );
}
