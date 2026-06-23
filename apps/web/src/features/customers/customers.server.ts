import { apiServerFetch } from "../../lib/api.server";
import type {
  Customer,
  CustomerListItem,
  CustomersQuery,
  PaginatedResponse,
} from "./types";

/**
 * Fetches paginated customers for the authenticated workshop.
 *
 * Use this function only in customer list screens that need pagination metadata.
 */
export function getPaginatedCustomers(
  query: CustomersQuery = {},
): Promise<PaginatedResponse<CustomerListItem>> {
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

  if (query.archiveStatus && query.archiveStatus !== "active") {
    params.set("archiveStatus", query.archiveStatus);
  }

  const queryString = params.toString();
  const path = queryString ? `/customers?${queryString}` : "/customers";

  return apiServerFetch<PaginatedResponse<CustomerListItem>>(path);
}

/**
 * Fetches active customer options for forms that need a plain customer array.
 *
 * Archived customers stay out of operational creation flows by default.
 */
export async function getCustomers(
  query: Omit<CustomersQuery, "page" | "limit"> = {},
): Promise<CustomerListItem[]> {
  const customersPage = await getPaginatedCustomers({
    search: query.search,
    archiveStatus: query.archiveStatus ?? "active",
    limit: 50,
  });

  return customersPage.data;
}

/**
 * Fetches one customer by id for the authenticated workshop.
 *
 * Ownership is validated by the backend using the workshop derived from the
 * authenticated httpOnly cookie session.
 */
export function getCustomer(customerId: string): Promise<Customer> {
  return apiServerFetch<Customer>(`/customers/${customerId}`);
}
