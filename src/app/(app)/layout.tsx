import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Topbar } from "@/components/layout/Topbar";
import { Icono } from "@/components/ui/Icono";
import { AtajosGlobales } from "@/components/layout/AtajosGlobales";
import { Tour } from "@/components/onboarding/Tour";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sesion = await auth();
  if (!sesion?.user) redirect("/login");

  const esAdmin = sesion.user.rol === "ADMIN";

  return (
    <div className="flex min-h-screen">
      <Sidebar esAdmin={esAdmin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10 md:pt-7">{children}</main>
      </div>
      <BottomNav esAdmin={esAdmin} />
      <Link
        href="/clientes/nuevo"
        aria-label="Agregar cliente nuevo"
        className="fixed bottom-8 right-8 z-30 hidden size-14 items-center justify-center rounded-full bg-marca text-marca-contraste shadow-[var(--sombra-flotante)] transition-transform hover:scale-105 active:scale-95 md:flex"
      >
        <Icono nombre="Plus" className="size-6" />
      </Link>
      <AtajosGlobales />
      <Tour onboardingCompletado={sesion.user.onboardingCompletado} esAdmin={esAdmin} />
    </div>
  );
}
