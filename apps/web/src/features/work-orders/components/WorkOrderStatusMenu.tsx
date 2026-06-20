"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getApiErrorMessage } from "../../../lib/api";
import {
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "../../../lib/format";
import type { UpdateWorkOrderStatusInput, WorkOrder } from "../types";

type WorkOrderStatusMenuProps = {
  workOrderId: string;
  orderNumber: number;
  currentStatus: WorkOrder["status"];
};

type StatusAction = {
  nextStatus: WorkOrderStatus;
  label: string;
  description: string;
  confirmationMessage?: string;
};

/**
 * Interactive work order status indicator.
 *
 * The visible status keeps a compact indicator style. When opened, the menu
 * expands inside the card instead of floating over the next card or being
 * clipped near the footer.
 */
export function WorkOrderStatusMenu({
  workOrderId,
  orderNumber,
  currentStatus,
}: WorkOrderStatusMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const action = getNextStatusAction(currentStatus);
  const formattedCurrentStatus = formatWorkOrderStatus(currentStatus);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    /**
     * Closes the menu when the user clicks outside the component.
     */
    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    /**
     * Closes the menu with Escape for keyboard users.
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!action) {
    return (
      <StatusVisual
        status={currentStatus}
        label={`Estado: ${formattedCurrentStatus}`}
      />
    );
  }

  /**
   * Advances the work order to the next allowed workflow status.
   */
  async function handleStatusUpdate() {
    const selectedAction = action;

    if (!selectedAction || isSubmitting) {
      return;
    }

    if (
      selectedAction.confirmationMessage &&
      !window.confirm(selectedAction.confirmationMessage)
    ) {
      setIsOpen(false);
      return;
    }

    setErrorMessage(null);
    setIsOpen(false);
    setIsSubmitting(true);

    try {
      const body: UpdateWorkOrderStatusInput = {
        status: selectedAction.nextStatus,
      };

      await apiFetch<WorkOrder>(`/work-orders/${workOrderId}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      router.refresh();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div ref={menuRef} className="inline-flex w-full flex-col items-end">
      <div className="relative inline-flex">
        <StatusVisual
          status={currentStatus}
          label={
            isSubmitting
              ? "Estado: actualizando..."
              : `Estado: ${formattedCurrentStatus}`
          }
          isInteractive
          isOpen={isOpen}
        />

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          className="absolute inset-0 z-10 cursor-pointer rounded-md bg-transparent text-transparent outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Estado actual: ${formattedCurrentStatus}. Abrir acciones para la orden #${orderNumber}`}
        />
      </div>

      {isOpen ? (
        <div
          role="menu"
          className="mt-3 w-full max-w-64 overflow-hidden rounded-xl border border-border-strong bg-surface-elevated text-left shadow-(--shadow-industrial) ring-1 ring-white/3"
        >
          <div className="border-b border-border bg-surface-muted/70 px-4 py-3">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-primary">
              Estado actual
            </p>

            <p className="mt-1 text-sm font-bold text-foreground">
              {formattedCurrentStatus}
            </p>
          </div>

          <button
            type="button"
            role="menuitem"
            disabled={isSubmitting}
            onClick={handleStatusUpdate}
            className="group w-full px-4 py-3 text-left transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              className={
                action.nextStatus === "DELIVERED"
                  ? "block text-sm font-black text-primary"
                  : "block text-sm font-black text-foreground group-hover:text-primary"
              }
            >
              {action.label}
            </span>

            <span className="mt-1 block text-xs font-semibold leading-5 text-muted-foreground">
              {action.description}
            </span>
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <p
          className="mt-2 max-w-xs rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-left text-xs font-semibold leading-5 text-foreground"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

type StatusVisualProps = {
  status: WorkOrderStatus;
  label: string;
  isInteractive?: boolean;
  isOpen?: boolean;
};

/**
 * Renders the status indicator visual style.
 *
 * When interactive, it adds a very small dropdown chevron without changing the
 * apparent text size or weight of the status label.
 */
function StatusVisual({
  status,
  label,
  isInteractive = false,
  isOpen = false,
}: StatusVisualProps) {
  const classes = getStatusIndicatorClasses(status);

  return (
    <div
      className={`${classes.text} inline-flex w-fit shrink-0 items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.16em]`}
      aria-label={label}
    >
      <span
        aria-hidden="true"
        className={`${classes.dot} size-2 rounded-full shadow-[0_0_14px_currentColor]`}
      />

      <span>{label}</span>

      {isInteractive ? (
        <span
          aria-hidden="true"
          className={`ml-0.5 inline-flex items-center text-[0.5rem] leading-none opacity-65 transition ${
            isOpen ? "rotate-180 opacity-90" : ""
          }`}
        >
          ▾
        </span>
      ) : null}
    </div>
  );
}

/**
 * Returns the next logical workflow transition for a work order.
 */
function getNextStatusAction(status: WorkOrderStatus): StatusAction | null {
  const actionMap: Partial<Record<WorkOrderStatus, StatusAction>> = {
    PENDING: {
      nextStatus: "IN_PROGRESS",
      label: "Iniciar trabajo",
      description: "Pasa la orden a En progreso.",
    },
    IN_PROGRESS: {
      nextStatus: "READY",
      label: "Marcar lista",
      description: "Indica que el trabajo ya está terminado.",
    },
    READY: {
      nextStatus: "DELIVERED",
      label: "Marcar entregada",
      description: "Cierra la orden y registra la entrega.",
      confirmationMessage:
        "Vas a marcar esta orden como entregada. Esta acción cierra la orden. ¿Querés continuar?",
    },
  };

  return actionMap[status] ?? null;
}

/**
 * Maps work order statuses to indicator classes.
 */
function getStatusIndicatorClasses(status: WorkOrderStatus): {
  text: string;
  dot: string;
} {
  const statusClassMap: Record<
    WorkOrderStatus,
    {
      text: string;
      dot: string;
    }
  > = {
    PENDING: {
      text: "text-muted-foreground",
      dot: "bg-steel text-steel",
    },
    IN_PROGRESS: {
      text: "text-primary",
      dot: "bg-primary text-primary",
    },
    READY: {
      text: "text-warning",
      dot: "bg-warning text-warning",
    },
    DELIVERED: {
      text: "text-success",
      dot: "bg-success text-success",
    },
  };

  return statusClassMap[status];
}
