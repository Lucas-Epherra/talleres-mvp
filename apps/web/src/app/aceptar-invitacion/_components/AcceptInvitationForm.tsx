"use client";

import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useId, useState } from "react";
import { acceptPlatformInvitation } from "@/features/platform/platform.client";
import { getApiErrorMessage } from "@/lib/api";

type FormStatus = "idle" | "loading" | "success" | "error";

type AcceptInvitationFormProps = {
  token: string;
  email: string;
  workshopName: string;
};

type AcceptInvitationFormState = {
  status: FormStatus;
  message: string | null;
};

/**
 * Form used by invited workshop users to create their account password.
 */
export function AcceptInvitationForm({
  token,
  email,
  workshopName,
}: AcceptInvitationFormProps) {
  const feedbackId = useId();

  const [state, setState] = useState<AcceptInvitationFormState>({
    status: "idle",
    message: null,
  });
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = state.status === "loading";
  const isSuccess = state.status === "success";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || isSuccess) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(
      formData.get("passwordConfirmation") ?? "",
    );

    if (name.length < 2) {
      setState({
        status: "error",
        message: "Ingresá tu nombre.",
      });

      return;
    }

    if (password !== passwordConfirmation) {
      setState({
        status: "error",
        message: "Las contraseñas no coinciden.",
      });

      return;
    }

    setState({
      status: "loading",
      message: null,
    });

    try {
      await acceptPlatformInvitation({
        token,
        name,
        password,
      });

      setState({
        status: "success",
        message: "Acceso creado correctamente. Ya podés iniciar sesión.",
      });
    } catch (error) {
      setState({
        status: "error",
        message: getApiErrorMessage(error),
      });
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={state.message ? feedbackId : undefined}
    >
      <div className="rounded-2xl border border-border bg-surface-muted p-4">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary">
          Invitación
        </p>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Vas a crear acceso para:
        </p>

        <p className="mt-1 text-sm font-bold text-foreground">{email}</p>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Taller:
        </p>

        <p className="mt-1 text-sm font-bold text-foreground">
          {workshopName}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-bold text-foreground">
          Tu nombre
        </label>

        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Ej: Juan Pérez"
          className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading || isSuccess}
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
            autoComplete="new-password"
            placeholder="Mínimo 10 caracteres"
            className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 pr-12 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || isSuccess}
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((currentValue) => !currentValue)}
            disabled={isLoading || isSuccess}
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

        <p className="text-xs leading-5 text-muted-foreground">
          Debe incluir mayúscula, minúscula, número y símbolo.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="passwordConfirmation"
          className="block text-sm font-bold text-foreground"
        >
          Repetir contraseña
        </label>

        <input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Repetí la contraseña"
          className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading || isSuccess}
          required
        />
      </div>

      {state.message ? (
        <p
          id={feedbackId}
          role={state.status === "error" ? "alert" : "status"}
          className={
            state.status === "success"
              ? "rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
              : "rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
          }
        >
          {state.message}
        </p>
      ) : null}

      {isSuccess ? (
        <Link
          href="/login"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover"
        >
          <LogIn className="size-4" aria-hidden="true" />
          Ir a iniciar sesión
        </Link>
      ) : (
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogIn className="size-4" aria-hidden="true" />
          )}
          {isLoading ? "Creando acceso..." : "Crear acceso"}
        </button>
      )}
    </form>
  );
}