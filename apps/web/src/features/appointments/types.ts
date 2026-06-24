export const APPOINTMENT_STATUSES = [
  "SCHEDULED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type AppointmentCustomer = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  archivedAt: string | null;
};

export type AppointmentVehicle = {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
  archivedAt: string | null;
  customer: {
    id: string;
    fullName: string;
    phone: string;
    archivedAt: string | null;
  };
};

export type AppointmentWorkOrder = {
  id: string;
  orderNumber: number;
  status: string;
};

export type Appointment = {
  id: string;
  workshopId: string;
  customerId: string | null;
  vehicleId: string | null;
  workOrderId: string | null;
  title: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: AppointmentStatus;
  cancellationReason: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: AppointmentCustomer | null;
  vehicle: AppointmentVehicle | null;
  workOrder: AppointmentWorkOrder | null;
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

export type AppointmentsQuery = {
  search?: string;
  page?: number;
  limit?: number;
  status?: AppointmentStatus;
  from?: string;
  to?: string;
};

export type CreateAppointmentInput = {
  title: string;
  description?: string;
  scheduledStart: string;
  scheduledEnd: string;
  customerId?: string;
  vehicleId?: string;
  workOrderId?: string;
};

export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;

export type CancelAppointmentInput = {
  reason: string;
};

export const AGENDA_RANGES = [
  "today",
  "tomorrow",
  "week",
  "overdue",
  "all",
] as const;

export type AgendaRange = (typeof AGENDA_RANGES)[number];
