import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Protección de rutas de primera línea (conveniencia de navegación). La
// autorización REAL y definitiva siempre se valida además dentro de cada
// Server Action / Route Handler con `puede()` (nunca confiar solo en esto).
export default auth((request) => {
  const { pathname } = request.nextUrl;
  const estaAutenticado = !!request.auth;
  const rol = request.auth?.user?.rol;

  const esRutaPublica =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/agenda/") ||
    pathname.startsWith("/api/");

  if (estaAutenticado && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }

  if (!estaAutenticado && !esRutaPublica) {
    const url = new URL("/login", request.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (estaAutenticado && pathname.startsWith("/admin") && rol !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    // Nunca interceptar archivos estáticos reales (imágenes, íconos, fuentes,
    // manifest, service worker, etc.), solo rutas de página/API.
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|json|woff2?)$).*)",
  ],
};
