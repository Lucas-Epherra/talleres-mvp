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
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <Link
          href="/customers"
          className="text-sm font-medium text-orange-300 transition hover:text-orange-200"
        >
          ← Volver a clientes
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
          Editar cliente
        </p>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {customer.fullName}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
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