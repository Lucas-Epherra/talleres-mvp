export type Customer = {
  id: string;
  workshopId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateCustomerInput = {
  fullName: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
};

export type UpdateCustomerInput = {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};