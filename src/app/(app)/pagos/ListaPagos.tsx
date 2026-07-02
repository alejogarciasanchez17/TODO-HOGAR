"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Badge } from "@/components/ui/Badge";
import { Select, Input } from "@/components/ui/Input";
import { Campo } from "@/components/ui/Campo";
import { Modal } from "@/components/ui/Modal";
import { Icono } from "@/components/ui/Icono";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatoMoneda } from "@/lib/moneda";
import { formatoFechaCorta } from "@/lib/utils-fecha";
import { avisos } from "@/lib/toast";
import { registrarPago, actualizarEstatusPago, eliminarPago } from "./actions";

type Pago = {
  id: string;
  monto: number;
  metodo: string;
  estatus: string;
  fechaPago: string | null;
  fechaVencimiento: string | null;
  folio: number;
  concepto: string | null;
  cliente: { id: string; nombre: string };
};

const TONO: Record<string, "exito" | "advertencia" | "peligro"> = { pagado: "exito", pendiente: "advertencia", vencido: "peligro" };

export function ListaPagos({
  pagos,
  moneda,
  metodosPago,
  clientes,
  filtrosActuales,
}: {
  pagos: Pago[];
  moneda: string;
  metodosPago: string[];
  clientes: { id: string; nombre: string }[];
  filtrosActuales: { estatus: string; metodo: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalAbierto, setModalAbierto] = useState(searchParams.get("nuevo") === "1");
  const [aEliminar, setAEliminar] = useState<string | null>(null);
  const [mensaje, accion, enCurso] = useActionState(registrarPago, undefined);

  useEffect(() => {
    if (mensaje === "OK") {
      setModalAbierto(false);
      avisos.exito("Pago registrado ✓");
      router.refresh();
    } else if (mensaje) {
      avisos.error(mensaje);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mensaje]);

  function actualizarUrl(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`/pagos?${params.toString()}`);
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;
    await eliminarPago(aEliminar);
    setAEliminar(null);
    avisos.exito("Pago eliminado");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={filtrosActuales.estatus} onChange={(e) => actualizarUrl({ estatus: e.target.value || undefined })} className="sm:w-48">
          <option value="">Todo estatus</option>
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
          <option value="vencido">Vencido</option>
        </Select>
        <Select value={filtrosActuales.metodo} onChange={(e) => actualizarUrl({ metodo: e.target.value || undefined })} className="sm:w-48">
          <option value="">Todo método</option>
          {metodosPago.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Boton icono="Plus" className="sm:ml-auto" onClick={() => setModalAbierto(true)}>Registrar pago</Boton>
      </div>

      {pagos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[var(--radio-lg)] border border-borde bg-superficie py-16 text-center">
          <Icono nombre="Wallet" className="size-10 text-texto-tenue" />
          <p className="text-lg font-medium text-texto">Aún no hay pagos con estos filtros.</p>
        </div>
      ) : (
        <div className="divide-y divide-borde rounded-[var(--radio-lg)] border border-borde bg-superficie">
          {pagos.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/clientes/${p.cliente.id}`} className="font-medium text-texto hover:text-marca-fuerte hover:underline">
                  {p.cliente.nombre}
                </Link>
                <p className="text-sm text-texto-suave">
                  {p.concepto ?? `Folio #${p.folio}`} · {p.metodo} ·{" "}
                  {p.fechaPago ? formatoFechaCorta(p.fechaPago) : p.fechaVencimiento ? `Vence ${formatoFechaCorta(p.fechaVencimiento)}` : ""}
                </p>
              </div>
              <p className="text-lg font-semibold text-texto">{formatoMoneda(p.monto, moneda)}</p>
              <Select
                value={p.estatus}
                onChange={async (e) => {
                  await actualizarEstatusPago(p.id, e.target.value as "pendiente" | "pagado" | "vencido");
                  router.refresh();
                }}
                className="w-32"
              >
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="vencido">Vencido</option>
              </Select>
              <Badge tono={TONO[p.estatus] ?? "neutro"}>{p.estatus}</Badge>
              <Link href={`/pagos/${p.id}/recibo`} className="text-texto-suave hover:text-marca" aria-label="Generar recibo">
                <Icono nombre="ReceiptText" className="size-5" />
              </Link>
              <button onClick={() => setAEliminar(p.id)} aria-label="Eliminar pago" className="text-texto-suave hover:text-peligro">
                <Icono nombre="Trash2" className="size-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo="Registrar pago" ancho="sm">
        <form action={accion} className="space-y-4">
          <Campo etiqueta="Cliente" nombre="clienteId" requerido>
            <Select name="clienteId" required defaultValue="">
              <option value="" disabled>Elige un cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
          </Campo>
          <Campo etiqueta="Monto" nombre="monto" requerido>
            <Input name="monto" type="number" min={1} step={1} required />
          </Campo>
          <Campo etiqueta="Método" nombre="metodo">
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
          <Campo etiqueta="Fecha de vencimiento" nombre="fechaVencimiento">
            <Input name="fechaVencimiento" type="date" />
          </Campo>
          <Campo etiqueta="Concepto" nombre="concepto">
            <Input name="concepto" placeholder="Ej. Anticipo recámara" />
          </Campo>
          <div className="flex justify-end gap-3 border-t border-borde pt-4">
            <Boton type="button" variante="secundario" onClick={() => setModalAbierto(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={enCurso} icono="Check">Guardar</Boton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={aEliminar !== null}
        onCerrar={() => setAEliminar(null)}
        onConfirmar={confirmarEliminar}
        titulo="¿Eliminar este pago?"
        descripcion="Se moverá a la Papelera."
        textoConfirmar="Sí, eliminar"
        variantePeligro
      />
    </div>
  );
}
