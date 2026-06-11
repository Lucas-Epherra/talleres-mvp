import { apiFetch } from "../../lib/api";
import type {
  CreateWorkOrderInput,
  UpdateWorkOrderStatusInput,
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