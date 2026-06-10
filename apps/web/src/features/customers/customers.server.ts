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