import type { Metadata } from "next";
import Link from "next/link";
import { CreateVehicleForm } from "../../../../features/vehicles/components/CreateVehicleForm";
import { getCustomers } from "../../../../features/customers/customers.server";
import type { Customer } from "../../../../features/customers/types";

export const metadata: Metadata = {
  title: "Nuevo vehículo",
};

type NewVehiclePageProps = {
  searchParams: Promise<{
    customerId?: string | string[];
  }>;
};

/**
 * Vehicle creation page.
 *
 * Loads customers server-side so the interactive vehicle form can associate
 * the new vehicle with an existing customer. When customerId is present in the
 * URL, the customer select is preselected without locking the field.
 */
export default async function NewVehiclePage({
  searchParams,
}: NewVehiclePageProps) {
  const [customers, resolvedSearchParams] = await Promise.all([
    getCustomers(),
    searchParams,
  ]);

  const requestedCustomerId = normalizeSearchParam(
    resolvedSearchParams.customerId,
  );
  const defaultCustomerId = getValidCustomerId(customers, requestedCustomerId);

  return (
    <section className="space-y-8">
      <header className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03] sm:p-8">
        <Link
          href="/vehicles"
          className="text-sm font-bold text-primary transition hover:text-primary-hover"
        >
          ← Volver a vehículos
        </Link>

        <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Nuevo vehículo
        </p>

        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-white sm:text-3xl">
          Crear vehículo
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Asociá un vehículo a un cliente existente para comenzar a construir su
          ficha operativa.
        </p>
      </header>

      <CreateVehicleForm
        customers={customers}
        defaultCustomerId={defaultCustomerId}
      />
    </section>
  );
}

/**
 * Normalizes a Next.js search param into a single string value.
 */
function normalizeSearchParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

/**
 * Returns the requested customer id only when it exists in the current workshop
 * customer list.
 */
function getValidCustomerId(
  customers: Customer[],
  requestedCustomerId: string,
): string | undefined {
  if (!requestedCustomerId) {
    return undefined;
  }

  const exists = customers.some((customer) => customer.id === requestedCustomerId);

  return exists ? requestedCustomerId : undefined;
}