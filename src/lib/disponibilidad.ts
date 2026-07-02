import { prisma } from "@/lib/prisma";

/** Offset en minutos entre UTC y `timeZone` en el instante `fecha` (ej. -360 para America/Mexico_City). */
function offsetMinutos(fecha: Date, timeZone: string): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(fecha);
  const obj = Object.fromEntries(partes.filter((p) => p.type !== "literal").map((p) => [p.type, Number(p.value)]));
  const comoUtc = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second);
  return Math.round((comoUtc - fecha.getTime()) / 60000);
}

/** Instante real (UTC) que corresponde a `hora:minuto` del mismo día calendario de `fechaRef`, contado en `timeZone`. */
function horaEnZona(fechaRef: Date, hora: number, minuto: number, timeZone: string): Date {
  const { year, month, day } = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(fechaRef)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)])
  ) as unknown as { year: number; month: number; day: number };

  const comoSiFueraUtc = Date.UTC(year, month - 1, day, hora, minuto, 0);
  const offset = offsetMinutos(new Date(comoSiFueraUtc), timeZone);
  return new Date(comoSiFueraUtc - offset * 60000);
}

/** Genera los horarios disponibles de un vendedor en un día, respetando el horario del negocio y sin chocar con citas ya tomadas. */
export async function horariosDisponibles(params: {
  vendedorId: string;
  fecha: Date; // cualquier hora de ese día, en el huso del negocio
  horarioInicio: string; // "15:00"
  horarioFin: string; // "20:00"
  duracionMin: number;
  husoHorario?: string; // IANA, ej. "America/Mexico_City"
}) {
  const { vendedorId, fecha, horarioInicio, horarioFin, duracionMin, husoHorario = "America/Mexico_City" } = params;

  const [hIni, mIni] = horarioInicio.split(":").map(Number);
  const [hFin, mFin] = horarioFin.split(":").map(Number);

  const cursorInicio = horaEnZona(fecha, hIni, mIni, husoHorario);
  const limite = horaEnZona(fecha, hFin, mFin, husoHorario);

  const inicioDia = horaEnZona(fecha, 0, 0, husoHorario);
  const finDia = new Date(inicioDia.getTime() + 24 * 60 * 60000);

  const citasDelDia = await prisma.cita.findMany({
    where: {
      vendedorId,
      eliminadoEn: null,
      estado: { not: "cancelada" },
      fecha: { gte: inicioDia, lt: finDia },
    },
    select: { fecha: true, duracionMin: true },
  });

  const ahora = new Date();
  const slots: { hora: string; fechaISO: string; disponible: boolean }[] = [];

  const cursor = new Date(cursorInicio);
  while (cursor < limite) {
    const finSlot = new Date(cursor.getTime() + duracionMin * 60000);
    const chocaConCita = citasDelDia.some((c) => {
      const inicioCita = new Date(c.fecha);
      const finCita = new Date(inicioCita.getTime() + c.duracionMin * 60000);
      return cursor < finCita && finSlot > inicioCita;
    });
    const yaPaso = cursor < ahora;

    slots.push({
      hora: cursor.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", timeZone: husoHorario }),
      fechaISO: cursor.toISOString(),
      disponible: !chocaConCita && !yaPaso,
    });
    cursor.setTime(cursor.getTime() + duracionMin * 60000);
  }

  return slots;
}
