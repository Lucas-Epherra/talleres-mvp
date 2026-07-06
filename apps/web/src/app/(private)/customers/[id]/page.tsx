import {
  Archive,
  ArrowLeft,
  CalendarDays,
  CarFront,
  ClipboardList,
  Clock3,
  Eye,
  Gauge,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ReceiptText,
  UserRound,
  Wrench,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { EmptyState } from "../../../../components/ui/EmptyState";
import {
  DetailSheet,
  DetailSheetRow,
} from "../../../../components/ui/DetailSheet";
import { NotesValue } from "../../../../components/ui/NotesValue";
import { CustomerArchiveActions } from "../../../../features/customers/components/CustomerArchiveActions";
import { getCustomer } from "../../../../features/customers/customers.server";
import type {
  Customer,
  CustomerAppointmentRef,
  CustomerEvent,
  CustomerReceiptRef,
  CustomerVehicle,
  CustomerVehicleWorkOrder,
} from "../../../../features/customers/types";
import { ApiError } from "../../../../lib/api";
import {
  formatDate,
  formatDateTime,
  formatMileage,
  formatMoney,
  formatReceiptNumber,
  formatWorkOrderStatus,
} from "../../../../lib/format";

type CustomerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CustomerWorkOrderWithVehicle = CustomerVehicleWorkOrder & {
  vehicle: CustomerVehicle;
};

type CustomerReceiptWithContext = CustomerReceiptRef & {
  workOrder: CustomerWorkOrderWithVehicle;
  vehicle: CustomerVehicle;
};

export const metadata: Metadata = {
  title: "Detalle de cliente",
};

/**
 * Customer detail page.
 *
 * Uses the enriched customer endpoint as the single source of truth for the
 * customer profile, associated vehicles, work orders, receipts and upcoming
 * appointments. This avoids fetching full workshop-wide lists in the page.
 */
export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const customer = await resolveCustomer(id);

  const isArchived = Boolean(customer.archivedAt);
  const vehicles = customer.vehicles ?? [];
  const workOrders = getCustomerWorkOrders(vehicles);
  const activeWorkOrders = getActiveWorkOrders(workOrders);
  const closedWorkOrders = getClosedWorkOrders(workOrders);
  const receipts = getCustomerReceipts(workOrders);
  const nextAppointment = getNextAppointment(customer);
  const latestWorkOrder = getLatestWorkOrder(workOrders);
  const primaryVehicle = getPrimaryVehicle(vehicles);
  const lastMileage = getLastMileage(vehicles, workOrders);

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 size-64 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/customers"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
              Volver a clientes
            </Link>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary">
                Ficha del cliente
              </p>

              {isArchived ? <ArchivedBadge /> : null}
            </div>

            <h1 className="mt-3 wrap-anywhere font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              {customer.fullName}
            </h1>

            <div className="mt-4 flex flex-col gap-2 text-sm font-semibold leading-6 text-muted-foreground md:flex-row md:flex-wrap md:items-center">
              <ContactPill icon={<Phone className="size-4" aria-hidden="true" />}>
                {customer.phone}
              </ContactPill>

              <ContactPill icon={<Mail className="size-4" aria-hidden="true" />}>
                {customer.email ?? "Sin email"}
              </ContactPill>

              <ContactPill icon={<MapPin className="size-4" aria-hidden="true" />}>
                {customer.address ?? "Sin dirección"}
              </ContactPill>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
              Vista operativa para revisar vehículos, trabajos abiertos,
              historial, turnos próximos y recibos emitidos sin salir de la
              ficha del cliente.
            </p>
          </div>

          <div className="grid shrink-0 gap-3 sm:grid-cols-3 lg:w-64 lg:grid-cols-1">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              <Pencil className="size-4 shrink-0" aria-hidden="true" />
              Editar cliente
            </Link>

            {!isArchived ? (
              <Link
                href={`/vehicles/new?customerId=${customer.id}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
              >
                <CarFront className="size-4 shrink-0" aria-hidden="true" />
                Cargar vehículo
              </Link>
            ) : (
              <span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-5 text-sm font-bold text-muted-foreground">
                <Archive className="size-4 shrink-0" aria-hidden="true" />
                Sin nuevos vehículos
              </span>
            )}

            {!isArchived && primaryVehicle ? (
              <Link
                href={`/work-orders/new?vehicleId=${primaryVehicle.id}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
              >
                <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
                Nueva orden
              </Link>
            ) : (
              <span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted px-5 text-sm font-bold text-muted-foreground">
                <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
                Nueva orden
              </span>
            )}
          </div>
        </div>
      </header>

      <section
        aria-labelledby="customer-today-heading"
        className="rounded-[1.35rem] border border-border bg-linear-to-br from-white via-surface to-surface-muted p-5 shadow-(--shadow-industrial) ring-1 ring-white/70 sm:p-6"
      >
        <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary">
              Para revisar
            </p>

            <h2
              id="customer-today-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
            >
              Resumen rápido
            </h2>
          </div>

          <p className="w-fit rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-[0.66rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
            {isArchived ? "Cliente archivado" : "Cliente activo"}
          </p>
        </div>

        <dl className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            icon={<CarFront className="size-4" aria-hidden="true" />}
            label="Vehículos"
            value={vehicles.length.toString()}
            helper={`${getActiveVehicles(vehicles).length} activos`}
          />
          <SummaryMetric
            icon={<Wrench className="size-4" aria-hidden="true" />}
            label="Órdenes abiertas"
            value={activeWorkOrders.length.toString()}
            helper={getActiveOrderHelper(activeWorkOrders)}
          />
          <SummaryMetric
            icon={<Gauge className="size-4" aria-hidden="true" />}
            label="Último kilometraje"
            value={lastMileage}
            helper="Según vehículos u órdenes"
          />
          <SummaryMetric
            icon={<ReceiptText className="size-4" aria-hidden="true" />}
            label="Recibos"
            value={receipts.length.toString()}
            helper="Comprobantes emitidos"
          />
        </dl>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="space-y-6 sm:space-y-8">
          <DetailSheet
            headingId="customer-data-heading"
            title="Datos del cliente"
            action={
              <Link
                href={`/customers/${customer.id}/edit`}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
              >
                <Pencil className="size-3.5 shrink-0" aria-hidden="true" />
                Editar datos
              </Link>
            }
          >
            <DetailSheetRow label="Nombre" value={customer.fullName} />
            <DetailSheetRow label="Teléfono" value={customer.phone} />
            <DetailSheetRow
              label="Email"
              value={
                <BreakableDetailValue value={customer.email ?? "Sin email"} />
              }
            />
            <DetailSheetRow
              label="Dirección"
              value={
                <BreakableDetailValue
                  value={customer.address ?? "Sin dirección"}
                />
              }
            />
            <DetailSheetRow
              label="Estado de ficha"
              value={isArchived ? "Archivado" : "Activo"}
            />
            {isArchived ? (
              <>
                <DetailSheetRow
                  label="Archivado el"
                  value={formatDate(customer.archivedAt)}
                />
                <DetailSheetRow
                  label="Motivo de archivado"
                  value={
                    <NotesValue
                      value={customer.archivedReason}
                      fallback="Sin motivo registrado"
                    />
                  }
                />
              </>
            ) : null}
            <DetailSheetRow
              label="Notas"
              value={<NotesValue value={customer.notes} fallback="Sin notas" />}
            />
          </DetailSheet>

          <CustomerArchiveActions
            customerId={customer.id}
            isArchived={isArchived}
            activeWorkOrdersCount={activeWorkOrders.length}
            archivedReason={customer.archivedReason}
          />

          <section
            aria-labelledby="customer-vehicles-heading"
            className="space-y-4"
          >
            <SectionHeading
              headingId="customer-vehicles-heading"
              eyebrow="Vehículos"
              title="Vehículos asociados"
              description="Fichas de vehículos vinculadas directamente a este cliente."
              count={`${vehicles.length} vehículo${vehicles.length === 1 ? "" : "s"}`}
            />

            {vehicles.length > 0 ? (
              <div className="grid gap-4">
                {vehicles.map((vehicle) => (
                  <CustomerVehicleCard
                    key={vehicle.id}
                    customerId={customer.id}
                    isCustomerArchived={isArchived}
                    vehicle={vehicle}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                eyebrow="Sin vehículos"
                title="Este cliente todavía no tiene vehículos asociados"
                description={
                  isArchived
                    ? "El cliente está archivado. Para cargar vehículos nuevos, primero restauralo."
                    : "Cargá el primer vehículo para empezar a construir su ficha operativa y registrar órdenes de trabajo."
                }
                actions={getVehiclesEmptyActions(customer.id, isArchived)}
              />
            )}
          </section>

          <section
            aria-labelledby="customer-active-work-orders-heading"
            className="space-y-4"
          >
            <SectionHeading
              headingId="customer-active-work-orders-heading"
              eyebrow="Trabajo actual"
              title="Órdenes abiertas"
              description="Trabajos pendientes, en progreso o listos para entregar."
              count={`${activeWorkOrders.length} orden${activeWorkOrders.length === 1 ? "" : "es"}`}
            />

            {activeWorkOrders.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {activeWorkOrders.map((workOrder) => (
                  <CustomerWorkOrderCard key={workOrder.id} workOrder={workOrder} />
                ))}
              </div>
            ) : (
              <EmptyState
                eyebrow="Sin órdenes abiertas"
                title="Este cliente no tiene trabajos activos"
                description="Cuando se cree una orden desde uno de sus vehículos, va a aparecer en esta sección."
                actions={getWorkOrdersEmptyActions(customer.id, isArchived, primaryVehicle)}
              />
            )}
          </section>

          <section aria-labelledby="customer-history-heading" className="space-y-4">
            <SectionHeading
              headingId="customer-history-heading"
              eyebrow="Historial"
              title="Trabajos cerrados"
              description="Órdenes entregadas o anuladas asociadas a los vehículos del cliente."
              count={`${closedWorkOrders.length} orden${closedWorkOrders.length === 1 ? "" : "es"}`}
            />

            {closedWorkOrders.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {closedWorkOrders.slice(0, 6).map((workOrder) => (
                  <CustomerWorkOrderCard key={workOrder.id} workOrder={workOrder} />
                ))}
              </div>
            ) : (
              <EmptyState
                eyebrow="Sin historial"
                title="Este cliente todavía no tiene trabajos cerrados"
                description="Cuando una orden sea entregada o anulada, va a quedar disponible como historial del cliente."
                actions={[
                  {
                    label: "Ver vehículos",
                    href: `/customers/${customer.id}#customer-vehicles-heading`,
                    variant: "primary",
                  },
                  {
                    label: "Volver a clientes",
                    href: "/customers",
                    variant: "secondary",
                  },
                ]}
              />
            )}
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <CustomerSidePanel
            nextAppointment={nextAppointment}
            latestWorkOrder={latestWorkOrder}
            receipts={receipts}
            events={customer.events ?? []}
          />
        </aside>
      </div>
    </section>
  );
}

/**
 * Resolves a customer and maps backend 404 responses to the Next.js not found
 * boundary.
 */
async function resolveCustomer(customerId: string): Promise<Customer> {
  try {
    return await getCustomer(customerId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

function ContactPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-surface-muted/80 px-3 py-2">
      <span className="shrink-0 text-primary">{icon}</span>
      <span className="wrap-anywhere">{children}</span>
    </span>
  );
}

function ArchivedBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
      <Archive className="size-3.5 shrink-0" aria-hidden="true" />
      Archivado
    </span>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <dt className="flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-primary">
        {icon}
        {label}
      </dt>

      <dd className="mt-3 font-display text-2xl font-black text-foreground">
        {value}
      </dd>

      <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">
        {helper}
      </p>
    </div>
  );
}

