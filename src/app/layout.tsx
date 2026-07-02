import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "sonner";
import { auth } from "@/lib/auth";
import { SCRIPT_RESOLVER_TEMA, type Tema } from "@/lib/tema";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL ?? "http://localhost:3000"),
  title: { default: "todo hogar · CRM", template: "%s · todo hogar" },
  description:
    "El CRM de todo hogar: agenda, seguimiento y ventas de muebles tubulares y artículos para el hogar en Querétaro.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#e8b763",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const temaPref: Tema = (session?.user?.tema as Tema) ?? "automatico";
  const temaInicial = temaPref === "oscuro" ? "oscuro" : "claro";

  return (
    <html
      lang="es"
      data-tema-pref={temaPref}
      data-tema={temaInicial}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-fondo text-texto">
        <Script id="resolver-tema" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SCRIPT_RESOLVER_TEMA }} />
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              borderRadius: "var(--radio-md)",
              fontSize: "15px",
            },
          }}
        />
      </body>
    </html>
  );
}
