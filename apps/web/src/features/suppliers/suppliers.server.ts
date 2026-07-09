import { apiServerFetch } from "../../lib/api.server";
import type {
  PaginatedResponse,
  Supplier,
  SupplierCategoriesQuery,
  SupplierCategory,
  SupplierPart,
  SupplierPartsQuery,
  SupplierListItem,
  SuppliersQuery,
} from "./types";

/**
 * Fetches paginated suppliers for the authenticated workshop.
 */
export function getPaginatedSuppliers(
  query: SuppliersQuery = {},
): Promise<PaginatedResponse<SupplierListItem>> {
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
  const path = queryString ? `/suppliers?${queryString}` : "/suppliers";

  return apiServerFetch<PaginatedResponse<SupplierListItem>>(path);
}

/**
 * Fetches one supplier profile by id.
 */
export function getSupplier(supplierId: string): Promise<Supplier> {
  return apiServerFetch<Supplier>(`/suppliers/${supplierId}`);
}

/**
 * Fetches supplier categories for category selectors and future catalog flows.
 */
export function getSupplierCategories(
  query: SupplierCategoriesQuery = {},
): Promise<PaginatedResponse<SupplierCategory>> {
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
  const path = queryString
    ? `/suppliers/categories?${queryString}`
    : "/suppliers/categories";

  return apiServerFetch<PaginatedResponse<SupplierCategory>>(path);
}

/**
 * Fetches paginated catalog parts for one supplier.
 */
export function getSupplierParts(
  supplierId: string,
  query: SupplierPartsQuery = {},
): Promise<PaginatedResponse<SupplierPart>> {
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

  if (query.categoryId) {
    params.set("categoryId", query.categoryId);
  }

  if (query.archiveStatus && query.archiveStatus !== "active") {
    params.set("archiveStatus", query.archiveStatus);
  }

  if (query.activeStatus && query.activeStatus !== "active") {
    params.set("activeStatus", query.activeStatus);
  }

  const queryString = params.toString();
  const path = queryString
    ? `/suppliers/${supplierId}/parts?${queryString}`
    : `/suppliers/${supplierId}/parts`;

  return apiServerFetch<PaginatedResponse<SupplierPart>>(path);
}
