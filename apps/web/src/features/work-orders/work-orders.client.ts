import { apiFetch } from "../../lib/api";
import type { CreateWorkOrderInput, WorkOrder } from "./types";

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