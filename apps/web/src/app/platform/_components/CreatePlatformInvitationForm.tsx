"use client";

import { Loader2, MailPlus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import type { AuthRole } from "@/features/auth/types";
import { createPlatformInvitation } from "@/features/platform/platform.client";
import type { PlatformWorkshop } from "@/features/platform/types";
import { getApiErrorMessage } from "@/lib/api";

type FormStatus = "idle" | "loading" | "success" | "error";

type CreatePlatformInvitationFormState = {
  status: FormStatus;
  message: string | null;
  setupToken: string | null;
};

type CreatePlatformInvitationFormProps = {
  workshops: PlatformWorkshop[];
};

const ROLE_OPTIONS: Array<{
  value: AuthRole;
  label: string;
  description: string;
}> = [
    {
      value: "OWNER",
      label: "Responsable del taller",
      description: "Puede administrar el taller y sus accesos.",
    },
    {
      value: "ADMIN",
      label: "Administración",
      description: "Puede gestionar la operación diaria.",
    },
    {
      value: "OPERATOR",
      label: "Operario / equipo",
      description: "Acceso operativo limitado.",
    },
  ];

/**
 * Client-side form used by internal administrators to create workshop access
 * invitations.
 *
 * Email delivery is intentionally not handled here yet. Until the email flow is
 * implemented, the backend returns a one-time setup token for QA.
 */
export function CreatePlatformInvitationForm({
  workshops,
}: CreatePlatformInvitationFormProps) {
  const router = useRouter();
  const feedbackId = useId();

  const [state, setState] = useState<CreatePlatformInvitationFormState>({
    status: "idle",
    message: null,
    setupToken: null,
  });

  const isLoading = state.status === "loading";
  const hasWorkshops = workshops.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || !hasWorkshops) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const workshopId = String(formData.get("workshopId") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const role = String(formData.get("role") ?? "OWNER") as AuthRole;

    if (!workshopId) {
      setState({
        status: "error",
        message: "Seleccioná un taller.",
        setupToken: null,
      });

      return;
    }

    if (!email) {
      setState({
        status: "error",
        message: "Ingresá el email de la persona que va a tener acceso.",
        setupToken: null,
      });

      return;
    }

    setState({
      status: "loading",
      message: null,
      setupToken: null,
    });

    try {
      const response = await createPlatformInvitation(workshopId, {
        email,
        role,
      });

      form.reset();

      setState({
        status: "success",
        message: "Acceso creado correctamente.",
        setupToken: response.setupToken,
      });

      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: getApiErrorMessage(error),
        setupToken: null,
      });
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={state.message ? feedbackId : undefined}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface">
          <MailPlus className="size-4 text-primary" aria-hidden="true" />
        </span>

        <div className="min-w-0">
          <h2 className="font-display text-xl font-black uppercase tracking-[0.04em] text-foreground">
            Enviar acceso
          </h2>

          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Generá una invitación para que el responsable o el equipo del taller
            pueda entrar a Mi Taller 360.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="platform-invitation-workshop"
          className="block text-sm font-bold text-foreground"
        >
          Taller
        </label>

        <select
          id="platform-invitation-workshop"
          name="workshopId"
          className="h-11 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading || !hasWorkshops}
          required
          defaultValue=""
        >
          <option value="" disabled>
            Seleccionar taller
          </option>

          {workshops.map((workshop) => (
            <option key={workshop.id} value={workshop.id}>
              {workshop.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="platform-invitation-email"
          className="block text-sm font-bold text-foreground"
        >
          Email de acceso
        </label>

        <input
          id="platform-invitation-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="responsable@taller.com"
          className="h-11 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading || !hasWorkshops}
          required
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="platform-invitation-role"
          className="block text-sm font-bold text-foreground"
        >
          Tipo de acceso
        </label>

        <select
          id="platform-invitation-role"
          name="role"
          className="h-11 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading || !hasWorkshops}
          defaultValue="OWNER"
          required
        >
          {ROLE_OPTIONS.map((roleOption) => (
            <option key={roleOption.value} value={roleOption.value}>
              {roleOption.label}
            </option>
          ))}
        </select>

        <p className="text-xs leading-5 text-muted-foreground">
          Para el primer usuario de un taller, usá “Responsable del taller”.
        </p>
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

      {state.setupToken ? (
        <div className="rounded-xl border border-border bg-surface-muted p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Link temporal de acceso
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Todavía no enviamos emails. Pasá este link manualmente para probar el
            alta del usuario.
          </p>

          <textarea
            className="mt-3 min-h-24 w-full resize-y rounded-xl border border-border-strong bg-background/70 px-3 py-2 text-xs font-semibold text-foreground outline-none"
            value={`/aceptar-invitacion?token=${state.setupToken}`}
            readOnly
          />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isLoading || !hasWorkshops}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="size-4" aria-hidden="true" />
        )}

        {isLoading ? "Generando acceso..." : "Enviar acceso"}
      </button>
    </form>
  );
}