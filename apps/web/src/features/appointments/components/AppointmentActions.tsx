"use client";

import { Check, CheckCircle2, TriangleAlert, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import {
  cancelAppointment,
  completeAppointment,
  confirmAppointment,
} from "../appointments.client";
import type { AppointmentStatus } from "../types";

type AppointmentActionsProps = {
  appointmentId: string;
  status: AppointmentStatus;
  variant?: "default" | "compact";
};

/**
 * Client-only operational actions for appointment status changes.
 *
 * Normal progress actions stay visible, while cancellation is kept in a small
 * critical area because it requires a reason and closes the agenda item.
 */
export function AppointmentActions({
  appointmentId,
  status,
  variant = "default",
}: AppointmentActionsProps) {
  const router = useRouter();
  const reasonId = useId();
  const cancelFormId = useId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isClosed = status === "COMPLETED" || status === "CANCELLED";

  async function runAction(action: () => Promise<unknown>): Promise<boolean> {
    if (isSubmitting) {
      return false;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await action();
      router.refresh();
      return true;
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedReason = cancelReason.trim();

    if (normalizedReason.length < 3) {
      setErrorMessage(
        "El motivo de cancelación debe tener al menos 3 caracteres.",
      );
      return;
    }

    const wasSuccessful = await runAction(() =>
      cancelAppointment(appointmentId, {
        reason: normalizedReason,
      }),
    );

    if (wasSuccessful) {
      setCancelReason("");
      setShowCancelForm(false);
    }
  }

  if (isClosed) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div className="space-y-2">
        <div className="grid gap-2">
          {status === "SCHEDULED" ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void runAction(() => confirmAppointment(appointmentId))}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface-elevated px-3 text-xs font-bold text-foreground transition hover:border-primary/60 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="size-3.5 shrink-0" aria-hidden="true" />
              Confirmar
            </button>
          ) : null}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void runAction(() => completeAppointment(appointmentId))}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden="true" />
            Completar
          </button>
        </div>

        <section className="rounded-xl border border-border bg-surface-muted/70 p-2">
          <button
            type="button"
            disabled={isSubmitting}
            aria-expanded={showCancelForm}
            aria-controls={cancelFormId}
            onClick={() => {
              setShowCancelForm((currentValue) => !currentValue);
              setErrorMessage(null);
            }}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface px-3 text-xs font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle className="size-3.5 shrink-0" aria-hidden="true" />
            Cancelar turno
          </button>

          {showCancelForm ? (
            <form
              id={cancelFormId}
              className="mt-2 space-y-2 rounded-xl border border-border bg-surface p-2"
              onSubmit={handleCancelSubmit}
              noValidate
            >
              <label
                htmlFor={reasonId}
                className="block text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Motivo
              </label>

              <textarea
                id={reasonId}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={2}
                required
                placeholder="Ej: El cliente pidió reprogramar."
                className="w-full resize-y rounded-lg border border-border-strong bg-surface-muted px-2.5 py-2 text-xs text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-primary px-3 text-xs font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Cancelando..." : "Confirmar"}
              </button>
            </form>
          ) : null}
        </section>

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-xs font-semibold text-foreground"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {status === "SCHEDULED" ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void runAction(() => confirmAppointment(appointmentId))}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="size-4 shrink-0" aria-hidden="true" />
            Confirmar
          </button>
        ) : null}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void runAction(() => completeAppointment(appointmentId))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          Completar
        </button>
      </div>

      <section className="rounded-2xl border border-border bg-surface-muted/75 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[0.64rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
              Zona crítica
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Cancelá solo si el turno ya no debe formar parte del flujo.
            </p>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            aria-expanded={showCancelForm}
            aria-controls={cancelFormId}
            onClick={() => {
              setShowCancelForm((currentValue) => !currentValue);
              setErrorMessage(null);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle className="size-4 shrink-0" aria-hidden="true" />
            Cancelar turno
          </button>
        </div>

        {showCancelForm ? (
          <form
            id={cancelFormId}
            className="mt-3 space-y-2 rounded-2xl border border-border bg-surface p-3"
            onSubmit={handleCancelSubmit}
            noValidate
          >
            <label
              htmlFor={reasonId}
              className="block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground"
            >
              Motivo de cancelación
            </label>

            <textarea
              id={reasonId}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={3}
              required
              placeholder="Ej: El cliente pidió reprogramar."
              className="w-full resize-y rounded-xl border border-border-strong bg-surface-muted px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? "Cancelando..." : "Confirmar cancelación"}
            </button>
          </form>
        ) : null}
      </section>

      {errorMessage ? (
        <p
          role="alert"
          className="rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
