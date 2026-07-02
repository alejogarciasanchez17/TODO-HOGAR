"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { Badge } from "@/components/ui/Badge";
import { Campo } from "@/components/ui/Campo";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Icono } from "@/components/ui/Icono";
import { avisos } from "@/lib/toast";
import { crearUsuario, actualizarUsuario, alternarActivoUsuario, resetearPasswordUsuario } from "./actions";

type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  metaMensual: number;
  comisionPct: number | null;
  slugAgenda: string | null;
};

export function ListaUsuarios({ usuarios, idPropio }: { usuarios: Usuario[]; idPropio: string }) {
  const router = useRouter();
  const [modalNuevo, setModalNuevo] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [reseteando, setReseteando] = useState<Usuario | null>(null);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [estado, accion, enCurso] = useActionState(crearUsuario, undefined);

  useEffect(() => {
    if (estado === "OK") {
      setModalNuevo(false);
      avisos.exito("Usuario creado ✓");
      router.refresh();
    } else if (estado) {
      avisos.error(estado);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  async function guardarEdicion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editando) return;
    try {
      await actualizarUsuario(editando.id, new FormData(e.currentTarget));
      avisos.exito("Usuario actualizado");
      setEditando(null);
      router.refresh();
    } catch (err) {
      avisos.error(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  return (
    <div className="space-y-4">
      <Boton icono="Plus" onClick={() => setModalNuevo(true)}>Agregar usuario</Boton>

      <div className="divide-y divide-borde rounded-[var(--radio-lg)] border border-borde bg-superficie">
        {usuarios.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-texto">{u.nombre} {!u.activo && <span className="text-texto-tenue">(desactivado)</span>}</p>
              <p className="text-sm text-texto-suave">{u.correo}</p>
            </div>
            <Badge tono={u.rol === "ADMIN" ? "marca" : "neutro"}>{u.rol}</Badge>
            <p className="text-sm text-texto-tenue">Meta: {u.metaMensual}</p>
            <Boton tamano="sm" variante="secundario" icono="Pencil" onClick={() => setEditando(u)}>Editar</Boton>
            <Boton tamano="sm" variante="fantasma" icono="RefreshCw" onClick={() => setReseteando(u)}>Resetear contraseña</Boton>
            {u.id !== idPropio && (
              <Boton
                tamano="sm"
                variante={u.activo ? "peligro" : "secundario"}
                icono={u.activo ? "XCircle" : "Check"}
                onClick={async () => {
                  await alternarActivoUsuario(u.id);
                  avisos.exito(u.activo ? "Usuario desactivado" : "Usuario activado");
                  router.refresh();
                }}
              >
                {u.activo ? "Desactivar" : "Activar"}
              </Boton>
            )}
          </div>
        ))}
      </div>

      <Modal abierto={modalNuevo} onCerrar={() => setModalNuevo(false)} titulo="Agregar usuario" ancho="sm">
        <form action={accion} className="space-y-4">
          <Campo etiqueta="Nombre" nombre="nombre" requerido><Input name="nombre" required /></Campo>
          <Campo etiqueta="Correo" nombre="correo" requerido><Input name="correo" type="email" required /></Campo>
          <Campo etiqueta="Contraseña temporal" nombre="password" requerido ayuda="Mínimo 8 caracteres"><Input name="password" type="text" required minLength={8} /></Campo>
          <Campo etiqueta="Rol" nombre="rol">
            <Select name="rol" defaultValue="VENDEDOR">
              <option value="VENDEDOR">Vendedor</option>
              <option value="ADMIN">Administrador</option>
              <option value="LECTURA">Solo lectura</option>
            </Select>
          </Campo>
          <Campo etiqueta="Meta mensual (clientes)" nombre="metaMensual"><Input name="metaMensual" type="number" min={0} defaultValue={10} /></Campo>
          <Campo etiqueta="Comisión % (opcional)" nombre="comisionPct"><Input name="comisionPct" type="number" min={0} max={100} /></Campo>
          <div className="flex justify-end gap-3 border-t border-borde pt-4">
            <Boton type="button" variante="secundario" onClick={() => setModalNuevo(false)}>Cancelar</Boton>
            <Boton type="submit" cargando={enCurso} icono="Check">Crear</Boton>
          </div>
        </form>
      </Modal>

      <Modal abierto={editando !== null} onCerrar={() => setEditando(null)} titulo="Editar usuario" ancho="sm">
        {editando && (
          <form onSubmit={guardarEdicion} className="space-y-4">
            <Campo etiqueta="Nombre" nombre="nombre"><Input name="nombre" defaultValue={editando.nombre} required /></Campo>
            <Campo etiqueta="Rol" nombre="rol">
              <Select name="rol" defaultValue={editando.rol}>
                <option value="VENDEDOR">Vendedor</option>
                <option value="ADMIN">Administrador</option>
                <option value="LECTURA">Solo lectura</option>
              </Select>
            </Campo>
            <Campo etiqueta="Meta mensual" nombre="metaMensual"><Input name="metaMensual" type="number" min={0} defaultValue={editando.metaMensual} /></Campo>
            <Campo etiqueta="Comisión %" nombre="comisionPct"><Input name="comisionPct" type="number" min={0} max={100} defaultValue={editando.comisionPct ?? ""} /></Campo>
            <div className="flex justify-end gap-3 border-t border-borde pt-4">
              <Boton type="button" variante="secundario" onClick={() => setEditando(null)}>Cancelar</Boton>
              <Boton type="submit" icono="Check">Guardar</Boton>
            </div>
          </form>
        )}
      </Modal>

      <Modal abierto={reseteando !== null} onCerrar={() => setReseteando(null)} titulo="Resetear contraseña" ancho="sm">
        <div className="space-y-4">
          <Campo etiqueta="Nueva contraseña temporal" nombre="nuevaPassword" ayuda="Mínimo 8 caracteres. Compártela con el vendedor de forma segura.">
            <Input value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} minLength={8} />
          </Campo>
          <div className="flex justify-end gap-3 border-t border-borde pt-4">
            <Boton variante="secundario" onClick={() => setReseteando(null)}>Cancelar</Boton>
            <Boton
              icono="Check"
              onClick={async () => {
                if (!reseteando) return;
                try {
                  await resetearPasswordUsuario(reseteando.id, nuevaPassword);
                  avisos.exito("Contraseña actualizada");
                  setReseteando(null);
                  setNuevaPassword("");
                } catch (err) {
                  avisos.error(err instanceof Error ? err.message : "No se pudo resetear");
                }
              }}
            >
              Guardar
            </Boton>
          </div>
        </div>
      </Modal>
    </div>
  );
}
