"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError } from "../../../lib/api";
import type { Customer } from "../../customers/types";
import { createVehicle } from "../vehicles.client";

type CreateVehicleFormProps = {
  customers: Customer[];
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
 * customer in the MVP domain model.
 */
export function CreateVehicleForm({ customers }: CreateVehicleFormProps) {
  const router = useRouter();

  const [state, setState] = useState<CreateVehicleFormState>({
    status: "idle",
    message: null,
  });

  const isLoading = state.status === "loading";
  const hasCustomers = customers.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const customerId = getStringValue(formData, "customerId");
    const licensePlate = getStringValue(formData, "licensePlate");
    const brand = getStringValue(formData, "brand");
    const model = getStringValue(formData, "model");
    const year = getOptionalNumberValue(formData, "year");
    const mileage = getOptionalNumberValue(formData, "mileage");
    const notes = getOptionalStringValue(formData, "notes");

    if (!customerId || !licensePlate || !brand || !model) {
      setState({
        status: "error",
        message: "Cliente, patente, marca y modelo son obligatorios.",
      });

      return;
    }

    setState({
      status: "loading",
      message: null,
    });

    try {
      const vehicle = await createVehicle({
        customerId,
        licensePlate,
        brand,
        model,
        year,
        mileage,
        notes,
      });

      router.replace(`/vehicles/${vehicle.id}`);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo crear el vehículo.";

      setState({
        status: "error",
        message,
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
        <Label htmlFor="customerId">Cliente</Label>
        <select
          id="customerId"
          name="customerId"
          disabled={isLoading}
          required
          className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
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
          <Label htmlFor="licensePlate">Patente</Label>
          <Input
            id="licensePlate"
            name="licensePlate"
            placeholder="AD999ZZ"
            disabled={isLoading}
            required
          />
        </Field>

        <Field>
          <Label htmlFor="brand">Marca</Label>
          <Input
            id="brand"
            name="brand"
            placeholder="Renault"
            disabled={isLoading}
            required
          />
        </Field>

        <Field>
          <Label htmlFor="model">Modelo</Label>
          <Input
            id="model"
            name="model"
            placeholder="Kangoo"
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
            disabled={isLoading}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
  children: React.ReactNode;
};

/**
 * Form field wrapper.
 */
function Field({ children }: FieldProps) {
  return <div className="space-y-2">{children}</div>;
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
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
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
}: InputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      min={type === "number" ? 0 : undefined}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

function getStringValue(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function getOptionalStringValue(
  formData: FormData,
  key: string,
): string | undefined {
  const value = getStringValue(formData, key);

  return value.length > 0 ? value : undefined;
}

function getOptionalNumberValue(
  formData: FormData,
  key: string,
): number | undefined {
  const value = getStringValue(formData, key);

  if (!value) {
    return undefined;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : undefined;
}