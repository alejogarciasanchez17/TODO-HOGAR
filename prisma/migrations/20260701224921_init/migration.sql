-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'VENDEDOR',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "tema" TEXT NOT NULL DEFAULT 'automatico',
    "densidad" TEXT NOT NULL DEFAULT 'comoda',
    "onboardingCompletado" BOOLEAN NOT NULL DEFAULT false,
    "metaMensual" REAL NOT NULL DEFAULT 0,
    "comisionPct" REAL,
    "slugAgenda" TEXT,
    "agendaActiva" BOOLEAN NOT NULL DEFAULT true,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadoHasta" DATETIME,
    "eliminadoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "telefonoIntl" TEXT,
    "correo" TEXT,
    "origen" TEXT,
    "canalUTM" TEXT,
    "etapa" TEXT NOT NULL DEFAULT 'Nuevo',
    "estadoCartera" TEXT NOT NULL DEFAULT 'ACTIVO',
    "valorEstimado" REAL NOT NULL DEFAULT 0,
    "temperatura" TEXT NOT NULL DEFAULT 'TIBIO',
    "objecionPrincipal" TEXT,
    "notas" TEXT,
    "proximaAccion" TEXT,
    "proximaAccionFecha" DATETIME,
    "zona" TEXT,
    "ultimaCompra" DATETIME,
    "motivoPerdida" TEXT,
    "motivoPerdidaOtro" TEXT,
    "empresaNombre" TEXT,
    "empresaGiro" TEXT,
    "empresaPuesto" TEXT,
    "empresaRFC" TEXT,
    "empresaSitioWeb" TEXT,
    "empresaDireccion" TEXT,
    "empresaTamano" TEXT,
    "empresaNotas" TEXT,
    "etapaEntradaEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoContactoEn" DATETIME,
    "vendedorId" TEXT NOT NULL,
    "eliminadoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Cliente_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Etiqueta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#e8b763'
);

