"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Boton } from "@/components/ui/Boton";
import { Input, Select } from "@/components/ui/Input";
import { Badge, BadgeTemperatura } from "@/components/ui/Badge";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Icono } from "@/components/ui/Icono";
import { formatoMoneda } from "@/lib/moneda";
import { formatoFechaCorta, estaVencida } from "@/lib/utils-fecha";
import { cn } from "@/lib/utils";
import { BotonFavorito } from "./BotonFavorito";

type ClienteFila = {
  id: string;
  nombre: string;
  telefono: string | null;
  correo: string | null;
  etapa: string;
  valorEstimado: number;
  temperatura: string;
  proximaAccion: string | null;
  proximaAccionFecha: string | null;
  empresaNombre: string | null;
  zona: string | null;
  vendedor: { id: string; nombre: string };
  etiquetas: { etiqueta: { id: string; nombre: string; color: string } }[];
  favoritos: { id: string }[];
  pagos: { estatus: string; monto: number }[];
};

type Props = {
  clientesIniciales: ClienteFila[];
  total: number;
  paginaActual: number;
  totalPaginas: number;
  etapas: string[];
  moneda: string;
  vendedores: { id: string; nombre: string }[];
  etiquetas: { id: string; nombre: string; color: string }[];
  esAdmin: boolean;
  usuarioId: string;
  filtrosActuales: {
    q: string;
    etapa: string;
    temperatura: string;
    vendedorId: string;
    favoritos: string;
    proximaVencida: string;
    ordenar: string;
  };
};

