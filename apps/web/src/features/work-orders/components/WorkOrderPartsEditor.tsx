"use client";

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
      className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="work-order-parts-heading"
            className="text-lg font-semibold text-white"
          >
            Repuestos
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Cargá cada repuesto con su valor. El total de repuestos se calcula
            automáticamente.
          </p>
        </div>

        <p className="rounded-full border border-slate-700 px-3 py-1 text-sm font-semibold text-slate-100">
          {formatCurrency(partsTotal)}
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
        <div className="hidden grid-cols-[minmax(0,1fr)_180px_48px] border-b border-slate-800 bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid">
          <span>Repuesto</span>
          <span>Valor</span>
          <span className="sr-only">Acción</span>
        </div>

        <div className="divide-y divide-slate-800">
          {parts.map((part, index) => (
            <div
              key={part.id}
              className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_180px_48px] sm:items-end"
            >
              <div>
                <label
                  htmlFor={`part-name-${part.id}`}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:sr-only"
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
                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400 sm:mt-0"
                />
              </div>

              <div>
                <label
                  htmlFor={`part-cost-${part.id}`}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:sr-only"
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
                  className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400 sm:mt-0"
                />
              </div>

              <button
                type="button"
                onClick={() => removePart(part.id)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-200 sm:px-0"
                aria-label={`Quitar repuesto ${index + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={addPart}
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900 sm:w-auto"
      >
        Agregar repuesto
      </button>
    </section>
  );
}