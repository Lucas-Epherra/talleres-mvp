import { Archive, ArrowLeft, LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ApiError } from "../../../../lib/api";
import { formatDate } from "../../../../lib/format";
import {
  getCustomer,
  getCustomers,
} from "../../../../features/customers/customers.server";
import type { Customer } from "../../../../features/customers/types";
import { CreateVehicleForm } from "../../../../features/vehicles/components/CreateVehicleForm";

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
 * Loads active customers server-side so the interactive vehicle form can
 * associate the new vehicle with an operational customer. When customerId is
 * present in the URL, the route validates that the customer is not archived
 * before rendering the creation form.
 */
export default async function NewVehiclePage({
  searchParams,
}: NewVehiclePageProps) {
  const resolvedSearchParams = await searchParams;
  const requestedCustomerId = normalizeSearchParam(
    resolvedSearchParams.customerId,
  );

  const [customers, requestedCustomer] = await Promise.all([
    getCustomers({
      archiveStatus: "active",
    }),
    resolveRequestedCustomer(requestedCustomerId),
  ]);

  if (requestedCustomer?.archivedAt) {
    return <ArchivedCustomerVehicleLock customer={requestedCustomer} />;
  }

  const defaultCustomerId = getValidCustomerId(customers, requestedCustomerId);

  return (
    <section className="space-y-8">
      <header className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
          Volver a vehículos
        </Link>

        <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Nuevo vehículo
        </p>

        <h1 className="mt-3 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
          Crear vehículo
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Asociá un vehículo a un cliente activo para comenzar a construir su
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

type ArchivedCustomerVehicleLockProps = {
  customer: Customer;
};

/**
 * Blocks manual vehicle creation routes for archived customers.
 */
function ArchivedCustomerVehicleLock({
  customer,
}: ArchivedCustomerVehicleLockProps) {
  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-8">
        <div className="relative">
          <Link
            href={`/customers/${customer.id}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-hover"
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
            Volver a la ficha del cliente
          </Link>

          <p className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-border-strong bg-surface-muted px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-foreground">
            <Archive className="size-3.5 shrink-0" aria-hidden="true" />
            Cliente archivado
          </p>

          <h1 className="mt-4 font-display text-2xl font-black uppercase tracking-[0.04em] text-foreground sm:text-3xl">
            No se puede cargar un vehículo
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            El cliente {customer.fullName} está archivado y quedó fuera del
            flujo operativo. Para cargar vehículos nuevos, primero restauralo
            desde su ficha.
          </p>
        </div>
      </header>

      <section
        aria-labelledby="archived-customer-vehicle-lock-heading"
        className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface via-surface to-surface-elevated p-6 shadow-(--shadow-industrial) ring-1 ring-white/3"
      >
        <div className="flex items-start gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border-strong bg-surface-muted text-muted-foreground">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Protección operativa
            </p>

            <h2
              id="archived-customer-vehicle-lock-heading"
              className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-foreground"
            >
              Cliente fuera del flujo activo
            </h2>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ReadOnlyLockDetail label="Cliente" value={customer.fullName} />
              <ReadOnlyLockDetail label="Teléfono" value={customer.phone} />
              <ReadOnlyLockDetail
                label="Archivado el"
                value={formatDate(customer.archivedAt)}
              />
              <ReadOnlyLockDetail
                label="Email"
                value={customer.email ?? "Sin email"}
              />
            </div>

            {customer.archivedReason ? (
              <p className="mt-4 rounded-2xl border border-border bg-surface-muted/85 px-4 py-3 text-sm leading-6 text-muted-foreground">
                Motivo de archivado:{" "}
                <span className="font-semibold text-foreground">
                  {customer.archivedReason}
                </span>
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/customers/${customer.id}`}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover sm:w-auto"
              >
                Ver ficha del cliente
              </Link>

              <Link
                href="/customers?archiveStatus=archived"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated sm:w-auto"
              >
                Ver archivados
              </Link>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

type ReadOnlyLockDetailProps = {
  label: string;
  value: string;
};

/**
 * Small read-only detail block for route-level lock screens.
 */
function ReadOnlyLockDetail({ label, value }: ReadOnlyLockDetailProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/85 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>

      <p className="mt-2 wrap-anywhere text-sm font-bold leading-5 text-foreground">
        {value}
      </p>
    </div>
  );
}

/**
 * Resolves a requested customer from a query param.
 *
 * Invalid or missing ids are treated as no preselection to preserve the existing
 * free vehicle-creation flow.
 */
async function resolveRequestedCustomer(
  requestedCustomerId: string,
): Promise<Customer | null> {
  if (!requestedCustomerId) {
    return null;
  }

  try {
    return await getCustomer(requestedCustomerId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
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
 * active customer list.
 */
function getValidCustomerId(
  customers: Customer[],
  requestedCustomerId: string,
): string | undefined {
  if (!requestedCustomerId) {
    return undefined;
  }

  const exists = customers.some(
    (customer) => customer.id === requestedCustomerId,
  );

  return exists ? requestedCustomerId : undefined;
}
