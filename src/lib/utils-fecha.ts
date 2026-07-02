import { format, isToday, isYesterday, differenceInCalendarDays, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";

/** "Hoy 3:40 pm", "Ayer 10:00 am", "Lun 9 jun", "9 jun 2025" */
export function formatoHumano(fecha: Date | string): string {
  const f = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (isToday(f)) return `Hoy ${format(f, "h:mm a", { locale: es })}`;
  if (isYesterday(f)) return `Ayer ${format(f, "h:mm a", { locale: es })}`;
  const dias = differenceInCalendarDays(new Date(), f);
  if (dias > 0 && dias < 7) return format(f, "EEE d MMM", { locale: es });
  return format(f, "d MMM yyyy", { locale: es });
}

/** "hace 3 días", "hace 2 horas", "hace 5 min" */
export function formatoRelativo(fecha: Date | string): string {
  const f = typeof fecha === "string" ? new Date(fecha) : fecha;
  const minutos = differenceInMinutes(new Date(), f);
  if (minutos < 1) return "justo ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
}

export function diasDeAtraso(fecha: Date | string | null | undefined): number {
  if (!fecha) return 0;
  const f = typeof fecha === "string" ? new Date(fecha) : fecha;
  const dias = differenceInCalendarDays(new Date(), f);
  return dias > 0 ? dias : 0;
}

export function estaVencida(fecha: Date | string | null | undefined): boolean {
  if (!fecha) return false;
  const f = typeof fecha === "string" ? new Date(fecha) : fecha;
  return f.getTime() < Date.now();
}

export function formatoFechaCorta(fecha: Date | string): string {
  const f = typeof fecha === "string" ? new Date(fecha) : fecha;
  return format(f, "d MMM yyyy", { locale: es });
}

export function formatoHora(fecha: Date | string): string {
  const f = typeof fecha === "string" ? new Date(fecha) : fecha;
  return format(f, "h:mm a", { locale: es });
}

/** Offset en minutos entre UTC y `timeZone` en el instante `fecha` (ej. -360 para America/Mexico_City). */
export function offsetMinutos(fecha: Date, timeZone: string): number {
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

/** Instante real (UTC) que corresponde a `hora:minuto` del día calendario `year-month-day`, contado en `timeZone`. */
export function instanteEnZona(year: number, month: number, day: number, hora: number, minuto: number, timeZone: string): Date {
  const comoSiFueraUtc = Date.UTC(year, month - 1, day, hora, minuto, 0);
  const offset = offsetMinutos(new Date(comoSiFueraUtc), timeZone);
  return new Date(comoSiFueraUtc - offset * 60000);
}

/** Instante real (UTC) que corresponde a `hora:minuto` del mismo día calendario de `fechaRef`, contado en `timeZone`. */
export function horaEnZona(fechaRef: Date, hora: number, minuto: number, timeZone: string): Date {
  const { year, month, day } = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(fechaRef)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, Number(p.value)])
  ) as unknown as { year: number; month: number; day: number };

  return instanteEnZona(year, month, day, hora, minuto, timeZone);
}

/** Días de la semana en que "todo hogar" atiende citas: miércoles a sábado (0=domingo). */
const DIAS_DISPONIBLES_AGENDA = [3, 4, 5, 6];

/** Próximos `cantidad` días que caen en un día disponible para agendar. */
export function proximosDiasHabiles(cantidad: number, diasAdelante = 30): Date[] {
  const dias: Date[] = [];
  for (let i = 0; dias.length < cantidad && i < diasAdelante; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (DIAS_DISPONIBLES_AGENDA.includes(d.getDay())) dias.push(d);
  }
  return dias;
}
