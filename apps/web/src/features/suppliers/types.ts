import type { WorkOrderStatus } from "../../lib/format";

export const SUPPLIER_ARCHIVE_STATUSES = ["active", "archived", "all"] as const;

export const SUPPLIER_PART_ACTIVE_STATUSES = ["active", "inactive", "all"] as const;

export const SUPPLIER_MARKUP_TYPES = [
  "NONE",
  "PERCENTAGE",
  "FIXED_AMOUNT",
  "MANUAL_PRICE",
] as const;

export type SupplierArchiveStatus = (typeof SUPPLIER_ARCHIVE_STATUSES)[number];

export type SupplierPartActiveStatus =
  (typeof SUPPLIER_PART_ACTIVE_STATUSES)[number];

export type SupplierMarkupType = (typeof SUPPLIER_MARKUP_TYPES)[number];

export type SupplierMetrics = {
  purchasedTotal: number | string;
  paidTotal: number | string;
  pendingBalance: number | string;
  chargedToCustomerTotal: number | string;
  grossProfitTotal: number | string;
};

export type SupplierCategory = {
  id: string;
  workshopId: string;
  name: string;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplierCount = {
  parts: number;
  payments: number;
  workOrderPartLines: number;
};

export type SupplierBase = {
  id: string;
  workshopId: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  address: string | null;
  notes: string | null;
  archivedAt: string | null;
  archivedReason: string | null;
  archivedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  categories: SupplierCategory[];
  metrics: SupplierMetrics;
  _count: SupplierCount;
};

export type SupplierListItem = SupplierBase;

export type SupplierPartPreview = {
  id: string;
  workshopId: string;
  supplierId: string;
  categoryId: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  currentCost: number | string;
  suggestedMarkupType: SupplierMarkupType | null;
  suggestedMarkupValue: number | string | null;
  suggestedCustomerPrice: number | string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  category: SupplierCategory | null;
};


export type SupplierPart = SupplierPartPreview;

export type CreateSupplierPartInput = {
  categoryId?: string;
  name: string;
  sku?: string;
  description?: string;
  currentCost: number;
  suggestedMarkupType?: SupplierMarkupType;
  suggestedMarkupValue?: number;
  suggestedCustomerPrice?: number;
  isActive?: boolean;
};

export type UpdateSupplierPartInput = {
  categoryId?: string | null;
  name?: string;
  sku?: string | null;
  description?: string | null;
  currentCost?: number | null;
  suggestedMarkupType?: SupplierMarkupType;
  suggestedMarkupValue?: number | null;
  suggestedCustomerPrice?: number | null;
  isActive?: boolean;
};

export type ArchiveSupplierPartInput = {
  reason: string;
};

export type RestoreSupplierPartInput = {
  reason: string;
};

export type SupplierPaymentPreview = {
  id: string;
  workshopId: string;
  supplierId: string;
  amount: number | string;
  paidAt: string;
  method: string;
  reference: string | null;
  notes: string | null;
  voidedAt: string | null;
  voidedReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser: SupplierEventUser | null;
  voidedByUser: SupplierEventUser | null;
};

export type SupplierWorkOrderLinePreview = {
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
  markupType: string;
  markupValue: number | string | null;
  supplierSubtotal: number | string;
  customerSubtotal: number | string;
  grossProfit: number | string;
  purchasedAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  supplierPart: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
  workOrder: {
    id: string;
    orderNumber: number;
    status: WorkOrderStatus;
    vehicle: {
      id: string;
      licensePlate: string;
      brand: string;
      model: string;
      customer: {
        id: string;
        fullName: string;
      };
    };
  };
};

export type SupplierEventUser = {
  id: string;
  name: string;
  email: string;
};

export type SupplierEvent = {
  id: string;
  workshopId: string;
  supplierId: string;
  userId: string | null;
  type: string;
  description: string | null;
  metadata: unknown;
  createdAt: string;
  user: SupplierEventUser | null;
};

export type Supplier = SupplierBase & {
  parts: SupplierPartPreview[];
  payments: SupplierPaymentPreview[];
  workOrderPartLines: SupplierWorkOrderLinePreview[];
  events: SupplierEvent[];
};

export type CreateSupplierInput = {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  address?: string;
  notes?: string;
  categoryNames?: string[];
};

export type UpdateSupplierInput = {
  name?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
  address?: string | null;
  notes?: string | null;
  categoryNames?: string[];
};

export type ArchiveSupplierInput = {
  reason: string;
};

export type RestoreSupplierInput = {
  reason: string;
};

export type SuppliersQuery = {
  search?: string;
  page?: number;
  limit?: number;
  archiveStatus?: SupplierArchiveStatus;
};

export type SupplierCategoriesQuery = {
  search?: string;
  page?: number;
  limit?: number;
  archiveStatus?: SupplierArchiveStatus;
};


export type SupplierPartsQuery = {
  search?: string;
  page?: number;
  limit?: number;
  categoryId?: string;
  archiveStatus?: SupplierArchiveStatus;
  activeStatus?: SupplierPartActiveStatus;
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
