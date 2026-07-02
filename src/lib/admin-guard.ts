import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Server-side gate para páginas de /admin: nunca confiar solo en el proxy. */
export async function requerirAdmin() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/login");
  if (sesion.user.rol !== "ADMIN") redirect("/dashboard");
  return sesion.user;
}
