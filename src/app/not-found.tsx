import Link from "next/link";
import { Icono } from "@/components/ui/Icono";
import { Boton } from "@/components/ui/Boton";

export default function NoEncontrado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-fondo px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-marca-suave">
        <Icono nombre="Search" className="size-8 text-marca-fuerte" />
      </div>
      <h1 className="text-2xl font-semibold text-texto">No encontramos esta página</h1>
      <p className="max-w-sm text-texto-suave">Puede que la liga esté mal escrita o que la página ya no exista. Vamos de vuelta al inicio.</p>
      <Link href="/dashboard">
        <Boton icono="Home">Volver al inicio</Boton>
      </Link>
    </div>
  );
}
