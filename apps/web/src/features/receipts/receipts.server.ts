import { apiServerFetch } from "../../lib/api.server";
import type { Receipt, ReceiptsPage, ReceiptsQuery } from "./types";

/**
 * Fetches paginated receipts for the authenticated workshop.
 */
export function getReceipts(query: ReceiptsQuery = {}): Promise<ReceiptsPage> {
  const params = new URLSearchParams();

  if (query.workOrderId) {
    params.set("workOrderId", query.workOrderId);
  }

  if (query.search) {
    params.set("search", query.search);
  }

  if (query.emailStatus) {
    params.set("emailStatus", query.emailStatus);
  }

  if (query.issuedFrom) {
    params.set("issuedFrom", query.issuedFrom);
  }

  if (query.issuedTo) {
    params.set("issuedTo", query.issuedTo);
  }

  if (query.page) {
    params.set("page", query.page.toString());
  }

  if (query.limit) {
    params.set("limit", query.limit.toString());
  }

  const queryString = params.toString();
  const path = queryString ? `/receipts?${queryString}` : "/receipts";

  return apiServerFetch<ReceiptsPage>(path);
}

/**
 * Fetches one receipt by id for the authenticated workshop.
 */
export function getReceipt(receiptId: string): Promise<Receipt> {
  return apiServerFetch<Receipt>(`/receipts/${receiptId}`);
}
