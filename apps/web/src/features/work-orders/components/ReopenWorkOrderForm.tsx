"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { reopenWorkOrder } from "../work-orders.client";

type ReopenWorkOrderFormProps = {
  workOrderId: string;
};

const MIN_REASON_LENGTH = 8;

/**
 * Leaf client form used to reopen a delivered work order.
 *
 * Reopening is intentionally separated from the normal status selector because
 * it is an exceptional correction that requires an auditable reason.
 */
export function ReopenWorkOrderForm({ workOrderId }: ReopenWorkOrderFormProps) {
  const router = useRouter();
  const reasonId = useId();
  const errorId = useId();

  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedReason = reason.trim().replace(/\s+/g, " ");

    if (normalizedReason.length < MIN_REASON_LENGTH) {
      setErrorMessage(
        "Ingresá un motivo claro de al menos 8 caracteres para reabrir la orden.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await reopenWorkOrder(workOrderId, {
        reason: normalizedReason,
      });

      setReason("");
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="mt-5 rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3"
      onSubmit={handleSubmit}
      aria-describedby={errorMessage ? errorId : undefined}
      noValidate
    >
      <label
        htmlFor={reasonId}
        className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
      >
        Motivo de reapertura
      </label>

      <textarea
        id={reasonId}
        name="reason"
        value={reason}
        disabled={isSubmitting}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Ej: Se marcó como entregada por error y todavía falta validar el retiro."
        rows={4}
        className="mt-2 min-h-28 w-full resize-y rounded-xl border border-border-strong bg-surface-muted/85 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
        maxLength={500}
        required
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">
          La orden volverá a “Lista para entregar” y el motivo quedará guardado
          en el historial operativo.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
          {isSubmitting ? "Reabriendo..." : "Reabrir orden"}
        </button>
      </div>

      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
