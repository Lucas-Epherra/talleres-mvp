"use client";

import { AlertTriangle, Ban, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { cancelWorkOrder } from "../work-orders.client";

type CancelWorkOrderFormProps = {
  workOrderId: string;
};

const MIN_CANCEL_REASON_LENGTH = 8;
const MAX_CANCEL_REASON_LENGTH = 500;

/**
 * Leaf client form used to cancel an open work order with traceability.
 *
 * Cancellation is intentionally separated from normal status updates because it
 * requires a mandatory reason and closes the order operationally.
 */
export function CancelWorkOrderForm({ workOrderId }: CancelWorkOrderFormProps) {
  const router = useRouter();
  const reasonId = useId();
  const errorId = useId();
  const confirmationId = useId();

  const [reason, setReason] = useState("");
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedReason = reason.trim();
  const hasValidReason =
    normalizedReason.length >= MIN_CANCEL_REASON_LENGTH &&
    normalizedReason.length <= MAX_CANCEL_REASON_LENGTH;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!hasValidReason) {
      setErrorMessage(
        `El motivo debe tener entre ${MIN_CANCEL_REASON_LENGTH} y ${MAX_CANCEL_REASON_LENGTH} caracteres.`,
      );
      setIsConfirmationVisible(false);
      return;
    }

    if (!isConfirmationVisible) {
      setErrorMessage(null);
      setIsConfirmationVisible(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await cancelWorkOrder(workOrderId, {
        reason: normalizedReason,
      });

      setReason("");
      setIsConfirmationVisible(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReasonChange(value: string) {
    setReason(value);
    setErrorMessage(null);

    if (isConfirmationVisible) {
      setIsConfirmationVisible(false);
    }
  }

  function handleCancelConfirmation() {
    setIsConfirmationVisible(false);
    setErrorMessage(null);
  }

  return (
    <form
      className="mt-5 rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3"
      onSubmit={handleSubmit}
      aria-describedby={[
        errorMessage ? errorId : null,
        isConfirmationVisible ? confirmationId : null,
      ]
        .filter(Boolean)
        .join(" ")}
      noValidate
    >
      <label
        htmlFor={reasonId}
        className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
      >
        Motivo de anulación
      </label>

      <textarea
        id={reasonId}
        name="reason"
        value={reason}
        disabled={isSubmitting}
        maxLength={MAX_CANCEL_REASON_LENGTH}
        rows={4}
        onChange={(event) => handleReasonChange(event.target.value)}
        placeholder="Ej: El cliente no autorizó el trabajo o la orden se cargó por error."
        className="mt-2 min-h-28 w-full resize-y rounded-xl border border-border-strong bg-surface-muted/85 px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="mt-2 flex flex-col gap-2 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          El motivo quedará registrado en el historial operativo de la orden.
        </p>

        <p className="font-bold">
          {normalizedReason.length}/{MAX_CANCEL_REASON_LENGTH}
        </p>
      </div>

      {isConfirmationVisible ? (
        <section
          id={confirmationId}
          aria-labelledby={`${confirmationId}-heading`}
          className="mt-4 rounded-2xl border border-primary/35 bg-primary/10 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/35 bg-surface text-primary">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h3
                id={`${confirmationId}-heading`}
                className="text-sm font-black text-foreground"
              >
                Confirmar anulación de la orden
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Vas a anular esta orden. La orden quedará cerrada como anulada,
                no podrá editarse ni volver al flujo operativo normal.
              </p>

              <button
                type="button"
                onClick={handleCancelConfirmation}
                disabled={isSubmitting}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Cancelar anulación
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isConfirmationVisible ? (
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Ban className="size-4 shrink-0" aria-hidden="true" />
        )}

        {isSubmitting
          ? "Anulando..."
          : isConfirmationVisible
            ? "Sí, anular orden"
            : "Revisar anulación"}
      </button>
    </form>
  );
}
