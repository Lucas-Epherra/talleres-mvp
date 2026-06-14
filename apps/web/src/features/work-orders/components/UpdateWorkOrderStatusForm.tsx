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
      className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
      onSubmit={handleSubmit}
      aria-describedby={errorMessage ? errorId : undefined}
    >
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
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
            className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm font-medium text-white outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {availableStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {isDelivered ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Esta orden ya fue entregada y no puede volver a estados anteriores.
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || isDelivered || !hasChangedStatus}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Actualizando..." : "Actualizar estado"}
        </button>
      </div>

      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}