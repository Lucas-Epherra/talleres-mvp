"use client";

import { BadgeDollarSign, Package, Plus, Truck, X } from "lucide-react";
import type { ReactNode } from "react";
import type {
  SupplierMarkupType,
  WorkOrder,
  WorkOrderPartLine,
  WorkOrderPartLineInput,
  WorkOrderSupplierCatalogItem,
  WorkOrderSupplierCatalogPart,
} from "../types";

export type WorkOrderStructuredPartDraft = {
  id: string;
  supplierId: string;
  supplierPartId: string;
  partName: string;
  quantity: string;
  supplierUnitCost: string;
  markupType: SupplierMarkupType;
  markupValue: string;
  customerUnitPrice: string;
  notes: string;
};

type WorkOrderSupplierPartsEditorProps = {
  parts: WorkOrderStructuredPartDraft[];
  onChange: (parts: WorkOrderStructuredPartDraft[]) => void;
  supplierCatalog: WorkOrderSupplierCatalogItem[];
};

const DEFAULT_QUANTITY = "1";

/**
 * Structured supplier parts editor used by work order create/edit forms.
 *
 * Each line stores supplier cost and customer-facing price separately. This is
 * what makes supplier debt, parts margin and future reports reliable.
 */
export function WorkOrderSupplierPartsEditor({
  parts,
  onChange,
  supplierCatalog,
}: WorkOrderSupplierPartsEditorProps) {
  const supplierTotal = getStructuredPartsSupplierTotal(parts);
  const customerTotal = getStructuredPartsCustomerTotal(parts);
  const grossProfit = customerTotal - supplierTotal;
  const hasAvailableSuppliers = supplierCatalog.length > 0;

  function updatePart(
    partId: string,
    updater: (part: WorkOrderStructuredPartDraft) => WorkOrderStructuredPartDraft,
  ) {
    onChange(parts.map((part) => (part.id === partId ? updater(part) : part)));
  }

  function addPart() {
    onChange([...parts, createEmptyStructuredPartDraft()]);
  }

  function removePart(partId: string) {
    if (parts.length === 1) {
      onChange([createEmptyStructuredPartDraft()]);
      return;
    }

    onChange(parts.filter((part) => part.id !== partId));
  }

  function handleSupplierChange(partId: string, supplierId: string) {
    updatePart(partId, (part) => ({
      ...part,
      supplierId,
      supplierPartId: "",
    }));
  }

  function handleSupplierPartChange(partId: string, supplierPartId: string) {
    updatePart(partId, (part) => {
      const selectedPart = findSupplierPart(supplierCatalog, supplierPartId);

      if (!selectedPart) {
        return {
          ...part,
          supplierPartId: "",
        };
      }

      const supplierUnitCost = moneyToInputValue(selectedPart.currentCost);
      const markupType = selectedPart.suggestedMarkupType ?? "NONE";
      const markupValue = moneyToInputValue(selectedPart.suggestedMarkupValue);
      const customerUnitPrice = resolveCustomerUnitPriceInput({
        supplierUnitCost,
        markupType,
        markupValue,
        suggestedCustomerPrice: moneyToInputValue(
          selectedPart.suggestedCustomerPrice,
        ),
      });

      return {
        ...part,
        supplierId: selectedPart.supplierId,
        supplierPartId: selectedPart.id,
        partName: selectedPart.name,
        supplierUnitCost,
        markupType,
        markupValue,
        customerUnitPrice,
      };
    });
  }

  function handleMoneyOrMarkupChange(
    partId: string,
    field: "supplierUnitCost" | "markupType" | "markupValue",
    value: string,
  ) {
    updatePart(partId, (part) => {
      const nextPart: WorkOrderStructuredPartDraft = { ...part };

      if (field === "markupType") {
        nextPart.markupType = value as SupplierMarkupType;
      } else {
        nextPart[field] = value;
      }

      if (nextPart.markupType === "MANUAL_PRICE") {
        return nextPart;
      }

      return {
        ...nextPart,
        customerUnitPrice: resolveCustomerUnitPriceInput({
          supplierUnitCost: nextPart.supplierUnitCost,
          markupType: nextPart.markupType,
          markupValue: nextPart.markupValue,
        }),
      };
    });
  }

  return (
    <section
      aria-labelledby="work-order-supplier-parts-heading"
      className="rounded-[1.1rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-6"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            <Package className="size-4 shrink-0" aria-hidden="true" />
            Compras y repuestos
          </p>

          <h2
            id="work-order-supplier-parts-heading"
            className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground sm:text-xl"
          >
            Repuestos de la orden
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Seleccioná proveedor y repuesto cuando corresponda. El costo del
            proveedor impacta en deuda, y el precio cliente alimenta el total de
            la orden y el margen de repuestos.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[32rem]">
          <SummaryPill label="Costo proveedor" value={supplierTotal} />
          <SummaryPill label="Precio cliente" value={customerTotal} />
          <SummaryPill
            label="Margen"
            value={grossProfit}
            tone={grossProfit >= 0 ? "positive" : "warning"}
          />
        </div>
      </div>

      {!hasAvailableSuppliers ? (
        <p className="mt-5 rounded-2xl border border-warning/45 bg-warning/10 px-4 py-3 text-sm font-semibold leading-6 text-foreground">
          Todavía no hay proveedores disponibles para seleccionar. Podés cargar
          una línea manual, pero no va a aumentar deuda de proveedor hasta que
          elijas uno.
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:mt-6">
        {parts.map((part, index) => {
          const selectedSupplier = supplierCatalog.find(
            (supplier) => supplier.id === part.supplierId,
          );
          const availableParts = selectedSupplier?.parts ?? [];
          const lineSupplierTotal = getLineSupplierSubtotal(part);
          const lineCustomerTotal = getLineCustomerSubtotal(part);

          return (
            <article
              key={part.id}
              className="rounded-2xl border border-border bg-surface-muted/75 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] ring-1 ring-white/3 transition hover:border-border-strong sm:p-4"
            >
              <header className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                    Repuesto {index + 1}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {part.supplierId
                      ? "Esta línea impacta en deuda del proveedor si cargás costo."
                      : "Línea manual sin proveedor asignado."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removePart(part.id)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-primary/10"
                  aria-label={`Quitar repuesto ${index + 1}`}
                >
                  <X className="size-4" aria-hidden="true" />
                  Quitar
                </button>
              </header>

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Field label="Proveedor" htmlFor={`supplier-${part.id}`}>
                  <select
                    id={`supplier-${part.id}`}
                    value={part.supplierId}
                    onChange={(event) =>
                      handleSupplierChange(part.id, event.target.value)
                    }
                    className="h-12 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Sin proveedor / manual</option>
                    {supplierCatalog.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Repuesto del catálogo" htmlFor={`part-${part.id}`}>
                  <select
                    id={`part-${part.id}`}
                    value={part.supplierPartId}
                    onChange={(event) =>
                      handleSupplierPartChange(part.id, event.target.value)
                    }
                    disabled={!part.supplierId || availableParts.length === 0}
                    className="h-12 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm font-bold text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">
                      {part.supplierId
                        ? "Carga manual / repuesto no catalogado"
                        : "Elegí un proveedor primero"}
                    </option>
                    {availableParts.map((supplierPart) => (
                      <option key={supplierPart.id} value={supplierPart.id}>
                        {supplierPart.name}
                        {supplierPart.sku ? ` · ${supplierPart.sku}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_120px_150px_160px_150px]">
                <Field label="Nombre / detalle" htmlFor={`part-name-${part.id}`}>
                  <input
                    id={`part-name-${part.id}`}
                    type="text"
                    value={part.partName}
                    onChange={(event) =>
                      updatePart(part.id, (currentPart) => ({
                        ...currentPart,
                        partName: event.target.value,
                        supplierPartId: event.target.value
                          ? currentPart.supplierPartId
                          : "",
                      }))
                    }
                    placeholder="Ej: Pastillas delanteras"
                    className="h-12 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </Field>

                <Field label="Cantidad" htmlFor={`quantity-${part.id}`}>
                  <input
                    id={`quantity-${part.id}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    inputMode="decimal"
                    value={part.quantity}
                    onChange={(event) =>
                      updatePart(part.id, (currentPart) => ({
                        ...currentPart,
                        quantity: event.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </Field>

                <Field label="Costo proveedor" htmlFor={`supplier-cost-${part.id}`}>
                  <input
                    id={`supplier-cost-${part.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={part.supplierUnitCost}
                    onChange={(event) =>
                      handleMoneyOrMarkupChange(
                        part.id,
                        "supplierUnitCost",
                        event.target.value,
                      )
                    }
                    placeholder="45000"
                    className="h-12 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </Field>

                <Field label="Recargo" htmlFor={`markup-type-${part.id}`}>
                  <div className="grid grid-cols-[minmax(0,1fr)_90px] gap-2">
                    <select
                      id={`markup-type-${part.id}`}
                      value={part.markupType}
                      onChange={(event) =>
                        handleMoneyOrMarkupChange(
                          part.id,
                          "markupType",
                          event.target.value,
                        )
                      }
                      className="h-12 w-full rounded-xl border border-border-strong bg-surface px-2 text-xs font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="NONE">Sin</option>
                      <option value="PERCENTAGE">%</option>
                      <option value="FIXED_AMOUNT">$</option>
                      <option value="MANUAL_PRICE">Manual</option>
                    </select>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={part.markupValue}
                      disabled={
                        part.markupType === "NONE" ||
                        part.markupType === "MANUAL_PRICE"
                      }
                      onChange={(event) =>
                        handleMoneyOrMarkupChange(
                          part.id,
                          "markupValue",
                          event.target.value,
                        )
                      }
                      aria-label={`Valor de recargo del repuesto ${index + 1}`}
                      placeholder="30"
                      className="h-12 w-full rounded-xl border border-border-strong bg-surface px-2 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </Field>

                <Field label="Precio cliente" htmlFor={`customer-price-${part.id}`}>
                  <input
                    id={`customer-price-${part.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={part.customerUnitPrice}
                    onChange={(event) =>
                      updatePart(part.id, (currentPart) => ({
                        ...currentPart,
                        markupType: "MANUAL_PRICE",
                        markupValue: "",
                        customerUnitPrice: event.target.value,
                      }))
                    }
                    placeholder="58500"
                    className="h-12 w-full rounded-xl border border-border-strong bg-surface px-3 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </Field>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <LineSummary
                  label="Costo"
                  value={lineSupplierTotal}
                  icon={<Truck className="size-4" aria-hidden="true" />}
                />
                <LineSummary
                  label="Cliente"
                  value={lineCustomerTotal}
                  icon={<BadgeDollarSign className="size-4" aria-hidden="true" />}
                />
                <LineSummary
                  label="Margen"
                  value={lineCustomerTotal - lineSupplierTotal}
                  icon={<Package className="size-4" aria-hidden="true" />}
                />
              </div>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addPart}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:h-11 sm:w-auto"
      >
        <Plus className="size-4 shrink-0" aria-hidden="true" />
        Agregar repuesto
      </button>
    </section>
  );
}

type FieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
};

/**
 * Small field wrapper with consistent labels.
 */
function Field({ label, htmlFor, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block text-[0.68rem] font-bold uppercase tracking-[0.18em] text-primary"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

type SummaryPillProps = {
  label: string;
  value: number;
  tone?: "neutral" | "positive" | "warning";
};

/**
 * Compact total metric shown in the editor header.
 */
function SummaryPill({ label, value, tone = "neutral" }: SummaryPillProps) {
  const className =
    tone === "warning"
      ? "border-warning/45 bg-warning/10 text-warning"
      : tone === "positive"
        ? "border-primary/35 bg-primary/10 text-primary"
        : "border-border bg-surface-muted/85 text-primary";

  return (
    <div className={`rounded-2xl border px-3 py-2 ${className}`}>
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 font-display text-base font-black text-foreground">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

type LineSummaryProps = {
  label: string;
  value: number;
  icon: ReactNode;
};

/**
 * Compact line summary used below each part row.
 */
function LineSummary({ label, value, icon }: LineSummaryProps) {
  return (
    <div className="rounded-xl border border-border bg-surface/80 px-3 py-2">
      <p className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-foreground">
        {formatCurrency(value)}
      </p>
    </div>
  );
}

/**
 * Creates an empty structured part draft.
 */
export function createEmptyStructuredPartDraft(): WorkOrderStructuredPartDraft {
  return {
    id: createDraftId(),
    supplierId: "",
    supplierPartId: "",
    partName: "",
    quantity: DEFAULT_QUANTITY,
    supplierUnitCost: "",
    markupType: "NONE",
    markupValue: "",
    customerUnitPrice: "",
    notes: "",
  };
}

/**
 * Creates editor drafts from a persisted work order.
 */
export function createStructuredPartDraftsFromWorkOrder(
  workOrder: WorkOrder,
): WorkOrderStructuredPartDraft[] {
  if (workOrder.partLines && workOrder.partLines.length > 0) {
    return workOrder.partLines.map(createDraftFromPersistedLine);
  }

  if (workOrder.partsUsed && workOrder.partsUsed.trim().length > 0) {
    return [
      {
        ...createEmptyStructuredPartDraft(),
        partName: workOrder.partsUsed.trim(),
        supplierUnitCost: moneyToInputValue(workOrder.partsCost),
        customerUnitPrice: moneyToInputValue(workOrder.partsCost),
      },
    ];
  }

  return [createEmptyStructuredPartDraft()];
}

/**
 * Validates structured part drafts and returns the first user-facing error.
 */
export function validateStructuredPartDrafts(
  parts: WorkOrderStructuredPartDraft[],
): string | null {
  const filledParts = parts.filter(hasAnyPartValue);

  for (const [index, part] of filledParts.entries()) {
    const lineNumber = index + 1;

    if (!part.partName.trim() && !part.supplierPartId) {
      return `El repuesto ${lineNumber} necesita nombre o selección de catálogo.`;
    }

    const quantity = parseMoneyInputValue(part.quantity);
    const supplierUnitCost = parseMoneyInputValue(part.supplierUnitCost);
    const customerUnitPrice = parseMoneyInputValue(part.customerUnitPrice);

    if (quantity === null || quantity <= 0) {
      return `La cantidad del repuesto ${lineNumber} debe ser mayor a cero.`;
    }

    if (supplierUnitCost === null || supplierUnitCost < 0) {
      return `El costo proveedor del repuesto ${lineNumber} debe ser válido.`;
    }

    if (customerUnitPrice === null || customerUnitPrice < 0) {
      return `El precio cliente del repuesto ${lineNumber} debe ser válido.`;
    }

    if (
      (part.markupType === "PERCENTAGE" ||
        part.markupType === "FIXED_AMOUNT") &&
      parseMoneyInputValue(part.markupValue) === null
    ) {
      return `El recargo del repuesto ${lineNumber} debe ser válido.`;
    }
  }

  return null;
}

/**
 * Serializes drafts into the backend DTO shape.
 */
export function serializeStructuredPartDrafts(
  parts: WorkOrderStructuredPartDraft[],
): WorkOrderPartLineInput[] {
  return parts.filter(hasAnyPartValue).map((part) => ({
    supplierId: part.supplierId || undefined,
    supplierPartId: part.supplierPartId || undefined,
    partName: part.partName.trim() || undefined,
    quantity: parseMoneyInputValue(part.quantity) ?? undefined,
    supplierUnitCost: parseMoneyInputValue(part.supplierUnitCost) ?? undefined,
    customerUnitPrice: parseMoneyInputValue(part.customerUnitPrice) ?? undefined,
    markupType: part.markupType,
    markupValue: parseMoneyInputValue(part.markupValue) ?? undefined,
    notes: part.notes.trim() || undefined,
  }));
}

/**
 * Builds a simple legacy text summary for compatibility with older screens.
 */
export function serializeStructuredPartsToLegacyText(
  parts: WorkOrderStructuredPartDraft[],
  supplierCatalog: WorkOrderSupplierCatalogItem[],
): string | undefined {
  const lines = parts.filter(hasAnyPartValue).map((part) => {
    const supplier = supplierCatalog.find(
      (catalogSupplier) => catalogSupplier.id === part.supplierId,
    );
    const quantity = parseMoneyInputValue(part.quantity) ?? 0;
    const customerSubtotal = getLineCustomerSubtotal(part);
    const label = part.partName.trim() || "Repuesto sin nombre";
    const supplierLabel = supplier ? ` · ${supplier.name}` : "";

    return `${quantity}x ${label}${supplierLabel} · ${formatCurrency(customerSubtotal)}`;
  });

  return lines.length > 0 ? lines.join("\n") : undefined;
}

/**
 * Returns the customer-facing total for all structured parts.
 */
export function getStructuredPartsCustomerTotal(
  parts: WorkOrderStructuredPartDraft[],
): number {
  return parts.reduce(
    (total, part) => total + getLineCustomerSubtotal(part),
    0,
  );
}

/**
 * Returns the supplier-cost total for all structured parts.
 */
export function getStructuredPartsSupplierTotal(
  parts: WorkOrderStructuredPartDraft[],
): number {
  return parts.reduce(
    (total, part) => total + getLineSupplierSubtotal(part),
    0,
  );
}

/**
 * Parses a controlled money input into a finite number.
 */
export function parseMoneyInputValue(value: string): number | null {
  const normalizedValue = value.replace(",", ".").trim();

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function createDraftFromPersistedLine(
  line: WorkOrderPartLine,
): WorkOrderStructuredPartDraft {
  return {
    id: line.id,
    supplierId: line.supplierId ?? "",
    supplierPartId: line.supplierPartId ?? "",
    partName: line.partNameSnapshot,
    quantity: moneyToInputValue(line.quantity),
    supplierUnitCost: moneyToInputValue(line.supplierUnitCost),
    markupType: line.markupType,
    markupValue: moneyToInputValue(line.markupValue),
    customerUnitPrice: moneyToInputValue(line.customerUnitPrice),
    notes: line.notes ?? "",
  };
}

function getLineSupplierSubtotal(part: WorkOrderStructuredPartDraft): number {
  const quantity = parseMoneyInputValue(part.quantity) ?? 0;
  const supplierUnitCost = parseMoneyInputValue(part.supplierUnitCost) ?? 0;

  return roundMoney(quantity * supplierUnitCost);
}

function getLineCustomerSubtotal(part: WorkOrderStructuredPartDraft): number {
  const quantity = parseMoneyInputValue(part.quantity) ?? 0;
  const customerUnitPrice = parseMoneyInputValue(part.customerUnitPrice) ?? 0;

  return roundMoney(quantity * customerUnitPrice);
}

function findSupplierPart(
  supplierCatalog: WorkOrderSupplierCatalogItem[],
  supplierPartId: string,
): WorkOrderSupplierCatalogPart | null {
  for (const supplier of supplierCatalog) {
    const supplierPart = supplier.parts.find((part) => part.id === supplierPartId);

    if (supplierPart) {
      return supplierPart;
    }
  }

  return null;
}

function resolveCustomerUnitPriceInput({
  supplierUnitCost,
  markupType,
  markupValue,
  suggestedCustomerPrice,
}: {
  supplierUnitCost: string;
  markupType: SupplierMarkupType;
  markupValue: string;
  suggestedCustomerPrice?: string;
}): string {
  if (suggestedCustomerPrice && markupType === "MANUAL_PRICE") {
    return suggestedCustomerPrice;
  }

  const supplierCost = parseMoneyInputValue(supplierUnitCost) ?? 0;
  const markup = parseMoneyInputValue(markupValue) ?? 0;

  if (markupType === "PERCENTAGE") {
    return moneyToInputValue(roundMoney(supplierCost * (1 + markup / 100)));
  }

  if (markupType === "FIXED_AMOUNT") {
    return moneyToInputValue(roundMoney(supplierCost + markup));
  }

  if (markupType === "MANUAL_PRICE") {
    return suggestedCustomerPrice ?? "";
  }

  return moneyToInputValue(supplierCost);
}

function hasAnyPartValue(part: WorkOrderStructuredPartDraft): boolean {
  return Boolean(
    part.supplierId ||
      part.supplierPartId ||
      part.partName.trim() ||
      part.supplierUnitCost.trim() ||
      part.customerUnitPrice.trim(),
  );
}

function moneyToInputValue(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const parsedValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsedValue)) {
    return "";
  }

  return String(roundMoney(parsedValue));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function createDraftId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `part-${Date.now().toString()}-${Math.random().toString(16).slice(2)}`;
}
