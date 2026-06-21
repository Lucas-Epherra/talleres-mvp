"use client";

import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useId,
  useMemo,
  useState,
} from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { createWorkOrder } from "../work-orders.client";
import type { CreateWorkOrderInput } from "../types";
import { WorkOrderNotesEditor } from "./WorkOrderNotesEditor";
import { WorkOrderPartsEditor } from "./WorkOrderPartsEditor";
import {
  createEmptyWorkOrderNote,
  createEmptyWorkOrderPart,
  formatCurrency,
  getWorkOrderPartsTotal,
  parseMoneyInputValue,
  serializeWorkOrderNotes,
  serializeWorkOrderParts,
  validateWorkOrderParts,
  type WorkOrderNoteDraft,
  type WorkOrderPartDraft,
} from "../utils/work-order-form";

type CreateWorkOrderVehicleContext = {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  customerName: string;
  customerPhone: string | null;
};

type CreateWorkOrderFormProps = {
  vehicle: CreateWorkOrderVehicleContext;
};

/**
 * Form used to create a work order from a vehicle profile.
 *
 * This is intentionally a leaf Client Component because it owns form state,
 * submit handling, loading state, dynamic parts/notes and client-side
 * navigation after mutation.
 */
export function CreateWorkOrderForm({ vehicle }: CreateWorkOrderFormProps) {
  const router = useRouter();
  const errorId = useId();
  const vehicleId = vehicle.id;

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [laborCost, setLaborCost] = useState("");
  const [parts, setParts] = useState<WorkOrderPartDraft[]>([
    createEmptyWorkOrderPart(),
  ]);
  const [notes, setNotes] = useState<WorkOrderNoteDraft[]>([
    createEmptyWorkOrderNote(),
  ]);

  const partsCost = useMemo(() => getWorkOrderPartsTotal(parts), [parts]);
  const parsedLaborCost = parseMoneyInputValue(laborCost);
  const hasAnyCost = parsedLaborCost !== null || partsCost > 0;
  const calculatedTotal = (parsedLaborCost ?? 0) + partsCost;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const reportedIssue = getRequiredString(formData, "reportedIssue");
    const partsValidationMessage = validateWorkOrderParts(parts);

    if (!reportedIssue) {
      setErrorMessage("El problema reportado es obligatorio.");
      return;
    }

    if (laborCost.trim().length > 0 && parsedLaborCost === null) {
      setErrorMessage("El costo de mano de obra debe ser un número válido.");
      return;
    }

    if (partsValidationMessage) {
      setErrorMessage(partsValidationMessage);
      return;
    }

    const serializedParts = serializeWorkOrderParts(parts);
    const serializedNotes = serializeWorkOrderNotes(notes);

    const input: CreateWorkOrderInput = {
      vehicleId,
      reportedIssue,
      diagnosis: getOptionalString(formData, "diagnosis"),
      workDone: getOptionalString(formData, "workDone"),
      partsUsed: serializedParts ?? undefined,
      entryMileage: getOptionalNumber(formData, "entryMileage"),
      laborCost: parsedLaborCost ?? undefined,
      partsCost: partsCost > 0 ? partsCost : undefined,
      estimatedTotal: hasAnyCost ? calculatedTotal : undefined,
      finalTotal: hasAnyCost ? calculatedTotal : undefined,
      notes: serializedNotes ?? undefined,
    };

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await createWorkOrder(input);

      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(getSubmitErrorMessage(error));
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
        headingId="selected-vehicle-heading"
        eyebrow="Nueva orden"
        title="Vehículo seleccionado"
        description="Esta orden se asociará automáticamente al vehículo desde el que iniciaste la orden."
      >
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <ReadOnlyDetail label="Patente" value={vehicle.licensePlate} />

          <ReadOnlyDetail
            label="Vehículo"
            value={`${vehicle.brand} ${vehicle.model}`}
          />

          <ReadOnlyDetail label="Cliente" value={vehicle.customerName} />

          <ReadOnlyDetail
            label="Teléfono"
            value={vehicle.customerPhone ?? "Sin teléfono"}
          />
        </div>
      </FormSection>

      <FormSection
        headingId="work-order-details-heading"
        eyebrow="Diagnóstico inicial"
        title="Datos de la orden"
      >
        <div className="grid gap-5">
          <Field>
            <FieldLabel htmlFor="reportedIssue">
              Problema reportado *
            </FieldLabel>

            <TextArea
              id="reportedIssue"
              name="reportedIssue"
              required
              rows={4}
              placeholder="Ej: El cliente reporta ruido en tren delantero al frenar."
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="entryMileage">
              Kilometraje de ingreso
            </FieldLabel>

            <NumberInput
              id="entryMileage"
              name="entryMileage"
              min="0"
              step="1"
              placeholder="129200"
            />
          </Field>

          <div className="grid gap-5 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="diagnosis">Diagnóstico</FieldLabel>

              <TextArea
                id="diagnosis"
                name="diagnosis"
                rows={4}
                placeholder="Diagnóstico inicial del mecánico."
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="workDone">Trabajo realizado</FieldLabel>

              <TextArea
                id="workDone"
                name="workDone"
                rows={4}
                placeholder="Detalle del trabajo realizado."
              />
            </Field>
          </div>
        </div>
      </FormSection>

      <WorkOrderPartsEditor parts={parts} onChange={setParts} />

      <FormSection
        headingId="work-order-costs-heading"
        eyebrow="Presupuesto"
        title="Costos"
      >
        <div className="grid gap-3 sm:gap-5 md:grid-cols-3">
          <MoneyInput
            id="laborCost"
            label="Costo mano de obra"
            value={laborCost}
            onChange={setLaborCost}
            placeholder="45000"
          />

          <ReadOnlyMoney label="Costo repuestos" value={partsCost} />

          <ReadOnlyMoney label="Total automático" value={calculatedTotal} />
        </div>
      </FormSection>

      <WorkOrderNotesEditor notes={notes} onChange={setNotes} />

      <div className="grid gap-3 sm:flex sm:flex-row-reverse sm:justify-start">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:h-11"
        >
          {isSubmitting ? "Creando orden..." : "Crear orden de trabajo"}
        </button>

        <button
          type="button"
          onClick={() => router.push(`/vehicles/${vehicleId}`)}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:h-11"
        >
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
 * Shared light-mode section wrapper for work order forms.
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
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          {eyebrow}
        </p>

        <h2
          id={headingId}
          className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground sm:text-xl"
        >
          {title}
        </h2>

        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-5 sm:mt-6">{children}</div>
    </section>
  );
}

