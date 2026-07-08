"use client";

import { Archive, RotateCcw, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { archiveSupplier, restoreSupplier } from "../suppliers.client";

type SupplierArchiveActionsProps = {
  supplierId: string;
  isArchived: boolean;
  archivedReason: string | null;
};

/**
 * Critical-zone actions for archiving or restoring a supplier.
 *
 * Archiving does not delete historical purchases, payments or report data.
 */
export function SupplierArchiveActions({
  supplierId,
  isArchived,
  archivedReason,
}: SupplierArchiveActionsProps) {
  const router = useRouter();
  const errorId = useId();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const reason = getRequiredString(formData, "reason");

    if (reason.length < 8) {
      setErrorMessage("El motivo debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (isArchived) {
        await restoreSupplier(supplierId, { reason });
      } else {
        await archiveSupplier(supplierId, { reason });
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="supplier-critical-zone-heading"
      className="rounded-[1.1rem] border border-border bg-surface-muted/85 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-warning/45 bg-warning/10 text-warning">
          <TriangleAlert className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-warning">
            Zona crítica
          </p>

          <h2
            id="supplier-critical-zone-heading"
            className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
          >
            {isArchived ? "Restaurar proveedor" : "Archivar proveedor"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isArchived
              ? "Restaurar el proveedor lo devuelve a la operación diaria. El historial financiero se conserva igual."
              : "Archivar el proveedor lo oculta del flujo operativo, pero conserva compras, pagos, deuda y datos para reportes."}
          </p>

          {isArchived && archivedReason ? (
            <p className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted-foreground">
              Motivo de archivado: {" "}
              <span className="font-semibold text-foreground">
                {archivedReason}
              </span>
            </p>
          ) : null}

          <form
            className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
            onSubmit={handleSubmit}
            aria-describedby={errorMessage ? errorId : undefined}
            noValidate
          >
            <div className="space-y-2">
              <label htmlFor="reason" className="block text-sm font-bold text-foreground">
                Motivo
              </label>
              <input
                id="reason"
                name="reason"
                minLength={8}
                maxLength={500}
                disabled={isSubmitting}
                placeholder={
                  isArchived
                    ? "Ej: Se vuelve a comprar con este proveedor."
                    : "Ej: Ya no se trabaja con este proveedor."
                }
                className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={
                isArchived
                  ? "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  : "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-warning/45 bg-warning/10 px-5 text-sm font-bold text-warning transition hover:border-warning disabled:cursor-not-allowed disabled:opacity-60"
              }
            >
              {isArchived ? (
                <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <Archive className="size-4 shrink-0" aria-hidden="true" />
              )}
              {isSubmitting
                ? "Procesando..."
                : isArchived
                  ? "Restaurar"
                  : "Archivar"}
            </button>
          </form>

          {errorMessage ? (
            <p
              id={errorId}
              role="alert"
              className="mt-3 rounded-xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function getRequiredString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
