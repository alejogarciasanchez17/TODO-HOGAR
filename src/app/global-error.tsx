"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#faf8f5", padding: 24, textAlign: "center", fontFamily: "sans-serif" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#1c1917" }}>Algo salió mal</h1>
          <p style={{ maxWidth: 380, color: "#57534e" }}>Tuvimos un problema técnico grave. Intenta recargar la página.</p>
          <button
            onClick={() => reset()}
            style={{ background: "#e8b763", color: "#3a2a0f", border: "none", borderRadius: 12, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
