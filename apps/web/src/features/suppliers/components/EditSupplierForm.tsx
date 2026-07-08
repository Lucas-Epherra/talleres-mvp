"use client";

import { ArrowLeft, Handshake, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useId,
  useMemo,
  useState,
} from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { updateSupplier } from "../suppliers.client";
import type { Supplier, UpdateSupplierInput } from "../types";

type EditSupplierFormProps = {
  supplier: Supplier;
};

/**
 * Form used to edit supplier identity, contact data and category assignments.
 */
export function EditSupplierForm({ supplier }: EditSupplierFormProps) {
  const router = useRouter();
  const errorId = useId();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoriesText, setCategoriesText] = useState(() =>
    supplier.categories.map((category) => category.name).join(", "),
  );
  const categoryNames = useMemo(
    () => parseCategoryNames(categoriesText),
    [categoriesText],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = getRequiredString(formData, "name");

    if (!name) {
      setErrorMessage("El nombre del proveedor es obligatorio.");
      return;
    }

    if (categoryNames.length > 8) {
      setErrorMessage("Podés asignar hasta 8 categorías por proveedor.");
      return;
    }

    const input: UpdateSupplierInput = {
      name,
      contactName: getNullableString(formData, "contactName"),
      phone: getNullableString(formData, "phone"),
      email: getNullableString(formData, "email"),
      taxId: getNullableString(formData, "taxId"),
      address: getNullableString(formData, "address"),
      notes: getNullableString(formData, "notes"),
      categoryNames,
    };

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await updateSupplier(supplier.id, input);

      router.push(`/suppliers/${supplier.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="mt-6 space-y-5 sm:mt-8 sm:space-y-8"
      onSubmit={handleSubmit}
      aria-describedby={errorMessage ? errorId : undefined}
      noValidate
    >
      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
        >
          {errorMessage}
        </p>
      ) : null}

      <FormSection
        headingId="supplier-main-data-heading"
        eyebrow="Proveedor"
        title="Datos principales"
        description="Editá la ficha del proveedor sin afectar compras, pagos ni historial ya registrado."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="name">Nombre del proveedor *</FieldLabel>
            <Input
              id="name"
              name="name"
              required
              maxLength={120}
              disabled={isSubmitting}
              defaultValue={supplier.name}
              placeholder="Ej: Repuestos San Martín"
              autoComplete="organization"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="contactName">Contacto</FieldLabel>
            <Input
              id="contactName"
              name="contactName"
              maxLength={120}
              disabled={isSubmitting}
              defaultValue={supplier.contactName ?? ""}
              placeholder="Ej: Martín Gómez"
              autoComplete="name"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
            <Input
              id="phone"
              name="phone"
              maxLength={40}
              disabled={isSubmitting}
              defaultValue={supplier.phone ?? ""}
              placeholder="2983 123456"
              autoComplete="tel"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              maxLength={180}
              disabled={isSubmitting}
              defaultValue={supplier.email ?? ""}
              placeholder="ventas@proveedor.com"
              autoComplete="email"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="taxId">CUIT / identificación fiscal</FieldLabel>
            <Input
              id="taxId"
              name="taxId"
              maxLength={50}
              disabled={isSubmitting}
              defaultValue={supplier.taxId ?? ""}
              placeholder="20-12345678-9"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="address">Dirección</FieldLabel>
            <Input
              id="address"
              name="address"
              maxLength={200}
              disabled={isSubmitting}
              defaultValue={supplier.address ?? ""}
              placeholder="Av. San Martín 123"
              autoComplete="street-address"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        headingId="supplier-categories-heading"
        eyebrow="Clasificación"
        title="Categorías"
        description="Separá categorías con coma. Al guardar, reemplazamos la asignación actual del proveedor."
      >
        <Field>
          <FieldLabel htmlFor="categoryNames">Categorías</FieldLabel>
          <Input
            id="categoryNames"
            name="categoryNames"
            value={categoriesText}
            onChange={setCategoriesText}
            maxLength={300}
            disabled={isSubmitting}
            placeholder="Frenos, Suspensión, Electricidad"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            {categoryNames.length} categoría{categoryNames.length === 1 ? "" : "s"} preparada{categoryNames.length === 1 ? "" : "s"}.
          </p>
        </Field>
      </FormSection>

      <FormSection
        headingId="supplier-notes-heading"
        eyebrow="Notas"
        title="Notas internas"
      >
        <Field>
          <FieldLabel htmlFor="notes">Notas</FieldLabel>
          <TextArea
            id="notes"
            name="notes"
            rows={5}
            maxLength={800}
            disabled={isSubmitting}
            defaultValue={supplier.notes ?? ""}
            placeholder="Ej: Prefiere pedidos por WhatsApp. Suele entregar en el día."
          />
        </Field>
      </FormSection>

      <div className="grid gap-3 sm:flex sm:flex-row-reverse sm:justify-start">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
        >
          <Save className="size-4 shrink-0" aria-hidden="true" />
          {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          Cancelar
        </button>
      </div>
    </form>
  );
}

type FormSectionProps = {
  headingId: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * Shared light-mode section wrapper for supplier forms.
 */
function FormSection({
  headingId,
  eyebrow,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-[1.1rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-6"
    >
      <div className="border-b border-border pb-5">
        <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          <Handshake className="size-4 shrink-0" aria-hidden="true" />
          {eyebrow}
        </p>

        <h2
          id={headingId}
          className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground sm:text-xl"
        >
          {title}
        </h2>

        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-5 sm:mt-6">{children}</div>
    </section>
  );
}

function Field({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-bold text-foreground">
      {children}
    </label>
  );
}

type InputProps = {
  id: string;
  name: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  type?: string;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
};

function Input({
  id,
  name,
  placeholder,
  value,
  onChange,
  defaultValue,
  type = "text",
  maxLength,
  required,
  disabled,
  autoComplete,
}: InputProps) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      defaultValue={defaultValue}
      placeholder={placeholder}
      maxLength={maxLength}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
      className="h-11 w-full rounded-xl border border-border-strong bg-surface-muted/85 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
    />
  );
}

type TextAreaProps = {
  id: string;
  name: string;
  rows: number;
  placeholder: string;
  defaultValue?: string;
  maxLength?: number;
  disabled?: boolean;
};

function TextArea({
  id,
  name,
  rows,
  placeholder,
  defaultValue,
  maxLength,
  disabled,
}: TextAreaProps) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      placeholder={placeholder}
      defaultValue={defaultValue}
      maxLength={maxLength}
      disabled={disabled}
      className="w-full resize-y rounded-xl border border-border-strong bg-surface-muted/85 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
    />
  );
}

function getRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function parseCategoryNames(value: string): string[] {
  return [...new Set(
    value
      .split(",")
      .map((categoryName) => categoryName.trim())
      .filter(Boolean),
  )];
}
