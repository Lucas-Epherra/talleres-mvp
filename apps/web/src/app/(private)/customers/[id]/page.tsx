import { ArrowLeft, CarFront, Eye, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "../../../../components/ui/EmptyState";
import {
  DetailSheet,
  DetailSheetRow,
} from "../../../../components/ui/DetailSheet";
import { NotesValue } from "../../../../components/ui/NotesValue";
import { ApiError } from "../../../../lib/api";
import { getCustomer } from "../../../../features/customers/customers.server";
import type { Customer } from "../../../../features/customers/types";
import { VehicleCard } from "../../../../features/vehicles/components/VehicleCard";
import { getVehicles } from "../../../../features/vehicles/vehicles.server";
import type { VehicleListItem } from "../../../../features/vehicles/types";
import { WorkOrderCard } from "../../../../features/work-orders/components/WorkOrderCard";
import { getWorkOrders } from "../../../../features/work-orders/work-orders.server";
import type { WorkOrder } from "../../../../features/work-orders/types";

type CustomerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Detalle de cliente",
};

/**
 * Customer detail page.
 *
 * Shows customer contact data, associated vehicles, active work orders and
 * historical delivered work orders for the selected customer.
 */
export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  const [customer, vehicles, workOrders] = await Promise.all([
    resolveCustomer(id),
    getVehicles(),
    getWorkOrders(),
  ]);

  const associatedVehicles = getCustomerVehicles(vehicles, customer.id);
  const customerWorkOrders = getCustomerWorkOrders(workOrders, customer.id);
  const activeWorkOrders = getActiveWorkOrders(customerWorkOrders);
  const deliveredWorkOrders = getDeliveredWorkOrders(customerWorkOrders);

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/customers"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
              Volver a clientes
            </Link>

            <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Ficha del cliente
            </p>

            <h1 className="mt-3 wrap-anywhere font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
              {customer.fullName}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Vista operativa del cliente, datos de contacto, vehículos
              asociados, órdenes activas e historial de trabajos.
            </p>
          </div>

          <div className="grid shrink-0 gap-3 sm:grid-cols-3 lg:flex lg:flex-col">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
            >
              <Pencil className="size-4 shrink-0" aria-hidden="true" />
              Editar cliente
            </Link>

            <Link
              href={`/vehicles/new?customerId=${customer.id}`}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
            >
              <CarFront className="size-4 shrink-0" aria-hidden="true" />
              Cargar vehículo
            </Link>

            <Link
              href="#customer-vehicles-heading"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
            >
              <Eye className="size-4 shrink-0" aria-hidden="true" />
              Ver vehículos
            </Link>
          </div>
        </div>
      </header>

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
        <DetailSheetRow
          label="Teléfono"
          value={customer.phone ?? "Sin teléfono"}
        />
        <DetailSheetRow
          label="Email"
          value={<BreakableDetailValue value={customer.email ?? "Sin email"} />}
        />
        <DetailSheetRow
          label="Dirección"
          value={
            <BreakableDetailValue value={customer.address ?? "Sin dirección"} />
          }
        />
        <DetailSheetRow
          label="Notas"
          value={<NotesValue value={customer.notes} fallback="Sin notas" />}
        />
      </DetailSheet>

      <section
        aria-labelledby="customer-summary-heading"
        className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8"
      >
        <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
              Actividad
            </p>

            <h2
              id="customer-summary-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
            >
              Resumen operativo
            </h2>
          </div>

          <p className="w-fit rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-[0.66rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
            Cliente activo
          </p>
        </div>

        <dl className="mt-5 grid gap-4 md:grid-cols-3">
          <SummaryMetric
            label="Vehículos asociados"
            value={associatedVehicles.length.toString()}
          />
          <SummaryMetric
            label="Órdenes activas"
            value={activeWorkOrders.length.toString()}
          />
          <SummaryMetric
            label="Historial"
            value={deliveredWorkOrders.length.toString()}
          />
        </dl>
      </section>

      <section
        aria-labelledby="customer-vehicles-heading"
        className="space-y-4"
      >
        <SectionHeading
          headingId="customer-vehicles-heading"
          title="Vehículos asociados"
          description="Vehículos vinculados directamente a este cliente."
          count={`${associatedVehicles.length} vehículo${
            associatedVehicles.length === 1 ? "" : "s"
          }`}
        />

        {associatedVehicles.length > 0 ? (
          <div className="grid gap-4">
            {associatedVehicles.map((vehicle, index) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                variant={index % 2 === 0 ? "accent" : "neutral"}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="Sin vehículos"
            title="Este cliente todavía no tiene vehículos asociados"
            description="Cargá el primer vehículo para empezar a construir su ficha operativa y registrar órdenes de trabajo."
            actions={[
              {
                label: "Cargar vehículo",
                href: `/vehicles/new?customerId=${customer.id}`,
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

      <section
        aria-labelledby="customer-active-work-orders-heading"
        className="space-y-4"
      >
        <SectionHeading
          headingId="customer-active-work-orders-heading"
          title="Órdenes activas"
          description="Trabajos pendientes, en progreso o listos para entregar."
          count={`${activeWorkOrders.length} orden${
            activeWorkOrders.length === 1 ? "" : "es"
          }`}
        />

        {activeWorkOrders.length > 0 ? (
          <div className="grid gap-4">
            {activeWorkOrders.map((workOrder, index) => (
              <WorkOrderCard
                key={workOrder.id}
                workOrder={workOrder}
                variant={index % 2 === 0 ? "accent" : "neutral"}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="Sin órdenes activas"
            title="Este cliente no tiene trabajos activos"
            description="Cuando se cree una orden desde la ficha de alguno de sus vehículos, va a aparecer en esta sección."
            actions={[
              {
                label: "Cargar vehículo",
                href: `/vehicles/new?customerId=${customer.id}`,
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

      <section aria-labelledby="customer-history-heading" className="space-y-4">
        <SectionHeading
          headingId="customer-history-heading"
          title="Historial del cliente"
          description="Órdenes entregadas asociadas a los vehículos de este cliente."
          count={`${deliveredWorkOrders.length} orden${
            deliveredWorkOrders.length === 1 ? "" : "es"
          }`}
        />

        {deliveredWorkOrders.length > 0 ? (
          <div className="grid gap-4">
            {deliveredWorkOrders.map((workOrder, index) => (
              <WorkOrderCard
                key={workOrder.id}
                workOrder={workOrder}
                variant={index % 2 === 0 ? "accent" : "neutral"}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="Sin historial"
            title="Este cliente todavía no tiene trabajos entregados"
            description="Cuando una orden pase a entregada, va a quedar disponible como historial del cliente."
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

/**
 * Returns only vehicles that belong to the selected customer.
 */
function getCustomerVehicles(
  vehicles: VehicleListItem[],
  customerId: string,
): VehicleListItem[] {
  return vehicles.filter((vehicle) => vehicle.customer.id === customerId);
}

/**
 * Returns only work orders that belong to vehicles owned by the selected
 * customer.
 */
function getCustomerWorkOrders(
  workOrders: WorkOrder[],
  customerId: string,
): WorkOrder[] {
  return workOrders.filter(
    (workOrder) => workOrder.vehicle.customer.id === customerId,
  );
}

/**
 * Returns non-delivered work orders.
 */
function getActiveWorkOrders(workOrders: WorkOrder[]): WorkOrder[] {
  return workOrders.filter((workOrder) => workOrder.status !== "DELIVERED");
}

/**
 * Returns delivered work orders used as customer history.
 */
function getDeliveredWorkOrders(workOrders: WorkOrder[]): WorkOrder[] {
  return workOrders.filter((workOrder) => workOrder.status === "DELIVERED");
}

type SummaryMetricProps = {
  label: string;
  value: string;
};

/**
 * Compact metric for customer operational summary.
 */
function SummaryMetric({ label, value }: SummaryMetricProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {label}
      </dt>

      <dd className="mt-2 font-display text-lg font-black text-foreground">
        {value}
      </dd>
    </div>
  );
}

type SectionHeadingProps = {
  headingId: string;
  title: string;
  description: string;
  count: string;
};

/**
 * Shared heading block for customer-related operational sections.
 */
function SectionHeading({
  headingId,
  title,
  description,
  count,
}: SectionHeadingProps) {
  return (
    <div className="rounded-[1.1rem] border border-border bg-surface/90 p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:rounded-[1.35rem] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id={headingId}
            className="font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
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

type BreakableDetailValueProps = {
  value: string;
};

/**
 * Prevents long customer data such as emails or addresses from overflowing
 * inside detail sheet cells.
 */
function BreakableDetailValue({ value }: BreakableDetailValueProps) {
  return (
    <span className="block min-w-0 max-w-full wrap-anywhere">{value}</span>
  );
}
