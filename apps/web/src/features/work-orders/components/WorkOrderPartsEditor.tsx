"use client";

import { Package, Plus, X } from "lucide-react";
import {
  createEmptyWorkOrderPart,
  formatCurrency,
  getWorkOrderPartsTotal,
  type WorkOrderPartDraft,
} from "../utils/work-order-form";

type WorkOrderPartsEditorProps = {
  parts: WorkOrderPartDraft[];
  onChange: (parts: WorkOrderPartDraft[]) => void;
};

/**
 * Editable parts table used by create/edit work order forms.
 *
 * Each row captures the part name and its cost. The total is derived from the
 * rows and later sent to the API as partsCost.
 */
export function WorkOrderPartsEditor({
  parts,
  onChange,
}: WorkOrderPartsEditorProps) {
  const partsTotal = getWorkOrderPartsTotal(parts);

  function updatePart(
    partId: string,
    field: keyof Pick<WorkOrderPartDraft, "name" | "cost">,
    value: string,
  ) {
    onChange(
      parts.map((part) =>
        part.id === partId
          ? {
              ...part,
              [field]: value,
            }
          : part,
      ),
    );
  }

  function addPart() {
    onChange([...parts, createEmptyWorkOrderPart()]);
  }

  function removePart(partId: string) {
    if (parts.length === 1) {
      onChange([createEmptyWorkOrderPart()]);
      return;
    }

    onChange(parts.filter((part) => part.id !== partId));
  }

  return (
    <section
      aria-labelledby="work-order-parts-heading"
      className="rounded-[1.1rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Insumos
          </p>

          <h2
            id="work-order-parts-heading"
            className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground sm:text-xl"
          >
            Repuestos
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cargá cada repuesto con su valor. El total de repuestos se calcula
            automáticamente.
          </p>
        </div>

        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-4 py-2 text-sm font-black text-primary">
          <Package className="size-4 shrink-0" aria-hidden="true" />
          {formatCurrency(partsTotal)}
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface-muted/65 sm:mt-6">
        <div className="hidden grid-cols-[minmax(0,1fr)_180px_48px] border-b border-border bg-surface-elevated/85 px-4 py-3 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:grid">
          <span>Repuesto</span>
          <span>Valor</span>
          <span className="sr-only">Acción</span>
        </div>

        <div className="grid gap-3 p-3 sm:block sm:divide-y sm:divide-border sm:p-0">
          {parts.map((part, index) => (
            <div
              key={part.id}
              className="rounded-xl border border-border bg-surface/85 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:grid sm:grid-cols-[minmax(0,1fr)_180px_48px] sm:items-end sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-4 sm:shadow-none"
            >
              <div>
                <label
                  htmlFor={`part-name-${part.id}`}
                  className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary sm:sr-only"
                >
                  Repuesto {index + 1}
                </label>

                <input
                  id={`part-name-${part.id}`}
                  type="text"
                  value={part.name}
                  onChange={(event) =>
                    updatePart(part.id, "name", event.target.value)
                  }
                  placeholder="Ej: Pastillas delanteras"
                  className="mt-2 h-12 w-full rounded-xl border border-border-strong bg-surface-muted/85 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 sm:mt-0 sm:h-11"
                />
              </div>

              <div className="mt-3 sm:mt-0">
                <label
                  htmlFor={`part-cost-${part.id}`}
                  className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary sm:sr-only"
                >
                  Valor
                </label>

                <input
                  id={`part-cost-${part.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={part.cost}
                  onChange={(event) =>
                    updatePart(part.id, "cost", event.target.value)
                  }
                  placeholder="80000"
                  className="mt-2 h-12 w-full rounded-xl border border-border-strong bg-surface-muted/85 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 sm:mt-0 sm:h-11"
                />
              </div>

              <button
                type="button"
                onClick={() => removePart(part.id)}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-black text-foreground transition hover:border-primary/60 hover:bg-primary/10 sm:mt-0 sm:h-11 sm:px-0"
                aria-label={`Quitar repuesto ${index + 1}`}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
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
