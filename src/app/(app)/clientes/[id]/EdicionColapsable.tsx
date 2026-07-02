"use client";

import { useState } from "react";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Icono } from "@/components/ui/Icono";
import { FormularioCliente, type ValoresCliente } from "../FormularioCliente";

export function EdicionColapsable({
  valores,
  etapas,
  vendedores,
  esAdmin,
  usuarioId,
}: {
  valores: ValoresCliente;
  etapas: string[];
  vendedores: { id: string; nombre: string }[];
  esAdmin: boolean;
  usuarioId: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Tarjeta>
      <button onClick={() => setAbierto((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left">
        <span className="flex items-center gap-2 text-lg font-semibold text-texto">
          <Icono nombre="Pencil" className="size-5" /> Editar datos del cliente
        </span>
        <Icono nombre={abierto ? "ChevronUp" : "ChevronDown"} className="size-5 text-texto-tenue" />
      </button>
      {abierto && (
        <div className="mt-4">
          <FormularioCliente modo="editar" valores={valores} etapas={etapas} vendedores={vendedores} esAdmin={esAdmin} usuarioId={usuarioId} />
        </div>
      )}
    </Tarjeta>
  );
}