export function ListaClientes(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, iniciarTransicion] = useTransition();
  const [q, setQ] = useState(props.filtrosActuales.q);

  function actualizarUrl(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    params.delete("pagina");
    iniciarTransicion(() => router.push(`/clientes?${params.toString()}`));
  }

  useEffect(() => {
    const espera = setTimeout(() => {
      if (q !== props.filtrosActuales.q) actualizarUrl({ q: q || undefined });
    }, 350);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const chips = useMemo(() => {
    const lista: { clave: string; texto: string }[] = [];
    if (props.filtrosActuales.etapa) lista.push({ clave: "etapa", texto: `Etapa: ${props.filtrosActuales.etapa}` });
    if (props.filtrosActuales.temperatura) lista.push({ clave: "temperatura", texto: `Temperatura: ${props.filtrosActuales.temperatura}` });
    if (props.filtrosActuales.vendedorId) {
      const v = props.vendedores.find((v) => v.id === props.filtrosActuales.vendedorId);
      lista.push({ clave: "vendedor", texto: `Vendedor: ${v?.nombre ?? ""}` });
    }
    if (props.filtrosActuales.favoritos === "1") lista.push({ clave: "favoritos", texto: "⭐ Favoritos" });
    if (props.filtrosActuales.proximaVencida === "1") lista.push({ clave: "vencidas", texto: "Próxima acción vencida" });
    return lista;
  }, [props.filtrosActuales, props.vendedores]);

  const pagina = new URLSearchParams(searchParams.toString());

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icono nombre="Search" className="absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-texto-tenue" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, teléfono, correo o empresa…"
            className="pl-10"
          />
        </div>
        <Select
          value={props.filtrosActuales.etapa}
          onChange={(e) => actualizarUrl({ etapa: e.target.value || undefined })}
          className="sm:w-48"
        >
          <option value="">Todas las etapas</option>
          {props.etapas.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </Select>
        <Select
          value={props.filtrosActuales.temperatura}
          onChange={(e) => actualizarUrl({ temperatura: e.target.value || undefined })}
          className="sm:w-40"
        >
          <option value="">Toda temperatura</option>
          <option value="CALIENTE">🔥 Caliente</option>
          <option value="TIBIO">🟡 Tibio</option>
          <option value="FRIO">🔵 Frío</option>
        </Select>
        {props.esAdmin && (
          <Select
            value={props.filtrosActuales.vendedorId}
            onChange={(e) => actualizarUrl({ vendedor: e.target.value || undefined })}
            className="sm:w-44"
          >
            <option value="">Todo el equipo</option>
            {props.vendedores.map((v) => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </Select>
        )}
        <Select
          value={props.filtrosActuales.ordenar}
          onChange={(e) => actualizarUrl({ orden: e.target.value })}
          className="sm:w-44"
        >
          <option value="reciente">Más reciente</option>
          <option value="nombre">Nombre (A-Z)</option>
          <option value="valor">Mayor valor</option>
          <option value="proxima">Próxima acción</option>
        </Select>
        <Link href="/clientes/nuevo">
          <Boton icono="Plus" className="shrink-0">Nuevo cliente</Boton>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => actualizarUrl({ favoritos: props.filtrosActuales.favoritos === "1" ? undefined : "1" })}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium",
            props.filtrosActuales.favoritos === "1" ? "border-marca bg-marca-suave text-marca-contraste" : "border-borde text-texto-suave hover:bg-superficie-2"
          )}
        >
          <Icono nombre="Star" className="size-3.5" /> Favoritos
        </button>
        <button
          onClick={() => actualizarUrl({ vencidas: props.filtrosActuales.proximaVencida === "1" ? undefined : "1" })}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium",
            props.filtrosActuales.proximaVencida === "1" ? "border-peligro bg-peligro/10 text-peligro" : "border-borde text-texto-suave hover:bg-superficie-2"
          )}
        >
          <Icono nombre="AlertTriangle" className="size-3.5" /> Vencidas
        </button>
        {chips.map((chip) => (
          <span key={chip.clave} className="flex items-center gap-1.5 rounded-full bg-superficie-2 px-3 py-1.5 text-sm text-texto-suave">
            {chip.texto}
            <button onClick={() => actualizarUrl({ [chip.clave === "vendedor" ? "vendedor" : chip.clave]: undefined })} aria-label={`Quitar filtro ${chip.texto}`}>
              <Icono nombre="X" className="size-3.5" />
            </button>
          </span>
        ))}
        {(chips.length > 0 || q) && (
          <button
            onClick={() => {
              setQ("");
              router.push("/clientes");
            }}
            className="text-sm font-medium text-marca-fuerte hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {props.clientesIniciales.length === 0 ? (
        <Tarjeta className="flex flex-col items-center gap-3 py-16 text-center">
          <Icono nombre="Users" className="size-10 text-texto-tenue" />
          <p className="text-lg font-medium text-texto">
            {q || chips.length > 0 ? `Ningún cliente con estos filtros.` : "Aún no tienes clientes."}
          </p>
          <p className="text-texto-suave">{q || chips.length > 0 ? "Prueba quitar alguno." : "Agrega tu primer cliente para empezar a venderle."}</p>
          <Link href="/clientes/nuevo"><Boton icono="Plus">Nuevo cliente</Boton></Link>
        </Tarjeta>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {props.clientesIniciales.map((c) => {
            const vencida = c.proximaAccionFecha ? estaVencida(c.proximaAccionFecha) : false;
            return (
              <Tarjeta key={c.id} className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="min-h-[44px] flex-1 text-lg font-semibold text-texto underline-offset-2 hover:text-marca-fuerte hover:underline"
                  >
                    {c.nombre}
                  </Link>
                  <BotonFavorito clienteId={c.id} esFavorito={c.favoritos.length > 0} />
                </div>
                {c.empresaNombre && <p className="flex items-center gap-1.5 text-sm text-texto-suave"><Icono nombre="Building2" className="size-3.5" />{c.empresaNombre}</p>}
                <div className="flex flex-wrap items-center gap-1.5">
                  <BadgeTemperatura temperatura={c.temperatura} />
                  <Badge tono="neutro">{c.etapa}</Badge>
                  {c.etiquetas.map((e) => (
                    <span
                      key={e.etiqueta.id}
                      className="rounded-full border px-2.5 py-1 text-xs font-medium"
                      style={{ borderColor: e.etiqueta.color, color: e.etiqueta.color }}
                    >
                      {e.etiqueta.nombre}
                    </span>
                  ))}
                </div>
                <p className="text-xl font-semibold text-texto">{formatoMoneda(c.valorEstimado, props.moneda)}</p>
                {c.proximaAccion && (
                  <p className={cn("flex items-start gap-1.5 text-sm", vencida ? "font-medium text-peligro" : "text-texto-suave")}>
                    <Icono nombre="Clock" className="mt-0.5 size-3.5 shrink-0" />
                    {c.proximaAccion} {c.proximaAccionFecha && `· ${formatoFechaCorta(c.proximaAccionFecha)}`}
                  </p>
                )}
                {props.esAdmin && <p className="text-xs text-texto-tenue">Vendedor: {c.vendedor.nombre}</p>}
              </Tarjeta>
            );
          })}
        </div>
      )}

      {props.totalPaginas > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-texto-tenue">
            Mostrando {props.clientesIniciales.length} de {props.total}
          </p>
          <div className="flex gap-2">
            <Boton
              variante="secundario"
              tamano="sm"
              disabled={props.paginaActual <= 1}
              onClick={() => {
                pagina.set("pagina", String(props.paginaActual - 1));
                router.push(`/clientes?${pagina.toString()}`);
              }}
            >
              Anterior
            </Boton>
            <Boton
              variante="secundario"
              tamano="sm"
              disabled={props.paginaActual >= props.totalPaginas}
              onClick={() => {
                pagina.set("pagina", String(props.paginaActual + 1));
                router.push(`/clientes?${pagina.toString()}`);
              }}
            >
              Siguiente
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
