"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Badge } from "@/components/ui/Badge";
import { Boton } from "@/components/ui/Boton";
import { Campo } from "@/components/ui/Campo";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Icono } from "@/components/ui/Icono";
import { formatoMoneda } from "@/lib/moneda";
import { formatoFechaCorta } from "@/lib/utils-fecha";
import { registrarPago } from "../../pagos/actions";

type Pago = {
  id: string;
  monto: number;
  metodo: string;
  estatus: string;
  fechaPago: string | null;
  fechaVencimiento: string | null;
  folio: number;
  concepto: string | null;
};

const TONO_ESTATUS: Record<string, "exito" | "advertencia" | "peligro"> = {
  pagado: "exito",
  pendiente: "advertencia",
  vencido: "peligro",
};

export function BloquePagos({
  clienteId,
  pagos,
  metodosPago,
  moneda,
  valorEstimado,
  pagado,
  falta,
  porcentaje,
}: {
  clienteId: string;
  pagos: Pago[];
  metodosPago: string[];
  moneda: string;
  valorEstimado: number;
  pagado: number;
  falta: number;
  porcentaje: number;
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensaje, accion, enCurso] = useActionState(registrarPago, undefined);
  const router = useRouter();

  useEffect(() => {
    if (mensaje === "OK") {
      setModalAbierto(false);
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensaje]);

  return (
    <Tarjeta className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-texto">
          <Icono nombre="Wallet" className="size-5" /> Pagos
        </h2>
        <Boton icono="Plus" tamano="sm" onClick={() => setModalAbierto(true)}>Registrar pago</Boton>
      </div>

      {valorEstimado > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-texto-suave">Pagado {formatoMoneda(pagado, moneda)} de {formatoMoneda(valorEstimado, moneda)}</span>
            <span className="font-medium text-texto">{falta > 0 ? `Falta ${formatoMoneda(falta, moneda)}` : "Liquidado ✓"}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-superficie-2">
            <div className="h-full rounded-full bg-exito transition-all" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
      )}

      {pagos.length === 0 ? (
        <p className="py-3 text-center text-sm text-texto-suave">Aún no hay pagos registrados.</p>
      ) : (
        <div className="divide-y divide-borde">
          {pagos.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <div>
                <p className="font-medium text-texto">{formatoMoneda(p.monto, moneda)} · {p.metodo}</p>
                <p className="text-xs text-texto-tenue">
                  {p.concepto ?? `Folio #${p.folio}`} · {p.fechaPago ? formatoFechaCorta(p.fechaPago) : p.fechaVencimiento ? `Vence ${formatoFechaCorta(p.fechaVencimiento)}` : ""}
                </p>
              </div>
              <Badge tono={TONO_ESTATUS[p.estatus] ?? "neutro"}>{p.estatus}</Badge>
            </div>
          ))}
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo="Registrar pago" ancho="sm">
        <form action={accion} className="space-y-4">
          <input type="hidden" name="clienteId" value={clienteId} />
          <Campo etiqueta="Monto" nombre="monto" requerido>
            <Input name="monto" type="number" min={1} step={1} required />
          </Campo>
          <Campo etiqueta="Método" nombre="metodo" requerido>
            <Select name="metodo" defaultValue={metodosPago[0]}>
              {metodosPago.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Estatus" nombre="estatus">
            <Select name="estatus" defaultValue="pagado">
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
              <option value="vencido">Vencido</option>
            </Select>
          </Campo>
          <Campo etiqueta="Fecha de pago" nombre="fechaPago">
            <Input name="fechaPago" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
          </Campo>
          <Campo etiqueta="Fecha de vencimiento (si está pendiente)" nombre="fechaVencimiento">
            <Input name="fechaVencimiento" type="date" />
          </Campo>
          <Campo etiqueta="Concepto" nombre="concepto">
            <Input name="concepto" placeholder="Ej. Anticipo recámara" />
          </Campo>
          {mensaje && mensaje !== "OK" && <p className="text-sm text-peligro" role="alert">{mensaje}</p>}
          <div className="flex justify-end gap-3 border-t border-borde pt-4">
            <Boton type="button" variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={enCurso} icono="Check">Guardar pago</Boton>
          </div>
        </form>
      </Modal>
    </Tarjeta>
  );
}
