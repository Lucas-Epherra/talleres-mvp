"use client";

import {
  CarFront,
  ClipboardList,
  LayoutGrid,
  Menu,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { PrivateNavLink } from "./PrivateNavLink";

type PrivateNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const PRIVATE_NAVIGATION_ITEMS: PrivateNavigationItem[] = [
  {
    href: "/dashboard",
    label: "Panel de control",
    icon: LayoutGrid,
  },
  {
    href: "/customers",
    label: "Clientes",
    icon: Users,
  },
  {
    href: "/vehicles",
    label: "Vehículos",
    icon: CarFront,
  },
  {
    href: "/work-orders",
    label: "Órdenes",
    icon: ClipboardList,
  },
];

/**
 * Responsive private navigation.
 *
 * Desktop renders a horizontal navigation bar below the dark shell header.
 * Mobile uses a compact hamburger trigger that expands a vertical list.
 */
export function PrivateNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu(): void {
    setIsOpen(false);
  }

  return (
    <nav aria-label="Navegación principal">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="private-mobile-navigation"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-border bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:bg-surface-elevated lg:hidden"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-xl border border-border-strong bg-surface">
            {isOpen ? (
              <X className="size-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Menu
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </span>

          <span className="font-display uppercase tracking-[0.08em]">
            Menú del taller
          </span>
        </span>
      </button>

      <ul
        id="private-mobile-navigation"
        className={buildClassName(
          "mt-3 gap-2 rounded-3xl border border-border bg-surface p-2 shadow-(--shadow-industrial) lg:hidden",
          isOpen ? "grid" : "hidden",
        )}
      >
        {PRIVATE_NAVIGATION_ITEMS.map((item) => (
          <li key={item.href}>
            <PrivateNavLink
              href={item.href}
              icon={item.icon}
              onClick={closeMenu}
            >
              {item.label}
            </PrivateNavLink>
          </li>
        ))}
      </ul>

      <ul className="hidden flex-wrap items-center gap-4 lg:flex">
        {PRIVATE_NAVIGATION_ITEMS.map((item) => (
          <li key={item.href}>
            <PrivateNavLink href={item.href} icon={item.icon}>
              {item.label}
            </PrivateNavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Small helper to compose className strings without adding a dependency.
 */
function buildClassName(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}
