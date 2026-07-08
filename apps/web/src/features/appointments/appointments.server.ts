import { apiServerFetch } from "../../lib/api.server";
import type {
  Appointment,
  AppointmentCalendarQuery,
  AppointmentCalendarResponse,
  AppointmentsQuery,
  PaginatedResponse,
} from "./types";

/**
 * Fetches paginated appointments for the authenticated workshop.
 *
 * This is used by the Agenda list view and is intentionally range-based so the
 * same endpoint can keep lightweight list pagination.
 */
export function getPaginatedAppointments(
  query: AppointmentsQuery = {},
): Promise<PaginatedResponse<Appointment>> {
  const params = new URLSearchParams();

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.from) {
    params.set("from", query.from);
  }

  if (query.to) {
    params.set("to", query.to);
  }

  if (query.workOrderId) {
    params.set("workOrderId", query.workOrderId);
  }

  const queryString = params.toString();
  const path = queryString ? `/appointments?${queryString}` : "/appointments";

  return apiServerFetch<PaginatedResponse<Appointment>>(path);
}

/**
 * Fetches a bounded, non-paginated appointment range for calendar rendering.
 *
 * Calendar views need all appointments inside the visible range so individual
 * days do not miss events because of pagination.
 */
export function getAppointmentCalendar(
  query: AppointmentCalendarQuery,
): Promise<AppointmentCalendarResponse> {
  const params = new URLSearchParams();

  params.set("from", query.from);
  params.set("to", query.to);

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.workOrderId) {
    params.set("workOrderId", query.workOrderId);
  }

  return apiServerFetch<AppointmentCalendarResponse>(
    `/appointments/calendar?${params.toString()}`,
  );
}

/**
 * Fetches a single appointment.
 */
export function getAppointment(appointmentId: string): Promise<Appointment> {
  return apiServerFetch<Appointment>(`/appointments/${appointmentId}`);
}
