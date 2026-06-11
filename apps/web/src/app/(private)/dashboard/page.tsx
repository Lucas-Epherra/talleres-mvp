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
    <section className="space-y-6 sm:space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-300">
          Resumen operativo
        </p>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
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
        className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70"
      >
        <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
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
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300 sm:w-auto"
          >
            Ver órdenes
          </Link>
        </div>

        {summary.latestWorkOrders.length > 0 ? (
          <>
            <div className="grid gap-4 p-5 xl:hidden">
              {summary.latestWorkOrders.map((workOrder) => (
                <LatestWorkOrderCard key={workOrder.id} workOrder={workOrder} />
              ))}
            </div>

            <div className="hidden xl:block">
              <table className="w-full text-left">
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
                    <th scope="col" className="px-6 py-4 font-semibold">
                      Acción
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
                        <p className="mt-1 max-w-xs text-sm leading-6 text-slate-400">
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

                      <td className="px-6 py-5">
                        <Link
                          href={`/work-orders/${workOrder.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-700 px-3 text-xs font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300"
                        >
                          Ver orden
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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

type LatestWorkOrder = Awaited<
  ReturnType<typeof getDashboardSummary>
>["latestWorkOrders"][number];

type LatestWorkOrderCardProps = {
  workOrder: LatestWorkOrder;
};

/**
 * Mobile and tablet representation of a recent work order.
 *
 * It replaces the desktop table to avoid horizontal scrolling on narrow screens.
 */
function LatestWorkOrderCard({ workOrder }: LatestWorkOrderCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-orange-300">
            Orden #{workOrder.orderNumber}
          </p>

          <h3 className="mt-2 wrap-break-word text-base font-semibold leading-6 text-white">
            {workOrder.reportedIssue}
          </h3>
        </div>

        <span className="inline-flex w-fit rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-200">
          {formatWorkOrderStatus(workOrder.status)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SmallDetail
          label="Vehículo"
          value={`${workOrder.vehicle.licensePlate} · ${workOrder.vehicle.brand} ${workOrder.vehicle.model}`}
        />
        <SmallDetail
          label="Cliente"
          value={workOrder.vehicle.customer.fullName}
        />
        <SmallDetail label="Ingreso" value={formatDate(workOrder.entryDate)} />
        <SmallDetail
          label="Estimado"
          value={formatMoney(workOrder.estimatedTotal)}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/work-orders/${workOrder.id}`}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-400 sm:w-auto"
        >
          Ver orden
        </Link>

        <Link
          href={`/vehicles/${workOrder.vehicle.id}`}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-100 transition hover:border-orange-400 hover:text-orange-300 sm:w-auto"
        >
          Ver ficha
        </Link>
      </div>
    </article>
  );
}

type SmallDetailProps = {
  label: string;
  value: string;
};

/**
 * Compact label/value block for dashboard order cards.
 */
function SmallDetail({ label, value }: SmallDetailProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 wrap-break-word text-sm font-semibold text-slate-100">
        {value}
      </p>
    </div>
  );
}