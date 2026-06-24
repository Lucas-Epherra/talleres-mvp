"use client";

import { Check, CheckCircle2, XCircle } from "lucide-react";
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
};

/**
 * Client-only operational actions for appointment status changes.
 *
 * The card remains server-rendered, while mutations stay isolated in this leaf
 * component.
 */
export function AppointmentActions({
  appointmentId,
  status,
}: AppointmentActionsProps) {
  const router = useRouter();
  const reasonId = useId();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isClosed = status === "COMPLETED" || status === "CANCELLED";

  async function runAction(action: () => Promise<unknown>) {
    if (isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await action();
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
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

    await runAction(() =>
      cancelAppointment(appointmentId, {
        reason: normalizedReason,
      }),
    );
  }

  if (isClosed) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {status === "SCHEDULED" ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => runAction(() => confirmAppointment(appointmentId))}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Check className="size-4 shrink-0" aria-hidden="true" />
            Confirmar
          </button>
        ) : null}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => runAction(() => completeAppointment(appointmentId))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          Completar
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            setShowCancelForm((currentValue) => !currentValue);
            setErrorMessage(null);
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
        >
          <XCircle className="size-4 shrink-0" aria-hidden="true" />
          Cancelar
        </button>
      </div>

      {showCancelForm ? (
        <form
          className="space-y-2 rounded-2xl border border-border bg-surface-muted/80 p-3"
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
            className="w-full resize-y rounded-xl border border-border-strong bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
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
