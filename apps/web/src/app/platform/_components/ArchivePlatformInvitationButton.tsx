"use client";

import { Archive } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { archivePlatformInvitation } from "@/features/platform/platform.client";
import { getApiErrorMessage } from "@/lib/api";

type ArchivePlatformInvitationButtonProps = {
  invitationId: string;
  email: string;
};

/**
 * Archives revoked or expired invitations from the internal platform panel.
 */
export function ArchivePlatformInvitationButton({
  invitationId,
  email,
}: ArchivePlatformInvitationButtonProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isArchiving, setIsArchiving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDisabled = isArchiving || isRefreshing;

  async function handleArchive() {
    const confirmed = window.confirm(
      `¿Archivar la invitación de ${email}? Dejará de aparecer en el panel.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsArchiving(true);

    try {
      await archivePlatformInvitation(invitationId);

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleArchive}
        disabled={isDisabled}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Archive className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {isDisabled ? "Archivando..." : "Archivar"}
      </button>

      {errorMessage ? (
        <p className="max-w-64 text-xs font-semibold leading-5 text-primary">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}