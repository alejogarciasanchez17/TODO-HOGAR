"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Badge, BadgeEstadoCartera, BadgeTemperatura } from "@/components/ui/Badge";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { Select } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { TooltipInfo } from "@/components/ui/TooltipInfo";
import { avisos } from "@/lib/toast";
import { formatoHumano, diasDeAtraso, estaVencida } from "@/lib/utils-fecha";
import { telefonoInternacional, construirLinkWhatsapp, construirMailto } from "@/lib/clientes-utils";
import { rellenarPlantilla, mensajeTipoConNombre } from "@/lib/mensajes";
import {
  marcarClienteGanado,
  marcarClientePerdido,
  archivarCliente,
  restaurarClienteArchivado,
  reactivarClientePerdido,
  alternarFavorito,
  duplicarCliente,
  eliminarCliente,
  asignarEtiqueta,
  quitarEtiqueta,
} from "../actions";
import { registrarContacto } from "./actions-timeline";

type ClienteDetalle = {
  id: string;
  nombre: string;
  telefono: string | null;
  telefonoIntl: string | null;
  correo: string | null;
  zona: string | null;
  etapa: string;
  estadoCartera: string;
  temperatura: string;
  objecionPrincipal: string | null;
  valorEstimado: number;
  proximaAccion: string | null;
  proximaAccionFecha: string | null;
  ultimoContactoEn: string | null;
  motivoPerdida: string | null;
};

type Plantilla = { id: string; nombre: string; canal: string; asunto: string | null; cuerpo: string; categoria: string | null };

const MOTIVOS_PERDIDA = ["Está caro", "Se fue con la competencia", "No contestó", "No era buen momento", "No calificaba", "Otro"];

