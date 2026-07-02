"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { crearCliente, actualizarClienteFormAction } from "./actions";
import { Campo } from "@/components/ui/Campo";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Boton } from "@/components/ui/Boton";
import { Modal } from "@/components/ui/Modal";
import { avisos } from "@/lib/toast";

export type ValoresCliente = {
  id?: string;
  nombre?: string;
  telefono?: string;
  correo?: string;
  origen?: string;
  etapa?: string;
  valorEstimado?: number;
  temperatura?: string;
  objecionPrincipal?: string;
  notas?: string;
  proximaAccion?: string;
  proximaAccionFecha?: string;
  zona?: string;
  vendedorId?: string;
  empresaNombre?: string;
  empresaGiro?: string;
  empresaPuesto?: string;
  empresaRFC?: string;
  empresaSitioWeb?: string;
  empresaDireccion?: string;
  empresaTamano?: string;
  empresaNotas?: string;
};

const OBJECIONES = [
  "Está caro",
  "Lo voy a pensar",
  "Tengo que consultarlo con mi pareja/socio",
  "No es buen momento",
];

export function FormularioCliente({
  modo,
  valores,
  vendedores,
  etapas,
  esAdmin,
  usuarioId,
}: {
  modo: "crear" | "editar";
  valores?: ValoresCliente;
  vendedores: { id: string; nombre: string }[];
  etapas: string[];
  esAdmin: boolean;
  usuarioId: string;
}) {
  const router = useRouter();
  const accion =
    modo === "crear" ? crearCliente : actualizarClienteFormAction.bind(null, valores?.id ?? "");
  const [estado, ejecutarAccion, enCurso] = useActionState(accion, undefined);
  const [empresaAbierta, setEmpresaAbierta] = useState(
    Boolean(valores?.empresaNombre || valores?.empresaGiro)
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [duplicado, setDuplicado] = useState<{ id: string; nombre: string } | null>(null);

  useEffect(() => {
    if (estado?.startsWith("DUPLICADO:")) {
      const [, id, nombre] = estado.split(":");
      setDuplicado({ id, nombre });
    } else if (estado === "OK" && modo === "editar") {
      avisos.exito("Cliente actualizado ✓");
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const errorVisible = estado && estado !== "OK" && !estado.startsWith("DUPLICADO:") ? estado : null;

  return (
    <>
      <form ref={formRef} action={ejecutarAccion} className="space-y-6">
        <input type="hidden" name="omitirDuplicado" value="0" />

        {errorVisible && (
          <p role="alert" className="rounded-[var(--radio-sm)] bg-peligro/10 p-3 text-sm text-peligro">
            {errorVisible}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre completo" nombre="nombre" requerido className="sm:col-span-2">
            <Input id="nombre" name="nombre" defaultValue={valores?.nombre} required placeholder="Ej. Juan Pérez" />
          </Campo>
          <Campo
            etiqueta="WhatsApp / Teléfono"
            nombre="telefono"
            ayuda="Con lada, ej. 442 123 4567"
          >
            <Input id="telefono" name="telefono" defaultValue={valores?.telefono} placeholder="442 123 4567" />
          </Campo>
          <Campo etiqueta="Correo" nombre="correo">
            <Input id="correo" name="correo" type="email" defaultValue={valores?.correo} placeholder="opcional" />
          </Campo>
          <Campo etiqueta="Origen / canal" nombre="origen">
            <Input id="origen" name="origen" defaultValue={valores?.origen} placeholder="Instagram, recomendado…" />
          </Campo>
          <Campo etiqueta="Zona / ubicación" nombre="zona">
            <Input id="zona" name="zona" defaultValue={valores?.zona} placeholder="Colonia, ciudad" />
          </Campo>
        </div>

        <div className="border-t border-borde pt-5">
          <h3 className="mb-3 text-sm font-semibold text-texto-suave">Datos de venta</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Etapa" nombre="etapa">
              <Select id="etapa" name="etapa" defaultValue={valores?.etapa ?? etapas[0]}>
                {etapas.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            </Campo>
            <Campo
              etiqueta="Temperatura"
              nombre="temperatura"
              info={{
                texto: "Qué tan cerca está de comprar.",
                consejo: "Gasta tu energía primero en los 🔥 calientes.",
              }}
            >
              <Select id="temperatura" name="temperatura" defaultValue={valores?.temperatura ?? "TIBIO"}>
                <option value="CALIENTE">🔥 Caliente</option>
                <option value="TIBIO">🟡 Tibio</option>
                <option value="FRIO">🔵 Frío</option>
              </Select>
            </Campo>
            <Campo
              etiqueta="Valor estimado"
              nombre="valorEstimado"
              info={{ texto: "Cuánto representa este cliente si cierra.", consejo: "Úsalo para priorizar a quién le hablas primero." }}
            >
              <Input
                id="valorEstimado"
                name="valorEstimado"
                type="number"
                min={0}
                step="1"
                defaultValue={valores?.valorEstimado ?? 0}
              />
            </Campo>
            <Campo
              etiqueta="Objeción principal"
              nombre="objecionPrincipal"
              info={{
                texto: "La razón por la que no te ha comprado.",
                consejo: "Anótala apenas la oigas: es lo que vas a vencer para cerrar.",
              }}
            >
              <Select id="objecionPrincipal" name="objecionPrincipal" defaultValue={valores?.objecionPrincipal ?? ""}>
                <option value="">Sin objeción registrada</option>
                {OBJECIONES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </Campo>
            <Campo
              etiqueta="Próxima acción"
              nombre="proximaAccion"
              info={{
                texto: "El siguiente paso con este cliente.",
                consejo: "Si lo dejas vacío, el cliente se te enfría. Siempre déjale una.",
              }}
            >
              <Input
                id="proximaAccion"
                name="proximaAccion"
                defaultValue={valores?.proximaAccion}
                placeholder="Ej. Llamar para cerrar"
              />
            </Campo>
            <Campo etiqueta="Fecha de la próxima acción" nombre="proximaAccionFecha">
              <Input
                id="proximaAccionFecha"
                name="proximaAccionFecha"
                type="date"
                defaultValue={valores?.proximaAccionFecha}
              />
            </Campo>
            {esAdmin && (
              <Campo etiqueta="Vendedor dueño" nombre="vendedorId">
                <Select id="vendedorId" name="vendedorId" defaultValue={valores?.vendedorId ?? usuarioId}>
                  {vendedores.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}
                    </option>
                  ))}
                </Select>
              </Campo>
            )}
          </div>
        </div>

        <Campo etiqueta="Notas" nombre="notas">
          <Textarea id="notas" name="notas" defaultValue={valores?.notas} placeholder="Detalles de la conversación…" />
        </Campo>

        <div className="border-t border-borde pt-4">
          <button
            type="button"
            onClick={() => setEmpresaAbierta((v) => !v)}
            className="text-sm font-semibold text-marca-fuerte hover:underline"
          >
            {empresaAbierta ? "− Ocultar datos de empresa" : "+ Agregar datos de empresa (opcional)"}
          </button>
          {empresaAbierta && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre de la empresa" nombre="empresaNombre">
                <Input id="empresaNombre" name="empresaNombre" defaultValue={valores?.empresaNombre} />
              </Campo>
              <Campo etiqueta="Giro / industria" nombre="empresaGiro">
                <Input id="empresaGiro" name="empresaGiro" defaultValue={valores?.empresaGiro} />
              </Campo>
              <Campo etiqueta="Puesto del contacto" nombre="empresaPuesto">
                <Input id="empresaPuesto" name="empresaPuesto" defaultValue={valores?.empresaPuesto} />
              </Campo>
              <Campo etiqueta="RFC / ID fiscal" nombre="empresaRFC">
                <Input id="empresaRFC" name="empresaRFC" defaultValue={valores?.empresaRFC} />
              </Campo>
              <Campo etiqueta="Sitio web o redes" nombre="empresaSitioWeb">
                <Input id="empresaSitioWeb" name="empresaSitioWeb" defaultValue={valores?.empresaSitioWeb} />
              </Campo>
              <Campo etiqueta="Tamaño / empleados" nombre="empresaTamano">
                <Input id="empresaTamano" name="empresaTamano" defaultValue={valores?.empresaTamano} />
              </Campo>
              <Campo etiqueta="Dirección" nombre="empresaDireccion" className="sm:col-span-2">
                <Input id="empresaDireccion" name="empresaDireccion" defaultValue={valores?.empresaDireccion} />
              </Campo>
              <Campo etiqueta="Notas de la empresa" nombre="empresaNotas" className="sm:col-span-2">
                <Textarea id="empresaNotas" name="empresaNotas" defaultValue={valores?.empresaNotas} />
              </Campo>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-borde pt-5">
          <Boton type="button" variante="secundario" onClick={() => router.back()}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={enCurso} icono="Check">
            {modo === "crear" ? "Agregar cliente" : "Guardar cambios"}
          </Boton>
        </div>
      </form>

      <Modal
        abierto={!!duplicado}
        onCerrar={() => setDuplicado(null)}
        titulo="Este cliente ya existe"
        descripcion={`Ya tienes a ${duplicado?.nombre} con este WhatsApp o correo. ¿Qué quieres hacer?`}
        ancho="sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Boton
            variante="secundario"
            onClick={() => {
              if (formRef.current) {
                const campo = formRef.current.elements.namedItem("omitirDuplicado") as HTMLInputElement;
                campo.value = "1";
                formRef.current.requestSubmit();
              }
              setDuplicado(null);
            }}
          >
            Crear uno nuevo de todas formas
          </Boton>
          <Boton onClick={() => duplicado && router.push(`/clientes/${duplicado.id}`)}>Abrir su ficha</Boton>
        </div>
      </Modal>
    </>
  );
}
