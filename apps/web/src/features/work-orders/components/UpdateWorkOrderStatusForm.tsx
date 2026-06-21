"use client";

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
 * Leaf client form used to update a work order status from the vehicle profile.
 *
 * Delivered orders are intentionally locked in the UI because the backend does
 * not allow moving a delivered order back to a previous state.
 */
export function UpdateWorkOrderStatusForm({
  workOrderId,
  currentStatus,
}: UpdateWorkOrderStatusFormProps) {
  const router = useRouter();
  const selectId = useId();
  const errorId = useId();

  const [selectedStatus, setSelectedStatus] =
    useState<WorkOrderStatus>(currentStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDelivered = currentStatus === "DELIVERED";
  const hasChangedStatus = selectedStatus !== currentStatus;

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

    if (isSubmitting || isDelivered) {
      return;
    }

    if (!hasChangedStatus) {
      setErrorMessage("Seleccioná un estado diferente al actual.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await updateWorkOrderStatus(workOrderId, {
        status: selectedStatus,
      });

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
            disabled={isSubmitting || isDelivered}
            onChange={(event) =>
              setSelectedStatus(event.target.value as WorkOrderStatus)
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
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isDelivered || !hasChangedStatus}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Actualizando..." : "Actualizar estado"}
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
