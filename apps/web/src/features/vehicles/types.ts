import type { WorkOrderStatus } from "../../lib/format";

export type VehicleCustomer = {
  id: string;
  fullName: string;
  phone: string | null;
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
  createdAt: string;
  updatedAt: string;
  customer: VehicleCustomer;
  _count: {
    workOrders: number;
  };
};

export type UpdateVehicleInput = {
  licensePlate?: string;
  brand?: string;
  model?: string;
  year?: number | null;
  mileage?: number | null;
  notes?: string | null;
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
    deliveredWorkOrders: number;
    latestWorkOrder: VehicleProfileWorkOrder | null;
    latestActiveWorkOrder: VehicleProfileWorkOrder | null;
  };
};