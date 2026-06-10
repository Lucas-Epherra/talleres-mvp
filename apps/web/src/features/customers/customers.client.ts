import { apiFetch } from "../../lib/api";
import type { CreateCustomerInput, Customer } from "./types";

/**
 * Creates a customer inside the authenticated workshop.
 *
 * Runs in the browser because it is triggered by an interactive form.
 */
export function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  return apiFetch<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}