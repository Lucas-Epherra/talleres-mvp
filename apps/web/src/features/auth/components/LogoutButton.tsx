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
      className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? "Saliendo..." : "Cerrar sesión"}
    </button>
  );
}