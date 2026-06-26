"use client";

import { Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { revokePlatformInvitation } from "@/features/platform/platform.client";
import { getApiErrorMessage } from "@/lib/api";

type RevokePlatformInvitationButtonProps = {
  invitationId: string;
  email: string;
};

/**
 * Revokes a pending platform invitation from the internal platform panel.
 */
export function RevokePlatformInvitationButton({
  invitationId,
  email,
}: RevokePlatformInvitationButtonProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isRevoking, setIsRevoking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDisabled = isRevoking || isRefreshing;

  async function handleRevoke() {
    const confirmed = window.confirm(
      `¿Revocar la invitación de ${email}? El link dejará de funcionar.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsRevoking(true);

    try {
      await revokePlatformInvitation(invitationId);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRevoke}
        disabled={isDisabled}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:border-primary/60 hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Ban className="size-4 shrink-0" aria-hidden="true" />
        {isDisabled ? "Revocando..." : "Revocar"}
      </button>

      {errorMessage ? (
        <p className="max-w-64 text-xs font-semibold leading-5 text-primary">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}