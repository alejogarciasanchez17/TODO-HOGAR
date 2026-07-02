# Notas del proyecto — CRM "todo hogar"

Notas técnicas en español para cuando algo falle o quieras entender una decisión.

## Cómo correrlo en tu compu

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Abre http://localhost:3000

## Usuario admin (datos de ejemplo)

- Correo: `alejogarciasanchez17@gmail.com`
- Contraseña: `TodoHogar2026!`

Vendedores de ejemplo: `santi@todohogar.mx` / `maria@todohogar.mx`, contraseña `Vendedor2026!`.

## Respaldo manual de la base de datos en producción (Postgres/Neon)

Aunque el CRM ya tiene un botón "Respaldar todo" en `/admin/respaldo`, para un respaldo a nivel de base de datos completo:

```bash
pg_dump "$DATABASE_URL" > respaldo-$(date +%Y%m%d).sql
```

O desde el panel de Neon: proyecto → pestaña "Backups" → descarga directa.

## Simplificaciones conscientes (para que quede documentado)

- **Etapas del embudo:** si cambias los nombres de las etapas en Configuración y ya tienes clientes en una etapa que quitaste, esos clientes se quedan con el nombre de etapa anterior (no se bloquea el guardado). Muévelos manualmente si hace falta.
- **Pronóstico de cierre:** usa probabilidades fijas por etapa (ej. "Propuesta enviada" = 60%). Es una estimación, no una promesa.
- **Restaurar respaldo (.json):** solo agrega clientes, pagos y citas que falten (por id). No restaura usuarios completos (por seguridad, el respaldo nunca incluye contraseñas), así que si empiezas de cero necesitas volver a dar de alta a tu equipo en `/admin/usuarios` antes de restaurar.
- **Vista de calendario en Agenda:** es semanal (no mensual) para que quepa bien en celular; se puede navegar semana por semana.

## Si algo falla

- **"tabla no existe" o error de Prisma:** corre `npx prisma migrate dev` (local) o `npx prisma migrate deploy` (producción).
- **La IA no responde:** revisa que `ANTHROPIC_API_KEY` esté bien en `.env`. Aunque falle, el asistente sigue funcionando con plantillas locales (nunca se cae la pantalla).
- **Google Calendar no crea el evento:** confirma `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REFRESH_TOKEN`. Si no están, la cita se guarda igual, solo sin Meet automático (aviso amable en pantalla).
- **No suben archivos grandes:** activa `BLOB_READ_WRITE_TOKEN` (Vercel Blob) para archivos de más de 8 MB; sin eso, los archivos se guardan directo en la base hasta 8 MB.
- **Se pierden los datos al publicar:** asegúrate de que `DATABASE_URL` en Vercel apunte a Postgres (Neon), nunca a un archivo SQLite.

## Registro de cambios relevantes

- Se corrigió `vacioANulo()` en `src/lib/zod-schemas.ts` para no convertir a `null` los campos de texto que en realidad son literales/enums (como `temperatura`), lo cual rompía el build de Prisma.
- Se separaron `src/lib/clientes.ts` (consultas con Prisma, solo servidor) de `src/lib/clientes-utils.ts` (funciones puras) para que los componentes de cliente no arrastren el cliente de Prisma al navegador.
- Se agregó `src/lib/moneda.ts` con la misma lógica de `formatoMoneda` pero sin importar Prisma, para uso en componentes de cliente.
