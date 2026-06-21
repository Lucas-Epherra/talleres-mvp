import type { Metadata } from "next";
import { Exo_2, Montserrat } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

const exo = Exo_2({
  variable: "--font-exo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mi Taller",
    template: "%s | Mi Taller",
  },
  description:
    "Sistema operativo para centralizar clientes, vehículos, órdenes de trabajo e historial de taller mecánico.",
};

/**
 * Root application layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${exo.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
