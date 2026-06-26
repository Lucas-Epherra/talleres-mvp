import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

/**
 * Private application footer.
 *
 * Adds a subtle closing point to long operational screens without introducing
 * marketing noise into the workshop dashboard.
 */
export function PrivateFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="theme-dark-shell border-t border-white/10 bg-[#080A0D]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <BrandLogo
          variant="dark"
          className="block h-auto w-[190px] object-contain xs:w-[205px] sm:w-[235px] lg:w-[255px]"
        />

        <div className="flex flex-col gap-2 sm:items-end">
          <p>© {currentYear} · Sistema de gestión para talleres mecánicos</p>

          <Link
            href="/dashboard"
            className="font-bold text-primary transition hover:text-primary-hover"
          >
            Volver al panel de control
          </Link>
        </div>
      </div>
    </footer>
  );
}