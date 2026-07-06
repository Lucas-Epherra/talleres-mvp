import type { WorkOrderStatus } from "../../lib/format";

export type ReceiptCustomerSnapshot = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
};

export type ReceiptVehicleSnapshot = {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
};

export type ReceiptWorkSnapshot = {
  statusLabel?: string;
  id: string;
  orderNumber: number;
  reportedIssue: string;
  diagnosis: string | null;
  workDone: string | null;
  partsUsed: string | null;
  entryMileage: number | null;
  status: WorkOrderStatus;
  entryDate: string;
  deliveryDate: string | null;
};

export type ReceiptWorkshop = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  businessHours: string | null;
  description: string | null;
};

export type ReceiptWorkOrderRef = {
  id: string;
  orderNumber: number;
};

export type ReceiptIssuedByUser = {
  id: string;
  name: string;
  email: string;
};

export type Receipt = {
  id: string;
  workshopId: string;
  workOrderId: string;
  receiptNumber: number;
  issuedByUserId: string | null;
  issuedAt: string;
  customerSnapshot: ReceiptCustomerSnapshot;
  vehicleSnapshot: ReceiptVehicleSnapshot;
  workSnapshot: ReceiptWorkSnapshot;
  laborCost: number | string | null;
  partsCost: number | string | null;
  total: number | string;
  notes: string | null;
  emailTo: string | null;
  emailedAt: string | null;
  createdAt: string;
  updatedAt: string;
  workshop: ReceiptWorkshop;
  workOrder: ReceiptWorkOrderRef;
  issuedByUser: ReceiptIssuedByUser | null;
};

export type ReceiptsPaginationMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ReceiptsPage = {
  data: Receipt[];
  meta: ReceiptsPaginationMeta;
};

export type IssueReceiptInput = {
  notes?: string;
};

export type SendReceiptEmailInput = {
  to: string;
  message?: string;
};

export type ReceiptEmailStatus = "sent" | "not_sent";

export type ReceiptsQuery = {
  workOrderId?: string;
  search?: string;
  emailStatus?: ReceiptEmailStatus;
  issuedFrom?: string;
  issuedTo?: string;
  page?: number;
  limit?: number;
};
