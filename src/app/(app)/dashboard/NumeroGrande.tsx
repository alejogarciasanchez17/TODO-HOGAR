import { Icono } from "@/components/ui/Icono";
import { cn } from "@/lib/utils";

export function NumeroGrande({
  titulo,
  valor,
  variacion,
  tono = "neutro",
}: {
  titulo: string;
  valor: string;
  variacion?: number;
  tono?: "neutro" | "peligro";
}) {
  return (
    <div className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5">
      <p className="text-sm text-texto-suave">{titulo}</p>
      <p className={cn("mt-1 text-3xl font-bold sm:text-4xl", tono === "peligro" && valor !== "0" ? "text-peligro" : "text-texto")}>{valor}</p>
      {variacion !== undefined && (
        <p className={cn("mt-1 flex items-center gap-1 text-sm font-medium", variacion >= 0 ? "text-exito" : "text-peligro")}>
          <Icono nombre={variacion >= 0 ? "TrendingUp" : "TrendingDown"} className="size-4" />
          {variacion >= 0 ? "+" : ""}{variacion}% vs mes pasado
        </p>
      )}
    </div>
  );
}
