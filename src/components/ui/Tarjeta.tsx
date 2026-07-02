import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLDivElement> & {
  vidrio?: boolean;
  interactiva?: boolean;
};

export function Tarjeta({ vidrio, interactiva, className, children, ...resto }: Props) {
  return (
    <div
      className={cn(
        "rounded-[var(--radio-lg)] border border-borde p-5",
        vidrio ? "vidrio" : "bg-superficie",
        "shadow-[var(--sombra-suave)]",
        interactiva &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--sombra-flotante)] cursor-pointer",
        className
      )}
      {...resto}
    >
      {children}
    </div>
  );
}
