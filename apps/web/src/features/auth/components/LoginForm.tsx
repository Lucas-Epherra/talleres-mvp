"use client";

import { Eye, EyeOff, LogIn } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = state.status === "loading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
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
      const response = await login({ email, password });
      const nextPath =
        response.user.platformRole === "OWNER" ? "/platform" : "/dashboard";

      router.replace(nextPath);
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
        <label
          htmlFor="email"
          className="block text-sm font-bold text-foreground"
        >
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@taller.demo"
          className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-bold text-foreground"
        >
          Contraseña
        </label>

        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Admin123!"
            className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 pr-12 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((currentValue) => !currentValue)}
            disabled={isLoading}
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {state.message ? (
        <p
          id={errorId}
          className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
      >
        <LogIn className="size-4 shrink-0" aria-hidden="true" />
        {isLoading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}