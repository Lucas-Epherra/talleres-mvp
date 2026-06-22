"use client";

import { ArrowLeft, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { NotesEditor } from "../../../components/ui/NotesEditor";
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
      <section
        aria-labelledby="create-customer-main-heading"
        className="rounded-[1.1rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-8"
      >
        <div className="border-b border-border pb-5">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Alta de cliente
          </p>

          <h2
            id="create-customer-main-heading"
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
          >
            Datos principales
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cargá la información de contacto del cliente. El teléfono es
            obligatorio porque será el dato principal para identificarlo en el
            flujo operativo del taller.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
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

        <div className="mt-5">
          <NotesEditor
            name="notes"
            label="Notas internas"
            disabled={isLoading}
            maxLength={800}
            placeholder="Ej: Prefiere comunicación por WhatsApp."
          />
        </div>
      </section>

      {state.message ? (
        <p
          id="create-customer-error"
          className="rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:flex sm:flex-row-reverse sm:justify-start">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
        >
          <UserPlus className="size-4 shrink-0" aria-hidden="true" />
          {isLoading ? "Creando..." : "Crear cliente"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          Cancelar
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
    <label
      htmlFor={htmlFor}
      className="block text-sm font-bold text-foreground"
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
  return <p className="text-xs leading-5 text-muted-foreground">{children}</p>;
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
      className="h-12 w-full rounded-xl border border-border-strong bg-surface-muted/85 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}
