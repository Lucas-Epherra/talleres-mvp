"use client";

import { MailPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resendPlatformInvitation } from "@/features/platform/platform.client";
import { getApiErrorMessage } from "@/lib/api";

type ResendPlatformInvitationButtonProps = {
  invitationId: string;
  email: string;
};

type EmailDeliveryState = {
  sent: boolean;
  providerMessageId: string | null;
  reason: string | null;
};

/**
 * Resends an invitation with a fresh token from the internal platform panel.
 */
export function ResendPlatformInvitationButton({
  invitationId,
  email,
}: ResendPlatformInvitationButtonProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null,
  );

  const isDisabled = isSending || isRefreshing;

  async function handleResend() {
    const confirmed = window.confirm(
      `¿Reenviar la invitación a ${email}? El link anterior dejará de funcionar.`,
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    setMessageType(null);
    setIsSending(true);

    try {
      const response = await resendPlatformInvitation(invitationId);

      setMessage(getResendSuccessMessage(response.delivery));
      setMessageType(response.delivery?.sent ? "success" : "error");

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setMessage(getApiErrorMessage(error));
      setMessageType("error");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleResend}
        disabled={isDisabled}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <MailPlus className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {isDisabled ? "Reenviando..." : "Reenviar"}
      </button>

      {message ? (
        <p
          className={
            messageType === "success"
              ? "max-w-64 text-xs font-semibold leading-5 text-success"
              : "max-w-64 text-xs font-semibold leading-5 text-primary"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function getResendSuccessMessage(delivery?: EmailDeliveryState): string {
  if (delivery?.sent) {
    return "Invitación reenviada por email.";
  }

  if (delivery && !delivery.sent) {
    return "El nuevo acceso fue generado, pero el email no pudo enviarse.";
  }

  return "Invitación reenviada.";
}