"use client";

import { AlertTriangle, CheckCircle2, ListChecks } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useMemo, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import {
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "../../../lib/format";
import { updateWorkOrderStatus } from "../work-orders.client";

type UpdateWorkOrderStatusFormProps = {
  workOrderId: string;
  currentStatus: WorkOrderStatus;
};

const WORK_ORDER_STATUS_OPTIONS: WorkOrderStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
];

/**
 * Leaf client form used to update a work order status from the detail screen.
 *
 * Marking an order as delivered requires an explicit second confirmation
 * because it closes the order and blocks direct editing.
 */
export function UpdateWorkOrderStatusForm({
  workOrderId,
  currentStatus,
}: UpdateWorkOrderStatusFormProps) {
  const router = useRouter();
  const selectId = useId();
  const errorId = useId();
  const deliveryConfirmationId = useId();

  const [selectedStatus, setSelectedStatus] =
    useState<WorkOrderStatus>(currentStatus);
  const [requiresDeliveryConfirmation, setRequiresDeliveryConfirmation] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDelivered = currentStatus === "DELIVERED";
  const isCancelled = currentStatus === "CANCELLED";
  const hasChangedStatus = selectedStatus !== currentStatus;
  const isSelectingDelivered = selectedStatus === "DELIVERED";
  const shouldShowDeliveryConfirmation =
    isSelectingDelivered && requiresDeliveryConfirmation && hasChangedStatus;

  const availableStatusOptions = useMemo(
    () =>
      WORK_ORDER_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: formatWorkOrderStatus(status),
      })),
    [],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || isDelivered || isCancelled) {
      return;
    }

    if (!hasChangedStatus) {
      setErrorMessage("Seleccioná un estado diferente al actual.");
      return;
    }

    if (isSelectingDelivered && !requiresDeliveryConfirmation) {
      setErrorMessage(null);
      setRequiresDeliveryConfirmation(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await updateWorkOrderStatus(workOrderId, {
        status: selectedStatus,
      });

      setRequiresDeliveryConfirmation(false);
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleStatusChange(nextStatus: WorkOrderStatus) {
    setSelectedStatus(nextStatus);
    setErrorMessage(null);

    if (nextStatus !== "DELIVERED") {
      setRequiresDeliveryConfirmation(false);
    }
  }

  function handleCancelDeliveryConfirmation() {
    setSelectedStatus(currentStatus);
    setRequiresDeliveryConfirmation(false);
    setErrorMessage(null);
  }

  return (
    <form
      className="mt-5 rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3"
      onSubmit={handleSubmit}
      aria-describedby={[
        errorMessage ? errorId : null,
        shouldShowDeliveryConfirmation ? deliveryConfirmationId : null,
      ]
        .filter(Boolean)
        .join(" ")}
      noValidate
    >
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label
            htmlFor={selectId}
            className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
          >
            Cambiar estado
          </label>

          <select
            id={selectId}
            name="status"
            value={selectedStatus}
            disabled={isSubmitting || isDelivered || isCancelled}
            onChange={(event) =>
              handleStatusChange(event.target.value as WorkOrderStatus)
            }
            className="mt-2 h-11 w-full rounded-xl border border-border-strong bg-surface-muted/85 px-4 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {availableStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {isDelivered ? (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Esta orden ya fue entregada y no puede volver a estados
              anteriores.
            </p>
          ) : null}

          {isCancelled ? (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Esta orden fue anulada y no puede volver al flujo operativo.
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting || isDelivered || isCancelled || !hasChangedStatus
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {shouldShowDeliveryConfirmation ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          ) : (
            <ListChecks className="size-4 shrink-0" aria-hidden="true" />
          )}

          {getSubmitButtonLabel({
            isSubmitting,
            shouldShowDeliveryConfirmation,
            isSelectingDelivered,
          })}
        </button>
      </div>

      {shouldShowDeliveryConfirmation ? (
        <section
          id={deliveryConfirmationId}
          aria-labelledby={`${deliveryConfirmationId}-heading`}
          className="mt-4 rounded-2xl border border-primary/35 bg-primary/10 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/35 bg-surface text-primary">
              <AlertTriangle className="size-4" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h3
                id={`${deliveryConfirmationId}-heading`}
                className="text-sm font-black text-foreground"
              >
                Confirmar entrega de la orden
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Vas a marcar esta orden como entregada. Esta acción cerrará la
                orden y bloqueará la edición directa. Si fue un error, luego
                deberás reabrirla dejando un motivo en el historial operativo.
              </p>

              <button
                type="button"
                onClick={handleCancelDeliveryConfirmation}
                disabled={isSubmitting}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                Cancelar y elegir otro estado
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
    </form>
  );
}

/**
 * Returns the submit button label based on the current status update step.
 */
function getSubmitButtonLabel({
  isSubmitting,
  shouldShowDeliveryConfirmation,
  isSelectingDelivered,
}: {
  isSubmitting: boolean;
  shouldShowDeliveryConfirmation: boolean;
  isSelectingDelivered: boolean;
}): string {
  if (isSubmitting) {
    return "Actualizando...";
  }

  if (shouldShowDeliveryConfirmation) {
    return "Sí, marcar como entregada";
  }

  if (isSelectingDelivered) {
    return "Revisar entrega";
  }

  return "Actualizar estado";
}
