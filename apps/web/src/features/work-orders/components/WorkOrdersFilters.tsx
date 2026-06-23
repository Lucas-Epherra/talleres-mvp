"use client";

import { Search, X } from "lucide-react";
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
  "CANCELLED",
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
      className="rounded-[1.35rem] border border-border bg-linear-to-br from-surface-elevated via-surface to-surface p-4 shadow-(--shadow-industrial) ring-1 ring-white/3 sm:p-5"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_260px_auto_auto] lg:items-end">
        <div>
          <label
            htmlFor="work-orders-search"
            className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
          >
            Buscar
          </label>

          <input
            id="work-orders-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Patente, cliente, modelo, diagnóstico..."
            className="mt-2 h-11 w-full rounded-xl border border-border-strong bg-surface-muted/90 px-4 text-sm text-foreground outline-none transition placeholder:text-steel focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label
            htmlFor="work-orders-status"
            className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary"
          >
            Estado
          </label>

          <select
            id="work-orders-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as StatusFilterValue)
            }
            className="mt-2 h-11 w-full rounded-xl border border-border-strong bg-surface-muted/90 px-4 text-sm font-bold text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="size-4 shrink-0" aria-hidden="true" />
          {isPending ? "Filtrando..." : "Aplicar filtros"}
        </button>

        <Link
          href="/work-orders"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface-muted px-5 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface"
        >
          <X className="size-4 shrink-0" aria-hidden="true" />
          Limpiar
        </Link>
      </div>
    </form>
  );
}