function SectionHeading({
  headingId,
  eyebrow,
  title,
  description,
  count,
}: {
  headingId: string;
  eyebrow: string;
  title: string;
  description: string;
  count: string;
}) {
  return (
    <div className="rounded-[1.1rem] border border-border bg-surface/90 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>

          <h2
            id={headingId}
            className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
          >
            {title}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <p className="w-fit rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
          {count}
        </p>
      </div>
    </div>
  );
}

function CustomerVehicleCard({
  customerId,
  isCustomerArchived,
  vehicle,
}: {
  customerId: string;
  isCustomerArchived: boolean;
  vehicle: CustomerVehicle;
}) {
  const isArchived = Boolean(vehicle.archivedAt);
  const activeOrders = getActiveWorkOrders(
    vehicle.workOrders.map((workOrder) => ({
      ...workOrder,
      vehicle,
    })),
  );
  const latestWorkOrder = getLatestWorkOrder(
    vehicle.workOrders.map((workOrder) => ({
      ...workOrder,
      vehicle,
    })),
  );
  const nextAppointment = vehicle.appointments[0] ?? null;

  return (
    <article className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-5 shadow-(--shadow-industrial) ring-1 ring-white/3 transition hover:border-primary/35 hover:bg-white">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary">
                Vehículo
              </p>

              <h3 className="mt-2 wrap-anywhere font-display text-xl font-black uppercase tracking-[0.04em] text-foreground">
                {vehicle.brand} {vehicle.model}
              </h3>

              <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">
                Patente {vehicle.licensePlate}
                {vehicle.year ? ` · Año ${vehicle.year}` : ""}
              </p>
            </div>

            {isArchived ? <SmallStatusBadge label="Archivado" muted /> : null}
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            <CompactDatum label="Kilometraje" value={formatMileage(vehicle.mileage)} />
            <CompactDatum label="Órdenes abiertas" value={activeOrders.length.toString()} />
            <CompactDatum
              label="Próximo turno"
              value={nextAppointment ? formatDateTime(nextAppointment.scheduledStart) : "Sin turno"}
            />
          </dl>

          {latestWorkOrder ? (
            <p className="mt-4 rounded-2xl border border-border bg-surface-muted/70 px-4 py-3 text-sm font-semibold leading-6 text-muted-foreground">
              Último trabajo: Orden #{latestWorkOrder.orderNumber} · {formatWorkOrderStatus(latestWorkOrder.status)} · {formatDate(latestWorkOrder.entryDate)}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 rounded-2xl border border-border bg-surface-muted/80 p-2.5">
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
          >
            <Eye className="size-4 shrink-0" aria-hidden="true" />
            Abrir ficha
          </Link>

          {!isCustomerArchived && !isArchived ? (
            <Link
              href={`/work-orders/new?vehicleId=${vehicle.id}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
            >
              <ClipboardList className="size-4 shrink-0" aria-hidden="true" />
              Nueva orden
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-muted-foreground">
              <Archive className="size-4 shrink-0" aria-hidden="true" />
              Sin nuevas órdenes
            </span>
          )}

          <Link
            href={`/vehicles/${vehicle.id}#vehicle-history-heading`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-elevated px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
          >
            <Clock3 className="size-4 shrink-0" aria-hidden="true" />
            Ver historial
          </Link>
        </div>
      </div>
    </article>
  );
}

function CustomerWorkOrderCard({
  workOrder,
}: {
  workOrder: CustomerWorkOrderWithVehicle;
}) {
  const total = workOrder.finalTotal ?? workOrder.estimatedTotal;

  return (
    <article className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-5 shadow-(--shadow-industrial) ring-1 ring-white/3 transition hover:border-primary/35 hover:bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary">
            Orden #{workOrder.orderNumber}
          </p>

          <h3 className="mt-2 wrap-anywhere font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
            {workOrder.vehicle.brand} {workOrder.vehicle.model}
          </h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {workOrder.reportedIssue}
          </p>
        </div>

        <SmallStatusBadge label={formatWorkOrderStatus(workOrder.status)} />
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <CompactDatum label="Ingreso" value={formatDate(workOrder.entryDate)} />
        <CompactDatum label="Kilometraje" value={formatMileage(workOrder.entryMileage)} />
        <CompactDatum label="Total" value={formatMoney(total ?? null)} />
      </dl>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={`/work-orders/${workOrder.id}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          <Eye className="size-4 shrink-0" aria-hidden="true" />
          Ver orden
        </Link>

        <Link
          href={`/vehicles/${workOrder.vehicle.id}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated"
        >
          <CarFront className="size-4 shrink-0" aria-hidden="true" />
          Ver vehículo
        </Link>
      </div>
    </article>
  );
}

function CustomerSidePanel({
  nextAppointment,
  latestWorkOrder,
  receipts,
  events,
}: {
  nextAppointment: CustomerAppointmentRef | null;
  latestWorkOrder: CustomerWorkOrderWithVehicle | null;
  receipts: CustomerReceiptWithContext[];
  events: CustomerEvent[];
}) {
  return (
    <>
      <SidePanelCard
        eyebrow="Agenda"
        title="Próximo turno"
        icon={<CalendarDays className="size-5" aria-hidden="true" />}
      >
        {nextAppointment ? (
          <div>
            <p className="text-sm font-black text-foreground">
              {nextAppointment.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {formatDateTime(nextAppointment.scheduledStart)}
            </p>
            {nextAppointment.vehicle ? (
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">
                {nextAppointment.vehicle.licensePlate} · {nextAppointment.vehicle.brand} {nextAppointment.vehicle.model}
              </p>
            ) : null}
          </div>
        ) : (
          <EmptySideText text="Sin turnos próximos cargados." />
        )}
      </SidePanelCard>

      <SidePanelCard
        eyebrow="Último movimiento"
        title="Trabajo reciente"
        icon={<Wrench className="size-5" aria-hidden="true" />}
      >
        {latestWorkOrder ? (
          <div>
            <p className="text-sm font-black text-foreground">
              Orden #{latestWorkOrder.orderNumber}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {latestWorkOrder.vehicle.licensePlate} · {formatWorkOrderStatus(latestWorkOrder.status)}
            </p>
            <Link
              href={`/work-orders/${latestWorkOrder.id}`}
              className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.14em] text-primary transition hover:text-primary-hover"
            >
              Abrir orden
            </Link>
          </div>
        ) : (
          <EmptySideText text="Sin órdenes cargadas para este cliente." />
        )}
      </SidePanelCard>

      <SidePanelCard
        eyebrow="Recibos"
        title="Últimos recibos"
        icon={<ReceiptText className="size-5" aria-hidden="true" />}
      >
        {receipts.length > 0 ? (
          <div className="grid gap-3">
            {receipts.slice(0, 4).map((receipt) => (
              <Link
                key={receipt.id}
                href={`/receipts/${receipt.id}`}
                className="rounded-2xl border border-border bg-surface-muted/75 p-3 transition hover:border-primary/40 hover:bg-surface-elevated"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                  Recibo #{formatReceiptNumber(receipt.receiptNumber)}
                </p>
                <p className="mt-1 text-sm font-black text-foreground">
                  {formatMoney(receipt.total)}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Orden #{receipt.workOrder.orderNumber} · {receipt.vehicle.licensePlate}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptySideText text="Sin recibos emitidos todavía." />
        )}
      </SidePanelCard>

      <SidePanelCard
        eyebrow="Ficha"
        title="Eventos recientes"
        icon={<UserRound className="size-5" aria-hidden="true" />}
      >
        {events.length > 0 ? (
          <div className="grid gap-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-border bg-surface-muted/75 p-3"
              >
                <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                  {formatCustomerEventType(event.type)}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {event.description ?? "Sin detalle"}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">
                  {formatDateTime(event.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptySideText text="Sin eventos recientes en la ficha." />
        )}
      </SidePanelCard>
    </>
  );
}

function SidePanelCard({
  eyebrow,
  title,
  icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-5 shadow-(--shadow-industrial) ring-1 ring-white/3">
      <div className="flex items-start gap-3 border-b border-border pb-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-primary">
          {icon}
        </div>

        <div>
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground">
            {title}
          </h2>
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function CompactDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/75 p-3">
      <dt className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-primary">
        {label}
      </dt>
      <dd className="mt-2 wrap-anywhere text-sm font-bold leading-5 text-foreground">
        {value}
      </dd>
    </div>
  );
}

function SmallStatusBadge({
  label,
  muted = false,
}: {
  label: string;
  muted?: boolean;
}) {
  return (
    <p
      className={
        muted
          ? "inline-flex w-fit rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground"
          : "inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.12em] text-primary"
      }
    >
      {label}
    </p>
  );
}

function EmptySideText({ text }: { text: string }) {
  return <p className="text-sm leading-6 text-muted-foreground">{text}</p>;
}

function BreakableDetailValue({ value }: { value: string }) {
  return (
    <span className="block min-w-0 max-w-full wrap-anywhere">{value}</span>
  );
}

function getCustomerWorkOrders(
  vehicles: CustomerVehicle[],
): CustomerWorkOrderWithVehicle[] {
  return vehicles
    .flatMap((vehicle) =>
      vehicle.workOrders.map((workOrder) => ({
        ...workOrder,
        vehicle,
      })),
    )
    .sort((firstWorkOrder, secondWorkOrder) =>
      secondWorkOrder.entryDate.localeCompare(firstWorkOrder.entryDate),
    );
}

function getActiveWorkOrders(
  workOrders: CustomerWorkOrderWithVehicle[],
): CustomerWorkOrderWithVehicle[] {
  return workOrders.filter((workOrder) => !isClosedWorkOrder(workOrder));
}

function getClosedWorkOrders(
  workOrders: CustomerWorkOrderWithVehicle[],
): CustomerWorkOrderWithVehicle[] {
  return workOrders.filter(isClosedWorkOrder);
}

function isClosedWorkOrder(workOrder: CustomerVehicleWorkOrder): boolean {
  return workOrder.status === "DELIVERED" || workOrder.status === "CANCELLED";
}

function getCustomerReceipts(
  workOrders: CustomerWorkOrderWithVehicle[],
): CustomerReceiptWithContext[] {
  return workOrders
    .flatMap((workOrder) =>
      workOrder.receipts.map((receipt) => ({
        ...receipt,
        workOrder,
        vehicle: workOrder.vehicle,
      })),
    )
    .sort((firstReceipt, secondReceipt) =>
      secondReceipt.issuedAt.localeCompare(firstReceipt.issuedAt),
    );
}

function getNextAppointment(customer: Customer): CustomerAppointmentRef | null {
  const appointments = [
    ...(customer.appointments ?? []),
    ...((customer.vehicles ?? []).flatMap((vehicle) => vehicle.appointments)),
  ];

  const uniqueAppointments = new Map(
    appointments.map((appointment) => [appointment.id, appointment]),
  );

  return (
    [...uniqueAppointments.values()].sort((firstAppointment, secondAppointment) =>
      firstAppointment.scheduledStart.localeCompare(secondAppointment.scheduledStart),
    )[0] ?? null
  );
}

function getLatestWorkOrder(
  workOrders: CustomerWorkOrderWithVehicle[],
): CustomerWorkOrderWithVehicle | null {
  return workOrders[0] ?? null;
}

function getPrimaryVehicle(vehicles: CustomerVehicle[]): CustomerVehicle | null {
  return getActiveVehicles(vehicles)[0] ?? vehicles[0] ?? null;
}

function getActiveVehicles(vehicles: CustomerVehicle[]): CustomerVehicle[] {
  return vehicles.filter((vehicle) => !vehicle.archivedAt);
}

function getLastMileage(
  vehicles: CustomerVehicle[],
  workOrders: CustomerWorkOrderWithVehicle[],
): string {
  const orderMileage = workOrders.find(
    (workOrder) => workOrder.entryMileage !== null,
  )?.entryMileage;

  if (orderMileage !== undefined && orderMileage !== null) {
    return formatMileage(orderMileage);
  }

  const vehicleMileage = vehicles.find((vehicle) => vehicle.mileage !== null)?.mileage;

  return formatMileage(vehicleMileage ?? null);
}

function getActiveOrderHelper(
  activeWorkOrders: CustomerWorkOrderWithVehicle[],
): string {
  if (activeWorkOrders.length === 0) {
    return "Sin trabajos activos";
  }

  const readyOrders = activeWorkOrders.filter(
    (workOrder) => workOrder.status === "READY",
  );

  if (readyOrders.length > 0) {
    return `${readyOrders.length} listo${readyOrders.length === 1 ? "" : "s"} para entregar`;
  }

  return "Pendientes o en progreso";
}

function getVehiclesEmptyActions(customerId: string, isArchived: boolean) {
  if (isArchived) {
    return [
      {
        label: "Volver a clientes",
        href: "/customers",
        variant: "primary" as const,
      },
    ];
  }

  return [
    {
      label: "Cargar vehículo",
      href: `/vehicles/new?customerId=${customerId}`,
      variant: "primary" as const,
    },
    {
      label: "Volver a clientes",
      href: "/customers",
      variant: "secondary" as const,
    },
  ];
}

function getWorkOrdersEmptyActions(
  customerId: string,
  isArchived: boolean,
  primaryVehicle: CustomerVehicle | null,
) {
  if (!isArchived && primaryVehicle) {
    return [
      {
        label: "Crear orden",
        href: `/work-orders/new?vehicleId=${primaryVehicle.id}`,
        variant: "primary" as const,
      },
      {
        label: "Ver vehículos",
        href: `/customers/${customerId}#customer-vehicles-heading`,
        variant: "secondary" as const,
      },
    ];
  }

  return [
    {
      label: "Ver vehículos",
      href: `/customers/${customerId}#customer-vehicles-heading`,
      variant: "primary" as const,
    },
  ];
}

function formatCustomerEventType(type: CustomerEvent["type"]): string {
  const labels: Record<CustomerEvent["type"], string> = {
    ARCHIVED: "Archivado",
    RESTORED: "Restaurado",
  };

  return labels[type];
}
