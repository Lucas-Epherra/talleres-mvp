import { apiServerFetch } from "../../lib/api.server";
import type {
  Appointment,
  AppointmentsQuery,
  PaginatedResponse,
} from "./types";

/**
 * Fetches paginated appointments for the authenticated workshop.
 *
 * This is used by the Agenda page and is intentionally range-based so a future
 * calendar view can consume the same endpoint.
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

  const queryString = params.toString();
  const path = queryString ? `/appointments?${queryString}` : "/appointments";

  return apiServerFetch<PaginatedResponse<Appointment>>(path);
}

/**
 * Fetches a single appointment.
 */
export function getAppointment(appointmentId: string): Promise<Appointment> {
  return apiServerFetch<Appointment>(`/appointments/${appointmentId}`);
}
