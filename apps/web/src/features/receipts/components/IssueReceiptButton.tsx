"use client";

import { ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import { issueReceiptFromWorkOrder } from "../receipts.client";

type IssueReceiptButtonProps = {
  workOrderId: string;
  disabled?: boolean;
};

/**
 * Issues a receipt from a work order and navigates to the generated receipt view.
 */
export function IssueReceiptButton({
  workOrderId,
  disabled = false,
}: IssueReceiptButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleIssueReceipt() {
    if (isSubmitting || disabled) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const receipt = await issueReceiptFromWorkOrder(workOrderId);

      router.push(`/receipts/${receipt.id}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleIssueReceipt}
        disabled={isSubmitting || disabled}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <ReceiptText className="size-4 shrink-0" aria-hidden="true" />
        {isSubmitting ? "Emitiendo..." : "Emitir recibo"}
      </button>

      {errorMessage ? (
        <p
          role="alert"
          className="max-w-xs rounded-xl border border-primary/35 bg-primary/10 px-3 py-2 text-xs font-semibold leading-5 text-foreground"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}