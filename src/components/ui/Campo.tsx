import { cn } from "@/lib/utils";
import { TooltipInfo } from "./TooltipInfo";

type Props = {
  etiqueta: string;
  nombre?: string;
  ayuda?: string;
  error?: string;
  info?: { texto: string; consejo?: string };
  requerido?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Campo({ etiqueta, nombre, ayuda, error, info, requerido, className, children }: Props) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={nombre} className="flex items-center gap-1.5 text-sm font-medium text-texto">
        {etiqueta}
        {requerido && <span className="text-peligro">*</span>}
        {info && <TooltipInfo texto={info.texto} consejo={info.consejo} />}
      </label>
      {children}
      {ayuda && !error && <p className="text-sm text-texto-tenue">{ayuda}</p>}
      {error && (
        <p className="text-sm text-peligro" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
