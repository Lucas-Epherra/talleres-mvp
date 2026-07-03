export {
  formatDate,
  formatDateTime,
  formatMileage,
  formatMoney,
  formatReceiptNumber,
  formatWorkOrderStatus,
} from "../../lib/format";

import type { AppointmentStatus } from "./types";

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

/**
 * Converts appointment status values into readable Spanish labels.
 */
export function formatAppointmentStatus(status: AppointmentStatus): string {
  return appointmentStatusLabels[status];
}

/**
 * Formats ISO date strings as local time.
 */
export function formatTime(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

/**
 * Formats a date string as a long readable Argentina date.
 */
export function formatLongDate(value: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}

/**
 * Formats an ISO timestamp as a compact relative time.
 */
export function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absDiffInSeconds = Math.abs(diffInSeconds);

  if (absDiffInSeconds < 60) {
    return diffInSeconds < 0 ? "Hace instantes" : "En instantes";
  }

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  const formatter = new Intl.RelativeTimeFormat("es-AR", {
    numeric: "auto",
  });

  for (const [unit, secondsInUnit] of units) {
    if (absDiffInSeconds >= secondsInUnit) {
      return formatter.format(Math.round(diffInSeconds / secondsInUnit), unit);
    }
  }

  return formatter.format(Math.round(diffInSeconds / 60), "minute");
}
