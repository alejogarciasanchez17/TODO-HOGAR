import type { Metadata } from "next";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { obtenerVendedorDeTurno } from "./actions-landing";
import { Icono } from "@/components/ui/Icono";
import { Boton } from "@/components/ui/Boton";
import { FormularioLanding } from "./FormularioLanding";

export const metadata: Metadata = {
  title: "todo hogar — Muebles tubulares y artículos para el hogar en Querétaro",
  description:
    "Renueva tu casa con muebles tubulares de mayor calidad y garantía directa post-venta. Agenda tu cita sin compromiso.",
  openGraph: {
    title: "todo hogar — Agenda tu cita sin compromiso",
    description: "Muebles tubulares y artículos para el hogar en Querétaro, con garantía directa post-venta.",
  },
};

const TESTIMONIOS = [
  { nombre: "Ana T., Juriquilla", texto: "Cambié toda mi recámara y la calidad es mucho mejor que lo que había visto en otras tiendas. La garantía me dio mucha tranquilidad." },
  { nombre: "Roberto M., Centro", texto: "Me atendieron súper rápido y me ayudaron a elegir un plan de pagos que me acomodó perfecto." },
  { nombre: "Fernanda C., Milenio III", texto: "Ya es la segunda vez que les compro. Puntuales y el mueble llegó tal cual la foto." },
];

export default async function PaginaLanding({ searchParams }: { searchParams: Promise<{ utm?: string }> }) {
  const sp = await searchParams;
  const config = await obtenerConfiguracionNegocio();
  const vendedor = await obtenerVendedorDeTurno();
  const whatsappNegocio = process.env.NEXT_PUBLIC_WHATSAPP_NEGOCIO || "524421234567";
  const mensajeWhatsapp = encodeURIComponent(config.mensajeWhatsappTipo || "Hola, quisiera más información");

  return (
    <div className="min-h-screen bg-fondo">
      {/* Header con propuesta de valor y CTA dominante, visible sin scroll */}
      <section className="mx-auto flex min-h-[85vh] max-w-5xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-todo-hogar.png" alt={config.nombreNegocio} className="size-20 rounded-full shadow-[var(--sombra-suave)]" />
        <div className="flex items-center gap-2.5 rounded-full bg-superficie-2 px-4 py-2 text-sm font-medium text-texto-suave">
          <Icono nombre="ShieldCheck" className="size-4 text-marca-fuerte" />
          Garantía directa post-venta
        </div>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-texto sm:text-5xl md:text-6xl">
          Renueva tu casa con muebles de <span style={{ color: config.colorMarca }}>mayor calidad</span>, en Querétaro
        </h1>
        <p className="max-w-xl text-lg text-texto-suave sm:text-xl">
          Recámaras, alacenas, cajoneras y más — muebles tubulares hechos para durar, con garantía directa y atención personal.
        </p>
        <a href="#agenda">
          <Boton tamano="lg" icono="CalendarDays" className="px-8 text-lg">Agenda tu cita</Boton>
        </a>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-6 text-sm text-texto-tenue">
          <span className="flex items-center gap-1.5"><Icono nombre="Users" className="size-4" /> +500 clientes atendidos</span>
          <span className="flex items-center gap-1.5"><Icono nombre="Star" className="size-4" /> Garantía directa</span>
          <span className="flex items-center gap-1.5"><Icono nombre="MapPin" className="size-4" /> Querétaro</span>
        </div>
      </section>

      {/* Calendario + formulario corto */}
      <section className="mx-auto max-w-2xl px-4 pb-16">
        {vendedor ? (
          <FormularioLanding
            vendedorId={vendedor.id}
            vendedorNombre={vendedor.nombre}
            horarioInicio={config.horarioInicio}
            horarioFin={config.horarioFin}
            canalUTM={sp.utm ?? ""}
            whatsappNegocio={whatsappNegocio}
          />
        ) : (
          <div className="rounded-[var(--radio-xl)] border border-borde bg-superficie p-8 text-center">
            <p className="text-texto-suave">Por ahora escríbenos directo por WhatsApp y con gusto te atendemos.</p>
            <a href={`https://wa.me/${whatsappNegocio}?text=${mensajeWhatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
              <Boton icono="MessageCircle" variante="exito">Escríbenos por WhatsApp</Boton>
            </a>
          </div>
        )}
      </section>

      {/* Prueba de confianza */}
      <section className="bg-superficie-2 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-8 text-center text-2xl font-semibold text-texto sm:text-3xl">Lo que dicen quienes ya confiaron en nosotros</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {TESTIMONIOS.map((t) => (
              <div key={t.nombre} className="rounded-[var(--radio-lg)] border border-borde bg-superficie p-5 shadow-[var(--sombra-suave)]">
                <div className="mb-2 flex gap-0.5 text-marca">
                  {Array.from({ length: 5 }).map((_, i) => <Icono key={i} nombre="Star" className="size-4 fill-marca" />)}
                </div>
                <p className="text-sm text-texto-suave">&ldquo;{t.texto}&rdquo;</p>
                <p className="mt-3 text-sm font-medium text-texto">{t.nombre}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Botón flotante de WhatsApp para los impacientes */}
      <a
        href={`https://wa.me/${whatsappNegocio}?text=${mensajeWhatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos ya por WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-exito text-white shadow-[var(--sombra-flotante)] transition-transform hover:scale-105"
      >
        <Icono nombre="MessageCircle" className="size-7" />
      </a>

      <footer className="border-t border-borde py-8 text-center text-sm text-texto-tenue">
        {config.nombreNegocio} · Querétaro
      </footer>
    </div>
  );
}