-- CreateTable
CREATE TABLE "ClienteEtiqueta" (
    "clienteId" TEXT NOT NULL,
    "etiquetaId" TEXT NOT NULL,

    PRIMARY KEY ("clienteId", "etiquetaId"),
    CONSTRAINT "ClienteEtiqueta_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClienteEtiqueta_etiquetaId_fkey" FOREIGN KEY ("etiquetaId") REFERENCES "Etiqueta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Favorito" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorito_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Archivo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "datos" BLOB,
    "url" TEXT,
    "subidoPorId" TEXT NOT NULL,
    "eliminadoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Archivo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Archivo_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "metodo" TEXT NOT NULL,
    "estatus" TEXT NOT NULL DEFAULT 'pendiente',
    "fechaPago" DATETIME,
    "fechaVencimiento" DATETIME,
    "folio" INTEGER NOT NULL,
    "concepto" TEXT,
    "registradoPorId" TEXT NOT NULL,
    "eliminadoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Pago_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pago_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "vendedorId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "duracionMin" INTEGER NOT NULL DEFAULT 15,
    "estado" TEXT NOT NULL DEFAULT 'confirmada',
    "googleEventId" TEXT,
    "googleMeetLink" TEXT,
    "notas" TEXT,
    "eliminadoEn" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Cita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Cita_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventoTimeline" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "metadata" TEXT,
    "autorId" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventoTimeline_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventoTimeline_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recordatorio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "clienteId" TEXT,
    "texto" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "hecho" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Recordatorio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Recordatorio_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mencion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Mencion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plantilla" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "nombre" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "categoria" TEXT,
    "asunto" TEXT,
    "cuerpo" TEXT NOT NULL,
    "favorita" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Plantilla_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RegistroAuditoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "entidadTipo" TEXT NOT NULL,
    "entidadId" TEXT,
    "detalle" TEXT,
    "ip" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistroAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfiguracionNegocio" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "nombreNegocio" TEXT NOT NULL DEFAULT 'todo hogar',
    "colorMarca" TEXT NOT NULL DEFAULT '#e8b763',
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "husoHorario" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "horarioInicio" TEXT NOT NULL DEFAULT '15:00',
    "horarioFin" TEXT NOT NULL DEFAULT '20:00',
    "duracionCitaMin" INTEGER NOT NULL DEFAULT 15,
    "etapasEmbudo" TEXT NOT NULL DEFAULT '["Nuevo","Cliente de pagares","Cliente activo","Contactado","Cita agendada","Propuesta enviada","Cliente ganado","Perdido"]',
    "metodosPago" TEXT NOT NULL DEFAULT '["Transferencia","Efectivo","Depósito / anticipo"]',
    "motivosPerdida" TEXT NOT NULL DEFAULT '["Está caro","Se fue con la competencia","No contestó","No era buen momento","No calificaba","Otro"]',
    "mensajeWhatsappTipo" TEXT NOT NULL DEFAULT '',
    "metaMensualClientes" INTEGER NOT NULL DEFAULT 20,
    "umbralEstancamientoDias" INTEGER NOT NULL DEFAULT 7,
    "comisionGlobalPct" REAL,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VistaGuardada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "usuarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "filtros" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VistaGuardada_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_slugAgenda_key" ON "Usuario"("slugAgenda");

-- CreateIndex
CREATE INDEX "Usuario_correo_idx" ON "Usuario"("correo");

-- CreateIndex
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");

-- CreateIndex
CREATE INDEX "Cliente_nombre_idx" ON "Cliente"("nombre");

-- CreateIndex
CREATE INDEX "Cliente_telefono_idx" ON "Cliente"("telefono");

-- CreateIndex
CREATE INDEX "Cliente_correo_idx" ON "Cliente"("correo");

-- CreateIndex
CREATE INDEX "Cliente_etapa_idx" ON "Cliente"("etapa");

-- CreateIndex
CREATE INDEX "Cliente_estadoCartera_idx" ON "Cliente"("estadoCartera");

-- CreateIndex
CREATE INDEX "Cliente_vendedorId_idx" ON "Cliente"("vendedorId");

-- CreateIndex
CREATE INDEX "Cliente_empresaNombre_idx" ON "Cliente"("empresaNombre");

-- CreateIndex
CREATE INDEX "Cliente_proximaAccionFecha_idx" ON "Cliente"("proximaAccionFecha");

-- CreateIndex
CREATE UNIQUE INDEX "Etiqueta_nombre_key" ON "Etiqueta"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Favorito_usuarioId_clienteId_key" ON "Favorito"("usuarioId", "clienteId");

-- CreateIndex
CREATE INDEX "Archivo_clienteId_idx" ON "Archivo"("clienteId");

-- CreateIndex
CREATE INDEX "Pago_clienteId_idx" ON "Pago"("clienteId");

-- CreateIndex
CREATE INDEX "Pago_estatus_idx" ON "Pago"("estatus");

-- CreateIndex
CREATE INDEX "Pago_fechaPago_idx" ON "Pago"("fechaPago");

-- CreateIndex
CREATE INDEX "Cita_vendedorId_idx" ON "Cita"("vendedorId");

-- CreateIndex
CREATE INDEX "Cita_clienteId_idx" ON "Cita"("clienteId");

-- CreateIndex
CREATE INDEX "Cita_fecha_idx" ON "Cita"("fecha");

-- CreateIndex
CREATE INDEX "EventoTimeline_clienteId_idx" ON "EventoTimeline"("clienteId");

-- CreateIndex
CREATE INDEX "EventoTimeline_fecha_idx" ON "EventoTimeline"("fecha");

-- CreateIndex
CREATE INDEX "Recordatorio_usuarioId_idx" ON "Recordatorio"("usuarioId");

-- CreateIndex
CREATE INDEX "Recordatorio_fecha_idx" ON "Recordatorio"("fecha");

-- CreateIndex
CREATE INDEX "Mencion_usuarioId_idx" ON "Mencion"("usuarioId");

-- CreateIndex
CREATE INDEX "Plantilla_usuarioId_idx" ON "Plantilla"("usuarioId");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_usuarioId_idx" ON "RegistroAuditoria"("usuarioId");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_creadoEn_idx" ON "RegistroAuditoria"("creadoEn");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_entidadTipo_idx" ON "RegistroAuditoria"("entidadTipo");

-- CreateIndex
CREATE INDEX "VistaGuardada_usuarioId_idx" ON "VistaGuardada"("usuarioId");
