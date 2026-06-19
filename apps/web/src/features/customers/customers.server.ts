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

  const queryString = params.toString();
  const path = queryString ? `/customers?${queryString}` : "/customers";

  return apiServerFetch<PaginatedResponse<CustomerListItem>>(path);
}

/**
 * Fetches customer options for forms that need a plain customer array.
 *
 * This keeps backwards compatibility with existing vehicle/work-order creation
 * screens while the customers index page uses server-side pagination.
 */
export async function getCustomers(): Promise<CustomerListItem[]> {
  const customersPage = await getPaginatedCustomers({
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
