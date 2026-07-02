"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Atajos de teclado globales: N (nuevo), G luego H (Hoy te toca), ? (ayuda). */
export function AtajosGlobales() {
  const router = useRouter();
  const esperandoG = useRef(false);

  useEffect(() => {
    function alTeclado(e: KeyboardEvent) {
      const escribiendoEnCampo =
        e.target instanceof HTMLElement &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || e.target.isContentEditable);
      if (escribiendoEnCampo || e.metaKey || e.ctrlKey || e.altKey) return;

      if (esperandoG.current) {
        esperandoG.current = false;
        if (e.key.toLowerCase() === "h") {
          e.preventDefault();
          router.push("/seguimiento");
        }
        return;
      }

      if (e.key.toLowerCase() === "g") {
        esperandoG.current = true;
        setTimeout(() => (esperandoG.current = false), 1200);
        return;
      }

      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        router.push("/clientes/nuevo");
      }

      if (e.key === "?") {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("abrir-ayuda"));
      }
    }

    document.addEventListener("keydown", alTeclado);
    return () => document.removeEventListener("keydown", alTeclado);
  }, [router]);

  return null;
}
