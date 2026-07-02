import { apiFetch } from "../../lib/api";
import type { IssueReceiptInput, Receipt, SendReceiptEmailInput } from "./types";

/**
 * Issues an internal receipt from a work order.
 *
 * If the backend already has a receipt for the order, it returns the existing one.
 */
export function issueReceiptFromWorkOrder(
  workOrderId: string,
  input: IssueReceiptInput = {},
): Promise<Receipt> {
  return apiFetch<Receipt>(`/receipts/work-orders/${workOrderId}`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Sends an issued receipt by email.
 */
export function sendReceiptByEmail(
  receiptId: string,
  input: SendReceiptEmailInput,
): Promise<Receipt> {
  return apiFetch<Receipt>(`/receipts/${receiptId}/send-email`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}