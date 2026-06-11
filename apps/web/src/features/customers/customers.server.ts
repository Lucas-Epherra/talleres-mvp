import { apiServerFetch } from "../../lib/api.server";
import type { Customer } from "./types";

/**
 * Fetches customers for the authenticated workshop.
 *
 * Runs on the server and forwards the incoming httpOnly cookie to the backend.
 */
export function getCustomers(): Promise<Customer[]> {
  return apiServerFetch<Customer[]>("/customers");
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