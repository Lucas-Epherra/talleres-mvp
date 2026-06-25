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
          className="block h-auto w-[170px] object-contain sm:w-[205px]"
        />

        <div className="flex flex-col gap-2 sm:items-end">
          <p>© {currentYear} · MVP operativo en desarrollo</p>

          <Link
            href="/dashboard"
            className="font-bold text-primary transition hover:text-primary-hover"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    </footer>
  );
}