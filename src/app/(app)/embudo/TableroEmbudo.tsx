"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent } from "@dnd-kit/core";
import { Badge, BadgeTemperatura } from "@/components/ui/Badge";
import { Icono } from "@/components/ui/Icono";
import { formatoMoneda } from "@/lib/moneda";
import { formatoFechaCorta, estaVencida, diasDeAtraso } from "@/lib/utils-fecha";
import { cn } from "@/lib/utils";
import { cambiarEtapaCliente } from "../clientes/actions";
import { avisos } from "@/lib/toast";

type ClienteEmbudo = {
  id: string;
  nombre: string;
  etapa: string;
  valorEstimado: number;
  temperatura: string;
  proximaAccion: string | null;
  proximaAccionFecha: string | null;
  etapaEntradaEn: string;
  vendedor: { nombre: string };
};

function TarjetaCliente({ cliente, umbralDias, esAdmin }: { cliente: ClienteEmbudo; umbralDias: number; esAdmin: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: cliente.id });
  const vencida = cliente.proximaAccionFecha ? estaVencida(cliente.proximaAccionFecha) : false;
  const diasEnEtapa = diasDeAtraso(cliente.etapaEntradaEn);
  const estancado = diasEnEtapa >= umbralDias;

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: isDragging ? 50 : undefined } : undefined}
      className={cn(
        "space-y-2 rounded-[var(--radio-md)] border border-borde bg-superficie p-3 shadow-[var(--sombra-suave)] touch-none",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/clientes/${cliente.id}`} className="min-h-[24px] text-sm font-semibold text-texto hover:text-marca-fuerte hover:underline">
          {cliente.nombre}
        </Link>
        <span
          {...attributes}
          {...listeners}
          aria-label={`Arrastrar a ${cliente.nombre}`}
          className="cursor-grab touch-none rounded p-1 text-texto-tenue hover:bg-superficie-2 active:cursor-grabbing"
        >
          <Icono nombre="MoreVertical" className="size-4" />
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <BadgeTemperatura temperatura={cliente.temperatura} />
        {vencida && <Badge tono="peligro" icono="AlertTriangle">Vencida</Badge>}
        {estancado && <Badge tono="advertencia">🕒 {diasEnEtapa} días sin avanzar</Badge>}
      </div>
      <p className="text-lg font-semibold text-texto">{formatoMoneda(cliente.valorEstimado)}</p>
      {cliente.proximaAccion && (
        <p className="text-xs text-texto-suave">
          {cliente.proximaAccion} {cliente.proximaAccionFecha && `· ${formatoFechaCorta(cliente.proximaAccionFecha)}`}
        </p>
      )}
      {esAdmin && <p className="text-xs text-texto-tenue">{cliente.vendedor.nombre}</p>}
    </div>
  );
}

function Columna({
  etapa,
  clientes,
  umbralDias,
  esAdmin,
  moneda,
}: {
  etapa: string;
  clientes: ClienteEmbudo[];
  umbralDias: number;
  esAdmin: boolean;
  moneda: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  const suma = clientes.reduce((acc, c) => acc + c.valorEstimado, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-3 rounded-[var(--radio-lg)] border border-borde bg-superficie-2 p-3",
        isOver && "ring-2 ring-marca"
      )}
    >
      <div>
        <p className="font-semibold text-texto">{etapa}</p>
        <p className="text-xs text-texto-tenue">{clientes.length} · {formatoMoneda(suma, moneda)}</p>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 20rem)" }}>
        {clientes.length === 0 ? (
          <p className="py-6 text-center text-xs text-texto-tenue">Suelta aquí</p>
        ) : (
          clientes.map((c) => <TarjetaCliente key={c.id} cliente={c} umbralDias={umbralDias} esAdmin={esAdmin} />)
        )}
      </div>
    </div>
  );
}

export function TableroEmbudo({
  etapas,
  clientes,
  moneda,
  umbralDias,
  esAdmin,
}: {
  etapas: string[];
  clientes: ClienteEmbudo[];
  moneda: string;
  umbralDias: number;
  esAdmin: boolean;
}) {
  const [lista, setLista] = useState(clientes);
  const [arrastrando, setArrastrando] = useState<ClienteEmbudo | null>(null);
  const router = useRouter();

  const porEtapa = useMemo(() => {
    const mapa: Record<string, ClienteEmbudo[]> = {};
    for (const etapa of etapas) mapa[etapa] = [];
    for (const c of lista) (mapa[c.etapa] ??= []).push(c);
    return mapa;
  }, [lista, etapas]);

  async function alSoltar(evento: DragEndEvent) {
    setArrastrando(null);
    const { active, over } = evento;
    if (!over) return;
    const nuevaEtapa = String(over.id);
    const clienteId = String(active.id);
    const cliente = lista.find((c) => c.id === clienteId);
    if (!cliente || cliente.etapa === nuevaEtapa) return;

    setLista((prev) => prev.map((c) => (c.id === clienteId ? { ...c, etapa: nuevaEtapa, etapaEntradaEn: new Date().toISOString() } : c)));
    try {
      await cambiarEtapaCliente(clienteId, nuevaEtapa);
      avisos.exito(`${cliente.nombre} movido a "${nuevaEtapa}"`);
      router.refresh();
    } catch {
      setLista((prev) => prev.map((c) => (c.id === clienteId ? { ...c, etapa: cliente.etapa } : c)));
      avisos.error("No se pudo mover al cliente. Intenta de nuevo");
    }
  }

  if (clientes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[var(--radio-lg)] border border-borde bg-superficie py-16 text-center">
        <Icono nombre="KanbanSquare" className="size-10 text-texto-tenue" />
        <p className="text-lg font-medium text-texto">Aún no tienes clientes activos en el embudo.</p>
        <Link href="/clientes/nuevo" className="font-medium text-marca-fuerte hover:underline">+ Agregar cliente</Link>
      </div>
    );
  }

  return (
    <DndContext
      onDragStart={(e) => setArrastrando(lista.find((c) => c.id === e.active.id) ?? null)}
      onDragEnd={alSoltar}
      onDragCancel={() => setArrastrando(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {etapas.map((etapa) => (
          <Columna key={etapa} etapa={etapa} clientes={porEtapa[etapa] ?? []} umbralDias={umbralDias} esAdmin={esAdmin} moneda={moneda} />
        ))}
      </div>
      <DragOverlay>
        {arrastrando && <TarjetaCliente cliente={arrastrando} umbralDias={umbralDias} esAdmin={esAdmin} />}
      </DragOverlay>
    </DndContext>
  );
}
