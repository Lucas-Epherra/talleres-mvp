"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { ApiError } from "../../../lib/api";
import { createWorkOrder } from "../work-orders.client";
import type { CreateWorkOrderInput } from "../types";

type CreateWorkOrderFormProps = {
  vehicleId: string;
};

/**
 * Form used to create a work order from a vehicle profile.
 *
 * This is intentionally a leaf Client Component because it owns form state,
 * submit handling, loading state and client-side navigation after mutation.
 */
export function CreateWorkOrderForm({ vehicleId }: CreateWorkOrderFormProps) {
  const router = useRouter();
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

    const input: CreateWorkOrderInput = {
      vehicleId,
      reportedIssue,
      diagnosis: getOptionalString(formData, "diagnosis"),
      workDone: getOptionalString(formData, "workDone"),
      partsUsed: getOptionalString(formData, "partsUsed"),
      entryMileage: getOptionalNumber(formData, "entryMileage"),
      laborCost: getOptionalNumber(formData, "laborCost"),
      partsCost: getOptionalNumber(formData, "partsCost"),
      estimatedTotal: getOptionalNumber(formData, "estimatedTotal"),
      finalTotal: getOptionalNumber(formData, "finalTotal"),
      notes: getOptionalString(formData, "notes"),
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
          iniciaste el flujo.
        </p>

        <div className="mt-5">
          <label
            htmlFor="vehicleId"
            className="text-sm font-medium text-slate-300"
          >
            ID del vehículo
          </label>
          <input
            id="vehicleId"
            name="vehicleId"
            type="text"
            value={vehicleId}
            readOnly
            className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-300 outline-none"
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
              placeholder="Ej: Pastillas delanteras, líquido de freno, bujes."
              className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
            />
          </div>
        </div>
      </section>

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

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <MoneyInput
            id="laborCost"
            name="laborCost"
            label="Costo mano de obra"
            placeholder="45000"
          />
          <MoneyInput
            id="partsCost"
            name="partsCost"
            label="Costo repuestos"
            placeholder="80000"
          />
          <MoneyInput
            id="estimatedTotal"
            name="estimatedTotal"
            label="Total estimado"
            placeholder="125000"
          />
          <MoneyInput
            id="finalTotal"
            name="finalTotal"
            label="Total final"
            placeholder="125000"
          />
        </div>
      </section>

      <section
        aria-labelledby="work-order-notes-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
      >
        <h2
          id="work-order-notes-heading"
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
            placeholder="Observaciones internas del taller."
            className="mt-2 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
          />
        </div>
      </section>

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

type MoneyInputProps = {
  id: string;
  name: string;
  label: string;
  placeholder: string;
};

/**
 * Numeric money input used by the create work order form.
 */
function MoneyInput({ id, name, label, placeholder }: MoneyInputProps) {
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
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
      />
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
 *
 * Empty strings are converted to undefined so JSON.stringify omits them from
 * the request payload.
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
 *
 * Empty values are omitted from the request payload. Invalid numeric values are
 * also omitted because browser number inputs already handle the main validation.
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