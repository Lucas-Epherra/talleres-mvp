"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { ApiError } from "../../../lib/api";
import { formatMileage } from "../../../lib/format";
import { updateWorkOrder } from "../work-orders.client";
import type { UpdateWorkOrderInput, WorkOrder } from "../types";

type EditWorkOrderFormProps = {
  workOrder: WorkOrder;
};

/**
 * Form used to edit operational information from an existing work order.
 *
 * This is a leaf Client Component because it owns form submission, mutation
 * state, error handling and client-side navigation after a successful PATCH.
 */
export function EditWorkOrderForm({ workOrder }: EditWorkOrderFormProps) {
  const router = useRouter();
  const errorId = useId();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const reportedIssue = getRequiredString(formData, "reportedIssue");

    if (!reportedIssue) {
      setErrorMessage("El problema reportado es obligatorio.");
      return;
    }

    const input: UpdateWorkOrderInput = {
      reportedIssue,
      diagnosis: getNullableString(formData, "diagnosis"),
      workDone: getNullableString(formData, "workDone"),
      partsUsed: getNullableString(formData, "partsUsed"),
      entryMileage: getNullableNumber(formData, "entryMileage"),
      laborCost: getNullableNumber(formData, "laborCost"),
      partsCost: getNullableNumber(formData, "partsCost"),
      estimatedTotal: getNullableNumber(formData, "estimatedTotal"),
      finalTotal: getNullableNumber(formData, "finalTotal"),
      notes: getNullableString(formData, "notes"),
    };

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await updateWorkOrder(workOrder.id, input);

      router.push(`/work-orders/${workOrder.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(getSubmitErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="mt-8 space-y-8"
      onSubmit={handleSubmit}
      aria-describedby={errorMessage ? errorId : undefined}
    >
      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {errorMessage}
        </p>
      ) : null}

      <section
        aria-labelledby="edit-work-order-context-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <h2
          id="edit-work-order-context-heading"
          className="text-lg font-semibold text-white"
        >
          Contexto de la orden
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ReadOnlyDetail
            label="Orden"
            value={`#${workOrder.orderNumber.toString()}`}
          />
          <ReadOnlyDetail
            label="Patente"
            value={workOrder.vehicle.licensePlate}
          />
          <ReadOnlyDetail
            label="Vehículo"
            value={`${workOrder.vehicle.brand} ${workOrder.vehicle.model}`}
          />
          <ReadOnlyDetail
            label="Kilometraje actual"
            value={formatMileage(workOrder.vehicle.mileage)}
          />
        </div>

        <p className="mt-5 text-sm leading-6 text-slate-400">
          Esta pantalla edita solamente la información operativa de la orden. El
          estado se cambia desde el flujo específico de estado para mantener las
          responsabilidades separadas.
        </p>
      </section>

      <section
        aria-labelledby="edit-work-order-details-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <h2
          id="edit-work-order-details-heading"
          className="text-lg font-semibold text-white"
        >
          Datos del trabajo
        </h2>

        <div className="mt-6 grid gap-5">
          <div>
            <label
              htmlFor="reportedIssue"
              className="text-sm font-medium text-slate-300"
            >
              Problema reportado *
            </label>
            <textarea
              id="reportedIssue"
              name="reportedIssue"
              required
              rows={4}
              defaultValue={workOrder.reportedIssue}
              placeholder="Ej: El cliente reporta ruido en tren delantero al frenar."
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
            />
          </div>

          <div>
            <label
              htmlFor="entryMileage"
              className="text-sm font-medium text-slate-300"
            >
              Kilometraje de ingreso
            </label>
            <input
              id="entryMileage"
              name="entryMileage"
              type="number"
              min="0"
              step="1"
              defaultValue={toInputValue(workOrder.entryMileage)}
              placeholder="129200"
              className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label
                htmlFor="diagnosis"
                className="text-sm font-medium text-slate-300"
              >
                Diagnóstico
              </label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                rows={4}
                defaultValue={workOrder.diagnosis ?? ""}
                placeholder="Diagnóstico inicial del mecánico."
                className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
              />
            </div>

            <div>
              <label
                htmlFor="workDone"
                className="text-sm font-medium text-slate-300"
              >
                Trabajo realizado
              </label>
              <textarea
                id="workDone"
                name="workDone"
                rows={4}
                defaultValue={workOrder.workDone ?? ""}
                placeholder="Detalle del trabajo realizado."
                className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="partsUsed"
              className="text-sm font-medium text-slate-300"
            >
              Repuestos usados
            </label>
            <textarea
              id="partsUsed"
              name="partsUsed"
              rows={3}
              defaultValue={workOrder.partsUsed ?? ""}
              placeholder="Ej: Pastillas delanteras, líquido de freno, bujes."
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
            />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="edit-work-order-costs-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <h2
          id="edit-work-order-costs-heading"
          className="text-lg font-semibold text-white"
        >
          Costos
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <MoneyInput
            id="laborCost"
            name="laborCost"
            label="Costo mano de obra"
            placeholder="45000"
            defaultValue={toInputValue(workOrder.laborCost)}
          />
          <MoneyInput
            id="partsCost"
            name="partsCost"
            label="Costo repuestos"
            placeholder="80000"
            defaultValue={toInputValue(workOrder.partsCost)}
          />
          <MoneyInput
            id="estimatedTotal"
            name="estimatedTotal"
            label="Total estimado"
            placeholder="125000"
            defaultValue={toInputValue(workOrder.estimatedTotal)}
          />
          <MoneyInput
            id="finalTotal"
            name="finalTotal"
            label="Total final"
            placeholder="125000"
            defaultValue={toInputValue(workOrder.finalTotal)}
          />
        </div>
      </section>

      <section
        aria-labelledby="edit-work-order-notes-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <h2
          id="edit-work-order-notes-heading"
          className="text-lg font-semibold text-white"
        >
          Notas internas
        </h2>

        <div className="mt-6">
          <label htmlFor="notes" className="text-sm font-medium text-slate-300">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={workOrder.notes ?? ""}
            placeholder="Observaciones internas del taller."
            className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
          />
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/work-orders/${workOrder.id}`}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

type ReadOnlyDetailProps = {
  label: string;
  value: string;
};

/**
 * Compact read-only detail used to provide order context before editing.
 */
function ReadOnlyDetail({ label, value }: ReadOnlyDetailProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 wrap-break-words text-sm font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}

type MoneyInputProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string | number;
};

/**
 * Numeric money input used by the edit work order form.
 */
function MoneyInput({
  id,
  name,
  label,
  placeholder,
  defaultValue,
}: MoneyInputProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        min="0"
        step="0.01"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
      />
    </div>
  );
}

/**
 * Converts API nullable numeric/string values into safe input default values.
 */
function toInputValue(
  value: number | string | null,
): string | number | undefined {
  if (value === null || value === "") {
    return undefined;
  }

  return value;
}

/**
 * Reads a required string from form data and normalizes whitespace.
 */
function getRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/**
 * Reads an editable optional string from form data.
 *
 * Empty strings become null so the user can clear previously saved optional
 * content from nullable work order fields.
 */
function getNullableString(formData: FormData, key: string): string | null {
  const value = getRequiredString(formData, key);

  return value.length > 0 ? value : null;
}

/**
 * Reads an editable optional number from form data.
 *
 * Empty values become null so the user can clear previously saved optional
 * numeric fields. Invalid values are also treated as null because browser
 * number inputs already provide the primary validation layer.
 */
function getNullableNumber(formData: FormData, key: string): number | null {
  const value = getRequiredString(formData, key);

  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

/**
 * Converts unknown submit errors into a safe user-facing message.
 */
function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo actualizar la orden de trabajo.";
}