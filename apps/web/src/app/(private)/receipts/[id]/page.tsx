import {
  ArrowLeft,
  CarFront,
  Download,
  Mail,
  ReceiptText,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ApiError } from "../../../../lib/api";
import { env } from "../../../../lib/env";
import {
  formatDate,
  formatDateTime,
  formatMileage,
  formatMoney,
  formatReceiptNumber,
} from "../../../../lib/format";
import { ReceiptEmailForm } from "../../../../features/receipts/components/ReceiptEmailForm";
import { getReceipt } from "../../../../features/receipts/receipts.server";
import type { Receipt } from "../../../../features/receipts/types";

type ReceiptDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Recibo interno",
};

/**
 * Receipt detail page.
 *
 * Shows the immutable receipt snapshot using a cleaner talonario-style internal
 * receipt layout while keeping operational actions on a separate side panel.
 */
export default async function ReceiptDetailPage({
  params,
}: ReceiptDetailPageProps) {
  const resolvedParams = await params;
  const receipt = await getReceiptOrNotFound(resolvedParams.id);
  const customer = receipt.customerSnapshot;
  const vehicle = receipt.vehicleSnapshot;
  const work = receipt.workSnapshot;
  const receiptNumber = formatReceiptNumber(receipt.receiptNumber);
  const pdfUrl = `${env.apiBaseUrl}/receipts/${receipt.id}/pdf`;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/work-orders/${receipt.workOrderId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          Volver a la orden
        </Link>

        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-4 py-2 text-sm font-bold text-foreground">
          <ReceiptText
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          Recibo interno #{receiptNumber}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,860px)_360px] xl:items-start xl:justify-center">
        <article
          aria-labelledby="receipt-paper-heading"
          className="min-w-0 overflow-hidden rounded-[1.15rem] border border-slate-300 bg-white text-slate-950 shadow-(--shadow-industrial)"
        >
          <header className="border-b border-slate-200 px-5 py-6 sm:px-8">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px] md:items-start">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-black uppercase tracking-[0.24em] text-primary">
                  Comprobante interno
                </p>

                <h1
                  id="receipt-paper-heading"
                  className="mt-3 font-display text-4xl font-black uppercase tracking-[0.02em] text-slate-950 sm:text-[2.65rem]"
                >
                  {receipt.workshop.name}
                </h1>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  Recibo interno emitido a partir de la orden de trabajo.
                </p>
              </div>

              <div className="rounded-xl border border-slate-900/80 bg-white">
                <div className="border-b border-slate-200 px-4 py-2 text-center">
                  <p className="text-[0.66rem] font-black uppercase tracking-[0.22em] text-slate-700">
                    Recibo interno
                  </p>
                </div>

                <div className="px-4 py-4 text-center">
                  <p className="font-display text-3xl font-black tracking-[0.03em] text-primary">
                    Nº {receiptNumber}
                  </p>

                  <p className="mt-3 text-sm font-black text-slate-950">
                    Orden #{work.orderNumber}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Emitido: {formatDateTime(receipt.issuedAt)}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <section className="border-b border-slate-200 px-5 py-5 sm:px-8">
            <div className="grid gap-6 md:grid-cols-2">
              <ReceiptBlock
                title="Cliente"
                items={[
                  { label: "Cliente", value: customer.fullName },
                  { label: "Teléfono", value: customer.phone ?? "Sin teléfono" },
                  { label: "Email", value: customer.email ?? "Sin email" },
                ]}
              />

              <ReceiptBlock
                title="Orden"
                items={[
                  { label: "Orden", value: `#${work.orderNumber}` },
                  { label: "Fecha de ingreso", value: formatDate(work.entryDate) },
                  {
                    label: "Estado",
                    value: work.statusLabel ?? "Sin estado",
                  },
                ]}
              />
            </div>
          </section>

          <section className="border-b border-slate-200 px-5 py-5 sm:px-8">
            <ReceiptSectionTitle>Datos del vehículo</ReceiptSectionTitle>

            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <ReceiptBlock
                items={[
                  { label: "Patente", value: vehicle.licensePlate },
                  { label: "Marca", value: vehicle.brand },
                  { label: "Modelo", value: vehicle.model },
                ]}
              />

              <ReceiptBlock
                items={[
                  {
                    label: "Año",
                    value: vehicle.year ? vehicle.year.toString() : "Sin cargar",
                  },
                  {
                    label: "Kilometraje",
                    value: formatMileage(vehicle.mileage),
                  },
                  {
                    label: "Km de ingreso",
                    value: formatMileage(work.entryMileage),
                  },
                ]}
              />
            </div>
          </section>

          <section className="border-b border-slate-200 px-5 py-5 sm:px-8">
            <ReceiptSectionTitle>Detalle del trabajo</ReceiptSectionTitle>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-300">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-600">
                      Concepto
                    </th>
                    <th className="w-32 px-4 py-2.5 text-right text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-600">
                      Importe
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <ReceiptDescriptionRow
                    title="Problema reportado"
                    description={work.reportedIssue}
                  />

                  <ReceiptDescriptionRow
                    title="Diagnóstico"
                    description={work.diagnosis ?? "Diagnóstico pendiente"}
                  />

                  <ReceiptDescriptionRow
                    title="Trabajo realizado"
                    description={work.workDone ?? "Trabajo pendiente"}
                  />

                  <ReceiptDescriptionRow
                    title="Repuestos usados"
                    description={formatMultilineText(
                      work.partsUsed,
                      "Sin repuestos cargados",
                    )}
                  />

                  <ReceiptAmountRow
                    label="Mano de obra"
                    value={formatMoney(receipt.laborCost)}
                  />

                  <ReceiptAmountRow
                    label="Repuestos"
                    value={formatMoney(receipt.partsCost)}
                  />
                </tbody>

                <tfoot>
                  <tr className="bg-slate-50">
                    <td className="border-t border-slate-300 px-4 py-3 text-base font-black uppercase tracking-[0.08em] text-slate-950">
                      Total
                    </td>

                    <td className="border-t border-slate-300 px-4 py-3 text-right text-xl font-black text-primary">
                      {formatMoney(receipt.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">
                Observaciones
              </p>

              <div className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                {receipt.notes ?? "Sin observaciones"}
              </div>
            </div>
          </section>

          <section className="px-3 py-3 sm:px-8">        
            <div className="mt-2 border-slate-300 pt-2">
              <p className="text-center text-xs font-semibold leading-5 text-slate-500">
                Este comprobante es de uso interno del taller y no reemplaza
                factura, comprobante fiscal ni documentación emitida por un
                organismo tributario.
              </p>
            </div>
          </section>
        </article>

        <aside className="min-w-0 space-y-6 xl:h-fit xl:self-start">
          <section className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Acciones
            </p>

            <h2 className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground">
              Recibo interno
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Descargá el PDF o volvé a la orden asociada.
            </p>

            <div className="mt-5 grid gap-3">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
              >
                <Download className="size-4 shrink-0" aria-hidden="true" />
                Descargar PDF
              </a>

              <Link
                href={`/work-orders/${receipt.workOrderId}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
              >
                <ReceiptText className="size-4 shrink-0" aria-hidden="true" />
                Ver orden
              </Link>
            </div>
          </section>

          <ReceiptContextCard
            icon={<UserRound className="size-4" aria-hidden="true" />}
            label="Cliente"
            title={customer.fullName}
            href={`/customers/${customer.id}`}
            linkLabel="Ver cliente"
          />

          <ReceiptContextCard
            icon={<CarFront className="size-4" aria-hidden="true" />}
            label="Vehículo"
            title={`${vehicle.brand} ${vehicle.model}`}
            description={vehicle.licensePlate}
            href={`/vehicles/${vehicle.id}`}
            linkLabel="Abrir ficha"
          />

          <section
            aria-labelledby="receipt-email-heading"
            className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
          >
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
                <Mail className="size-5" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                  Envío
                </p>

                <h2
                  id="receipt-email-heading"
                  className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
                >
                  Enviar por email
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Adjunta el PDF del recibo interno al email indicado.
                </p>
              </div>
            </div>

            {receipt.emailedAt ? (
              <p className="mt-5 rounded-2xl border border-border-strong bg-surface-muted px-4 py-3 text-sm font-semibold leading-6 text-foreground">
                Último envío: {formatDateTime(receipt.emailedAt)}
                {receipt.emailTo ? ` a ${receipt.emailTo}` : ""}
              </p>
            ) : null}

            <div className="mt-5">
              <ReceiptEmailForm
                receiptId={receipt.id}
                defaultEmail={customer.email}
              />
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

/**
 * Fetches a receipt and converts backend 404 responses into Next notFound.
 */
async function getReceiptOrNotFound(receiptId: string): Promise<Receipt> {
  try {
    return await getReceipt(receiptId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

/**
 * Compact titled section label for the receipt document.
 */
function ReceiptSectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary">
      {children}
    </p>
  );
}

/**
 * Compact block used to group receipt metadata without excessive separators.
 */
function ReceiptBlock({
  title,
  items,
}: {
  title?: string;
  items: Array<{
    label: string;
    value: ReactNode;
  }>;
}) {
  return (
    <div className="space-y-3">
      {title ? <ReceiptSectionTitle>{title}</ReceiptSectionTitle> : null}

      <div className="grid gap-3">
        {items.map((item) => (
          <div key={item.label} className="grid gap-1">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </p>

            <div className="wrap-anywhere text-sm font-bold leading-6 text-slate-950">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReceiptDescriptionRow({
  title,
  description,
}: {
  title: string;
  description: ReactNode;
}) {
  return (
    <tr className="border-t border-slate-200">
      <td className="px-4 py-3 align-top">
        <p className="text-sm font-black text-slate-950">{title}</p>

        <div className="mt-0.5 wrap-anywhere text-sm font-medium leading-5 text-slate-600">
          {description}
        </div>
      </td>

      <td className="px-4 py-3 text-right align-top text-sm font-bold text-slate-400">
        —
      </td>
    </tr>
  );
}

function ReceiptAmountRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-slate-200">
      <td className="px-4 py-2.5 text-sm font-bold text-slate-700">{label}</td>

      <td className="px-4 py-2.5 text-right text-sm font-black text-slate-950">
        {value}
      </td>
    </tr>
  );
}


function ReceiptContextCard({
  icon,
  label,
  title,
  description,
  href,
  linkLabel,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  description?: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <section className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            {label}
          </p>

          <h2 className="mt-2 wrap-anywhere font-display text-xl font-black uppercase tracking-[0.04em] text-foreground">
            {title}
          </h2>

          {description ? (
            <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}

          <Link
            href={href}
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
          >
            {linkLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function formatMultilineText(value: string | null, fallback: string) {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  return <span className="whitespace-pre-line">{value}</span>;
}