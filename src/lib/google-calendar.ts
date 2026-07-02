// Integración opcional con Google Calendar + Meet. Si las variables de
// entorno no están configuradas (o Google falla), todo el CRM sigue
// funcionando: la cita se guarda igual en la base y solo se omite el
// evento/Meet automático (degradación elegante, función 2 del proyecto).

export function googleCalendarDisponible() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN
  );
}

type ParametrosEvento = {
  resumen: string;
  descripcion: string;
  inicio: Date;
  fin: Date;
  invitados: { email: string }[];
};

export async function crearEventoConMeet(params: ParametrosEvento): Promise<{ eventId: string; meetLink: string | null } | null> {
  if (!googleCalendarDisponible()) return null;

  try {
    const { google } = await import("googleapis");
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const calendar = google.calendar({ version: "v3", auth });

    const respuesta = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: params.resumen,
        description: params.descripcion,
        start: { dateTime: params.inicio.toISOString() },
        end: { dateTime: params.fin.toISOString() },
        attendees: params.invitados,
        conferenceData: {
          createRequest: { requestId: `todohogar-${Date.now()}`, conferenceSolutionKey: { type: "hangoutsMeet" } },
        },
      },
    });

    return {
      eventId: respuesta.data.id ?? "",
      meetLink: respuesta.data.hangoutLink ?? null,
    };
  } catch (error) {
    console.error("No se pudo crear el evento en Google Calendar (la cita se guardó igual):", error);
    return null;
  }
}

export async function eliminarEventoGoogle(eventId: string | null) {
  if (!eventId || !googleCalendarDisponible()) return;
  try {
    const { google } = await import("googleapis");
    const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (error) {
    console.error("No se pudo borrar el evento de Google Calendar:", error);
  }
}
