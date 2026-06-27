"use client";

import { Ban, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  disablePlatformWorkshop,
  enablePlatformWorkshop,
} from "@/features/platform/platform.client";
import type { PlatformWorkshop } from "@/features/platform/types";
import { getApiErrorMessage } from "@/lib/api";

type PlatformWorkshopStatusButtonProps = {
  workshop: PlatformWorkshop;
};

/**
 * Suspends or reactivates a customer workshop from the internal platform panel.
 */
export function PlatformWorkshopStatusButton({
  workshop,
}: PlatformWorkshopStatusButtonProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isActive = workshop.status === "ACTIVE";
  const isDisabled = isSubmitting || isRefreshing;

  async function handleToggleStatus() {
    const actionLabel = isActive ? "suspender" : "reactivar";

    const confirmed = window.confirm(
      `¿Querés ${actionLabel} el taller ${workshop.name}?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (isActive) {
        await disablePlatformWorkshop(workshop.id);
      } else {
        await enablePlatformWorkshop(workshop.id);
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
        onClick={handleToggleStatus}
        disabled={isDisabled}
        className={
          isActive
            ? "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:border-primary/60 hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            : "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-success/35 bg-success/10 px-4 text-sm font-bold text-success transition hover:border-success/60 hover:bg-success/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        }
      >
        {isActive ? (
          <Ban className="size-4 shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        )}

        {isDisabled
          ? isActive
            ? "Suspendiendo..."
            : "Reactivando..."
          : isActive
            ? "Suspender"
            : "Reactivar"}
      </button>

      {errorMessage ? (
        <p className="max-w-64 text-xs font-semibold leading-5 text-primary">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}