import type { WorkOrderStatus } from "../../lib/format";
import { apiServerFetch } from "../../lib/api.server";
import type {
  PaginatedResponse,
  WorkOrder,
  WorkOrdersQuery,
  WorkOrderSupplierCatalogItem,
  WorkOrderSupplierCatalogPart,
} from "./types";

type GetWorkOrdersParams = {
  search?: string;
  status?: WorkOrderStatus;
};

type SupplierCatalogListItem = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  archivedAt: string | null;
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

/**
 * Fetches active suppliers with their active catalog parts for work order forms.
 *
 * The work order form receives a compact read-only catalog so the user can
 * select supplier + part without making the form a data-fetching component.
 */
export async function getWorkOrderSupplierCatalog(): Promise<
  WorkOrderSupplierCatalogItem[]
> {
  const suppliersPage = await apiServerFetch<
    PaginatedResponse<SupplierCatalogListItem>
  >("/suppliers?limit=100");

  const activeSuppliers = suppliersPage.data.filter(
    (supplier) => !supplier.archivedAt,
  );

  const suppliersWithParts = await Promise.all(
    activeSuppliers.map(async (supplier) => {
      const partsPage = await apiServerFetch<
        PaginatedResponse<WorkOrderSupplierCatalogPart>
      >(`/suppliers/${supplier.id}/parts?limit=200`);

      return {
        id: supplier.id,
        name: supplier.name,
        contactName: supplier.contactName,
        phone: supplier.phone,
        archivedAt: supplier.archivedAt,
        parts: partsPage.data.filter(
          (part) => part.isActive && !part.archivedAt,
        ),
      } satisfies WorkOrderSupplierCatalogItem;
    }),
  );

  return suppliersWithParts.sort((firstSupplier, secondSupplier) =>
    firstSupplier.name.localeCompare(secondSupplier.name, "es-AR"),
  );
}
