import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "todo hogar · CRM",
    short_name: "todo hogar",
    description: "El CRM de todo hogar: agenda, seguimiento y ventas de muebles tubulares en Querétaro.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#e8b763",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
