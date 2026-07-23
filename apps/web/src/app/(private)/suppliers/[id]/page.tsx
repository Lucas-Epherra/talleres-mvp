import {
  ArrowLeft,
  Archive,
  CalendarClock,
  ClipboardList,
  Handshake,
  PackageSearch,
  Pencil,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SupplierArchiveActions } from "../../../../features/suppliers/components/SupplierArchiveActions";
import { SupplierPartsCatalog } from "../../../../features/suppliers/components/SupplierPartsCatalog";
import { SupplierPaymentsPanel } from "../../../../features/suppliers/components/SupplierPaymentsPanel";
import {
  getSupplier,
  getSupplierCategories,
  getSupplierParts,
  getSupplierPayments,
} from "../../../../features/suppliers/suppliers.server";
import type {
  Supplier,
  SupplierEvent,
  SupplierWorkOrderLinePreview,
} from "../../../../features/suppliers/types";
import { ApiError } from "../../../../lib/api";
import {
  formatDateTime,
  formatMoney,
  formatWorkOrderStatus,
} from "../../../../lib/format";

type SupplierDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Detalle de proveedor",
};

/**
 * Supplier detail page.
 *
 * Shows the supplier profile, full-width catalog, linked purchases, payments and audit trail.
 */
export default async function SupplierDetailPage({ params }: SupplierDetailPageProps) {
  const { id } = await params;
  const supplier = await resolveSupplier(id);
  const [partsResponse, paymentsResponse, categoriesResponse] = await Promise.all([
    getSupplierParts(supplier.id, {
      limit: 50,
      archiveStatus: "all",
      activeStatus: "all",
    }),
    getSupplierPayments(supplier.id, {
      limit: 50,
      paymentStatus: "all",
    }),
    getSupplierCategories({
      limit: 50,
      archiveStatus: "active",
    }),
  ]);
  const isArchived = Boolean(supplier.archivedAt);

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/suppliers"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
              Volver a proveedores
            </Link>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <p className="inline-flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                <Handshake className="size-4 shrink-0" aria-hidden="true" />
                Ficha del proveedor
              </p>

              {isArchived ? <ArchivedBadge /> : null}
            </div>

            <h1 className="mt-3 wrap-anywhere font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              {supplier.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Datos de contacto, categorías, compras vinculadas a órdenes, pagos
              registrados, deuda y margen estimado por repuestos.
            </p>
          </div>

          <div className="grid shrink-0 gap-3 sm:grid-cols-2 lg:flex lg:flex-col lg:pt-10">
            <Link
              href={`/suppliers/${supplier.id}/edit`}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
            >
              <Pencil className="size-4 shrink-0" aria-hidden="true" />
              Editar proveedor
            </Link>

            <Link
              href="#supplier-parts-heading"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
            >
              <PackageSearch className="size-4 shrink-0" aria-hidden="true" />
              Ver repuestos
            </Link>
          </div>
        </div>
      </header>

      <SupplierMetricsGrid supplier={supplier} />

      <SupplierDataSection supplier={supplier} />

      <SupplierPartsCatalog
        supplierId={supplier.id}
        supplierName={supplier.name}
        categories={categoriesResponse.data}
        initialParts={partsResponse.data}
        initialMeta={partsResponse.meta}
        isSupplierArchived={isArchived}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <SupplierPurchasesSection lines={supplier.workOrderPartLines} />
        <SupplierEventsSection events={supplier.events} />
      </div>

      <SupplierPaymentsPanel
        supplierId={supplier.id}
        supplierName={supplier.name}
        initialPayments={paymentsResponse.data}
        initialMeta={paymentsResponse.meta}
        paidTotal={supplier.metrics.paidTotal}
        pendingBalance={supplier.metrics.pendingBalance}
        isSupplierArchived={isArchived}
      />

      <SupplierArchiveActions
        supplierId={supplier.id}
        isArchived={isArchived}
        archivedReason={supplier.archivedReason}
      />
    </section>
  );
}

type SupplierMetricsGridProps = {
  supplier: Supplier;
};

/**
 * Financial overview for one supplier.
 */
