"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Select } from "@/components/ui/Input";
import { Icono } from "@/components/ui/Icono";
import { formatoMoneda } from "@/lib/moneda";
import { formatoFechaCorta } from "@/lib/utils-fecha";

type Cliente = {
  id: string;
  nombre: string;
  valorEstimado: number;
  ultimaCompra: string | null;
  vendedor: { nombre: string };
};

export function ListaCompletados({ clientes, moneda, esAdmin, orden }: { clientes: Cliente[]; moneda: string; esAdmin: boolean; orden: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="space-y-3">
      <Select
        value={orden}
        onChange={(e) => {
          const p = new URLSearchParams(searchParams.toString());
          if (e.target.value) p.set("orden", e.target.value);
          else p.delete("orden");
          router.push(`/completados?${p.toString()}`);
        }}
        className="w-48"
      >
        <option value="">Más reciente</option>
        <option value="monto">Mayor monto</option>
      </Select>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {clientes.map((c) => (
          <Tarjeta key={c.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <Link href={`/clientes/${c.id}`} className="font-semibold text-texto hover:text-marca-fuerte hover:underline">{c.nombre}</Link>
              <Icono nombre="Trophy" className="size-5 text-exito" />
            </div>
            <p className="text-xl font-semibold text-exito">{formatoMoneda(c.valorEstimado, moneda)}</p>
            <p className="text-sm text-texto-tenue">{c.ultimaCompra ? formatoFechaCorta(c.ultimaCompra) : ""} {esAdmin && `· ${c.vendedor.nombre}`}</p>
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}
