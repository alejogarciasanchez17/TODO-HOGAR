import { readFileSync } from "fs";
import { join } from "path";

let cache: string | null = null;

/** Data URI del logo de "todo hogar", para usarlo en <img> dentro de ImageResponse (favicon, og-image). */
export function logoDataUri(): string {
  if (!cache) {
    const buffer = readFileSync(join(process.cwd(), "public/logo-todo-hogar.png"));
    cache = `data:image/png;base64,${buffer.toString("base64")}`;
  }
  return cache;
}
