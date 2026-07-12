"use client";

import {
  Archive,
  Calculator,
  CircleDollarSign,
  PackagePlus,
  PackageSearch,
  Pencil,
  RotateCcw,
  Save,
  Tags,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { formatDateTime, formatMoney } from "../../../lib/format";
import {
  archiveSupplierPart,
  createSupplierPart,
  restoreSupplierPart,
  updateSupplierPart,
} from "../suppliers.client";
import type {
  CreateSupplierPartInput,
  PaginationMeta,
  SupplierCategory,
  SupplierMarkupType,
  SupplierPart,
  UpdateSupplierPartInput,
} from "../types";

type SupplierPartsCatalogProps = {
  supplierId: string;
  supplierName: string;
  categories: SupplierCategory[];
  initialParts: SupplierPart[];
  initialMeta: PaginationMeta;
  isSupplierArchived: boolean;
};

type CatalogMode = "list" | "create";

/**
 * Interactive supplier catalog block.
 *
 * It keeps catalog operations isolated from work orders: prices saved here are
 * current/suggested values, while future order lines will store immutable
 * snapshots for historical costs, sale prices and margins.
 */
export function SupplierPartsCatalog({
  supplierId,
  supplierName,
  categories,
  initialParts,
  initialMeta,
  isSupplierArchived,
}: SupplierPartsCatalogProps) {
  const [mode, setMode] = useState<CatalogMode>("list");
  const [editingPartId, setEditingPartId] = useState<string | null>(null);

  const visibleParts = initialParts;
  const availablePartsCount = visibleParts.filter((part) => !part.archivedAt).length;
  const archivedPartsCount = visibleParts.filter((part) => part.archivedAt).length;

  return (
    <section
      aria-labelledby="supplier-parts-heading"
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-5 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            <PackageSearch className="size-4 shrink-0" aria-hidden="true" />
            Catálogo
          </p>

          <h2
            id="supplier-parts-heading"
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
          >
            Repuestos del proveedor
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Cargá costos actuales, recargos sugeridos y precio recomendado al
            cliente. Las órdenes futuras van a tomar estos datos como base y
            guardar su propia foto histórica.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[26rem]">
          <CatalogMetric label="Disponibles" value={availablePartsCount.toString()} />
          <CatalogMetric
            label="Archivados"
            value={archivedPartsCount.toString()}
          />
          <CatalogMetric
            label="Mostrados"
            value={initialMeta.totalItems.toString()}
          />
        </div>
      </div>

      {isSupplierArchived ? (
        <p className="mt-5 rounded-2xl border border-warning/45 bg-warning/10 px-4 py-3 text-sm font-semibold leading-6 text-foreground">
          Este proveedor está archivado. Restauralo antes de cargar o modificar
          repuestos.
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted-foreground">
          Catálogo operativo para <span className="font-semibold text-foreground">{supplierName}</span>.
        </p>

        {!isSupplierArchived ? (
          <button
            type="button"
            onClick={() => {
              setEditingPartId(null);
              setMode((currentMode) => (currentMode === "create" ? "list" : "create"));
            }}
            className={
              mode === "create"
                ? "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
                : "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
            }
          >
            {mode === "create" ? (
              <X className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <PackagePlus className="size-4 shrink-0" aria-hidden="true" />
            )}
            {mode === "create" ? "Cerrar carga" : "Nuevo repuesto"}
          </button>
        ) : null}
      </div>

      {mode === "create" ? (
        <div className="mt-5">
          <SupplierPartForm
            supplierId={supplierId}
            categories={categories}
            mode="create"
            onCancel={() => setMode("list")}
            onSaved={() => setMode("list")}
          />
        </div>
      ) : null}

      {visibleParts.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {visibleParts.map((part) => (
            <div key={part.id}>
              {editingPartId === part.id ? (
                <SupplierPartForm
                  supplierId={supplierId}
                  categories={categories}
                  mode="edit"
                  part={part}
                  onCancel={() => setEditingPartId(null)}
                  onSaved={() => setEditingPartId(null)}
                />
              ) : (
                <SupplierPartCard
                  supplierId={supplierId}
                  part={part}
                  isSupplierArchived={isSupplierArchived}
                  onEdit={() => {
                    setMode("list");
                    setEditingPartId(part.id);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      ) : mode !== "create" ? (
        <EmptyCatalogState canCreate={!isSupplierArchived} />
      ) : null}

      {initialMeta.totalItems > visibleParts.length ? (
        <p className="mt-4 rounded-2xl border border-border bg-surface-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
          Se muestran {visibleParts.length} de {initialMeta.totalItems} repuestos.
          Más adelante agregaremos búsqueda y paginación dedicada del catálogo.
        </p>
      ) : null}
    </section>
  );
}

type CatalogMetricProps = {
  label: string;
  value: string;
};

/**
 * Compact metric used by the catalog header.
 */
function CatalogMetric({ label, value }: CatalogMetricProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-primary">
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

type SupplierPartFormProps = {
  supplierId: string;
  categories: SupplierCategory[];
  mode: "create" | "edit";
  part?: SupplierPart;
  onCancel: () => void;
  onSaved: () => void;
};

/**
 * Create/edit form for supplier catalog parts.
 */
function SupplierPartForm({
  supplierId,
  categories,
  mode,
  part,
  onCancel,
  onSaved,
}: SupplierPartFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(part?.name ?? "");
  const [categoryId, setCategoryId] = useState(part?.categoryId ?? "");
  const [sku, setSku] = useState(part?.sku ?? "");
  const [description, setDescription] = useState(part?.description ?? "");
  const [currentCost, setCurrentCost] = useState(toInputMoney(part?.currentCost));
  const [markupType, setMarkupType] = useState<SupplierMarkupType>(
    part?.suggestedMarkupType ?? "NONE",
  );
  const [markupValue, setMarkupValue] = useState(
    toInputMoney(part?.suggestedMarkupValue),
  );
  const [manualCustomerPrice, setManualCustomerPrice] = useState(
    toInputMoney(part?.suggestedCustomerPrice),
  );
  const pricingPreview = useMemo(
    () =>
      resolvePricingPreview({
        currentCost,
        markupType,
        markupValue,
        manualCustomerPrice,
      }),
    [currentCost, markupType, markupValue, manualCustomerPrice],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const parsedCost = parseMoneyInputValue(currentCost);
    const parsedMarkupValue = parseMoneyInputValue(markupValue);
    const parsedManualCustomerPrice = parseMoneyInputValue(manualCustomerPrice);

    if (name.trim().length < 2) {
      setErrorMessage("El nombre del repuesto debe tener al menos 2 caracteres.");
      return;
    }

    if (parsedCost === null) {
      setErrorMessage("El costo proveedor es obligatorio y debe ser válido.");
      return;
    }

    if (
      (markupType === "PERCENTAGE" || markupType === "FIXED_AMOUNT") &&
      parsedMarkupValue === null
    ) {
      setErrorMessage("Cargá el valor del recargo sugerido.");
      return;
    }

    if (markupType === "MANUAL_PRICE" && parsedManualCustomerPrice === null) {
      setErrorMessage("Cargá el precio sugerido al cliente.");
      return;
    }

    const baseInput = {
      categoryId: categoryId || undefined,
      name: name.trim(),
      sku: sku.trim() || undefined,
      description: description.trim() || undefined,
      currentCost: parsedCost,
      suggestedMarkupType: markupType,
      suggestedMarkupValue:
        markupType === "PERCENTAGE" || markupType === "FIXED_AMOUNT"
          ? parsedMarkupValue ?? 0
          : undefined,
      suggestedCustomerPrice:
        markupType === "MANUAL_PRICE" ? parsedManualCustomerPrice ?? parsedCost : undefined,
      isActive: true,
    } satisfies CreateSupplierPartInput;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (mode === "edit" && part) {
        const updateInput: UpdateSupplierPartInput = {
          ...baseInput,
          categoryId: categoryId || null,
          sku: sku.trim() || null,
          description: description.trim() || null,
          suggestedMarkupValue:
            markupType === "PERCENTAGE" || markupType === "FIXED_AMOUNT"
              ? parsedMarkupValue ?? 0
              : null,
          suggestedCustomerPrice:
            markupType === "MANUAL_PRICE"
              ? parsedManualCustomerPrice ?? parsedCost
              : null,
        };

        await updateSupplierPart(supplierId, part.id, updateInput);
      } else {
        await createSupplierPart(supplierId, baseInput);
      }

      onSaved();
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface-muted/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-5"
      noValidate
    >
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">
            {mode === "edit" ? "Editar repuesto" : "Nuevo repuesto"}
          </p>
          <h3 className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
            {mode === "edit" ? part?.name : "Cargar al catálogo"}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            El costo es lo que paga el taller. El precio cliente es una sugerencia
            para aplicar después en órdenes.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
        >
          <X className="size-4 shrink-0" aria-hidden="true" />
          Cancelar
        </button>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${mode}-supplier-part-name`}>
            Nombre del repuesto *
          </FieldLabel>
          <TextInput
            id={`${mode}-supplier-part-name`}
            value={name}
            onChange={setName}
            placeholder="Ej: Pastillas delanteras"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${mode}-supplier-part-category`}>
            Categoría
          </FieldLabel>
          <select
            id={`${mode}-supplier-part-category`}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${mode}-supplier-part-sku`}>SKU / código</FieldLabel>
          <TextInput
            id={`${mode}-supplier-part-sku`}
            value={sku}
            onChange={setSku}
            placeholder="Ej: FR-DEL-001"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${mode}-supplier-part-cost`}>
            Costo proveedor *
          </FieldLabel>
          <MoneyInput
            id={`${mode}-supplier-part-cost`}
            value={currentCost}
            onChange={setCurrentCost}
            placeholder="45000"
            required
          />
        </Field>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">
              <Calculator className="size-3.5" aria-hidden="true" />
              Recargo sugerido
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Este recargo no modifica compras pasadas. Solo prepara el precio
              recomendado para futuras órdenes.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px]">
          <Field>
            <FieldLabel htmlFor={`${mode}-supplier-part-markup-type`}>
              Tipo de recargo
            </FieldLabel>
            <select
              id={`${mode}-supplier-part-markup-type`}
              value={markupType}
              onChange={(event) => {
                const nextMarkupType = event.target.value as SupplierMarkupType;
                setMarkupType(nextMarkupType);
              }}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="NONE">Sin recargo</option>
              <option value="PERCENTAGE">Porcentaje</option>
              <option value="FIXED_AMOUNT">Monto fijo</option>
              <option value="MANUAL_PRICE">Precio final manual</option>
            </select>
          </Field>

          {markupType === "PERCENTAGE" || markupType === "FIXED_AMOUNT" ? (
            <Field>
              <FieldLabel htmlFor={`${mode}-supplier-part-markup-value`}>
                {markupType === "PERCENTAGE" ? "Porcentaje" : "Monto fijo"}
              </FieldLabel>
              <MoneyInput
                id={`${mode}-supplier-part-markup-value`}
                value={markupValue}
                onChange={setMarkupValue}
                placeholder={markupType === "PERCENTAGE" ? "30" : "10000"}
                required
              />
            </Field>
          ) : markupType === "MANUAL_PRICE" ? (
            <Field>
              <FieldLabel htmlFor={`${mode}-supplier-part-manual-price`}>
                Precio cliente
              </FieldLabel>
              <MoneyInput
                id={`${mode}-supplier-part-manual-price`}
                value={manualCustomerPrice}
                onChange={setManualCustomerPrice}
                placeholder="58500"
                required
              />
            </Field>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
              Sin recargo: el precio sugerido al cliente será igual al costo del
              proveedor.
            </div>
          )}

          <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.16em] text-primary">
              Precio sugerido
            </p>
            <p className="mt-1 font-display text-lg font-black text-foreground">
              {pricingPreview.customerPrice !== null
                ? formatMoney(pricingPreview.customerPrice)
                : "—"}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              Margen estimado: {pricingPreview.grossProfit !== null ? formatMoney(pricingPreview.grossProfit) : "—"}
            </p>
          </div>
        </div>
      </div>

      <Field className="mt-5">
        <FieldLabel htmlFor={`${mode}-supplier-part-description`}>
          Descripción / observaciones
        </FieldLabel>
        <textarea
          id={`${mode}-supplier-part-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          placeholder="Ej: Marca, compatibilidad, presentación, condición comercial."
          className="w-full resize-y rounded-xl border border-border-strong bg-surface-muted/85 px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </Field>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="size-4 shrink-0" aria-hidden="true" />
          {isSubmitting
            ? mode === "edit"
              ? "Guardando..."
              : "Creando..."
            : mode === "edit"
              ? "Guardar repuesto"
              : "Crear repuesto"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

type SupplierPartCardProps = {
  supplierId: string;
  part: SupplierPart;
  isSupplierArchived: boolean;
  onEdit: () => void;
};

/**
 * Read-only card for a supplier catalog part.
 */
function SupplierPartCard({
  supplierId,
  part,
  isSupplierArchived,
  onEdit,
}: SupplierPartCardProps) {
  const isArchived = Boolean(part.archivedAt);
  const customerPrice = toNumber(part.suggestedCustomerPrice);
  const currentCost = toNumber(part.currentCost);
  const grossProfit =
    customerPrice !== null && currentCost !== null ? customerPrice - currentCost : null;

  return (
    <article
      className={buildClassName(
        "rounded-2xl border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition",
        isArchived
          ? "border-border bg-surface-muted/55 opacity-80"
          : "border-border bg-surface-muted/85 hover:border-primary/35",
      )}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.14em] text-primary">
              <Tags className="size-3" aria-hidden="true" />
              {part.category?.name ?? "Sin categoría"}
            </span>

            <StatusPill part={part} />
          </div>

          <h3 className="mt-3 wrap-anywhere font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
            {part.name}
          </h3>

          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {part.sku ? `SKU ${part.sku} · ` : ""}Actualizado {formatDateTime(part.updatedAt)}
          </p>

          {part.description ? (
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {part.description}
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 xl:min-w-[33rem]">
          <div className="grid gap-2 sm:grid-cols-3">
            <PriceDatum label="Costo proveedor" value={part.currentCost} />
            <PriceDatum
              label="Precio cliente"
              value={part.suggestedCustomerPrice ?? part.currentCost}
            />
            <PriceDatum
              label="Margen sugerido"
              value={grossProfit ?? 0}
              tone={grossProfit && grossProfit > 0 ? "positive" : "neutral"}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {!isSupplierArchived && !isArchived ? (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
              >
                <Pencil className="size-4 shrink-0" aria-hidden="true" />
                Editar
              </button>
            ) : null}

            {!isSupplierArchived ? (
              <SupplierPartArchiveButton
                supplierId={supplierId}
                part={part}
                isArchived={isArchived}
              />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

type SupplierPartArchiveButtonProps = {
  supplierId: string;
  part: SupplierPart;
  isArchived: boolean;
};

/**
 * Archive/restore action for catalog parts.
 */
function SupplierPartArchiveButton({
  supplierId,
  part,
  isArchived,
}: SupplierPartArchiveButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (reason.trim().length < 8) {
      setErrorMessage("El motivo debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (isArchived) {
        await restoreSupplierPart(supplierId, part.id, { reason: reason.trim() });
      } else {
        await archiveSupplierPart(supplierId, part.id, { reason: reason.trim() });
      }

      setIsOpen(false);
      setReason("");
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          isArchived
            ? "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-warning/45 bg-warning/10 px-4 text-sm font-bold text-foreground transition hover:border-warning"
        }
      >
        {isArchived ? (
          <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <Archive className="size-4 shrink-0" aria-hidden="true" />
        )}
        {isArchived ? "Restaurar" : "Archivar"}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface p-3 sm:min-w-[22rem]"
      noValidate
    >
      <label className="block text-xs font-bold text-foreground">
        Motivo para {isArchived ? "restaurar" : "archivar"}
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            isArchived
              ? "Ej: Se volvió a comprar este repuesto."
              : "Ej: Ya no se trabaja este repuesto."
          }
          className="h-10 min-w-0 flex-1 rounded-xl border border-border-strong bg-surface-muted px-3 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Guardando..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setReason("");
            setErrorMessage(null);
          }}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60"
        >
          Cerrar
        </button>
      </div>

      {errorMessage ? (
        <p className="mt-2 text-xs font-semibold text-primary" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

function EmptyCatalogState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface-muted/55 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-surface text-primary">
          <PackageSearch className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">
            Catálogo listo
          </p>
          <h3 className="mt-2 font-display text-base font-black uppercase tracking-[0.04em] text-foreground">
            Sin repuestos cargados
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {canCreate
              ? "Cargá el primer repuesto para preparar costos, recargos sugeridos y futuros reportes de margen."
              : "Restaurá el proveedor para volver a cargar repuestos en su catálogo."}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ part }: { part: SupplierPart }) {
  if (part.archivedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
        <Archive className="size-3" aria-hidden="true" />
        Archivado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.14em] text-primary">
      <PackageSearch className="size-3" aria-hidden="true" />
      Disponible
    </span>
  );
}

function PriceDatum({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "positive";
}) {
  return (
    <div
      className={
        tone === "positive"
          ? "rounded-2xl border border-primary/25 bg-primary/5 px-3 py-2"
          : "rounded-2xl border border-border bg-surface px-3 py-2"
      }
    >
      <p
        className={
          tone === "positive"
            ? "text-[0.6rem] font-black uppercase tracking-[0.16em] text-primary"
            : "text-[0.6rem] font-black uppercase tracking-[0.16em] text-muted-foreground"
        }
      >
        {label}
      </p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-black text-foreground">
        <CircleDollarSign className="size-3.5 text-primary" aria-hidden="true" />
        {formatMoney(value)}
      </p>
    </div>
  );
}

type FieldProps = {
  children: ReactNode;
  className?: string;
};

function Field({ children, className }: FieldProps) {
  return <div className={buildClassName("space-y-2", className)}>{children}</div>;
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-bold text-foreground">
      {children}
    </label>
  );
}

function TextInput({
  id,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  );
}

function MoneyInput({
  id,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <input
      id={id}
      type="number"
      min="0"
      step="0.01"
      inputMode="decimal"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      required={required}
      className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  );
}

function resolvePricingPreview({
  currentCost,
  markupType,
  markupValue,
  manualCustomerPrice,
}: {
  currentCost: string;
  markupType: SupplierMarkupType;
  markupValue: string;
  manualCustomerPrice: string;
}): { customerPrice: number | null; grossProfit: number | null } {
  const parsedCost = parseMoneyInputValue(currentCost);

  if (parsedCost === null) {
    return {
      customerPrice: null,
      grossProfit: null,
    };
  }

  if (markupType === "NONE") {
    return {
      customerPrice: parsedCost,
      grossProfit: 0,
    };
  }

  if (markupType === "PERCENTAGE") {
    const parsedMarkupValue = parseMoneyInputValue(markupValue) ?? 0;
    const customerPrice = roundMoney(parsedCost * (1 + parsedMarkupValue / 100));

    return {
      customerPrice,
      grossProfit: roundMoney(customerPrice - parsedCost),
    };
  }

  if (markupType === "FIXED_AMOUNT") {
    const parsedMarkupValue = parseMoneyInputValue(markupValue) ?? 0;
    const customerPrice = roundMoney(parsedCost + parsedMarkupValue);

    return {
      customerPrice,
      grossProfit: roundMoney(customerPrice - parsedCost),
    };
  }

  const customerPrice = parseMoneyInputValue(manualCustomerPrice);

  return {
    customerPrice,
    grossProfit: customerPrice === null ? null : roundMoney(customerPrice - parsedCost),
  };
}

function parseMoneyInputValue(value: string): number | null {
  const normalizedValue = value.trim().replace(",", ".");

  if (!normalizedValue) {
    return null;
  }

  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }

  return roundMoney(numericValue);
}

function toInputMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value);
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildClassName(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
