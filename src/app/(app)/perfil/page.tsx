import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Icono } from "@/components/ui/Icono";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Badge } from "@/components/ui/Badge";
import { FormularioPassword } from "./FormularioPassword";
import { BotonRelanzarTour } from "./BotonRelanzarTour";

export const metadata: Metadata = { title: "Mi perfil" };

const NOMBRE_ROL: Record<string, string> = { ADMIN: "Administrador", VENDEDOR: "Vendedor", LECTURA: "Solo lectura" };

export default async function PaginaPerfil() {
  const sesion = await auth();
  const usuario = sesion!.user;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="User" className="size-7 text-marca" />
          <h1 className="text-3xl font-semibold text-texto">Mi perfil</h1>
        </div>
        <p className="mt-1 text-texto-suave">Tus datos y tu contraseña</p>
      </div>

      <Tarjeta className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-marca text-xl font-semibold text-marca-contraste">
            {usuario.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-lg font-semibold text-texto">{usuario.name}</p>
            <p className="text-sm text-texto-suave">{usuario.email}</p>
          </div>
        </div>
        <Badge tono="marca">{NOMBRE_ROL[usuario.rol] ?? usuario.rol}</Badge>
      </Tarjeta>

      <Tarjeta className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-texto">Tu tutorial de bienvenida</p>
            <p className="text-sm text-texto-suave">{usuario.onboardingCompletado ? "Completado ✓" : "Pendiente"}</p>
          </div>
          <BotonRelanzarTour />
        </div>
      </Tarjeta>

      <Tarjeta>
        <h2 className="mb-3 font-semibold text-texto">Cambiar mi contraseña</h2>
        <FormularioPassword />
      </Tarjeta>
    </div>
  );
}
