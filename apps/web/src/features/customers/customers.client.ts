import { apiFetch } from "../../lib/api";
import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "./types";

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

/**
 * Updates editable customer fields inside the authenticated workshop.
 *
 * Phone is required by the backend and cannot be cleared. Optional fields like
 * email, address and notes can be sent as null to clear previously saved values.
 */
export function updateCustomer(
  customerId: string,
  input: UpdateCustomerInput,
): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${customerId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}