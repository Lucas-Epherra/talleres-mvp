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

export type VehicleProfileReceipt = {
  id: string;
  receiptNumber: number;
  issuedAt: string;
  total: number | string;
  emailTo: string | null;
  emailedAt: string | null;
};

export type VehicleProfileReceiptWithContext = VehicleProfileReceipt & {
  workOrderId: string;
  orderNumber: number;
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
  receipts?: VehicleProfileReceipt[];
};

export type VehicleAppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type VehicleProfileAppointment = {
  id: string;
  title: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: VehicleAppointmentStatus;
  workOrderId: string | null;
};

export type VehicleProfileEvent = {
  id: string;
  type: "ARCHIVED" | "RESTORED";
  description: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type VehicleProfile = {
  vehicle: VehicleProfileVehicle;
  customer: VehicleProfileCustomer;
  activeWorkOrders: VehicleProfileWorkOrder[];
  history: VehicleProfileWorkOrder[];
  appointments?: VehicleProfileAppointment[];
  nextAppointment?: VehicleProfileAppointment | null;
  recentReceipts?: VehicleProfileReceiptWithContext[];
  events?: VehicleProfileEvent[];
  currentStatus: WorkOrderStatus | "NO_ACTIVE_WORK_ORDER";
  summary: {
    totalWorkOrders: number;
    activeWorkOrders: number;
    closedWorkOrders: number;
    deliveredWorkOrders: number;
    cancelledWorkOrders: number;
    totalReceipts?: number;
    latestWorkOrder: VehicleProfileWorkOrder | null;
    latestActiveWorkOrder: VehicleProfileWorkOrder | null;
    latestClosedWorkOrder: VehicleProfileWorkOrder | null;
  };
};