export function PanelPrincipal({
  cliente,
  moneda,
  mensajeTipo,
  nombreVendedor,
  esFavorito,
  etiquetasDisponibles,
  etiquetasCliente,
  plantillas,
}: {
  cliente: ClienteDetalle;
  moneda: string;
  mensajeTipo: string;
  nombreVendedor: string;
  esFavorito: boolean;
  etiquetasDisponibles: { id: string; nombre: string; color: string }[];
  etiquetasCliente: { id: string; nombre: string; color: string }[];
  plantillas: Plantilla[];
}) {
  const router = useRouter();
  const [favorito, setFavorito] = useState(esFavorito);
  const [confirmando, setConfirmando] = useState<"eliminar" | "archivar" | null>(null);
  const [modalPerdido, setModalPerdido] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS_PERDIDA[0]);
  const [motivoOtro, setMotivoOtro] = useState("");
  const [modalPlantillas, setModalPlantillas] = useState<"whatsapp" | "correo" | null>(null);

  const vencida = cliente.proximaAccionFecha ? estaVencida(cliente.proximaAccionFecha) : false;
  const diasSinContacto = cliente.ultimoContactoEn ? diasDeAtraso(cliente.ultimoContactoEn) : null;

  const telIntl = useMemo(
    () => cliente.telefonoIntl || (cliente.telefono ? telefonoInternacional(cliente.telefono) : ""),
    [cliente.telefonoIntl, cliente.telefono]
  );

  const datosMensaje = {
    nombre: cliente.nombre,
    etapa: cliente.etapa,
    valor: cliente.valorEstimado,
    vendedor: nombreVendedor,
    objecion: cliente.objecionPrincipal,
    moneda,
  };

  async function abrirWhatsappRapido() {
    if (!telIntl) return avisos.error("Este cliente no tiene WhatsApp registrado");
    const texto = mensajeTipoConNombre(mensajeTipo, cliente.nombre);
    window.open(construirLinkWhatsapp(telIntl, texto), "_blank");
    await registrarContacto(cliente.id, "whatsapp");
    router.refresh();
  }

  async function abrirConPlantilla(p: Plantilla) {
    const texto = rellenarPlantilla(p.cuerpo, datosMensaje);
    if (p.canal === "whatsapp") {
      if (!telIntl) return avisos.error("Este cliente no tiene WhatsApp registrado");
      window.open(construirLinkWhatsapp(telIntl, texto), "_blank");
      await registrarContacto(cliente.id, "whatsapp");
    } else {
      if (!cliente.correo) return avisos.error("Este cliente no tiene correo registrado");
      const asunto = rellenarPlantilla(p.asunto || "todo hogar", datosMensaje);
      window.open(construirMailto(cliente.correo, asunto, texto));
      await registrarContacto(cliente.id, "correo");
    }
    setModalPlantillas(null);
    router.refresh();
  }

  async function registrarLlamada() {
    await registrarContacto(cliente.id, "llamada");
    avisos.exito("Llamada registrada");
    router.refresh();
  }

  async function alDarFavorito() {
    setFavorito((v) => !v);
    await alternarFavorito(cliente.id);
  }

  async function ganar() {
    await marcarClienteGanado(cliente.id);
    avisos.exito(`¡Cerraste a ${cliente.nombre}! 🎉`);
    router.refresh();
  }

  async function perder() {
    await marcarClientePerdido(cliente.id, motivo, motivo === "Otro" ? motivoOtro : undefined);
    setModalPerdido(false);
    avisos.info("Movido a Perdidos");
    router.refresh();
  }

  async function archivar() {
    await archivarCliente(cliente.id);
    setConfirmando(null);
    avisos.exito("Cliente archivado");
    router.refresh();
  }

  async function eliminar() {
    await eliminarCliente(cliente.id);
    avisos.exito("Cliente eliminado (puedes restaurarlo desde la Papelera)");
    router.push("/clientes");
  }

  return (
    <Tarjeta className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold text-texto sm:text-3xl">{cliente.nombre}</h1>
          <button onClick={alDarFavorito} aria-label={favorito ? "Quitar de favoritos" : "Agregar a favoritos"} className="text-texto-tenue hover:text-marca">
            <Icono nombre="Star" className={favorito ? "size-6 fill-marca text-marca" : "size-6"} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <BadgeEstadoCartera estado={cliente.estadoCartera} />
          <BadgeTemperatura temperatura={cliente.temperatura} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {etiquetasCliente.map((e) => (
          <span key={e.id} className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium" style={{ borderColor: e.color, color: e.color }}>
            {e.nombre}
            <button onClick={() => { quitarEtiqueta(cliente.id, e.id); router.refresh(); }} aria-label={`Quitar etiqueta ${e.nombre}`}>
              <Icono nombre="X" className="size-3" />
            </button>
          </span>
        ))}
        {etiquetasDisponibles.filter((e) => !etiquetasCliente.some((ec) => ec.id === e.id)).length > 0 && (
          <select
            onChange={(e) => {
              if (e.target.value) { asignarEtiqueta(cliente.id, e.target.value); router.refresh(); }
              e.target.value = "";
            }}
            className="rounded-full border border-dashed border-borde bg-transparent px-2.5 py-1 text-xs text-texto-tenue"
            defaultValue=""
            aria-label="Agregar etiqueta"
          >
            <option value="">+ Etiqueta</option>
            {etiquetasDisponibles.filter((e) => !etiquetasCliente.some((ec) => ec.id === e.id)).map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-3 rounded-[var(--radio-md)] bg-superficie-2 p-4 sm:grid-cols-2">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-texto-tenue">
            Objeción principal
            <TooltipInfo texto="La razón por la que NO te ha comprado." consejo="Es lo que vas a vencer para cerrar." />
          </p>
          <p className="text-texto">{cliente.objecionPrincipal || "Sin registrar"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-texto-tenue">Último contacto</p>
          <p className={diasSinContacto && diasSinContacto > 5 ? "font-medium text-peligro" : "text-texto"}>
            {cliente.ultimoContactoEn ? `${formatoHumano(cliente.ultimoContactoEn)} · hace ${diasSinContacto} días` : "Aún sin contactar"}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-texto-tenue">
            Próxima acción
            <TooltipInfo texto="El siguiente paso con este cliente y cuándo." consejo="Si lo dejas vacío, el cliente se te enfría. Siempre déjale una." />
          </p>
          {cliente.proximaAccion ? (
            <p className={vencida ? "font-medium text-peligro" : "text-texto"}>
              {cliente.proximaAccion} {cliente.proximaAccionFecha && `· ${formatoHumano(cliente.proximaAccionFecha)}`}
              {vencida && " (vencida)"}
            </p>
          ) : (
            <Badge tono="advertencia">🟠 Sin seguimiento — defínele una acción</Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 text-sm text-texto-suave">
        {cliente.telefono && <span className="flex items-center gap-1.5"><Icono nombre="Phone" className="size-4" />{cliente.telefono}</span>}
        {cliente.correo && <span className="flex items-center gap-1.5"><Icono nombre="Mail" className="size-4" />{cliente.correo}</span>}
        {cliente.zona && <span className="flex items-center gap-1.5"><Icono nombre="MapPin" className="size-4" />{cliente.zona}</span>}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-borde pt-4">
        <Boton icono="MessageCircle" variante="exito" onClick={abrirWhatsappRapido}>WhatsApp</Boton>
        {plantillas.some((p) => p.canal === "whatsapp") && (
          <Boton icono="Sparkle" variante="secundario" onClick={() => setModalPlantillas("whatsapp")}>Plantilla WhatsApp</Boton>
        )}
        <Boton icono="Mail" variante="secundario" onClick={() => setModalPlantillas("correo")}>Correo</Boton>
        <Boton icono="Phone" variante="secundario" onClick={registrarLlamada}>Registrar llamada</Boton>
        <Boton icono="Copy" variante="fantasma" onClick={async () => { const r = await duplicarCliente(cliente.id); router.push(`/clientes/${r}`); }}>Duplicar</Boton>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-borde pt-4">
        {cliente.estadoCartera === "ACTIVO" && (
          <>
            <Boton icono="Trophy" variante="exito" onClick={ganar}>Marcar como ganado 🎉</Boton>
            <Boton icono="XCircle" variante="secundario" onClick={() => setModalPerdido(true)}>Marcar como perdido</Boton>
            <Boton icono="Archive" variante="fantasma" onClick={() => setConfirmando("archivar")}>Archivar</Boton>
          </>
        )}
        {cliente.estadoCartera === "PERDIDO" && (
          <Boton icono="RotateCcw" variante="secundario" onClick={async () => { await reactivarClientePerdido(cliente.id); avisos.exito("Reactivado"); router.refresh(); }}>
            Reactivar
          </Boton>
        )}
        {cliente.estadoCartera === "ARCHIVADO" && (
          <Boton icono="RotateCcw" variante="secundario" onClick={async () => { await restaurarClienteArchivado(cliente.id); avisos.exito("Restaurado"); router.refresh(); }}>
            Restaurar
          </Boton>
        )}
        <Boton icono="Trash2" variante="peligro" onClick={() => setConfirmando("eliminar")} className="ml-auto">Eliminar</Boton>
      </div>

      <ConfirmDialog
        abierto={confirmando === "eliminar"}
        onCerrar={() => setConfirmando(null)}
        onConfirmar={eliminar}
        titulo={`¿Eliminar a ${cliente.nombre}?`}
        descripcion="Se moverá a la Papelera. Un administrador podrá restaurarlo hasta por 30 días."
        textoConfirmar="Sí, eliminar"
        variantePeligro
      />
      <ConfirmDialog
        abierto={confirmando === "archivar"}
        onCerrar={() => setConfirmando(null)}
        onConfirmar={archivar}
        titulo={`¿Archivar a ${cliente.nombre}?`}
        descripcion="Podrás restaurarlo cuando quieras desde Archivados. No se borra nada."
        textoConfirmar="Archivar"
      />

      <Modal abierto={modalPerdido} onCerrar={() => setModalPerdido(false)} titulo="Marcar como perdido" descripcion="Cuéntanos por qué, para aprender y mejorar." ancho="sm">
        <div className="space-y-4">
          <Select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            {MOTIVOS_PERDIDA.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          {motivo === "Otro" && (
            <input
              value={motivoOtro}
              onChange={(e) => setMotivoOtro(e.target.value)}
              placeholder="Escribe el motivo"
              className="w-full min-h-[44px] rounded-[var(--radio-sm)] border border-borde bg-superficie px-3.5 py-2 text-base"
            />
          )}
          <div className="flex justify-end gap-3">
            <Boton variante="secundario" onClick={() => setModalPerdido(false)}>Cancelar</Boton>
            <Boton onClick={perder}>Confirmar</Boton>
          </div>
        </div>
      </Modal>

      <Modal
        abierto={modalPlantillas !== null}
        onCerrar={() => setModalPlantillas(null)}
        titulo={modalPlantillas === "whatsapp" ? "Elige una plantilla de WhatsApp" : "Elige una plantilla de correo"}
        descripcion="Se rellena con los datos de este cliente antes de enviarse."
        ancho="md"
      >
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {plantillas.filter((p) => p.canal === modalPlantillas).length === 0 && (
            <p className="text-texto-suave">No hay plantillas de este canal todavía. Ve a &quot;Mis plantillas&quot; para crear una.</p>
          )}
          {plantillas.filter((p) => p.canal === modalPlantillas).map((p) => (
            <button
              key={p.id}
              onClick={() => abrirConPlantilla(p)}
              className="block w-full rounded-[var(--radio-sm)] border border-borde p-3 text-left hover:bg-superficie-2"
            >
              <p className="font-medium text-texto">{p.nombre}</p>
              <p className="mt-1 line-clamp-2 text-sm text-texto-suave">{rellenarPlantilla(p.cuerpo, datosMensaje)}</p>
            </button>
          ))}
          {modalPlantillas === "correo" && (
            <button
              onClick={() => {
                if (!cliente.correo) return avisos.error("Este cliente no tiene correo registrado");
                window.open(construirMailto(cliente.correo, "todo hogar", `Hola ${cliente.nombre},\n\n`));
                setModalPlantillas(null);
              }}
              className="block w-full rounded-[var(--radio-sm)] border border-dashed border-borde p-3 text-left text-sm text-texto-suave hover:bg-superficie-2"
            >
              Escribir correo en blanco
            </button>
          )}
        </div>
      </Modal>
    </Tarjeta>
  );
}
