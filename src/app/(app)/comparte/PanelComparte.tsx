"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { avisos } from "@/lib/toast";
import { ListaPaginasAgenda } from "./ListaPaginasAgenda";

type Vendedor = { id: string; nombre: string; slugAgenda: string | null; agendaActiva: boolean; citas: number };

const CANALES = ["instagram", "whatsapp", "volante", "facebook"] as const;

function LigaConQR({ liga, nombreArchivo, titulo }: { liga: string; nombreArchivo: string; titulo: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(liga, { width: 200, margin: 1 }).then(setQr).catch(() => setQr(null));
  }, [liga]);

  function copiar() {
    navigator.clipboard.writeText(liga);
    setCopiado(true);
    avisos.exito("Liga copiada ✓");
    setTimeout(() => setCopiado(false), 2000);
  }

  function descargarQR() {
    if (!qr) return;
    const a = document.createElement("a");
    a.href = qr;
    a.download = `${nombreArchivo}.png`;
    a.click();
  }

  return (
    <Tarjeta className="space-y-3">
      <p className="font-medium text-texto">{titulo}</p>
      <div className="flex items-center gap-2 rounded-[var(--radio-sm)] border border-borde bg-superficie-2 px-3 py-2 text-sm text-texto-suave">
        <span className="min-w-0 flex-1 truncate">{liga}</span>
        <button onClick={copiar} aria-label="Copiar liga" className="shrink-0 text-marca-fuerte">
          <Icono nombre={copiado ? "Check" : "Copy"} className="size-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Boton tamano="sm" variante="secundario" icono="Copy" onClick={copiar}>{copiado ? "Copiado ✓" : "Copiar liga"}</Boton>
        <a href={`https://wa.me/?text=${encodeURIComponent(liga)}`} target="_blank" rel="noopener noreferrer">
          <Boton tamano="sm" variante="exito" icono="MessageCircle" type="button">WhatsApp</Boton>
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(liga)}`} target="_blank" rel="noopener noreferrer">
          <Boton tamano="sm" variante="secundario" icono="Share2" type="button">Facebook</Boton>
        </a>
        {qr && <Boton tamano="sm" variante="fantasma" icono="QrCode" onClick={descargarQR}>Descargar QR</Boton>}
      </div>
      {qr && <img src={qr} alt={`Código QR de ${titulo}`} className="size-32 rounded-[var(--radio-sm)] border border-borde" />}
    </Tarjeta>
  );
}

export function PanelComparte({
  baseUrl,
  nombreNegocio,
  vendedores,
  esAdmin,
}: {
  baseUrl: string;
  nombreNegocio: string;
  vendedores: Vendedor[];
  esAdmin: boolean;
}) {
  const ligaLanding = baseUrl;

  return (
    <div className="space-y-6">
      <LigaConQR liga={ligaLanding} nombreArchivo="qr-landing" titulo={`Tu landing pública — ${nombreNegocio}`} />

      <div>
        <h2 className="mb-3 text-lg font-semibold text-texto">Ligas marcadas por canal</h2>
        <p className="mb-3 text-sm text-texto-suave">Usa una liga distinta por red social para saber cuál te trae más clientes.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CANALES.map((canal) => (
            <LigaConQR
              key={canal}
              liga={`${baseUrl}/?utm=${canal}`}
              nombreArchivo={`qr-${canal}`}
              titulo={canal.charAt(0).toUpperCase() + canal.slice(1)}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-texto">Páginas de agenda</h2>
        <ListaPaginasAgenda baseUrl={baseUrl} vendedores={vendedores} esAdmin={esAdmin} />
      </div>
    </div>
  );
}
