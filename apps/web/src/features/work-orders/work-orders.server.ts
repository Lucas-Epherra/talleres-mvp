import type { WorkOrderStatus } from "../../lib/format";
import { apiServerFetch } from "../../lib/api.server";
import type { PaginatedResponse, WorkOrder, WorkOrdersQuery } from "./types";

type GetWorkOrdersParams = {
  search?: string;
  status?: WorkOrderStatus;
};

/**
 * Fetches paginated work orders for the authenticated workshop.
 *
 * Use this function in list screens that need pagination metadata.
 */
export function getPaginatedWorkOrders(
  query: WorkOrdersQuery = {},
): Promise<PaginatedResponse<WorkOrder>> {
  const searchParams = new URLSearchParams();

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (query.status) {
    searchParams.set("status", query.status);
  }

  if (query.page && query.page > 1) {
    searchParams.set("page", String(query.page));
  }

  if (query.limit) {
    searchParams.set("limit", String(query.limit));
  }

  const queryString = searchParams.toString();
  const path = queryString ? `/work-orders?${queryString}` : "/work-orders";

  return apiServerFetch<PaginatedResponse<WorkOrder>>(path);
}

/**
 * Fetches work orders for the authenticated workshop as a plain array.
 *
 * This keeps backwards compatibility with screens that do not need pagination
 * metadata.
 */
export async function getWorkOrders({
  search,
  status,
}: GetWorkOrdersParams = {}): Promise<WorkOrder[]> {
  const workOrdersPage = await getPaginatedWorkOrders({
    search,
    status,
    limit: 50,
  });

  return workOrdersPage.data;
}

/**
 * Fetches one work order by id for the authenticated workshop.
 *
 * The backend validates ownership through the authenticated workshop context.
 */
export function getWorkOrder(workOrderId: string): Promise<WorkOrder> {
  return apiServerFetch<WorkOrder>(`/work-orders/${workOrderId}`);
}
