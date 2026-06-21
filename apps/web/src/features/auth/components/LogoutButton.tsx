"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "../auth.client";

/**
 * Button that ends the current session and returns the user to the login page.
 */
export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);

    try {
      await logout();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}
