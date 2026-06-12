"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, type FormEvent, useState } from "react";
import { ApiError } from "../../../lib/api";
import type { Customer } from "../../customers/types";
import { createVehicle } from "../vehicles.client";
import {
  readVehicleFormDraft,
  validateVehicleFormDraft,
} from "../utils/vehicle-form";

type CreateVehicleFormProps = {
  customers: Customer[];
  defaultCustomerId?: string;
};

type FormStatus = "idle" | "loading" | "error";

type CreateVehicleFormState = {
  status: FormStatus;
  message: string | null;
};

/**
 * Interactive vehicle creation form.
 *
 * Requires an existing customer because vehicles are always associated with a
 * customer in the MVP domain model. When defaultCustomerId is provided, the
 * customer select is preselected but remains editable.
 */
export function CreateVehicleForm({
  customers,
  defaultCustomerId,
}: CreateVehicleFormProps) {
  const router = useRouter();

  const [state, setState] = useState<CreateVehicleFormState>({
    status: "idle",
    message: null,
  });

  const isLoading = state.status === "loading";
  const hasCustomers = customers.length > 0;
  const validCustomerIds = customers.map((customer) => customer.id);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const draft = readVehicleFormDraft(new FormData(event.currentTarget));
    const validation = validateVehicleFormDraft(draft, {
      requireCustomer: true,
      validCustomerIds,
    });

    if (!validation.isValid) {
      setState({
        status: "error",
        message: validation.message,
      });

      return;
    }

    const { data } = validation;

    if (!data.customerId) {
      setState({
        status: "error",
        message: "Seleccioná un cliente para asociar el vehículo.",
      });

      return;
    }

    setState({
      status: "loading",
      message: null,
    });

    try {
      const vehicle = await createVehicle({
        customerId: data.customerId,
        licensePlate: data.licensePlate,
        brand: data.brand,
        model: data.model,
        year: data.year ?? undefined,
        mileage: data.mileage ?? undefined,
        notes: data.notes ?? undefined,
      });

      router.replace(`/vehicles/${vehicle.id}`);
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: getSubmitErrorMessage(error),
      });
    }
  }

  if (!hasCustomers) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold text-white">
          Primero necesitás crear un cliente
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          El vehículo siempre debe estar asociado a un cliente. Creá el cliente
          y después volvé a esta pantalla para cargar su vehículo.
        </p>

        <button
          type="button"
          onClick={() => router.push("/customers/new")}
          className="mt-5 h-11 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400"
        >
          Crear cliente
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={state.message ? "create-vehicle-error" : undefined}
    >
      <Field>
        <Label htmlFor="customerId">Cliente *</Label>

        <select
          id="customerId"
          name="customerId"
          defaultValue={defaultCustomerId ?? ""}
          disabled={isLoading}
          required
          autoComplete="off"
          className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Seleccionar cliente</option>

          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.fullName}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <Label htmlFor="licensePlate">Patente *</Label>
          <Input
            id="licensePlate"
            name="licensePlate"
            placeholder="AD999ZZ"
            disabled={isLoading}
            required
            maxLength={10}
            autoCapitalize="characters"
            autoComplete="off"
          />
        </Field>

        <Field>
          <Label htmlFor="brand">Marca *</Label>
          <Input
            id="brand"
            name="brand"
            placeholder="Renault"
            disabled={isLoading}
            required
            maxLength={60}
            autoComplete="off"
          />
        </Field>

        <Field>
          <Label htmlFor="model">Modelo *</Label>
          <Input
            id="model"
            name="model"
            placeholder="Kangoo"
            disabled={isLoading}
            required
            maxLength={60}
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
            disabled={isLoading}
            min={0}
            max={2_000_000}
            step={1}
            inputMode="numeric"
          />
        </Field>
      </div>

      <Field>
        <Label htmlFor="notes">Notas del vehículo</Label>

        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Estado general, detalles conocidos, observaciones..."
          disabled={isLoading}
          maxLength={800}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </Field>

      {state.message ? (
        <p
          id="create-vehicle-error"
          className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="h-11 rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="h-11 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Creando..." : "Crear vehículo"}
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  children: ReactNode;
};

/**
 * Form field wrapper.
 */
function Field({ children }: FieldProps) {
  return <div className="space-y-2">{children}</div>;
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
 * Shared input for vehicle forms.
 */
function Input({
  id,
  name,
  type = "text",
  placeholder,
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
 * Converts unknown submit errors into a safe user-facing message.
 */
function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo crear el vehículo.";
}