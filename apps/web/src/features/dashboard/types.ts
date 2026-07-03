export type WorkOrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

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
  diagnosis: string | null;
  workDone: string | null;
  status: WorkOrderStatus;
  entryMileage: number | null;
  estimatedTotal: number | string | null;
  finalTotal: number | string | null;
  laborCost: number | string | null;
  partsCost: number | string | null;
  entryDate: string;
  deliveryDate: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: DashboardVehicle;
};

export type DashboardWorkflowItem = {
  status: WorkOrderStatus;
  label: string;
  count: number;
};

export type DashboardAppointmentCustomer = {
  id: string;
  fullName: string;
  phone: string | null;
};

export type DashboardAppointmentVehicle = {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
};

export type DashboardAppointmentWorkOrder = {
  id: string;
  orderNumber: number;
  status: WorkOrderStatus;
};

export type DashboardAppointment = {
  id: string;
  title: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: AppointmentStatus;
  customer: DashboardAppointmentCustomer | null;
  vehicle: DashboardAppointmentVehicle | null;
  workOrder: DashboardAppointmentWorkOrder | null;
};

export type DashboardReceiptCustomerSnapshot = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
};

export type DashboardReceiptVehicleSnapshot = {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number | null;
  mileage: number | null;
};

export type DashboardReceiptWorkSnapshot = {
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

export type DashboardReceipt = {
  id: string;
  receiptNumber: number;
  issuedAt: string;
  total: number | string;
  laborCost: number | string | null;
  partsCost: number | string | null;
  emailTo: string | null;
  emailedAt: string | null;
  customerSnapshot: DashboardReceiptCustomerSnapshot;
  vehicleSnapshot: DashboardReceiptVehicleSnapshot;
  workSnapshot: DashboardReceiptWorkSnapshot;
  workOrder: {
    id: string;
    orderNumber: number;
  };
  issuedByUser: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type DashboardAlert = {
  id: string;
  type:
    | "WORK_ORDER_READY"
    | "DELIVERED_WITHOUT_RECEIPT"
    | "STALE_IN_PROGRESS"
    | "PENDING_NEEDS_ATTENTION"
    | "OVERDUE_APPOINTMENT";
  severity: "success" | "warning" | "danger";
  title: string;
  description: string;
  href: string;
  createdAt: string;
};

export type DashboardWorkOrderEvent = {
  id: string;
  type:
    | "CREATED"
    | "UPDATED"
    | "STATUS_CHANGED"
    | "DELIVERED"
    | "REOPENED"
    | "CANCELLED";
  fromStatus: WorkOrderStatus | null;
  toStatus: WorkOrderStatus | null;
  description: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
  } | null;
  workOrder: {
    id: string;
    orderNumber: number;
    reportedIssue: string;
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

export type DashboardSummary = {
  generatedAt: string;
  today: {
    start: string;
    end: string;
  };
  month: {
    start: string;
    end: string;
  };
  totals: {
    customers: number;
    vehicles: number;
    workOrders: number;
    vehiclesInWorkshop: number;
  };
  summaryCards: {
    customers: number;
    vehicles: number;
    activeWorkOrders: number;
    monthlyInternalRevenue: string;
  };
  workOrders: {
    pending: number;
    inProgress: number;
    ready: number;
    delivered: number;
    cancelled: number;
    active: number;
    deliveredThisMonth: number;
    cancelledThisMonth: number;
  };
  workflow: DashboardWorkflowItem[];
  appointments: {
    todayCount: number;
    today: DashboardAppointment[];
    upcoming: DashboardAppointment[];
  };
  receipts: {
    thisMonthCount: number;
    thisMonthTotal: string;
    thisMonthLaborTotal: string;
    thisMonthPartsTotal: string;
    latest: DashboardReceipt[];
  };
  alerts: DashboardAlert[];
  alertCount: number;
  attentionWorkOrders: DashboardWorkOrder[];
  latestWorkOrders: DashboardWorkOrder[];
  recentWorkOrders: DashboardWorkOrder[];
  recentReceipts: DashboardReceipt[];
  recentActivity: {
    workOrderEvents: DashboardWorkOrderEvent[];
    workOrders: DashboardWorkOrder[];
    receipts: DashboardReceipt[];
    appointments: DashboardAppointment[];
  };
};
