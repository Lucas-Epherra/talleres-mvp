import { apiServerFetch } from "../../lib/api.server";
import type { Receipt, ReceiptsQuery } from "./types";

/**
 * Fetches receipts for the authenticated workshop.
 */
export function getReceipts(query: ReceiptsQuery = {}): Promise<Receipt[]> {
  const params = new URLSearchParams();

  if (query.workOrderId) {
    params.set("workOrderId", query.workOrderId);
  }

  const queryString = params.toString();
  const path = queryString ? `/receipts?${queryString}` : "/receipts";

  return apiServerFetch<Receipt[]>(path);
}

/**
 * Fetches one receipt by id for the authenticated workshop.
 */
export function getReceipt(receiptId: string): Promise<Receipt> {
  return apiServerFetch<Receipt>(`/receipts/${receiptId}`);
}