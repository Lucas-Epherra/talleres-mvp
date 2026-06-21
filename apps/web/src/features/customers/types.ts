export type Customer = {
  id: string;
  workshopId: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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
