import { apiFetch } from "../../lib/api";
import type {
  ArchiveSupplierInput,
  CreateSupplierInput,
  RestoreSupplierInput,
  Supplier,
  UpdateSupplierInput,
} from "./types";

/**
 * Creates a supplier in the authenticated workshop.
 */
export function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  return apiFetch<Supplier>("/suppliers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Updates supplier identity, contact data and category assignments.
 */
export function updateSupplier(
  supplierId: string,
  input: UpdateSupplierInput,
): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${supplierId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/**
 * Archives a supplier while preserving historical purchases and payments.
 */
export function archiveSupplier(
  supplierId: string,
  input: ArchiveSupplierInput,
): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${supplierId}/archive`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/**
 * Restores an archived supplier to the operational list.
 */
export function restoreSupplier(
  supplierId: string,
  input: RestoreSupplierInput,
): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${supplierId}/restore`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
