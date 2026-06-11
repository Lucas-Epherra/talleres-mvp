import type { WorkOrderStatus } from "../../lib/format";
import { apiServerFetch } from "../../lib/api.server";
import type { WorkOrder } from "./types";

type GetWorkOrdersParams = {
  search?: string;
  status?: WorkOrderStatus;
};

/**
 * Fetches work orders for the authenticated workshop.
 *
 * This function runs on the server and relies on apiServerFetch to forward the
 * incoming httpOnly cookie to the backend API.
 */
export function getWorkOrders({
  search,
  status,
}: GetWorkOrdersParams = {}): Promise<WorkOrder[]> {
  const searchParams = new URLSearchParams();

  if (search) {
    searchParams.set("search", search);
  }

  if (status) {
    searchParams.set("status", status);
  }

  const queryString = searchParams.toString();
  const path = queryString ? `/work-orders?${queryString}` : "/work-orders";

  return apiServerFetch<WorkOrder[]>(path);
}

/**
 * Fetches one work order by id for the authenticated workshop.
 *
 * The backend validates ownership through the authenticated workshop context.
 */
export function getWorkOrder(workOrderId: string): Promise<WorkOrder> {
  return apiServerFetch<WorkOrder>(`/work-orders/${workOrderId}`);
}