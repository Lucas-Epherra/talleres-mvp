import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardSummary } from "../../../features/dashboard/dashboard.server";
import {
  formatDate,
  formatMileage,
  formatMoney,
  formatWorkOrderStatus,
} from "../../../features/dashboard/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Private dashboard page.
 *
 * Shows the authenticated workshop operational summary using server-side data
 * fetching and httpOnly cookie forwarding.
 */
export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
          Resumen operativo
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Dashboard del taller
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
          Vista general de clientes, vehículos y órdenes de trabajo del taller
          autenticado.
        </p>
      </header>

      <section aria-labelledby="totals-heading" className="space-y-4">
        <h2 id="totals-heading" className="text-lg font-semibold text-white">
          Totales generales
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Clientes"
            value={summary.totals.customers}
            description="Clientes registrados"
          />
          <DashboardMetricCard
            label="Vehículos"
            value={summary.totals.vehicles}
            description="Vehículos asociados"
          />
          <DashboardMetricCard
            label="Órdenes"
            value={summary.totals.workOrders}
            description="Órdenes históricas"
          />
          <DashboardMetricCard
            label="En taller"
            value={summary.totals.vehiclesInWorkshop}
            description="Vehículos con trabajo activo"
          />
        </div>
      </section>

      <section aria-labelledby="work-orders-heading" className="space-y-4">
        <h2
          id="work-orders-heading"
          className="text-lg font-semibold text-white"
        >
          Estado de órdenes
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <DashboardMetricCard
            label="Activas"
            value={summary.workOrders.active}
            description="Pendientes, en progreso o listas"
          />
          <DashboardMetricCard
            label="Pendientes"
            value={summary.workOrders.pending}
            description="Aún sin iniciar"
          />
          <DashboardMetricCard
            label="En progreso"
            value={summary.workOrders.inProgress}
            description="Trabajo en curso"
          />
          <DashboardMetricCard
            label="Listas"
            value={summary.workOrders.ready}
            description="Preparadas para entregar"
          />
          <DashboardMetricCard
            label="Entregadas"
            value={summary.workOrders.delivered}
            description="Historial cerrado"
          />
        </div>
      </section>

      <section
        aria-labelledby="latest-work-orders-heading"
        className="rounded-3xl border border-slate-800 bg-slate-900/70"
      >
        <div className="flex flex-col gap-3 border-b border-slate-800 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="latest-work-orders-heading"
              className="text-lg font-semibold text-white"
            >
              Últimas órdenes
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Movimientos recientes del taller.
            </p>
          </div>

          <Link
            href="/work-orders"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
          >
            Ver órdenes
          </Link>
        </div>

        {summary.latestWorkOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-230 text-left">
              <thead className="border-b border-slate-800 text-xs uppercase tracking-[0.16em] text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Orden
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Vehículo
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Ingreso
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Estimado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {summary.latestWorkOrders.map((workOrder) => (
                  <tr key={workOrder.id} className="align-top">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-white">
                        #{workOrder.orderNumber}
                      </p>
                      <p className="mt-1 line-clamp-2 max-w-xs text-sm text-slate-400">
                        {workOrder.reportedIssue}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-semibold text-white">
                        {workOrder.vehicle.licensePlate}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {workOrder.vehicle.brand} {workOrder.vehicle.model}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatMileage(workOrder.vehicle.mileage)}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="font-medium text-slate-100">
                        {workOrder.vehicle.customer.fullName}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {workOrder.vehicle.customer.phone ?? "Sin teléfono"}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200">
                        {formatWorkOrderStatus(workOrder.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-300">
                      {formatDate(workOrder.entryDate)}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-100">
                      {formatMoney(workOrder.estimatedTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              Todavía no hay órdenes de trabajo registradas.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}

type DashboardMetricCardProps = {
  label: string;
  value: number;
  description: string;
};

/**
 * Small reusable metric card for dashboard summary values.
 */
function DashboardMetricCard({
  label,
  value,
  description,
}: DashboardMetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-slate-500">{description}</p>
    </article>
  );
}