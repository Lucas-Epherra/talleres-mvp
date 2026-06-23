"use client";

import { Archive, RotateCcw, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { archiveCustomer, restoreCustomer } from "../customers.client";

type CustomerArchiveActionsProps = {
  customerId: string;
  isArchived: boolean;
  activeWorkOrdersCount: number;
  archivedReason: string | null;
};

/**
 * Leaf client component for critical customer archive/restore actions.
 *
 * Both operations require a reason and a two-step confirmation because they
 * change whether the customer participates in the operational workflow.
 */
export function CustomerArchiveActions({
  customerId,
  isArchived,
  activeWorkOrdersCount,
  archivedReason,
}: CustomerArchiveActionsProps) {
  if (isArchived) {
    return (
      <RestoreCustomerForm
        customerId={customerId}
        archivedReason={archivedReason}
      />
    );
  }

  return (
    <ArchiveCustomerForm
      customerId={customerId}
      activeWorkOrdersCount={activeWorkOrdersCount}
    />
  );
}

type ArchiveCustomerFormProps = {
  customerId: string;
  activeWorkOrdersCount: number;
};

/**
 * Archives a customer when none of their vehicles has active work orders.
 */
function ArchiveCustomerForm({
  customerId,
  activeWorkOrdersCount,
}: ArchiveCustomerFormProps) {
  const router = useRouter();
  const reasonId = useId();
  const errorId = useId();
  const hintId = useId();

  const [reason, setReason] = useState("");
  const [isConfirmationStep, setIsConfirmationStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasActiveWorkOrders = activeWorkOrdersCount > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasActiveWorkOrders || isSubmitting) {
      return;
    }

    const normalizedReason = reason.trim();

    if (normalizedReason.length < 3) {
      setErrorMessage(
        "El motivo de archivado debe tener al menos 3 caracteres.",
      );
      setIsConfirmationStep(false);
      return;
    }

    if (!isConfirmationStep) {
      setErrorMessage(null);
      setIsConfirmationStep(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await archiveCustomer(customerId, {
        reason: normalizedReason,
      });

      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
      setIsConfirmationStep(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-[1.1rem] border border-warning/40 bg-warning/10 p-4 ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5"
      onSubmit={handleSubmit}
      aria-describedby={`${hintId}${errorMessage ? ` ${errorId}` : ""}`}
      noValidate
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-warning/40 bg-surface text-warning">
          <Archive className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-warning">
            Archivado de cliente
          </p>

          <h2 className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
            Sacar del flujo operativo
          </h2>

          <p
            id={hintId}
            className="mt-2 text-sm leading-6 text-muted-foreground"
          >
            Un cliente archivado conserva vehículos, órdenes e historial, pero
            no puede recibir nuevos vehículos ni generar nuevas órdenes.
          </p>

          {hasActiveWorkOrders ? (
            <p
              role="alert"
              className="mt-4 rounded-2xl border border-border-strong bg-surface px-4 py-3 text-sm font-semibold text-foreground"
            >
              No se puede archivar porque tiene {activeWorkOrdersCount} orden
              {activeWorkOrdersCount === 1 ? "" : "es"} activa
              {activeWorkOrdersCount === 1 ? "" : "s"} en sus vehículos. Cerrá o
              anulá esas órdenes antes de archivar.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <label
                  htmlFor={reasonId}
                  className="block text-sm font-bold text-foreground"
                >
                  Motivo de archivado *
                </label>

                <textarea
                  id={reasonId}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setIsConfirmationStep(false);
                  }}
                  rows={3}
                  required
                  placeholder="Ej: Cliente inactivo o fuera de servicio."
                  className="w-full resize-y rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {isConfirmationStep ? (
                <p className="flex items-start gap-2 rounded-2xl border border-warning/45 bg-surface px-4 py-3 text-sm font-semibold text-foreground">
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0 text-warning"
                    aria-hidden="true"
                  />
                  Confirmá el archivado. Esta acción deja al cliente fuera del
                  flujo operativo.
                </p>
              ) : null}

              {errorMessage ? (
                <p
                  id={errorId}
                  role="alert"
                  className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
                >
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-warning/45 bg-surface px-5 text-sm font-bold text-foreground transition hover:border-warning hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <Archive className="size-4 shrink-0" aria-hidden="true" />
                {isSubmitting
                  ? "Archivando..."
                  : isConfirmationStep
                    ? "Confirmar archivado"
                    : "Archivar cliente"}
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}

type RestoreCustomerFormProps = {
  customerId: string;
  archivedReason: string | null;
};

/**
 * Restores an archived customer to the operational flow.
 */
function RestoreCustomerForm({
  customerId,
  archivedReason,
}: RestoreCustomerFormProps) {
  const router = useRouter();
  const reasonId = useId();
  const errorId = useId();
  const hintId = useId();

  const [reason, setReason] = useState("");
  const [isConfirmationStep, setIsConfirmationStep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const normalizedReason = reason.trim();

    if (normalizedReason.length < 3) {
      setErrorMessage(
        "El motivo de restauración debe tener al menos 3 caracteres.",
      );
      setIsConfirmationStep(false);
      return;
    }

    if (!isConfirmationStep) {
      setErrorMessage(null);
      setIsConfirmationStep(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await restoreCustomer(customerId, {
        reason: normalizedReason,
      });

      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
      setIsConfirmationStep(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-[1.1rem] border border-border bg-surface-muted/85 p-4 ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5"
      onSubmit={handleSubmit}
      aria-describedby={`${hintId}${errorMessage ? ` ${errorId}` : ""}`}
      noValidate
    >
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface text-primary">
          <RotateCcw className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Restauración
          </p>

          <h2 className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
            Devolver al flujo operativo
          </h2>

          <p
            id={hintId}
            className="mt-2 text-sm leading-6 text-muted-foreground"
          >
            Al restaurar, el cliente volverá a estar disponible para nuevas
            operaciones del taller.
          </p>

          {archivedReason ? (
            <p className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted-foreground">
              Motivo original de archivado:{" "}
              <span className="font-semibold text-foreground">
                {archivedReason}
              </span>
            </p>
          ) : null}

          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <label
                htmlFor={reasonId}
                className="block text-sm font-bold text-foreground"
              >
                Motivo de restauración *
              </label>

              <textarea
                id={reasonId}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setIsConfirmationStep(false);
                }}
                rows={3}
                required
                placeholder="Ej: Archivado por error operativo."
                className="w-full resize-y rounded-xl border border-border-strong bg-surface px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {isConfirmationStep ? (
              <p className="flex items-start gap-2 rounded-2xl border border-primary/35 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground">
                <TriangleAlert
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                Confirmá la restauración. El cliente volverá al flujo operativo.
              </p>
            ) : null}

            {errorMessage ? (
              <p
                id={errorId}
                role="alert"
                className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
              {isSubmitting
                ? "Restaurando..."
                : isConfirmationStep
                  ? "Confirmar restauración"
                  : "Restaurar cliente"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
