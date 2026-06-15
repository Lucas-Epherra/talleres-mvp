"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { updateCustomer } from "../customers.client";
import type { Customer, UpdateCustomerInput } from "../types";
import {
  readCustomerFormDraft,
  validateCustomerFormDraft,
} from "../utils/customer-form";

type EditCustomerFormProps = {
  customer: Customer;
};

type FormStatus = "idle" | "loading" | "error";

type EditCustomerFormState = {
  status: FormStatus;
  message: string | null;
};

/**
 * Interactive form used to edit customer data.
 *
 * This is a leaf Client Component because it owns form submission, mutation
 * state, accessible error rendering and client-side navigation after update.
 */
export function EditCustomerForm({ customer }: EditCustomerFormProps) {
  const router = useRouter();
  const errorId = useId();

  const [state, setState] = useState<EditCustomerFormState>({
    status: "idle",
    message: null,
  });

  const isLoading = state.status === "loading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const draft = readCustomerFormDraft(new FormData(event.currentTarget));
    const validation = validateCustomerFormDraft(draft);

    if (!validation.isValid) {
      setState({
        status: "error",
        message: validation.message,
      });

      return;
    }

    const { data } = validation;

    const input: UpdateCustomerInput = {
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      address: data.address,
      notes: data.notes,
    };

    try {
      setState({
        status: "loading",
        message: null,
      });

      await updateCustomer(customer.id, input);

      router.push(`/customers/${customer.id}`);
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
        aria-labelledby="edit-customer-data-heading"
        className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8"
      >
        <div className="border-b border-border pb-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Cliente
          </p>

          <h2
            id="edit-customer-data-heading"
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
          >
            Datos del cliente
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Actualizá la información de contacto y las notas internas del
            cliente. Los vehículos asociados no se modifican desde esta
            pantalla.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field>
            <Label htmlFor="fullName">Nombre completo *</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="María González"
              defaultValue={customer.fullName}
              disabled={isLoading}
              required
              maxLength={80}
              autoComplete="name"
            />
          </Field>

          <Field>
            <Label htmlFor="phone">Teléfono *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="2983 654321"
              defaultValue={customer.phone}
              disabled={isLoading}
              required
              maxLength={18}
              inputMode="tel"
              autoComplete="tel"
            />
            <HelpText>
              Obligatorio. Formato esperado: 10 dígitos nacionales. Ej: 2983
              654321.
            </HelpText>
          </Field>

          <Field>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="cliente@email.com"
              defaultValue={customer.email ?? ""}
              disabled={isLoading}
              maxLength={254}
              inputMode="email"
              autoComplete="email"
            />
          </Field>

          <Field>
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              name="address"
              placeholder="Belgrano 850"
              defaultValue={customer.address ?? ""}
              disabled={isLoading}
              maxLength={120}
              autoComplete="street-address"
            />
          </Field>
        </div>

        <Field className="mt-5">
          <Label htmlFor="notes">Notas internas</Label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder="Preferencias, datos útiles o aclaraciones del cliente..."
            defaultValue={customer.notes ?? ""}
            disabled={isLoading}
            maxLength={800}
            className="w-full rounded-xl border border-border-strong bg-background/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </Field>
      </section>

      {state.message ? (
        <p
          id={errorId}
          className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-red-100"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/customers/${customer.id}`}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-white transition hover:border-primary/60 hover:bg-surface-elevated"
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(214,40,40,0.22)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Guardando cambios..." : "Guardar cambios"}
        </button>
      </div>
    </form>
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
  type?: "text" | "email" | "tel";
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  inputMode?: "text" | "tel" | "email";
  autoComplete?: string;
};

/**
 * Shared input for the edit customer form.
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
  inputMode,
  autoComplete,
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
      inputMode={inputMode}
      autoComplete={autoComplete}
      className="h-12 w-full rounded-xl border border-border-strong bg-background/70 px-4 text-sm text-white outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}