import type { MetadataRoute } from "next";

const SITE_URL = "https://www.mitaller360.com";

/**
 * Genera el sitemap público de Mi Taller 360.
 *
 * Solo deben incluirse rutas públicas indexables.
 * Las rutas privadas como dashboard, clientes, vehículos y órdenes
 * no deben entrar al sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}