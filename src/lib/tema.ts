export type Tema = "claro" | "oscuro" | "automatico";

export const TEMAS: { valor: Tema; etiqueta: string; icono: "Sun" | "Moon" | "Monitor" }[] = [
  { valor: "claro", etiqueta: "Claro", icono: "Sun" },
  { valor: "oscuro", etiqueta: "Oscuro", icono: "Moon" },
  { valor: "automatico", etiqueta: "Automático", icono: "Monitor" },
];

/**
 * Script que se inyecta antes de pintar la página (strategy="beforeInteractive")
 * para resolver el tema "automatico" al del sistema operativo sin parpadeo,
 * y para mantenerlo sincronizado si el usuario cambia el tema de su SO en vivo.
 */
export const SCRIPT_RESOLVER_TEMA = `
(function () {
  try {
    var raiz = document.documentElement;
    var pref = raiz.getAttribute('data-tema-pref') || 'automatico';
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    function aplicar() {
      if (pref === 'automatico') {
        raiz.setAttribute('data-tema', mq.matches ? 'oscuro' : 'claro');
      } else {
        raiz.setAttribute('data-tema', pref);
      }
    }
    aplicar();
    mq.addEventListener('change', aplicar);
  } catch (e) {}
})();
`;
