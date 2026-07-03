import type { DashboardWorkOrder } from "../types";
import { DashboardWorkOrderPreviewCard } from "./DashboardWorkOrderPreviewCard";

type AttentionWorkOrdersPanelProps = {
  workOrders: DashboardWorkOrder[];
};

/**
 * Compatibility component for older dashboard imports.
 */
export function AttentionWorkOrdersPanel({
  workOrders,
}: AttentionWorkOrdersPanelProps) {
  if (workOrders.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {workOrders.slice(0, 3).map((workOrder) => (
        <DashboardWorkOrderPreviewCard key={workOrder.id} workOrder={workOrder} />
      ))}
    </div>
  );
}
