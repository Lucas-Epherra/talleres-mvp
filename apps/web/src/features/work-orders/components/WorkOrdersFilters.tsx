"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import {
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "../../../lib/format";

type WorkOrdersFiltersProps = {
  currentSearch: string;
  currentStatus?: WorkOrderStatus;
};

type StatusFilterValue = WorkOrderStatus | "ALL";

const WORK_ORDER_STATUS_OPTIONS: WorkOrderStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
];

/**
 * Client-side filters for the work orders list.
 *
 * This component is intentionally a leaf Client Component because it owns
 * interactive form state and query-param navigation.
 */
export function WorkOrdersFilters({
  currentSearch,
  currentStatus,
}: WorkOrdersFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(currentSearch);
  const [status, setStatus] = useState<StatusFilterValue>(
    currentStatus ?? "ALL",
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchParams = new URLSearchParams();
    const normalizedSearch = search.trim();

    if (normalizedSearch) {
      searchParams.set("search", normalizedSearch);
    }

    if (status !== "ALL") {
      searchParams.set("status", status);
    }

    const queryString = searchParams.toString();

    startTransition(() => {
      router.push(queryString ? `/work-orders?${queryString}` : "/work-orders");
    });
  }

  return (
    <form
      className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_260px_auto_auto] lg:items-end">
        <div>
          <label
            htmlFor="work-orders-search"
            className="text-sm font-medium text-slate-300"
          >
            Buscar
          </label>

          <input
            id="work-orders-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Patente, cliente, modelo, diagnóstico..."
            className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-orange-400"
          />
        </div>

        <div>
          <label
            htmlFor="work-orders-status"
            className="text-sm font-medium text-slate-300"
          >
            Estado
          </label>

          <select
            id="work-orders-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as StatusFilterValue)
            }
            className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm font-medium text-white outline-none transition focus:border-orange-400"
          >
            <option value="ALL">Todos</option>

            {WORK_ORDER_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {formatWorkOrderStatus(option)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Filtrando..." : "Aplicar filtros"}
        </button>

        <Link
          href="/work-orders"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
        >
          Limpiar
        </Link>
      </div>
    </form>
  );
}