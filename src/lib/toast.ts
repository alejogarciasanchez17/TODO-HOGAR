import { toast } from "sonner";

export const avisos = {
  exito: (mensaje: string) => toast.success(mensaje),
  error: (mensaje: string, opciones?: { descripcion?: string }) =>
    toast.error(mensaje, { description: opciones?.descripcion }),
  info: (mensaje: string) => toast.info(mensaje),
  cargando: (mensaje: string) => toast.loading(mensaje),
  deshacer: (mensaje: string, alDeshacer: () => void) =>
    toast(mensaje, {
      action: { label: "Deshacer", onClick: alDeshacer },
      duration: 6000,
    }),
};
