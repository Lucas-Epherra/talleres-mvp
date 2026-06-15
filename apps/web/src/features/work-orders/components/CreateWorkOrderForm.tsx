"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useMemo, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
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
  const errorId = useId();
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
      aria-describedby={errorMessage ? errorId : undefined}
      noValidate
    >
      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-white"
        >
          {errorMessage}
        </p>
      ) : null}

      <section
        aria-labelledby="selected-vehicle-heading"
        className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03]"
      >
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Nueva orden
        </p>

        <h2
          id="selected-vehicle-heading"
          className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
        >
          Vehículo seleccionado
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
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
        className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03]"
      >
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Diagnóstico inicial
        </p>

        <h2
          id="work-order-details-heading"
          className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
        >
          Datos de la orden
        </h2>

        <div className="mt-6 grid gap-5">
          <div>
            <label
              htmlFor="reportedIssue"
              className="text-sm font-bold text-white"
            >
              Problema reportado *
            </label>

            <textarea
              id="reportedIssue"
              name="reportedIssue"
              required
              rows={4}
              placeholder="Ej: El cliente reporta ruido en tren delantero al frenar."
              className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="entryMileage"
              className="text-sm font-bold text-white"
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
              className="mt-2 h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label
                htmlFor="diagnosis"
                className="text-sm font-bold text-white"
              >
                Diagnóstico
              </label>

              <textarea
                id="diagnosis"
                name="diagnosis"
                rows={4}
                placeholder="Diagnóstico inicial del mecánico."
                className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="workDone" className="text-sm font-bold text-white">
                Trabajo realizado
              </label>

              <textarea
                id="workDone"
                name="workDone"
                rows={4}
                placeholder="Detalle del trabajo realizado."
                className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </section>

      <WorkOrderPartsEditor parts={parts} onChange={setParts} />

      <section
        aria-labelledby="work-order-costs-heading"
        className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03]"
      >
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Presupuesto
        </p>

        <h2
          id="work-order-costs-heading"
          className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
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
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
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
    <div className="rounded-2xl border border-border bg-background/55 p-4 ring-1 ring-white/[0.03]">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-bold text-white">
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
    <div className="rounded-2xl border border-border bg-background/55 p-4 ring-1 ring-white/[0.03]">
      <label
        htmlFor={id}
        className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
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
        className="mt-3 h-10 w-full rounded-xl border border-border-strong bg-background/70 px-3 text-sm font-bold text-white outline-none transition placeholder:font-normal placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
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
    <div className="rounded-2xl border border-border bg-background/55 p-4 ring-1 ring-white/[0.03]">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {label}
      </p>

      <p className="mt-2 font-display text-lg font-black text-white">
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
  return getApiErrorMessage(error);
}