"use client";

import {
  Archive,
  Banknote,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  ReceiptText,
  Save,
  Smartphone,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { formatDate, formatDateTime, formatMoney } from "../../../lib/format";
import {
  createSupplierPayment,
  updateSupplierPayment,
  voidSupplierPayment,
} from "../suppliers.client";
import type {
  CreateSupplierPaymentInput,
  PaginationMeta,
  SupplierPayment,
  SupplierPaymentMethod,
  UpdateSupplierPaymentInput,
} from "../types";

type SupplierPaymentsPanelProps = {
  supplierId: string;
  supplierName: string;
  initialPayments: SupplierPayment[];
  initialMeta: PaginationMeta;
  paidTotal: number | string;
  pendingBalance: number | string;
  isSupplierArchived: boolean;
};

type PaymentMode = "list" | "create";

/**
 * Interactive payments panel for one supplier.
 *
 * Payments are financial records, so delete is intentionally not available.
 * Corrections use edit while active, and mistakes use void with a reason to
 * preserve the audit trail and keep supplier debt explainable.
 */
export function SupplierPaymentsPanel({
  supplierId,
  supplierName,
  initialPayments,
  initialMeta,
  paidTotal,
  pendingBalance,
  isSupplierArchived,
}: SupplierPaymentsPanelProps) {
  const [mode, setMode] = useState<PaymentMode>("list");
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const editingPayment =
    initialPayments.find((payment) => payment.id === editingPaymentId) ?? null;
  const activePaymentsCount = initialPayments.filter(
    (payment) => !payment.voidedAt,
  ).length;
  const voidedPaymentsCount = initialPayments.filter(
    (payment) => payment.voidedAt,
  ).length;

  return (
    <section
      aria-labelledby="supplier-payments-heading"
      className="overflow-hidden rounded-[1.35rem] border border-border bg-surface shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <header className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
              <ReceiptText className="size-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <h2
                id="supplier-payments-heading"
                className="font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
              >
                Pagos al proveedor
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                Historial financiero de{" "}
                <span className="font-semibold text-foreground">
                  {supplierName}
                </span>
                . Los pagos registrados reducen el saldo pendiente sin eliminar
                movimientos anteriores.
              </p>
            </div>
          </div>
        </div>

        {!isSupplierArchived ? (
          <button
            type="button"
            onClick={() => {
              setEditingPaymentId(null);
              setMode((currentMode) =>
                currentMode === "create" ? "list" : "create",
              );
            }}
            className={
              mode === "create"
                ? "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
                : "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
            }
          >
            {mode === "create" ? (
              <X className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Plus className="size-4 shrink-0" aria-hidden="true" />
            )}
            {mode === "create" ? "Cerrar carga" : "Registrar pago"}
          </button>
        ) : null}
      </header>

      <dl className="grid border-b border-border bg-surface-muted/35 sm:grid-cols-2 xl:grid-cols-4">
        <PaymentSummaryMetric label="Abonado" value={formatMoney(paidTotal)} />
        <PaymentSummaryMetric
          label="Saldo pendiente"
          value={formatMoney(pendingBalance)}
          tone={Number(pendingBalance) > 0 ? "warning" : "neutral"}
        />
        <PaymentSummaryMetric
          label="Registrados"
          value={activePaymentsCount.toString()}
        />
        <PaymentSummaryMetric
          label="Anulados"
          value={voidedPaymentsCount.toString()}
          last
        />
      </dl>

      <div className="p-4 sm:p-5">
        {isSupplierArchived ? (
          <p className="rounded-2xl border border-warning/45 bg-warning/10 px-4 py-3 text-sm font-semibold leading-6 text-foreground">
            Este proveedor está archivado. Restauralo antes de registrar o
            corregir pagos.
          </p>
        ) : null}

        {mode === "create" ? (
          <div className={isSupplierArchived ? "mt-5" : ""}>
            <SupplierPaymentForm
              supplierId={supplierId}
              mode="create"
              onCancel={() => setMode("list")}
              onSaved={() => setMode("list")}
            />
          </div>
        ) : null}

        {editingPayment ? (
          <div className={mode === "create" || isSupplierArchived ? "mt-5" : ""}>
            <SupplierPaymentForm
              supplierId={supplierId}
              mode="edit"
              payment={editingPayment}
              onCancel={() => setEditingPaymentId(null)}
              onSaved={() => setEditingPaymentId(null)}
            />
          </div>
        ) : null}

        {initialPayments.length > 0 ? (
          <div
            className={
              mode === "create" || editingPayment || isSupplierArchived
                ? "mt-5"
                : ""
            }
          >
            <div className="grid gap-3 xl:hidden">
              {initialPayments.map((payment) => (
                <SupplierPaymentCard
                  key={payment.id}
                  supplierId={supplierId}
                  payment={payment}
                  isSupplierArchived={isSupplierArchived}
                  onEdit={() => {
                    setMode("list");
                    setEditingPaymentId(payment.id);
                  }}
                />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-border xl:block">
              <table className="w-full table-fixed border-collapse text-left">
                <caption className="sr-only">
                  Historial de pagos del proveedor {supplierName}
                </caption>

                <thead className="bg-surface-muted/70">
                  <tr className="border-b border-border">
                    <PaymentTableHeading className="w-[13%]">
                      Fecha
                    </PaymentTableHeading>
                    <PaymentTableHeading className="w-[16%]">
                      Método
                    </PaymentTableHeading>
                    <PaymentTableHeading className="w-[31%]">
                      Referencia y notas
                    </PaymentTableHeading>
                    <PaymentTableHeading align="right" className="w-[15%]">
                      Importe
                    </PaymentTableHeading>
                    <PaymentTableHeading className="w-[12%]">
                      Estado
                    </PaymentTableHeading>
                    <PaymentTableHeading align="right" className="w-[13%]">
                      Acciones
                    </PaymentTableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {initialPayments.map((payment) => (
                    <SupplierPaymentRow
                      key={payment.id}
                      supplierId={supplierId}
                      payment={payment}
                      isSupplierArchived={isSupplierArchived}
                      onEdit={() => {
                        setMode("list");
                        setEditingPaymentId(payment.id);
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : mode !== "create" ? (
          <EmptyPaymentsState canCreate={!isSupplierArchived} />
        ) : null}

        {initialMeta.totalItems > initialPayments.length ? (
          <p className="mt-4 rounded-2xl border border-border bg-surface-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
            Se muestran {initialPayments.length} de {initialMeta.totalItems} pagos.
            Más adelante agregaremos búsqueda y paginación dedicada.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function PaymentSummaryMetric({
  label,
  value,
  tone = "neutral",
  last = false,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warning";
  last?: boolean;
}) {
  return (
    <div
      className={buildClassName(
        "min-w-0 px-5 py-4 sm:px-6",
        !last && "border-b border-border sm:border-b-0 sm:border-r",
        tone === "warning" && "bg-warning/5.5",
      )}
    >
      <dt
        className={buildClassName(
          "text-[0.6rem] font-black uppercase tracking-[0.16em]",
          tone === "warning" ? "text-warning" : "text-muted-foreground",
        )}
      >
        {label}
      </dt>
      <dd className="mt-1.5 truncate font-display text-lg font-black tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function SupplierPaymentRow({
  supplierId,
  payment,
  isSupplierArchived,
  onEdit,
}: SupplierPaymentCardProps) {
  const isVoided = Boolean(payment.voidedAt);

  return (
    <tr
      className={buildClassName(
        "align-middle transition-colors",
        isVoided
          ? "bg-surface-muted/45 text-muted-foreground"
          : "bg-surface hover:bg-primary/2.5",
      )}
    >
      <PaymentTableCell>
        <p className="text-xs font-black text-foreground">
          {formatDate(payment.paidAt)}
        </p>
        <p className="mt-1 text-[0.66rem] font-semibold text-muted-foreground">
          Cargado {formatDateTime(payment.createdAt)}
        </p>
      </PaymentTableCell>

      <PaymentTableCell>
        <PaymentMethodBadge method={payment.method} />
        <p className="mt-1.5 text-[0.66rem] font-semibold text-muted-foreground">
          {payment.createdByUser?.name ?? "Sistema"}
        </p>
      </PaymentTableCell>

      <PaymentTableCell>
        <p className="wrap-anywhere text-xs font-black text-foreground">
          {payment.reference ? `Ref. ${payment.reference}` : "Sin referencia"}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {payment.notes ?? "Sin notas internas."}
        </p>
        {isVoided && payment.voidedReason ? (
          <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-5 text-warning">
            Motivo: {payment.voidedReason}
          </p>
        ) : null}
      </PaymentTableCell>

      <PaymentTableCell align="right">
        <span className="whitespace-nowrap text-sm font-black tabular-nums text-foreground">
          {formatMoney(payment.amount)}
        </span>
      </PaymentTableCell>

      <PaymentTableCell>
        <PaymentStatusBadge isVoided={isVoided} />
      </PaymentTableCell>

      <PaymentTableCell align="right">
        {!isSupplierArchived && !isVoided ? (
          <div className="inline-flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Corregir pago de ${formatMoney(payment.amount)}`}
              title="Corregir pago"
              className="grid size-9 place-items-center rounded-xl border border-border-strong bg-surface text-foreground transition hover:border-primary/60 hover:text-primary"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>

            <VoidSupplierPaymentButton
              supplierId={supplierId}
              paymentId={payment.id}
              compact
            />
          </div>
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">
            Sin acciones
          </span>
        )}
      </PaymentTableCell>
    </tr>
  );
}

function PaymentTableHeading({
  children,
  align = "left",
  className,
}: {
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={buildClassName(
        "px-4 py-3.5 text-[0.56rem] font-black uppercase tracking-[0.14em] text-muted-foreground",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

function PaymentTableCell({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className={buildClassName(
        "px-4 py-4",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </td>
  );
}

type SupplierPaymentFormProps = {
  supplierId: string;
  mode: "create" | "edit";
  payment?: SupplierPayment;
  onCancel: () => void;
  onSaved: () => void;
};

/**
 * Create/edit form for supplier payments.
 */
function SupplierPaymentForm({
  supplierId,
  mode,
  payment,
  onCancel,
  onSaved,
}: SupplierPaymentFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amount, setAmount] = useState(toInputMoney(payment?.amount));
  const [paidAt, setPaidAt] = useState(
    payment?.paidAt ? toDateInputValue(payment.paidAt) : toDateInputValue(new Date()),
  );
  const [method, setMethod] = useState<SupplierPaymentMethod>(
    payment?.method ?? "OTHER",
  );
  const [reference, setReference] = useState(payment?.reference ?? "");
  const [notes, setNotes] = useState(payment?.notes ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const parsedAmount = parseMoneyInputValue(amount);

    if (parsedAmount === null || parsedAmount <= 0) {
      setErrorMessage("El monto del pago debe ser mayor a cero.");
      return;
    }

    if (!paidAt) {
      setErrorMessage("La fecha de pago es obligatoria.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (mode === "edit" && payment) {
        const input: UpdateSupplierPaymentInput = {
          amount: parsedAmount,
          paidAt: toApiDateTime(paidAt),
          method,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
        };

        await updateSupplierPayment(supplierId, payment.id, input);
      } else {
        const input: CreateSupplierPaymentInput = {
          amount: parsedAmount,
          paidAt: toApiDateTime(paidAt),
          method,
          reference: reference.trim() || undefined,
          notes: notes.trim() || undefined,
        };

        await createSupplierPayment(supplierId, input);
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
            {mode === "edit" ? "Corregir pago" : "Nuevo pago"}
          </p>
          <h3 className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
            {mode === "edit" ? "Actualizar movimiento" : "Registrar pago"}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Los pagos activos reducen la deuda del proveedor. Si hubo un error
            grave, anulá el pago en lugar de borrarlo.
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
          <FieldLabel htmlFor={`${mode}-supplier-payment-amount`}>
            Monto abonado *
          </FieldLabel>
          <MoneyInput
            id={`${mode}-supplier-payment-amount`}
            value={amount}
            onChange={setAmount}
            placeholder="50000"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${mode}-supplier-payment-date`}>
            Fecha de pago *
          </FieldLabel>
          <input
            id={`${mode}-supplier-payment-date`}
            type="date"
            value={paidAt}
            onChange={(event) => setPaidAt(event.target.value)}
            required
            className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${mode}-supplier-payment-method`}>
            Método
          </FieldLabel>
          <select
            id={`${mode}-supplier-payment-method`}
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as SupplierPaymentMethod)
            }
            className="h-11 w-full rounded-xl border border-border-strong bg-surface px-4 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${mode}-supplier-payment-reference`}>
            Referencia
          </FieldLabel>
          <TextInput
            id={`${mode}-supplier-payment-reference`}
            value={reference}
            onChange={setReference}
            placeholder="Ej: transferencia #1234"
          />
        </Field>
      </div>

      <Field className="mt-5">
        <FieldLabel htmlFor={`${mode}-supplier-payment-notes`}>
          Notas
        </FieldLabel>
        <textarea
          id={`${mode}-supplier-payment-notes`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Ej: Pago parcial de compras del mes."
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
              : "Registrando..."
            : mode === "edit"
              ? "Guardar pago"
              : "Registrar pago"}
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

type SupplierPaymentCardProps = {
  supplierId: string;
  payment: SupplierPayment;
  isSupplierArchived: boolean;
  onEdit: () => void;
};

/**
 * Compact payment movement card used below desktop width.
 */
function SupplierPaymentCard({
  supplierId,
  payment,
  isSupplierArchived,
  onEdit,
}: SupplierPaymentCardProps) {
  const isVoided = Boolean(payment.voidedAt);

  return (
    <article
      className={buildClassName(
        "overflow-hidden rounded-2xl border",
        isVoided
          ? "border-border bg-surface-muted/45"
          : "border-border bg-surface",
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PaymentMethodBadge method={payment.method} />
            <PaymentStatusBadge isVoided={isVoided} />
          </div>

          <p className="mt-3 font-display text-xl font-black tabular-nums text-foreground">
            {formatMoney(payment.amount)}
          </p>

          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Pagado el {formatDate(payment.paidAt)}
          </p>
        </div>

        {!isSupplierArchived && !isVoided ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:text-primary"
            >
              <Pencil className="size-4 shrink-0" aria-hidden="true" />
              Corregir
            </button>

            <VoidSupplierPaymentButton
              supplierId={supplierId}
              paymentId={payment.id}
            />
          </div>
        ) : null}
      </div>

      <dl className="grid sm:grid-cols-2">
        <PaymentDatum
          label="Referencia"
          value={payment.reference ?? "Sin referencia"}
        />
        <PaymentDatum
          label="Registró"
          value={payment.createdByUser?.name ?? "Sistema"}
        />
      </dl>

      <div className="border-t border-border bg-surface-muted/40 px-4 py-3">
        <p className="text-sm leading-6 text-muted-foreground">
          {payment.notes ?? "Sin notas internas."}
        </p>

        {isVoided ? (
          <p className="mt-2 text-sm font-semibold leading-6 text-warning">
            Pago anulado
            {payment.voidedAt ? ` el ${formatDate(payment.voidedAt)}` : ""}.
            {payment.voidedReason ? ` Motivo: ${payment.voidedReason}` : ""}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function PaymentDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-border px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <dt className="text-[0.58rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 wrap-anywhere text-xs font-black text-foreground">
        {value}
      </dd>
    </div>
  );
}

function VoidSupplierPaymentButton({
  supplierId,
  paymentId,
  compact = false,
}: {
  supplierId: string;
  paymentId: string;
  compact?: boolean;
}) {
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

    if (reason.trim().length < 5) {
      setErrorMessage("El motivo debe tener al menos 5 caracteres.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await voidSupplierPayment(supplierId, paymentId, {
        reason: reason.trim(),
      });

      setIsOpen(false);
      setReason("");
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Anular pago"
        title="Anular pago"
        className={
          compact
            ? "grid size-9 place-items-center rounded-xl border border-warning/45 bg-warning/10 text-warning transition hover:border-warning"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-warning/45 bg-warning/10 px-4 text-sm font-bold text-foreground transition hover:border-warning"
        }
      >
        <Archive className="size-4 shrink-0" aria-hidden="true" />
        {compact ? <span className="sr-only">Anular</span> : "Anular"}
      </button>

      {isOpen ? (
        <div
          role="presentation"
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !isSubmitting) {
              setIsOpen(false);
              setReason("");
              setErrorMessage(null);
            }
          }}
        >
          <form
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="void-supplier-payment-heading"
            className="w-full max-w-lg rounded-[1.35rem] border border-border bg-surface p-5 shadow-2xl sm:p-6"
            noValidate
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-warning">
                  Corrección financiera
                </p>
                <h3
                  id="void-supplier-payment-heading"
                  className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
                >
                  Anular pago
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  El movimiento se conservará en el historial y dejará de
                  descontarse de la deuda del proveedor.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setReason("");
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
                aria-label="Cerrar"
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-border-strong bg-surface-muted text-foreground transition hover:border-primary/60"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <label
              htmlFor={`void-supplier-payment-${paymentId}`}
              className="mt-5 block text-sm font-bold text-foreground"
            >
              Motivo de anulación
            </label>
            <textarea
              id={`void-supplier-payment-${paymentId}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Ej: Pago cargado por error."
              className="mt-2 w-full resize-y rounded-xl border border-border-strong bg-surface-muted px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            {errorMessage ? (
              <p
                className="mt-3 rounded-xl border border-primary/35 bg-primary/10 px-3 py-2 text-sm font-semibold text-foreground"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Anulando..." : "Confirmar anulación"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setReason("");
                  setErrorMessage(null);
                }}
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

function EmptyPaymentsState({ canCreate }: { canCreate: boolean }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface-muted/55 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-surface text-primary">
          <ReceiptText className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">
            Pagos preparados
          </p>
          <h3 className="mt-2 font-display text-base font-black uppercase tracking-[0.04em] text-foreground">
            Sin pagos registrados
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {canCreate
              ? "Registrá pagos parciales o totales para calcular deuda real por proveedor."
              : "Restaurá el proveedor para volver a registrar pagos."}
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodBadge({ method }: { method: SupplierPaymentMethod }) {
  const iconByMethod: Record<SupplierPaymentMethod, ReactNode> = {
    CASH: <Banknote className="size-3" aria-hidden="true" />,
    BANK_TRANSFER: <Landmark className="size-3" aria-hidden="true" />,
    MERCADO_PAGO: <Smartphone className="size-3" aria-hidden="true" />,
    CARD: <CreditCard className="size-3" aria-hidden="true" />,
    OTHER: <CircleDollarSign className="size-3" aria-hidden="true" />,
  };

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.14em] text-primary">
      {iconByMethod[method]}
      {formatPaymentMethod(method)}
    </span>
  );
}

function PaymentStatusBadge({ isVoided }: { isVoided: boolean }) {
  if (isVoided) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/35 bg-warning/10 px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.13em] text-warning">
        <Archive className="size-3" aria-hidden="true" />
        Anulado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.13em] text-muted-foreground">
      <CalendarClock className="size-3" aria-hidden="true" />
      Registrado
    </span>
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
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
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

const PAYMENT_METHOD_OPTIONS: Array<{
  value: SupplierPaymentMethod;
  label: string;
}> = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK_TRANSFER", label: "Transferencia" },
  { value: "MERCADO_PAGO", label: "Mercado Pago" },
  { value: "CARD", label: "Tarjeta" },
  { value: "OTHER", label: "Otro método" },
];

function formatPaymentMethod(method: SupplierPaymentMethod): string {
  const option = PAYMENT_METHOD_OPTIONS.find(
    (methodOption) => methodOption.value === method,
  );

  return option?.label ?? method;
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

function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function toApiDateTime(dateValue: string): string {
  return `${dateValue}T12:00:00.000Z`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildClassName(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}