"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ListChecks,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getApiErrorMessage } from "../../../lib/api";
import {
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "../../../lib/format";
import { updateWorkOrderStatus } from "../work-orders.client";
import type { WorkOrder } from "../types";

type WorkOrderStatusMenuProps = {
  workOrderId: string;
  orderNumber: number;
  currentStatus: WorkOrder["status"];
};

type StatusAction = {
  nextStatus: WorkOrderStatus;
  label: string;
  description: string;
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
  const [isDeliveryConfirmationVisible, setIsDeliveryConfirmationVisible] =
    useState(false);
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
        closeMenu();
      }
    }

    /**
     * Closes the menu with Escape for keyboard users.
     */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
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
   * Closes the status menu and resets transient confirmation state.
   */
  function closeMenu() {
    setIsOpen(false);
    setIsDeliveryConfirmationVisible(false);
  }

  /**
   * Toggles the inline menu and clears pending confirmation when closing.
   */
  function handleMenuToggle() {
    if (isOpen) {
      closeMenu();
      return;
    }

    setErrorMessage(null);
    setIsOpen(true);
  }

  /**
   * Starts the next status transition or asks for delivery confirmation first.
   */
  function handleStatusUpdate() {
    const selectedAction = action;

    if (!selectedAction || isSubmitting) {
      return;
    }

    if (selectedAction.nextStatus === "DELIVERED") {
      setErrorMessage(null);
      setIsDeliveryConfirmationVisible(true);
      return;
    }

    void submitStatusUpdate(selectedAction);
  }

  /**
   * Confirms the critical delivery transition.
   */
  function handleConfirmDelivery() {
    const selectedAction = action;

    if (!selectedAction || isSubmitting) {
      return;
    }

    void submitStatusUpdate(selectedAction);
  }

  /**
   * Cancels the critical delivery transition without mutating the order.
   */
  function handleCancelDelivery() {
    closeMenu();
  }

  /**
   * Persists the selected status transition and refreshes server data.
   */
  async function submitStatusUpdate(selectedAction: StatusAction) {
    setErrorMessage(null);
    closeMenu();
    setIsSubmitting(true);

    try {
      await updateWorkOrderStatus(workOrderId, {
        status: selectedAction.nextStatus,
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
          onClick={handleMenuToggle}
          className="absolute inset-0 z-10 cursor-pointer rounded-md bg-transparent text-transparent outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={`Estado actual: ${formattedCurrentStatus}. Abrir acciones para la orden #${orderNumber}`}
        />
      </div>

      {isOpen ? (
        <div className="mt-3 w-full max-w-80 overflow-hidden rounded-xl border border-border-strong bg-surface-elevated text-left shadow-(--shadow-industrial) ring-1 ring-white/3">
          <div className="border-b border-border bg-surface-muted/70 px-4 py-3">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-primary">
              Estado actual
            </p>

            <p className="mt-1 text-sm font-bold text-foreground">
              {formattedCurrentStatus}
            </p>
          </div>

          {!isDeliveryConfirmationVisible ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleStatusUpdate}
              className="group flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-border-strong bg-surface-muted text-primary transition group-hover:border-primary/50">
                <ListChecks className="size-4" aria-hidden="true" />
              </span>

              <span className="min-w-0">
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
              </span>
            </button>
          ) : (
            <div className="border-t border-primary/25 bg-primary/10 px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-primary/35 bg-surface text-primary">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                </span>

                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground">
                    Confirmar entrega
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">
                    Vas a marcar la orden #{orderNumber} como entregada. Esta
                    acción cerrará la orden y bloqueará la edición directa.
                  </p>

                  <p className="mt-2 text-xs font-semibold leading-5 text-muted-foreground">
                    Si fue un error, luego deberás reabrirla dejando un motivo
                    en el historial operativo.
                  </p>

                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmDelivery}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      Sí, marcar entregada
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleCancelDelivery}
                      className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border-strong bg-surface-muted px-4 text-xs font-black text-foreground transition hover:border-primary/60 hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
        className={`${classes.dot} size-2 rounded-full`}
      />

      <span>{label}</span>

      {isInteractive ? (
        <ChevronDown
          aria-hidden="true"
          className={`ml-0.5 size-3 shrink-0 opacity-65 transition ${
            isOpen ? "rotate-180 opacity-90" : ""
          }`}
        />
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
      description: "Pide confirmación antes de cerrar la orden.",
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
    CANCELLED: {
      text: "text-muted-foreground",
      dot: "bg-muted-foreground text-muted-foreground",
    },
  };

  return statusClassMap[status];
}
