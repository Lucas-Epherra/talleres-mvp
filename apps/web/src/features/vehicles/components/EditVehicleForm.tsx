"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { updateVehicle } from "../vehicles.client";
import type { UpdateVehicleInput, VehicleProfile } from "../types";
import {
  readVehicleFormDraft,
  validateVehicleFormDraft,
} from "../utils/vehicle-form";

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

    const draft = readVehicleFormDraft(new FormData(event.currentTarget));
    const validation = validateVehicleFormDraft(draft);

    if (!validation.isValid) {
      setState({
        status: "error",
        message: validation.message,
      });

      return;
    }

    const { data } = validation;

    const input: UpdateVehicleInput = {
      licensePlate: data.licensePlate,
      brand: data.brand,
      model: data.model,
      year: data.year ?? undefined,
      mileage: data.mileage ?? undefined,
      notes: data.notes ?? "",
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
        message: getApiErrorMessage(error),
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
          <ReadOnlyDetail label="Teléfono" value={customer.phone} />
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
              maxLength={20}
              autoCapitalize="characters"
              autoComplete="off"
            />
            <HelpText>
              Podés escribirla con espacios o guiones. Se guardará normalizada
              en mayúsculas.
            </HelpText>
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
              maxLength={80}
              autoComplete="off"
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
              maxLength={80}
              autoComplete="off"
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
              min={1900}
              max={new Date().getFullYear() + 1}
              step={1}
              inputMode="numeric"
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
              min={0}
              max={2_000_000}
              step={1}
              inputMode="numeric"
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
            maxLength={800}
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
  children: ReactNode;
  className?: string;
};

/**
 * Form field wrapper.
 */
function Field({ children, className }: FieldProps) {
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      {children}
    </div>
  );
}

type LabelProps = {
  htmlFor: string;
  children: ReactNode;
};

/**
 * Accessible form label.
 */
function Label({ htmlFor, children }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-slate-200"
    >
      {children}
    </label>
  );
}

type HelpTextProps = {
  children: ReactNode;
};

/**
 * Small helper text for field-level instructions.
 */
function HelpText({ children }: HelpTextProps) {
  return <p className="text-xs leading-5 text-slate-500">{children}</p>;
}

type InputProps = {
  id: string;
  name: string;
  type?: "text" | "number";
  placeholder?: string;
  defaultValue?: string | number;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  inputMode?: "text" | "numeric" | "decimal";
  autoComplete?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
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
  maxLength,
  min,
  max,
  step,
  inputMode,
  autoComplete,
  autoCapitalize,
}: InputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      min={min}
      max={max}
      step={step}
      inputMode={inputMode}
      autoComplete={autoComplete}
      autoCapitalize={autoCapitalize}
      className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

/**
 * Converts nullable numeric values into safe input default values.
 */
function toInputValue(value: number | null): number | undefined {
  return value === null ? undefined : value;
}