export type WorkOrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  READY: "Listo",
  DELIVERED: "Entregado",
  CANCELLED: "Anulada",
};
/**
 * Converts backend work order status values into user-facing Spanish labels.
 */
export function formatWorkOrderStatus(
  status: WorkOrderStatus | string,
): string {
  if (isWorkOrderStatus(status)) {
    return workOrderStatusLabels[status];
  }

  if (status === "NO_ACTIVE_WORK_ORDER") {
    return "Sin orden activa";
  }

  return status;
}

/**
 * Formats nullable money values for dashboard cards, lists and detail screens.
 */
export function formatMoney(value: number | string | null): string {
  if (value === null) {
    return "Sin cargar";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "Sin cargar";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

/**
 * Formats nullable mileage values.
 */
export function formatMileage(value: number | null): string {
  if (value === null) {
    return "Sin km";
  }

  return `${new Intl.NumberFormat("es-AR").format(value)} km`;
}

/**
 * Formats ISO date strings for compact UI display.
 */
export function formatDate(value: string | null): string {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * Normalizes search params that may arrive as string arrays.
 */
export function normalizeSearchParam(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function isWorkOrderStatus(value: string): value is WorkOrderStatus {
  return value in workOrderStatusLabels;
}
