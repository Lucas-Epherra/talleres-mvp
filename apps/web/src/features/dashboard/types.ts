export type WorkOrderStatus = "PENDING" | "IN_PROGRESS" | "READY" | "DELIVERED";

export type DashboardVehicleCustomer = {
  id: string;
  fullName: string;
  phone: string | null;
};

export type DashboardVehicle = {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
  customer: DashboardVehicleCustomer;
};

export type DashboardWorkOrder = {
  id: string;
  orderNumber: number;
  reportedIssue: string;
  status: WorkOrderStatus;
  entryMileage: number | null;
  estimatedTotal: number | string | null;
  finalTotal: number | string | null;
  entryDate: string;
  deliveryDate: string | null;
  createdAt: string;
  vehicle: DashboardVehicle;
};

export type DashboardSummary = {
  totals: {
    customers: number;
    vehicles: number;
    workOrders: number;
    vehiclesInWorkshop: number;
  };
  workOrders: {
    pending: number;
    inProgress: number;
    ready: number;
    delivered: number;
    active: number;
  };
  attentionWorkOrders: DashboardWorkOrder[];
  latestWorkOrders: DashboardWorkOrder[];
};