import type { MetadataRoute } from "next";

const SITE_URL = "https://www.mitaller360.com";

/**
 * Define reglas de indexación para buscadores.
 *
 * Bloquea las rutas privadas del sistema y expone el sitemap público.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/customers",
        "/vehicles",
        "/work-orders",
        "/schedule",
        "/settings",
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}