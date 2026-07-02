// Script de datos de ejemplo. Se ejecuta con `npx prisma db seed`.
// SOLO siembra si la base está vacía (o si se pasa FORCE_SEED=1), para
// nunca pisar datos reales de un negocio que ya está usando el CRM.
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const HOY = new Date();

function diasDesdeHoy(dias: number, hora = 18, minutos = 0) {
  const f = new Date(HOY);
  f.setDate(f.getDate() + dias);
  f.setHours(hora, minutos, 0, 0);
  return f;
}

function mesesAtras(meses: number, dia = 15) {
  const f = new Date(HOY);
  f.setMonth(f.getMonth() - meses);
  f.setDate(dia);
  f.setHours(12, 0, 0, 0);
  return f;
}

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  const yaHayDatos = (await prisma.usuario.count()) > 0;
  if (yaHayDatos && process.env.FORCE_SEED !== "1") {
    console.log(
      "⚠️  Ya hay datos en la base de datos. No se va a sembrar nada para no pisar información real."
    );
    console.log(
      "   Si de verdad quieres reemplazar todo con datos de ejemplo, corre: FORCE_SEED=1 npx prisma db seed"
    );
    return;
  }

  console.log("Sembrando datos de ejemplo de 'todo hogar'...");

  // Limpieza solo si es una re-siembra forzada
  if (yaHayDatos) {
    await prisma.$transaction([
      prisma.registroAuditoria.deleteMany(),
      prisma.vistaGuardada.deleteMany(),
      prisma.mencion.deleteMany(),
      prisma.recordatorio.deleteMany(),
      prisma.eventoTimeline.deleteMany(),
      prisma.archivo.deleteMany(),
      prisma.pago.deleteMany(),
      prisma.cita.deleteMany(),
      prisma.clienteEtiqueta.deleteMany(),
      prisma.favorito.deleteMany(),
      prisma.cliente.deleteMany(),
      prisma.etiqueta.deleteMany(),
      prisma.plantilla.deleteMany(),
      prisma.usuario.deleteMany(),
      prisma.configuracionNegocio.deleteMany(),
    ]);
  }

  // ---------- Configuración del negocio ----------
  const datosConfiguracion = {
    nombreNegocio: "todo hogar",
    colorMarca: "#e8b763",
    moneda: "MXN",
    husoHorario: "America/Mexico_City",
    horarioInicio: "15:00",
    horarioFin: "20:00",
    duracionCitaMin: 15,
    mensajeWhatsappTipo:
      "hola,......., soy, Santi o alejo como me conozcas, de todo hogar. pase a saludarte y preguntar como te ha ido. si en algún memento quieres renovar algún espacio de tu casa, colchones, alacenas, cajoneras, etc , aquí estoy para apoyarte, sin compromiso. y si conoces a alguien que también ande buscando muebles, con gusto le platico. cualquier cosa, aquí ando.",
    metaMensualClientes: 20,
    umbralEstancamientoDias: 7,
  };
  await prisma.configuracionNegocio.upsert({
    where: { id: "default" },
    create: { id: "default", ...datosConfiguracion },
    update: datosConfiguracion,
  });

  // ---------- Usuarios ----------
  const admin = await prisma.usuario.create({
    data: {
      nombre: "Alejo",
      correo: "alejogarciasanchez17@gmail.com",
      passwordHash: await hash("TodoHogar2026!"),
      rol: "ADMIN",
      metaMensual: 20,
      slugAgenda: "alejo",
      onboardingCompletado: false,
    },
  });

  const santi = await prisma.usuario.create({
    data: {
      nombre: "Santi",
      correo: "santi@todohogar.mx",
      passwordHash: await hash("Vendedor2026!"),
      rol: "VENDEDOR",
      metaMensual: 12,
      comisionPct: 5,
      slugAgenda: "santi",
      onboardingCompletado: false,
    },
  });

  const maria = await prisma.usuario.create({
    data: {
      nombre: "María",
      correo: "maria@todohogar.mx",
      passwordHash: await hash("Vendedor2026!"),
      rol: "VENDEDOR",
      metaMensual: 10,
      comisionPct: 5,
      slugAgenda: "maria",
      onboardingCompletado: true,
    },
  });

  // ---------- Etiquetas ----------
  const [etqVip, etqReferido, etqAnticipo] = await Promise.all([
    prisma.etiqueta.create({ data: { nombre: "VIP", color: "#e8b763" } }),
    prisma.etiqueta.create({ data: { nombre: "Referido", color: "#22c55e" } }),
    prisma.etiqueta.create({ data: { nombre: "Pagó anticipo", color: "#0ea5e9" } }),
  ]);

  // ---------- Clientes de muestra (variados) ----------
  type ClienteSeed = Parameters<typeof prisma.cliente.create>[0]["data"];

  const clientesData: (ClienteSeed & { _etiquetas?: string[] })[] = [
    {
      nombre: "Ana Torres",
      telefono: "442 123 4567",
      telefonoIntl: "524421234567",
      correo: "ana.torres@example.com",
      origen: "Landing",
      canalUTM: "instagram",
      etapa: "Nuevo",
      estadoCartera: "ACTIVO",
      valorEstimado: 8500,
      temperatura: "CALIENTE",
      objecionPrincipal: "Está caro",
      notas: "Preguntó por recámara completa tubular, quiere comparar precios.",
      proximaAccion: "Llamarle para presentar opciones de pago",
      proximaAccionFecha: diasDesdeHoy(-1),
      zona: "Juriquilla, Querétaro",
      vendedorId: admin.id,
      _etiquetas: [],
    },
    {
      nombre: "Roberto Medina",
      telefono: "442 234 5678",
      telefonoIntl: "524422345678",
      correo: "roberto.medina@example.com",
      origen: "Instagram",
      canalUTM: "instagram",
      etapa: "Contactado",
      estadoCartera: "ACTIVO",
      valorEstimado: 6200,
      temperatura: "TIBIO",
      objecionPrincipal: "Lo voy a pensar",
      notas: "Ya vio catálogo de alacenas, dijo que lo piensa hasta fin de mes.",
      proximaAccion: "Enviar WhatsApp de seguimiento",
      proximaAccionFecha: diasDesdeHoy(0),
      zona: "Centro, Querétaro",
      vendedorId: santi.id,
    },
    {
      nombre: "Lucía Hernández",
      telefono: "442 345 6789",
      telefonoIntl: "524423456789",
      correo: "lucia.hernandez@example.com",
      origen: "Facebook",
      canalUTM: "facebook",
      etapa: "Cita agendada",
      estadoCartera: "ACTIVO",
      valorEstimado: 15000,
      temperatura: "CALIENTE",
      objecionPrincipal: "Tengo que consultarlo con mi pareja/socio",
      notas: "Quiere amueblar casa nueva completa, viene con su esposo a la cita.",
      proximaAccion: "Confirmar cita por WhatsApp un día antes",
      proximaAccionFecha: diasDesdeHoy(2),
      zona: "El Refugio, Querétaro",
      vendedorId: admin.id,
      _etiquetas: ["VIP"],
    },
    {
      nombre: "Jorge Ramírez",
      telefono: "442 456 7890",
      telefonoIntl: "524424567890",
      correo: "jorge.ramirez@empresaram.mx",
      origen: "Recomendado",
      etapa: "Propuesta enviada",
      estadoCartera: "ACTIVO",
      valorEstimado: 22000,
      temperatura: "CALIENTE",
      objecionPrincipal: "Está caro",
      notas: "Necesita amueblar oficinas de su empresa, pidió cotización formal.",
      proximaAccion: "Llamar para cerrar la propuesta",
      proximaAccionFecha: diasDesdeHoy(-2),
      zona: "Querétaro",
      empresaNombre: "Ramírez Consultores",
      empresaGiro: "Servicios profesionales",
      empresaPuesto: "Director general",
      empresaSitioWeb: "ramirezconsultores.mx",
      vendedorId: santi.id,
      _etiquetas: ["Referido"],
    },
    {
      nombre: "Fernanda Castillo",
      telefono: "442 567 8901",
      telefonoIntl: "524425678901",
      correo: "fernanda.castillo@example.com",
      origen: "Agenda Santi",
      etapa: "Cliente activo",
      estadoCartera: "ACTIVO",
      valorEstimado: 9800,
      temperatura: "TIBIO",
      objecionPrincipal: "No es buen momento",
      notas: "Compró comedor, está viendo si renueva la sala también.",
      proximaAccion: "Marcar en 2 semanas para ofrecer la sala",
      proximaAccionFecha: diasDesdeHoy(5),
      zona: "Milenio III, Querétaro",
      ultimaCompra: mesesAtras(1, 10),
      vendedorId: santi.id,
    },
    {
      nombre: "Diego Salinas",
      telefono: "442 678 9012",
      telefonoIntl: "524426789012",
      correo: "diego.salinas@example.com",
      origen: "Landing",
      canalUTM: "whatsapp",
      etapa: "Cliente de pagares",
      estadoCartera: "ACTIVO",
      valorEstimado: 12000,
      temperatura: "CALIENTE",
      objecionPrincipal: "Está caro",
      notas: "Compró recámara y cajonera, está pagando en abonos quincenales.",
      proximaAccion: "Recordar siguiente abono",
      proximaAccionFecha: diasDesdeHoy(3),
      zona: "Corregidora, Querétaro",
      vendedorId: admin.id,
      _etiquetas: ["Pagó anticipo"],
    },
    {
      nombre: "Patricia Núñez",
      telefono: "442 789 0123",
      telefonoIntl: "524427890123",
      correo: "patricia.nunez@example.com",
      origen: "Instagram",
      canalUTM: "instagram",
      etapa: "Cliente ganado",
      estadoCartera: "GANADO",
      valorEstimado: 10500,
      temperatura: "CALIENTE",
      notas: "Cerró la venta de su alacena y cajonera de cocina completa.",
      zona: "Álamos, Querétaro",
      ultimaCompra: mesesAtras(0, 20),
      vendedorId: maria.id,
      _etiquetas: ["VIP"],
    },
    {
      nombre: "Miguel Ángel Soto",
      telefono: "442 890 1234",
      telefonoIntl: "524428901234",
      correo: "miguel.soto@example.com",
      origen: "Facebook",
      canalUTM: "facebook",
      etapa: "Perdido",
      estadoCartera: "PERDIDO",
      valorEstimado: 7000,
      temperatura: "FRIO",
      motivoPerdida: "Está caro",
      notas: "Encontró opción más barata (aunque de menor calidad) con la competencia.",
      zona: "San Juan del Río",
      vendedorId: santi.id,
    },
    {
      nombre: "Carmen Ruiz",
      telefono: "442 901 2345",
      telefonoIntl: "524429012345",
      correo: "carmen.ruiz@example.com",
      origen: "Recomendado",
      etapa: "Nuevo",
      estadoCartera: "ARCHIVADO",
      valorEstimado: 5000,
      temperatura: "FRIO",
      notas: "Cliente antiguo, ya no está activo en la zona.",
      zona: "Querétaro",
      vendedorId: admin.id,
    },
    {
      nombre: "Valeria Ponce",
      telefono: "442 012 3456",
      telefonoIntl: "524420123456",
      correo: "valeria.ponce@example.com",
      origen: "Landing",
      canalUTM: "volante",
      etapa: "Nuevo",
      estadoCartera: "ACTIVO",
      valorEstimado: 4500,
      temperatura: "FRIO",
      objecionPrincipal: "No es buen momento",
      notas: "Dejó sus datos en la landing, aún no se le contacta.",
      proximaAccion: "Primer contacto por WhatsApp",
      proximaAccionFecha: diasDesdeHoy(-3),
      zona: "Querétaro",
      vendedorId: maria.id,
    },
    {
      nombre: "Héctor Villanueva",
      telefono: "442 111 2233",
      telefonoIntl: "524421112233",
      correo: "hector.villanueva@example.com",
      origen: "Facebook",
      canalUTM: "facebook",
      etapa: "Contactado",
      estadoCartera: "ACTIVO",
      valorEstimado: 6800,
      temperatura: "TIBIO",
      objecionPrincipal: "Lo voy a pensar",
      notas: "Interesado en literas tubulares para sus hijos.",
      proximaAccion: "Enviar catálogo de literas",
      proximaAccionFecha: diasDesdeHoy(1),
      zona: "Querétaro",
      vendedorId: maria.id,
    },
    {
      nombre: "Rosa Elena Delgado",
      telefono: "442 222 3344",
      telefonoIntl: "524422223344",
      correo: "rosa.delgado@example.com",
      origen: "Agenda Maria",
      etapa: "Propuesta enviada",
      estadoCartera: "ACTIVO",
      valorEstimado: 13500,
      temperatura: "CALIENTE",
      objecionPrincipal: "Tengo que consultarlo con mi pareja/socio",
      notas: "Le interesa amueblar toda la casa, está esperando el visto bueno de su esposo.",
      proximaAccion: "Llamar para saber la decisión",
      proximaAccionFecha: diasDesdeHoy(-1),
      zona: "Querétaro",
      vendedorId: maria.id,
    },
  ];

  const clientesCreados: Record<string, Awaited<ReturnType<typeof prisma.cliente.create>>> = {};

  for (const { _etiquetas, ...data } of clientesData) {
    const cliente = await prisma.cliente.create({ data });
    clientesCreados[cliente.nombre] = cliente;

    if (_etiquetas?.length) {
      const mapa: Record<string, string> = {
        VIP: etqVip.id,
        Referido: etqReferido.id,
        "Pagó anticipo": etqAnticipo.id,
      };
      for (const nombreEtq of _etiquetas) {
        await prisma.clienteEtiqueta.create({
          data: { clienteId: cliente.id, etiquetaId: mapa[nombreEtq] },
        });
      }
    }

    await prisma.eventoTimeline.create({
      data: {
        clienteId: cliente.id,
        tipo: "nota",
        descripcion: `Cliente creado desde ${cliente.origen ?? "el CRM"}.`,
        autorId: cliente.vendedorId,
        fecha: cliente.creadoEn,
      },
    });
  }

  // ---------- Citas ----------
  await prisma.cita.create({
    data: {
      clienteId: clientesCreados["Lucía Hernández"].id,
      vendedorId: admin.id,
      fecha: diasDesdeHoy(2, 17, 0),
      duracionMin: 15,
      estado: "confirmada",
      notas: "Mostrar catálogo completo de recámaras y comedores.",
    },
  });

  await prisma.cita.create({
    data: {
      clienteId: clientesCreados["Fernanda Castillo"].id,
      vendedorId: santi.id,
      fecha: diasDesdeHoy(-10, 16, 0),
      duracionMin: 15,
      estado: "realizada",
      notas: "Cita pasada donde se cerró la venta del comedor.",
    },
  });

  await prisma.cita.create({
    data: {
      clienteId: clientesCreados["Héctor Villanueva"].id,
      vendedorId: maria.id,
      fecha: diasDesdeHoy(4, 18, 30),
      duracionMin: 15,
      estado: "confirmada",
    },
  });

  await prisma.cita.create({
    data: {
      clienteId: clientesCreados["Roberto Medina"].id,
      vendedorId: santi.id,
      fecha: diasDesdeHoy(-20, 19, 0),
      duracionMin: 15,
      estado: "realizada",
    },
  });

  // ---------- Pagos ----------
  let folio = 1;
  await prisma.pago.create({
    data: {
      clienteId: clientesCreados["Diego Salinas"].id,
      monto: 4000,
      metodo: "Efectivo",
      estatus: "pagado",
      fechaPago: diasDesdeHoy(-15),
      folio: folio++,
      concepto: "Anticipo recámara + cajonera",
      registradoPorId: admin.id,
    },
  });
  await prisma.pago.create({
    data: {
      clienteId: clientesCreados["Diego Salinas"].id,
      monto: 4000,
      metodo: "Transferencia",
      estatus: "pagado",
      fechaPago: diasDesdeHoy(-1),
      folio: folio++,
      concepto: "Segundo abono",
      registradoPorId: admin.id,
    },
  });
  await prisma.pago.create({
    data: {
      clienteId: clientesCreados["Diego Salinas"].id,
      monto: 4000,
      metodo: "Depósito / anticipo",
      estatus: "pendiente",
      fechaVencimiento: diasDesdeHoy(7),
      folio: folio++,
      concepto: "Último abono",
      registradoPorId: admin.id,
    },
  });

  await prisma.pago.create({
    data: {
      clienteId: clientesCreados["Patricia Núñez"].id,
      monto: 10500,
      metodo: "Transferencia",
      estatus: "pagado",
      fechaPago: mesesAtras(0, 20),
      folio: folio++,
      concepto: "Pago completo alacena y cajonera",
      registradoPorId: maria.id,
    },
  });

  await prisma.pago.create({
    data: {
      clienteId: clientesCreados["Jorge Ramírez"].id,
      monto: 5000,
      metodo: "Transferencia",
      estatus: "vencido",
      fechaVencimiento: diasDesdeHoy(-5),
      folio: folio++,
      concepto: "Anticipo mobiliario de oficina",
      registradoPorId: santi.id,
    },
  });

  await prisma.pago.create({
    data: {
      clienteId: clientesCreados["Fernanda Castillo"].id,
      monto: 9800,
      metodo: "Efectivo",
      estatus: "pagado",
      fechaPago: mesesAtras(1, 10),
      folio: folio++,
      concepto: "Comedor completo",
      registradoPorId: santi.id,
    },
  });

  // ---------- Archivo de ejemplo (comprobante simulado) ----------
  const pngMinimo = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  );
  await prisma.archivo.create({
    data: {
      clienteId: clientesCreados["Diego Salinas"].id,
      nombreArchivo: "comprobante-anticipo.png",
      tipoMime: "image/png",
      tamanoBytes: pngMinimo.byteLength,
      etiqueta: "Comprobante",
      datos: pngMinimo,
      subidoPorId: admin.id,
    },
  });

  // ---------- Historial de 6 meses (para que la gráfica de crecimiento se vea viva) ----------
  const nombresHistoricos = [
    "Karla Espinoza", "Emilio Vargas", "Sofía Rangel", "Iván Barrera", "Daniela Cortés",
    "Raúl Mendoza", "Alejandra Ibarra", "Tomás Guerrero", "Paulina Reséndiz", "Óscar Lozano",
    "Verónica Aguilar", "Francisco León", "Gabriela Peña", "Marco Antonio Ríos", "Cynthia Morales",
    "Rodrigo Campos", "Itzel Sandoval", "Braulio Escobar",
  ];
  const vendedoresRR = [admin.id, santi.id, maria.id];

  for (let mes = 5; mes >= 0; mes--) {
    // Tendencia creciente: entre 2 y 5 clientes ganados por mes, más en meses recientes
    const cantidad = 2 + Math.round(((5 - mes) / 5) * 3);
    for (let i = 0; i < cantidad; i++) {
      const nombre = nombresHistoricos[(mes * 4 + i) % nombresHistoricos.length];
      const valor = 4000 + Math.round(Math.random() * 12000);
      const fechaCierre = mesesAtras(mes, 5 + i * 4);
      const vendedorId = vendedoresRR[(mes + i) % vendedoresRR.length];

      const clienteHist = await prisma.cliente.create({
        data: {
          nombre: `${nombre} ${mes}-${i}`,
          telefono: `442 5${mes}${i} 00${i}0`,
          origen: ["Instagram", "Facebook", "Recomendado", "Landing"][i % 4],
          canalUTM: ["instagram", "facebook", "whatsapp", null][i % 4] ?? undefined,
          etapa: "Cliente ganado",
          estadoCartera: "GANADO",
          valorEstimado: valor,
          temperatura: "CALIENTE",
          zona: "Querétaro",
          ultimaCompra: fechaCierre,
          vendedorId,
          creadoEn: fechaCierre,
        },
      });

      await prisma.pago.create({
        data: {
          clienteId: clienteHist.id,
          monto: valor,
          metodo: ["Transferencia", "Efectivo", "Depósito / anticipo"][i % 3],
          estatus: "pagado",
          fechaPago: fechaCierre,
          folio: folio++,
          concepto: "Venta de mobiliario",
          registradoPorId: vendedorId,
        },
      });
    }
  }

  // ---------- Plantillas del sistema ----------
  const plantillas: { nombre: string; canal: string; categoria: string; asunto?: string; cuerpo: string }[] = [
    {
      nombre: "Reactivar cliente frío",
      canal: "whatsapp",
      categoria: "reactivar_frio",
      cuerpo:
        "Hola {nombre}, soy {vendedor} de todo hogar 😊 Hace tiempo platicamos sobre renovar tu espacio con nosotros. Justo ahora tenemos opciones nuevas que te podrían interesar. ¿Seguimos platicando?",
    },
    {
      nombre: "Vencer objeción: está caro",
      canal: "whatsapp",
      categoria: "vencer_precio",
      cuerpo:
        "Entiendo perfecto, {nombre}. Nuestros muebles son de mayor calidad y con garantía directa post-venta, por eso duran mucho más que las opciones baratas que hay que reponer pronto. Puedo armarte un plan de pagos a tu medida, ¿te late que lo veamos?",
    },
    {
      nombre: "Responder: lo voy a pensar",
      canal: "whatsapp",
      categoria: "lo_voy_a_pensar",
      cuerpo:
        "Claro que sí, {nombre}, tómate tu tiempo. Para no dejarte sin la opción que te gustó, ¿te parece si te aparto el precio de hoy por unos días? Cualquier duda que te surja, aquí ando.",
    },
    {
      nombre: "Confirmar cita",
      canal: "whatsapp",
      categoria: "confirmar_cita",
      cuerpo:
        "Hola {nombre}, te confirmo tu cita con todo hogar. Te esperamos con gusto para mostrarte nuestras opciones. Cualquier cambio de horario, avísame por aquí.",
    },
    {
      nombre: "Recuperar pago vencido",
      canal: "whatsapp",
      categoria: "pago_vencido",
      cuerpo:
        "Hola {nombre}, te escribo porque tenemos pendiente un pago de tu pedido. ¿Podemos coordinar la fecha en la que lo puedes cubrir? Así seguimos avanzando con tu entrega sin contratiempos.",
    },
    {
      nombre: "Cerrar con urgencia",
      canal: "whatsapp",
      categoria: "urgencia",
      cuerpo:
        "{nombre}, te cuento que el precio especial que vimos aplica solo por esta semana. No quiero que se te pase la oportunidad, ¿lo dejamos apartado hoy mismo?",
    },
    {
      nombre: "Bajar precio sin regalar (MSI)",
      canal: "whatsapp",
      categoria: "bajar_precio",
      cuerpo:
        "{nombre}, si el monto de contado se siente pesado, te puedo armar un plan a meses o en parcialidades sin que pierdas la calidad ni la garantía. ¿Vemos juntos cuál te acomoda mejor?",
    },
    {
      nombre: "Pedir el sí final",
      canal: "whatsapp",
      categoria: "pedir_si",
      cuerpo:
        "{nombre}, creo que ya vimos todo lo que necesitabas saber. ¿Lo dejamos cerrado hoy para apartar tu pedido?",
    },
    {
      nombre: "Post-venta / bienvenida",
      canal: "whatsapp",
      categoria: "postventa",
      cuerpo:
        "¡Gracias por tu compra, {nombre}! Cualquier cosa que necesites de tus muebles nuevos, aquí estamos. Recuerda que tienes garantía directa con nosotros.",
    },
    {
      nombre: "Pedir referidos",
      canal: "whatsapp",
      categoria: "referidos",
      cuerpo:
        "{nombre}, qué gusto que te haya encantado tu mueble 😊 Si conoces a alguien que también ande buscando renovar su casa, con todo gusto le platico. ¡Gracias por confiar en todo hogar!",
    },
    {
      nombre: "Seguimiento por correo",
      canal: "correo",
      categoria: "reactivar_frio",
      asunto: "todo hogar — seguimos aquí para ti",
      cuerpo:
        "Hola {nombre},\n\nTe escribo de parte de todo hogar. Quedamos en la etapa de {etapa} y quisiera saber si tienes alguna duda sobre tu proyecto de {valor}.\n\nQuedo al pendiente,\n{vendedor}",
    },
  ];

  for (const p of plantillas) {
    await prisma.plantilla.create({ data: { ...p, usuarioId: null, favorita: false } });
  }

  // ---------- Recordatorios y menciones para la campanita ----------
  await prisma.recordatorio.create({
    data: {
      usuarioId: admin.id,
      clienteId: clientesCreados["Ana Torres"].id,
      texto: "Llamar a Ana Torres para presentar opciones de pago",
      fecha: diasDesdeHoy(-1, 10, 0),
      hecho: false,
    },
  });
  await prisma.recordatorio.create({
    data: {
      usuarioId: santi.id,
      clienteId: clientesCreados["Jorge Ramírez"].id,
      texto: "Cerrar propuesta con Jorge Ramírez",
      fecha: diasDesdeHoy(0, 12, 0),
      hecho: false,
    },
  });
  await prisma.mencion.create({
    data: {
      usuarioId: admin.id,
      texto: "Se te reasignó el cliente Valeria Ponce",
      entidad: "cliente",
      entidadId: clientesCreados["Valeria Ponce"].id,
      leido: false,
    },
  });

  // ---------- Bitácora de auditoría ----------
  await prisma.registroAuditoria.create({
    data: {
      usuarioId: admin.id,
      accion: "sembrado_inicial",
      entidadTipo: "sistema",
      detalle: JSON.stringify({ mensaje: "Datos de ejemplo cargados" }),
    },
  });

  console.log("✅ Datos de ejemplo listos.");
  console.log("");
  console.log("Usuario admin:  alejogarciasanchez17@gmail.com  /  TodoHogar2026!");
  console.log("Vendedor Santi: santi@todohogar.mx              /  Vendedor2026!");
  console.log("Vendedor María: maria@todohogar.mx               /  Vendedor2026!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