function SupplierMetricsGrid({ supplier }: SupplierMetricsGridProps) {
  return (
    <section
      aria-label="Resumen financiero del proveedor"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
    >
      <MetricCard
        label="Comprado"
        value={formatMoney(supplier.metrics.purchasedTotal)}
      />
      <MetricCard
        label="Abonado"
        value={formatMoney(supplier.metrics.paidTotal)}
      />
      <MetricCard
        label="Debe"
        value={formatMoney(supplier.metrics.pendingBalance)}
        tone={Number(supplier.metrics.pendingBalance) > 0 ? "warning" : "neutral"}
      />
      <MetricCard
        label="Cobrado al cliente"
        value={formatMoney(supplier.metrics.chargedToCustomerTotal)}
      />
      <MetricCard
        label="Margen repuestos"
        value={formatMoney(supplier.metrics.grossProfitTotal)}
      />
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "warning";
};

/**
 * Small metric card for supplier detail.
 */
function MetricCard({ label, value, tone = "neutral" }: MetricCardProps) {
  return (
    <div
      className={
        tone === "warning"
          ? "rounded-2xl border border-warning/45 bg-warning/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          : "rounded-2xl border border-border bg-surface-muted/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
      }
    >
      <p
        className={
          tone === "warning"
            ? "text-[0.68rem] font-bold uppercase tracking-[0.22em] text-warning"
            : "text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
        }
      >
        {label}
      </p>

      <p className="mt-2 wrap-anywhere font-display text-xl font-black text-foreground">
        {value}
      </p>
    </div>
  );
}

type SupplierDataSectionProps = {
  supplier: Supplier;
};

/**
 * Contact and identity data for the supplier profile.
 */
function SupplierDataSection({ supplier }: SupplierDataSectionProps) {
  return (
    <section
      aria-labelledby="supplier-data-heading"
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-5 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Datos
          </p>
          <h2
            id="supplier-data-heading"
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
          >
            Información del proveedor
          </h2>
        </div>

        <Link
          href={`/suppliers/${supplier.id}/edit`}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
        >
          <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
          Editar datos
        </Link>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <DetailDatum label="Nombre" value={supplier.name} />
        <DetailDatum label="Contacto" value={supplier.contactName ?? "Sin contacto"} />
        <DetailDatum label="Teléfono" value={supplier.phone ?? "Sin teléfono"} />
        <DetailDatum label="Email" value={supplier.email ?? "Sin email"} />
        <DetailDatum label="CUIT / ID fiscal" value={supplier.taxId ?? "Sin cargar"} />
        <DetailDatum label="Dirección" value={supplier.address ?? "Sin dirección"} />
        <DetailDatum label="Disponibilidad" value={supplier.archivedAt ? "Archivado" : "Disponible"} />
        <DetailDatum label="Actualizado" value={formatDateTime(supplier.updatedAt)} />
      </dl>

      <div className="mt-3 rounded-2xl border border-border bg-surface-muted/85 p-4">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
          Categorías
        </p>

        {supplier.categories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {supplier.categories.map((category) => (
              <span
                key={category.id}
                className="rounded-full border border-border-strong bg-surface px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-[0.14em] text-muted-foreground"
              >
                {category.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Este proveedor todavía no tiene categorías asignadas.
          </p>
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-surface-muted/85 p-4">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
          Notas
        </p>
        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
          {supplier.notes ?? "Sin notas internas."}
        </p>
      </div>
    </section>
  );
}

/**
 * Small key/value datum for supplier detail sections.
 */
function DetailDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <dt className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </dt>
      <dd className="mt-2 wrap-anywhere text-sm font-bold leading-5 text-foreground">
        {value}
      </dd>
    </div>
  );
}

function SupplierPurchasesSection({
  lines,
}: {
  lines: SupplierWorkOrderLinePreview[];
}) {
  return (
    <section
      aria-labelledby="supplier-purchases-heading"
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-5 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
            Compras
          </p>
          <h2
            id="supplier-purchases-heading"
            className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
          >
            Órdenes vinculadas
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Repuestos comprados a este proveedor y asociados a órdenes de trabajo.
          </p>
        </div>

        <span className="inline-flex w-fit items-center rounded-full border border-border bg-surface-muted/75 px-3 py-1.5 text-xs font-black text-foreground">
          {lines.length} registro{lines.length === 1 ? "" : "s"}
        </span>
      </div>

      {lines.length > 0 ? (
        <>
          <div className="mt-5 grid gap-3 xl:hidden">
            {lines.map((line) => (
              <Link
                key={line.id}
                href={`/work-orders/${line.workOrder.id}`}
                className="block rounded-2xl border border-border bg-surface-muted/75 p-4 transition hover:border-primary/35 hover:bg-surface-elevated"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 text-[0.62rem] font-black uppercase tracking-[0.16em] text-primary">
                      <ClipboardList className="size-3.5" aria-hidden="true" />
                      Orden #{line.workOrder.orderNumber} · {formatWorkOrderStatus(line.workOrder.status)}
                    </p>
                    <p className="mt-2 wrap-anywhere text-sm font-black text-foreground">
                      {line.partNameSnapshot}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">
                      {line.workOrder.vehicle.licensePlate} · {line.workOrder.vehicle.brand} {line.workOrder.vehicle.model} · {line.workOrder.vehicle.customer.fullName}
                    </p>
                  </div>

                  <div className="grid shrink-0 gap-2 sm:min-w-64 sm:grid-cols-3">
                    <MiniMoney label="Costo" value={line.supplierSubtotal} />
                    <MiniMoney label="Cliente" value={line.customerSubtotal} />
                    <MiniMoney label="Margen" value={line.grossProfit} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-border bg-surface xl:block">
            <table className="w-full table-fixed border-collapse text-left">
              <caption className="sr-only">
                Planilla de órdenes vinculadas al proveedor
              </caption>
              <thead className="bg-surface-muted/75">
                <tr className="border-b border-border">
                  <th className="w-[17%] px-3 py-3.5 text-[0.56rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Orden</th>
                  <th className="w-[25%] px-3 py-3.5 text-[0.56rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Repuesto</th>
                  <th className="w-[24%] px-3 py-3.5 text-[0.56rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Vehículo / cliente</th>
                  <th className="w-[11%] px-3 py-3.5 text-right text-[0.56rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Costo</th>
                  <th className="w-[12%] px-3 py-3.5 text-right text-[0.56rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Cliente</th>
                  <th className="w-[11%] px-3 py-3.5 text-right text-[0.56rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Margen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line, index) => (
                  <tr
                    key={line.id}
                    className={index % 2 === 0 ? "bg-surface transition-colors hover:bg-primary/[0.035]" : "bg-surface-muted/18 transition-colors hover:bg-primary/[0.035]"}
                  >
                    <td className="px-3 py-3.5">
                      <Link
                        href={`/work-orders/${line.workOrder.id}`}
                        className="inline-flex flex-col font-black text-foreground transition hover:text-primary"
                      >
                        <span>#{line.workOrder.orderNumber}</span>
                        <span className="mt-1 text-[0.58rem] uppercase tracking-[0.12em] text-muted-foreground">
                          {formatWorkOrderStatus(line.workOrder.status)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="wrap-anywhere text-xs font-black text-foreground">
                        {line.partNameSnapshot}
                      </p>
                      {line.supplierPart?.sku ? (
                        <p className="mt-1 text-[0.66rem] font-semibold text-muted-foreground">
                          SKU {line.supplierPart.sku}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-xs font-bold text-foreground">
                        {line.workOrder.vehicle.licensePlate} · {line.workOrder.vehicle.brand} {line.workOrder.vehicle.model}
                      </p>
                      <p className="mt-1 truncate text-[0.66rem] font-semibold text-muted-foreground">
                        {line.workOrder.vehicle.customer.fullName}
                      </p>
                    </td>
                    <td className="px-3 py-3.5 text-right text-xs font-black tabular-nums text-foreground">
                      {formatMoney(line.supplierSubtotal)}
                    </td>
                    <td className="px-3 py-3.5 text-right text-xs font-black tabular-nums text-foreground">
                      {formatMoney(line.customerSubtotal)}
                    </td>
                    <td className="px-3 py-3.5 text-right text-xs font-black tabular-nums text-primary">
                      {formatMoney(line.grossProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <ModulePlaceholder
          eyebrow="Compras preparadas"
          title="Sin compras vinculadas"
          description="Cuando cargues repuestos estructurados en órdenes, este historial mostrará costo proveedor, precio cliente y margen por línea."
        />
      )}
    </section>
  );
}

function ModulePlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-border bg-surface-muted/55 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-surface text-primary">
          <PackageSearch className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h3 className="mt-2 font-display text-base font-black uppercase tracking-[0.04em] text-foreground">
            {title}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function SupplierEventsSection({ events }: { events: SupplierEvent[] }) {
  return (
    <section
      aria-labelledby="supplier-events-heading"
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-5 shadow-(--shadow-industrial) ring-1 ring-white/3"
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        Auditoría
      </p>
      <h2
        id="supplier-events-heading"
        className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
      >
        Actividad reciente
      </h2>

      {events.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl border border-border bg-surface-muted/85 p-3.5"
            >
              <p className="inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
                <CalendarClock className="size-3.5" aria-hidden="true" />
                {formatDateTime(event.createdAt)}
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                {event.description ?? formatSupplierEventType(event.type)}
              </p>

              {event.user ? (
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <UserRound className="size-3.5" aria-hidden="true" />
                  {event.user.name}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-surface-muted/70 px-4 py-4 text-sm leading-6 text-muted-foreground">
          Sin eventos registrados.
        </p>
      )}
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  headingId: string;
  title: string;
  description: string;
};

/**
 * Shared supplier detail section heading.
 */
function SectionHeading({ eyebrow, headingId, title, description }: SectionHeadingProps) {
  return (
    <div className="border-b border-border pb-5">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {eyebrow}
      </p>
      <h2
        id={headingId}
        className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
      >
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function MiniMoney({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2">
      <p className="text-[0.58rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-foreground">
        {formatMoney(value)}
      </p>
    </div>
  );
}

function ArchivedBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
      <Archive className="size-4 shrink-0" aria-hidden="true" />
      Proveedor archivado
    </span>
  );
}

async function resolveSupplier(id: string): Promise<Supplier> {
  try {
    return await getSupplier(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

function formatSupplierEventType(type: string): string {
  const labels: Record<string, string> = {
    CREATED: "Proveedor creado",
    UPDATED: "Proveedor actualizado",
    ARCHIVED: "Proveedor archivado",
    RESTORED: "Proveedor restaurado",
    CATEGORY_ASSIGNED: "Categoría asignada",
    CATEGORY_REMOVED: "Categoría removida",
    PART_CREATED: "Repuesto creado",
    PART_UPDATED: "Repuesto actualizado",
    PART_ARCHIVED: "Repuesto archivado",
    PAYMENT_CREATED: "Pago registrado",
    PAYMENT_UPDATED: "Pago actualizado",
    PAYMENT_VOIDED: "Pago anulado",
  };

  return labels[type] ?? type;
}