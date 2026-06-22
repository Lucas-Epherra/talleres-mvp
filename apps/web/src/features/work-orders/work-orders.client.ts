import { apiFetch } from "../../lib/api";
import type {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  UpdateWorkOrderStatusInput,
  ReopenWorkOrderInput,
  WorkOrder,
} from "./types";

/**
 * Creates a work order inside the authenticated workshop.
 *
 * The backend derives workshopId from the httpOnly cookie session, so the
 * frontend must never send workshopId in this payload.
 */
export function createWorkOrder(
  input: CreateWorkOrderInput,
): Promise<WorkOrder> {
  return apiFetch<WorkOrder>("/work-orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Updates editable operational fields of a work order.
 *
 * Status changes are intentionally handled by updateWorkOrderStatus to keep
 * this mutation focused on diagnosis, work performed, mileage, costs and notes.
 */
export function updateWorkOrder(
  workOrderId: string,
  input: UpdateWorkOrderInput,
): Promise<WorkOrder> {
  return apiFetch<WorkOrder>(`/work-orders/${workOrderId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/**
 * Updates the status of a work order inside the authenticated workshop.
 *
 * The backend validates ownership through the authenticated workshop context,
 * so this mutation only sends the next status.
 */
export function updateWorkOrderStatus(
  workOrderId: string,
  input: UpdateWorkOrderStatusInput,
): Promise<WorkOrder> {
  return apiFetch<WorkOrder>(`/work-orders/${workOrderId}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/**
 * Reopens a delivered work order with an auditable required reason.
 *
 * The backend validates that the order is delivered and records the reason in
 * the operational timeline.
 */

export function reopenWorkOrder(
  workOrderId: string,
  input: ReopenWorkOrderInput,
): Promise<WorkOrder> {
  return apiFetch<WorkOrder>(`/work-orders/${workOrderId}/reopen`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
