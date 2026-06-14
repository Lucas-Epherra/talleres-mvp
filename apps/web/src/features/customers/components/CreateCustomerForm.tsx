"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { createCustomer } from "../customers.client";
import {
  readCustomerFormDraft,
  validateCustomerFormDraft,
} from "../utils/customer-form";

type FormStatus = "idle" | "loading" | "error";

type CreateCustomerFormState = {
  status: FormStatus;
  message: string | null;
};

/**
 * Interactive customer creation form.
 *
 * This is intentionally a Client Component because it handles form submission,
 * loading state, validation feedback and client-side redirection after creation.
 */
export function CreateCustomerForm() {
  const router = useRouter();

  const [state, setState] = useState<CreateCustomerFormState>({
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

    setState({
      status: "loading",
      message: null,
    });

    try {
      await createCustomer({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email ?? undefined,
        address: data.address ?? undefined,
        notes: data.notes ?? undefined,
      });

      router.replace("/customers");
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
      className="space-y-6"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={state.message ? "create-customer-error" : undefined}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <Label htmlFor="fullName">Nombre completo *</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="María González"
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
            disabled={isLoading}
            maxLength={120}
            autoComplete="street-address"
          />
        </Field>
      </div>

      <Field>
        <Label htmlFor="notes">Notas internas</Label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Preferencias, datos útiles o aclaraciones del cliente..."
          disabled={isLoading}
          maxLength={800}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </Field>

      {state.message ? (
        <p
          id="create-customer-error"
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
          {isLoading ? "Creando..." : "Crear cliente"}
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
  type?: "text" | "email" | "tel";
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  inputMode?: "text" | "tel" | "email";
  autoComplete?: string;
};

/**
 * Shared text input for customer forms.
 */
function Input({
  id,
  name,
  type = "text",
  placeholder,
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
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      inputMode={inputMode}
      autoComplete={autoComplete}
      className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}