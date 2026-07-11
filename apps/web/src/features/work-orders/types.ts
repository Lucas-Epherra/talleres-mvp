import type { WorkOrderStatus } from "../../lib/format";

export const SUPPLIER_MARKUP_TYPES = [
  "NONE",
  "PERCENTAGE",
  "FIXED_AMOUNT",
  "MANUAL_PRICE",
] as const;

export type SupplierMarkupType = (typeof SUPPLIER_MARKUP_TYPES)[number];

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
  partLines?: WorkOrderPartLineInput[];
};

export type UpdateWorkOrderInput = {
  reportedIssue?: string;
  diagnosis?: string | null;
  workDone?: string | null;
  partsUsed?: string | null;
  entryMileage?: number | null;
  laborCost?: number | null;
  partsCost?: number | null;
  estimatedTotal?: number | null;
  finalTotal?: number | null;
  notes?: string | null;
  partLines?: WorkOrderPartLineInput[];
};

export type WorkOrderPartLineInput = {
  supplierId?: string;
  supplierPartId?: string;
  partName?: string;
  quantity?: number;
  supplierUnitCost?: number;
  customerUnitPrice?: number;
  markupType?: SupplierMarkupType;
  markupValue?: number;
  purchasedAt?: string;
  notes?: string;
};

export type UpdateWorkOrderStatusInput = {
  status: WorkOrderStatus;
};

export type ReopenWorkOrderInput = {
  reason: string;
};

export type CancelWorkOrderInput = {
  reason: string;
};

export type WorkOrderCustomer = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
};

export type WorkOrderVehicle = {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
  customer: WorkOrderCustomer;
};

export type WorkOrderSupplierCatalogPart = {
  id: string;
  supplierId: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  currentCost: number | string;
  suggestedMarkupType: SupplierMarkupType | null;
  suggestedMarkupValue: number | string | null;
  suggestedCustomerPrice: number | string | null;
  isActive: boolean;
  archivedAt: string | null;
  category: {
    id: string;
    name: string;
  } | null;
};

export type WorkOrderSupplierCatalogItem = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  archivedAt: string | null;
  parts: WorkOrderSupplierCatalogPart[];
};

export type WorkOrderPartLine = {
  id: string;
  workshopId: string;
  workOrderId: string;
  supplierId: string | null;
  supplierPartId: string | null;
  partNameSnapshot: string;
  supplierNameSnapshot: string | null;
  quantity: number | string;
  supplierUnitCost: number | string;
  customerUnitPrice: number | string;
  markupType: SupplierMarkupType;
  markupValue: number | string | null;
  supplierSubtotal: number | string;
  customerSubtotal: number | string;
  grossProfit: number | string;
  purchasedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: {
    id: string;
    name: string;
  } | null;
  supplierPart: {
    id: string;
    name: string;
    sku: string | null;
    category: {
      id: string;
      name: string;
    } | null;
  } | null;
};

export type WorkOrderEventType =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "DELIVERED"
  | "REOPENED"
  | "CANCELLED";

export type WorkOrderEventUser = {
  id: string;
  name: string;
  email: string;
};

export type WorkOrderEvent = {
  id: string;
  workshopId: string;
  workOrderId: string;
  userId: string | null;
  type: WorkOrderEventType;
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus | null;
  description: string | null;
  createdAt: string;
  user: WorkOrderEventUser | null;
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
  vehicle: WorkOrderVehicle;
  partLines?: WorkOrderPartLine[];
  events?: WorkOrderEvent[];
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

export type WorkOrdersQuery = {
  search?: string;
  status?: WorkOrderStatus;
  page?: number;
  limit?: number;
};
