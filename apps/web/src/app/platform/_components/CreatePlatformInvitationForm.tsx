"use client";

import { MailPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { createPlatformInvitation } from "@/features/platform/platform.client";
import type { AuthRole } from "@/features/auth/types";
import type { PlatformWorkshop } from "@/features/platform/types";

type CreatePlatformInvitationFormProps = {
  workshops: PlatformWorkshop[];
};

type EmailDeliveryState = {
  sent: boolean;
  providerMessageId: string | null;
  reason: string | null;
};

type FormStatus = "idle" | "loading" | "success" | "error";

type FormState = {
  status: FormStatus;
  message: string | null;
  setupUrl: string | null;
  delivery: EmailDeliveryState | null;
};

const ROLE_OPTIONS: Array<{
  value: AuthRole;
  label: string;
  description: string;
}> = [
  {
    value: "OWNER",
    label: "Responsable del taller",
    description: "Puede administrar el taller y su equipo.",
  },
  {
    value: "ADMIN",
    label: "Administración",
    description: "Puede operar clientes, vehículos, órdenes y agenda.",
  },
  {
    value: "OPERATOR",
    label: "Operario / equipo",
    description: "Acceso operativo para el trabajo diario.",
  },
];

const shouldShowInvitationDebugLink =
  process.env.NEXT_PUBLIC_SHOW_INVITATION_DEBUG_LINK === "true";

/**
 * Creates a workshop invitation from the internal platform panel.
 *
 * In production, the invitation link is delivered by email. In local QA, the
 * debug link can be shown with NEXT_PUBLIC_SHOW_INVITATION_DEBUG_LINK=true.
 */
export function CreatePlatformInvitationForm({
  workshops,
}: CreatePlatformInvitationFormProps) {
  const router = useRouter();
  const messageId = useId();

  const [state, setState] = useState<FormState>({
    status: "idle",
    message: null,
    setupUrl: null,
    delivery: null,
  });

  const isLoading = state.status === "loading";
  const hasWorkshops = workshops.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || !hasWorkshops) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const workshopId = String(formData.get("workshopId") ?? "").trim();
    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();
    const roleValue = String(formData.get("role") ?? "ADMIN");

    if (!workshopId || !email || !isInvitationRole(roleValue)) {
      setState({
        status: "error",
        message: "Completá taller, email y tipo de acceso.",
        setupUrl: null,
        delivery: null,
      });

      return;
    }

    setState({
      status: "loading",
      message: null,
      setupUrl: null,
      delivery: null,
    });

    try {
      const response = await createPlatformInvitation(workshopId, {
        email,
        role: roleValue,
      });

      setState({
        status: "success",
        message: getInvitationSuccessMessage(response.delivery),
        setupUrl: response.setupUrl,
        delivery: response.delivery ?? null,
      });

      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: getApiErrorMessage(error),
        setupUrl: null,
        delivery: null,
      });
    }
  }

  return (
    <section className="rounded-[1.35rem] border border-border bg-surface p-6">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
          <MailPlus className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Enviar acceso
          </p>

          <h2 className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground">
            Invitar usuario
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Creá un acceso para el responsable o equipo de un taller. El sistema
            enviará el link de activación por email.
          </p>
        </div>
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={state.message ? messageId : undefined}
      >
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
            className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !hasWorkshops}
            required
            defaultValue=""
          >
            <option value="" disabled>
              {hasWorkshops ? "Seleccionar taller" : "No hay talleres cargados"}
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
            className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !hasWorkshops}
            defaultValue="ADMIN"
            required
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <p className="text-xs leading-5 text-muted-foreground">
            {ROLE_OPTIONS.map((option) => option.label).join(" · ")}
          </p>
        </div>

        {state.message ? (
          <p
            id={messageId}
            role={state.status === "error" ? "alert" : "status"}
            className={
              state.status === "error"
                ? "rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
                : "rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-foreground"
            }
          >
            {state.message}
          </p>
        ) : null}

        {state.delivery ? (
          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Estado del email
            </p>

            <p className="mt-2 text-sm font-semibold text-foreground">
              {state.delivery.sent
                ? "Email enviado correctamente."
                : "El email no pudo enviarse."}
            </p>

            {state.delivery.reason ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Motivo: {state.delivery.reason}
              </p>
            ) : null}
          </div>
        ) : null}

        {shouldShowInvitationDebugLink && state.setupUrl ? (
          <div className="rounded-xl border border-border bg-surface-muted p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              Link temporal de QA
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Este link solo se muestra en desarrollo. En producción, el acceso
              se envía por email.
            </p>

            <textarea
              className="mt-3 min-h-24 w-full resize-y rounded-xl border border-border-strong bg-background/70 px-3 py-2 text-xs font-semibold text-foreground outline-none"
              value={state.setupUrl}
              readOnly
            />
          </div>
        ) : null}

        <button
          type="submit"
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading || !hasWorkshops}
        >
          <MailPlus className="size-4 shrink-0" aria-hidden="true" />
          {isLoading ? "Enviando acceso..." : "Enviar acceso"}
        </button>
      </form>
    </section>
  );
}

function isInvitationRole(value: string): value is AuthRole {
  return value === "OWNER" || value === "ADMIN" || value === "OPERATOR";
}

function getInvitationSuccessMessage(delivery?: EmailDeliveryState): string {
  if (delivery?.sent) {
    return "Acceso creado y email enviado correctamente.";
  }

  if (delivery && !delivery.sent) {
    return "Acceso creado, pero el email no pudo enviarse. Revisá la configuración o usá el link de QA local.";
  }

  return "Acceso creado correctamente.";
}