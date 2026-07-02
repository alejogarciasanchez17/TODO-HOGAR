import { Suspense } from "react";
import type { Metadata } from "next";
import { FormularioLogin } from "./FormularioLogin";
import { Icono } from "@/components/ui/Icono";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function PaginaLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fondo px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-[var(--radio-lg)] bg-marca text-marca-contraste shadow-[var(--sombra-suave)]">
            <Icono nombre="ShoppingBag" className="size-7" />
          </div>
          <h1 className="text-2xl font-semibold text-texto">todo hogar</h1>
          <p className="text-texto-suave">Entra para gestionar tus clientes y tus ventas.</p>
        </div>
        <div className="rounded-[var(--radio-xl)] border border-borde bg-superficie p-6 shadow-[var(--sombra-suave)] sm:p-8">
          <Suspense>
            <FormularioLogin />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
