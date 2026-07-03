import { Download, MailCheck, ReceiptText } from "lucide-react";
import Link from "next/link";
import { env } from "../../../lib/env";
import { formatDate, formatMoney, formatReceiptNumber } from "../utils";
import type { DashboardReceipt } from "../types";

type RecentReceiptsPanelProps = {
  receipts: DashboardReceipt[];
};

/**
 * Shows latest emitted internal receipts.
 */
export function RecentReceiptsPanel({ receipts }: RecentReceiptsPanelProps) {
  return (
    <section
      aria-labelledby="recent-receipts-heading"
      className="rounded-[1.35rem] border border-border bg-white/95 p-5 shadow-(--shadow-industrial) ring-1 ring-white/60"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-[0.66rem] font-black uppercase tracking-[0.22em] text-primary">
            Recibos
          </p>

          <h2
            id="recent-receipts-heading"
            className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
          >
            Últimos emitidos
          </h2>
        </div>

        <Link
          href="/receipts"
          className="text-xs font-black uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
        >
          Ver todos
        </Link>
      </div>

      {receipts.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {receipts.slice(0, 5).map((receipt) => (
            <ReceiptRow key={receipt.id} receipt={receipt} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-border-strong bg-surface-muted/60 p-4 text-sm leading-6 text-muted-foreground">
          Todavía no hay recibos emitidos para mostrar.
        </p>
      )}
    </section>
  );
}

function ReceiptRow({ receipt }: { receipt: DashboardReceipt }) {
  const pdfUrl = `${env.apiBaseUrl}/receipts/${receipt.id}/pdf`;

  return (
    <article className="rounded-2xl border border-border bg-surface-muted/55 p-3.5 transition hover:border-primary/30 hover:bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.14em] text-primary">
            <ReceiptText className="size-3.5" aria-hidden="true" />
            #{formatReceiptNumber(receipt.receiptNumber)}
          </p>

          <h3 className="mt-1 line-clamp-1 text-sm font-black text-foreground">
            {receipt.customerSnapshot.fullName}
          </h3>

          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            Orden #{receipt.workOrder.orderNumber} · {receipt.vehicleSnapshot.licensePlate}
          </p>
        </div>

        <p className="shrink-0 text-right text-sm font-black text-foreground">
          {formatMoney(receipt.total)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-xs font-semibold text-muted-foreground">
          {formatDate(receipt.issuedAt)}
        </span>

        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <MailCheck
            className={receipt.emailedAt ? "size-3.5 text-success" : "size-3.5 text-muted-foreground"}
            aria-hidden="true"
          />
          {receipt.emailedAt ? "Enviado" : "No enviado"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          href={`/receipts/${receipt.id}`}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3 text-xs font-bold text-white transition hover:bg-primary-hover"
        >
          Ver recibo
        </Link>

        <a
          href={pdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border-strong bg-white px-3 text-xs font-bold text-foreground transition hover:border-primary/60"
        >
          <Download className="size-3.5" aria-hidden="true" />
          PDF
        </a>
      </div>
    </article>
  );
}
