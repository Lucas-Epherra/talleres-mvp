import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError } from "../../../../../lib/api";
import { EditCustomerForm } from "../../../../../features/customers/components/EditCustomerForm";
import { getCustomer } from "../../../../../features/customers/customers.server";
import type { Customer } from "../../../../../features/customers/types";

type EditCustomerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Editar cliente",
};

/**
 * Customer edit page.
 *
 * Fetches the current customer server-side and delegates interactive PATCH
 * behavior to the edit customer form leaf Client Component.
 */
export default async function EditCustomerPage({
  params,
}: EditCustomerPageProps) {
  const { id } = await params;
  const customer = await resolveCustomer(id);

  return (
    <section className="space-y-8">
      <header className="rounded-[1.35rem] border border-border bg-surface/85 p-6 shadow-[var(--shadow-industrial)] ring-1 ring-white/[0.03] sm:p-8">
        <Link
          href="/customers"
          className="text-sm font-bold text-primary transition hover:text-primary-hover"
        >
          ← Volver a clientes
        </Link>

        <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
          Editar cliente
        </p>

        <h1 className="mt-3 wrap-anywhere font-display text-2xl font-black uppercase tracking-[0.04em] text-white sm:text-3xl">
          {customer.fullName}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Corregí nombre, teléfono, email, dirección o notas internas del
          cliente. Los vehículos asociados permanecen sin cambios.
        </p>
      </header>

      <EditCustomerForm customer={customer} />
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