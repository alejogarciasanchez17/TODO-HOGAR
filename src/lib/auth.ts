import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      name: "credenciales",
      credentials: {
        correo: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credenciales) {
        const correo = String(credenciales?.correo ?? "")
          .trim()
          .toLowerCase();
        const password = String(credenciales?.password ?? "");
        if (!correo || !password) return null;

        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        // No revelamos si el correo existe o no: mismo mensaje de error siempre.
        if (!usuario || usuario.eliminadoEn || !usuario.activo) return null;

        if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
          return null;
        }

        const valido = await bcrypt.compare(password, usuario.passwordHash);

        if (!valido) {
          const intentos = usuario.intentosFallidos + 1;
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
              intentosFallidos: intentos,
              bloqueadoHasta:
                intentos >= MAX_INTENTOS
                  ? new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000)
                  : null,
            },
          });
          return null;
        }

        if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta) {
          await prisma.usuario.update({
            where: { id: usuario.id },
            data: { intentosFallidos: 0, bloqueadoHasta: null },
          });
        }

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.correo,
          rol: usuario.rol,
          tema: usuario.tema,
          densidad: usuario.densidad,
          onboardingCompletado: usuario.onboardingCompletado,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.rol = (user as { rol?: string }).rol;
        token.tema = (user as { tema?: string }).tema;
        token.densidad = (user as { densidad?: string }).densidad;
        token.onboardingCompletado = (
          user as { onboardingCompletado?: boolean }
        ).onboardingCompletado;
      }
      // Permite refrescar campos de sesión sin volver a iniciar sesión
      // (p. ej. al cambiar de tema o completar el tour de bienvenida).
      if (trigger === "update" && session) {
        Object.assign(token, session);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
        session.user.tema = token.tema as string;
        session.user.densidad = token.densidad as string;
        session.user.onboardingCompletado = token.onboardingCompletado as boolean;
      }
      return session;
    },
  },
});
