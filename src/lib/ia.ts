// Asistente de IA del CRM. Usa la API de Anthropic (Claude) cuando hay llave
// configurada; si no, o si la llamada falla, cae a plantillas locales para
// que estas 5 funciones NUNCA rompan la pantalla del vendedor.

// Modelo económico y rápido para texto corto (redactar, clasificar, resumir).
// Cambialo aquí si algún día quieres uno más potente.
const MODELO_IA = "claude-haiku-4-5";

export type AccionIA = "redactar" | "temperatura" | "proxima_accion" | "resumen" | "objecion";

export type ContextoCliente = {
  nombre: string;
  etapa: string;
  temperatura: string;
  objecionPrincipal: string | null;
  valorEstimado: number;
  notas: string | null;
  ultimoContactoTexto: string;
  mensajeTipo: string;
  eventosRecientes: string[];
};

function iaDisponible() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

async function llamarClaude(system: string, prompt: string): Promise<string | null> {
  if (!iaDisponible()) return null;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const respuesta = await client.messages.create({
      model: MODELO_IA,
      max_tokens: 400,
      system,
      messages: [{ role: "user", content: prompt }],
    });
    const bloque = respuesta.content.find((b) => b.type === "text");
    return bloque && bloque.type === "text" ? bloque.text.trim() : null;
  } catch (error) {
    console.error("El asistente de IA falló, cayendo a plantilla local:", error);
    return null;
  }
}

const SYSTEM_BASE =
  "Eres el copiloto de ventas de 'todo hogar', negocio de muebles tubulares y artículos para el hogar en Querétaro. " +
  "Ayudas a un vendedor a cerrar más ventas. Responde en español, tono cálido y directo, sin rodeos, listo para usarse tal cual.";

// ---------- Plantillas locales (fallback, siempre funcionan) ----------

function plantillaRedactar(c: ContextoCliente) {
  const base = c.mensajeTipo || "Hola {nombre}, soy de todo hogar, ¿seguimos platicando de tu proyecto?";
  let texto = base.replaceAll("{nombre}", c.nombre.split(" ")[0]);
  if (c.objecionPrincipal === "Está caro") {
    texto += ` Recuerda que nuestros muebles tienen garantía directa post-venta y podemos verlo en cómodos pagos.`;
  } else if (c.objecionPrincipal === "Lo voy a pensar") {
    texto += ` Sin presión, solo quería saber si te quedó alguna duda que te pueda resolver.`;
  }
  return texto;
}

function plantillaTemperatura(c: ContextoCliente) {
  if (c.ultimoContactoTexto.includes("hace 0") || c.ultimoContactoTexto.includes("Hoy")) {
    return { temperatura: "CALIENTE", razon: "Tuvo contacto reciente y sigue en conversación activa." };
  }
  if (c.valorEstimado >= 15000) {
    return { temperatura: "CALIENTE", razon: "Es un proyecto de alto valor, vale la pena priorizarlo." };
  }
  if (c.objecionPrincipal) {
    return { temperatura: "TIBIO", razon: `Tiene una objeción (${c.objecionPrincipal}) que aún no se resuelve.` };
  }
  return { temperatura: "FRIO", razon: "No hay señales recientes de interés activo." };
}

function plantillaProximaAccion(c: ContextoCliente) {
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const fecha = manana.toISOString().slice(0, 10);
  if (c.objecionPrincipal === "Está caro") return { accion: "Llamar para ofrecer plan de pagos a meses", fecha };
  if (c.objecionPrincipal === "Lo voy a pensar") return { accion: "Enviar WhatsApp de seguimiento suave", fecha };
  if (c.etapa === "Propuesta enviada") return { accion: "Llamar para cerrar la propuesta", fecha };
  return { accion: "Contactar para confirmar interés", fecha };
}

function plantillaResumen(c: ContextoCliente) {
  const partes = [
    `${c.nombre} está en la etapa "${c.etapa}", temperatura ${c.temperatura}.`,
    c.objecionPrincipal ? `Su objeción principal es: ${c.objecionPrincipal}.` : "No tiene objeción registrada.",
    `Valor estimado: $${c.valorEstimado.toLocaleString("es-MX")}.`,
    c.eventosRecientes.length > 0 ? `Últimos eventos: ${c.eventosRecientes.slice(0, 3).join("; ")}.` : "Sin historial reciente.",
    c.notas ? `Notas: ${c.notas}` : "",
  ];
  return partes.filter(Boolean).join(" ");
}

