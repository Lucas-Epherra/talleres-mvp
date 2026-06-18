"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { NotesEditor } from "../../../components/ui/NotesEditor";
import { getApiErrorMessage } from "../../../lib/api";
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
        message: getApiErrorMessage(error),
      });
    }
  }

  if (!hasCustomers) {
    return (
      <section className="relative overflow-hidden rounded-[1.35rem] border border-dashed border-border-strong bg-surface/75 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3">
        <div
          aria-hidden="true"
          className="absolute right-0 top-0 h-28 w-28 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-2xl"
        />

        <div className="relative">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Vehículos
          </p>

          <h2 className="mt-3 font-display text-xl font-black uppercase tracking-[0.02em] text-white">
            Primero necesitás crear un cliente
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            El vehículo siempre debe estar asociado a un cliente. Creá el
            cliente y después volvé a esta pantalla para cargar su vehículo.
          </p>

          <button
            type="button"
            onClick={() => router.push("/customers/new")}
            className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover"
          >
            Crear cliente
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={state.message ? "create-vehicle-error" : undefined}
    >
      <section
        aria-labelledby="create-vehicle-main-heading"
        className="rounded-[1.1rem] border border-border bg-surface/85 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-8"
      >
        <div className="border-b border-border pb-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Alta de vehículo
          </p>

          <h2
            id="create-vehicle-main-heading"
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
          >
            Datos principales
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cargá la identificación del vehículo y vinculalo con un cliente del
            taller.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <Field>
            <Label htmlFor="customerId">Cliente *</Label>

            <select
              id="customerId"
              name="customerId"
              defaultValue={defaultCustomerId ?? ""}
              disabled={isLoading}
              required
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm font-medium text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Seleccionar cliente</option>

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullName} · {customer.phone}
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
                maxLength={20}
                autoCapitalize="characters"
                autoComplete="off"
              />
              <HelpText>
                Podés escribirla con espacios o guiones. Se guardará
                normalizada en mayúsculas.
              </HelpText>
            </Field>

            <Field>
              <Label htmlFor="brand">Marca *</Label>
              <Input
                id="brand"
                name="brand"
                placeholder="Renault"
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

          <NotesEditor
            name="notes"
            label="Notas del vehículo"
            disabled={isLoading}
            maxLength={800}
            placeholder="Ej: Tiene un golpe leve en la puerta derecha."
          />
        </div>
      </section>

      {state.message ? (
        <p
          id="create-vehicle-error"
          className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-red-100"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:flex sm:flex-row-reverse sm:justify-start">
        <button
          type="submit"
          disabled={isLoading}
          className="h-12 rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
        >
          {isLoading ? "Creando..." : "Crear vehículo"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="h-12 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
        >
          Cancelar
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
    <label htmlFor={htmlFor} className="block text-sm font-bold text-white">
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
  return <p className="text-xs leading-5 text-muted-foreground">{children}</p>;
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
      className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}