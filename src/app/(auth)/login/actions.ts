"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function iniciarSesion(_estadoPrevio: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      correo: formData.get("correo"),
      password: formData.get("password"),
      redirectTo: (formData.get("callbackUrl") as string) || "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Correo o contraseña incorrectos. Si fallaste varias veces, espera unos minutos e inténtalo de nuevo.";
    }
    throw error;
  }
}
