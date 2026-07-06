import type { WorkOrderStatus } from "../../lib/format";

export const CUSTOMER_ARCHIVE_STATUSES = ["active", "archived", "all"] as const;

export type CustomerArchiveStatus = (typeof CUSTOMER_ARCHIVE_STATUSES)[number];

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

export type CustomerReceiptRef = {
  id: string;
  receiptNumber: number;
  issuedAt: string;
  total: number | string;
  emailTo: string | null;
  emailedAt: string | null;
};

export type CustomerAppointmentVehicleRef = {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
};

export type CustomerAppointmentWorkOrderRef = {
  id: string;
  orderNumber: number;
  status: WorkOrderStatus;
};

export type CustomerAppointmentRef = {
  id: string;
  title: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: AppointmentStatus;
  vehicleId: string | null;
  workOrderId: string | null;
  vehicle?: CustomerAppointmentVehicleRef | null;
  workOrder?: CustomerAppointmentWorkOrderRef | null;
};

export type CustomerVehicleWorkOrder = {
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
  receipts: CustomerReceiptRef[];
};

export type CustomerVehicle = {
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
  workOrders: CustomerVehicleWorkOrder[];
  appointments: CustomerAppointmentRef[];
};

export type CustomerEvent = {
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

export type Customer = {
  id: string;
  workshopId: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  archivedAt: string | null;
  archivedReason: string | null;
  archivedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  vehicles?: CustomerVehicle[];
  appointments?: CustomerAppointmentRef[];
  events?: CustomerEvent[];
};

export type CustomerListItem = Customer & {
  _count: {
    vehicles: number;
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

export type CustomersQuery = {
  search?: string;
  page?: number;
  limit?: number;
  archiveStatus?: CustomerArchiveStatus;
};

export type CreateCustomerInput = {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
};

export type UpdateCustomerInput = {
  fullName?: string;
  phone?: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type ArchiveCustomerInput = {
  reason: string;
};

export type RestoreCustomerInput = {
  reason: string;
};
