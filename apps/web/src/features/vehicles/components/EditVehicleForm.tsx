"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { ApiError } from "../../../lib/api";
import { updateVehicle } from "../vehicles.client";
import type { UpdateVehicleInput, VehicleProfile } from "../types";

type EditVehicleFormProps = {
  profile: VehicleProfile;
};

type FormStatus = "idle" | "loading" | "error";

type EditVehicleFormState = {
  status: FormStatus;
  message: string | null;
};

/**
 * Interactive form used to edit vehicle data from its profile.
 *
 * This is a leaf Client Component because it owns submit handling, mutation
 * state, accessible error rendering and navigation after a successful update.
 */
export function EditVehicleForm({ profile }: EditVehicleFormProps) {
  const router = useRouter();
  const errorId = useId();

  const { vehicle, customer } = profile;

  const [state, setState] = useState<EditVehicleFormState>({
    status: "idle",
    message: null,
  });

  const isLoading = state.status === "loading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const licensePlate = getRequiredString(formData, "licensePlate").toUpperCase();
    const brand = getRequiredString(formData, "brand");
    const model = getRequiredString(formData, "model");

    if (!licensePlate || !brand || !model) {
      setState({
        status: "error",
        message: "Patente, marca y modelo son obligatorios.",
      });

      return;
    }

    const input: UpdateVehicleInput = {
      licensePlate,
      brand,
      model,
      year: getNullableNumber(formData, "year"),
      mileage: getNullableNumber(formData, "mileage"),
      notes: getNullableString(formData, "notes"),
    };

    try {
      setState({
        status: "loading",
        message: null,
      });

      await updateVehicle(vehicle.id, input);

      router.push(`/vehicles/${vehicle.id}`);
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: getSubmitErrorMessage(error),
      });
    }
  }

  return (
    <form
      className="space-y-8"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={state.message ? errorId : undefined}
    >
      <section
        aria-labelledby="edit-vehicle-context-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8"
      >
        <h2
          id="edit-vehicle-context-heading"
          className="text-lg font-semibold text-white"
        >
          Contexto de la ficha
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Esta pantalla edita solamente los datos del vehículo. El cliente
          asociado se mantiene sin cambios para evitar modificar la titularidad
          desde un flujo operativo.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ReadOnlyDetail label="Cliente" value={customer.fullName} />
          <ReadOnlyDetail
            label="Teléfono"
            value={customer.phone ?? "Sin teléfono"}
          />
          <ReadOnlyDetail label="Email" value={customer.email ?? "Sin email"} />
        </div>
      </section>

      <section
        aria-labelledby="edit-vehicle-data-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8"
      >
        <h2
          id="edit-vehicle-data-heading"
          className="text-lg font-semibold text-white"
        >
          Datos del vehículo
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field>
            <Label htmlFor="licensePlate">Patente *</Label>
            <Input
              id="licensePlate"
              name="licensePlate"
              placeholder="AD999ZZ"
              defaultValue={vehicle.licensePlate}
              disabled={isLoading}
              required
            />
          </Field>

          <Field>
            <Label htmlFor="brand">Marca *</Label>
            <Input
              id="brand"
              name="brand"
              placeholder="Renault"
              defaultValue={vehicle.brand}
              disabled={isLoading}
              required
            />
          </Field>

          <Field>
            <Label htmlFor="model">Modelo *</Label>
            <Input
              id="model"
              name="model"
              placeholder="Kangoo"
              defaultValue={vehicle.model}
              disabled={isLoading}
              required
            />
          </Field>

          <Field>
            <Label htmlFor="year">Año</Label>
            <Input
              id="year"
              name="year"
              type="number"
              placeholder="2018"
              defaultValue={toInputValue(vehicle.year)}
              disabled={isLoading}
            />
          </Field>

          <Field>
            <Label htmlFor="mileage">Kilometraje actual</Label>
            <Input
              id="mileage"
              name="mileage"
              type="number"
              placeholder="142000"
              defaultValue={toInputValue(vehicle.mileage)}
              disabled={isLoading}
            />
          </Field>
        </div>

        <Field className="mt-5">
          <Label htmlFor="notes">Notas del vehículo</Label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Estado general, detalles conocidos, observaciones..."
            defaultValue={vehicle.notes ?? ""}
            disabled={isLoading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </Field>
      </section>

      {state.message ? (
        <p
          id={errorId}
          className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/vehicles/${vehicle.id}`}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Guardando cambios..." : "Guardar cambios"}
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
 * Compact read-only metadata item for the vehicle edit context.
 */
function ReadOnlyDetail({ label, value }: ReadOnlyDetailProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}

type FieldProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Form field wrapper.
 */
function Field({ children, className }: FieldProps) {
  return <div className={className ? `space-y-2 ${className}` : "space-y-2"}>{children}</div>;
}

type LabelProps = {
  htmlFor: string;
  children: React.ReactNode;
};

/**
 * Accessible form label.
 */
function Label({ htmlFor, children }: LabelProps) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-200">
      {children}
    </label>
  );
}

type InputProps = {
  id: string;
  name: string;
  type?: "text" | "number";
  placeholder?: string;
  defaultValue?: string | number;
  disabled?: boolean;
  required?: boolean;
};

/**
 * Shared input for the edit vehicle form.
 */
function Input({
  id,
  name,
  type = "text",
  placeholder,
  defaultValue,
  disabled,
  required,
}: InputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      min={type === "number" ? 0 : undefined}
      step={type === "number" ? 1 : undefined}
      placeholder={placeholder}
      defaultValue={defaultValue}
      disabled={disabled}
      required={required}
      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

/**
 * Converts nullable numeric values into safe input default values.
 */
function toInputValue(value: number | null): number | undefined {
  return value === null ? undefined : value;
}

/**
 * Reads and trims a string field from form data.
 */
function getRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/**
 * Reads an editable nullable string from form data.
 *
 * Empty values become null so users can clear optional vehicle notes.
 */
function getNullableString(formData: FormData, key: string): string | null {
  const value = getRequiredString(formData, key);

  return value.length > 0 ? value : null;
}

/**
 * Reads an editable nullable number from form data.
 *
 * Empty values become null so users can clear optional numeric vehicle fields.
 */
function getNullableNumber(formData: FormData, key: string): number | null {
  const value = getRequiredString(formData, key);

  if (!value) {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
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

  return "No se pudo actualizar el vehículo.";
}