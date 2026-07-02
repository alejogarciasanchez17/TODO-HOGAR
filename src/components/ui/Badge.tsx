import { cn } from "@/lib/utils";
import { Icono, type NombreIcono } from "./Icono";

type Tono = "marca" | "exito" | "peligro" | "advertencia" | "info" | "neutro" | "piedra";

const TONOS: Record<Tono, string> = {
  marca: "bg-marca-suave text-marca-contraste",
  exito: "bg-exito/15 text-exito",
  peligro: "bg-peligro/15 text-peligro",
  advertencia: "bg-advertencia/15 text-advertencia",
  info: "bg-info/15 text-info",
  neutro: "bg-superficie-2 text-texto-suave",
  piedra: "bg-superficie-2 text-texto-tenue",
};

export function Badge({
  tono = "neutro",
  icono,
  className,
  children,
}: {
  tono?: Tono;
  icono?: NombreIcono;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium whitespace-nowrap",
        TONOS[tono],
        className
      )}
    >
      {icono && <Icono nombre={icono} className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

const ESTADOS_CARTERA: Record<string, { tono: Tono; icono: NombreIcono; texto: string }> = {
  ACTIVO: { tono: "marca", icono: "Flame", texto: "Activo" },
  GANADO: { tono: "exito", icono: "CheckCircle2", texto: "Ganado" },
  PERDIDO: { tono: "neutro", icono: "XCircle", texto: "Perdido" },
  ARCHIVADO: { tono: "piedra", icono: "Archive", texto: "Archivado" },
};

export function BadgeEstadoCartera({ estado }: { estado: string }) {
  const info = ESTADOS_CARTERA[estado] ?? ESTADOS_CARTERA.ACTIVO;
  return (
    <Badge tono={info.tono} icono={info.icono}>
      {info.texto}
    </Badge>
  );
}

const TEMPERATURAS: Record<string, { emoji: string; texto: string; tono: Tono }> = {
  CALIENTE: { emoji: "🔥", texto: "Caliente", tono: "peligro" },
  TIBIO: { emoji: "🟡", texto: "Tibio", tono: "advertencia" },
  FRIO: { emoji: "🔵", texto: "Frío", tono: "info" },
};

export function BadgeTemperatura({ temperatura }: { temperatura: string }) {
  const info = TEMPERATURAS[temperatura] ?? TEMPERATURAS.TIBIO;
  return (
    <Badge tono={info.tono}>
      <span aria-hidden>{info.emoji}</span>
      {info.texto}
    </Badge>
  );
}
