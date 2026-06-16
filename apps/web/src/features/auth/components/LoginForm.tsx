"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
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
  const errorId = useId();

  const [state, setState] = useState<LoginFormState>({
    status: "idle",
    message: null,
  });

  const isLoading = state.status === "loading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
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
      setState({
        status: "error",
        message: getApiErrorMessage(error),
      });
    }
  }

  return (
    <form
      className="w-full space-y-5"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={state.message ? errorId : undefined}
    >
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-bold text-white">
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@taller.demo"
          className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-bold text-white"
        >
          Contraseña
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Admin123!"
          className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          required
        />
      </div>

      {state.message ? (
        <p
          id={errorId}
          className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-white"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        className="h-12 w-full rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
      >
        {isLoading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}