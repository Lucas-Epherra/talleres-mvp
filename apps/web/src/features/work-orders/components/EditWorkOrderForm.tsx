"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useMemo, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { formatMileage } from "../../../lib/format";
import { updateWorkOrder } from "../work-orders.client";
import type { UpdateWorkOrderInput, WorkOrder } from "../types";
import { WorkOrderNotesEditor } from "./WorkOrderNotesEditor";
import { WorkOrderPartsEditor } from "./WorkOrderPartsEditor";
import {
  apiMoneyToInputString,
  formatCurrency,
  getWorkOrderPartsTotal,
  parseMoneyInputValue,
  parseWorkOrderNotes,
  parseWorkOrderParts,
  serializeWorkOrderNotes,
  serializeWorkOrderParts,
  validateWorkOrderParts,
  type WorkOrderNoteDraft,
  type WorkOrderPartDraft,
} from "../utils/work-order-form";

type EditWorkOrderFormProps = {
  workOrder: WorkOrder;
};

/**
 * Form used to edit operational information from an existing work order.
 *
 * This is a leaf Client Component because it owns form submission, mutation
 * state, error handling, dynamic parts/notes and client-side navigation after
 * a successful PATCH.
 */
export function EditWorkOrderForm({ workOrder }: EditWorkOrderFormProps) {
  const router = useRouter();
  const errorId = useId();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [laborCost, setLaborCost] = useState(() =>
    apiMoneyToInputString(workOrder.laborCost),
  );
  const [parts, setParts] = useState<WorkOrderPartDraft[]>(() =>
    parseWorkOrderParts(workOrder.partsUsed, workOrder.partsCost),
  );
  const [notes, setNotes] = useState<WorkOrderNoteDraft[]>(() =>
    parseWorkOrderNotes(workOrder.notes),
  );

  const partsCost = useMemo(() => getWorkOrderPartsTotal(parts), [parts]);
  const parsedLaborCost = parseMoneyInputValue(laborCost);
  const hasAnyCost = parsedLaborCost !== null || partsCost > 0;
  const calculatedTotal = (parsedLaborCost ?? 0) + partsCost;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const reportedIssue = getRequiredString(formData, "reportedIssue");
    const partsValidationMessage = validateWorkOrderParts(parts);

    if (!reportedIssue) {
      setErrorMessage("El problema reportado es obligatorio.");
      return;
    }

    if (laborCost.trim().length > 0 && parsedLaborCost === null) {
      setErrorMessage("El costo de mano de obra debe ser un número válido.");
      return;
    }
    
    if (partsValidationMessage) {
      setErrorMessage(partsValidationMessage);
      return;
    }

    const serializedParts = serializeWorkOrderParts(parts);
    const serializedNotes = serializeWorkOrderNotes(notes);

    const input: UpdateWorkOrderInput = {
      reportedIssue,
      diagnosis: getNullableString(formData, "diagnosis"),
      workDone: getNullableString(formData, "workDone"),
      partsUsed: serializedParts,
      entryMileage: getNullableNumber(formData, "entryMileage"),
      laborCost: parsedLaborCost,
      partsCost: partsCost > 0 ? partsCost : null,
      estimatedTotal: hasAnyCost ? calculatedTotal : null,
      finalTotal: hasAnyCost ? calculatedTotal : null,
      notes: serializedNotes,
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
        </div>
      </section>

      <WorkOrderPartsEditor parts={parts} onChange={setParts} />

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

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <MoneyInput
            id="laborCost"
            label="Costo mano de obra"
            value={laborCost}
            onChange={setLaborCost}
            placeholder="45000"
          />

          <ReadOnlyMoney label="Costo repuestos" value={partsCost} />

          <ReadOnlyMoney label="Total automático" value={calculatedTotal} />
        </div>
      </section>

      <WorkOrderNotesEditor notes={notes} onChange={setNotes} />

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
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

/**
 * Controlled money input used by work order forms.
 *
 * It uses the same visual container as read-only cost summaries so the costs
 * section keeps a consistent sheet/card rhythm.
 */
function MoneyInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: MoneyInputProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
      >
        {label}
      </label>

      <input
        id={id}
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-white outline-none transition placeholder:font-normal placeholder:text-slate-600 focus:border-orange-400"
      />
    </div>
  );
}
type ReadOnlyMoneyProps = {
  label: string;
  value: number;
};

/**
 * Read-only money summary used for derived totals.
 */
function ReadOnlyMoney({ label, value }: ReadOnlyMoneyProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-100">
        {formatCurrency(value)}
      </p>
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
 */
function getNullableString(formData: FormData, key: string): string | null {
  const value = getRequiredString(formData, key);

  return value.length > 0 ? value : null;
}

/**
 * Reads an editable optional number from form data.
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
  return getApiErrorMessage(error);
}