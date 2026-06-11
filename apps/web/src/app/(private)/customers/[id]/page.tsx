import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { ApiError } from "../../../../lib/api";
import { getCustomer } from "../../../../features/customers/customers.server";
import type { Customer } from "../../../../features/customers/types";
import { VehicleCard } from "../../../../features/vehicles/components/VehicleCard";
import { getVehicles } from "../../../../features/vehicles/vehicles.server";
import type { VehicleListItem } from "../../../../features/vehicles/types";

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
 * Shows customer contact data and the exact list of vehicles associated with
 * that customer by id, avoiding text-search based navigation.
 */
export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  const [customer, vehicles] = await Promise.all([
    resolveCustomer(id),
    getVehicles(),
  ]);

  const associatedVehicles = getCustomerVehicles(vehicles, customer.id);

  return (
    <section className="space-y-6 sm:space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/customers"
              className="text-sm font-medium text-orange-300 transition hover:text-orange-200"
            >
              ← Volver a clientes
            </Link>

            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
              Ficha del cliente
            </p>

            <h1 className="mt-3 wrap-break-word text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {customer.fullName}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Vista básica del cliente, datos de contacto y vehículos asociados
              dentro del taller.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 sm:w-auto"
            >
              Editar cliente
            </Link>

            <Link
              href={`/vehicles/new?customerId=${customer.id}`}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300 sm:w-auto"
            >
              Cargar vehículo
            </Link>
          </div>
        </div>
      </header>

      <section
        aria-labelledby="customer-data-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8"
      >
        <h2 id="customer-data-heading" className="text-lg font-semibold text-white">
          Datos del cliente
        </h2>

        <dl className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoItem label="Teléfono" value={customer.phone ?? "Sin teléfono"} />
          <InfoItem label="Email" value={customer.email ?? "Sin email"} />
          <InfoItem
            label="Dirección"
            value={customer.address ?? "Sin dirección"}
          />
          <InfoItem
            label="Vehículos asociados"
            value={associatedVehicles.length.toString()}
          />
        </dl>

        {customer.notes ? (
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
              Notas internas
            </p>
            <p className="mt-3 wrap-break-word text-sm leading-6 text-slate-300">
              {customer.notes}
            </p>
          </div>
        ) : null}
      </section>

      <section
        aria-labelledby="customer-vehicles-heading"
        className="space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="customer-vehicles-heading"
              className="text-lg font-semibold text-white"
            >
              Vehículos asociados
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Vehículos vinculados directamente a este cliente.
            </p>
          </div>

          <p className="text-sm text-slate-400">
            {associatedVehicles.length} vehículo
            {associatedVehicles.length === 1 ? "" : "s"}
          </p>
        </div>

        {associatedVehicles.length > 0 ? (
          <div className="grid gap-4">
            {associatedVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
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

type InfoItemProps = {
  label: string;
  value: string;
};

/**
 * Compact customer metadata item.
 */
function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 wrap-break-word text-sm font-semibold text-slate-100">
        {value}
      </dd>
    </div>
  );
}