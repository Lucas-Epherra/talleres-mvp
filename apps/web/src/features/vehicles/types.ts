import type { WorkOrderStatus } from "../../lib/format";

export const VEHICLE_ARCHIVE_STATUSES = ["active", "archived", "all"] as const;

export type VehicleArchiveStatus = (typeof VEHICLE_ARCHIVE_STATUSES)[number];

export type VehicleCustomer = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
};

export type VehicleListItem = {
  id: string;
  workshopId: string;
  customerId: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
  notes: string | null;
  archivedAt: string | null;
  archivedReason: string | null;
  archivedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  customer: VehicleCustomer;
  _count: {
    workOrders: number;
  };
};

export type PaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PaginatedResponse<TItem> = {
  data: TItem[];
  meta: PaginationMeta;
};

export type VehiclesQuery = {
  search?: string;
  page?: number;
  limit?: number;
  archiveStatus?: VehicleArchiveStatus;
};

export type CreateVehicleInput = {
  customerId: string;
  licensePlate: string;
  brand: string;
  model: string;
  year?: number;
  mileage?: number;
  notes?: string;
};

export type UpdateVehicleInput = {
  licensePlate?: string;
  brand?: string;
  model?: string;
  year?: number;
  mileage?: number;
  notes?: string | null;
};

export type ArchiveVehicleInput = {
  reason: string;
};

export type RestoreVehicleInput = {
  reason: string;
};

export type VehicleProfileCustomer = VehicleCustomer & {
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleProfileVehicle = {
  id: string;
  workshopId: string;
  customerId: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
  notes: string | null;
  archivedAt: string | null;
  archivedReason: string | null;
  archivedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleProfileWorkOrder = {
  id: string;
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

export type VehicleProfile = {
  vehicle: VehicleProfileVehicle;
  customer: VehicleProfileCustomer;
  activeWorkOrders: VehicleProfileWorkOrder[];
  history: VehicleProfileWorkOrder[];
  currentStatus: WorkOrderStatus | "NO_ACTIVE_WORK_ORDER";
  summary: {
    totalWorkOrders: number;
    activeWorkOrders: number;
    closedWorkOrders: number;
    deliveredWorkOrders: number;
    cancelledWorkOrders: number;
    latestWorkOrder: VehicleProfileWorkOrder | null;
    latestActiveWorkOrder: VehicleProfileWorkOrder | null;
    latestClosedWorkOrder: VehicleProfileWorkOrder | null;
  };
};
