import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerClientesLista } from "@/lib/clientes";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";
import { filtroPorRol } from "@/lib/permisos";
import { Icono } from "@/components/ui/Icono";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { ListaClientes } from "./ListaClientes";

export const metadata: Metadata = { title: "Clientes" };

type ParametrosBusqueda = Record<string, string | string[] | undefined>;

export default async function PaginaClientes({ searchParams }: { searchParams: Promise<ParametrosBusqueda> }) {
  const sp = await searchParams;
  const sesion = await auth();
  const usuario = { id: sesion!.user.id, rol: sesion!.user.rol };
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const filtros = {
    q: uno(sp.q) ?? "",
    etapa: uno(sp.etapa) ?? "",
    temperatura: uno(sp.temperatura) ?? "",
    vendedorId: uno(sp.vendedor) ?? "",
    favoritos: uno(sp.favoritos) ?? "",
    proximaVencida: uno(sp.vencidas) ?? "",
    ordenar: (uno(sp.orden) as "nombre" | "valor" | "proxima" | "reciente") ?? "reciente",
    pagina: Number(uno(sp.pagina) ?? "1") || 1,
  };

  const [config, { clientes, total, paginaActual, totalPaginas }, vendedores, etiquetas] = await Promise.all([
    obtenerConfiguracionNegocio(),
    obtenerClientesLista(usuario, filtros),
    sesion!.user.rol === "ADMIN"
      ? prisma.usuario.findMany({ where: { activo: true, eliminadoEn: null }, select: { id: true, nombre: true }, orderBy: { nombre: "asc" } })
      : Promise.resolve([]),
    prisma.etiqueta.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  const totalActivos = await prisma.cliente.count({ where: { eliminadoEn: null, estadoCartera: "ACTIVO", ...filtroPorRol(usuario, "vendedorId") } });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2.5">
          <Icono nombre="Users" className="size-7" style={{ color: "var(--color-acento-clientes)" }} />
          <h1 className="text-3xl font-semibold text-texto">Clientes</h1>
          <TooltipInfo
            texto="Aquí están todas tus personas: activos, con filtros para encontrar rápido a quien buscas."
            consejo="Usa los filtros de temperatura y próxima acción vencida para saber a quién atacar primero."
          />
        </div>
        <p className="mt-1 text-texto-suave">Todas tus personas en un solo lugar · {totalActivos} activos</p>
      </div>

      <ListaClientes
        clientesIniciales={JSON.parse(JSON.stringify(clientes))}
        total={total}
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        etapas={config.etapasEmbudo}
        moneda={config.moneda}
        vendedores={vendedores}
        etiquetas={etiquetas}
        esAdmin={sesion!.user.rol === "ADMIN"}
        usuarioId={sesion!.user.id}
        filtrosActuales={filtros}
      />
    </div>
  );
}
