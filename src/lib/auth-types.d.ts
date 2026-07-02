import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: string;
      tema: string;
      densidad: string;
      onboardingCompletado: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    rol?: string;
    tema?: string;
    densidad?: string;
    onboardingCompletado?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rol?: string;
    tema?: string;
    densidad?: string;
    onboardingCompletado?: boolean;
  }
}
