"use client";

import { useActionState, useEffect } from "react";
import { Campo } from "@/components/ui/Campo";
import { Input } from "@/components/ui/Input";
import { Boton } from "@/components/ui/Boton";
import { avisos } from "@/lib/toast";
import { cambiarMiPassword } from "./actions";

export function FormularioPassword() {
  const [estado, accion, enCurso] = useActionState(cambiarMiPassword, undefined);

  useEffect(() => {
    if (estado === "OK") avisos.exito("Contraseña actualizada ✓");
  }, [estado]);

  return (
    <form action={accion} className="space-y-4">
      <Campo etiqueta="Contraseña actual" nombre="actual" requerido>
        <Input name="actual" type="password" required />
      </Campo>
      <Campo etiqueta="Nueva contraseña" nombre="nueva" requerido ayuda="Mínimo 8 caracteres">
        <Input name="nueva" type="password" required minLength={8} />
      </Campo>
      <Campo etiqueta="Confirma la nueva contraseña" nombre="confirmacion" requerido>
        <Input name="confirmacion" type="password" required minLength={8} />
      </Campo>
      {estado && estado !== "OK" && <p className="text-sm text-peligro" role="alert">{estado}</p>}
      <Boton type="submit" cargando={enCurso} icono="Check">Actualizar contraseña</Boton>
    </form>
  );
}