type FieldProps = {
  children: ReactNode;
};

/**
 * Vertical field wrapper for labels and controls.
 */
function Field({ children }: FieldProps) {
  return <div className="space-y-2">{children}</div>;
}

type FieldLabelProps = {
  htmlFor: string;
  children: ReactNode;
};

/**
 * Accessible label used by work order fields.
 */
function FieldLabel({ htmlFor, children }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-bold text-foreground"
    >
      {children}
    </label>
  );
}

type TextAreaProps = {
  id: string;
  name: string;
  rows: number;
  placeholder: string;
  defaultValue?: string;
  required?: boolean;
};

/**
 * Shared textarea style for operational work order text fields.
 */
function TextArea({
  id,
  name,
  rows,
  placeholder,
  defaultValue,
  required,
}: TextAreaProps) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      placeholder={placeholder}
      defaultValue={defaultValue}
      required={required}
      className="w-full resize-y rounded-xl border border-border-strong bg-surface-muted/85 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  );
}

type NumberInputProps = {
  id: string;
  name: string;
  min: string;
  step: string;
  placeholder: string;
  defaultValue?: string | number;
};

/**
 * Shared number input style for mileage and numeric fields.
 */
function NumberInput({
  id,
  name,
  min,
  step,
  placeholder,
  defaultValue,
}: NumberInputProps) {
  return (
    <input
      id={id}
      name={name}
      type="number"
      min={min}
      step={step}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="h-12 w-full rounded-xl border border-border-strong bg-surface-muted/85 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  );
}

type ReadOnlyDetailProps = {
  label: string;
  value: string;
};

/**
 * Compact read-only detail used to show selected vehicle context before
 * creating a work order.
 */
function ReadOnlyDetail({ label, value }: ReadOnlyDetailProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-white/3 sm:p-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-bold text-foreground">
        {value}
      </p>
    </div>
  );
}

type MoneyInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

/**
 * Controlled money input used by work order forms.
 *
 * It uses the same visual container as read-only cost summaries so the costs
 * section keeps a consistent sheet/card rhythm.
 */
function MoneyInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: MoneyInputProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-white/3 sm:p-4">
      <label
        htmlFor={id}
        className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
      >
        {label}
      </label>

      <input
        id={id}
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 h-12 w-full rounded-xl border border-border-strong bg-surface/90 px-3 text-sm font-bold text-foreground outline-none transition placeholder:font-normal placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-10"
      />
    </div>
  );
}

type ReadOnlyMoneyProps = {
  label: string;
  value: number;
};

/**
 * Read-only money summary used for derived totals.
 */
function ReadOnlyMoney({ label, value }: ReadOnlyMoneyProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-white/3 sm:p-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {label}
      </p>

      <p className="mt-2 font-display text-lg font-black text-foreground">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

/**
 * Reads a required string from form data and normalizes whitespace.
 */
function getRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/**
 * Reads an optional string from form data.
 */
function getOptionalString(
  formData: FormData,
  key: string,
): string | undefined {
  const value = getRequiredString(formData, key);

  return value.length > 0 ? value : undefined;
}

/**
 * Reads an optional number from form data.
 */
function getOptionalNumber(
  formData: FormData,
  key: string,
): number | undefined {
  const value = getRequiredString(formData, key);

  if (!value) {
    return undefined;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

/**
 * Converts unknown submit errors into a safe user-facing message.
 */
function getSubmitErrorMessage(error: unknown): string {
  return getApiErrorMessage(error);
}
