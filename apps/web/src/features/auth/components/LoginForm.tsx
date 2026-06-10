"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError } from "../../../lib/api";
import { login } from "../auth.client";

type FormStatus = "idle" | "loading" | "error";

type LoginFormState = {
  status: FormStatus;
  message: string | null;
};

/**
 * Login form connected to the backend auth endpoint.
 *
 * It does not store tokens in localStorage. Authentication is handled through
 * the backend httpOnly cookie.
 */
export function LoginForm() {
  const router = useRouter();

  const [state, setState] = useState<LoginFormState>({
    status: "idle",
    message: null,
  });

  const isLoading = state.status === "loading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setState({
        status: "error",
        message: "Ingresá email y contraseña.",
      });

      return;
    }

    setState({
      status: "loading",
      message: null,
    });

    try {
      await login({ email, password });

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo iniciar sesión.";

      setState({
        status: "error",
        message,
      });
    }
  }

  return (
    <form
      className="w-full space-y-5"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={state.message ? "login-error" : undefined}
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-200"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@taller.demo"
          className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-200"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Admin123!"
          className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
          disabled={isLoading}
          required
        />
      </div>

      {state.message ? (
        <p id="login-error" className="text-sm text-red-300" role="alert">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        className="h-11 w-full rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
      >
        {isLoading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}