"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { iniciarSesion } from "./actions";
import { Campo } from "@/components/ui/Campo";
import { Input } from "@/components/ui/Input";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";

export function FormularioLogin() {
  const [error, accion, enCurso] = useActionState(iniciarSesion, undefined);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const parametros = useSearchParams();
  const callbackUrl = parametros.get("callbackUrl") ?? "/dashboard";

  return (
    <form action={accion} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <Campo etiqueta="Correo" nombre="correo" requerido>
        <Input
          id="correo"
          name="correo"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          required
        />
      </Campo>
      <Campo etiqueta="Contraseña" nombre="password" requerido>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={mostrarPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((v) => !v)}
            aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-texto-tenue hover:text-texto"
          >
            <Icono nombre={mostrarPassword ? "EyeOff" : "Eye"} className="size-5" />
          </button>
        </div>
      </Campo>
      {error && (
        <p role="alert" className="rounded-[var(--radio-sm)] bg-peligro/10 p-3 text-sm text-peligro">
          {error}
        </p>
      )}
      <Boton type="submit" anchoCompleto cargando={enCurso} tamano="lg">
        Entrar
      </Boton>
    </form>
  );
}
