import Image from "next/image";

type BrandLogoVariant = "dark" | "light" | "medium" | "simple";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  priority?: boolean;
  className?: string;
};

const BRAND_LOGOS: Record<BrandLogoVariant, string> = {
  dark: "/brand/logos/mi-taller-360-logo-dark-transparent-v2.webp",
  light: "/logo-entero.png",
  medium: "/logo-medio.png",
  simple: "/logo-simple.png",
};

/**
 * Renderiza el logo oficial de Mi Taller 360.
 *
 * Usa assets públicos ubicados en `apps/web/public`.
 * La variante dark debe ser un archivo con fondo transparente real,
 * no un render sobre una placa oscura.
 */
export function BrandLogo({
  variant = "dark",
  priority = false,
  className = "h-10 w-auto",
}: BrandLogoProps) {
  return (
    <Image
      src={BRAND_LOGOS[variant]}
      alt="Mi Taller 360"
      width={1880}
      height={469}
      priority={priority}
      className={className}
    />
  );
}