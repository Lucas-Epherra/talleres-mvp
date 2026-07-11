import { apiFetch } from "../../lib/api";
import type {
  ArchiveSupplierInput,
  ArchiveSupplierPartInput,
  CreateSupplierInput,
  CreateSupplierPartInput,
  CreateSupplierPaymentInput,
  RestoreSupplierInput,
  RestoreSupplierPartInput,
  Supplier,
  SupplierPart,
  SupplierPayment,
  UpdateSupplierInput,
  UpdateSupplierPartInput,
  UpdateSupplierPaymentInput,
  VoidSupplierPaymentInput,
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

/**
 * Creates a catalog part for one supplier.
 */
export function createSupplierPart(
  supplierId: string,
  input: CreateSupplierPartInput,
): Promise<SupplierPart> {
  return apiFetch<SupplierPart>(`/suppliers/${supplierId}/parts`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Updates a catalog part without affecting historical order lines.
 */
export function updateSupplierPart(
  supplierId: string,
  partId: string,
  input: UpdateSupplierPartInput,
): Promise<SupplierPart> {
  return apiFetch<SupplierPart>(`/suppliers/${supplierId}/parts/${partId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/**
 * Archives a catalog part while preserving historical order lines.
 */
export function archiveSupplierPart(
  supplierId: string,
  partId: string,
  input: ArchiveSupplierPartInput,
): Promise<SupplierPart> {
  return apiFetch<SupplierPart>(
    `/suppliers/${supplierId}/parts/${partId}/archive`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

/**
 * Restores an archived catalog part.
 */
export function restoreSupplierPart(
  supplierId: string,
  partId: string,
  input: RestoreSupplierPartInput,
): Promise<SupplierPart> {
  return apiFetch<SupplierPart>(
    `/suppliers/${supplierId}/parts/${partId}/restore`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}


/**
 * Registers a payment made to one supplier.
 */
export function createSupplierPayment(
  supplierId: string,
  input: CreateSupplierPaymentInput,
): Promise<SupplierPayment> {
  return apiFetch<SupplierPayment>(`/suppliers/${supplierId}/payments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Corrects an active supplier payment.
 */
export function updateSupplierPayment(
  supplierId: string,
  paymentId: string,
  input: UpdateSupplierPaymentInput,
): Promise<SupplierPayment> {
  return apiFetch<SupplierPayment>(
    `/suppliers/${supplierId}/payments/${paymentId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

/**
 * Voids a supplier payment without deleting the historical record.
 */
export function voidSupplierPayment(
  supplierId: string,
  paymentId: string,
  input: VoidSupplierPaymentInput,
): Promise<SupplierPayment> {
  return apiFetch<SupplierPayment>(
    `/suppliers/${supplierId}/payments/${paymentId}/void`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}
