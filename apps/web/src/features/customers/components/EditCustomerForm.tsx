"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import { ApiError } from "../../../lib/api";
import { updateCustomer } from "../customers.client";
import type { Customer, UpdateCustomerInput } from "../types";

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

    const formData = new FormData(event.currentTarget);
    const fullName = getRequiredString(formData, "fullName");

    if (!fullName) {
      setState({
        status: "error",
        message: "El nombre del cliente es obligatorio.",
      });

      return;
    }

    const input: UpdateCustomerInput = {
      fullName,
      phone: getNullableString(formData, "phone"),
      email: getNullableString(formData, "email"),
      address: getNullableString(formData, "address"),
      notes: getNullableString(formData, "notes"),
    };

    try {
      setState({
        status: "loading",
        message: null,
      });

      await updateCustomer(customer.id, input);

      router.push("/customers");
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
        aria-labelledby="edit-customer-data-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8"
      >
        <h2
          id="edit-customer-data-heading"
          className="text-lg font-semibold text-white"
        >
          Datos del cliente
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Actualizá la información de contacto y las notas internas del cliente.
          Los vehículos asociados no se modifican desde esta pantalla.
        </p>

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
            />
          </Field>

          <Field>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="2983 654321"
              defaultValue={customer.phone ?? ""}
              disabled={isLoading}
            />
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
          href="/customers"
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

type FieldProps = {
  children: ReactNode;
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
  type?: "text" | "email";
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
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
      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
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
 * Empty values become null so users can clear optional customer fields.
 */
function getNullableString(formData: FormData, key: string): string | null {
  const value = getRequiredString(formData, key);

  return value.length > 0 ? value : null;
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

  return "No se pudo actualizar el cliente.";
}