import {
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "../../../lib/format";

type WorkOrderStatusIndicatorProps = {
  status: WorkOrderStatus;
  withLabel?: boolean;
};

/**
 * Renders a non-interactive work order status indicator.
 *
 * It avoids pill borders, filled backgrounds and glow shadows so users do not
 * confuse the status with an actionable button.
 */
export function WorkOrderStatusIndicator({
  status,
  withLabel = true,
}: WorkOrderStatusIndicatorProps) {
  const classes = getStatusIndicatorClasses(status);

  return (
    <div
      className={`${classes.text} inline-flex w-fit shrink-0 items-center gap-2 text-[0.62rem] font-black uppercase tracking-[0.14em]`}
      aria-label={`Estado: ${formatWorkOrderStatus(status)}`}
    >
      <span
        aria-hidden="true"
        className={`${classes.dot} size-2 rounded-full`}
      />
      <span>
        {withLabel ? "Estado: " : ""}
        {formatWorkOrderStatus(status)}
      </span>
    </div>
  );
}

/**
 * Maps work order statuses to non-clickable status indicator classes.
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
