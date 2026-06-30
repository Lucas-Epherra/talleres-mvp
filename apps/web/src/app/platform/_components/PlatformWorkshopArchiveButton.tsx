"use client";

import { Archive, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  archivePlatformWorkshop,
  restorePlatformWorkshop,
} from "@/features/platform/platform.client";
import type { PlatformWorkshop } from "@/features/platform/types";
import { getApiErrorMessage } from "@/lib/api";

type PlatformWorkshopArchiveButtonProps = {
  workshop: PlatformWorkshop;
};

/**
 * Archives suspended workshops or restores archived workshops safely.
 */
export function PlatformWorkshopArchiveButton({
  workshop,
}: PlatformWorkshopArchiveButtonProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canArchive = workshop.status === "DISABLED";
  const canRestore = workshop.status === "ARCHIVED";
  const isDisabled = isSubmitting || isRefreshing;

  if (!canArchive && !canRestore) {
    return null;
  }

  async function handleAction() {
    const actionLabel = canArchive ? "archivar" : "restaurar";

    const confirmed = window.confirm(
      `¿Querés ${actionLabel} el taller ${workshop.name}?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (canArchive) {
        await archivePlatformWorkshop(workshop.id);
      }

      if (canRestore) {
        await restorePlatformWorkshop(workshop.id);
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleAction}
        disabled={isDisabled}
        className={
          canArchive
            ? "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 text-sm font-bold text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            : "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-success/35 bg-success/10 px-4 text-sm font-bold text-success transition hover:border-success/60 hover:bg-success/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        }
      >
        {canArchive ? (
          <Archive className="size-4 shrink-0 text-primary" aria-hidden="true" />
        ) : (
          <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
        )}

        {isDisabled
          ? canArchive
            ? "Archivando..."
            : "Restaurando..."
          : canArchive
            ? "Archivar"
            : "Restaurar"}
      </button>

      {errorMessage ? (
        <p className="max-w-64 text-xs font-semibold leading-5 text-primary">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}