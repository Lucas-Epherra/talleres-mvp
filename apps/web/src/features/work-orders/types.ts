import type { WorkOrderStatus } from "../../lib/format";

export type CreateWorkOrderInput = {
  vehicleId: string;
  reportedIssue: string;
  diagnosis?: string;
  workDone?: string;
  partsUsed?: string;
  entryMileage?: number;
  laborCost?: number;
  partsCost?: number;
  estimatedTotal?: number;
  finalTotal?: number;
  notes?: string;
};

export type WorkOrder = {
  id: string;
  workshopId: string;
  vehicleId: string;
  orderNumber: number;
  reportedIssue: string;
  diagnosis: string | null;
  workDone: string | null;
  partsUsed: string | null;
  entryMileage: number | null;
  laborCost: number | string | null;
  partsCost: number | string | null;
  estimatedTotal: number | string | null;
  finalTotal: number | string | null;
  status: WorkOrderStatus;
  entryDate: string;
  deliveryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};