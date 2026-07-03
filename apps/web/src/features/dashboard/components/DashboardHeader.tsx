import {
  CalendarDays,
  CarFront,
  ClipboardList,
  Users,
  Wrench,
} from "lucide-react";
import { formatLongDate } from "../utils";
import type { DashboardSummary } from "../types";
import { DashboardMetricCard } from "./DashboardMetricCard";

type DashboardHeaderProps = {
  summary: DashboardSummary;
};

/**
 * Main dashboard hero.
 *
 * Uses the workshop background image from public/background-taller.png and a
 * left white gradient so the text remains readable without hiding the photo.
 */
export function DashboardHeader({ summary }: DashboardHeaderProps) {
  return (
    <header
      className="relative isolate overflow-hidden rounded-[1.35rem] border border-border bg-white p-4 shadow-(--shadow-industrial) ring-1 ring-white/70 sm:rounded-3xl sm:p-6 lg:min-h-[30rem] xl:p-7"
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.99) 0%, rgba(255,255,255,0.96) 34%, rgba(255,255,255,0.72) 58%, rgba(255,255,255,0.22) 100%), url('/background-taller.png')",
        backgroundPosition: "center right",
        backgroundSize: "cover",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-0 h-44 bg-linear-to-t from-white/92 via-white/56 to-transparent"
      />

      <div className="relative z-10 flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground sm:text-sm">
            Buenos días 👋
          </p>

          <h1 className="mt-2 max-w-2xl font-display text-3xl font-black leading-none tracking-[-0.055em] text-foreground sm:mt-3 sm:text-5xl">
            Así va tu taller hoy
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base sm:leading-7">
            Resumen del trabajo del día. Revisá lo importante, resolvé
            pendientes y avanzá con las órdenes del taller.
          </p>
        </div>

        <p className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-border bg-white/92 px-3 py-2 text-xs font-bold text-foreground shadow-sm backdrop-blur-sm sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
          <CalendarDays className="size-4 text-primary" aria-hidden="true" />
          Hoy, {formatLongDate(summary.generatedAt)}
        </p>
      </div>

      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 xl:mt-10 xl:grid-cols-4">
        <DashboardMetricCard
          label="Clientes"
          value={summary.summaryCards.customers}
          description="Clientes registrados"
          href="/customers"
          linkLabel="Ver clientes"
          icon={Users}
        />

        <DashboardMetricCard
          label="Vehículos"
          value={summary.summaryCards.vehicles}
          description="Fichas cargadas"
          href="/vehicles"
          linkLabel="Ver vehículos"
          icon={CarFront}
        />

        <DashboardMetricCard
          label="Órdenes"
          value={summary.summaryCards.activeWorkOrders}
          description="Abiertas en el taller"
          href="/work-orders"
          linkLabel="Ver órdenes"
          tone="primary"
          icon={ClipboardList}
        />

        <DashboardMetricCard
          label="En taller"
          value={summary.totals.vehiclesInWorkshop}
          description="Con trabajo activo"
          href="/work-orders"
          linkLabel="Ver en taller"
          tone="danger"
          icon={Wrench}
        />
      </div>
    </header>
  );
}
