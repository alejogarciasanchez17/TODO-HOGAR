"use client";

import { Bar, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatoMoneda } from "@/lib/moneda";

type Punto = { mes: string; ingresos: number; clientes: number };

export function GraficaCrecimiento({ datos, moneda }: { datos: Punto[]; moneda: string }) {
  const hayDatos = datos.some((d) => d.ingresos > 0 || d.clientes > 0);

  if (!hayDatos) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <p className="text-texto-suave">Aún juntando historial, esto se llena solo 📈</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={datos} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="mes" tick={{ fontSize: 13 }} />
          <YAxis yAxisId="ingresos" hide />
          <YAxis yAxisId="clientes" orientation="right" hide />
          <Tooltip
            formatter={(value, name) => (name === "ingresos" ? formatoMoneda(Number(value), moneda) : String(value))}
            labelStyle={{ color: "var(--color-texto)" }}
            contentStyle={{ background: "var(--color-superficie)", border: "1px solid var(--color-borde)", borderRadius: 12 }}
          />
          <Bar yAxisId="ingresos" dataKey="ingresos" fill="var(--color-marca)" radius={[6, 6, 0, 0]} />
          <Line yAxisId="clientes" dataKey="clientes" stroke="var(--color-acento-completados)" strokeWidth={2.5} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