function plantillaObjecion(c: ContextoCliente) {
  const respuestas: Record<string, string> = {
    "Está caro":
      "Entiendo, pero nuestros muebles son de mayor calidad y con garantía directa, así que a la larga sales ganando. Te puedo armar un plan de pagos cómodo.",
    "Lo voy a pensar":
      "Claro, tómate tu tiempo. Te aparto el precio de hoy por unos días para que no te quedes sin la opción que te gustó.",
    "Tengo que consultarlo con mi pareja/socio":
      "Perfecto, coméntalo con calma. ¿Te ayudo armando una propuesta clara para que se la muestres?",
    "No es buen momento":
      "Entiendo. ¿Te parece si te marco en un par de semanas para ver cómo va todo?",
  };
  const respuesta = respuestas[c.objecionPrincipal ?? ""] ?? "Pregúntale abiertamente qué le preocupa y ofrécele resolverlo punto por punto.";
  return { respuesta, siguientePaso: "Registrar su respuesta y ajustar la próxima acción según lo que diga." };
}

// ---------- Función principal ----------

export async function ejecutarAccionIA(accion: AccionIA, contexto: ContextoCliente) {
  const datosContexto = `Cliente: ${contexto.nombre}. Etapa: ${contexto.etapa}. Temperatura: ${contexto.temperatura}. ` +
    `Objeción: ${contexto.objecionPrincipal ?? "ninguna"}. Valor estimado: $${contexto.valorEstimado}. ` +
    `Último contacto: ${contexto.ultimoContactoTexto}. Notas: ${contexto.notas ?? "sin notas"}. ` +
    `Eventos recientes: ${contexto.eventosRecientes.join("; ") || "sin eventos"}.`;

  if (accion === "redactar") {
    const prompt = `${datosContexto}\n\nRedacta un mensaje corto de WhatsApp (máximo 3 líneas) para mover a este cliente a la siguiente etapa. Usa el mensaje tipo del negocio como base: "${contexto.mensajeTipo}". Responde SOLO con el mensaje, sin comillas ni explicación.`;
    const respuesta = await llamarClaude(SYSTEM_BASE, prompt);
    return { texto: respuesta ?? plantillaRedactar(contexto), local: !respuesta };
  }

  if (accion === "temperatura") {
    const prompt = `${datosContexto}\n\nClasifica la temperatura de este cliente como CALIENTE, TIBIO o FRIO y da una frase corta de porqué. Responde en formato: "TEMPERATURA: [valor] — [frase]".`;
    const respuesta = await llamarClaude(SYSTEM_BASE, prompt);
    if (respuesta) return { texto: respuesta, local: false };
    const p = plantillaTemperatura(contexto);
    return { texto: `${p.temperatura} — ${p.razon}`, local: true };
  }

  if (accion === "proxima_accion") {
    const prompt = `${datosContexto}\n\nSugiere UNA próxima acción concreta y una fecha (formato YYYY-MM-DD, entre hoy y 5 días). Responde en formato: "ACCION: [texto] — FECHA: [YYYY-MM-DD]".`;
    const respuesta = await llamarClaude(SYSTEM_BASE, prompt);
    if (respuesta) return { texto: respuesta, local: false };
    const p = plantillaProximaAccion(contexto);
    return { texto: `${p.accion} (sugerido para ${p.fecha})`, local: true, accionSugerida: p.accion, fechaSugerida: p.fecha };
  }

  if (accion === "resumen") {
    const prompt = `${datosContexto}\n\nResume este expediente en 3 a 5 líneas para que el vendedor sepa exactamente dónde va con este cliente.`;
    const respuesta = await llamarClaude(SYSTEM_BASE, prompt);
    return { texto: respuesta ?? plantillaResumen(contexto), local: !respuesta };
  }

  // objecion
  const prompt = `${datosContexto}\n\nEl cliente puso como objeción: "${contexto.objecionPrincipal ?? "no especificada"}". Sugiere una respuesta concreta (2-3 líneas) y el siguiente paso.`;
  const respuesta = await llamarClaude(SYSTEM_BASE, prompt);
  if (respuesta) return { texto: respuesta, local: false };
  const p = plantillaObjecion(contexto);
  return { texto: `${p.respuesta}\n\nSiguiente paso: ${p.siguientePaso}`, local: true };
}
