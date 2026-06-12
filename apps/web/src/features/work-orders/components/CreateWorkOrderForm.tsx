"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { ApiError } from "../../../lib/api";
import { createWorkOrder } from "../work-orders.client";
import type { CreateWorkOrderInput } from "../types";
import { WorkOrderNotesEditor } from "./WorkOrderNotesEditor";
import { WorkOrderPartsEditor } from "./WorkOrderPartsEditor";
import {
  createEmptyWorkOrderNote,
  createEmptyWorkOrderPart,
  formatCurrency,
  getWorkOrderPartsTotal,
  parseMoneyInputValue,
  serializeWorkOrderNotes,
  serializeWorkOrderParts,
  validateWorkOrderParts,
  type WorkOrderNoteDraft,
  type WorkOrderPartDraft,
} from "../utils/work-order-form";

type CreateWorkOrderVehicleContext = {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  customerName: string;
  customerPhone: string | null;
};

type CreateWorkOrderFormProps = {
  vehicle: CreateWorkOrderVehicleContext;
};

/**
 * Form used to create a work order from a vehicle profile.
 *
 * This is intentionally a leaf Client Component because it owns form state,
 * submit handling, loading state, dynamic parts/notes and client-side
 * navigation after mutation.
 */
export function CreateWorkOrderForm({ vehicle }: CreateWorkOrderFormProps) {
  const router = useRouter();
  const vehicleId = vehicle.id;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [laborCost, setLaborCost] = useState("");
  const [parts, setParts] = useState<WorkOrderPartDraft[]>([
    createEmptyWorkOrderPart(),
  ]);
  const [notes, setNotes] = useState<WorkOrderNoteDraft[]>([
    createEmptyWorkOrderNote(),
  ]);

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

    const input: CreateWorkOrderInput = {
      vehicleId,
      reportedIssue,
      diagnosis: getOptionalString(formData, "diagnosis"),
      workDone: getOptionalString(formData, "workDone"),
      partsUsed: serializedParts ?? undefined,
      entryMileage: getOptionalNumber(formData, "entryMileage"),
      laborCost: parsedLaborCost ?? undefined,
      partsCost: partsCost > 0 ? partsCost : undefined,
      estimatedTotal: hasAnyCost ? calculatedTotal : undefined,
      finalTotal: hasAnyCost ? calculatedTotal : undefined,
      notes: serializedNotes ?? undefined,
    };

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await createWorkOrder(input);

      router.push(`/vehicles/${vehicleId}`);
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
      aria-describedby={errorMessage ? "create-work-order-error" : undefined}
    >
      {errorMessage ? (
        <p
          id="create-work-order-error"
          role="alert"
          className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {errorMessage}
        </p>
      ) : null}

      <section
        aria-labelledby="selected-vehicle-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <h2
          id="selected-vehicle-heading"
          className="text-lg font-semibold text-white"
        >
          Vehículo seleccionado
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Esta orden se asociará automáticamente al vehículo desde el que
          iniciaste la orden.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ReadOnlyDetail label="Patente" value={vehicle.licensePlate} />

          <ReadOnlyDetail
            label="Vehículo"
            value={`${vehicle.brand} ${vehicle.model}`}
          />

          <ReadOnlyDetail label="Cliente" value={vehicle.customerName} />

          <ReadOnlyDetail
            label="Teléfono"
            value={vehicle.customerPhone ?? "Sin teléfono"}
          />
        </div>
      </section>

      <section
        aria-labelledby="work-order-details-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <h2
          id="work-order-details-heading"
          className="text-lg font-semibold text-white"
        >
          Datos de la orden
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
                placeholder="Detalle del trabajo realizado."
                className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
              />
            </div>
          </div>
        </div>
      </section>

      <WorkOrderPartsEditor parts={parts} onChange={setParts} />

      <section
        aria-labelledby="work-order-costs-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <h2
          id="work-order-costs-heading"
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
        <button
          type="button"
          onClick={() => router.push(`/vehicles/${vehicleId}`)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creando orden..." : "Crear orden de trabajo"}
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
 * Compact read-only detail used to show selected vehicle context before
 * creating a work order.
 */
function ReadOnlyDetail({ label, value }: ReadOnlyDetailProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
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
 * Reads an optional string from form data.
 */
function getOptionalString(
  formData: FormData,
  key: string,
): string | undefined {
  const value = getRequiredString(formData, key);

  return value.length > 0 ? value : undefined;
}

/**
 * Reads an optional number from form data.
 */
function getOptionalNumber(
  formData: FormData,
  key: string,
): number | undefined {
  const value = getRequiredString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
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

  return "No se pudo crear la orden de trabajo.";
}