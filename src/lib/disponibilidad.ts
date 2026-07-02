import { prisma } from "@/lib/prisma";

/** Genera los horarios disponibles de un vendedor en un día, respetando el horario del negocio y sin chocar con citas ya tomadas. */
export async function horariosDisponibles(params: {
  vendedorId: string;
  fecha: Date; // cualquier hora de ese día, en huso local del servidor
  horarioInicio: string; // "15:00"
  horarioFin: string; // "20:00"
  duracionMin: number;
}) {
  const { vendedorId, fecha, horarioInicio, horarioFin, duracionMin } = params;

  const inicioDia = new Date(fecha);
  inicioDia.setHours(0, 0, 0, 0);
  const finDia = new Date(inicioDia);
  finDia.setDate(finDia.getDate() + 1);

  const [hIni, mIni] = horarioInicio.split(":").map(Number);
  const [hFin, mFin] = horarioFin.split(":").map(Number);

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

  const cursor = new Date(inicioDia);
  cursor.setHours(hIni, mIni, 0, 0);
  const limite = new Date(inicioDia);
  limite.setHours(hFin, mFin, 0, 0);

  while (cursor < limite) {
    const finSlot = new Date(cursor.getTime() + duracionMin * 60000);
    const chocaConCita = citasDelDia.some((c) => {
      const inicioCita = new Date(c.fecha);
      const finCita = new Date(inicioCita.getTime() + c.duracionMin * 60000);
      return cursor < finCita && finSlot > inicioCita;
    });
    const yaPaso = cursor < ahora;

    slots.push({
      hora: cursor.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" }),
      fechaISO: cursor.toISOString(),
      disponible: !chocaConCita && !yaPaso,
    });
    cursor.setMinutes(cursor.getMinutes() + duracionMin);
  }

  return slots;
}
