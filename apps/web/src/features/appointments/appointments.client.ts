import { apiFetch } from "../../lib/api";
import type {
  Appointment,
  CancelAppointmentInput,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "./types";

/**
 * Creates an appointment inside the authenticated workshop agenda.
 */
export function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  return apiFetch<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Updates an operational appointment.
 */
export function updateAppointment(
  appointmentId: string,
  input: UpdateAppointmentInput,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${appointmentId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/**
 * Confirms a scheduled appointment.
 */
export function confirmAppointment(
  appointmentId: string,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${appointmentId}/confirm`, {
    method: "PATCH",
  });
}

/**
 * Completes an appointment.
 */
export function completeAppointment(
  appointmentId: string,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${appointmentId}/complete`, {
    method: "PATCH",
  });
}

/**
 * Cancels an appointment with a mandatory reason.
 */
export function cancelAppointment(
  appointmentId: string,
  input: CancelAppointmentInput,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${appointmentId}/cancel`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
