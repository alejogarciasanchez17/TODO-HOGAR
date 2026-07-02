import { ImageResponse } from "next/og";
import { obtenerConfiguracionNegocio } from "@/lib/config-negocio";

export const alt = "todo hogar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const config = await obtenerConfiguracionNegocio();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf8f5",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 140,
            height: 140,
            borderRadius: 32,
            background: config.colorMarca,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <span style={{ fontSize: 64, fontWeight: 700, color: "#3a2a0f" }}>
            {config.nombreNegocio.charAt(0).toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, color: "#1c1917" }}>{config.nombreNegocio}</div>
        <div style={{ fontSize: 32, color: "#57534e", marginTop: 16 }}>
          Muebles tubulares y artículos para el hogar · Querétaro
        </div>
      </div>
    ),
    { ...size }
  );
}
