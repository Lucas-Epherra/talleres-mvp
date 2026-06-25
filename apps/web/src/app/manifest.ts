import type { MetadataRoute } from "next";

/**
 * Define el Web App Manifest de Mi Taller 360.
 *
 * Este archivo controla cómo se ve la app cuando se instala en mobile,
 * accesos directos, color de tema e iconos PWA.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Taller 360",
    short_name: "Mi Taller 360",
    description:
      "Sistema de gestión integral para talleres mecánicos: clientes, vehículos, órdenes, agenda y recibos.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F5F6",
    theme_color: "#D62828",
    icons: [
      {
        src: "/brand/icons/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icons/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}